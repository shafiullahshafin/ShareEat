import requests
import logging

logger = logging.getLogger(__name__)

class ReverseGeocoder:
    BASE_URL = "https://nominatim.openstreetmap.org/reverse"
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'ShareEat-App/1.0'
        })
    
    def get_location_name(self, latitude, longitude):
        try:
            params = {
                'lat': float(latitude),
                'lon': float(longitude),
                'format': 'json',
                'zoom': 16,
                'addressdetails': 1
            }
            
            response = self.session.get(
                self.BASE_URL,
                params=params,
                timeout=5
            )
            response.raise_for_status()
            data = response.json()
            address = data.get('address', {})
            
            location_parts = []
            
            if 'shop' in address:
                location_parts.append(address['shop'])
            elif 'amenity' in address:
                location_parts.append(address['amenity'])
            
            if 'neighbourhood' in address:
                location_parts.append(address['neighbourhood'])
            elif 'suburb' in address:
                location_parts.append(address['suburb'])
            
            if 'city' in address:
                location_parts.append(address['city'])
            
            if not location_parts:
                display_name = data.get('display_name', 'Unknown location')
                return ', '.join(display_name.split(',')[:3])
            
            return ', '.join(location_parts)
            
        except Exception as e:
            logger.error(f"Geocoding error: {e}")
            return "Location not available"

class ForwardGeocoder:
    BASE_URL = "https://nominatim.openstreetmap.org/search"
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'ShareEat-App/1.0'
        })
    
    def get_coordinates(self, address):
        try:
            params = {
                'q': address,
                'format': 'json',
                'limit': 1
            }
            
            response = self.session.get(
                self.BASE_URL,
                params=params,
                timeout=5
            )
            response.raise_for_status()
            data = response.json()
            
            if data:
                return float(data[0]['lat']), float(data[0]['lon'])
            return None, None
            
        except Exception as e:
            logger.error(f"Forward geocoding error: {e}")
            return None, None

geocoder = ReverseGeocoder()
forward_geocoder = ForwardGeocoder()

def get_location_from_coordinates(latitude, longitude):
    if not latitude or not longitude:
        return "Location not specified"
    return geocoder.get_location_name(latitude, longitude)

def get_coordinates_from_address(address):
    if not address:
        return None, None
    return forward_geocoder.get_coordinates(address)