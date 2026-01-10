"""
Optimizes delivery routes.
"""
import openrouteservice
from openrouteservice import client
from django.conf import settings
from typing import List, Tuple, Dict, Optional
from decimal import Decimal
import folium
import logging
from geopy.distance import geodesic

logger = logging.getLogger(__name__)


class RouteOptimizer:
    """Optimizes routes using OpenRouteService API."""
    
    def __init__(self):
        """Initializes client."""
        api_key = settings.OPENROUTESERVICE_API_KEY
        self.client = client.Client(key=api_key) if api_key else None
    
    def calculate_distance(self, coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
        """Calculates distance between coordinates."""
        return geodesic(coord1, coord2).kilometers
    
    def get_route(self, start_coords: Tuple[float, float], end_coords: Tuple[float, float]) -> Optional[Dict]:
        """Retrieves optimized route."""
        if not self.client:
            # Calculates straight-line distance as fallback
            distance = self.calculate_distance(
                (start_coords[1], start_coords[0]),  # Convert to lat, lon
                (end_coords[1], end_coords[0])
            )
            return {
                'distance': distance,
                'duration': distance * 3,  # Rough estimate: 20 km/h average
                'geometry': None,
                'fallback': True
            }
        
        try:
            route = self.client.directions(
                coordinates=[start_coords, end_coords],
                profile='driving-car',
                format='geojson'
            )
            
            properties = route['features'][0]['properties']
            geometry = route['features'][0]['geometry']
            
            return {
                'distance': properties['segments'][0]['distance'] / 1000,  # Convert to km
                'duration': properties['segments'][0]['duration'] / 60,  # Convert to minutes
                'geometry': geometry,
                'fallback': False
            }
        except Exception as e:
            # Fallback on error
            logger.error(f"Routing API error: {e}")
            distance = self.calculate_distance(
                (start_coords[1], start_coords[0]),
                (end_coords[1], end_coords[0])
            )
            return {
                'distance': distance,
                'duration': distance * 3,
                'geometry': None,
                'fallback': True
            }
    
    def optimize_multi_stop_route(self, waypoints: List[Tuple[float, float]]) -> Optional[Dict]:
        """Optimizes route with multiple stops."""
        if not self.client or len(waypoints) < 2:
            return None
        
        try:
            route = self.client.directions(
                coordinates=waypoints,
                profile='driving-car',
                optimize_waypoints=True,
                format='geojson'
            )
            
            properties = route['features'][0]['properties']
            
            total_distance = sum(seg['distance'] for seg in properties['segments']) / 1000
            total_duration = sum(seg['duration'] for seg in properties['segments']) / 60
            
            return {
                'distance': total_distance,
                'duration': total_duration,
                'waypoint_order': properties.get('way_points', []),
                'geometry': route['features'][0]['geometry'],
                'segments': properties['segments']
            }
        except Exception as e:
            logger.error(f"Multi-stop routing error: {e}")
            return None


class DeliveryPlanner:
    """
    Delivery planning and optimization.
    """
    
    def __init__(self):
        self.route_optimizer = RouteOptimizer()
    
    def calculate_delivery_route(self, donor, recipient, volunteer=None) -> Dict:
        """
        Calculate optimal delivery route from donor to recipient.
        
        Returns:
            Dictionary with route details, time estimates, and feasibility
        """
        # Check if coordinates are available
        if not all([donor.latitude, donor.longitude, recipient.latitude, recipient.longitude]):
            return {
                'feasible': False,
                'reason': 'Missing location coordinates'
            }
        
        # Get route information
        donor_coords = (float(donor.longitude), float(donor.latitude))
        recipient_coords = (float(recipient.longitude), float(recipient.latitude))
        
        route = self.route_optimizer.get_route(donor_coords, recipient_coords)
        
        # Calculate time windows
        from django.utils import timezone
        current_time = timezone.now()
        
        return {
            'feasible': True,
            'distance_km': round(route['distance'], 2),
            'duration_minutes': round(route['duration'], 2),
            'estimated_pickup_time': current_time + timezone.timedelta(minutes=30),
            'estimated_delivery_time': current_time + timezone.timedelta(
                minutes=30 + route['duration']
            ),
            'route_geometry': route.get('geometry'),
            'is_fallback': route.get('fallback', False)
        }
    
    def find_optimal_volunteer(self, donor, recipient, available_volunteers):
        """
        Find the best volunteer for a delivery.
        Considers Volunteer->Donor distance, vehicle capacity, and availability.
        
        Returns:
            (best_volunteer, score) or (None, 0) if none suitable
        """
        if not available_volunteers:
            return None, 0
        
        scores = []
        
        # Calculate Donor -> Recipient distance once
        donor_coords = (float(donor.longitude), float(donor.latitude))
        recipient_coords = (float(recipient.longitude), float(recipient.latitude))
        delivery_route = self.route_optimizer.get_route(donor_coords, recipient_coords)
        delivery_distance = delivery_route['distance']
        
        for volunteer in available_volunteers:
            if not volunteer.is_available or not volunteer.is_verified:
                continue
            
            # Calculate Volunteer -> Donor distance
            if volunteer.latitude and volunteer.longitude:
                volunteer_coords = (float(volunteer.longitude), float(volunteer.latitude))
                pickup_route = self.route_optimizer.get_route(volunteer_coords, donor_coords)
                pickup_distance = pickup_route['distance']
            else:
                # Penalty for unknown location
                pickup_distance = 100 
            
            # Total trip distance (approximate)
            total_distance = pickup_distance + delivery_distance
            
            # Scoring factors (Higher is better)
            score = 100
            
            # Distance penalty (closer to pickup is better)
            if pickup_distance > 20:
                score -= 50
            elif pickup_distance > 10:
                score -= 30
            elif pickup_distance > 5:
                score -= 10
                
            # Rating bonus
            score += float(volunteer.rating) * 5
            
            # Experience bonus
            if volunteer.total_deliveries > 50:
                score += 20
            
            # Vehicle bonus
            if volunteer.has_vehicle:
                score += 15
            
            scores.append((volunteer, score))
        
        if not scores:
            return None, 0
        
        # Return volunteer with highest score
        scores.sort(key=lambda x: x[1], reverse=True)
        return scores[0]
    
    def create_delivery_schedule(self, donations, time_window_hours=4):
        """
        Create optimized delivery schedule for multiple donations.
        Groups deliveries by proximity and time constraints.
        
        Returns:
            List of delivery batches with routes
        """
        from django.utils import timezone
        
        # Sort donations by urgency
        sorted_donations = sorted(
            donations,
            key=lambda d: d.scheduled_pickup_time
        )
        
        batches = []
        current_batch = []
        
        for donation in sorted_donations:
            if not current_batch:
                current_batch.append(donation)
            else:
                # Check if can be added to current batch
                last_donation = current_batch[-1]
                time_diff = abs(
                    (donation.scheduled_pickup_time - last_donation.scheduled_pickup_time).total_seconds() / 3600
                )
                
                if time_diff <= time_window_hours:
                    current_batch.append(donation)
                else:
                    batches.append(current_batch)
                    current_batch = [donation]
        
        if current_batch:
            batches.append(current_batch)
        
        return batches


class MapGenerator:
    """Generates interactive maps."""
    
    @staticmethod
    def create_delivery_map(donor, recipient, route_data=None):
        """Creates delivery map."""
        # Centers map
        center_lat = (float(donor.latitude) + float(recipient.latitude)) / 2
        center_lon = (float(donor.longitude) + float(recipient.longitude)) / 2
        
        # Creates map
        m = folium.Map(
            location=[center_lat, center_lon],
            zoom_start=12
        )
        
        # Adds donor marker
        folium.Marker(
            location=[float(donor.latitude), float(donor.longitude)],
            popup=f"<b>Donor:</b> {donor.business_name}",
            icon=folium.Icon(color='blue', icon='home')
        ).add_to(m)
        
        # Adds recipient marker
        recipient_name = recipient.organization_name or "Recipient"
        folium.Marker(
            location=[float(recipient.latitude), float(recipient.longitude)],
            popup=f"<b>Recipient:</b> {recipient_name}",
            icon=folium.Icon(color='green', icon='heart')
        ).add_to(m)
        
        # Adds route line
        if route_data and route_data.get('route_geometry'):
            coords = route_data['route_geometry']['coordinates']
            # Convert [lon, lat] to [lat, lon] for Folium
            route_coords = [[lat, lon] for lon, lat in coords]
            folium.PolyLine(
                route_coords,
                color='red',
                weight=3,
                opacity=0.7
            ).add_to(m)
        else:
            # Draws straight line
            folium.PolyLine(
                [
                    [float(donor.latitude), float(donor.longitude)],
                    [float(recipient.latitude), float(recipient.longitude)]
                ],
                color='red',
                weight=3,
                opacity=0.5,
                dash_array='10'
            ).add_to(m)
        
        return m
    
    @staticmethod
    def create_multi_delivery_map(donations):
        """Creates multi-delivery map."""
        if not donations:
            return None
        
        # Calculates center
        lats = []
        lons = []
        
        for donation in donations:
            if donation.donor.latitude:
                lats.append(float(donation.donor.latitude))
                lons.append(float(donation.donor.longitude))
            if donation.recipient.latitude:
                lats.append(float(donation.recipient.latitude))
                lons.append(float(donation.recipient.longitude))
        
        if not lats:
            return None
        
        center_lat = sum(lats) / len(lats)
        center_lon = sum(lons) / len(lons)
        
        # Creates map
        m = folium.Map(
            location=[center_lat, center_lon],
            zoom_start=11
        )
        
        # Adds markers
        for i, donation in enumerate(donations, 1):
            # Adds donor marker
            folium.Marker(
                location=[float(donation.donor.latitude), float(donation.donor.longitude)],
                popup=f"<b>Pickup {i}:</b> {donation.donor.business_name}",
                icon=folium.Icon(color='blue', icon='home')
            ).add_to(m)
            
            # Adds recipient marker
            recipient_name = donation.recipient.organization_name or "Recipient"
            folium.Marker(
                location=[float(donation.recipient.latitude), float(donation.recipient.longitude)],
                popup=f"<b>Delivery {i}:</b> {recipient_name}",
                icon=folium.Icon(color='green', icon='heart')
            ).add_to(m)
            
            # Connects with line
            folium.PolyLine(
                [
                    [float(donation.donor.latitude), float(donation.donor.longitude)],
                    [float(donation.recipient.latitude), float(donation.recipient.longitude)]
                ],
                color='red',
                weight=2,
                opacity=0.6
            ).add_to(m)
        
        return m


def calculate_carbon_footprint(distance_km: float, vehicle_type: str = 'car') -> float:
    """Calculates CO2 emissions."""
    # Defines emissions per km
    emissions_per_km = {
        'bicycle': 0,
        'motorcycle': 0.06,
        'car': 0.12,
        'van': 0.18,
        'truck': 0.25
    }
    
    factor = emissions_per_km.get(vehicle_type, 0.12)
    return distance_km * factor