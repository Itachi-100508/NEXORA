from rest_framework import viewsets, mixins, status, filters
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q

from apps.accounts.models import User
from apps.accounts.permissions import IsAdmin, IsAdminOrTeacher
from apps.academics.models import TeacherAssignment
from .models import MarkEntry, MarkCorrectionRequest
from .serializers import (
    MarkEntryListSerializer,
    MarkEntryDetailSerializer,
    MarkEntryCreateSerializer,
    MarkEntryUpdateSerializer,
    MarksCreateSerializer,
    MarksFormattedResponseSerializer,
    MarkCorrectionRequestSerializer,
    MarkCorrectionCreateSerializer,
    MarkCorrectionReviewSerializer,
)


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class MarkEntryViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet
):
    """
    MarkEntry ViewSet providing list, create, retrieve, update (PATCH), search, and filtering.
    Note: DELETE endpoint is intentionally omitted in Phase 13 to preserve historical examination mark records.
    Endpoints:
    - GET    /api/mark-entries/
    - POST   /api/mark-entries/
    - GET    /api/mark-entries/{id}/
    - PATCH  /api/mark-entries/{id}/
    """
    permission_classes = [IsAuthenticated, IsAdminOrTeacher]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'student__user__first_name',
        'student__user__last_name',
        'student__roll_number',
        'exam_component__name',
        'exam_component__code',
        'exam_component__exam_subject__subject__code',
        'exam_component__exam_subject__subject__name',
        'exam_component__exam_subject__exam__name',
    ]
    ordering_fields = ['obtained_marks', 'created_at', 'updated_at']
    ordering = ['-created_at', 'id']

    def get_queryset(self):
        user = self.request.user
        queryset = MarkEntry.objects.select_related(
            'student',
            'student__user',
            'student__section',
            'exam_component',
            'exam_component__exam_subject',
            'exam_component__exam_subject__exam',
            'exam_component__exam_subject__subject',
            'entered_by',
            'updated_by'
        )

        # Scoping for TEACHER role
        if user.is_authenticated and user.role == User.Role.TEACHER:
            if hasattr(user, 'teacher_profile'):
                tp = user.teacher_profile
                assignments = TeacherAssignment.objects.filter(teacher=tp, is_active=True)

                assignment_q = Q()
                for assign in assignments:
                    assignment_q |= Q(
                        exam_component__exam_subject__subject_id=assign.subject_id,
                        student__section_id=assign.section_id,
                        exam_component__exam_subject__exam__academic_year_id=assign.academic_year_id
                    )
                if assignment_q:
                    queryset = queryset.filter(assignment_q)
                else:
                    queryset = queryset.none()
            else:
                queryset = queryset.none()

        params = self.request.query_params

        # Filter by student_id
        student_id = params.get('student_id')
        if student_id:
            queryset = queryset.filter(student_id=student_id)

        # Filter by exam_component_id
        comp_id = params.get('exam_component_id')
        if comp_id:
            queryset = queryset.filter(exam_component_id=comp_id)

        # Filter by exam_subject_id
        es_id = params.get('exam_subject_id')
        if es_id:
            queryset = queryset.filter(exam_component__exam_subject_id=es_id)

        # Filter by exam_id
        exam_id = params.get('exam_id')
        if exam_id:
            queryset = queryset.filter(exam_component__exam_subject__exam_id=exam_id)

        # Filter by subject_id
        subject_id = params.get('subject_id')
        if subject_id:
            queryset = queryset.filter(exam_component__exam_subject__subject_id=subject_id)

        # Filter by entered_by
        entered_by = params.get('entered_by')
        if entered_by:
            queryset = queryset.filter(entered_by_id=entered_by)

        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return MarkEntryCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return MarkEntryUpdateSerializer
        elif self.action == 'retrieve':
            return MarkEntryDetailSerializer
        return MarkEntryListSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        mark_entry = serializer.save()
        output_serializer = MarkEntryDetailSerializer(mark_entry)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial, context={'request': request})
        serializer.is_valid(raise_exception=True)
        updated_mark_entry = serializer.save()
        output_serializer = MarkEntryDetailSerializer(updated_mark_entry)
        return Response(output_serializer.data, status=status.HTTP_200_OK)


class MarksViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet
):
    """
    Dedicated Marks ViewSet at /api/marks/ providing create/upsert and list/retrieve/update.
    Endpoints:
    - POST   /api/marks/
    - GET    /api/marks/
    - GET    /api/marks/{id}/
    - PATCH  /api/marks/{id}/
    """
    permission_classes = [IsAuthenticated, IsAdminOrTeacher]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'student__user__first_name',
        'student__user__last_name',
        'student__roll_number',
        'exam_component__name',
        'exam_component__code',
        'exam_component__exam_subject__subject__code',
        'exam_component__exam_subject__subject__name',
        'exam_component__exam_subject__exam__name',
    ]
    ordering_fields = ['obtained_marks', 'created_at', 'updated_at']
    ordering = ['-created_at', 'id']

    def get_queryset(self):
        user = self.request.user
        queryset = MarkEntry.objects.select_related(
            'student',
            'student__user',
            'student__section',
            'exam_component',
            'exam_component__exam_subject',
            'exam_component__exam_subject__exam',
            'exam_component__exam_subject__subject',
            'entered_by',
            'updated_by'
        )

        if user.is_authenticated and user.role == User.Role.TEACHER:
            if hasattr(user, 'teacher_profile'):
                tp = user.teacher_profile
                assignments = TeacherAssignment.objects.filter(teacher=tp, is_active=True)

                assignment_q = Q()
                for assign in assignments:
                    assignment_q |= Q(
                        exam_component__exam_subject__subject_id=assign.subject_id,
                        student__section_id=assign.section_id,
                        exam_component__exam_subject__exam__academic_year_id=assign.academic_year_id
                    )
                if assignment_q:
                    queryset = queryset.filter(assignment_q)
                else:
                    queryset = queryset.none()
            else:
                queryset = queryset.none()

        params = self.request.query_params

        student_id = params.get('student_id')
        if student_id:
            queryset = queryset.filter(student_id=student_id)

        comp_id = params.get('exam_component_id')
        if comp_id:
            queryset = queryset.filter(exam_component_id=comp_id)

        es_id = params.get('exam_subject_id')
        if es_id:
            queryset = queryset.filter(exam_component__exam_subject_id=es_id)

        exam_id = params.get('exam_id')
        if exam_id:
            queryset = queryset.filter(exam_component__exam_subject__exam_id=exam_id)

        subject_id = params.get('subject_id')
        if subject_id:
            queryset = queryset.filter(exam_component__exam_subject__subject_id=subject_id)

        entered_by = params.get('entered_by')
        if entered_by:
            queryset = queryset.filter(entered_by_id=entered_by)

        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return MarksCreateSerializer
        elif self.action == 'retrieve':
            return MarksFormattedResponseSerializer
        elif self.action in ['update', 'partial_update']:
            return MarkEntryUpdateSerializer
        return MarksFormattedResponseSerializer

    def create(self, request, *args, **kwargs):
        serializer = MarksCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        student_id = serializer.validated_data['student_id']
        comp_id = serializer.validated_data['exam_component_id']
        exam_sub_id = serializer.validated_data.get('exam_subject_id')
        obtained_marks = serializer.validated_data['obtained_marks']

        from django.core.exceptions import ValidationError, PermissionDenied
        from .services import create_or_update_mark_entry

        try:
            mark_entry, created = create_or_update_mark_entry(
                user=request.user,
                student_id=student_id,
                exam_component_id=comp_id,
                obtained_marks=obtained_marks,
                exam_subject_id=exam_sub_id,
                request=request
            )
        except ValidationError as e:
            if hasattr(e, 'message_dict'):
                return Response(e.message_dict, status=status.HTTP_400_BAD_REQUEST)
            return Response({"detail": str(e.message if hasattr(e, 'message') else e)}, status=status.HTTP_400_BAD_REQUEST)
        except PermissionDenied as e:
            return Response({"detail": str(e)}, status=status.HTTP_403_FORBIDDEN)

        response_serializer = MarksFormattedResponseSerializer(mark_entry)
        http_status = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(response_serializer.data, status=http_status)


class MarkCorrectionRequestViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet
):
    """
    Phase 20 — Mark Correction Request ViewSet.
    Endpoints:
    - POST  /api/mark-corrections/
    - GET   /api/mark-corrections/
    - GET   /api/mark-corrections/{id}/
    - POST  /api/mark-corrections/{id}/approve/ (ADMIN only)
    - POST  /api/mark-corrections/{id}/reject/  (ADMIN only)
    """
    permission_classes = [IsAuthenticated, IsAdminOrTeacher]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'mark_entry__student__user__first_name',
        'mark_entry__student__user__last_name',
        'mark_entry__student__roll_number',
        'reason',
        'review_comment',
    ]
    ordering_fields = ['created_at', 'id']
    ordering = ['-created_at', 'id']

    def get_queryset(self):
        user = self.request.user
        queryset = MarkCorrectionRequest.objects.select_related(
            'mark_entry',
            'mark_entry__student',
            'mark_entry__student__user',
            'mark_entry__exam_component',
            'mark_entry__exam_component__exam_subject',
            'mark_entry__exam_component__exam_subject__subject',
            'requested_by',
            'reviewed_by'
        )

        if user.is_authenticated and user.role == User.Role.TEACHER and not user.is_superuser:
            queryset = queryset.filter(requested_by=user)

        params = self.request.query_params

        req_status = params.get('status')
        if req_status:
            queryset = queryset.filter(status=req_status)

        requested_by = params.get('requested_by')
        if requested_by:
            queryset = queryset.filter(requested_by_id=requested_by)

        mark_entry_id = params.get('mark_entry_id')
        if mark_entry_id:
            queryset = queryset.filter(mark_entry_id=mark_entry_id)

        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return MarkCorrectionCreateSerializer
        elif self.action in ['approve', 'reject']:
            return MarkCorrectionReviewSerializer
        return MarkCorrectionRequestSerializer

    def create(self, request, *args, **kwargs):
        serializer = MarkCorrectionCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        mark_entry_id = serializer.validated_data['mark_entry_id']
        requested_marks = serializer.validated_data['requested_marks']
        reason = serializer.validated_data['reason']

        mark_entry = MarkEntry.objects.get(id=mark_entry_id)

        correction = MarkCorrectionRequest.objects.create(
            mark_entry=mark_entry,
            requested_by=request.user,
            old_marks=mark_entry.obtained_marks,
            requested_marks=requested_marks,
            reason=reason,
            status=MarkCorrectionRequest.Status.PENDING
        )

        # Log Audit event for CORRECTION_REQUEST
        from apps.audit.services import log_action
        from apps.notifications.services import (
            notify_correction_requested,
            notify_correction_approved,
            notify_correction_rejected,
        )

        log_action(
            user=request.user,
            action='CORRECTION_REQUEST',
            entity_type='MarkCorrectionRequest',
            entity_id=correction.id,
            description=f"Created correction request for MarkEntry #{mark_entry.id}: {mark_entry.obtained_marks} -> {requested_marks}",
            old_data={"obtained_marks": str(mark_entry.obtained_marks)},
            new_data={"requested_marks": str(requested_marks), "reason": reason},
            request=request
        )

        notify_correction_requested(correction, request=request)

        out_serializer = MarkCorrectionRequestSerializer(correction)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdmin])
    def approve(self, request, pk=None):
        correction = self.get_object()

        if correction.status != MarkCorrectionRequest.Status.PENDING:
            return Response({"detail": "This correction request has already been processed."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = MarkCorrectionReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review_comment = serializer.validated_data.get('review_comment', '')

        from django.db import transaction
        from django.utils import timezone
        from apps.audit.services import log_action
        from apps.notifications.services import notify_correction_approved

        with transaction.atomic():
            # Concurrency Check: Ensure mark_entry.obtained_marks still matches old_marks
            mark_entry = MarkEntry.objects.select_for_update().get(id=correction.mark_entry_id)
            if mark_entry.obtained_marks != correction.old_marks:
                return Response(
                    {"detail": "Mark has changed since this correction request was created. Approval aborted."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            old_val = str(mark_entry.obtained_marks)
            mark_entry.obtained_marks = correction.requested_marks
            mark_entry.updated_by = request.user
            mark_entry.save()

            correction.status = MarkCorrectionRequest.Status.APPROVED
            correction.reviewed_by = request.user
            correction.review_comment = review_comment
            correction.reviewed_at = timezone.now()
            correction.save()

            # Audit Log for Correction Approval
            log_action(
                user=request.user,
                action='APPROVE',
                entity_type='MarkCorrectionRequest',
                entity_id=correction.id,
                description=f"Approved correction request #{correction.id} for MarkEntry #{mark_entry.id}",
                old_data={"obtained_marks": old_val},
                new_data={"obtained_marks": str(correction.requested_marks), "review_comment": review_comment},
                request=request
            )

            notify_correction_approved(correction, request=request)

        out_serializer = MarkCorrectionRequestSerializer(correction)
        return Response(out_serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdmin])
    def reject(self, request, pk=None):
        correction = self.get_object()

        if correction.status != MarkCorrectionRequest.Status.PENDING:
            return Response({"detail": "This correction request has already been processed."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = MarkCorrectionReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review_comment = serializer.validated_data.get('review_comment', '')

        from django.utils import timezone
        from apps.audit.services import log_action
        from apps.notifications.services import notify_correction_rejected

        correction.status = MarkCorrectionRequest.Status.REJECTED
        correction.reviewed_by = request.user
        correction.review_comment = review_comment
        correction.reviewed_at = timezone.now()
        correction.save()

        # Audit Log for Correction Rejection
        log_action(
            user=request.user,
            action='REJECT',
            entity_type='MarkCorrectionRequest',
            entity_id=correction.id,
            description=f"Rejected correction request #{correction.id}",
            old_data={"status": "PENDING"},
            new_data={"status": "REJECTED", "review_comment": review_comment},
            request=request
        )

        notify_correction_rejected(correction, request=request)

        out_serializer = MarkCorrectionRequestSerializer(correction)
        return Response(out_serializer.data, status=status.HTTP_200_OK)


class ExcelImportView(APIView):
    """
    POST /api/marks/import/
    Imports student marks from an Excel file (.xlsx) into MarkEntry system.
    Accepts multipart/form-data with 'file' and 'exam_id'.
    Permissions: ADMIN and TEACHER.
    """
    permission_classes = [IsAuthenticated, IsAdminOrTeacher]

    def post(self, request, *args, **kwargs):
        from rest_framework.parsers import MultiPartParser, FormParser
        from .services import import_marks_from_excel
        from .serializers import ExcelImportSerializer

        serializer = ExcelImportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        file_obj = serializer.validated_data['file']
        exam_id = serializer.validated_data['exam_id']

        result = import_marks_from_excel(
            file_obj=file_obj,
            exam_id=exam_id,
            user=request.user,
            request=request
        )

        status_code = status.HTTP_200_OK if result.get("success") else status.HTTP_400_BAD_REQUEST
        return Response(result, status=status_code)
