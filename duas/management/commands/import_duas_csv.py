from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from duas.models import Category, Dua
import csv
import os

User = get_user_model()

class Command(BaseCommand):
    help = 'Import multiple duas from a CSV file'

    def add_arguments(self, parser):
        parser.add_argument(
            'csv_file',
            type=str,
            help='Path to the CSV file containing dua data'
        )
        parser.add_argument(
            '--admin-email',
            type=str,
            default='admin@example.com',
            help='Email of admin user to associate with imported duas'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be imported without actually importing'
        )

    def handle(self, *args, **options):
        csv_file = options['csv_file']
        admin_email = options['admin_email']
        dry_run = options['dry_run']

        if not os.path.exists(csv_file):
            self.stdout.write(
                self.style.ERROR(f'CSV file not found: {csv_file}')
            )
            return

        # Get admin user
        try:
            admin_user = User.objects.get(email=admin_email, is_staff=True)
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'Admin user not found: {admin_email}')
            )
            return

        # Get category mapping
        categories = {cat.slug: cat for cat in Category.objects.all()}
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('DRY RUN MODE - No data will be imported')
            )

        imported_count = 0
        error_count = 0

        with open(csv_file, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            
            for row_num, row in enumerate(reader, start=2):  # Start from 2 (1 is header)
                try:
                    # Process the row
                    dua_data = self.process_csv_row(row, categories)
                    
                    if dry_run:
                        self.stdout.write(
                            f"Would import: {dua_data.get('title_en', 'No title')} "
                            f"(Category: {dua_data.get('category_name', 'Unknown')})"
                        )
                        continue

                    # Create the dua
                    dua = Dua.objects.create(**dua_data)
                    imported_count += 1
                    
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"Imported: {dua.title_en} (ID: {dua.id})"
                        )
                    )

                except Exception as e:
                    error_count += 1
                    self.stdout.write(
                        self.style.ERROR(
                            f"Error on row {row_num}: {str(e)}"
                        )
                    )

        if dry_run:
            self.stdout.write(
                self.style.WARNING(f'Dry run completed. Would import {imported_count} duas.')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f'Import completed! Imported: {imported_count}, Errors: {error_count}'
                )
            )

    def process_csv_row(self, row, categories):
        """Process a CSV row and return dua data"""
        
        # Get category
        category_slug = row.get('category_slug', '').strip()
        if not category_slug or category_slug not in categories:
            raise ValueError(f"Invalid category slug: {category_slug}")
        
        category = categories[category_slug]
        
        # Process multi-language fields
        title_en = row.get('title_en', '').strip()
        if not title_en:
            raise ValueError("English title is required")
        
        # Build dua data
        dua_data = {
            'type': row.get('type', 'traditional').strip(),
            'category': category,
            'priority': int(row.get('priority', 3)),
            'tags': [tag.strip() for tag in row.get('tags', '').split(',') if tag.strip()],
            'dua_text': row.get('dua_text', '').strip(),
            
            # Multi-language titles
            'title_en': title_en,
            'title_bn': row.get('title_bn', '').strip(),
            'title_ar': row.get('title_ar', '').strip(),
            'title_ur': row.get('title_ur', '').strip(),
            'title_de': row.get('title_de', '').strip(),
            'title_es': row.get('title_es', '').strip(),
            'title_id': row.get('title_id', '').strip(),
            
            # Multi-language transliterations
            'transliteration_en': row.get('transliteration_en', '').strip(),
            'transliteration_bn': row.get('transliteration_bn', '').strip(),
            'transliteration_ar': row.get('transliteration_ar', '').strip(),
            'transliteration_ur': row.get('transliteration_ur', '').strip(),
            'transliteration_de': row.get('transliteration_de', '').strip(),
            'transliteration_es': row.get('transliteration_es', '').strip(),
            'transliteration_id': row.get('transliteration_id', '').strip(),
            
            # Multi-language translations
            'translation_en': row.get('translation_en', '').strip(),
            'translation_bn': row.get('translation_bn', '').strip(),
            'translation_ar': row.get('translation_ar', '').strip(),
            'translation_ur': row.get('translation_ur', '').strip(),
            'translation_de': row.get('translation_de', '').strip(),
            'translation_es': row.get('translation_es', '').strip(),
            'translation_id': row.get('translation_id', '').strip(),
            
            # Multi-language explanations
            'explanation_en': row.get('explanation_en', '').strip(),
            'explanation_bn': row.get('explanation_bn', '').strip(),
            'explanation_ar': row.get('explanation_ar', '').strip(),
            'explanation_ur': row.get('explanation_ur', '').strip(),
            'explanation_de': row.get('explanation_de', '').strip(),
            'explanation_es': row.get('explanation_es', '').strip(),
            'explanation_id': row.get('explanation_id', '').strip(),
            
            # Multi-language benefits
            'benefits_en': row.get('benefits_en', '').strip(),
            'benefits_bn': row.get('benefits_bn', '').strip(),
            'benefits_ar': row.get('benefits_ar', '').strip(),
            'benefits_ur': row.get('benefits_ur', '').strip(),
            'benefits_de': row.get('benefits_de', '').strip(),
            'benefits_es': row.get('benefits_es', '').strip(),
            'benefits_id': row.get('benefits_id', '').strip(),
            
            # Audio information
            'reciter': row.get('reciter', '').strip(),
            'duration': row.get('duration', '').strip(),
            
            # Hadith references
            'hadith_book_name': row.get('hadith_book_name', '').strip(),
            'hadith_chapter': row.get('hadith_chapter', '').strip(),
            'hadith_number': row.get('hadith_number', '').strip(),
            
            # Usage information
            'when_to_recite': [item.strip() for item in row.get('when_to_recite', '').split(',') if item.strip()],
            'frequency': row.get('frequency', 'daily').strip(),
            'difficulty': row.get('difficulty', 'beginner').strip(),
            'estimated_time': row.get('estimated_time', '').strip(),
            'related_duas': [item.strip() for item in row.get('related_duas', '').split(',') if item.strip()],
            'notes': row.get('notes', '').strip(),
            
            # Quran references
            'quran_surah': int(row.get('quran_surah', 0)) if row.get('quran_surah') else None,
            'quran_ayah': int(row.get('quran_ayah', 0)) if row.get('quran_ayah') else None,
            'quran_juz': int(row.get('quran_juz', 0)) if row.get('quran_juz') else None,
            'source': row.get('source', '').strip(),
        }
        
        return dua_data
