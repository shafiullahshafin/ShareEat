"""
Volunteer Models Module.

This module defines the data models for volunteers, their vehicle capabilities,
availability schedules, and the delivery requests assigned to them.
"""

from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator


class VolunteerProfile(models.Model):
    """
    Represents a volunteer profile.
    Tracks vehicle, availability, and rating.
    """
    VEHICLE_TYPES = [
        ('bicycle', 'Bicycle'),
        ('motorcycle', 'Motorcycle'),
        ('car', 'Car'),
        ('van', 'Van'),
        ('truck', 'Truck'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='volunteer_profile')
    phone = models.CharField(max_length=20)
    address = models.TextField()
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    has_vehicle = models.BooleanField(default=False)
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_TYPES, null=True, blank=True)
    vehicle_capacity = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Capacity in kg"
    )
    is_available = models.BooleanField(default=True)
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0), MaxValueValidator(5)]
    )
    total_deliveries = models.IntegerField(default=0)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'volunteer_profiles'
        ordering = ['-rating', '-total_deliveries']

    def __str__(self):
        return f"{self.user.get_full_name()} - Volunteer"

    def update_rating(self):
        """Updates average rating from completed deliveries."""
        from django.db.models import Avg
        avg_rating = self.deliveries.filter(
            status='completed',
            rating__isnull=False
        ).aggregate(Avg('rating'))['rating__avg']

        if avg_rating:
            self.rating = round(avg_rating, 2)
            self.save(update_fields=['rating'])

    def increment_delivery_count(self):
        """Increments total delivery count."""
        self.total_deliveries += 1
        self.save(update_fields=['total_deliveries'])


class VolunteerAvailability(models.Model):
    """
    Represents volunteer availability slots.
    """
    volunteer = models.ForeignKey(
        VolunteerProfile,
        on_delete=models.CASCADE,
        related_name='availability_slots'
    )
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_booked = models.BooleanField(default=False)

    class Meta:
        db_table = 'volunteer_availability'
        unique_together = ['volunteer', 'date', 'start_time']
        ordering = ['date', 'start_time']

    def __str__(self):
        return f"{self.volunteer.user.get_full_name()} - {self.date}"


class DeliveryRequest(models.Model):
    """
    Represents a delivery request.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired'),
        ('delivered', 'Delivered'),
        ('completed', 'Completed'),
    ]

    donation = models.ForeignKey(
        'inventory.Donation',
        on_delete=models.CASCADE,
        related_name='delivery_requests'
    )
    volunteer = models.ForeignKey(
        VolunteerProfile,
        on_delete=models.CASCADE,
        related_name='delivery_requests'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'delivery_requests'
        unique_together = ['donation', 'volunteer']
        ordering = ['-created_at']

    def __str__(self):
        return f"Request for {self.donation.id} to {self.volunteer.user.username} ({self.status})"
