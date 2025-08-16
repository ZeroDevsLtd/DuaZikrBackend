from rest_framework import serializers
from .models import Category, Dua, DuaStatistics, Ad


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model"""
    name = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'icon', 'color', 'created_at', 'updated_at']

    def get_name(self, obj):
        """Get name for all languages"""
        return {
            'en': obj.name_en,
            'bn': obj.name_bn,
            'ar': obj.name_ar,
            'ur': obj.name_ur,
            'de': obj.name_de,
            'es': obj.name_es,
            'id': obj.name_id,
        }

    def get_description(self, obj):
        """Get description for all languages"""
        return {
            'en': obj.description_en,
            'bn': obj.description_bn,
            'ar': obj.description_ar,
            'ur': obj.description_ur,
            'de': obj.description_de,
            'es': obj.description_es,
            'id': obj.description_id,
        }


class DuaSerializer(serializers.ModelSerializer):
    """Main serializer for Dua model"""
    category_id = serializers.IntegerField(source='category.id', read_only=True)
    category_name = serializers.CharField(source='category.name_en', read_only=True)
    
    # Nested serializers for complex fields
    title = serializers.SerializerMethodField()
    transliteration = serializers.SerializerMethodField()
    translation = serializers.SerializerMethodField()
    explanation = serializers.SerializerMethodField()
    benefits = serializers.SerializerMethodField()
    audio = serializers.SerializerMethodField()
    references = serializers.SerializerMethodField()
    usage = serializers.SerializerMethodField()
    statistics = serializers.SerializerMethodField()
    metadata = serializers.SerializerMethodField()

    class Meta:
        model = Dua
        fields = [
            'id', 'type', 'category_id', 'category_name', 'priority', 'tags',
            'title', 'dua_text', 'transliteration', 'translation', 'explanation', 'benefits',
            'audio', 'references', 'usage', 'statistics', 'metadata'
        ]

    def get_title(self, obj):
        """Get title for all languages"""
        return {
            'en': obj.title_en,
            'bn': obj.title_bn,
            'ar': obj.title_ar,
            'ur': obj.title_ur,
            'de': obj.title_de,
            'es': obj.title_es,
            'id': obj.title_id,
        }

    def get_transliteration(self, obj):
        """Get transliterations for all languages"""
        return {
            'en': obj.transliteration_en,
            'bn': obj.transliteration_bn,
            'ur': obj.transliteration_ur,
            'ar': obj.transliteration_ar,
            'de': obj.transliteration_de,
            'es': obj.transliteration_es,
            'id': obj.transliteration_id,
        }

    def get_translation(self, obj):
        """Get translations for all languages"""
        return {
            'en': obj.translation_en,
            'bn': obj.translation_bn,
            'ar': obj.translation_ar,
            'ur': obj.translation_ur,
            'de': obj.translation_de,
            'es': obj.translation_es,
            'id': obj.translation_id,
        }

    def get_explanation(self, obj):
        """Get explanations for all languages"""
        return {
            'en': obj.explanation_en,
            'bn': obj.explanation_bn,
            'ar': obj.explanation_ar,
            'ur': obj.explanation_ur,
            'de': obj.explanation_de,
            'es': obj.explanation_es,
            'id': obj.explanation_id,
        }

    def get_benefits(self, obj):
        """Get benefits for all languages"""
        return {
            'en': obj.benefits_en,
            'bn': obj.benefits_bn,
            'ar': obj.benefits_ar,
            'ur': obj.benefits_ur,
            'de': obj.benefits_de,
            'es': obj.benefits_es,
            'id': obj.benefits_id,
        }

    def get_audio(self, obj):
        """Get audio information"""
        return {
            'reciter': obj.reciter,
            'duration': obj.duration,
            'url': obj.audio_url
        }

    def get_references(self, obj):
        """Get reference information"""
        references = {}
        
        # Add Quran references if they exist
        if obj.quran_surah or obj.quran_ayah or obj.quran_juz:
            references['quran'] = {
                'surah': obj.quran_surah,
                'ayah': obj.quran_ayah,
                'juz': obj.quran_juz
            }
        
        # Add Hadith references if they exist
        if obj.hadith_book_name or obj.hadith_chapter or obj.hadith_number:
            references['hadith'] = {
                'book_name': obj.hadith_book_name,
                'chapter': obj.hadith_chapter,
                'number': obj.hadith_number
            }
        
        # Add source
        if obj.source:
            references['source'] = obj.source
            
        return references

    def get_usage(self, obj):
        """Get usage information"""
        return {
            'whenToRecite': obj.when_to_recite,
            'frequency': obj.frequency
        }

    def get_statistics(self, obj):
        """Get statistics information"""
        return {
            'viewCount': obj.view_count,
            'favoriteCount': obj.favorite_count,
            'lastRead': obj.last_read
        }

    def get_metadata(self, obj):
        """Get metadata information"""
        return {
            'difficulty': obj.difficulty,
            'estimatedTime': obj.estimated_time,
            'relatedDuas': obj.related_duas,
            'notes': obj.notes
        }


class DuaListSerializer(serializers.ModelSerializer):
    """Simplified serializer for Dua list views"""
    category = CategorySerializer(read_only=True)
    
    class Meta:
        model = Dua
        fields = [
            'id', 'type', 'category', 'priority', 'tags',
            'dua_text', 'title_en', 'translation_en',
            'difficulty', 'estimated_time', 'view_count', 'favorite_count'
        ]


class DuaStatisticsSerializer(serializers.ModelSerializer):
    """Serializer for DuaStatistics model"""
    dua = DuaSerializer(read_only=True)
    
    class Meta:
        model = DuaStatistics
        fields = '__all__'


class MetadataSerializer(serializers.Serializer):
    """Serializer for API metadata"""
    version = serializers.CharField(default="1.0.0")
    lastUpdated = serializers.DateTimeField()
    totalDuas = serializers.IntegerField()
    supportedLanguages = serializers.ListField(child=serializers.CharField())
    categories = CategorySerializer(many=True)


class GetAllDuaResponseSerializer(serializers.Serializer):
    """Serializer for the complete getAllDua API response"""
    metadata = MetadataSerializer()
    duas = DuaSerializer(many=True)


class GetAllCategoryResponseSerializer(serializers.Serializer):
    """Serializer for the getAllCategory API response"""
    metadata = MetadataSerializer()
    categories = CategorySerializer(many=True)


class AdSerializer(serializers.ModelSerializer):
    """Serializer for Ad model"""
    
    class Meta:
        model = Ad
        fields = [
            'id', 'title', 'text', 'action_text', 'action_color', 
            'text_color', 'title_color', 'link', 'icon_name', 'icon_color',
            'is_active', 'priority'
        ]
    
    def to_representation(self, instance):
        """Custom representation to match the required JSON format"""
        data = super().to_representation(instance)
        return {
            "id": data['id'],
            "title": data['title'],
            "text": data['text'],
            "actionText": data['action_text'],
            "actionColor": data['action_color'],
            "textColor": data['text_color'],
            "titleColor": data['title_color'],
            "link": data['link'],
            "iconName": data['icon_name'],
            "iconColor": data['icon_color'],
            "isActive": data['is_active'],
            "priority": data['priority']
        }
