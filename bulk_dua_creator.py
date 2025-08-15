#!/usr/bin/env python
"""
Bulk Dua Creator Script
This script allows you to create multiple duas quickly using Python dictionaries
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dua_zikr_backend.settings')
django.setup()

from duas.models import Category, Dua

def create_bulk_duas():
    """Create multiple duas using predefined data"""
    
    # Sample duas data - you can modify this or add more
    duas_data = [
        {
            "type": "quranic",
            "category_slug": "salah",
            "priority": 1,
            "tags": ["quran", "protection", "daily"],
            "title_en": "Ayat al-Kursi",
            "title_bn": "আয়াতুল কুরসি",
            "title_ar": "آية الكرسي",
            "title_ur": "آیت الکرسی",
            "title_de": "Ayat al-Kursi",
            "title_es": "Ayat al-Kursi",
            "title_id": "Ayat al-Kursi",
            "dua_text": "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ",
            "transliteration_en": "Allahu la ilaha illa huwa al-Hayyul-Qayyum",
            "transliteration_bn": "আল্লাহু লা ইলাহা ইল্লা হুয়া আল-হাইয়ুল কাইয়্যুম",
            "transliteration_ar": "اللَّهُ لا إِلَٰهَ إِلا هُوَ الْحَيُّ الْقَيُّومُ",
            "transliteration_ur": "اللہ لا الہ الا وہ زندہ قائم",
            "transliteration_de": "Allahu la ilaha illa huwa al-Hayyul-Qayyum",
            "transliteration_es": "Allahu la ilaha illa huwa al-Hayyul-Qayyum",
            "transliteration_id": "Allahu la ilaha illa huwa al-Hayyul-Qayyum",
            "translation_en": "Allah! There is no deity except Him, the Ever-Living, the Sustainer of existence",
            "translation_bn": "আল্লাহ! তিনি ছাড়া কোনো উপাস্য নেই, চিরঞ্জীব, সবকিছুর ধারক",
            "translation_ar": "اللَّهُ لا إِلَٰهَ إِلا هُوَ الْحَيُّ الْقَيُّومُ",
            "translation_ur": "اللہ کے سوا کوئی معبود نہیں، وہ زندہ اور قائم رہنے والا ہے",
            "translation_de": "Allah! Es gibt keinen Gott außer Ihm, dem Ewig-Lebenden, dem Erhalter",
            "translation_es": "¡Alá! No hay deidad excepto Él, el Siempre Vivo, el Sustentador de la existencia",
            "translation_id": "Allah! Tidak ada tuhan selain Dia, Yang Maha Hidup, Yang Maha Menjaga",
            "explanation_en": "This verse is recited for protection and blessings after prayers",
            "explanation_bn": "এই আয়াতটি নামাজের পরে সুরক্ষা এবং বরকতের জন্য পাঠ করা হয়",
            "explanation_ar": "تُقرأ هذه الآية للحماية والبركات بعد الصلوات",
            "explanation_ur": "یہ آیت نماز کے بعد تحفظ اور برکت کے لیے پڑھی جاتی ہے",
            "explanation_de": "Dieser Vers wird nach dem Gebet für Schutz und Segen rezitiert",
            "explanation_es": "Este verso se recita para protección y bendiciones después de las oraciones",
            "explanation_id": "Ayat ini dibaca untuk perlindungan dan keberkahan setelah sholat",
            "benefits_en": "Protection from harm, spiritual strength, peace of mind",
            "benefits_bn": "ক্ষতি থেকে সুরক্ষা, আধ্যাত্মিক শক্তি, মানসিক শান্তি",
            "benefits_ar": "الحماية من الأذى، القوة الروحية، راحة البال",
            "benefits_ur": "نقصان سے تحفظ، روحانی طاقت، ذہنی سکون",
            "benefits_de": "Schutz vor Schaden, spirituelle Stärke, Seelenfrieden",
            "benefits_es": "Protección contra el daño, fuerza espiritual, paz mental",
            "benefits_id": "Perlindungan dari bahaya, kekuatan spiritual, ketenangan pikiran",
            "reciter": "Abdul Rahman Al-Sudais",
            "duration": "00:00:25",
            "hadith_book_name": "",
            "hadith_chapter": "",
            "hadith_number": "",
            "when_to_recite": ["After every prayer", "Before sleeping"],
            "frequency": "daily",
            "difficulty": "intermediate",
            "estimated_time": "00:01:00",
            "related_duas": [],
            "notes": "Highly recommended for protection",
            "quran_surah": 2,
            "quran_ayah": 255,
            "quran_juz": 3,
            "source": "Quran 2:255"
        },
        {
            "type": "hadith",
            "category_slug": "sleep",
            "priority": 2,
            "tags": ["sleep", "protection", "night"],
            "title_en": "Dua Before Sleeping",
            "title_bn": "ঘুমানোর আগের দুআ",
            "title_ar": "دعاء قبل النوم",
            "title_ur": "سونے سے پہلے کی دعا",
            "title_de": "Gebet vor dem Schlafen",
            "title_es": "Oración antes de dormir",
            "title_id": "Doa sebelum tidur",
            "dua_text": "بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي وَبِكَ أَرْفَعُهُ",
            "transliteration_en": "Bismika rabbi wada'tu janbi wa bika arfa'uhu",
            "transliteration_bn": "বিসমিকা রাব্বি ওয়াদাআতু জানবি ওয়া বিকা আরফাআহু",
            "transliteration_ar": "باسمك ربي وضعت جنبي وبك أرفعه",
            "transliteration_ur": "باسمک ربی وضعت جنبی وبک ارفعہ",
            "transliteration_de": "Bismika rabbi wada'tu janbi wa bika arfa'uhu",
            "transliteration_es": "Bismika rabbi wada'tu janbi wa bika arfa'uhu",
            "transliteration_id": "Bismika rabbi wada'tu janbi wa bika arfa'uhu",
            "translation_en": "In Your name, my Lord, I lay my side down, and in Your name I raise it",
            "translation_bn": "আপনার নামে, হে আমার রব, আমি আমার পাশ ফেলে দিচ্ছি, এবং আপনার নামেই আমি তা উঠাচ্ছি",
            "translation_ar": "باسمك ربي وضعت جنبي وبك أرفعه",
            "translation_ur": "آپ کے نام سے، اے میرے رب، میں اپنا پہلو رکھ رہا ہوں، اور آپ کے نام سے ہی میں اسے اٹھاتا ہوں",
            "translation_de": "In Deinem Namen, mein Herr, lege ich meine Seite nieder, und in Deinem Namen erhebe ich sie",
            "translation_es": "En Tu nombre, mi Señor, pongo mi costado, y en Tu nombre lo levanto",
            "translation_id": "Dengan nama-Mu, Tuhanku, aku meletakkan lambungku, dan dengan nama-Mu aku mengangkatnya",
            "explanation_en": "This dua is recited before sleeping for protection and blessings",
            "explanation_bn": "এই দুআটি ঘুমানোর আগে সুরক্ষা এবং বরকতের জন্য পাঠ করা হয়",
            "explanation_ar": "تُقرأ هذه الدعاء قبل النوم للحماية والبركات",
            "explanation_ur": "یہ دعا سونے سے پہلے تحفظ اور برکت کے لیے پڑھی جاتی ہے",
            "explanation_de": "Dieses Gebet wird vor dem Schlafen für Schutz und Segen rezitiert",
            "explanation_es": "Esta oración se recita antes de dormir para protección y bendiciones",
            "explanation_id": "Doa ini dibaca sebelum tidur untuk perlindungan dan keberkahan",
            "benefits_en": "Protection during sleep, peaceful rest, spiritual connection",
            "benefits_bn": "ঘুমের সময় সুরক্ষা, শান্তিপূর্ণ বিশ্রাম, আধ্যাত্মিক সংযোগ",
            "benefits_ar": "الحماية أثناء النوم، الراحة الهادئة، الارتباط الروحي",
            "benefits_ur": "نیند کے دوران تحفظ، پرسکون آرام، روحانی تعلق",
            "benefits_de": "Schutz während des Schlafens, friedliche Ruhe, spirituelle Verbindung",
            "benefits_es": "Protección durante el sueño, descanso pacífico, conexión espiritual",
            "benefits_id": "Perlindungan selama tidur, istirahat yang damai, koneksi spiritual",
            "reciter": "Abdul Rahman Al-Sudais",
            "duration": "00:00:12",
            "hadith_book_name": "Sahih Bukhari",
            "hadith_chapter": "Book of Bedtime",
            "hadith_number": "6320",
            "when_to_recite": ["Before sleeping"],
            "frequency": "daily",
            "difficulty": "beginner",
            "estimated_time": "00:00:20",
            "related_duas": [],
            "notes": "Essential dua for bedtime",
            "quran_surah": None,
            "quran_ayah": None,
            "quran_juz": None,
            "source": "Hadith Bukhari 6320"
        }
    ]
    
    print("🔄 Starting bulk dua creation...")
    print("=" * 50)
    
    # Get category mapping
    categories = {cat.slug: cat for cat in Category.objects.all()}
    
    created_count = 0
    error_count = 0
    
    for i, dua_data in enumerate(duas_data, 1):
        try:
            # Get category
            category_slug = dua_data.get('category_slug')
            if category_slug not in categories:
                print(f"❌ Error: Category '{category_slug}' not found")
                error_count += 1
                continue
            
            category = categories[category_slug]
            
            # Check if dua already exists
            existing_dua = Dua.objects.filter(title_en=dua_data['title_en']).first()
            if existing_dua:
                print(f"⚠️ Skipping: {dua_data['title_en']} already exists")
                continue
            
            # Create the dua
            dua = Dua.objects.create(
                type=dua_data['type'],
                category=category,
                priority=dua_data['priority'],
                tags=dua_data['tags'],
                title_en=dua_data['title_en'],
                title_bn=dua_data['title_bn'],
                title_ar=dua_data['title_ar'],
                title_ur=dua_data['title_ur'],
                title_de=dua_data['title_de'],
                title_es=dua_data['title_es'],
                title_id=dua_data['title_id'],
                dua_text=dua_data['dua_text'],
                transliteration_en=dua_data['transliteration_en'],
                transliteration_bn=dua_data['transliteration_bn'],
                transliteration_ar=dua_data['transliteration_ar'],
                transliteration_ur=dua_data['transliteration_ur'],
                transliteration_de=dua_data['transliteration_de'],
                transliteration_es=dua_data['transliteration_es'],
                transliteration_id=dua_data['transliteration_id'],
                translation_en=dua_data['translation_en'],
                translation_bn=dua_data['translation_bn'],
                translation_ar=dua_data['translation_ar'],
                translation_ur=dua_data['translation_ur'],
                translation_de=dua_data['translation_de'],
                translation_es=dua_data['translation_es'],
                translation_id=dua_data['translation_id'],
                explanation_en=dua_data['explanation_en'],
                explanation_bn=dua_data['explanation_bn'],
                explanation_ar=dua_data['explanation_ar'],
                explanation_ur=dua_data['explanation_ur'],
                explanation_de=dua_data['explanation_de'],
                explanation_es=dua_data['explanation_es'],
                explanation_id=dua_data['explanation_id'],
                benefits_en=dua_data['benefits_en'],
                benefits_bn=dua_data['benefits_bn'],
                benefits_ar=dua_data['benefits_ar'],
                benefits_ur=dua_data['benefits_ur'],
                benefits_de=dua_data['benefits_de'],
                benefits_es=dua_data['benefits_es'],
                benefits_id=dua_data['benefits_id'],
                reciter=dua_data['reciter'],
                duration=dua_data['duration'],
                hadith_book_name=dua_data['hadith_book_name'],
                hadith_chapter=dua_data['hadith_chapter'],
                hadith_number=dua_data['hadith_number'],
                when_to_recite=dua_data['when_to_recite'],
                frequency=dua_data['frequency'],
                difficulty=dua_data['difficulty'],
                estimated_time=dua_data['estimated_time'],
                related_duas=dua_data['related_duas'],
                notes=dua_data['notes'],
                quran_surah=dua_data['quran_surah'],
                quran_ayah=dua_data['quran_ayah'],
                quran_juz=dua_data['quran_juz'],
                source=dua_data['source']
            )
            
            created_count += 1
            print(f"✅ Created: {dua.title_en} (ID: {dua.id})")
            
        except Exception as e:
            error_count += 1
            print(f"❌ Error creating dua {i}: {str(e)}")
    
    print("=" * 50)
    print(f"🎉 Bulk creation completed!")
    print(f"✅ Created: {created_count}")
    print(f"❌ Errors: {error_count}")
    
    # Show total duas in database
    total_duas = Dua.objects.count()
    print(f"📊 Total duas in database: {total_duas}")

if __name__ == '__main__':
    create_bulk_duas()
