"""
Serializers for volunteers app.
"""
from rest_framework import serializers
from .models import VolunteerProfile, VolunteerAvailability


class VolunteerAvailabilitySerializer(serializers.ModelSerializer):
    """Serializer for volunteer availability slots."""
    
    class Meta:
        model = VolunteerAvailability
        fields = ['id', 'date', 'start_time', 'end_time', 'is_booked']


class VolunteerProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for volunteer profiles.
    """
    full_name = serializers.SerializerMethodField()
    vehicle_type_display = serializers.CharField(source='get_vehicle_type_display', read_only=True)
    availability_slots = VolunteerAvailabilitySerializer(many=True, read_only=True)
    
    class Meta:
        model = VolunteerProfile
        fields = [
            'id', 'user', 'full_name', 'phone', 'address',
            'has_vehicle', 'vehicle_type', 'vehicle_type_display', 'vehicle_capacity',
            'is_available', 'rating', 'total_deliveries', 'is_verified',
            'availability_slots', 'created_at', 'updated_at'
        ]
        read_only_fields = ['rating', 'total_deliveries', 'created_at', 'updated_at']
    
    def get_full_name(self, obj):
        """Gets volunteer's full name."""
        return obj.user.get_full_name() or obj.user.username


class VolunteerProfileListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing volunteers"""
    full_name = serializers.SerializerMethodField()
    vehicle_type_display = serializers.CharField(source='get_vehicle_type_display', read_only=True)
    
    class Meta:
        model = VolunteerProfile
        fields = ['id', 'full_name', 'has_vehicle', 'vehicle_type', 
                  'vehicle_type_display', 'is_available', 'rating', 'total_deliveries']
    
    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username


class DeliveryRequestSerializer(serializers.ModelSerializer):
    """Serializer for delivery requests."""
    from shareeat.apps.inventory.serializers import DonationListSerializer
    
    donation = DonationListSerializer(read_only=True)
    volunteer_name = serializers.CharField(source='volunteer.user.get_full_name', read_only=True)
    
    class Meta:
        from .models import DeliveryRequest
        model = DeliveryRequest
        fields = ['id', 'donation', 'volunteer', 'volunteer_name', 'status', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']