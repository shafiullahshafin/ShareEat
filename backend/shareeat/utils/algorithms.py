"""
Algorithm utilities for food matching and prioritization.
"""
from typing import List, Dict, Tuple
from decimal import Decimal
from django.db.models import Q
from datetime import datetime, timedelta


class FoodMatchingAlgorithm:
    """Implements logic to match available food items with the most suitable recipients."""
    
    @staticmethod
    def calculate_match_score(food_item, recipient) -> float:
        """Computes a compatibility score based on urgency, capacity, proximity, and specific needs."""
        score = 0.0
        
        # Calculates urgency score
        urgency_scores = {
            'critical': 40,
            'high': 30,
            'medium': 20,
            'low': 10
        }
        score += urgency_scores.get(food_item.urgency_level, 0)
        
        # Calculates capacity score
        if recipient.available_capacity > 0:
            capacity_ratio = min(1.0, food_item.quantity / recipient.available_capacity)
            score += capacity_ratio * 30
        
        # Calculates distance score
        # For now, just give max points if both have coordinates
        if food_item.donor.latitude and recipient.latitude:
            score += 20
        
        # Calculates needs match score
        matching_needs = recipient.needs.filter(
            food_category__iexact=food_item.category.name,
            is_active=True
        )
        if matching_needs.exists():
            score += 10
        
        return score
    
    @staticmethod
    def find_best_matches(food_item, max_matches=5):
        """Identifies and returns the top-ranking recipient matches for a given food item."""
        from shareeat.apps.recipients.models import RecipientProfile
        
        # Retrieves verified recipients with capacity
        recipients = RecipientProfile.objects.filter(
            is_verified=True,
            capacity__gt=0
        )
        
        # Calculates scores
        matches = []
        for recipient in recipients:
            if recipient.can_accept_donation(food_item.quantity):
                score = FoodMatchingAlgorithm.calculate_match_score(food_item, recipient)
                matches.append((recipient, score))
        
        # Sorts and returns top matches
        matches.sort(key=lambda x: x[1], reverse=True)
        return matches[:max_matches]


class FoodPrioritizationEngine:
    """Engines for determining the priority order of food items based on urgency and freshness."""
    
    @staticmethod
    def calculate_priority_score(food_item) -> float:
        """Computes a priority score derived from expiry time, freshness index, and quantity."""
        score = 0.0
        
        # Calculates time urgency
        hours_left = food_item.hours_until_expiry
        if hours_left <= 2:
            score += 50
        elif hours_left <= 6:
            score += 40
        elif hours_left <= 12:
            score += 30
        elif hours_left <= 24:
            score += 20
        else:
            score += 10
        
        # Calculates freshness score
        freshness_normalized = (food_item.freshness_score / 100) * 30
        score += freshness_normalized
        
        # Calculates quantity factor
        # Higher quantity = higher priority (more people can be fed)
        if food_item.quantity >= 50:
            score += 20
        elif food_item.quantity >= 20:
            score += 15
        elif food_item.quantity >= 10:
            score += 10
        else:
            score += 5
        
        return score
    
    @staticmethod
    def get_prioritized_items(queryset, limit=None):
        """
        Retrieves a list of food items sorted by their calculated priority score.
        """
        items_with_scores = []
        
        for item in queryset:
            if item.is_available and not item.is_expired:
                score = FoodPrioritizationEngine.calculate_priority_score(item)
                items_with_scores.append((item, score))
        
        # Sort by score (descending)
        items_with_scores.sort(key=lambda x: x[1], reverse=True)
        
        if limit:
            items_with_scores = items_with_scores[:limit]
        
        return [item for item, score in items_with_scores]


class DonationOptimizer:
    """
    Optimizes the creation of donation batches to maximize utility within constraints.
    """
    
    @staticmethod
    def create_optimal_batch(food_items, recipient, max_weight=None):
        """
        Constructs an optimal batch of food items for a recipient using a greedy approach.
        
        Returns: List of (food_item, quantity) tuples
        """
        if not recipient.is_verified:
            return []
        
        available_capacity = recipient.available_capacity
        if available_capacity <= 0:
            return []
        
        # Sort items by priority
        prioritized_items = FoodPrioritizationEngine.get_prioritized_items(food_items)
        
        batch = []
        total_weight = Decimal('0')
        
        for item in prioritized_items:
            # Check weight constraint
            if max_weight and total_weight >= max_weight:
                break
            
            # Calculate how much we can take
            available_quantity = min(
                item.quantity,
                available_capacity - total_weight
            )
            
            if max_weight:
                available_quantity = min(
                    available_quantity,
                    max_weight - total_weight
                )
            
            if available_quantity > 0:
                batch.append((item, available_quantity))
                total_weight += available_quantity
        
        return batch
    
    @staticmethod
    def estimate_meals_from_batch(batch):
        """Estimates the number of meals provided based on the total weight of the batch."""
        total_weight = sum(quantity for _, quantity in batch)
        return int(total_weight / Decimal('0.4'))


def calculate_freshness_index(food_items):
    """Computes the average freshness index for a collection of food items."""
    if not food_items:
        return 0
    
    total_score = sum(item.freshness_score for item in food_items)
    return total_score / len(food_items)


def get_expiring_soon_items(hours=24):
    """Fetches food items that are approaching their expiry time within a specified window."""
    from django.utils import timezone
    from shareeat.apps.inventory.models import FoodItem
    
    cutoff_time = timezone.now() + timedelta(hours=hours)
    
    return FoodItem.objects.filter(
        is_available=True,
        expiry_date__lte=cutoff_time,
        expiry_date__gt=timezone.now()
    ).order_by('expiry_date')