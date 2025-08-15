from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'name', 'phone', 'age', 'gender', 'email_verified', 'is_active', 'created_at')
    list_filter = ('email_verified', 'is_active', 'gender', 'created_at')
    search_fields = ('email', 'name', 'phone')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('email', 'name', 'phone', 'age', 'gender')
        }),
        ('Authentication', {
            'fields': ('password',)
        }),
        ('Status', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'email_verified')
        }),
        ('Email Verification', {
            'fields': ('email_verification_token',),
            'classes': ('collapse',)
        }),
        ('Password Reset', {
            'fields': ('password_reset_token', 'password_reset_expires'),
            'classes': ('collapse',)
        }),
        ('Permissions', {
            'fields': ('groups', 'user_permissions'),
            'classes': ('collapse',)
        }),
        ('Important dates', {
            'fields': ('last_login', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'password1', 'password2'),
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at', 'last_login')
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related()
