"""
Provides volunteer ViewSets.
"""

from django.db.models import Sum
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import VolunteerProfile, VolunteerAvailability, DeliveryRequest
from .serializers import (
    VolunteerProfileSerializer, VolunteerProfileListSerializer,
    VolunteerAvailabilitySerializer, DeliveryRequestSerializer
)
from shareeat.utils.routing import DeliveryPlanner
from shareeat.apps.notifications.utils import send_notification


class VolunteerProfileViewSet(viewsets.ModelViewSet):
    """
    Manages volunteer profiles
    """
    queryset = VolunteerProfile.objects.all()
    serializer_class = VolunteerProfileSerializer

    def get_serializer_class(self):
        """Returns serializer class"""
        if self.action == 'list':
            return VolunteerProfileListSerializer
        return VolunteerProfileSerializer

    def get_queryset(self):
        """Filters volunteers based on availability, verification, and vehicle type"""
        queryset = super().get_queryset()

        # Filters by availability
        is_available = self.request.query_params.get('available', None)
        if is_available is not None:
            queryset = queryset.filter(is_available=is_available.lower() == 'true')

        # Filters by verification status
        is_verified = self.request.query_params.get('verified', None)
        if is_verified is not None:
            queryset = queryset.filter(is_verified=is_verified.lower() == 'true')

        # Filters by vehicle
        has_vehicle = self.request.query_params.get('has_vehicle', None)
        if has_vehicle is not None:
            queryset = queryset.filter(has_vehicle=has_vehicle.lower() == 'true')

        return queryset.order_by('-rating', '-total_deliveries')

    @action(detail=True, methods=['get'])
    def deliveries(self, request, pk=None):
        """Retrieves assigned deliveries for the volunteer"""
        volunteer = self.get_object()
        from shareeat.apps.inventory.serializers import DonationListSerializer

        deliveries = volunteer.deliveries.all()
        serializer = DonationListSerializer(deliveries, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def toggle_availability(self, request, pk=None):
        """Toggles availability status of the volunteer"""
        volunteer = self.get_object()
        volunteer.is_available = not volunteer.is_available
        volunteer.save()

        serializer = self.get_serializer(volunteer)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """Retrieves volunteer performance statistics"""
        volunteer = self.get_object()
        
        deliveries = volunteer.deliveries.filter(status='completed')

        stats = {
            'total_deliveries': volunteer.total_deliveries,
            'average_rating': float(volunteer.rating),
            'completed_deliveries': deliveries.count(),
            'total_meals_delivered': deliveries.aggregate(Sum('estimated_meals'))['estimated_meals__sum'] or 0,
            'total_weight_delivered': float(deliveries.aggregate(Sum('total_weight'))['total_weight__sum'] or 0),
        }

        return Response(stats)


class VolunteerAvailabilityViewSet(viewsets.ModelViewSet):
    """
    Manages volunteer time slots
    """
    queryset = VolunteerAvailability.objects.all()
    serializer_class = VolunteerAvailabilitySerializer

    def get_queryset(self):
        """Filters availability based on volunteer, date range, and booking status"""
        queryset = super().get_queryset()

        volunteer_id = self.request.query_params.get('volunteer', None)
        if volunteer_id:
            queryset = queryset.filter(volunteer_id=volunteer_id)

        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)

        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)

        unbooked_only = self.request.query_params.get('unbooked', None)
        if unbooked_only and unbooked_only.lower() == 'true':
            queryset = queryset.filter(is_booked=False)

        return queryset.order_by('date', 'start_time')


class DeliveryRequestViewSet(viewsets.ModelViewSet):
    """
    Manages delivery requests
    """
    queryset = DeliveryRequest.objects.all()
    serializer_class = DeliveryRequestSerializer

    def get_queryset(self):
        """Filters requests for the current volunteer"""
        queryset = super().get_queryset()
        if hasattr(self.request.user, 'volunteer_profile'):
            queryset = queryset.filter(volunteer=self.request.user.volunteer_profile)
        return queryset.order_by('-created_at')

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """
        Accepts a delivery request
        
        Validates request status
        Assigns volunteer to donation
        Updates request status to 'accepted'
        Expires other pending requests
        Notifies donor
        """
        delivery_request = self.get_object()

        if delivery_request.status != 'pending':
            return Response(
                {'error': 'This request is no longer pending'},
                status=status.HTTP_400_BAD_REQUEST
            )

        donation = delivery_request.donation
        if donation.volunteer:
            return Response(
                {'error': 'This donation is already assigned to another volunteer'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Assigns volunteer
        donation.volunteer = delivery_request.volunteer
        donation.save()

        # Updates request
        delivery_request.status = 'accepted'
        delivery_request.save()

        # Expires competitors
        DeliveryRequest.objects.filter(
            donation=donation,
            status='pending'
        ).exclude(id=delivery_request.id).update(status='expired')

        # Notifies Donor
        send_notification(
            user=donation.donor.user,
            title="Volunteer Assigned",
            message=f"{delivery_request.volunteer.user.get_full_name()} has accepted to deliver your donation.",
            type='success',
            related_link=f"/donations/{donation.id}"
        )

        return Response({'status': 'accepted'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Rejects delivery request."""
        delivery_request = self.get_object()

        if delivery_request.status != 'pending':
            return Response(
                {'error': 'This request is no longer pending'},
                status=status.HTTP_400_BAD_REQUEST
            )

        delivery_request.status = 'rejected'
        delivery_request.save()

        # Re-matching Logic
        donation = delivery_request.donation
        planner = DeliveryPlanner()

        # Excludes previously contacted volunteers
        contacted_volunteer_ids = DeliveryRequest.objects.filter(
            donation=donation
        ).values_list('volunteer_id', flat=True)

        volunteers = VolunteerProfile.objects.filter(
            is_available=True,
            is_verified=True
        ).exclude(id__in=contacted_volunteer_ids)

        volunteer_match = planner.find_optimal_volunteer(
            donation.donor,
            donation.recipient,
            volunteers
        )

        volunteer = volunteer_match[0] if volunteer_match else None

        if volunteer:
            # Creates new request for next volunteer
            DeliveryRequest.objects.create(
                donation=donation,
                volunteer=volunteer,
                status='pending'
            )
            send_notification(
                user=volunteer.user,
                title="New Delivery Request",
                message=f"You have a new delivery request from {donation.donor.business_name}",
                type='info',
                related_link=f"/volunteer/requests"
            )
        else:
            # Escalates (No backup found)
            donation.status = 'pending_manual_assignment'
            donation.save()

            from django.contrib.auth.models import User
            from django.core.mail import send_mail

            admins = User.objects.filter(is_superuser=True)
            for admin in admins:
                send_notification(
                    user=admin,
                    title="Action Required: Volunteer Rejected & No Backup",
                    message=f"All matched volunteers rejected/unavailable for Donation #{donation.id}. Please assign manually.",
                    type='warning',
                    related_link=f"/admin/inventory/donation/{donation.id}/change/"
                )

            try:
                send_mail(
                    subject=f"Urgent: Volunteer Rejection - No Backup for Donation #{donation.id}",
                    message=f"Donation #{donation.id} from {donation.donor.business_name} has been rejected by the assigned volunteer and no backup volunteers are available. Please log in to the admin panel to assign manually.",
                    from_email='noreply@shareeat.com',
                    recipient_list=['shafiullahshafin00@gmail.com'],
                    fail_silently=True,
                )
            except Exception as e:
                print(f"Failed to send admin email: {e}")

        return Response({'status': 'rejected'})
