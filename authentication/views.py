from django.shortcuts import render
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import login, logout
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.urls import reverse
import secrets
import datetime

from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer, UserProfileSerializer, ChangePasswordSerializer
)
from .models import User

@api_view(['POST'])
@permission_classes([AllowAny])  # Public signup
def user_registration(request):
    """
    User registration endpoint
    Required: name, email, password
    Optional: phone, age, gender
    """
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        # Create auth token
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'message': 'User registered successfully',
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'phone': user.phone,
                'age': user.age,
                'gender': user.gender,
                'email_verified': user.email_verified
            },
            'token': token.key
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])  # Public login
def user_login(request):
    """
    User login endpoint
    Required: email, password
    """
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        login(request, user)
        
        # Create or get auth token
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'phone': user.phone,
                'age': user.age,
                'gender': user.gender,
                'email_verified': user.email_verified
            },
            'token': token.key
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])  # Protected logout
def user_logout(request):
    """
    User logout endpoint
    """
    try:
        # Delete the token
        request.user.auth_token.delete()
        logout(request)
        return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)
    except:
        return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([AllowAny])  # Public password reset request
def password_reset_request(request):
    """
    Request password reset
    Required: email
    """
    serializer = PasswordResetRequestSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email)
            
            # Generate reset token
            token = secrets.token_urlsafe(32)
            user.password_reset_token = token
            user.password_reset_expires = timezone.now() + datetime.timedelta(hours=24)
            user.save()
            
            # Send reset email
            reset_url = f"{request.build_absolute_uri('/')}api/auth/reset-password-page/?token={token}"
            
            # In production, you would use a proper email template
            email_body = f"""
            Hello {user.name},
            
            You have requested to reset your password. Click the link below to reset it:
            
            {reset_url}
            
            This link will expire in 24 hours.
            
            If you didn't request this, please ignore this email.
            
            Best regards,
            Dua & Zikr Team
            """
            
            try:
                send_mail(
                    'Password Reset Request - Dua & Zikr',
                    email_body,
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                    fail_silently=False,
                )
                return Response({
                    'message': 'Password reset email sent successfully'
                }, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({
                    'message': 'Failed to send email. Please try again.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except User.DoesNotExist:
            return Response({
                'message': 'Password reset email sent successfully'
            }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])  # Public password reset confirm
def password_reset_confirm(request):
    """
    Confirm password reset with token
    Required: token, new_password, new_password_confirm
    """
    serializer = PasswordResetConfirmSerializer(data=request.data)
    if serializer.is_valid():
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']
        
        try:
            user = User.objects.get(
                password_reset_token=token,
                password_reset_expires__gt=timezone.now()
            )
            
            # Update password and clear reset token
            user.set_password(new_password)
            user.password_reset_token = None
            user.password_reset_expires = None
            user.save()
            
            return Response({
                'message': 'Password reset successful'
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({
                'message': 'Invalid or expired reset token'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Get and update user profile
    """
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]  # Protected profile
    
    def get_object(self):
        return self.request.user

@api_view(['POST'])
@permission_classes([IsAuthenticated])  # Protected change password
def change_password(request):
    """
    Change user password
    Required: old_password, new_password, new_password_confirm
    """
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        user = request.user
        new_password = serializer.validated_data['new_password']
        
        user.set_password(new_password)
        user.save()
        
        # Delete old token and create new one
        try:
            request.user.auth_token.delete()
        except:
            pass
        
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'message': 'Password changed successfully',
            'token': token.key
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])  # Protected user info
def user_info(request):
    """
    Get current user information
    """
    user = request.user
    return Response({
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'phone': user.phone,
        'age': user.age,
        'gender': user.gender,
        'email_verified': user.email_verified,
        'created_at': user.created_at
    }, status=status.HTTP_200_OK)

def password_reset_page(request):
    """
    Serve the password reset HTML page
    """
    return render(request, 'authentication/password_reset.html')
