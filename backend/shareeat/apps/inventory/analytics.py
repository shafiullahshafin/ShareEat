"""
Analytics engine for generating insights and reports.
"""
from django.db.models import Sum, Avg, Count, Q, F
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from .models import Donation, FoodItem, ImpactMetrics


class AnalyticsEngine:
    """
    Analytics engine for generating reports and insights.
    """
    
    @staticmethod
    def get_dashboard_stats():
        """
        Get overall dashboard statistics.
        Returns key metrics for the main dashboard.
        """
        # Donation stats
        total_donations = Donation.objects.count()
        active_donations = Donation.objects.filter(
            status__in=['pending', 'confirmed', 'picked_up', 'in_transit']
        ).count()
        completed_donations = Donation.objects.filter(status='completed').count()
        
        # Food stats
        available_food = FoodItem.objects.filter(is_available=True).count()
        urgent_food = FoodItem.objects.filter(
            is_available=True,
            urgency_level__in=['critical', 'high']
        ).count()
        
        # Impact stats
        impact_totals = ImpactMetrics.objects.aggregate(
            total_waste_prevented=Sum('food_waste_prevented_kg'),
            total_co2_saved=Sum('co2_emissions_saved_kg'),
            total_meals=Sum('meals_provided'),
            total_people_fed=Sum('people_fed')
        )
        
        return {
            'donations': {
                'total': total_donations,
                'active': active_donations,
                'completed': completed_donations,
                'completion_rate': round((completed_donations / total_donations * 100) if total_donations > 0 else 0, 2)
            },
            'food_items': {
                'available': available_food,
                'urgent': urgent_food
            },
            'impact': {
                'waste_prevented_kg': float(impact_totals['total_waste_prevented'] or 0),
                'co2_saved_kg': float(impact_totals['total_co2_saved'] or 0),
                'meals_provided': impact_totals['total_meals'] or 0,
                'people_fed': impact_totals['total_people_fed'] or 0
            }
        }
    
    @staticmethod
    def get_donation_trends(days=30):
        """
        Get donation trends over time.
        Returns daily donation counts and weights.
        """
        start_date = timezone.now() - timedelta(days=days)
        
        donations = Donation.objects.filter(
            created_at__gte=start_date
        ).extra(
            select={'date': 'DATE(created_at)'}
        ).values('date').annotate(
            count=Count('id'),
            total_weight=Sum('total_weight'),
            total_meals=Sum('estimated_meals')
        ).order_by('date')
        
        return list(donations)
    
    @staticmethod
    def get_donor_performance():
        """
        Get top performing donors.
        Ranks donors by total donations and impact.
        """
        from shareeat.apps.donors.models import DonorProfile
        
        donors = DonorProfile.objects.annotate(
            donation_count=Count('donations'),
            total_weight_donated=Sum('donations__total_weight'),
            total_meals_provided=Sum('donations__estimated_meals')
        ).filter(
            donation_count__gt=0
        ).order_by('-total_weight_donated')[:10]
        
        results = []
        for donor in donors:
            results.append({
                'id': donor.id,
                'business_name': donor.business_name,
                'donor_type': donor.get_donor_type_display(),
                'donation_count': donor.donation_count,
                'total_weight_kg': float(donor.total_weight_donated or 0),
                'total_meals': donor.total_meals_provided or 0,
                'rating': float(donor.rating)
            })
        
        return results
    
    @staticmethod
    def get_recipient_impact():
        """
        Get recipients by impact received.
        Shows which organizations are being served most.
        """
        from shareeat.apps.recipients.models import RecipientProfile
        
        recipients = RecipientProfile.objects.annotate(
            donations_received=Count('received_donations'),
            total_weight_received=Sum('received_donations__total_weight'),
            total_meals_received=Sum('received_donations__estimated_meals')
        ).filter(
            donations_received__gt=0
        ).order_by('-total_meals_received')[:10]
        
        results = []
        for recipient in recipients:
            results.append({
                'id': recipient.id,
                'organization_name': recipient.organization_name or recipient.user.get_full_name(),
                'recipient_type': recipient.get_recipient_type_display(),
                'donations_received': recipient.donations_received,
                'total_weight_kg': float(recipient.total_weight_received or 0),
                'total_meals': recipient.total_meals_received or 0,
                'capacity': recipient.capacity,
                'occupancy_percentage': recipient.occupancy_percentage
            })
        
        return results
    
    @staticmethod
    def get_food_category_distribution():
        """
        Get distribution of food by category.
        Shows which types of food are being donated most.
        """
        from .models import FoodCategory
        
        categories = FoodCategory.objects.annotate(
            item_count=Count('items'),
            total_quantity=Sum('items__quantity')
        ).filter(
            item_count__gt=0
        ).order_by('-total_quantity')
        
        return [
            {
                'category': cat.name,
                'item_count': cat.item_count,
                'total_quantity_kg': float(cat.total_quantity or 0)
            }
            for cat in categories
        ]
    
    @staticmethod
    def get_urgency_breakdown():
        """
        Get breakdown of food items by urgency level.
        Critical for understanding time-sensitive inventory.
        """
        urgency_stats = FoodItem.objects.filter(
            is_available=True
        ).values('urgency_level').annotate(
            count=Count('id'),
            total_quantity=Sum('quantity')
        ).order_by('urgency_level')
        
        urgency_map = {
            'critical': 'Critical (< 2 hours)',
            'high': 'High (< 6 hours)',
            'medium': 'Medium (< 24 hours)',
            'low': 'Low (> 24 hours)'
        }
        
        return [
            {
                'urgency_level': stat['urgency_level'],
                'urgency_display': urgency_map.get(stat['urgency_level'], stat['urgency_level']),
                'count': stat['count'],
                'total_quantity_kg': float(stat['total_quantity'] or 0)
            }
            for stat in urgency_stats
        ]
    
    @staticmethod
    def get_volunteer_leaderboard():
        """
        Get top volunteers by deliveries completed.
        Gamification element to encourage participation.
        """
        from shareeat.apps.volunteers.models import VolunteerProfile
        
        volunteers = VolunteerProfile.objects.annotate(
            completed_deliveries=Count(
                'deliveries',
                filter=Q(deliveries__status='completed')
            ),
            total_weight_delivered=Sum(
                'deliveries__total_weight',
                filter=Q(deliveries__status='completed')
            ),
            total_meals_delivered=Sum(
                'deliveries__estimated_meals',
                filter=Q(deliveries__status='completed')
            )
        ).filter(
            completed_deliveries__gt=0
        ).order_by('-completed_deliveries')[:10]
        
        results = []
        for vol in volunteers:
            results.append({
                'id': vol.id,
                'name': vol.user.get_full_name() or vol.user.username,
                'completed_deliveries': vol.completed_deliveries,
                'total_weight_kg': float(vol.total_weight_delivered or 0),
                'total_meals': vol.total_meals_delivered or 0,
                'rating': float(vol.rating),
                'has_vehicle': vol.has_vehicle,
                'vehicle_type': vol.get_vehicle_type_display() if vol.vehicle_type else 'N/A'
            })
        
        return results
    
    @staticmethod
    def get_time_slot_analysis():
        """
        Analyze which time slots have most donation activity.
        Helps optimize scheduling.
        """
        from django.db.models.functions import ExtractHour
        
        hourly_stats = Donation.objects.annotate(
            hour=ExtractHour('scheduled_pickup_time')
        ).values('hour').annotate(
            count=Count('id')
        ).order_by('hour')
        
        return list(hourly_stats)
    
    @staticmethod
    def get_impact_over_time(days=30):
        """
        Get cumulative impact metrics over time.
        Shows growth in environmental and social impact.
        """
        start_date = timezone.now() - timedelta(days=days)
        
        daily_impact = ImpactMetrics.objects.filter(
            calculated_at__gte=start_date
        ).extra(
            select={'date': 'DATE(calculated_at)'}
        ).values('date').annotate(
            waste_prevented=Sum('food_waste_prevented_kg'),
            co2_saved=Sum('co2_emissions_saved_kg'),
            meals=Sum('meals_provided'),
            people_fed=Sum('people_fed')
        ).order_by('date')
        
        return list(daily_impact)


class ReportGenerator:
    """
    Generate formatted reports for different stakeholders.
    """
    
    @staticmethod
    def generate_donor_report(donor_id, start_date=None, end_date=None):
        """
        Generate comprehensive report for a donor.
        Includes donations, impact, and recommendations.
        """
        from shareeat.apps.donors.models import DonorProfile
        
        donor = DonorProfile.objects.get(id=donor_id)
        
        # Filter donations by date range
        donations_qs = donor.donations.all()
        if start_date:
            donations_qs = donations_qs.filter(created_at__gte=start_date)
        if end_date:
            donations_qs = donations_qs.filter(created_at__lte=end_date)
        
        # Calculate statistics
        stats = donations_qs.aggregate(
            total_donations=Count('id'),
            completed_donations=Count('id', filter=Q(status='completed')),
            total_weight=Sum('total_weight'),
            total_meals=Sum('estimated_meals'),
            avg_rating=Avg('rating', filter=Q(rating__isnull=False))
        )
        
        # Get impact
        impact = ImpactMetrics.objects.filter(
            donation__donor=donor
        ).aggregate(
            total_waste_prevented=Sum('food_waste_prevented_kg'),
            total_co2_saved=Sum('co2_emissions_saved_kg'),
            total_tax_deduction=Sum('tax_deduction_amount')
        )
        
        return {
            'donor': {
                'id': donor.id,
                'business_name': donor.business_name,
                'donor_type': donor.get_donor_type_display(),
                'rating': float(donor.rating)
            },
            'period': {
                'start_date': start_date,
                'end_date': end_date
            },
            'statistics': {
                'total_donations': stats['total_donations'] or 0,
                'completed_donations': stats['completed_donations'] or 0,
                'total_weight_kg': float(stats['total_weight'] or 0),
                'total_meals_provided': stats['total_meals'] or 0,
                'average_rating': float(stats['avg_rating'] or 0)
            },
            'impact': {
                'waste_prevented_kg': float(impact['total_waste_prevented'] or 0),
                'co2_saved_kg': float(impact['total_co2_saved'] or 0),
                'tax_deduction_amount': float(impact['total_tax_deduction'] or 0)
            }
        }