"""
Inventory Models Module.

This module defines the data models for the inventory management system, including
FoodCategory, FoodItem, Donation, DonationItem, and ImpactMetrics. It handles
the core business logic for food tracking, urgency calculation, and donation lifecycles.
"""

from datetime import timedelta
from decimal import Decimal

from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class FoodCategory(models.Model):
    """
    Represents a category of food items in the system.
    """
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)
    requires_refrigeration = models.BooleanField(default=False)
    average_shelf_life_hours = models.IntegerField(
        default=24,
        validators=[MinValueValidator(1)]
    )

    class Meta:
        db_table = 'food_categories'
        verbose_name_plural = 'Food Categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class FoodItem(models.Model):
    """
    Represents a specific batch of food items available for donation.
    Tracks quantity, condition, and expiry details.
    """
    CONDITION_CHOICES = [
        ('excellent', 'Excellent'),
        ('good', 'Good'),
        ('fair', 'Fair'),
        ('poor', 'Poor'),
    ]

    URGENCY_LEVELS = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    donor = models.ForeignKey(
        'donors.DonorProfile',
        on_delete=models.CASCADE,
        related_name='food_items'
    )
    category = models.ForeignKey(
        FoodCategory,
        on_delete=models.PROTECT,
        related_name='items'
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    quantity = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    unit = models.CharField(max_length=20, default='kg')
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='good')
    expiry_date = models.DateTimeField()
    pickup_before = models.DateTimeField()
    is_available = models.BooleanField(default=True)
    urgency_level = models.CharField(max_length=20, choices=URGENCY_LEVELS, default='medium')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'food_items'
        ordering = ['urgency_level', 'expiry_date']
        indexes = [
            models.Index(fields=['donor', 'is_available']),
            models.Index(fields=['expiry_date', 'is_available']),
            models.Index(fields=['urgency_level']),
        ]

    def __str__(self):
        return f"{self.name} ({self.quantity}{self.unit})"

    def save(self, *args, **kwargs):
        """Overrides the default save method to automatically recalculate the urgency level before saving."""
        self.urgency_level = self.calculate_urgency()
        super().save(*args, **kwargs)

    def calculate_urgency(self):
        """Determines the urgency level of the food item based on the time remaining until expiry."""
        now = timezone.now()
        time_until_expiry = (self.expiry_date - now).total_seconds() / 3600  # hours

        if time_until_expiry <= 2:
            return 'critical'
        elif time_until_expiry <= 6:
            return 'high'
        elif time_until_expiry <= 24:
            return 'medium'
        return 'low'

    @property
    def hours_until_expiry(self):
        """Calculates the number of hours remaining until the item expires."""
        if not self.is_available:
            return 0
        delta = self.expiry_date - timezone.now()
        return max(0, delta.total_seconds() / 3600)

    @property
    def is_expired(self):
        """Checks if the food item has passed its expiry date."""
        return timezone.now() >= self.expiry_date

    @property
    def freshness_score(self):
        """Calculates a freshness score (0-100) based on remaining shelf life and condition."""
        if self.is_expired:
            return 0

        hours_left = self.hours_until_expiry
        max_hours = self.category.average_shelf_life_hours

        # Base score derived from percentage of shelf life remaining
        time_score = (hours_left / max_hours) * 70

        # Bonus score based on physical condition
        condition_scores = {
            'excellent': 30,
            'good': 20,
            'fair': 10,
            'poor': 0
        }
        condition_score = condition_scores.get(self.condition, 0)

        return min(100, time_score + condition_score)


class Donation(models.Model):
    """
    Represents a donation transaction in the system.
    Links donors, recipients, and volunteers together.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('picked_up', 'Picked Up'),
        ('in_transit', 'In Transit'),
        ('delivered', 'Delivered'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('pending_manual_assignment', 'Pending Manual Assignment'),
    ]

    donor = models.ForeignKey(
        'donors.DonorProfile',
        on_delete=models.CASCADE,
        related_name='donations'
    )
    recipient = models.ForeignKey(
        'recipients.RecipientProfile',
        on_delete=models.CASCADE,
        related_name='received_donations'
    )
    volunteer = models.ForeignKey(
        'volunteers.VolunteerProfile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='deliveries'
    )
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending')
    scheduled_pickup_time = models.DateTimeField()
    actual_pickup_time = models.DateTimeField(null=True, blank=True)
    scheduled_delivery_time = models.DateTimeField()
    actual_delivery_time = models.DateTimeField(null=True, blank=True)
    total_weight = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    estimated_meals = models.IntegerField(default=0)
    notes = models.TextField(blank=True)
    rating = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    feedback = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'donations'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['donor', 'status']),
            models.Index(fields=['recipient', 'status']),
            models.Index(fields=['volunteer', 'status']),
            models.Index(fields=['scheduled_pickup_time']),
        ]

    def __str__(self):
        return f"Donation #{self.id} - {self.get_status_display()}"

    def calculate_total_weight(self):
        """Aggregates the total weight from all items in this donation."""
        total = sum(item.quantity for item in self.items.all())
        self.total_weight = total
        self.save(update_fields=['total_weight'])

    def calculate_estimated_meals(self):
        """Estimates the number of meals provided based on total weight (0.4kg per meal)."""
        if self.total_weight > 0:
            self.estimated_meals = int(self.total_weight / Decimal('0.4'))
            self.save(update_fields=['estimated_meals'])

    def mark_picked_up(self):
        """Transitions the donation status to 'picked_up' and records the time."""
        if self.status == 'confirmed':
            self.status = 'picked_up'
            self.actual_pickup_time = timezone.now()
            self.save(update_fields=['status', 'actual_pickup_time'])
            return True
        return False

    def cancel_donation(self):
        """Cancels the donation and restores the items to the inventory."""
        if self.status in ['pending', 'confirmed']:
            self.status = 'cancelled'
            self.save(update_fields=['status'])

            # Restore inventory quantities
            for item in self.items.all():
                food_item = item.food_item
                food_item.quantity += item.quantity
                if food_item.quantity > 0:
                    food_item.is_available = True
                food_item.save(update_fields=['quantity', 'is_available'])
            return True
        return False

    def mark_delivered(self):
        """Transitions the donation status to 'delivered' and records the time."""
        if self.status in ['picked_up', 'in_transit']:
            self.status = 'delivered'
            self.actual_delivery_time = timezone.now()
            self.save(update_fields=['status', 'actual_delivery_time'])
            return True
        return False

    @property
    def delivery_time_minutes(self):
        """Calculates the delivery duration in minutes."""
        if self.actual_pickup_time and self.actual_delivery_time:
            delta = self.actual_delivery_time - self.actual_pickup_time
            return delta.total_seconds() / 60
        return None


class DonationItem(models.Model):
    """
    Links a specific FoodItem to a Donation.
    """
    donation = models.ForeignKey(
        Donation,
        on_delete=models.CASCADE,
        related_name='items'
    )
    food_item = models.ForeignKey(
        FoodItem,
        on_delete=models.CASCADE,
        related_name='donation_items'
    )
    quantity = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )

    class Meta:
        db_table = 'donation_items'
        unique_together = ['donation', 'food_item']

    def __str__(self):
        return f"{self.food_item.name} in Donation #{self.donation.id}"

    def save(self, *args, **kwargs):
        """Validates that the requested quantity does not exceed availability."""
        if self.quantity > self.food_item.quantity:
            raise ValueError("Donation quantity cannot exceed available quantity")
        super().save(*args, **kwargs)


class ImpactMetrics(models.Model):
    """
    Stores calculated impact data for completed donations.
    """
    donation = models.OneToOneField(
        Donation,
        on_delete=models.CASCADE,
        related_name='impact'
    )
    food_waste_prevented_kg = models.DecimalField(max_digits=10, decimal_places=2)
    co2_emissions_saved_kg = models.DecimalField(max_digits=10, decimal_places=2)
    meals_provided = models.IntegerField()
    people_fed = models.IntegerField()
    tax_deduction_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )
    calculated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'impact_metrics'
        verbose_name_plural = 'Impact Metrics'

    def __str__(self):
        return f"Impact for Donation #{self.donation.id}"

    @staticmethod
    def calculate_co2_savings(food_weight_kg):
        """Estimates CO2 emissions saved based on the weight of food diverted from waste."""
        return food_weight_kg * Decimal('2.5')

    @staticmethod
    def calculate_tax_deduction(food_weight_kg):
        """Estimates the potential tax deduction value for the donation."""
        return food_weight_kg * Decimal('2.0')
