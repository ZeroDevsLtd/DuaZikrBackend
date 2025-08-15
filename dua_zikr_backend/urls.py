"""
URL configuration for dua_zikr_backend project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt

def root_view(request):
    """Root view showing API information and available endpoints"""
    html_content = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dua & Zikr Backend API</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #333;
                min-height: 100vh;
            }
            .container {
                max-width: 1200px;
                margin: 0 auto;
                background: white;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 2.5em;
                font-weight: 300;
            }
            .header p {
                margin: 10px 0 0 0;
                font-size: 1.2em;
                opacity: 0.9;
            }
            .content {
                padding: 30px;
            }
            .section {
                margin-bottom: 30px;
                padding: 20px;
                border-radius: 10px;
                border-left: 5px solid #4CAF50;
                background: #f9f9f9;
            }
            .section h2 {
                color: #2E7D32;
                margin-top: 0;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .section h3 {
                color: #388E3C;
                margin-top: 20px;
            }
            .endpoint {
                background: white;
                padding: 15px;
                margin: 10px 0;
                border-radius: 8px;
                border: 1px solid #e0e0e0;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            .endpoint h4 {
                margin: 0 0 10px 0;
                color: #1976D2;
                font-family: 'Courier New', monospace;
            }
            .method {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 0.8em;
                font-weight: bold;
                margin-right: 10px;
            }
            .get { background: #4CAF50; color: white; }
            .post { background: #2196F3; color: white; }
            .put { background: #FF9800; color: white; }
            .delete { background: #F44336; color: white; }
            .public { background: #4CAF50; color: white; }
            .protected { background: #FF9800; color: white; }
            .admin { background: #9C27B0; color: white; }
            .description {
                color: #666;
                margin: 5px 0;
            }
            .url {
                font-family: 'Courier New', monospace;
                background: #f5f5f5;
                padding: 8px;
                border-radius: 4px;
                color: #333;
                word-break: break-all;
            }
            .features {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin: 20px 0;
            }
            .feature {
                background: white;
                padding: 20px;
                border-radius: 10px;
                text-align: center;
                box-shadow: 0 3px 10px rgba(0,0,0,0.1);
                border-top: 4px solid #4CAF50;
            }
            .feature h3 {
                color: #2E7D32;
                margin-top: 0;
            }
            .icon {
                font-size: 2em;
                margin-bottom: 10px;
            }
            .status {
                display: inline-block;
                padding: 5px 10px;
                border-radius: 20px;
                font-size: 0.8em;
                font-weight: bold;
                margin: 10px 0;
            }
            .online { background: #4CAF50; color: white; }
            .offline { background: #F44336; color: white; }
            .footer {
                background: #f5f5f5;
                padding: 20px;
                text-align: center;
                color: #666;
                border-top: 1px solid #e0e0e0;
            }
            .test-links {
                margin: 20px 0;
            }
            .test-links a {
                display: inline-block;
                margin: 5px;
                padding: 8px 15px;
                background: #2196F3;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                font-size: 0.9em;
            }
            .test-links a:hover {
                background: #1976D2;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🕌 Dua & Zikr Backend API</h1>
                <p>Complete Islamic Supplications API with Multi-language Support</p>
                <div class="status online">🟢 API Online</div>
            </div>
            
            <div class="content">
                <div class="section">
                    <h2>🚀 Quick Start</h2>
                    <p>This API provides comprehensive access to Islamic duas and zikr with support for 7 languages.</p>
                    <div class="test-links">
                        <a href="/api/getalldua/" target="_blank">Test Get All Duas</a>
                        <a href="/api/getallcategory/" target="_blank">Test Get All Categories</a>
                        <a href="/health/" target="_blank">Health Check</a>
                        <a href="/admin/" target="_blank">Admin Panel</a>
                    </div>
                </div>

                <div class="section">
                    <h2>🔓 Public Endpoints (No Authentication Required)</h2>
                    <p>These endpoints are freely accessible to everyone:</p>
                    
                    <div class="endpoint">
                        <h4><span class="method get">GET</span> <span class="public">Public</span> Get All Duas</h4>
                        <div class="description">Returns all duas with complete multi-language support</div>
                        <div class="url">/api/getalldua/</div>
                    </div>
                    
                    <div class="endpoint">
                        <h4><span class="method get">GET</span> <span class="public">Public</span> Get All Categories</h4>
                        <div class="description">Returns all categories with multi-language names and descriptions</div>
                        <div class="url">/api/getallcategory/</div>
                    </div>
                    
                    <div class="endpoint">
                        <h4><span class="method get">GET</span> <span class="public">Public</span> Search Duas</h4>
                        <div class="description">Search duas by text content</div>
                        <div class="url">/api/search/?q=search_term</div>
                    </div>
                    
                    <div class="endpoint">
                        <h4><span class="method get">GET</span> <span class="public">Public</span> Filter by Category</h4>
                        <div class="description">Filter duas by category</div>
                        <div class="url">/api/filter/?category=category_slug</div>
                    </div>
                    
                    <div class="endpoint">
                        <h4><span class="method get">GET</span> <span class="public">Public</span> Get Single Dua</h4>
                        <div class="description">Get detailed information about a specific dua</div>
                        <div class="url">/api/dua/dua_id/</div>
                    </div>
                    
                    <div class="endpoint">
                        <h4><span class="method get">GET</span> <span class="public">Public</span> Health Check</h4>
                        <div class="description">API health status</div>
                        <div class="url">/health/</div>
                    </div>
                </div>

                <div class="section">
                    <h2>🔐 Authentication Endpoints (User Management)</h2>
                    <p>These endpoints handle user registration and authentication:</p>
                    
                    <div class="endpoint">
                        <h4><span class="method post">POST</span> <span class="public">Public</span> User Registration</h4>
                        <div class="description">Create a new user account</div>
                        <div class="url">/api/auth/signup/</div>
                    </div>
                    
                    <div class="endpoint">
                        <h4><span class="method post">POST</span> <span class="public">Public</span> User Login</h4>
                        <div class="description">Authenticate user and get access token</div>
                        <div class="url">/api/auth/login/</div>
                    </div>
                    
                    <div class="endpoint">
                        <h4><span class="method post">POST</span> <span class="public">Public</span> Forgot Password</h4>
                        <div class="description">Request password reset link</div>
                        <div class="url">/api/auth/forgot-password/</div>
                    </div>
                    
                    <div class="endpoint">
                        <h4><span class="method post">POST</span> <span class="public">Public</span> Reset Password</h4>
                        <div class="description">Reset password using token</div>
                        <div class="url">/api/auth/reset-password/</div>
                    </div>
                    
                    <div class="endpoint">
                        <h4><span class="method get">GET</span> <span class="public">Public</span> Password Reset Page</h4>
                        <div class="description">User-friendly HTML page for password reset</div>
                        <div class="url">/api/auth/reset-password-page/?token=token</div>
                    </div>
                </div>

                <div class="section">
                    <h2>🔒 Protected Endpoints (Authentication Required)</h2>
                    <p>These endpoints require a valid authentication token:</p>
                    
                    <div class="endpoint">
                        <h4><span class="method get">GET</span> <span class="protected">Protected</span> User Profile</h4>
                        <div class="description">Get and update user profile</div>
                        <div class="url">/api/auth/profile/</div>
                    </div>
                    
                    <div class="endpoint">
                        <h4><span class="method get">GET</span> <span class="protected">Protected</span> User Info</h4>
                        <div class="description">Get current user information</div>
                        <div class="url">/api/auth/me/</div>
                    </div>
                    
                    <div class="endpoint">
                        <h4><span class="method post">POST</span> <span class="protected">Protected</span> Change Password</h4>
                        <div class="description">Change user password</div>
                        <div class="url">/api/auth/change-password/</div>
                    </div>
                    
                    <div class="endpoint">
                        <h4><span class="method post">POST</span> <span class="protected">Protected</span> User Logout</h4>
                        <div class="description">Logout user and invalidate token</div>
                        <div class="url">/api/auth/logout/</div>
                    </div>
                </div>

                <div class="section">
                    <h2>👑 Admin Endpoints (Staff Only)</h2>
                    <p>These endpoints are restricted to admin users:</p>
                    
                    <div class="endpoint">
                        <h4><span class="method post">POST</span> <span class="admin">Admin</span> Create Dua</h4>
                        <div class="description">Create a new dua in the database (Admin only)</div>
                        <div class="url">/api/create-dua/</div>
                    </div>
                    
                    <div class="endpoint">
                        <h4><span class="method get">GET</span> <span class="admin">Admin</span> Django Admin</h4>
                        <div class="description">Django admin interface for content management</div>
                        <div class="url">/admin/</div>
                    </div>
                </div>

                <div class="section">
                    <h2>🌟 Features</h2>
                    <div class="features">
                        <div class="feature">
                            <div class="icon">🌍</div>
                            <h3>Multi-language Support</h3>
                            <p>7 languages: English, Bengali, Arabic, Urdu, German, Spanish, Indonesian</p>
                        </div>
                        <div class="feature">
                            <div class="icon">📚</div>
                            <h3>Rich Content</h3>
                            <p>15 categories with 10+ sample duas including Quranic verses and hadith</p>
                        </div>
                        <div class="feature">
                            <div class="icon">🔓</div>
                            <h3>Public APIs</h3>
                            <p>All core content APIs are publicly accessible without authentication</p>
                        </div>
                        <div class="feature">
                            <div class="icon">👤</div>
                            <h3>User Management</h3>
                            <p>Optional authentication system for personalized features</p>
                        </div>
                        <div class="feature">
                            <div class="icon">📱</div>
                            <h3>Mobile Ready</h3>
                            <p>Accessible from mobile devices on the same network</p>
                        </div>
                        <div class="feature">
                            <div class="icon">⚡</div>
                            <h3>Fast & Scalable</h3>
                            <p>Built with Django REST Framework for optimal performance</p>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h2>📊 API Information</h2>
                    <div class="endpoint">
                        <h4><span class="method get">GET</span> <span class="public">Public</span> API Info</h4>
                        <div class="description">Get detailed API information and statistics</div>
                        <div class="url">/api/info/</div>
                    </div>
                </div>

                <div class="section">
                    <h2>🔧 Development & Testing</h2>
                    <p><strong>Admin Access:</strong> Username: admin@example.com, Password: 123</p>
                    <p><strong>Base URL:</strong> http://localhost:8000</p>
                    <p><strong>API Base:</strong> http://localhost:8000/api/</p>
                    <p><strong>Network Access:</strong> Accessible from other devices on the same network</p>
                </div>
            </div>
            
            <div class="footer">
                <p>🕌 Built with ❤️ by ZeroDevs Team | Dua & Zikr Backend API v1.0.0</p>
                <p>Complete Islamic supplications with multi-language support</p>
            </div>
        </div>
    </body>
    </html>
    """
    return HttpResponse(html_content)

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
    path('admin/', admin.site.urls),
    path('api/', include('duas.urls')),
    path('api/auth/', include('authentication.urls')),
    path('', root_view, name='root'),
    path('health/', health_check, name='health_check'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
