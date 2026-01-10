"""
ASGI config for shareeat project.
It exposes the ASGI callable as a module-level variable named ``application``.
For async deployment.
"""
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'shareeat.settings')

application = get_asgi_application()