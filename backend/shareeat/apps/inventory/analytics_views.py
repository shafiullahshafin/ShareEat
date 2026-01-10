"""
Analytics API views.
Exposes analytics data.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.utils import timezone
from datetime import timedelta
from .analytics import AnalyticsEngine, ReportGenerator


class DashboardStatsView(APIView):
    """Retrieves dashboard statistics."""
    
    def get(self, request):
        """Returns dashboard statistics."""
        stats = AnalyticsEngine.get_dashboard_stats()
        return Response(stats)


class PublicImpactStatsView(APIView):
    """Retrieves public impact statistics."""
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Returns public impact statistics."""
        stats = AnalyticsEngine.get_dashboard_stats()
        return Response(stats)


class DonationTrendsView(APIView):
    """Retrieves donation trends over time."""
    
    def get(self, request):
        """Returns donation trends."""
        days = int(request.query_params.get('days', 30))
        trends = AnalyticsEngine.get_donation_trends(days)
        return Response(trends)


class DonorPerformanceView(APIView):
    """Retrieves top performing donors."""
    
    def get(self, request):
        """Returns donor performance data."""
        performance = AnalyticsEngine.get_donor_performance()
        return Response(performance)


class RecipientImpactView(APIView):
    """Retrieves recipient impact data."""
    
    def get(self, request):
        """Returns recipient impact data."""
        impact = AnalyticsEngine.get_recipient_impact()
        return Response(impact)


class FoodCategoryDistributionView(APIView):
    """Retrieves food category distribution."""
    
    def get(self, request):
        """Returns food category distribution."""
        distribution = AnalyticsEngine.get_food_category_distribution()
        return Response(distribution)


class UrgencyBreakdownView(APIView):
    """Retrieves urgency level breakdown."""
    
    def get(self, request):
        """Returns urgency breakdown."""
        breakdown = AnalyticsEngine.get_urgency_breakdown()
        return Response(breakdown)


class VolunteerLeaderboardView(APIView):
    """Retrieves volunteer leaderboard."""
    
    def get(self, request):
        """Returns volunteer leaderboard."""
        leaderboard = AnalyticsEngine.get_volunteer_leaderboard()
        return Response(leaderboard)


class TimeSlotAnalysisView(APIView):
    """Retrieves time slot analysis."""
    
    def get(self, request):
        """Returns time slot analysis."""
        analysis = AnalyticsEngine.get_time_slot_analysis()
        return Response(analysis)


class ImpactOverTimeView(APIView):
    """Retrieves impact metrics over time."""
    
    def get(self, request):
        """Returns impact over time."""
        days = int(request.query_params.get('days', 30))
        impact = AnalyticsEngine.get_impact_over_time(days)
        return Response(impact)


class DonorReportView(APIView):
    """Generates donor report."""
    
    def get(self, request, donor_id):
        """Generates and returns donor report."""

        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        try:
            report = ReportGenerator.generate_donor_report(
                donor_id,
                start_date,
                end_date
            )
            return Response(report)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )