"""
Configures the Django admin interface for the inventory application.
"""
from django.contrib import admin
from .models import FoodCategory, FoodItem, Donation, DonationItem, ImpactMetrics


@admin.register(FoodCategory)
class FoodCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'requires_refrigeration', 'average_shelf_life_hours']
    list_filter = ['requires_refrigeration']
    search_fields = ['name', 'description']


@admin.register(FoodItem)
class FoodItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'donor', 'category', 'quantity', 'unit', 'condition', 'urgency_level', 'expiry_date', 'is_available']
    list_filter = ['category', 'condition', 'urgency_level', 'is_available', 'created_at']
    search_fields = ['name', 'donor__business_name', 'description']
    readonly_fields = ['urgency_level', 'created_at', 'updated_at']
    date_hierarchy = 'expiry_date'


class DonationItemInline(admin.TabularInline):
    model = DonationItem
    extra = 1
    raw_id_fields = ['food_item']


@admin.register(Donation)
class DonationAdmin(admin.ModelAdmin):
    list_display = ['id', 'donor', 'recipient', 'volunteer', 'status', 'total_weight', 'estimated_meals', 'scheduled_pickup_time', 'created_at']
    list_filter = ['status', 'created_at', 'scheduled_pickup_time']
    search_fields = ['donor__business_name', 'recipient__organization_name', 'volunteer__user__username']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'
    inlines = [DonationItemInline]
    fieldsets = (
        ('Parties Involved', {
            'fields': ('donor', 'recipient', 'volunteer')
        }),
        ('Status & Schedule', {
            'fields': ('status', 'scheduled_pickup_time', 'actual_pickup_time', 'scheduled_delivery_time', 'actual_delivery_time')
        }),
        ('Donation Details', {
            'fields': ('total_weight', 'estimated_meals', 'notes')
        }),
        ('Feedback', {
            'fields': ('rating', 'feedback'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ImpactMetrics)
class ImpactMetricsAdmin(admin.ModelAdmin):
    list_display = ['donation', 'food_waste_prevented_kg', 'co2_emissions_saved_kg', 'meals_provided', 'people_fed', 'calculated_at']
    list_filter = ['calculated_at']
    search_fields = ['donation__id']
    readonly_fields = ['calculated_at']