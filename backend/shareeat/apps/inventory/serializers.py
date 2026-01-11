"""
Serializers for inventory app.
"""
from rest_framework import serializers
from .models import FoodCategory, FoodItem, Donation, DonationItem, ImpactMetrics
from shareeat.apps.recipients.serializers import RecipientProfileListSerializer
from shareeat.apps.donors.serializers import DonorProfileListSerializer


class FoodCategorySerializer(serializers.ModelSerializer):
    """Serializes food category data, including configuration for shelf life and refrigeration."""
    
    class Meta:
        model = FoodCategory
        fields = ['id', 'name', 'description', 'icon', 'requires_refrigeration', 
                  'average_shelf_life_hours']


class FoodItemSerializer(serializers.ModelSerializer):
    """
    Serializes food item details, including donor information, urgency levels, and expiry status.
    """
    donor_name = serializers.CharField(source='donor.business_name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    condition_display = serializers.CharField(source='get_condition_display', read_only=True)
    urgency_display = serializers.CharField(source='get_urgency_level_display', read_only=True)
    hours_until_expiry = serializers.FloatField(read_only=True)
    freshness_score = serializers.FloatField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = FoodItem
        fields = [
            'id', 'donor', 'donor_name', 'category', 'category_name',
            'name', 'description', 'quantity', 'unit', 'condition', 'condition_display',
            'expiry_date', 'pickup_before', 'is_available', 
            'urgency_level', 'urgency_display', 'hours_until_expiry',
            'freshness_score', 'is_expired', 'created_at', 'updated_at'
        ]
        read_only_fields = ['urgency_level', 'created_at', 'updated_at']
        extra_kwargs = {
            'donor': {'required': False}
        }
    
    def validate_quantity(self, value):
        """Validates that the provided quantity is a positive value."""
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than 0")
        return value
    
    def validate(self, data):
        """Ensures the expiry date occurs after the scheduled pickup time."""
        if 'expiry_date' in data and 'pickup_before' in data:
            if data['expiry_date'] <= data['pickup_before']:
                raise serializers.ValidationError(
                    "Expiry date must be after pickup time"
                )
        return data


class FoodItemListSerializer(serializers.ModelSerializer):
    """Provides a lightweight serialization of food items for list views."""
    donor_name = serializers.CharField(source='donor.business_name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    condition_display = serializers.CharField(source='get_condition_display', read_only=True)
    urgency_display = serializers.CharField(source='get_urgency_level_display', read_only=True)
    
    class Meta:
        model = FoodItem
        fields = ['id', 'donor', 'name', 'donor_name', 'category_name', 'quantity', 'unit', 'condition', 
                  'condition_display', 'urgency_level', 'urgency_display', 'expiry_date', 'is_available']


class DonationItemSerializer(serializers.ModelSerializer):
    """Serializes donation item details, including nested food item information."""
    food_item_name = serializers.CharField(source='food_item.name', read_only=True)
    food_item_details = FoodItemListSerializer(source='food_item', read_only=True)
    
    class Meta:
        model = DonationItem
        fields = ['id', 'food_item', 'food_item_name', 'food_item_details', 'quantity']
    
    def validate(self, data):
        """Ensures the requested donation quantity does not exceed available stock."""
        food_item = data.get('food_item')
        quantity = data.get('quantity')
        
        if food_item and quantity:
            if quantity > food_item.quantity:
                raise serializers.ValidationError(
                    f"Donation quantity ({quantity}) cannot exceed available quantity ({food_item.quantity})"
                )
        return data


class ImpactMetricsSerializer(serializers.ModelSerializer):
    """Serializes impact metrics, tracking waste prevention and social impact statistics."""
    
    class Meta:
        model = ImpactMetrics
        fields = [
            'id', 'donation', 'food_waste_prevented_kg', 'co2_emissions_saved_kg',
            'meals_provided', 'people_fed', 'tax_deduction_amount', 'calculated_at'
        ]
        read_only_fields = ['calculated_at']


class DonationSerializer(serializers.ModelSerializer):
    """
    Serializes full donation details, including nested donor, recipient, and volunteer profiles.
    """
    donor_name = serializers.CharField(source='donor.business_name', read_only=True)
    donor_details = DonorProfileListSerializer(source='donor', read_only=True)
    recipient_name = serializers.CharField(source='recipient.organization_name', read_only=True)
    recipient_details = RecipientProfileListSerializer(source='recipient', read_only=True)
    volunteer_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    items = DonationItemSerializer(many=True, read_only=True)
    impact = ImpactMetricsSerializer(read_only=True)
    delivery_time_minutes = serializers.FloatField(read_only=True)
    
    class Meta:
        model = Donation
        fields = [
            'id', 'donor', 'donor_name', 'donor_details', 'recipient', 'recipient_name', 'recipient_details',
            'volunteer', 'volunteer_name', 'status', 'status_display',
            'scheduled_pickup_time', 'actual_pickup_time',
            'scheduled_delivery_time', 'actual_delivery_time',
            'total_weight', 'estimated_meals', 'notes',
            'rating', 'feedback', 'items', 'impact', 'delivery_time_minutes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_volunteer_name(self, obj):
        """Retrieves the full name of the assigned volunteer."""
        if obj.volunteer:
            return obj.volunteer.user.get_full_name() or obj.volunteer.user.username
        return None


class DonationListSerializer(serializers.ModelSerializer):
    """Provides a lightweight serialization of donations for list views, including status summaries."""
    donor_name = serializers.CharField(source='donor.business_name', read_only=True)
    donor_details = DonorProfileListSerializer(source='donor', read_only=True)
    recipient_name = serializers.CharField(source='recipient.organization_name', read_only=True)
    recipient_details = RecipientProfileListSerializer(source='recipient', read_only=True)
    volunteer_name = serializers.SerializerMethodField()
    volunteer_phone = serializers.SerializerMethodField()
    volunteer_status = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    item_summary = serializers.SerializerMethodField()
    
    class Meta:
        model = Donation
        fields = [
            'id', 'donor_name', 'donor_details', 'recipient_name', 'recipient_details', 
            'volunteer_name', 'volunteer_phone', 'volunteer_status', 'status', 'status_display',
            'scheduled_pickup_time', 'total_weight', 'estimated_meals', 'created_at',
            'item_summary'
        ]

    def get_volunteer_name(self, obj):
        """Retrieves the full name of the assigned volunteer."""
        if obj.volunteer:
            return obj.volunteer.user.get_full_name() or obj.volunteer.user.username
        
        # Check for pending request
        pending_request = obj.delivery_requests.filter(status='pending').first()
        if pending_request:
            return pending_request.volunteer.user.get_full_name() or pending_request.volunteer.user.username
            
        return "Not Assigned"

    def get_volunteer_phone(self, obj):
        """Retrieves the phone number of the assigned volunteer or the pending volunteer."""
        if obj.volunteer:
            return obj.volunteer.phone
        
        # Check for pending request
        pending_request = obj.delivery_requests.filter(status='pending').first()
        if pending_request:
            return pending_request.volunteer.phone
            
        return None

    def get_volunteer_status(self, obj):
        """Determines the current status of the volunteer assignment based on donation progress."""
        if obj.volunteer:
             # Donation has an assigned volunteer. Status depends on donation progress.
             if obj.status == 'confirmed': return 'Assigned'
             if obj.status == 'picked_up': return 'Picked Up'
             if obj.status == 'in_transit': return 'On the Way'
             if obj.status == 'delivered': return 'Delivered'
             if obj.status == 'completed': return 'Completed'
             return 'Assigned'
        
        # Check pending requests
        pending_request = obj.delivery_requests.filter(status='pending').first()
        if pending_request:
            return "Pending Acceptance"
            
        return "Pending Assignment"

    def get_item_summary(self, obj):
        """Gets summary of items"""
        count = obj.items.count()
        if count == 0:
            return "No items"
        first_item = obj.items.first()
        if not first_item:
             return "No items"
        if count == 1:
            return f"{first_item.food_item.name}"
        return f"{first_item.food_item.name} + {count - 1} more"


class DonationCreateSerializer(serializers.ModelSerializer):
    """Handles the deserialization and validation required for creating new donations."""
    items = DonationItemSerializer(many=True)
    
    class Meta:
        model = Donation
        fields = [
            'donor', 'recipient', 'volunteer', 'scheduled_pickup_time',
            'scheduled_delivery_time', 'notes', 'items'
        ]
    
    def create(self, validated_data):
        """
        Create donation with items
        Demonstrates transaction handling and complex object creation
        """
        items_data = validated_data.pop('items')
        donation = Donation.objects.create(**validated_data)
        
        # Create donation items
        for item_data in items_data:
            DonationItem.objects.create(donation=donation, **item_data)
            # Mark food item as unavailable
            if item_data.get('food_item'):
                item_data['food_item'].is_available = False
                item_data['food_item'].save()
        
        # Calculate totals
        donation.calculate_total_weight()
        donation.calculate_estimated_meals()
        
        return donation