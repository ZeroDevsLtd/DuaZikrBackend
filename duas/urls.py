from django.urls import path
from . import views

urlpatterns = [
    path('getalldua/', views.get_all_dua, name='get_all_dua'),
    path('getallcategory/', views.get_all_category, name='get_all_category'),
    path('search/', views.search_duas, name='search_duas'),
    path('dua/<str:dua_id>/', views.get_dua_by_id, name='get_dua_by_id'),
    path('category/<slug:category_slug>/', views.get_duas_by_category, name='get_duas_by_category'),
    path('popular/', views.get_popular_duas, name='get_popular_duas'),
    path('type/<str:dua_type>/', views.get_duas_by_type, name='get_duas_by_type'),
    path('difficulty/<str:difficulty>/', views.get_duas_by_difficulty, name='get_duas_by_difficulty'),
    path('favorite/<str:dua_id>/', views.mark_dua_as_favorite, name='mark_dua_as_favorite'),
    path('info/', views.get_api_info, name='get_api_info'),
    # Create Dua endpoint (Admin only)
    path('create-dua/', views.create_dua, name='create_dua'),
    # Get all ads endpoint (Public)
    path('getallads/', views.get_all_ads, name='get_all_ads'),
]
