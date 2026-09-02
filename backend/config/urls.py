from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint for Phase 01 setup verification.
    """
    return JsonResponse({
        "status": "ok",
        "service": "PR-TERRA backend"
    })


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health_check'),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/', include('apps.academics.urls')),
    path('api/', include('apps.examinations.urls')),
    path('api/', include('apps.marks.urls')),
    path('api/', include('apps.reports.urls')),
    path('api/', include('apps.verification.urls')),
    path('api/', include('apps.audit.urls')),
    path('api/', include('apps.notifications.urls')),
]
