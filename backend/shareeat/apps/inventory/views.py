"""
Defines ViewSets for managing inventory, donations, and food categories.
"""

from datetime import timedelta
from decimal import Decimal, InvalidOperation

from django.db.models import Q, Sum, Count, Case, When, Value, IntegerField
from django.utils import timezone
from django.contrib.auth.models import User
from django.core.mail import send_mail

from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import FoodCategory, FoodItem, Donation, DonationItem, ImpactMetrics
from .serializers import (
    FoodCategorySerializer, FoodItemSerializer, FoodItemListSerializer,
    DonationSerializer, DonationListSerializer, DonationCreateSerializer,
    ImpactMetricsSerializer
)

from shareeat.utils.algorithms import (
    FoodMatchingAlgorithm, FoodPrioritizationEngine, DonationOptimizer
)
from shareeat.utils.routing import DeliveryPlanner
from shareeat.apps.volunteers.models import DeliveryRequest, VolunteerProfile
from shareeat.apps.notifications.utils import send_notification


class FoodCategoryViewSet(viewsets.ModelViewSet):
    """
    Handles CRUD operations for food categories, supporting custom ordering.
    """
    queryset = FoodCategory.objects.all()
    serializer_class = FoodCategorySerializer

    def get_queryset(self):
        """Returns the queryset annotated with custom ordering logic."""
        return FoodCategory.objects.annotate(
            custom_order=Case(
                When(name='Others', then=Value(1)),
                default=Value(0),
                output_field=IntegerField(),
            )
        ).order_by('custom_order', 'name')


class FoodItemViewSet(viewsets.ModelViewSet):
    """
    Manages food item inventory, providing filtering by availability, donor, category, urgency, and expiry.
    """
    queryset = FoodItem.objects.all()
    serializer_class = FoodItemSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        """Determines the appropriate serializer class based on the current action."""
        if self.action == 'list':
            return FoodItemListSerializer
        return FoodItemSerializer

    def get_queryset(self):
        """Filters the queryset based on availability, donor, category, urgency, and expiry criteria."""
        queryset = super().get_queryset()

        # Filters by availability
        is_available = self.request.query_params.get('available', None)
        if is_available is not None:
            queryset = queryset.filter(is_available=is_available.lower() == 'true')

        # Excludes items involved in pending donations
        queryset = queryset.exclude(donation_items__donation__status='pending')

        # Filters by donor
        donor_id = self.request.query_params.get('donor', None)
        if donor_id:
            queryset = queryset.filter(donor_id=donor_id)

        # Filters by category
        category_id = self.request.query_params.get('category', None)
        if category_id:
            queryset = queryset.filter(category_id=category_id)

        # Filters by urgency
        urgency = self.request.query_params.get('urgency', None)
        if urgency:
            queryset = queryset.filter(urgency_level=urgency)

        # Filters items expiring soon
        expiring_hours = self.request.query_params.get('expiring_within_hours', None)
        if expiring_hours:
            try:
                hours = int(expiring_hours)
                cutoff = timezone.now() + timedelta(hours=hours)
                queryset = queryset.filter(
                    expiry_date__lte=cutoff,
                    expiry_date__gt=timezone.now()
                )
            except ValueError:
                pass

        return queryset.order_by('urgency_level', 'expiry_date')

    def perform_create(self, serializer):
        """Links the new food item to the creator's donor profile if applicable."""
        if hasattr(self.request.user, 'donor_profile'):
            serializer.save(donor=self.request.user.donor_profile)
        else:
            # Fallback for admin users
            serializer.save()

    @action(detail=True, methods=['post'])
    def request_item(self, request, pk=None):
        """Processes a request for a specific food item, validating eligibility and availability."""
        food_item = self.get_object()

        # Checks authorization
        if not hasattr(request.user, 'recipient_profile'):
            return Response(
                {'error': 'Only recipients can request food items'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Checks availability
        if not food_item.is_available:
            return Response(
                {'error': 'This item is no longer available'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if timezone.now() >= food_item.expiry_date:
            return Response(
                {'error': 'This item has expired'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Checks global lock
        if DonationItem.objects.filter(
            food_item=food_item,
            donation__status='pending'
        ).exists():
            return Response(
                {'error': 'This item is currently pending approval for another request'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Checks for duplicate requests
        if DonationItem.objects.filter(
            donation__recipient=request.user.recipient_profile,
            food_item=food_item,
            donation__status__in=['pending', 'confirmed', 'in_transit']
        ).exists():
            return Response(
                {'error': 'You have already requested this item'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validates quantity
        requested_quantity = request.data.get('quantity')
        if requested_quantity:
            try:
                requested_quantity = Decimal(str(requested_quantity))
                if requested_quantity <= 0:
                    raise ValueError("Quantity must be positive")
                if requested_quantity > food_item.quantity:
                    return Response(
                        {'error': f'Requested quantity exceeds available amount ({food_item.quantity})'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except (ValueError, InvalidOperation):
                return Response(
                    {'error': 'Invalid quantity'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            requested_quantity = food_item.quantity

        try:
            # Creates Donation and DonationItem transactionally
            donation = Donation.objects.create(
                donor=food_item.donor,
                recipient=request.user.recipient_profile,
                status='pending',
                scheduled_pickup_time=food_item.pickup_before,
                scheduled_delivery_time=food_item.pickup_before + timedelta(hours=2),
                notes=f"Requested by {request.user.recipient_profile.organization_name}"
            )

            DonationItem.objects.create(
                donation=donation,
                food_item=food_item,
                quantity=requested_quantity
            )

            # Updates Inventory
            food_item.quantity -= requested_quantity
            if food_item.quantity <= 0:
                food_item.quantity = 0
                food_item.is_available = False
            food_item.save()

            # Updates donation totals
            donation.calculate_total_weight()
            donation.calculate_estimated_meals()

            return Response({
                'message': 'Request submitted successfully',
                'donation_id': donation.id,
                'status': 'pending',
                'remaining_quantity': food_item.quantity
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def urgent(self, request):
        """Fetches a list of high-priority food items that are critical or expiring soon."""
        items = FoodItem.objects.filter(
            is_available=True,
            urgency_level__in=['critical', 'high']
        ).order_by('expiry_date')

        serializer = FoodItemListSerializer(items, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def prioritized(self, request):
        """Returns a list of food items sorted by priority using the prioritization engine."""
        items = FoodItem.objects.filter(is_available=True)
        prioritized_items = FoodPrioritizationEngine.get_prioritized_items(items, limit=20)

        serializer = FoodItemListSerializer(prioritized_items, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def matches(self, request, pk=None):
        """Computes compatibility scores between the food item and potential recipients."""
        food_item = self.get_object()
        matches = FoodMatchingAlgorithm.find_best_matches(food_item)

        from shareeat.apps.recipients.serializers import RecipientProfileListSerializer

        results = []
        for recipient, score in matches:
            recipient_data = RecipientProfileListSerializer(recipient).data
            recipient_data['match_score'] = round(score, 2)
            results.append(recipient_data)

        return Response(results)

    @action(detail=True, methods=['post'])
    def mark_unavailable(self, request, pk=None):
        """Manually updates a food item's status to unavailable."""
        food_item = self.get_object()
        food_item.is_available = False
        food_item.save()

        serializer = self.get_serializer(food_item)
        return Response(serializer.data)


class DonationViewSet(viewsets.ModelViewSet):
    """
    Handles the lifecycle of donations, including creation, status updates, and filtering.
    """
    queryset = Donation.objects.all()
    serializer_class = DonationSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = [
        'id', 
        'status', 
        'items__food_item__name', 
        'donor__business_name', 
        'recipient__organization_name', 
        'volunteer__user__first_name', 
        'volunteer__user__last_name'
    ]

    def get_serializer_class(self):
        """Determines the appropriate serializer class based on the current action."""
        if self.action == 'list':
            return DonationListSerializer
        elif self.action == 'create':
            return DonationCreateSerializer
        return DonationSerializer

    def get_queryset(self):
        """Retrieves and filters donations based on user roles, status, and optional date ranges."""
        # Auto-cancels maintenance task
        try:
            expired_donations = Donation.objects.filter(
                status='pending_manual_assignment',
                scheduled_pickup_time__lt=timezone.now()
            )
            for donation in expired_donations:
                donation.cancel_donation()
        except Exception as e:
            # Logs error internally
            print(f"Error auto-cancelling expired donations: {e}")

        queryset = super().get_queryset()

        # Applies filters
        filters = {
            'status': self.request.query_params.get('status'),
            'donor_id': self.request.query_params.get('donor'),
            'recipient_id': self.request.query_params.get('recipient'),
            'volunteer_id': self.request.query_params.get('volunteer'),
        }

        for key, value in filters.items():
            if value:
                queryset = queryset.filter(**{key: value})

        # Date range filtering
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)

        return queryset.order_by('-created_at')

    @action(detail=True, methods=['post'])
    def claim(self, request, pk=None):
        """Assigns the current volunteer to a donation if it is unclaimed."""
        donation = self.get_object()

        if not hasattr(request.user, 'volunteer_profile'):
            return Response(
                {'error': 'Only volunteers can claim deliveries'},
                status=status.HTTP_403_FORBIDDEN
            )

        if donation.volunteer:
            return Response(
                {'error': 'This donation is already claimed by a volunteer'},
                status=status.HTTP_400_BAD_REQUEST
            )

        donation.volunteer = request.user.volunteer_profile
        if donation.status == 'pending':
            donation.status = 'confirmed'
        donation.save()

        serializer = self.get_serializer(donation)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Validates the donation and triggers the volunteer matching process."""
        donation = self.get_object()

        if donation.status != 'pending':
            return Response(
                {'error': 'Only pending donations can be confirmed'},
                status=status.HTTP_400_BAD_REQUEST
            )

        donation.status = 'confirmed'
        donation.save()

        # Marks items as unavailable to prevent double-booking
        for item in donation.items.all():
            food_item = item.food_item
            food_item.is_available = False
            food_item.save(update_fields=['is_available'])

        # Volunteer Matching Logic
        planner = DeliveryPlanner()

        # Excludes volunteers already contacted
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
            # Automatic Assignment Flow
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
            # Fallback Manual Assignment Flow
            donation.status = 'pending_manual_assignment'
            donation.save()

            # Notifies Admins
            admins = User.objects.filter(is_superuser=True)
            for admin in admins:
                send_notification(
                    user=admin,
                    title="Action Required: No Volunteer Available",
                    message=f"No volunteer found for Donation #{donation.id}. Please assign manually.",
                    type='warning',
                    related_link=f"/admin/inventory/donation/{donation.id}/change/"
                )

            # Emails specific admin
            try:
                send_mail(
                    subject=f"Urgent: No Volunteer Available for Donation #{donation.id}",
                    message=f"Donation #{donation.id} from {donation.donor.business_name} confirmed but no volunteers available. Please assign manually via Admin Panel.",
                    from_email='noreply@shareeat.com',
                    recipient_list=['shafiullahshafin00@gmail.com'],
                    fail_silently=True,
                )
            except Exception as e:
                print(f"Failed to send admin email: {e}")

        # Notifies Recipient
        send_notification(
            user=donation.recipient.user,
            title="Donation Confirmed",
            message=f"Your request has been confirmed by {donation.donor.business_name}",
            type='success',
            related_link=f"/donations/{donation.id}"
        )

        serializer = self.get_serializer(donation)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def pickup(self, request, pk=None):
        """Updates the donation status to 'picked_up' upon volunteer confirmation."""
        donation = self.get_object()

        # Authorization: Must be assigned volunteer
        if not hasattr(request.user, 'volunteer_profile') or donation.volunteer != request.user.volunteer_profile:
            return Response(
                {'error': 'Only the assigned volunteer can mark pickup'},
                status=status.HTTP_403_FORBIDDEN
            )

        if donation.status != 'confirmed':
             return Response(
                {'error': 'Donation must be confirmed before pickup'},
                status=status.HTTP_400_BAD_REQUEST
            )

        donation.status = 'picked_up'
        donation.save()
        
        # Notifies Recipient
        try:
            send_notification(
                user=donation.recipient.user,
                title="Donation on the Way",
                message=f"Your donation from {donation.donor.business_name} has been picked up.",
                type='info',
                related_link=f"/donations/{donation.id}"
            )
        except Exception as e:
            print(f"Failed to send notification: {e}")

        serializer = self.get_serializer(donation)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def confirm_receipt(self, request, pk=None):
        """Finalizes the donation process by confirming receipt and updating the status to 'completed'."""
        donation = self.get_object()

        # Authorization
        if not hasattr(request.user, 'recipient_profile') or donation.recipient != request.user.recipient_profile:
            return Response(
                {'error': 'Only the assigned recipient can confirm receipt'},
                status=status.HTTP_403_FORBIDDEN
            )

        if donation.status not in ['picked_up', 'in_transit']:
            return Response(
                {'error': 'Donation must be picked up before confirming receipt'},
                status=status.HTTP_400_BAD_REQUEST
            )

        donation.status = 'completed'
        donation.actual_delivery_time = timezone.now()

        # Handles Rating & Feedback
        rating = request.data.get('rating')
        feedback = request.data.get('feedback')
        if rating:
            donation.rating = rating
            donation.feedback = feedback

            # Update Volunteer Rating (Moving Average)
            if donation.volunteer:
                volunteer = donation.volunteer
                current_rating = float(volunteer.rating)
                total_deliveries = volunteer.total_deliveries
                
                new_rating = ((current_rating * total_deliveries) + float(rating)) / (total_deliveries + 1)
                
                volunteer.rating = new_rating
                volunteer.total_deliveries += 1
                volunteer.save()

        donation.save()

        # Update associated DeliveryRequest for history tracking
        from shareeat.apps.volunteers.models import DeliveryRequest
        DeliveryRequest.objects.filter(donation=donation).update(status='completed')

        serializer = self.get_serializer(donation)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def resolve_exception(self, request, pk=None):
        """Allows administrators to manually resolve donations stuck in an exception state."""
        donation = self.get_object()
        resolution = request.data.get('resolution')  # 'completed', 'cancelled'

        if donation.status != 'pending_manual_assignment':
            return Response(
                {'error': 'Only donations pending manual assignment can be resolved here'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if resolution not in ['completed', 'cancelled']:
            return Response(
                {'error': 'Invalid resolution. Must be "completed" or "cancelled"'},
                status=status.HTTP_400_BAD_REQUEST
            )

        donation.status = resolution
        if resolution == 'completed':
            donation.actual_delivery_time = timezone.now()
        
        donation.save()
        
        return Response(self.get_serializer(donation).data)


class ImpactMetricsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for viewing impact metrics of completed donations
    """
    queryset = ImpactMetrics.objects.all()
    serializer_class = ImpactMetricsSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        """
        Allows filtering metrics by donor or date range.
        """
        queryset = super().get_queryset()
        
        donor_id = self.request.query_params.get('donor', None)
        if donor_id:
            queryset = queryset.filter(donation__donor_id=donor_id)
            
        return queryset.order_by('-donation__actual_delivery_time')
