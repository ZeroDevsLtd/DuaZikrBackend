"""
ASGI config for dua_zikr_backend project.
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dua_zikr_backend.settings')

application = get_asgi_application()
