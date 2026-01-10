"""
Donor Models Module.

This module defines the data models for donor profiles and their operating schedules.
It includes logic for smart geocoding of addresses and rating management.
"""

import logging
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from shareeat.utils.geocoding import get_location_from_coordinates, get_coordinates_from_address

logger = logging.getLogger(__name__)


class DonorProfile(models.Model):
    """
    Profile information for food donors (restaurants, stores, etc.).

    Attributes:
        user (User): Associated system user.
        business_name (str): Name of the establishment.
        donor_type (str): Category (restaurant, grocery, etc.).
        phone (str): Contact number.
        address (str): Physical address.
        latitude (Decimal): GPS Latitude.
        longitude (Decimal): GPS Longitude.
        location (str): Human-readable location name derived from coordinates.
        license_number (str): Business license/registration.
        is_verified (bool): Admin verification status.
        rating (Decimal): Aggregate rating from completed donations.
        total_donations (int): Counter of total donations made.
    """
    DONOR_TYPES = [
        ('restaurant', 'Restaurant'),
        ('grocery', 'Grocery Store'),
        ('bakery', 'Bakery'),
        ('catering', 'Catering Service'),
        ('hotel', 'Hotel'),
        ('retail', 'Retail Store'),
        ('other', 'Other'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='donor_profile')
    business_name = models.CharField(max_length=200)
    donor_type = models.CharField(max_length=20, choices=DONOR_TYPES)
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
    license_number = models.CharField(max_length=100, unique=True)
    is_verified = models.BooleanField(default=False)
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0), MaxValueValidator(5)]
    )
    total_donations = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'donor_profiles'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['latitude', 'longitude']),
            models.Index(fields=['is_verified']),
        ]

    def save(self, *args, **kwargs):
        """
        Override save to handle automatic geocoding.
        
        Logic:
        1. If coordinates exist but location doesn't -> Reverse Geocode.
        2. If address exists but coordinates don't -> Forward Geocode.
        3. If address changes -> Re-Forward Geocode.
        4. If coordinates change -> Re-Reverse Geocode.
        """
        should_reverse_geocode = False
        should_forward_geocode = False

        # Determine if we need to geocode
        if self.pk is None:
            # New object
            if self.latitude and self.longitude and not self.location:
                should_reverse_geocode = True
            elif self.address and (not self.latitude or not self.longitude):
                should_forward_geocode = True
        else:
            # Existing object - check for changes
            try:
                old_instance = DonorProfile.objects.get(pk=self.pk)

                # Check for coordinate changes
                coordinates_changed = (
                    old_instance.latitude != self.latitude or
                    old_instance.longitude != self.longitude
                )
                if coordinates_changed and self.latitude and self.longitude:
                    should_reverse_geocode = True

                # Check for address changes
                if old_instance.address != self.address and self.address:
                    # Only forward geocode if coordinates didn't also change manually
                    if not coordinates_changed:
                        should_forward_geocode = True

            except DonorProfile.DoesNotExist:
                # Treated as new
                if self.latitude and self.longitude:
                    should_reverse_geocode = True
                elif self.address:
                    should_forward_geocode = True

        # Perform Forward Geocoding (Address -> Coordinates)
        if should_forward_geocode:
            try:
                logger.info(f"Forward geocoding address for: {self.business_name}")
                lat, lon = get_coordinates_from_address(self.address)
                if lat and lon:
                    self.latitude = lat
                    self.longitude = lon
                    should_reverse_geocode = True
                    logger.info(f"✓ Forward Geocoded: {self.address} → ({lat}, {lon})")
                else:
                    logger.warning(f"⚠ Forward geocoding returned no coordinates for: {self.address}")
            except Exception as e:
                logger.error(f"✗ Forward geocoding failed for {self.business_name}: {str(e)}")

        # Perform Reverse Geocoding (Coordinates -> Location Name)
        if should_reverse_geocode and self.latitude and self.longitude:
            try:
                logger.info(f"Reverse geocoding location for: {self.business_name}")
                location = get_location_from_coordinates(
                    self.latitude,
                    self.longitude
                )
                if location and location != "Location not available":
                    self.location = location
                    logger.info(f"✓ Reverse Geocoded: ({self.latitude}, {self.longitude}) → {location}")
                else:
                    logger.warning(f"⚠ Reverse geocoding returned no valid location for: {self.business_name}")
            except Exception as e:
                logger.error(f"✗ Reverse geocoding failed for {self.business_name}: {str(e)}")

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.business_name} ({self.get_donor_type_display()})"

    def update_rating(self):
        """Calculates and updates the average rating based on completed donations."""
        from django.db.models import Avg
        avg_rating = self.donations.filter(
            status='completed',
            rating__isnull=False
        ).aggregate(Avg('rating'))['rating__avg']

        if avg_rating:
            self.rating = round(avg_rating, 2)
            self.save(update_fields=['rating'])

    def increment_donation_count(self):
        """Atomically increments the total donation count."""
        self.total_donations += 1
        self.save(update_fields=['total_donations'])

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
                logger.error(f"Failed to refresh location for {self.business_name}: {str(e)}")
        return False


class DonorSchedule(models.Model):
    """
    Defines the weekly operating hours for a donor.
    Used to validate pickup times.
    """
    DAYS_OF_WEEK = [
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    ]

    donor = models.ForeignKey(DonorProfile, on_delete=models.CASCADE, related_name='schedules')
    day_of_week = models.IntegerField(choices=DAYS_OF_WEEK)
    opening_time = models.TimeField()
    closing_time = models.TimeField()
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'donor_schedules'
        unique_together = ['donor', 'day_of_week']
        ordering = ['day_of_week']

    def __str__(self):
        return f"{self.donor.business_name} - {self.get_day_of_week_display()}"

    def is_open_now(self):
        """Checks if the donor is currently open based on system time."""
        now = timezone.localtime()
        current_day = now.weekday()
        current_time = now.time()

        return (
            self.is_active and
            self.day_of_week == current_day and
            self.opening_time <= current_time <= self.closing_time
        )
