from rest_framework import viewsets, mixins, status, filters
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination

from apps.accounts.permissions import IsAdmin
from .models import Exam, ExamSubject, ExamComponent
from .serializers import (
    ExamListSerializer,
    ExamDetailSerializer,
    ExamCreateSerializer,
    ExamUpdateSerializer,
    ExamSubjectListSerializer,
    ExamSubjectDetailSerializer,
    ExamSubjectCreateSerializer,
    ExamSubjectUpdateSerializer,
    ExamComponentListSerializer,
    ExamComponentDetailSerializer,
    ExamComponentCreateSerializer,
    ExamComponentUpdateSerializer,
)


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class ExamViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet
):
    """
    ADMIN-only Exam ViewSet providing list, create, retrieve, update (PATCH), search, and filtering.
    Note: DELETE endpoint is intentionally omitted in Phase 10 to preserve historical examination records.
    Endpoints:
    - GET    /api/exams/
    - POST   /api/exams/
    - GET    /api/exams/{id}/
    - PATCH  /api/exams/{id}/
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'name',
        'description',
        'academic_year__name',
        'semester__name',
    ]
    ordering_fields = ['name', 'created_at', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = Exam.objects.select_related('academic_year', 'semester')
        params = self.request.query_params

        # Filter by academic year
        ay_id = params.get('academic_year_id')
        if ay_id:
            queryset = queryset.filter(academic_year_id=ay_id)

        # Filter by semester
        sem_id = params.get('semester_id')
        if sem_id:
            queryset = queryset.filter(semester_id=sem_id)

        # Filter by status
        status_param = params.get('status')
        if status_param:
            status_upper = status_param.upper()
            if status_upper in Exam.Status.values:
                queryset = queryset.filter(status=status_upper)

        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return ExamCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ExamUpdateSerializer
        elif self.action == 'retrieve':
            return ExamDetailSerializer
        return ExamListSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        exam = serializer.save()
        output_serializer = ExamDetailSerializer(exam)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        updated_exam = serializer.save()
        output_serializer = ExamDetailSerializer(updated_exam)
        return Response(output_serializer.data, status=status.HTTP_200_OK)


class ExamSubjectViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet
):
    """
    ADMIN-only ExamSubject ViewSet providing list, create, retrieve, update (PATCH), search, and filtering.
    Note: DELETE endpoint is intentionally omitted in Phase 11 to preserve historical exam structure.
    Endpoints:
    - GET    /api/exam-subjects/
    - POST   /api/exam-subjects/
    - GET    /api/exam-subjects/{id}/
    - PATCH  /api/exam-subjects/{id}/
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'subject__code',
        'subject__name',
        'exam__name',
    ]
    ordering_fields = ['display_order', 'subject__code', 'maximum_marks', 'created_at']
    ordering = ['display_order', 'id']

    def get_queryset(self):
        queryset = ExamSubject.objects.select_related(
            'exam',
            'exam__academic_year',
            'exam__semester',
            'subject',
            'subject__department',
            'subject__semester'
        )
        params = self.request.query_params

        # Filter by exam
        exam_id = params.get('exam_id')
        if exam_id:
            queryset = queryset.filter(exam_id=exam_id)

        # Filter by subject
        subject_id = params.get('subject_id')
        if subject_id:
            queryset = queryset.filter(subject_id=subject_id)

        # Filter by active status
        is_active_param = params.get('is_active')
        if is_active_param is not None:
            is_active_bool = is_active_param.lower() in ['true', '1', 't']
            queryset = queryset.filter(is_active=is_active_bool)

        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return ExamSubjectCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ExamSubjectUpdateSerializer
        elif self.action == 'retrieve':
            return ExamSubjectDetailSerializer
        return ExamSubjectListSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        exam_subject = serializer.save()
        output_serializer = ExamSubjectDetailSerializer(exam_subject)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        updated_exam_subject = serializer.save()
        output_serializer = ExamSubjectDetailSerializer(updated_exam_subject)
        return Response(output_serializer.data, status=status.HTTP_200_OK)


class ExamComponentViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet
):
    """
    ADMIN-only ExamComponent ViewSet providing list, create, retrieve, update (PATCH), search, and filtering.
    Note: DELETE endpoint is intentionally omitted in Phase 12 to preserve historical examination component structure.
    Endpoints:
    - GET    /api/exam-components/
    - POST   /api/exam-components/
    - GET    /api/exam-components/{id}/
    - PATCH  /api/exam-components/{id}/
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'name',
        'code',
        'exam_subject__subject__code',
        'exam_subject__subject__name',
        'exam_subject__exam__name',
    ]
    ordering_fields = ['display_order', 'name', 'maximum_marks', 'created_at']
    ordering = ['display_order', 'id']

    def get_queryset(self):
        queryset = ExamComponent.objects.select_related(
            'exam_subject',
            'exam_subject__exam',
            'exam_subject__subject'
        )
        params = self.request.query_params

        # Filter by exam_subject_id
        es_id = params.get('exam_subject_id')
        if es_id:
            queryset = queryset.filter(exam_subject_id=es_id)

        # Filter by exam_id
        exam_id = params.get('exam_id')
        if exam_id:
            queryset = queryset.filter(exam_subject__exam_id=exam_id)

        # Filter by active status
        is_active_param = params.get('is_active')
        if is_active_param is not None:
            is_active_bool = is_active_param.lower() in ['true', '1', 't']
            queryset = queryset.filter(is_active=is_active_bool)

        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return ExamComponentCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ExamComponentUpdateSerializer
        elif self.action == 'retrieve':
            return ExamComponentDetailSerializer
        return ExamComponentListSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        component = serializer.save()
        output_serializer = ExamComponentDetailSerializer(component)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        updated_component = serializer.save()
        output_serializer = ExamComponentDetailSerializer(updated_component)
        return Response(output_serializer.data, status=status.HTTP_200_OK)
