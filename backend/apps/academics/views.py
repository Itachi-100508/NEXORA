from rest_framework import viewsets, mixins, status, filters
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.db import models

from apps.accounts.permissions import IsAdmin
from .models import StudentProfile, TeacherProfile, Subject, TeacherAssignment
from .serializers import (
    StudentListSerializer,
    StudentDetailSerializer,
    StudentCreateSerializer,
    StudentUpdateSerializer,
    TeacherListSerializer,
    TeacherDetailSerializer,
    TeacherCreateSerializer,
    TeacherUpdateSerializer,
    SubjectListSerializer,
    SubjectDetailSerializer,
    SubjectCreateSerializer,
    TeacherAssignmentListSerializer,
    TeacherAssignmentDetailSerializer,
    TeacherAssignmentCreateSerializer,
    TeacherAssignmentUpdateSerializer,
)


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class StudentViewSet(viewsets.ModelViewSet):
    """
    ADMIN-only Student Management ViewSet providing complete CRUD, search, filtering, and soft-delete capabilities.
    Endpoints:
    - GET    /api/students/
    - POST   /api/students/
    - GET    /api/students/{id}/
    - PATCH  /api/students/{id}/
    - DELETE /api/students/{id}/
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'user__first_name',
        'user__last_name',
        'user__username',
        'user__email',
        'enrollment_number',
        'roll_number',
    ]
    ordering_fields = ['enrollment_number', 'roll_number', 'created_at']
    ordering = ['enrollment_number']

    def get_queryset(self):
        queryset = StudentProfile.objects.select_related(
            'user',
            'classroom',
            'section',
            'section__classroom',
            'section__classroom__semester',
            'section__classroom__program',
            'section__classroom__program__department',
            'section__classroom__academic_year'
        )

        params = self.request.query_params

        # Filter by class / classroom
        class_id = params.get('class_id') or params.get('classroom_id')
        if class_id:
            queryset = queryset.filter(
                models.Q(section__classroom_id=class_id) | models.Q(classroom_id=class_id)
            )

        # Filter by section
        section_id = params.get('section_id')
        if section_id:
            queryset = queryset.filter(section_id=section_id)

        # Filter by department
        dept_id = params.get('department_id')
        if dept_id:
            queryset = queryset.filter(
                models.Q(section__classroom__program__department_id=dept_id) |
                models.Q(classroom__program__department_id=dept_id)
            )

        # Filter by semester number
        semester = params.get('semester')
        if semester:
            queryset = queryset.filter(
                models.Q(section__classroom__semester__number=semester) |
                models.Q(classroom__semester__number=semester)
            )

        # Filter by academic year
        ay_id = params.get('academic_year_id')
        if ay_id:
            queryset = queryset.filter(
                models.Q(section__classroom__academic_year_id=ay_id) |
                models.Q(classroom__academic_year_id=ay_id)
            )

        # Filter by active status
        is_active_param = params.get('is_active')
        if is_active_param is not None:
            is_active_bool = is_active_param.lower() in ['true', '1', 't']
            queryset = queryset.filter(is_active=is_active_bool)

        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return StudentCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return StudentUpdateSerializer
        elif self.action == 'retrieve':
            return StudentDetailSerializer
        return StudentListSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        student_profile = serializer.save()
        output_serializer = StudentDetailSerializer(student_profile)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        updated_profile = serializer.save()
        output_serializer = StudentDetailSerializer(updated_profile)
        return Response(output_serializer.data, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        student_profile = self.get_object()
        student_profile.is_active = False
        student_profile.save()
        if student_profile.user:
            student_profile.user.is_active = False
            student_profile.user.save()

        return Response(
            {"message": "Student deactivated successfully"},
            status=status.HTTP_200_OK
        )


class TeacherViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet
):
    """
    ADMIN-only Teacher Management ViewSet providing list, create, detail, update, search, and filtering capabilities.
    Note: DELETE endpoint is intentionally omitted to preserve historical academic references.
    Endpoints:
    - GET    /api/teachers/
    - POST   /api/teachers/
    - GET    /api/teachers/{id}/
    - PATCH  /api/teachers/{id}/
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'user__first_name',
        'user__last_name',
        'user__username',
        'user__email',
        'employee_id',
        'designation',
        'department__name',
    ]
    ordering_fields = ['employee_id', 'created_at']
    ordering = ['employee_id']

    def get_queryset(self):
        queryset = TeacherProfile.objects.select_related('user', 'department')
        params = self.request.query_params

        # Filter by department
        dept_id = params.get('department_id')
        if dept_id:
            queryset = queryset.filter(department_id=dept_id)

        # Filter by active status
        is_active_param = params.get('is_active')
        if is_active_param is not None:
            is_active_bool = is_active_param.lower() in ['true', '1', 't']
            queryset = queryset.filter(is_active=is_active_bool)

        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return TeacherCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return TeacherUpdateSerializer
        elif self.action == 'retrieve':
            return TeacherDetailSerializer
        return TeacherListSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        teacher_profile = serializer.save()
        output_serializer = TeacherDetailSerializer(teacher_profile)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        updated_profile = serializer.save()
        output_serializer = TeacherDetailSerializer(updated_profile)
        return Response(output_serializer.data, status=status.HTTP_200_OK)


class SubjectViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet
):
    """
    ADMIN-only Subject Management ViewSet providing list, create, retrieve, search, ordering, and filtering capabilities.
    Note: PATCH and DELETE endpoints are intentionally omitted in Phase 08 to preserve historical academic references.
    Endpoints:
    - GET    /api/subjects/
    - POST   /api/subjects/
    - GET    /api/subjects/{id}/
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'code',
        'name',
        'department__name',
        'semester__name',
    ]
    ordering_fields = ['code', 'name', 'credits', 'created_at']
    ordering = ['code']

    def get_queryset(self):
        queryset = Subject.objects.select_related('department', 'semester', 'semester__program')
        params = self.request.query_params

        # Filter by department
        dept_id = params.get('department_id')
        if dept_id:
            queryset = queryset.filter(department_id=dept_id)

        # Filter by semester
        sem_id = params.get('semester_id')
        if sem_id:
            queryset = queryset.filter(semester_id=sem_id)

        # Filter by active status
        is_active_param = params.get('is_active')
        if is_active_param is not None:
            is_active_bool = is_active_param.lower() in ['true', '1', 't']
            queryset = queryset.filter(is_active=is_active_bool)

        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return SubjectCreateSerializer
        elif self.action == 'retrieve':
            return SubjectDetailSerializer
        return SubjectListSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        subject = serializer.save()
        output_serializer = SubjectDetailSerializer(subject)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)


class TeacherAssignmentViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet
):
    """
    ADMIN-only Teacher Assignment ViewSet providing list, create, retrieve, update (PATCH), search, and filtering.
    Note: DELETE endpoint is intentionally omitted in Phase 09 to preserve historical academic references.
    Endpoints:
    - GET    /api/assignments/
    - POST   /api/assignments/
    - GET    /api/assignments/{id}/
    - PATCH  /api/assignments/{id}/
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'teacher__user__first_name',
        'teacher__user__last_name',
        'teacher__employee_id',
        'subject__code',
        'subject__name',
        'section__name',
        'section__classroom__name',
        'academic_year__name',
    ]
    ordering_fields = ['created_at', 'assigned_at']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = TeacherAssignment.objects.select_related(
            'teacher',
            'teacher__user',
            'subject',
            'section',
            'section__classroom',
            'academic_year'
        )
        params = self.request.query_params

        # Filter by teacher
        teacher_id = params.get('teacher_id')
        if teacher_id:
            queryset = queryset.filter(teacher_id=teacher_id)

        # Filter by subject
        subject_id = params.get('subject_id')
        if subject_id:
            queryset = queryset.filter(subject_id=subject_id)

        # Filter by section
        section_id = params.get('section_id')
        if section_id:
            queryset = queryset.filter(section_id=section_id)

        # Filter by classroom / class
        class_id = params.get('class_id') or params.get('classroom_id')
        if class_id:
            queryset = queryset.filter(section__classroom_id=class_id)

        # Filter by academic year
        ay_id = params.get('academic_year_id')
        if ay_id:
            queryset = queryset.filter(academic_year_id=ay_id)

        # Filter by active status
        is_active_param = params.get('is_active')
        if is_active_param is not None:
            is_active_bool = is_active_param.lower() in ['true', '1', 't']
            queryset = queryset.filter(is_active=is_active_bool)

        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return TeacherAssignmentCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return TeacherAssignmentUpdateSerializer
        elif self.action == 'retrieve':
            return TeacherAssignmentDetailSerializer
        return TeacherAssignmentListSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        assignment = serializer.save()
        output_serializer = TeacherAssignmentDetailSerializer(assignment)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        updated_assignment = serializer.save()
        output_serializer = TeacherAssignmentDetailSerializer(updated_assignment)
        return Response(output_serializer.data, status=status.HTTP_200_OK)
