from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model

from apps.academics.models import (
    Department, Program, Semester, Classroom, Section, Subject,
    AcademicYear, StudentProfile, TeacherProfile, TeacherAssignment
)
from apps.examinations.models import Exam, ExamSubject, ExamComponent
from apps.marks.models import MarkEntry, MarkCorrectionRequest
from apps.audit.models import AuditLog
from apps.notifications.models import Notification

User = get_user_model()


class MarkCorrectionWorkflowTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser('admin', 'admin@example.com', 'AdminPass123', role='ADMIN')
        self.teacher_user = User.objects.create_user('teacher1', 'teacher1@example.com', 'TeacherPass123', role='TEACHER')
        self.teacher = TeacherProfile.objects.create(user=self.teacher_user, employee_id="EMP101")

        self.dept = Department.objects.create(name="Computer Science", code="CS")
        self.prog = Program.objects.create(department=self.dept, name="B.Tech CS", code="BTCS")
        self.ay = AcademicYear.objects.create(name="2025-2026")
        self.sem = Semester.objects.create(program=self.prog, number=5, name="Semester 5")
        self.classroom = Classroom.objects.create(academic_year=self.ay, program=self.prog, semester=self.sem, name="S5 CS", code="CS-S5")
        self.sec_a = Section.objects.create(classroom=self.classroom, name="A", code="SEC-A")

        self.student_user = User.objects.create_user('student1', 'student1@example.com', 'StudentPass123', role='STUDENT')
        self.student = StudentProfile.objects.create(user=self.student_user, roll_number="101", section=self.sec_a)

        self.subject = Subject.objects.create(code="CS501", name="Database Systems", credits=4)
        self.assignment = TeacherAssignment.objects.create(
            teacher=self.teacher,
            subject=self.subject,
            section=self.sec_a,
            academic_year=self.ay,
            is_active=True
        )

        self.exam = Exam.objects.create(
            academic_year=self.ay,
            semester=self.sem,
            name="End Sem Exam",
            code="EXAM-S5",
            status=Exam.Status.ACTIVE
        )
        self.exam_sub = ExamSubject.objects.create(exam=self.exam, subject=self.subject)
        self.comp_internal = ExamComponent.objects.create(exam_subject=self.exam_sub, name="Internal", code="INT", maximum_marks=Decimal('30.00'), weightage=Decimal('30.00'))

        self.mark_entry = MarkEntry.objects.create(
            student=self.student,
            exam_component=self.comp_internal,
            obtained_marks=Decimal('20.00'),
            entered_by=self.teacher_user
        )

        self.admin_client = APIClient()
        self.admin_client.force_authenticate(user=self.admin)

        self.teacher_client = APIClient()
        self.teacher_client.force_authenticate(user=self.teacher_user)

    def test_full_correction_approval_workflow(self):
        """Teacher creates request -> PENDING -> Admin approves -> MarkEntry updated -> AuditLog created -> Notification created"""
        payload = {
            "mark_entry_id": self.mark_entry.id,
            "requested_marks": "25.00",
            "reason": "Calculation error in question 3"
        }
        res = self.teacher_client.post('/api/mark-corrections/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        correction_id = res.data['id']

        self.assertTrue(Notification.objects.filter(user=self.admin, notification_type='CORRECTION').exists())

        approve_res = self.admin_client.post(f'/api/mark-corrections/{correction_id}/approve/', {"review_comment": "Approved after verification"}, format='json')
        self.assertEqual(approve_res.status_code, status.HTTP_200_OK)

        self.mark_entry.refresh_from_db()
        self.assertEqual(self.mark_entry.obtained_marks, Decimal('25.00'))

        self.assertTrue(AuditLog.objects.filter(action='APPROVE', entity_type='MarkCorrectionRequest', entity_id=str(correction_id)).exists())

        self.assertTrue(Notification.objects.filter(user=self.teacher_user, notification_type='CORRECTION').exists())
