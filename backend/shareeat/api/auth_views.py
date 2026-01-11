from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from rest_framework import serializers
from django.db import transaction
from shareeat.apps.donors.models import DonorProfile
from shareeat.apps.recipients.models import RecipientProfile
from shareeat.apps.volunteers.models import VolunteerProfile

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=['donor', 'recipient', 'volunteer'], write_only=True)
    
    # Profile fields
    # Donor
    business_name = serializers.CharField(required=False, write_only=True)
    donor_type = serializers.CharField(required=False, write_only=True)
    license_number = serializers.CharField(required=False, write_only=True)
    
    # Recipient
    recipient_type = serializers.CharField(required=False, write_only=True)
    organization_name = serializers.CharField(required=False, write_only=True)
    capacity = serializers.IntegerField(required=False, write_only=True)
    current_occupancy = serializers.IntegerField(required=False, write_only=True)
    
    # Volunteer
    vehicle_type = serializers.CharField(required=False, write_only=True)
    
    # Common
    phone = serializers.CharField(required=True, write_only=True)
    address = serializers.CharField(required=True, write_only=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'email', 'first_name', 'last_name', 'role', 
                  'business_name', 'donor_type', 'license_number',
                  'recipient_type', 'organization_name', 'capacity', 'current_occupancy',
                  'vehicle_type', 'phone', 'address')

    def create(self, validated_data):
        role = validated_data.pop('role')
        
        # Extracts profile data
        profile_data = {
            'phone': validated_data.pop('phone'),
            'address': validated_data.pop('address')
        }
        
        # Extracts specific fields
        business_name = validated_data.pop('business_name', '')
        donor_type = validated_data.pop('donor_type', 'other')
        license_number = validated_data.pop('license_number', '')
        
        recipient_type = validated_data.pop('recipient_type', 'individual')
        organization_name = validated_data.pop('organization_name', '')
        capacity = validated_data.pop('capacity', 1)
        current_occupancy = validated_data.pop('current_occupancy', 0)
        
        vehicle_type = validated_data.pop('vehicle_type', None)
        
        # Creates user
        user = User.objects.create_user(**validated_data)
        
        # Creates profile
        if role == 'donor':
            DonorProfile.objects.create(
                user=user,
                business_name=business_name or user.get_full_name(),
                donor_type=donor_type,
                license_number=license_number,
                **profile_data
            )
        elif role == 'recipient':
            RecipientProfile.objects.create(
                user=user,
                recipient_type=recipient_type,
                organization_name=organization_name or user.get_full_name(),
                capacity=capacity,
                current_occupancy=current_occupancy,
                **profile_data
            )
        elif role == 'volunteer':
            VolunteerProfile.objects.create(
                user=user,
                vehicle_type=vehicle_type,
                has_vehicle=bool(vehicle_type),
                **profile_data
            )
            
        return user

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserSerializer

class UserUpdateSerializer(serializers.ModelSerializer):
    # Common profile fields
    phone = serializers.CharField(required=False)
    address = serializers.CharField(required=False)
    
    # Donor specific
    business_name = serializers.CharField(required=False, allow_blank=True)
    donor_type = serializers.CharField(required=False, allow_blank=True)
    license_number = serializers.CharField(required=False, allow_blank=True)
    
    # Recipient specific
    recipient_type = serializers.CharField(required=False, allow_blank=True)
    organization_name = serializers.CharField(required=False, allow_blank=True)
    capacity = serializers.IntegerField(required=False, allow_null=True)
    current_occupancy = serializers.IntegerField(required=False, allow_null=True)
    description = serializers.CharField(required=False, allow_blank=True)
    
    # Volunteer specific
    vehicle_type = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    vehicle_capacity = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, allow_null=True)
    is_available = serializers.BooleanField(required=False)

    class Meta:
        model = User
        fields = ('username', 'email', 'first_name', 'last_name', 
                  'phone', 'address',
                  'business_name', 'donor_type', 'license_number',
                  'recipient_type', 'organization_name', 'capacity', 'current_occupancy', 'description',
                  'vehicle_type', 'vehicle_capacity', 'is_available')
        read_only_fields = ()

    def update(self, instance, validated_data):
        # Updates user fields
        instance.username = validated_data.get('username', instance.username)
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.email = validated_data.get('email', instance.email)
        instance.save()
        
        # Updates profile fields
        profile = None
        if hasattr(instance, 'donor_profile'):
            profile = instance.donor_profile
            profile.business_name = validated_data.get('business_name', profile.business_name)
            profile.donor_type = validated_data.get('donor_type', profile.donor_type)
            profile.license_number = validated_data.get('license_number', profile.license_number)
        elif hasattr(instance, 'recipient_profile'):
            profile = instance.recipient_profile
            profile.recipient_type = validated_data.get('recipient_type', profile.recipient_type)
            profile.organization_name = validated_data.get('organization_name', profile.organization_name)
            profile.capacity = validated_data.get('capacity', profile.capacity)
            profile.current_occupancy = validated_data.get('current_occupancy', profile.current_occupancy)
            profile.description = validated_data.get('description', profile.description)
        elif hasattr(instance, 'volunteer_profile'):
            profile = instance.volunteer_profile
            profile.vehicle_type = validated_data.get('vehicle_type', profile.vehicle_type)
            profile.vehicle_capacity = validated_data.get('vehicle_capacity', profile.vehicle_capacity)
            profile.is_available = validated_data.get('is_available', profile.is_available)
            
        if profile:
            profile.phone = validated_data.get('phone', profile.phone)
            profile.address = validated_data.get('address', profile.address)
            profile.save()
            
        return instance

class UserDetailView(generics.RetrieveUpdateAPIView):
    """Retrieves or updates user details."""
    serializer_class = UserUpdateSerializer
    
    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        user = self.get_object()
        data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
        }
        
        # Attach role and profile info
        if hasattr(user, 'donor_profile'):
            p = user.donor_profile
            data.update({
                'role': 'donor',
                'profile_id': p.id,
                'phone': p.phone,
                'address': p.address,
                'business_name': p.business_name,
                'donor_type': p.donor_type,
                'license_number': p.license_number,
            })
        elif hasattr(user, 'recipient_profile'):
            p = user.recipient_profile
            data.update({
                'role': 'recipient',
                'profile_id': p.id,
                'phone': p.phone,
                'address': p.address,
                'recipient_type': p.recipient_type,
                'organization_name': p.organization_name,
                'capacity': p.capacity,
                'current_occupancy': p.current_occupancy,
                'description': p.description,
            })
        elif hasattr(user, 'volunteer_profile'):
            p = user.volunteer_profile
            data.update({
                'role': 'volunteer',
                'profile_id': p.id,
                'phone': p.phone,
                'address': p.address,
                'vehicle_type': p.vehicle_type,
                'vehicle_capacity': p.vehicle_capacity,
                'is_available': p.is_available,
            })
        elif user.is_staff:
            data['role'] = 'admin'
        else:
            data['role'] = 'unknown'
            
        return Response(data)
