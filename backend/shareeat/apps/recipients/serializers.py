"""
Serializers for recipients app.
"""
from rest_framework import serializers
from .models import RecipientProfile, RecipientNeed


class RecipientNeedSerializer(serializers.ModelSerializer):
    """Serializer for recipient needs."""
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    
    class Meta:
        model = RecipientNeed
        fields = ['id', 'food_category', 'quantity_needed', 'priority', 
                  'priority_display', 'description', 'is_active', 'created_at']


class RecipientProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for recipient profiles.
    """
    username = serializers.CharField(source='user.username', read_only=True)
    recipient_type_display = serializers.CharField(source='get_recipient_type_display', read_only=True)
    available_capacity = serializers.IntegerField(read_only=True)
    occupancy_percentage = serializers.FloatField(read_only=True)
    needs = RecipientNeedSerializer(many=True, read_only=True)
    
    class Meta:
        model = RecipientProfile
        fields = [
            'id', 'user', 'username', 'recipient_type', 'recipient_type_display',
            'organization_name', 'phone', 'address', 'latitude', 'longitude',
            'location',
            'capacity', 'current_occupancy', 'available_capacity', 
            'occupancy_percentage', 'is_verified', 'description', 'needs',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'location', 'created_at', 'updated_at']


class RecipientProfileListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing recipients."""
    recipient_type_display = serializers.CharField(source='get_recipient_type_display', read_only=True)
    available_capacity = serializers.IntegerField(read_only=True)
    occupancy_percentage = serializers.FloatField(read_only=True)
    contact_person = serializers.SerializerMethodField()
    
    class Meta:
        model = RecipientProfile
        fields = [
            'id', 
            'organization_name', 
            'contact_person',
            'recipient_type', 
            'recipient_type_display',
            'address',
            'location',     
            'latitude',
            'longitude',
            'capacity',
            'current_occupancy',
            'available_capacity',
            'occupancy_percentage',
            'is_verified'
        ]
        read_only_fields = ['location']

    def get_contact_person(self, obj):
        return obj.user.get_full_name() or obj.user.username