from django.test import TestCase, override_settings
from django.core import mail
from django.contrib.auth.models import User
from shareeat.apps.donors.models import DonorProfile
from shareeat.apps.recipients.models import RecipientProfile
from shareeat.apps.inventory.models import FoodItem, Donation, FoodCategory, DonationItem
from shareeat.apps.volunteers.models import VolunteerProfile
from rest_framework.test import APIClient
from django.utils import timezone
from datetime import timedelta

class AdminEmailNotificationTest(TestCase):
    def setUp(self):
        # Create Users
        self.donor_user = User.objects.create_user(username='donor', password='password')
        self.recipient_user = User.objects.create_user(username='recipient', password='password')
        self.admin_user = User.objects.create_superuser(username='admin', password='password')

        # Create Profiles
        self.donor_profile = DonorProfile.objects.create(
            user=self.donor_user, 
            business_name="Test Donor",
            phone="1234567890",
            address="123 Donor St"
        )
        self.recipient_profile = RecipientProfile.objects.create(
            user=self.recipient_user, 
            organization_name="Test Recipient",
            capacity=100,
            phone="0987654321",
            address="456 Recipient Rd",
            recipient_type="ngo"
        )

        # Create Category
        self.category = FoodCategory.objects.create(name="Test Category")

        # Create Food Item
        self.food_item = FoodItem.objects.create(
            donor=self.donor_profile,
            category=self.category,
            name="Test Food",
            quantity=10,
            expiry_date=timezone.now() + timedelta(days=1),
            pickup_before=timezone.now() + timedelta(hours=5)
        )

        # Create Donation (Pending)
        self.donation = Donation.objects.create(
            donor=self.donor_profile,
            recipient=self.recipient_profile,
            status='pending',
            scheduled_pickup_time=timezone.now() + timedelta(hours=1),
            scheduled_delivery_time=timezone.now() + timedelta(hours=2)
        )
        DonationItem.objects.create(donation=self.donation, food_item=self.food_item, quantity=5)

        self.client = APIClient()
        self.client.force_authenticate(user=self.donor_user)

    @override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
    def test_no_volunteer_email_trigger(self):
        # Ensure NO volunteers exist
        VolunteerProfile.objects.all().delete()

        # Call the confirm endpoint
        url = f'/api/donations/{self.donation.id}/confirm/'
        response = self.client.post(url)
        
        # Check response
        self.assertEqual(response.status_code, 200)
        self.donation.refresh_from_db()
        self.assertEqual(self.donation.status, 'pending_manual_assignment')

        # Check Email
        relevant_emails = [e for e in mail.outbox if 'shafiullahshafin00@gmail.com' in e.to]
        
        self.assertTrue(len(relevant_emails) > 0, "No email sent to admin")
        email = relevant_emails[0]
        self.assertIn(f"Urgent: No Volunteer Available for Donation #{self.donation.id}", email.subject)
