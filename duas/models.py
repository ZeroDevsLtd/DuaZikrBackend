from django.db import models
from django.utils import timezone
import json


class Category(models.Model):
    """Model for Dua categories"""
    # Basic fields
    slug = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=50, blank=True)
    color = models.CharField(max_length=7, blank=True)  # Hex color code
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Name in all languages
    name_en = models.CharField(max_length=100)
    name_bn = models.CharField(max_length=100, blank=True)
    name_ar = models.CharField(max_length=100, blank=True)
    name_ur = models.CharField(max_length=100, blank=True)
    name_de = models.CharField(max_length=100, blank=True)
    name_es = models.CharField(max_length=100, blank=True)
    name_id = models.CharField(max_length=100, blank=True)
    
    # Description in all languages
    description_en = models.TextField(blank=True)
    description_bn = models.TextField(blank=True)
    description_ar = models.TextField(blank=True)
    description_ur = models.TextField(blank=True)
    description_de = models.TextField(blank=True)
    description_es = models.TextField(blank=True)
    description_id = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name_en']

    def __str__(self):
        return self.name_en

    def get_name(self, language):
        """Get name for a specific language"""
        name_map = {
            'en': self.name_en,
            'bn': self.name_bn,
            'ar': self.name_ar,
            'ur': self.name_ur,
            'de': self.name_de,
            'es': self.name_es,
            'id': self.name_id,
        }
        return name_map.get(language, '')

    def get_description(self, language):
        """Get description for a specific language"""
        description_map = {
            'en': self.description_en,
            'bn': self.description_bn,
            'ar': self.description_ar,
            'ur': self.description_ur,
            'de': self.description_de,
            'es': self.description_es,
            'id': self.description_id,
        }
        return description_map.get(language, '')


class Dua(models.Model):
    """Main model for Duas"""
    DUA_TYPES = [
        ('quranic', 'Quranic'),
        ('hadith', 'Hadith'),
        ('traditional', 'Traditional'),
        ('personal', 'Personal'),
    ]
    
    PRIORITY_CHOICES = [
        (1, 'Very High'),
        (2, 'High'),
        (3, 'Medium'),
        (4, 'Low'),
        (5, 'Very Low'),
    ]
    
    DIFFICULTY_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]
    
    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('occasional', 'Occasional'),
        ('special', 'Special Occasions'),
    ]

    # Basic Information
    id = models.CharField(max_length=20, primary_key=True)  # e.g., "dua_001"
    type = models.CharField(max_length=20, choices=DUA_TYPES, default='traditional')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='duas')
    priority = models.IntegerField(choices=PRIORITY_CHOICES, default=3)
    tags = models.JSONField(default=list)
    
    # Dua Text (Arabic)
    dua_text = models.TextField()
    
    # Title in all languages
    title_en = models.CharField(max_length=200)
    title_bn = models.CharField(max_length=200, blank=True)
    title_ar = models.CharField(max_length=200, blank=True)
    title_ur = models.CharField(max_length=200, blank=True)
    title_de = models.CharField(max_length=200, blank=True)
    title_es = models.CharField(max_length=200, blank=True)
    title_id = models.CharField(max_length=200, blank=True)
    
    # Transliteration in all languages
    transliteration_en = models.TextField(blank=True)
    transliteration_bn = models.TextField(blank=True)
    transliteration_ur = models.TextField(blank=True)
    transliteration_ar = models.TextField(blank=True)
    transliteration_de = models.TextField(blank=True)
    transliteration_es = models.TextField(blank=True)
    transliteration_id = models.TextField(blank=True)
    
    # Translation in all languages
    translation_en = models.TextField(blank=True)
    translation_bn = models.TextField(blank=True)
    translation_ar = models.TextField(blank=True)
    translation_ur = models.TextField(blank=True)
    translation_de = models.TextField(blank=True)
    translation_es = models.TextField(blank=True)
    translation_id = models.TextField(blank=True)
    
    # Explanation in all languages
    explanation_en = models.TextField(blank=True)
    explanation_bn = models.TextField(blank=True)
    explanation_ar = models.TextField(blank=True)
    explanation_ur = models.TextField(blank=True)
    explanation_de = models.TextField(blank=True)
    explanation_es = models.TextField(blank=True)
    explanation_id = models.TextField(blank=True)
    
    # Benefits in all languages
    benefits_en = models.TextField(blank=True)
    benefits_bn = models.TextField(blank=True)
    benefits_ar = models.TextField(blank=True)
    benefits_ur = models.TextField(blank=True)
    benefits_de = models.TextField(blank=True)
    benefits_es = models.TextField(blank=True)
    benefits_id = models.TextField(blank=True)
    
    # Audio Information
    reciter = models.CharField(max_length=100, blank=True)
    duration = models.CharField(max_length=10, blank=True)  # Format: "00:00:15"
    audio_url = models.URLField(blank=True)
    
    # References
    quran_surah = models.IntegerField(null=True, blank=True)
    quran_ayah = models.IntegerField(null=True, blank=True)
    quran_juz = models.IntegerField(null=True, blank=True)
    hadith_book_name = models.CharField(max_length=100, blank=True)
    hadith_chapter = models.CharField(max_length=100, blank=True)
    hadith_number = models.CharField(max_length=50, blank=True)
    source = models.CharField(max_length=200, blank=True)
    
    # Usage Information
    when_to_recite = models.JSONField(default=list)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='daily')
    
    # Statistics
    view_count = models.IntegerField(default=0)
    favorite_count = models.IntegerField(default=0)
    last_read = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='beginner')
    estimated_time = models.CharField(max_length=10, default='00:00:30')
    related_duas = models.JSONField(default=list)
    notes = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['priority', 'id']

    def __str__(self):
        return f"{self.id} - {self.title_en}"

    def increment_view_count(self):
        """Increment the view count"""
        self.view_count += 1
        self.save(update_fields=['view_count'])

    def increment_favorite_count(self):
        """Increment the favorite count"""
        self.favorite_count += 1
        self.save(update_fields=['favorite_count'])

    def update_last_read(self):
        """Update the last read timestamp"""
        self.last_read = timezone.now()
        self.save(update_fields=['last_read'])

    def get_title(self, language):
        """Get title for a specific language"""
        title_map = {
            'en': self.title_en,
            'bn': self.title_bn,
            'ar': self.title_ar,
            'ur': self.title_ur,
            'de': self.title_de,
            'es': self.title_es,
            'id': self.title_id,
        }
        return title_map.get(language, '')

    def get_transliteration(self, language):
        """Get transliteration for a specific language"""
        transliteration_map = {
            'en': self.transliteration_en,
            'bn': self.transliteration_bn,
            'ur': self.transliteration_ur,
            'ar': self.transliteration_ar,
            'de': self.transliteration_de,
            'es': self.transliteration_es,
            'id': self.transliteration_id,
        }
        return transliteration_map.get(language, '')

    def get_translation(self, language):
        """Get translation for a specific language"""
        translation_map = {
            'en': self.translation_en,
            'bn': self.translation_bn,
            'ar': self.translation_ar,
            'ur': self.translation_ur,
            'de': self.translation_de,
            'es': self.translation_es,
            'id': self.translation_id,
        }
        return translation_map.get(language, '')

    def get_explanation(self, language):
        """Get explanation for a specific language"""
        explanation_map = {
            'en': self.explanation_en,
            'bn': self.explanation_bn,
            'ar': self.explanation_ar,
            'ur': self.explanation_ur,
            'de': self.explanation_de,
            'es': self.explanation_es,
            'id': self.explanation_id,
        }
        return explanation_map.get(language, '')

    def get_benefits(self, language):
        """Get benefits for a specific language"""
        benefits_map = {
            'en': self.benefits_en,
            'bn': self.benefits_bn,
            'ar': self.benefits_ar,
            'ur': self.benefits_ur,
            'de': self.benefits_de,
            'es': self.benefits_es,
            'id': self.benefits_id,
        }
        return benefits_map.get(language, '')


class DuaStatistics(models.Model):
    """Model to track detailed statistics for duas"""
    dua = models.OneToOneField(Dua, on_delete=models.CASCADE, related_name='detailed_stats')
    total_reads = models.IntegerField(default=0)
    total_time_spent = models.DurationField(default=timezone.timedelta)
    last_read_date = models.DateField(null=True, blank=True)
    read_count_today = models.IntegerField(default=0)
    read_count_this_week = models.IntegerField(default=0)
    read_count_this_month = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Dua Statistics"

    def __str__(self):
        return f"Stats for {self.dua.id}"


class Ad(models.Model):
    """
    Model for managing advertisements
    """
    id = models.CharField(max_length=50, primary_key=True)
    title = models.CharField(max_length=200)
    text = models.TextField()
    action_text = models.CharField(max_length=100)
    action_color = models.CharField(max_length=7, default="#2c5530")  # Hex color
    text_color = models.CharField(max_length=7, default="#495057")   # Hex color
    title_color = models.CharField(max_length=7, default="#2c5530")  # Hex color
    link = models.URLField()
    icon_name = models.CharField(max_length=50, help_text="Ionicons icon name (e.g., star, notifications, share-social)")
    icon_color = models.CharField(max_length=7, default="#2c5530")  # Hex color
    is_active = models.BooleanField(default=True)
    priority = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['priority', 'created_at']
        verbose_name = 'Advertisement'
        verbose_name_plural = 'Advertisements'

    def __str__(self):
        return f"{self.title} (Priority: {self.priority})"

    def to_dict(self):
        """Convert model to dictionary format matching the API response"""
        return {
            "id": self.id,
            "title": self.title,
            "text": self.text,
            "actionText": self.action_text,
            "actionColor": self.action_color,
            "textColor": self.text_color,
            "titleColor": self.title_color,
            "link": self.link,
            "iconName": self.icon_name,
            "iconColor": self.icon_color,
            "isActive": self.is_active,
            "priority": self.priority
        }
