from django.urls import path
from . import views

app_name = 'authentication'

urlpatterns = [
    # Authentication endpoints
    path('signup/', views.user_registration, name='user_registration'),
    path('login/', views.user_login, name='user_login'),
    path('logout/', views.user_logout, name='user_logout'),
    
    # Password management
    path('forgot-password/', views.password_reset_request, name='password_reset_request'),
    path('reset-password/', views.password_reset_confirm, name='password_reset_confirm'),
    path('reset-password-page/', views.password_reset_page, name='password_reset_page'),
    path('change-password/', views.change_password, name='change_password'),
    
    # User profile
    path('profile/', views.UserProfileView.as_view(), name='user_profile'),
    path('me/', views.user_info, name='user_info'),
]
