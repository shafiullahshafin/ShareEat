"""
Donor Views Module.
"""

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import DonorProfile, DonorSchedule
from .serializers import DonorProfileSerializer, DonorProfileListSerializer, DonorScheduleSerializer


class DonorProfileViewSet(viewsets.ModelViewSet):
    """
    Manages donor profiles.
    """
    queryset = DonorProfile.objects.all()
    serializer_class = DonorProfileSerializer

    def get_serializer_class(self):
        """Returns list serializer."""
        if self.action == 'list':
            return DonorProfileListSerializer
        return DonorProfileSerializer

    def get_queryset(self):
        """Filters donors."""
        queryset = super().get_queryset()

        # Filters by donor type
        donor_type = self.request.query_params.get('type', None)
        if donor_type:
            queryset = queryset.filter(donor_type=donor_type)

        # Filters by verification status
        is_verified = self.request.query_params.get('verified', None)
        if is_verified is not None:
            queryset = queryset.filter(is_verified=is_verified.lower() == 'true')

        return queryset.order_by('-created_at')

    @action(detail=True, methods=['get'])
    def food_items(self, request, pk=None):
        """Retrieves available food items for the donor"""
        donor = self.get_object()
        from shareeat.apps.inventory.models import FoodItem
        from shareeat.apps.inventory.serializers import FoodItemListSerializer

        items = FoodItem.objects.filter(donor=donor, is_available=True)
        serializer = FoodItemListSerializer(items, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def donations(self, request, pk=None):
        """Retrieves donation history for the donor"""
        donor = self.get_object()
        from shareeat.apps.inventory.serializers import DonationListSerializer

        donations = donor.donations.all()
        serializer = DonationListSerializer(donations, many=True)
        return Response(serializer.data)


class DonorScheduleViewSet(viewsets.ModelViewSet):
    """
    Manages donor schedules.
    """
    queryset = DonorSchedule.objects.all()
    serializer_class = DonorScheduleSerializer

    def get_queryset(self):
        """Filters schedules."""
        queryset = super().get_queryset()
        donor_id = self.request.query_params.get('donor', None)
        if donor_id:
            queryset = queryset.filter(donor_id=donor_id)
        return queryset.order_by('day_of_week')
