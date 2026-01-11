from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Fixes the admin password for shafiullahshafin'

    def handle(self, *args, **kwargs):
        username = 'shafiullahshafin'
        password = 'ShareEat@1'
        email = 'admin@shareeat.com'

        try:
            user = User.objects.get(username=username)
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Successfully updated password for "{username}" to "{password}"'))
        except User.DoesNotExist:
            User.objects.create_superuser(username, email, password)
            self.stdout.write(self.style.SUCCESS(f'Successfully created superuser "{username}" with password "{password}"'))
