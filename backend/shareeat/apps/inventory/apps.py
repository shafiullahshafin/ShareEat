"""
Inventory app configuration.
"""
from django.apps import AppConfig


class InventoryConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'shareeat.apps.inventory'
    verbose_name = 'Food Inventory'