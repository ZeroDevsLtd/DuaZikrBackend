class CsrfExemptMiddleware:
    """
    Middleware to completely disable CSRF for API endpoints
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Disable CSRF for all API endpoints
        if request.path.startswith('/api/'):
            setattr(request, '_dont_enforce_csrf_checks', True)
            # Also set the CSRF cookie to None to prevent any CSRF checks
            request.META['CSRF_COOKIE'] = None
        
        response = self.get_response(request)
        return response
