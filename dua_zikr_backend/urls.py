"""
URL configuration for dua_zikr_backend project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def root_view(request):
    """Root view that provides a welcome page"""
    html_content = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dua & Zikr API</title>
        <style>
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                margin: 0; 
                padding: 40px; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                min-height: 100vh;
            }
            .container { 
                max-width: 800px; 
                margin: 0 auto; 
                background: rgba(255,255,255,0.1); 
                padding: 40px; 
                border-radius: 20px; 
                backdrop-filter: blur(10px);
                box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            }
            h1 { 
                text-align: center; 
                margin-bottom: 30px; 
                font-size: 2.5em;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            .endpoint { 
                background: rgba(255,255,255,0.2); 
                padding: 15px; 
                margin: 10px 0; 
                border-radius: 10px; 
                border-left: 4px solid #4CAF50;
            }
            .endpoint strong { color: #4CAF50; }
            .status { 
                text-align: center; 
                background: #4CAF50; 
                color: white; 
                padding: 10px; 
                border-radius: 25px; 
                display: inline-block; 
                margin: 20px 0;
            }
            .api-info { 
                background: rgba(255,255,255,0.1); 
                padding: 20px; 
                border-radius: 10px; 
                margin: 20px 0;
            }
            a { 
                color: #4CAF50; 
                text-decoration: none; 
                font-weight: bold;
            }
            a:hover { text-decoration: underline; }
            .footer { 
                text-align: center; 
                margin-top: 40px; 
                opacity: 0.8; 
                font-size: 0.9em;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🕌 Dua & Zikr API</h1>
            
            <div style="text-align: center;">
                <div class="status">🚀 API Running Successfully</div>
            </div>
            
            <div class="api-info">
                <h2>📚 API Endpoints</h2>
                <div class="endpoint">
                    <strong>Main API:</strong> <a href="/api/getalldua/">/api/getalldua/</a> - Get all duas with metadata
                </div>
                <div class="endpoint">
                    <strong>Categories:</strong> <a href="/api/getallcategory/">/api/getallcategory/</a> - Get all categories
                </div>
                <div class="endpoint">
                    <strong>Documentation:</strong> <a href="/api/info/">/api/info/</a> - Complete API information
                </div>
                <div class="endpoint">
                    <strong>Admin Panel:</strong> <a href="/admin/">/admin/</a> - Manage content
                </div>
            </div>
            
            <div class="api-info">
                <h2>🔧 Quick Test</h2>
                <p>Test your API endpoints:</p>
                <ul>
                    <li><a href="/api/getalldua/" target="_blank">View All Duas</a></li>
                    <li><a href="/api/getallcategory/" target="_blank">View Categories</a></li>
                    <li><a href="/api/dua/dua_001/" target="_blank">View Sample Dua</a></li>
                </ul>
            </div>
            
            <div class="footer">
                <p>Built with ❤️ using Django & Django REST Framework</p>
                <p>Version 1.0.0 | Islamic Content API</p>
            </div>
        </div>
    </body>
    </html>
    """
    return HttpResponse(html_content, content_type='text/html')

@csrf_exempt
def health_check(request):
    """Health check endpoint for monitoring"""
    return JsonResponse({
        "status": "healthy",
        "service": "Dua & Zikr API",
        "version": "1.0.0",
        "timestamp": "2025-08-15T10:00:00Z"
    })

urlpatterns = [
    path('', root_view, name='root'),
    path('health/', health_check, name='health'),
    path('admin/', admin.site.urls),
    path('api/', include('duas.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
