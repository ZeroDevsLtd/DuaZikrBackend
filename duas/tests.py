from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Category, Dua


class CategoryModelTest(TestCase):
    def setUp(self):
        self.category = Category.objects.create(
            name_en='Test Category',
            name_bn='টেস্ট ক্যাটাগরি',
            name_ar='فئة اختبار',
            slug='test-category',
            description_en='Test category description',
            description_bn='টেস্ট ক্যাটাগরি বিবরণ',
            icon='test-icon',
            color='#FF0000'
        )

    def test_category_creation(self):
        self.assertEqual(self.category.name_en, 'Test Category')
        self.assertEqual(self.category.name_bn, 'টেস্ট ক্যাটাগরি')
        self.assertEqual(self.category.slug, 'test-category')
        self.assertEqual(str(self.category), 'Test Category')

    def test_get_name_method(self):
        self.assertEqual(self.category.get_name('en'), 'Test Category')
        self.assertEqual(self.category.get_name('bn'), 'টেস্ট ক্যাটাগরি')
        self.assertEqual(self.category.get_name('ar'), 'فئة اختبار')
        self.assertEqual(self.category.get_name('ur'), '')

    def test_get_description_method(self):
        self.assertEqual(self.category.get_description('en'), 'Test category description')
        self.assertEqual(self.category.get_description('bn'), 'টেস্ট ক্যাটাগরি বিবরণ')
        self.assertEqual(self.category.get_description('ur'), '')


class DuaModelTest(TestCase):
    def setUp(self):
        self.category = Category.objects.create(
            name_en='Test Category',
            slug='test-category'
        )
        self.dua = Dua.objects.create(
            id='test_dua_001',
            type='traditional',
            category=self.category,
            priority=1,
            dua_text='بِسْمِ اللَّهِ',
            title_en='Test Dua',
            translation_en='Test translation'
        )

    def test_dua_creation(self):
        self.assertEqual(self.dua.id, 'test_dua_001')
        self.assertEqual(self.dua.type, 'traditional')
        self.assertEqual(self.dua.category, self.category)
        self.assertEqual(str(self.dua), 'test_dua_001 - Test Dua')

    def test_dua_methods(self):
        # Test increment methods
        initial_view_count = self.dua.view_count
        self.dua.increment_view_count()
        self.assertEqual(self.dua.view_count, initial_view_count + 1)

        initial_favorite_count = self.dua.favorite_count
        self.dua.increment_favorite_count()
        self.assertEqual(self.dua.favorite_count, initial_favorite_count + 1)

    def test_get_title_method(self):
        self.assertEqual(self.dua.get_title('en'), 'Test Dua')
        self.assertEqual(self.dua.get_title('bn'), '')

    def test_get_translation_method(self):
        self.assertEqual(self.dua.get_translation('en'), 'Test translation')
        self.assertEqual(self.dua.get_translation('bn'), '')


class APITest(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(
            name_en='Test Category',
            slug='test-category'
        )
        self.dua = Dua.objects.create(
            id='test_dua_001',
            type='traditional',
            category=self.category,
            priority=1,
            dua_text='بِسْمِ اللَّهِ',
            title_en='Test Dua',
            translation_en='Test translation'
        )

    def test_get_all_dua(self):
        url = reverse('duas:get_all_dua')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('metadata', response.data)
        self.assertIn('duas', response.data)
        self.assertEqual(len(response.data['duas']), 1)

    def test_get_all_category(self):
        url = reverse('duas:get_all_category')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('metadata', response.data)
        self.assertIn('categories', response.data)
        self.assertEqual(len(response.data['categories']), 1)

    def test_get_dua_by_id(self):
        url = reverse('duas:get_dua_by_id', kwargs={'dua_id': 'test_dua_001'})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], 'test_dua_001')

    def test_get_dua_by_id_not_found(self):
        url = reverse('duas:get_dua_by_id', kwargs={'dua_id': 'non_existent'})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_duas_by_category(self):
        url = reverse('duas:get_duas_by_category', kwargs={'category_slug': 'test-category'})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('category', response.data)
        self.assertIn('duas', response.data)

    def test_search_duas(self):
        url = reverse('duas:search_duas')
        response = self.client.get(url, {'q': 'Test'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)

    def test_search_duas_no_query(self):
        url = reverse('duas:search_duas')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_popular_duas(self):
        url = reverse('duas:get_popular_duas')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('duas', response.data)

    def test_get_duas_by_type(self):
        url = reverse('duas:get_duas_by_type', kwargs={'dua_type': 'traditional'})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['type'], 'traditional')

    def test_get_duas_by_difficulty(self):
        url = reverse('duas:get_duas_by_difficulty', kwargs={'difficulty': 'beginner'})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['difficulty'], 'beginner')

    def test_mark_dua_as_favorite(self):
        url = reverse('duas:mark_dua_as_favorite', kwargs={'dua_id': 'test_dua_001'})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('favoriteCount', response.data)

    def test_get_api_info(self):
        url = reverse('duas:get_api_info')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('api_name', response.data)
        self.assertIn('endpoints', response.data)
