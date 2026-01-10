"""
Donors app configuration.
"""
from django.apps import AppConfig


class DonorsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'shareeat.apps.donors'
    verbose_name = 'Food Donors'