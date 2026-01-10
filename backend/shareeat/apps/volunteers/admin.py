"""
Admin interface for volunteers app.
"""
from django.contrib import admin
from .models import VolunteerProfile, VolunteerAvailability


@admin.register(VolunteerProfile)
class VolunteerProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'phone', 'has_vehicle', 'vehicle_type', 'is_available', 'rating', 'total_deliveries', 'is_verified']
    list_filter = ['has_vehicle', 'vehicle_type', 'is_available', 'is_verified', 'created_at']
    search_fields = ['user__username', 'user__first_name', 'user__last_name', 'phone']
    readonly_fields = ['rating', 'total_deliveries', 'created_at', 'updated_at']
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'phone', 'address')
        }),
        ('Vehicle Information', {
            'fields': ('has_vehicle', 'vehicle_type', 'vehicle_capacity')
        }),
        ('Status & Metrics', {
            'fields': ('is_available', 'is_verified', 'rating', 'total_deliveries')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(VolunteerAvailability)
class VolunteerAvailabilityAdmin(admin.ModelAdmin):
    list_display = ['volunteer', 'date', 'start_time', 'end_time', 'is_booked']
    list_filter = ['date', 'is_booked']
    search_fields = ['volunteer__user__username']