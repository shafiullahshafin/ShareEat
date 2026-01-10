"""
Recipient Views Module.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models

from .models import RecipientProfile, RecipientNeed
from .serializers import RecipientProfileSerializer, RecipientProfileListSerializer, RecipientNeedSerializer


class RecipientProfileViewSet(viewsets.ModelViewSet):
    """
    Manages recipient profiles.
    """
    queryset = RecipientProfile.objects.all()
    serializer_class = RecipientProfileSerializer

    def get_serializer_class(self):
        """Returns list serializer."""
        if self.action == 'list':
            return RecipientProfileListSerializer
        return RecipientProfileSerializer

    def get_queryset(self):
        """Filters recipients."""
        queryset = super().get_queryset()

        # Filters by recipient type
        recipient_type = self.request.query_params.get('type', None)
        if recipient_type:
            queryset = queryset.filter(recipient_type=recipient_type)

        # Filters by verification status
        is_verified = self.request.query_params.get('verified', None)
        if is_verified is not None:
            queryset = queryset.filter(is_verified=is_verified.lower() == 'true')

        # Filters by available capacity
        has_capacity = self.request.query_params.get('has_capacity', None)
        if has_capacity and has_capacity.lower() == 'true':
            queryset = queryset.filter(current_occupancy__lt=models.F('capacity'))

        return queryset.order_by('-created_at')

    @action(detail=True, methods=['get'])
    def donations(self, request, pk=None):
        """Retrieves received donations."""
        recipient = self.get_object()
        from shareeat.apps.inventory.serializers import DonationListSerializer

        donations = recipient.received_donations.all()
        serializer = DonationListSerializer(donations, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def needs(self, request, pk=None):
        """Retrieves active needs."""
        recipient = self.get_object()
        needs = recipient.needs.filter(is_active=True)
        serializer = RecipientNeedSerializer(needs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def update_occupancy(self, request, pk=None):
        """Updates occupancy count."""
        recipient = self.get_object()
        new_occupancy = request.data.get('occupancy')

        if new_occupancy is None:
            return Response(
                {'error': 'occupancy field is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            new_occupancy = int(new_occupancy)
            if new_occupancy < 0 or new_occupancy > recipient.capacity:
                return Response(
                    {'error': f'Occupancy must be between 0 and {recipient.capacity}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            recipient.current_occupancy = new_occupancy
            recipient.save()

            serializer = self.get_serializer(recipient)
            return Response(serializer.data)
        except ValueError:
            return Response(
                {'error': 'Invalid occupancy value'},
                status=status.HTTP_400_BAD_REQUEST
            )


class RecipientNeedViewSet(viewsets.ModelViewSet):
    """
    Manages recipient needs
    """
    queryset = RecipientNeed.objects.all()
    serializer_class = RecipientNeedSerializer

    def get_queryset(self):
        """Filters needs based on recipient and active status"""
        queryset = super().get_queryset()

        recipient_id = self.request.query_params.get('recipient', None)
        if recipient_id:
            queryset = queryset.filter(recipient_id=recipient_id)

        is_active = self.request.query_params.get('active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        return queryset.order_by('-priority', '-created_at')
