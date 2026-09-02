from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from apps.accounts.models import User
from apps.accounts.permissions import IsAdminOrTeacher, IsAdmin
from apps.academics.models import StudentProfile, Classroom, Subject, TeacherAssignment
from apps.examinations.models import Exam
from .services import generate_result_pdf, AnalyticsService, AIAnalyticsService


def get_teacher_assigned_section_ids(user, academic_year=None, subject_id=None):
    """
    Helper returning list of assigned section IDs for a teacher user.
    """
    if not hasattr(user, 'teacher_profile'):
        return []
    tp = user.teacher_profile
    qs = TeacherAssignment.objects.filter(teacher=tp, is_active=True)
    if academic_year:
        qs = qs.filter(academic_year=academic_year)
    if subject_id:
        qs = qs.filter(subject_id=subject_id)
    return list(qs.values_list('section_id', flat=True).distinct())


class ResultPDFView(APIView):
    """
    Generates and returns the official Examination Result PDF for a student.
    GET /api/results/<student_id>/<exam_id>/pdf/
    Permissions:
    - ADMIN: Full access to all student result PDFs.
    - STUDENT: Access allowed ONLY for their own student profile.
    - TEACHER: Access allowed ONLY if assigned to the student's section/subject via TeacherAssignment.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id, exam_id):
        user = request.user

        try:
            student = StudentProfile.objects.select_related(
                'user',
                'section',
                'section__classroom',
                'section__classroom__semester',
                'section__classroom__semester__program',
                'section__classroom__semester__program__department'
            ).get(id=student_id)
        except StudentProfile.DoesNotExist:
            return Response({"detail": "Student profile not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            exam = Exam.objects.select_related('academic_year', 'semester').get(id=exam_id)
        except Exam.DoesNotExist:
            return Response({"detail": "Examination not found."}, status=status.HTTP_404_NOT_FOUND)

        # Role & Ownership Authorization Checks
        if user.role == User.Role.STUDENT:
            if not hasattr(user, 'student_profile') or user.student_profile.id != student.id:
                return Response({"detail": "You do not have permission to view this student's result PDF."}, status=status.HTTP_403_FORBIDDEN)
        elif user.role == User.Role.TEACHER:
            if not hasattr(user, 'teacher_profile'):
                return Response({"detail": "Teacher profile not found."}, status=status.HTTP_403_FORBIDDEN)
            tp = user.teacher_profile
            assigned = TeacherAssignment.objects.filter(
                teacher=tp,
                section=student.section,
                academic_year=exam.academic_year,
                is_active=True
            ).exists()
            if not assigned:
                return Response({"detail": "You are not assigned to view results for this student's section."}, status=status.HTTP_403_FORBIDDEN)
        elif user.role == User.Role.ADMIN or user.is_superuser:
            pass
        else:
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        # Determine host base_url for QR
        scheme = request.scheme
        host = request.get_host()
        base_url = f"{scheme}://{host}"

        # Generate PDF stream
        pdf_buffer = generate_result_pdf(student, exam, base_url=base_url)

        student_name_clean = student.user.get_full_name().replace(' ', '_') if student.user else f"Student_{student.id}"
        filename = f"PR-TERRA_{student_name_clean}_Exam_{exam.id}_Result.pdf"

        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response


class ExamAnalyticsView(APIView):
    """
    GET /api/analytics/exam/<exam_id>/
    Returns exam performance analytics.
    """
    permission_classes = [IsAuthenticated, IsAdminOrTeacher]

    def get(self, request, exam_id):
        user = request.user
        try:
            exam = Exam.objects.select_related('academic_year', 'semester').get(id=exam_id)
        except Exam.DoesNotExist:
            return Response({"detail": "Examination not found."}, status=status.HTTP_404_NOT_FOUND)

        section_ids = None
        if user.role == User.Role.TEACHER and not user.is_superuser:
            section_ids = get_teacher_assigned_section_ids(user, academic_year=exam.academic_year)
            if not section_ids:
                return Response({"detail": "You have no assigned sections for this examination."}, status=status.HTTP_403_FORBIDDEN)

        data = AnalyticsService.get_exam_analytics(exam, section_ids=section_ids)
        return Response(data, status=status.HTTP_200_OK)


class SubjectAnalyticsView(APIView):
    """
    GET /api/analytics/subject/<subject_id>/?exam_id=1
    Returns subject performance analytics.
    """
    permission_classes = [IsAuthenticated, IsAdminOrTeacher]

    def get(self, request, subject_id):
        user = request.user
        exam_id = request.query_params.get('exam_id')
        if not exam_id:
            return Response({"detail": "Query parameter 'exam_id' is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            subject = Subject.objects.get(id=subject_id)
        except Subject.DoesNotExist:
            return Response({"detail": "Subject not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            exam = Exam.objects.select_related('academic_year', 'semester').get(id=exam_id)
        except Exam.DoesNotExist:
            return Response({"detail": "Examination not found."}, status=status.HTTP_404_NOT_FOUND)

        section_ids = None
        if user.role == User.Role.TEACHER and not user.is_superuser:
            section_ids = get_teacher_assigned_section_ids(user, academic_year=exam.academic_year, subject_id=subject.id)
            if not section_ids:
                return Response({"detail": "You are not assigned to this subject."}, status=status.HTTP_403_FORBIDDEN)

        data = AnalyticsService.get_subject_analytics(subject, exam, section_ids=section_ids)
        return Response(data, status=status.HTTP_200_OK)


class ClassAnalyticsView(APIView):
    """
    GET /api/analytics/class/<class_id>/?exam_id=1
    Returns class/classroom performance analytics.
    """
    permission_classes = [IsAuthenticated, IsAdminOrTeacher]

    def get(self, request, class_id):
        user = request.user
        exam_id = request.query_params.get('exam_id')
        if not exam_id:
            return Response({"detail": "Query parameter 'exam_id' is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            classroom = Classroom.objects.get(id=class_id)
        except Classroom.DoesNotExist:
            return Response({"detail": "Classroom not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            exam = Exam.objects.select_related('academic_year', 'semester').get(id=exam_id)
        except Exam.DoesNotExist:
            return Response({"detail": "Examination not found."}, status=status.HTTP_404_NOT_FOUND)

        section_ids = None
        if user.role == User.Role.TEACHER and not user.is_superuser:
            section_ids = get_teacher_assigned_section_ids(user, academic_year=exam.academic_year)
            if not section_ids:
                return Response({"detail": "You are not assigned to any sections in this class."}, status=status.HTTP_403_FORBIDDEN)

        data = AnalyticsService.get_class_analytics(classroom, exam, section_ids=section_ids)
        return Response(data, status=status.HTTP_200_OK)


class GradeDistributionView(APIView):
    """
    GET /api/analytics/exam/<exam_id>/grades/
    Returns grade distribution counts.
    """
    permission_classes = [IsAuthenticated, IsAdminOrTeacher]

    def get(self, request, exam_id):
        user = request.user
        try:
            exam = Exam.objects.select_related('academic_year', 'semester').get(id=exam_id)
        except Exam.DoesNotExist:
            return Response({"detail": "Examination not found."}, status=status.HTTP_404_NOT_FOUND)

        section_ids = None
        if user.role == User.Role.TEACHER and not user.is_superuser:
            section_ids = get_teacher_assigned_section_ids(user, academic_year=exam.academic_year)

        data = AnalyticsService.get_grade_distribution(exam, section_ids=section_ids)
        return Response(data, status=status.HTTP_200_OK)


class MarksDistributionView(APIView):
    """
    GET /api/analytics/exam/<exam_id>/distribution/
    Returns percentage range distribution.
    """
    permission_classes = [IsAuthenticated, IsAdminOrTeacher]

    def get(self, request, exam_id):
        user = request.user
        try:
            exam = Exam.objects.select_related('academic_year', 'semester').get(id=exam_id)
        except Exam.DoesNotExist:
            return Response({"detail": "Examination not found."}, status=status.HTTP_404_NOT_FOUND)

        section_ids = None
        if user.role == User.Role.TEACHER and not user.is_superuser:
            section_ids = get_teacher_assigned_section_ids(user, academic_year=exam.academic_year)

        data = AnalyticsService.get_marks_distribution(exam, section_ids=section_ids)
        return Response(data, status=status.HTTP_200_OK)


class StudentAnalyticsView(APIView):
    """
    GET /api/analytics/student/<student_id>/?exam_id=1
    Returns student performance summary.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        user = request.user
        exam_id = request.query_params.get('exam_id')
        if not exam_id:
            return Response({"detail": "Query parameter 'exam_id' is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            student = StudentProfile.objects.select_related('user', 'section').get(id=student_id)
        except StudentProfile.DoesNotExist:
            return Response({"detail": "Student profile not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            exam = Exam.objects.select_related('academic_year', 'semester').get(id=exam_id)
        except Exam.DoesNotExist:
            return Response({"detail": "Examination not found."}, status=status.HTTP_404_NOT_FOUND)

        if user.role == User.Role.STUDENT:
            if not hasattr(user, 'student_profile') or user.student_profile.id != student.id:
                return Response({"detail": "You can only access your own performance analytics."}, status=status.HTTP_403_FORBIDDEN)
        elif user.role == User.Role.TEACHER and not user.is_superuser:
            section_ids = get_teacher_assigned_section_ids(user, academic_year=exam.academic_year)
            if student.section_id not in section_ids:
                return Response({"detail": "You are not assigned to this student's section."}, status=status.HTTP_403_FORBIDDEN)

        data = AnalyticsService.get_student_analytics(student, exam)
        return Response(data, status=status.HTTP_200_OK)


class StudentAIAnalyticsView(APIView):
    """
    GET /api/ai-analytics/student/<student_id>/?exam_id=1
    Generates AI performance insights for a specific student.
    Permissions:
    - ADMIN: Full access.
    - TEACHER: Access allowed ONLY if assigned to the student's section via TeacherAssignment.
    - STUDENT: Access allowed ONLY for their own student profile.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        user = request.user
        exam_id = request.query_params.get('exam_id')
        if not exam_id:
            return Response({"detail": "Query parameter 'exam_id' is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            student = StudentProfile.objects.select_related('user', 'section').get(id=student_id)
        except StudentProfile.DoesNotExist:
            return Response({"detail": "Student profile not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            exam = Exam.objects.select_related('academic_year', 'semester').get(id=exam_id)
        except Exam.DoesNotExist:
            return Response({"detail": "Examination not found."}, status=status.HTTP_404_NOT_FOUND)

        # Scoping Checks
        if user.role == User.Role.STUDENT:
            if not hasattr(user, 'student_profile') or user.student_profile.id != student.id:
                return Response({"detail": "You do not have permission to view AI analytics for this student."}, status=status.HTTP_403_FORBIDDEN)
        elif user.role == User.Role.TEACHER and not user.is_superuser:
            section_ids = get_teacher_assigned_section_ids(user, academic_year=exam.academic_year)
            if student.section_id not in section_ids:
                return Response({"detail": "You are not assigned to view AI analytics for this student's section."}, status=status.HTTP_403_FORBIDDEN)

        data = AIAnalyticsService.analyze_student(student, exam)
        return Response(data, status=status.HTTP_200_OK)


class ExamAIAnalyticsView(APIView):
    """
    GET /api/ai-analytics/exam/<exam_id>/
    Generates exam-wide AI performance insights and risk breakdown.
    Permissions: ADMIN and TEACHER.
    """
    permission_classes = [IsAuthenticated, IsAdminOrTeacher]

    def get(self, request, exam_id):
        user = request.user
        try:
            exam = Exam.objects.select_related('academic_year', 'semester').get(id=exam_id)
        except Exam.DoesNotExist:
            return Response({"detail": "Examination not found."}, status=status.HTTP_404_NOT_FOUND)

        section_ids = None
        if user.role == User.Role.TEACHER and not user.is_superuser:
            section_ids = get_teacher_assigned_section_ids(user, academic_year=exam.academic_year)
            if not section_ids:
                return Response({"detail": "You have no assigned sections for this examination."}, status=status.HTTP_403_FORBIDDEN)

        data = AIAnalyticsService.analyze_exam(exam, section_ids=section_ids)
        return Response(data, status=status.HTTP_200_OK)
