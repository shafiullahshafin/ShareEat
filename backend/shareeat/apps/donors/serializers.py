"""
Serializers for donors app.
"""
from rest_framework import serializers
from .models import DonorProfile, DonorSchedule


class DonorScheduleSerializer(serializers.ModelSerializer):
    """Serializer for donor schedules"""
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)
    
    class Meta:
        model = DonorSchedule
        fields = ['id', 'day_of_week', 'day_name', 'opening_time', 'closing_time', 'is_active']


class DonorProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for donor profiles.
    """
    username = serializers.CharField(source='user.username', read_only=True)
    donor_type_display = serializers.CharField(source='get_donor_type_display', read_only=True)
    schedules = DonorScheduleSerializer(many=True, read_only=True)
    
    class Meta:
        model = DonorProfile
        fields = [
            'id', 'user', 'username', 'business_name', 'donor_type', 
            'donor_type_display', 'phone', 'address', 'latitude', 'longitude',
            'location',  # ← ADDED: Auto-geocoded location
            'license_number', 'is_verified', 'rating', 'total_donations',
            'schedules', 'created_at', 'updated_at'
        ]
        read_only_fields = ['location', 'rating', 'total_donations', 'created_at', 'updated_at']


class DonorProfileListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing donors"""
    donor_type_display = serializers.CharField(source='get_donor_type_display', read_only=True)
    contact_person = serializers.SerializerMethodField()
    
    class Meta:
        model = DonorProfile
        fields = [
            'id', 
            'business_name', 
            'contact_person',
            'donor_type', 
            'donor_type_display', 
            'address',
            'location',     
            'latitude',
            'longitude',
            'is_verified', 
            'rating', 
            'total_donations'
        ]
        read_only_fields = ['location']

    def get_contact_person(self, obj):
        return obj.user.get_full_name() or obj.user.username  