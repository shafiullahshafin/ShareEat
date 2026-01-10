"""
Recipient Models Module.

This module defines the data models for food recipients (NGOs, Shelters, etc.)
and their specific food needs. It includes capacity tracking and geocoding logic.
"""

import logging
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from shareeat.utils.geocoding import get_location_from_coordinates, get_coordinates_from_address

logger = logging.getLogger(__name__)


class RecipientProfile(models.Model):
    """
    Profile information for food recipients.

    Attributes:
        user (User): Associated system user.
        recipient_type (str): Type of organization (NGO, shelter, etc.).
        organization_name (str): Name of the entity.
        phone (str): Contact number.
        address (str): Physical address.
        latitude (Decimal): GPS Latitude.
        longitude (Decimal): GPS Longitude.
        location (str): Auto-generated location name.
        capacity (int): Max number of people served.
        current_occupancy (int): Current number of people being served.
        is_verified (bool): Admin verification status.
    """
    RECIPIENT_TYPES = [
        ('ngo', 'NGO'),
        ('shelter', 'Shelter'),
        ('individual', 'Individual'),
        ('community', 'Community Center'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='recipient_profile')
    recipient_type = models.CharField(max_length=20, choices=RECIPIENT_TYPES)
    organization_name = models.CharField(max_length=200, null=True, blank=True)
    phone = models.CharField(max_length=20)
    address = models.TextField()
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    location = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Auto-generated from coordinates via reverse geocoding"
    )
    capacity = models.IntegerField(
        validators=[MinValueValidator(1)],
        help_text="Maximum number of people can serve"
    )
    current_occupancy = models.IntegerField(
        default=0,
        help_text="Current number of people being served"
    )
    is_verified = models.BooleanField(default=False)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'recipient_profiles'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['latitude', 'longitude']),
            models.Index(fields=['recipient_type']),
        ]

    def save(self, *args, **kwargs):
        """
        Override save to handle automatic geocoding.
        Same logic as DonorProfile: prioritizes coordinates if present,
        otherwise falls back to address.
        """
        should_reverse_geocode = False
        should_forward_geocode = False
        org_name = self.organization_name or self.user.get_full_name()

        # Determine if we need to geocode
        if self.pk is None:
            if self.latitude and self.longitude and not self.location:
                should_reverse_geocode = True
            elif self.address and (not self.latitude or not self.longitude):
                should_forward_geocode = True
        else:
            try:
                old_instance = RecipientProfile.objects.get(pk=self.pk)
                coordinates_changed = (
                    old_instance.latitude != self.latitude or
                    old_instance.longitude != self.longitude
                )
                if coordinates_changed and self.latitude and self.longitude:
                    should_reverse_geocode = True

                if old_instance.address != self.address and self.address:
                    if not coordinates_changed:
                        should_forward_geocode = True
            except RecipientProfile.DoesNotExist:
                if self.latitude and self.longitude:
                    should_reverse_geocode = True
                elif self.address:
                    should_forward_geocode = True

        # Forward Geocoding
        if should_forward_geocode:
            try:
                logger.info(f"Forward geocoding address for: {org_name}")
                lat, lon = get_coordinates_from_address(self.address)
                if lat and lon:
                    self.latitude = lat
                    self.longitude = lon
                    should_reverse_geocode = True
                    logger.info(f"✓ Forward Geocoded: {self.address} → ({lat}, {lon})")
                else:
                    logger.warning(f"⚠ Forward geocoding returned no coordinates for: {self.address}")
            except Exception as e:
                logger.error(f"✗ Forward geocoding failed for {org_name}: {str(e)}")

        # Reverse Geocoding
        if should_reverse_geocode and self.latitude and self.longitude:
            try:
                logger.info(f"Reverse geocoding location for: {org_name}")
                location = get_location_from_coordinates(
                    self.latitude,
                    self.longitude
                )
                if location and location != "Location not available":
                    self.location = location
                    logger.info(f"✓ Reverse Geocoded: ({self.latitude}, {self.longitude}) → {location}")
                else:
                    logger.warning(f"⚠ Reverse geocoding returned no valid location for: {org_name}")
            except Exception as e:
                logger.error(f"✗ Reverse geocoding failed for {org_name}: {str(e)}")

        super().save(*args, **kwargs)

    def __str__(self):
        name = self.organization_name or self.user.get_full_name()
        return f"{name} ({self.get_recipient_type_display()})"

    @property
    def available_capacity(self):
        """Calculates remaining capacity."""
        return max(0, self.capacity - self.current_occupancy)

    @property
    def occupancy_percentage(self):
        """Calculates occupancy percentage (0-100)."""
        if self.capacity == 0:
            return 0
        return round((self.current_occupancy / self.capacity) * 100, 2)

    def can_accept_donation(self, quantity):
        """
        Validates if the recipient can accept a donation of a given quantity.
        Currently checks verification status and available capacity.
        """
        return self.is_verified and quantity <= self.available_capacity

    def refresh_location(self):
        """Manually triggers a location refresh from current coordinates."""
        if self.latitude and self.longitude:
            try:
                location = get_location_from_coordinates(
                    self.latitude,
                    self.longitude
                )
                if location and location != "Location not available":
                    self.location = location
                    self.save(update_fields=['location'])
                    return True
            except Exception as e:
                org_name = self.organization_name or self.user.get_full_name()
                logger.error(f"Failed to refresh location for {org_name}: {str(e)}")
        return False


class RecipientNeed(models.Model):
    """
    Represents a specific request or need posted by a recipient.
    Used by the matching algorithm to prioritize donations.
    """
    PRIORITY_LEVELS = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]

    recipient = models.ForeignKey(
        RecipientProfile,
        on_delete=models.CASCADE,
        related_name='needs'
    )
    food_category = models.CharField(max_length=100)
    quantity_needed = models.IntegerField(validators=[MinValueValidator(1)])
    priority = models.CharField(max_length=10, choices=PRIORITY_LEVELS, default='medium')
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'recipient_needs'
        ordering = ['-priority', '-created_at']

    def __str__(self):
        org_name = self.recipient.organization_name or "Recipient"
        return f"{org_name} needs {self.food_category}"
