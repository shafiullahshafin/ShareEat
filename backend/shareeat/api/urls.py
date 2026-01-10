"""
API URL configuration.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .auth_views import RegisterView, UserDetailView
from shareeat.apps.donors.views import DonorProfileViewSet, DonorScheduleViewSet
from shareeat.apps.recipients.views import RecipientProfileViewSet, RecipientNeedViewSet
from shareeat.apps.volunteers.views import VolunteerProfileViewSet, VolunteerAvailabilityViewSet, DeliveryRequestViewSet
from shareeat.apps.inventory.views import (
    FoodCategoryViewSet, FoodItemViewSet, DonationViewSet, ImpactMetricsViewSet
)
from shareeat.apps.notifications.views import NotificationViewSet
from shareeat.apps.inventory.analytics_views import (
    DashboardStatsView, DonationTrendsView, DonorPerformanceView,
    RecipientImpactView, FoodCategoryDistributionView, UrgencyBreakdownView,
    VolunteerLeaderboardView, TimeSlotAnalysisView, ImpactOverTimeView, DonorReportView,
    PublicImpactStatsView
)

# Create router and register viewsets
router = DefaultRouter()

# Donor endpoints
router.register(r'donors', DonorProfileViewSet, basename='donor')
router.register(r'donor-schedules', DonorScheduleViewSet, basename='donor-schedule')

# Recipient endpoints
router.register(r'recipients', RecipientProfileViewSet, basename='recipient')
router.register(r'recipient-needs', RecipientNeedViewSet, basename='recipient-need')

# Volunteer endpoints
router.register(r'volunteers', VolunteerProfileViewSet, basename='volunteer')
router.register(r'volunteer-availability', VolunteerAvailabilityViewSet, basename='volunteer-availability')
router.register(r'delivery-requests', DeliveryRequestViewSet, basename='delivery-request')

# Notification endpoints
router.register(r'notifications', NotificationViewSet, basename='notification')

# Inventory endpoints
router.register(r'food-categories', FoodCategoryViewSet, basename='food-category')
router.register(r'food-items', FoodItemViewSet, basename='food-item')
router.register(r'donations', DonationViewSet, basename='donation')
router.register(r'impact-metrics', ImpactMetricsViewSet, basename='impact-metrics')

app_name = 'api'

urlpatterns = [
    # Auth URLs
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/me/', UserDetailView.as_view(), name='auth_me'),

    # Router URLs
    path('', include(router.urls)),
    
    # Analytics endpoints
    path('analytics/dashboard/', DashboardStatsView.as_view(), name='analytics-dashboard'),
    path('analytics/public-impact/', PublicImpactStatsView.as_view(), name='public-impact'),
    path('analytics/donation-trends/', DonationTrendsView.as_view(), name='donation-trends'),
    path('analytics/donor-performance/', DonorPerformanceView.as_view(), name='donor-performance'),
    path('analytics/recipient-impact/', RecipientImpactView.as_view(), name='recipient-impact'),
    path('analytics/food-distribution/', FoodCategoryDistributionView.as_view(), name='food-distribution'),
    path('analytics/urgency-breakdown/', UrgencyBreakdownView.as_view(), name='urgency-breakdown'),
    path('analytics/volunteer-leaderboard/', VolunteerLeaderboardView.as_view(), name='volunteer-leaderboard'),
    path('analytics/time-slots/', TimeSlotAnalysisView.as_view(), name='time-slots'),
    path('analytics/impact-over-time/', ImpactOverTimeView.as_view(), name='impact-over-time'),
    path('analytics/donor-report/<int:donor_id>/', DonorReportView.as_view(), name='donor-report'),
]