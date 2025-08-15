from django.urls import path
from . import views

app_name = 'duas'

urlpatterns = [
    # Main endpoints
    path('getalldua/', views.get_all_dua, name='get_all_dua'),
    path('getallcategory/', views.get_all_category, name='get_all_category'),
    
    # Individual dua endpoints
    path('dua/<str:dua_id>/', views.get_dua_by_id, name='get_dua_by_id'),
    
    # Category endpoints
    path('category/<str:category_slug>/', views.get_duas_by_category, name='get_duas_by_category'),
    
    # Search and filter endpoints
    path('search/', views.search_duas, name='search_duas'),
    path('popular/', views.get_popular_duas, name='get_popular_duas'),
    path('type/<str:dua_type>/', views.get_duas_by_type, name='get_duas_by_type'),
    path('difficulty/<str:difficulty>/', views.get_duas_by_difficulty, name='get_duas_by_difficulty'),
    
    # Action endpoints
    path('favorite/<str:dua_id>/', views.mark_dua_as_favorite, name='mark_dua_as_favorite'),
    
    # Info endpoint
    path('info/', views.get_api_info, name='get_api_info'),
]
