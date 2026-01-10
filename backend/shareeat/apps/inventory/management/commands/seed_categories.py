from django.core.management.base import BaseCommand
from shareeat.apps.inventory.models import FoodCategory

class Command(BaseCommand):
    help = 'Seeds initial food categories'

    def handle(self, *args, **kwargs):
        categories = [
            {
                'name': 'Fruits & Vegetables',
                'description': 'Fresh produce including fruits and vegetables',
                'icon': 'apple',
                'requires_refrigeration': True,
                'average_shelf_life_hours': 168  # 7 days
            },
            {
                'name': 'Dairy & Eggs',
                'description': 'Milk, cheese, yogurt, and eggs',
                'icon': 'egg',
                'requires_refrigeration': True,
                'average_shelf_life_hours': 336  # 14 days
            },
            {
                'name': 'Bakery & Bread',
                'description': 'Bread, pastries, and baked goods',
                'icon': 'bread',
                'requires_refrigeration': False,
                'average_shelf_life_hours': 72  # 3 days
            },
            {
                'name': 'Meat & Poultry',
                'description': 'Fresh and frozen meat and poultry',
                'icon': 'drumstick',
                'requires_refrigeration': True,
                'average_shelf_life_hours': 72  # 3 days
            },
            {
                'name': 'Seafood',
                'description': 'Fresh and frozen fish and seafood',
                'icon': 'fish',
                'requires_refrigeration': True,
                'average_shelf_life_hours': 48  # 2 days
            },
            {
                'name': 'Canned & Packaged Food',
                'description': 'Canned goods, pasta, rice, and other shelf-stable items',
                'icon': 'can',
                'requires_refrigeration': False,
                'average_shelf_life_hours': 8760  # 1 year
            },
            {
                'name': 'Prepared Meals',
                'description': 'Cooked meals ready to eat or heat',
                'icon': 'utensils',
                'requires_refrigeration': True,
                'average_shelf_life_hours': 48  # 2 days
            },
            {
                'name': 'Beverages',
                'description': 'Drinks, juices, and water',
                'icon': 'bottle',
                'requires_refrigeration': False,
                'average_shelf_life_hours': 4320  # 6 months
            },
            {
                'name': 'Frozen Food',
                'description': 'Items stored in the freezer',
                'icon': 'snowflake',
                'requires_refrigeration': True,
                'average_shelf_life_hours': 4320  # 6 months
            },
             {
                'name': 'Snacks',
                'description': 'Chips, cookies, nuts, and other snacks',
                'icon': 'cookie',
                'requires_refrigeration': False,
                'average_shelf_life_hours': 4320  # 6 months
            }
        ]

        for cat_data in categories:
            category, created = FoodCategory.objects.get_or_create(
                name=cat_data['name'],
                defaults=cat_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created category: {category.name}'))
            else:
                self.stdout.write(self.style.WARNING(f'Category already exists: {category.name}'))
