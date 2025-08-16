from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count, Q
from .models import Category, Dua, Ad
from .serializers import (
    DuaSerializer, CategorySerializer, MetadataSerializer,
    GetAllDuaResponseSerializer, GetAllCategoryResponseSerializer
)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_all_dua(request):
    """
    Get all duas with metadata
    """
    try:
        # Get all duas with category information
        duas = Dua.objects.select_related('category').all()
        
        # Get categories for metadata
        categories = Category.objects.all()
        
        # Create metadata
        metadata = {
            'version': '1.0.0',
            'lastUpdated': timezone.now(),
            'totalDuas': duas.count(),
            'supportedLanguages': ['en', 'bn', 'ar', 'ur', 'de', 'es', 'id'],
            'categories': CategorySerializer(categories, many=True).data
        }
        
        # Serialize duas
        dua_serializer = DuaSerializer(duas, many=True)
        
        # Create response data
        response_data = {
            'metadata': metadata,
            'duas': dua_serializer.data
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'An error occurred: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def get_all_category(request):
    """
    Get all categories with metadata
    """
    try:
        # Get all categories
        categories = Category.objects.all()
        
        # Create metadata
        metadata = {
            'version': '1.0.0',
            'lastUpdated': timezone.now(),
            'totalDuas': Dua.objects.count(),
            'supportedLanguages': ['en', 'bn', 'ar', 'ur', 'de', 'es', 'id'],
            'categories': CategorySerializer(categories, many=True).data
        }
        
        # Serialize categories
        category_serializer = CategorySerializer(categories, many=True)
        
        # Create response data
        response_data = {
            'metadata': metadata,
            'categories': category_serializer.data
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'An error occurred: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def get_dua_by_id(request, dua_id):
    """
    Get a specific dua by ID
    """
    try:
        dua = Dua.objects.select_related('category').get(id=dua_id)
        serializer = DuaSerializer(dua)
        
        # Increment view count
        dua.increment_view_count()
        
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except Dua.DoesNotExist:
        return Response(
            {'error': 'Dua not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'An error occurred: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def get_duas_by_category(request, category_slug):
    """
    Get all duas for a specific category
    """
    try:
        category = Category.objects.get(slug=category_slug)
        duas = Dua.objects.filter(category=category).select_related('category')
        
        serializer = DuaSerializer(duas, many=True)
        
        return Response({
            'category': CategorySerializer(category).data,
            'duas': serializer.data,
            'count': duas.count()
        }, status=status.HTTP_200_OK)
        
    except Category.DoesNotExist:
        return Response(
            {'error': 'Category not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'An error occurred: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def search_duas(request):
    """
    Search duas by text
    """
    query = request.GET.get('q', '')
    if not query:
        return Response(
            {'error': 'Query parameter "q" is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Search in multiple fields
        duas = Dua.objects.filter(
            Q(title_en__icontains=query) |
            Q(translation_en__icontains=query) |
            Q(dua_text__icontains=query) |
            Q(explanation_en__icontains=query)
        ).select_related('category')
        
        serializer = DuaSerializer(duas, many=True)
        
        return Response({
            'query': query,
            'results': serializer.data,
            'count': duas.count()
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'An error occurred: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def get_popular_duas(request):
    """
    Get popular duas based on view count
    """
    try:
        limit = int(request.GET.get('limit', 10))
        duas = Dua.objects.order_by('-view_count')[:limit].select_related('category')
        
        serializer = DuaSerializer(duas, many=True)
        
        return Response({
            'duas': serializer.data,
            'count': duas.count()
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'An error occurred: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def get_duas_by_type(request, dua_type):
    """
    Get duas by type (quranic, hadith, traditional, personal)
    """
    try:
        duas = Dua.objects.filter(type=dua_type).select_related('category')
        
        serializer = DuaSerializer(duas, many=True)
        
        return Response({
            'type': dua_type,
            'duas': serializer.data,
            'count': duas.count()
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'An error occurred: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def get_duas_by_difficulty(request, difficulty):
    """
    Get duas by difficulty level
    """
    try:
        duas = Dua.objects.filter(difficulty=difficulty).select_related('category')
        
        serializer = DuaSerializer(duas, many=True)
        
        return Response({
            'difficulty': difficulty,
            'duas': serializer.data,
            'count': duas.count()
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'An error occurred: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def mark_dua_as_favorite(request, dua_id):
    """
    Mark a dua as favorite (increment favorite count)
    """
    try:
        dua = Dua.objects.get(id=dua_id)
        dua.increment_favorite_count()
        
        return Response({
            'message': 'Dua marked as favorite',
            'favoriteCount': dua.favorite_count
        }, status=status.HTTP_200_OK)
        
    except Dua.DoesNotExist:
        return Response(
            {'error': 'Dua not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'An error occurred: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_dua(request):
    """
    Create a new dua (Admin only)
    """
    # Check if user is staff/admin
    if not request.user.is_staff:
        return Response({
            'error': 'Only staff members can create duas'
        }, status=status.HTTP_403_FORBIDDEN)
    
    serializer = DuaSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({
            'message': 'Dua created successfully',
            'dua': serializer.data
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_api_info(request):
    """
    Get API information and statistics
    """
    try:
        total_duas = Dua.objects.count()
        total_categories = Category.objects.count()
        
        # Get category statistics
        category_stats = Category.objects.annotate(
            dua_count=Count('duas')
        ).values('name', 'dua_count')
        
        # Get type statistics
        type_stats = Dua.objects.values('type').annotate(
            count=Count('id')
        ).order_by('-count')
        
        return Response({
            'api_name': 'Dua & Zikr API',
            'version': '1.0.0',
            'description': 'A comprehensive API for Islamic duas and zikr',
            'statistics': {
                'totalDuas': total_duas,
                'totalCategories': total_categories,
                'categoryBreakdown': list(category_stats),
                'typeBreakdown': list(type_stats)
            },
            'endpoints': [
                '/api/getalldua/',
                '/api/getallcategory/',
                '/api/dua/{id}/',
                '/api/category/{slug}/',
                '/api/search/',
                '/api/popular/',
                '/api/type/{type}/',
                '/api/difficulty/{level}/',
                '/api/favorite/{id}/',
                '/api/info/'
            ]
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'An error occurred: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def get_all_ads(request):
    """
    Get all active advertisements
    Public endpoint - no authentication required
    """
    try:
        # Get all active ads ordered by priority
        ads = Ad.objects.filter(is_active=True).order_by('priority', 'created_at')
        
        # Serialize the ads
        ads_data = []
        for ad in ads:
            ads_data.append(ad.to_dict())
        
        # Prepare response data
        response_data = {
            "success": True,
            "data": {
                "ads": ads_data,
                "lastUpdated": timezone.now().isoformat()
            }
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            "success": False,
            "error": "Failed to fetch advertisements",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
