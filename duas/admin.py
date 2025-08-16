from django.contrib import admin
from .models import Category, Dua, DuaStatistics, Ad
from django.db import models

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name_en', 'slug', 'icon', 'color', 'created_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('name_en', 'name_bn', 'name_ar', 'name_ur', 'name_de', 'name_es', 'name_id',
                    'description_en', 'description_bn', 'description_ar', 'description_ur', 'description_de', 'description_es', 'description_id')
    prepopulated_fields = {'slug': ('name_en',)}
    ordering = ('name_en',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('slug', 'icon', 'color')
        }),
        ('Names', {
            'fields': (
                ('name_en', 'name_bn'),
                ('name_ar', 'name_ur'),
                ('name_de', 'name_es'),
                'name_id'
            ),
            'classes': ('collapse',)
        }),
        ('Descriptions', {
            'fields': (
                ('description_en', 'description_bn'),
                ('description_ar', 'description_ur'),
                ('description_de', 'description_es'),
                'description_id'
            ),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    readonly_fields = ('created_at', 'updated_at')
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related()

@admin.register(Dua)
class DuaAdmin(admin.ModelAdmin):
    list_display = ('id', 'title_en', 'type', 'category', 'priority', 'difficulty', 'created_at')
    list_filter = ('type', 'category', 'priority', 'difficulty', 'frequency', 'created_at')
    search_fields = ('dua_text', 'title_en', 'title_bn', 'title_ar', 'title_ur', 'title_de', 'title_es', 'title_id',
                    'transliteration_en', 'translation_en', 'explanation_en', 'benefits_en')
    list_editable = ('priority', 'type', 'difficulty')
    ordering = ('category', 'priority', 'id')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'type', 'category', 'priority', 'tags')
        }),
        ('Titles', {
            'fields': (
                ('title_en', 'title_bn'),
                ('title_ar', 'title_ur'),
                ('title_de', 'title_es'),
                'title_id'
            ),
            'classes': ('collapse',)
        }),
        ('Dua Text', {
            'fields': ('dua_text',)
        }),
        ('Transliterations', {
            'fields': (
                ('transliteration_en', 'transliteration_bn'),
                ('transliteration_ar', 'transliteration_ur'),
                ('transliteration_de', 'transliteration_es'),
                'transliteration_id'
            ),
            'classes': ('collapse',)
        }),
        ('Translations', {
            'fields': (
                ('translation_en', 'translation_bn'),
                ('translation_ar', 'translation_ur'),
                ('translation_de', 'translation_es'),
                ('translation_id')
            ),
            'classes': ('collapse',)
        }),
        ('Explanations', {
            'fields': (
                ('explanation_en', 'explanation_bn'),
                ('explanation_ar', 'explanation_ur'),
                ('explanation_de', 'explanation_es'),
                ('explanation_id')
            ),
            'classes': ('collapse',)
        }),
        ('Benefits', {
            'fields': (
                ('benefits_en', 'benefits_bn'),
                ('benefits_ar', 'benefits_ur'),
                ('benefits_de', 'benefits_es'),
                ('benefits_id')
            ),
            'classes': ('collapse',)
        }),
        ('Audio Information', {
            'fields': ('reciter', 'duration', 'audio_url'),
            'classes': ('collapse',)
        }),
        ('References', {
            'fields': ('quran_surah', 'quran_ayah', 'quran_juz', 'hadith_book_name', 'hadith_chapter', 'hadith_number', 'source'),
            'classes': ('collapse',)
        }),
        ('Usage Information', {
            'fields': ('when_to_recite', 'frequency'),
            'classes': ('collapse',)
        }),
        ('Statistics', {
            'fields': ('view_count', 'favorite_count', 'last_read'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('difficulty', 'estimated_time', 'related_duas'),
            'classes': ('collapse',)
        })
    )
    
    readonly_fields = ('id', 'view_count', 'favorite_count', 'last_read', 'created_at', 'updated_at')
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('category')
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "category":
            kwargs["queryset"] = Category.objects.all().order_by('name_en')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

@admin.register(DuaStatistics)
class DuaStatisticsAdmin(admin.ModelAdmin):
    list_display = ('dua', 'total_reads', 'total_time_spent', 'last_read_date', 'read_count_today', 'read_count_this_week', 'read_count_this_month')
    list_filter = ('last_read_date', 'created_at', 'updated_at')
    search_fields = ('dua__title_en', 'dua__dua_text')
    readonly_fields = ('created_at', 'updated_at')
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('dua')

@admin.register(Ad)
class AdAdmin(admin.ModelAdmin):
    """Admin interface for Ad model"""
    list_display = ['id', 'title', 'action_text', 'icon_name', 'is_active', 'priority', 'created_at']
    list_filter = ['is_active', 'priority', 'created_at']
    search_fields = ['id', 'title', 'text', 'action_text', 'icon_name']
    list_editable = ['is_active', 'priority']
    ordering = ['priority', 'created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'title', 'text', 'action_text'),
            'description': 'Enter the main content for your advertisement'
        }),
        ('Visual Design', {
            'fields': (
                ('action_color', 'text_color'),
                ('title_color', 'icon_color')
            ),
            'description': 'Choose colors that match your app theme. Use Islamic green (#2c5530) for consistency.'
        }),
        ('Icon & Link', {
            'fields': ('icon_name', 'link'),
            'description': 'Use Ionicons (e.g., star, notifications, book, calendar, moon). Visit <a href="https://ionic.io/ionicons" target="_blank">Ionicons</a> for more options.'
        }),
        ('Display Settings', {
            'fields': ('is_active', 'priority'),
            'description': 'Set priority 1-5 for important ads, 6-10 for secondary. Lower numbers = higher priority.'
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
            'description': 'Automatically managed timestamps'
        })
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    def get_queryset(self, request):
        """Order ads by priority and creation date"""
        return super().get_queryset(request).order_by('priority', 'created_at')
    
    def get_form(self, request, obj=None, **kwargs):
        """Customize form with help text and validation"""
        form = super().get_form(request, obj, **kwargs)
        
        # Add help text to fields
        if form.base_fields.get('title'):
            form.base_fields['title'].help_text = 'Keep titles short and engaging (under 30 characters)'
        if form.base_fields.get('text'):
            form.base_fields['text'].help_text = 'Describe the benefit or action clearly'
        if form.base_fields.get('action_text'):
            form.base_fields['action_text'].help_text = 'Use action-oriented text (e.g., "Upgrade Now", "Learn More")'
        if form.base_fields.get('icon_name'):
            form.base_fields['icon_name'].help_text = 'Popular icons: star, notifications, book, calendar, moon, people, share-social, trending-up'
        if form.base_fields.get('priority'):
            form.base_fields['priority'].help_text = 'Priority 1-5 for important ads, 6-10 for secondary. Lower = higher priority.'
        
        return form
    
    def save_model(self, request, obj, form, change):
        """Custom save logic for ads"""
        if not change:  # New ad
            if not obj.priority:
                # Auto-assign priority if not set
                max_priority = Ad.objects.aggregate(models.Max('priority'))['priority__max'] or 0
                obj.priority = max_priority + 1
        
        super().save_model(request, obj, form, change)
    
    def get_readonly_fields(self, request, obj=None):
        """Make ID readonly for existing ads"""
        if obj:  # Editing existing ad
            return self.readonly_fields + ('id',)
        return self.readonly_fields

# Customize admin site
admin.site.site_header = "Dua & Zikr Backend Administration"
admin.site.site_title = "Dua & Zikr Admin"
admin.site.index_title = "Welcome to Dua & Zikr Backend Administration"
