"""
URL patterns for volunteers app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VolunteerProfileViewSet, VolunteerAvailabilityViewSet, DeliveryRequestViewSet

app_name = 'volunteers'

router = DefaultRouter()
router.register(r'profiles', VolunteerProfileViewSet)
router.register(r'availability', VolunteerAvailabilityViewSet)
router.register(r'delivery-requests', DeliveryRequestViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
