"""
Admin interface for donors app.
"""
from django.contrib import admin
from .models import DonorProfile, DonorSchedule


@admin.register(DonorProfile)
class DonorProfileAdmin(admin.ModelAdmin):
    list_display = ['business_name', 'donor_type', 'phone', 'is_verified', 'rating', 'total_donations', 'created_at']
    list_filter = ['donor_type', 'is_verified', 'created_at']
    search_fields = ['business_name', 'phone', 'license_number']
    readonly_fields = ['rating', 'total_donations', 'created_at', 'updated_at']
    fieldsets = (
        ('Business Information', {
            'fields': ('user', 'business_name', 'donor_type', 'license_number')
        }),
        ('Contact Details', {
            'fields': ('phone', 'address', 'latitude', 'longitude')
        }),
        ('Status & Metrics', {
            'fields': ('is_verified', 'rating', 'total_donations')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(DonorSchedule)
class DonorScheduleAdmin(admin.ModelAdmin):
    list_display = ['donor', 'day_of_week', 'opening_time', 'closing_time', 'is_active']
    list_filter = ['day_of_week', 'is_active']
    search_fields = ['donor__business_name']