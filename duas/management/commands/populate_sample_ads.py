from django.core.management.base import BaseCommand
from duas.models import Ad
from django.utils import timezone

class Command(BaseCommand):
    help = 'Populate sample advertisements data'

    def handle(self, *args, **options):
        self.stdout.write('🔄 Creating sample advertisements...')
        
        # Sample ads data with Ionicons
        sample_ads = [
            {
                'id': '1',
                'title': 'Premium Features',
                'text': 'Unlock unlimited duas and ad-free experience',
                'action_text': 'Upgrade Now',
                'action_color': '#2c5530',
                'text_color': '#495057',
                'title_color': '#2c5530',
                'link': 'https://google.com',
                'icon_name': 'star',
                'icon_color': '#2c5530',
                'is_active': True,
                'priority': 1
            },
            {
                'id': '2',
                'title': 'Daily Reminders',
                'text': 'Never miss your prayers with smart notifications',
                'action_text': 'Set Reminder',
                'action_color': '#28a745',
                'text_color': '#495057',
                'title_color': '#28a745',
                'link': 'https://google.com',
                'icon_name': 'notifications',
                'icon_color': '#28a745',
                'is_active': True,
                'priority': 2
            },
            {
                'id': '3',
                'title': 'Share with Friends',
                'text': 'Spread the blessings of dua and zikr',
                'action_text': 'Share App',
                'action_color': '#007bff',
                'text_color': '#495057',
                'title_color': '#007bff',
                'link': 'https://google.com',
                'icon_name': 'share-social',
                'icon_color': '#007bff',
                'is_active': True,
                'priority': 3
            },
            {
                'id': '4',
                'title': 'Quran Recitation',
                'text': 'Listen to beautiful Quran recitations daily',
                'action_text': 'Listen Now',
                'action_color': '#6f42c1',
                'text_color': '#495057',
                'title_color': '#6f42c1',
                'link': 'https://google.com',
                'icon_name': 'book',
                'icon_color': '#6f42c1',
                'is_active': True,
                'priority': 4
            },
            {
                'id': '5',
                'title': 'Islamic Calendar',
                'text': 'Stay updated with Islamic dates and events',
                'action_text': 'View Calendar',
                'action_color': '#fd7e14',
                'text_color': '#495057',
                'title_color': '#fd7e14',
                'link': 'https://google.com',
                'icon_name': 'calendar',
                'icon_color': '#fd7e14',
                'is_active': True,
                'priority': 5
            },
            {
                'id': '6',
                'title': 'Prayer Times',
                'text': 'Get accurate prayer times for your location',
                'action_text': 'Check Times',
                'action_color': '#17a2b8',
                'text_color': '#495057',
                'title_color': '#17a2b8',
                'link': 'https://google.com',
                'icon_name': 'moon',
                'icon_color': '#17a2b8',
                'is_active': True,
                'priority': 6
            },
            {
                'id': '7',
                'title': 'Daily Progress',
                'text': 'Track your spiritual journey and growth',
                'action_text': 'View Progress',
                'action_color': '#20c997',
                'text_color': '#495057',
                'title_color': '#20c997',
                'link': 'https://google.com',
                'icon_name': 'trending-up',
                'icon_color': '#20c997',
                'is_active': True,
                'priority': 7
            },
            {
                'id': '8',
                'title': 'Community',
                'text': 'Connect with fellow believers worldwide',
                'action_text': 'Join Community',
                'action_color': '#e83e8c',
                'text_color': '#495057',
                'title_color': '#e83e8c',
                'link': 'https://google.com',
                'icon_name': 'people',
                'icon_color': '#e83e8c',
                'is_active': True,
                'priority': 8
            }
        ]
        
        created_count = 0
        updated_count = 0
        
        for ad_data in sample_ads:
            ad, created = Ad.objects.update_or_create(
                id=ad_data['id'],
                defaults=ad_data
            )
            
            if created:
                created_count += 1
                self.stdout.write(f'✅ Created ad: {ad.title} (Icon: {ad.icon_name})')
            else:
                updated_count += 1
                self.stdout.write(f'🔄 Updated ad: {ad.title} (Icon: {ad.icon_name})')
        
        self.stdout.write(
            self.style.SUCCESS(
                f'🎉 Sample advertisements populated successfully!\n'
                f'📊 Created: {created_count}, Updated: {updated_count}\n'
                f'🎨 Icons used: star, notifications, share-social, book, calendar, moon, trending-up, people'
            )
        )
