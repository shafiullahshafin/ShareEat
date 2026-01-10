"""
Management command to populate database with Local context test data.
This includes realistic data for Dhaka-based restaurants, NGOs, and food items.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
from decimal import Decimal
import random

from shareeat.apps.donors.models import DonorProfile, DonorSchedule
from shareeat.apps.recipients.models import RecipientProfile, RecipientNeed
from shareeat.apps.volunteers.models import VolunteerProfile, VolunteerAvailability
from shareeat.apps.inventory.models import FoodCategory, FoodItem, Donation, DonationItem, ImpactMetrics


class Command(BaseCommand):
    help = 'Populate database with Local context test data (DEBUG only)'

    def handle(self, *args, **kwargs):
        # if not settings.DEBUG:
        #     self.stdout.write(self.style.ERROR('Cannot run in production! Set DEBUG=True in settings.'))
        #     return
        
        self.stdout.write(self.style.SUCCESS('='*70))
        self.stdout.write(self.style.SUCCESS('Initializing Local Context Data Generation'))
        self.stdout.write(self.style.SUCCESS('='*70 + '\n'))
        
        # 1. Create Food Categories (Local Context)
        self.stdout.write(self.style.WARNING('Creating food categories...'))
        categories_data = [
            ('চাল ও শস্য', 'প্রিমিয়াম চাল (মিনিকেট, নাজিরশাইল), গম এবং শস্য', 'grain', False, 720),
            ('রান্না করা খাবার', 'সদ্য রান্না করা তরকারি, ভাত, বিরিয়ানি, তেহারি', 'restaurant', True, 6),
            ('বেকারি আইটেম', 'তাজা রুটি, বিস্কুট, কেক, প্যাটিস', 'bakery', False, 48),
            ('ডাল ও শস্যদানা', 'মসুর, মুগ এবং অন্যান্য ডাল', 'pulse', False, 1440),
            ('শাকসবজি', 'তাজা মৌসুমী শাকসবজি', 'vegetable', True, 48),
            ('মাছ ও মাংস', 'মুরগি, গরু, খাসি এবং নদীর মাছ', 'meat', True, 4),
            ('দুগ্ধজাত পণ্য', 'দুধ, দই, পনির', 'dairy', True, 72),
            ('ফলমূল', 'মৌসুমী ফল যেমন আম, কাঁঠাল, কলা', 'fruit', False, 168),
            ('শুকনো খাবার', 'চিড়া, মুড়ি, বিস্কুট (জরুরী ত্রাণের জন্য)', 'package', False, 4320),
        ]
        
        categories = {}
        for name, desc, icon, refrig, shelf_life in categories_data:
            cat, _ = FoodCategory.objects.get_or_create(
                name=name,
                defaults={
                    'description': desc,
                    'icon': icon,
                    'requires_refrigeration': refrig,
                    'average_shelf_life_hours': shelf_life
                }
            )
            categories[name] = cat
        
        # 2. Create Donors (Dhaka Restaurants & Convention Centers)
        self.stdout.write(self.style.WARNING('\nCreating donors...'))
        donor_data = [
            ('star_kabab', 'star@example.com', 'Abdul', 'Rahim', 
             'Star Kabab & Restaurant', 'restaurant', '+880 1711-123456', 
             'Dhanmondi 2, Dhaka', Decimal('23.7389'), Decimal('90.3845')),
            
            ('haji_biryani', 'haji@example.com', 'Haji', 'Mohammad', 
             'Haji Biryani', 'restaurant', '+880 1811-234567', 
             'Nazira Bazar, Old Dhaka', Decimal('23.7156'), Decimal('90.4022')),
            
            ('fakruddin_catering', 'fakruddin@example.com', 'Fakruddin', 'Ahmed', 
             'Fakruddin Biryani & Catering', 'catering', '+880 1911-345678', 
             'Gulshan 1, Dhaka', Decimal('23.7786'), Decimal('90.4162')),
            
            ('meena_bazar', 'meena@example.com', 'Meena', 'Manager', 
             'Meena Bazar', 'retail', '+880 1611-456789', 
             'Mirpur 10, Dhaka', Decimal('23.8071'), Decimal('90.3686')),
            
            ('pan_pacific', 'panpacific@example.com', 'Manager', 'Pan Pacific', 
             'Pan Pacific Sonargaon', 'hotel', '+880 1511-567890', 
             'Karwan Bazar, Dhaka', Decimal('23.7517'), Decimal('90.3937')),
             
            ('shumi_hotcake', 'shumi@example.com', 'Shumi', 'Akhter', 
             'Shumi\'s Hot Cake', 'bakery', '+880 1311-678901', 
             'Bailey Road, Dhaka', Decimal('23.7408'), Decimal('90.4093')),
        ]
        
        donors = []
        for username, email, fname, lname, biz_name, biz_type, phone, addr, lat, lon in donor_data:
            user, created = User.objects.get_or_create(
                username=username, 
                defaults={'email': email, 'first_name': fname, 'last_name': lname}
            )
            if created:
                user.set_password('pass1234')
                user.save()
            
            donor, _ = DonorProfile.objects.get_or_create(
                user=user,
                defaults={
                    'business_name': biz_name,
                    'donor_type': biz_type,
                    'phone': phone,
                    'address': addr,
                    'latitude': lat,
                    'longitude': lon,
                    'license_number': f"LIC-{username.upper()}",
                    'is_verified': True
                }
            )
            donors.append(donor)
            
            # Create schedule
            DonorSchedule.objects.get_or_create(
                donor=donor,
                day_of_week=0, # Monday
                defaults={'opening_time': '09:00', 'closing_time': '22:00', 'is_active': True}
            )

        # 3. Create Recipients (Orphanages, Madrasas, Foundations)
        self.stdout.write(self.style.WARNING('\nCreating recipients...'))
        recipient_data = [
            ('anjuman_mufidul', 'anjuman@example.com', 'আঞ্জুমান', 'অ্যাডমিন', 
             'আঞ্জুমান মফিদুল ইসলাম', 'ngo', '+880 1722-123456', 
             'কাকরাইল, Dhaka', Decimal('23.7330'), Decimal('90.4080'), 150),
            
            ('sir_salimullah', 'orphanage@example.com', 'সুপারিনটেনডেন্ট', 'স্যার', 
             'স্যার সলিমুল্লাহ মুসলিম এতিমখানা', 'shelter', '+880 1822-234567', 
             'আজিমপুর, Dhaka', Decimal('23.7225'), Decimal('90.3860'), 200),
            
            ('jaago_foundation', 'jaago@example.com', 'করভি', 'রাকসান্দ', 
             'জাগো ফাউন্ডেশন', 'ngo', '+880 1922-345678', 
             'রায়ের বাজার, Dhaka', Decimal('23.7460'), Decimal('90.3620'), 500),
            
            ('bidyanondo', 'bidyanondo@example.com', 'কিশোর', 'কুমার', 
             'বিদ্যানন্দ ফাউন্ডেশন', 'ngo', '+880 1622-456789', 
             'মিরপুর ১, Dhaka', Decimal('23.7950'), Decimal('90.3530'), 1000),
             
            ('chhayanaut', 'chhayanaut@example.com', 'সাংস্কৃতিক', 'অ্যাডমিন', 
             'ছায়ানট', 'community', '+880 1522-567890', 
             'ধানমন্ডি ১৫, Dhaka', Decimal('23.7500'), Decimal('90.3750'), 100),
        ]
        
        recipients = []
        for username, email, fname, lname, org_name, r_type, phone, addr, lat, lon, cap in recipient_data:
            user, created = User.objects.get_or_create(
                username=username, 
                defaults={'email': email, 'first_name': fname, 'last_name': lname}
            )
            if created:
                user.set_password('pass1234')
                user.save()
            
            recipient, _ = RecipientProfile.objects.get_or_create(
                user=user,
                defaults={
                    'organization_name': org_name,
                    'recipient_type': r_type,
                    'phone': phone,
                    'address': addr,
                    'latitude': lat,
                    'longitude': lon,
                    'capacity': cap,
                    'is_verified': True
                }
            )
            recipients.append(recipient)
            
            # Create needs
            RecipientNeed.objects.get_or_create(
                recipient=recipient,
                food_category='চাল ও শস্য',
                defaults={'quantity_needed': 50, 'priority': 'high'}
            )

        # 4. Create Volunteers (Students, Social Workers)
        self.stdout.write(self.style.WARNING('\nCreating volunteers...'))
        volunteer_data = [
            ('shafin_vol', 'shafin@example.com', 'শফিউল্লাহ', 'শাফিন', 
             '+880 1733-123456', 'উত্তরা, Dhaka', Decimal('23.8728'), Decimal('90.3984'), 'motorcycle'),
            
            ('nusrat_vol', 'nusrat@example.com', 'নুসরাত', 'জাহান', 
             '+880 1833-234567', 'বসুন্ধরা আবাসিক এলাকা, Dhaka', Decimal('23.8130'), Decimal('90.4280'), 'car'),
            
            ('rahim_vol', 'rahim@example.com', 'রহিম', 'উদ্দিন', 
             '+880 1933-345678', 'মোহাম্মদপুর, Dhaka', Decimal('23.7650'), Decimal('90.3600'), 'bicycle'),
        ]
        
        for username, email, fname, lname, phone, addr, lat, lon, vehicle in volunteer_data:
            user, created = User.objects.get_or_create(
                username=username, 
                defaults={'email': email, 'first_name': fname, 'last_name': lname}
            )
            if created:
                user.set_password('pass1234')
                user.save()
            
            VolunteerProfile.objects.get_or_create(
                user=user,
                defaults={
                    'phone': phone,
                    'address': addr,
                    'vehicle_type': vehicle,
                    'has_vehicle': True,
                    'is_verified': True
                }
            )

        # 5. Create Food Items (Inventory)
        self.stdout.write(self.style.WARNING('\nCreating food inventory...'))
        food_items_data = [
            (donors[0], categories['রান্না করা খাবার'], 'কাচ্চি বিরিয়ানি', 20, 'কেজি', 'excellent', 6),
            (donors[0], categories['রান্না করা খাবার'], 'চিকেন রোস্ট', 15, 'কেজি', 'good', 5),
            (donors[1], categories['রান্না করা খাবার'], 'মাটন তেহারি', 30, 'কেজি', 'excellent', 4),
            (donors[2], categories['রান্না করা খাবার'], 'বিফ ভুনা খিচুড়ি', 50, 'কেজি', 'good', 8),
            (donors[3], categories['শাকসবজি'], 'তাজা পালং শাক ও আলু', 100, 'কেজি', 'excellent', 48),
            (donors[4], categories['বেকারি আইটেম'], 'নানা স্বাদের পেস্ট্রি', 10, 'কেজি', 'good', 24),
            (donors[5], categories['বেকারি আইটেম'], 'ক্রিম কেক', 5, 'কেজি', 'good', 12),
        ]
        
        for donor, cat, name, qty, unit, cond, hours in food_items_data:
            expiry = timezone.now() + timedelta(hours=hours)
            pickup = timezone.now() + timedelta(hours=hours-2)
            
            FoodItem.objects.create(
                donor=donor,
                category=cat,
                name=name,
                description=f'অবশিষ্ট কিন্তু তাজা {name}',
                quantity=qty,
                unit=unit,
                condition=cond,
                expiry_date=expiry,
                pickup_before=pickup,
                urgency_level='high' if hours < 6 else 'medium'
            )

        self.stdout.write(self.style.SUCCESS('\nSuccessfully populated database with Local context data!'))
        self.stdout.write(self.style.SUCCESS(f'Created: {len(donors)} Donors, {len(recipients)} Recipients, {len(volunteer_data)} Volunteers'))
