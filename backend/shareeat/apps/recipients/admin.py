"""
Admin interface for recipients app.
"""
from django.contrib import admin
from .models import RecipientProfile, RecipientNeed


@admin.register(RecipientProfile)
class RecipientProfileAdmin(admin.ModelAdmin):
    list_display = ['organization_name', 'recipient_type', 'phone', 'capacity', 'current_occupancy', 'is_verified', 'created_at']
    list_filter = ['recipient_type', 'is_verified', 'created_at']
    search_fields = ['organization_name', 'phone', 'address']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Organization Information', {
            'fields': ('user', 'organization_name', 'recipient_type', 'description')
        }),
        ('Contact Details', {
            'fields': ('phone', 'address', 'latitude', 'longitude')
        }),
        ('Capacity', {
            'fields': ('capacity', 'current_occupancy', 'is_verified')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(RecipientNeed)
class RecipientNeedAdmin(admin.ModelAdmin):
    list_display = ['recipient', 'food_category', 'quantity_needed', 'priority', 'is_active', 'created_at']
    list_filter = ['priority', 'is_active', 'created_at']
    search_fields = ['recipient__organization_name', 'food_category']