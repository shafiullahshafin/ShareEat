from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from decimal import Decimal
from datetime import timedelta

from shareeat.apps.donors.models import DonorProfile, DonorSchedule
from shareeat.apps.recipients.models import RecipientProfile, RecipientNeed
from shareeat.apps.volunteers.models import VolunteerProfile, VolunteerAvailability
from shareeat.apps.inventory.models import FoodCategory, FoodItem, Donation, DonationItem

class Command(BaseCommand):
    help = 'Populate database with CHECKLIST.md test data'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('Initializing Checklist Data Generation...'))

        # 1. Create Admin
        if not User.objects.filter(username='shafiullahshafin').exists():
            User.objects.create_superuser('shafiullahshafin', 'admin@shareeat.com', 'password123')
            self.stdout.write('Created Admin: shafiullahshafin')

        # 2. Food Categories (Ensure they exist)
        cat_cooked, _ = FoodCategory.objects.get_or_create(
            name='Cooked Food',
            defaults={'description': 'Freshly cooked meals', 'requires_refrigeration': True, 'average_shelf_life_hours': 4}
        )
        cat_raw, _ = FoodCategory.objects.get_or_create(
            name='Raw Ingredients',
            defaults={'description': 'Rice, lentils, oil', 'requires_refrigeration': False, 'average_shelf_life_hours': 720}
        )

        # 3. Create Donors
        donors_data = [
            ('agora', 'Agora Superstore', 'retail', 'Gulshan, Dhaka', Decimal('23.7925'), Decimal('90.4078')),
            ('kfc', 'KFC Dhanmondi', 'restaurant', 'Dhanmondi, Dhaka', Decimal('23.7461'), Decimal('90.3742')),
            ('starkabab', 'Star Kabab', 'restaurant', 'Elephant Road, Dhaka', Decimal('23.7413'), Decimal('90.3826')),
        ]

        donors = {}
        for username, biz_name, dtype, addr, lat, lon in donors_data:
            user, created = User.objects.get_or_create(username=username, defaults={'email': f'{username}@example.com'})
            if created:
                user.set_password('password123')
                user.save()
            
            profile, _ = DonorProfile.objects.get_or_create(
                user=user,
                defaults={
                    'business_name': biz_name,
                    'donor_type': dtype,
                    'address': addr,
                    'latitude': lat,
                    'longitude': lon,
                    'is_verified': True,
                    'phone': '01700000000',
                    'license_number': f'LIC-{username.upper()}'
                }
            )
            donors[username] = profile
            self.stdout.write(f'Created Donor: {username}')

        # 4. Create Recipients
        recipients_data = [
            ('sos', 'SOS Children\'s Village', 'orphanage', 'Mirpur, Dhaka', Decimal('23.8042'), Decimal('90.3667')),
            ('bidyanondo', 'Bidyanondo Foundation', 'ngo', 'Mirpur, Dhaka', Decimal('23.7956'), Decimal('90.3537')),
            ('bashabo', 'Bashabo Homeless Shelter', 'shelter', 'Bashabo, Dhaka', Decimal('23.7418'), Decimal('90.4324')),
        ]

        recipients = {}
        for username, org_name, rtype, addr, lat, lon in recipients_data:
            user, created = User.objects.get_or_create(username=username, defaults={'email': f'{username}@example.com'})
            if created:
                user.set_password('password123')
                user.save()
            
            profile, _ = RecipientProfile.objects.get_or_create(
                user=user,
                defaults={
                    'organization_name': org_name,
                    'recipient_type': rtype,
                    'address': addr,
                    'latitude': lat,
                    'longitude': lon,
                    'is_verified': True,
                    'phone': '01800000000',
                    'capacity': 100
                }
            )
            recipients[username] = profile
            self.stdout.write(f'Created Recipient: {username}')

        # 5. Create Volunteers
        volunteers_data = [
            ('rahim', 'motorcycle', 20, 'Dhanmondi, Dhaka', Decimal('23.7461'), Decimal('90.3742')), # Near KFC
            ('karim', 'van', 100, 'Elephant Road, Dhaka', Decimal('23.7413'), Decimal('90.3826')), # Near Star Kabab
            ('suman', 'bicycle', 10, 'Gulshan, Dhaka', Decimal('23.7925'), Decimal('90.4078')), # Near Agora
        ]

        volunteers = {}
        for username, vtype, cap, addr, lat, lon in volunteers_data:
            user, created = User.objects.get_or_create(username=username, defaults={'email': f'{username}@example.com'})
            if created:
                user.set_password('password123')
                user.save()
            
            profile, _ = VolunteerProfile.objects.get_or_create(
                user=user,
                defaults={
                    'vehicle_type': vtype,
                    'vehicle_capacity': cap,
                    'address': addr,
                    'latitude': lat,
                    'longitude': lon,
                    'is_verified': True,
                    'is_available': True, # Important!
                    'phone': '01900000000',
                    'has_vehicle': True
                }
            )
            # Ensure availability is True even if profile existed
            profile.is_available = True
            profile.save()
            volunteers[username] = profile
            self.stdout.write(f'Created Volunteer: {username}')

        # 6. Create Food Items & Donations
        
        # Donation 1: Pending (from Agora)
        item1 = FoodItem.objects.create(
            donor=donors['agora'],
            category=cat_raw,
            name='Rice Bags (50kg)',
            quantity=2,
            unit='bags',
            expiry_date=timezone.now() + timedelta(days=30),
            pickup_before=timezone.now() + timedelta(days=7),
            description='Surplus rice bags'
        )
        
        donation1 = Donation.objects.create(
            donor=donors['agora'],
            recipient=recipients['bidyanondo'], # Must assign a recipient for Donation model
            status='pending',
            notes='Please pickup from back gate',
            scheduled_pickup_time=timezone.now() + timedelta(hours=2),
            scheduled_delivery_time=timezone.now() + timedelta(hours=3)
        )
        DonationItem.objects.create(donation=donation1, food_item=item1, quantity=2)
        self.stdout.write('Created Pending Donation from Agora')

        # Donation 2: Confirmed (KFC -> SOS) -> Should trigger Volunteer Match
        item2 = FoodItem.objects.create(
            donor=donors['kfc'],
            category=cat_cooked,
            name='Fried Chicken Buckets',
            quantity=10,
            unit='buckets',
            expiry_date=timezone.now() + timedelta(hours=6),
            pickup_before=timezone.now() + timedelta(hours=4),
            description='Hot leftover chicken'
        )

        donation2 = Donation.objects.create(
            donor=donors['kfc'],
            recipient=recipients['sos'], # Pre-assign recipient for simplicity
            status='confirmed',
            notes='Urgent pickup needed',
            scheduled_pickup_time=timezone.now() + timedelta(hours=1),
            scheduled_delivery_time=timezone.now() + timedelta(hours=2)
        )
        DonationItem.objects.create(donation=donation2, food_item=item2, quantity=10)
        self.stdout.write('Created Confirmed Donation (KFC -> SOS)')

        # Trigger Delivery Request Logic manually if needed, 
        # but the signal might handle it if we used the API.
        # Since we are using ORM directly, we might need to manually call the planner.
        
        from shareeat.utils.routing import DeliveryPlanner
        from shareeat.apps.volunteers.models import DeliveryRequest

        planner = DeliveryPlanner()
        # Find optimal volunteer
        # Get all active volunteers
        all_volunteers = VolunteerProfile.objects.filter(is_available=True)
        
        best_volunteer, score = planner.find_optimal_volunteer(
            donation2.donor, 
            donation2.recipient, 
            all_volunteers
        )
        
        if best_volunteer:
            self.stdout.write(f'Optimal Volunteer Found: {best_volunteer.user.username} (Score: {score})')
            DeliveryRequest.objects.create(
                donation=donation2,
                volunteer=best_volunteer,
                status='pending'
            )
            self.stdout.write(f'Created Delivery Request for {best_volunteer.user.username}')
        else:
            self.stdout.write(self.style.WARNING('No volunteer found for confirmed donation'))

        self.stdout.write(self.style.SUCCESS('Checklist Data Seeding Complete!'))
