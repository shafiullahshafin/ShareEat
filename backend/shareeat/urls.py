"""
URL configuration for ShareEat project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def api_root(request):
    """Simple API root view"""
    return JsonResponse({
        "status": "running", 
        "message": "ShareEat API is active",
        "version": "1.0.0",
        "context": "Global"
    })

urlpatterns = [
    # Admin interface
    path('admin/', admin.site.urls),
    
    # Main dashboard
    path('', api_root, name='home'),
    
    # API URLs
    path('api/', include('shareeat.api.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
