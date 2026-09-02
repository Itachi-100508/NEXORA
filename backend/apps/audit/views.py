from rest_framework import viewsets, mixins, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination

from apps.accounts.permissions import IsAdmin
from .models import AuditLog
from .serializers import AuditLogSerializer


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class AuditLogViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet
):
    """
    Read-only Audit Log ViewSet accessible strictly to ADMIN users.
    POST, PUT, PATCH, DELETE operations are disallowed to enforce audit log immutability.
    Endpoints:
    - GET /api/audit-logs/
    - GET /api/audit-logs/{id}/
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    serializer_class = AuditLogSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'description',
        'entity_type',
        'entity_id',
        'user__first_name',
        'user__last_name',
        'user__username',
        'ip_address',
    ]
    ordering_fields = ['created_at', 'id']
    ordering = ['-created_at', 'id']

    def get_queryset(self):
        queryset = AuditLog.objects.select_related('user').all()
        params = self.request.query_params

        action = params.get('action')
        if action:
            queryset = queryset.filter(action=action)

        entity_type = params.get('entity_type')
        if entity_type:
            queryset = queryset.filter(entity_type=entity_type)

        entity_id = params.get('entity_id')
        if entity_id:
            queryset = queryset.filter(entity_id=entity_id)

        user_id = params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)

        return queryset
