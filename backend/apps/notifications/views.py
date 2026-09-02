from rest_framework import viewsets, mixins, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination

from .models import Notification
from .serializers import NotificationSerializer, NotificationUpdateSerializer


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class NotificationViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet
):
    """
    User-scoped Notification ViewSet (Phase 25).
    Endpoints:
    - GET    /api/notifications/
    - GET    /api/notifications/{id}/
    - PATCH  /api/notifications/{id}/
    - GET    /api/notifications/unread-count/
    - POST   /api/notifications/mark-all-read/
    """
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'message', 'notification_type']
    ordering_fields = ['created_at', 'id']
    ordering = ['-created_at', 'id']

    def get_queryset(self):
        user = self.request.user
        queryset = Notification.objects.filter(user=user)

        params = self.request.query_params
        is_read = params.get('is_read')
        if is_read is not None:
            if is_read.lower() == 'true':
                queryset = queryset.filter(is_read=True)
            elif is_read.lower() == 'false':
                queryset = queryset.filter(is_read=False)

        notif_type = params.get('notification_type')
        if notif_type:
            queryset = queryset.filter(notification_type=notif_type)

        return queryset

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return NotificationUpdateSerializer
        return NotificationSerializer

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({"unread_count": count}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        updated_count = Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({
            "message": "All notifications marked as read.",
            "updated_count": updated_count
        }, status=status.HTTP_200_OK)
