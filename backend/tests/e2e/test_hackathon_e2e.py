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
from apps.verification.models import ResultVerification

User = get_user_model()


class HackathonE2ETest(TestCase):
    """
    End-to-End Happy Path integration test representing the full hackathon demo flow.
    Admin setup -> Exam creation -> Teacher assignment -> Marks entry -> Result calculation -> PDF & QR verification -> Analytics -> Correction request -> Admin approval -> Audit & Notification verification.
    """
    def setUp(self):
        self.admin = User.objects.create_superuser('admin', 'admin@example.com', 'AdminPass123', role='ADMIN')
        self.teacher_user = User.objects.create_user('teacher1', 'teacher1@example.com', 'TeacherPass123', role='TEACHER', first_name="Dr.", last_name="Sharma")
        self.student_user = User.objects.create_user('student1', 'student1@example.com', 'StudentPass123', role='STUDENT', first_name="Rahul", last_name="Kumar")

        self.teacher = TeacherProfile.objects.create(user=self.teacher_user, employee_id="EMP101")

        self.dept = Department.objects.create(name="Computer Science", code="CS")
        self.prog = Program.objects.create(department=self.dept, name="B.Tech CS", code="BTCS")
        self.ay = AcademicYear.objects.create(name="2025-2026")
        self.sem = Semester.objects.create(program=self.prog, number=5, name="Semester 5")
        self.classroom = Classroom.objects.create(academic_year=self.ay, program=self.prog, semester=self.sem, name="S5 CS", code="CS-S5")
        self.sec_a = Section.objects.create(classroom=self.classroom, name="A", code="SEC-A")

        self.student = StudentProfile.objects.create(user=self.student_user, roll_number="101", section=self.sec_a)
        self.subject = Subject.objects.create(code="CS501", name="Database Management Systems", credits=4)

        self.assignment = TeacherAssignment.objects.create(
            teacher=self.teacher,
            subject=self.subject,
            section=self.sec_a,
            academic_year=self.ay,
            is_active=True
        )

        self.admin_client = APIClient()
        self.admin_client.force_authenticate(user=self.admin)

        self.teacher_client = APIClient()
        self.teacher_client.force_authenticate(user=self.teacher_user)

        self.student_client = APIClient()
        self.student_client.force_authenticate(user=self.student_user)

    def test_complete_hackathon_demo_flow(self):
        # 1. Admin creates Exam, ExamSubject, ExamComponents
        exam_res = self.admin_client.post('/api/exams/', {
            "academic_year": self.ay.id,
            "semester": self.sem.id,
            "name": "Semester 5 End Exam",
            "code": "EXAM-S5-END",
            "status": "ACTIVE"
        }, format='json')
        self.assertEqual(exam_res.status_code, status.HTTP_201_CREATED)
        exam_id = exam_res.data['id']

        es_res = self.admin_client.post('/api/exam-subjects/', {
            "exam": exam_id,
            "subject": self.subject.id
        }, format='json')
        self.assertEqual(es_res.status_code, status.HTTP_201_CREATED)
        es_id = es_res.data['id']

        ec_res = self.admin_client.post('/api/exam-components/', {
            "exam_subject": es_id,
            "name": "Theory Exam",
            "code": "TH",
            "maximum_marks": "100.00",
            "weightage": "100.00"
        }, format='json')
        self.assertEqual(ec_res.status_code, status.HTTP_201_CREATED)
        ec_id = ec_res.data['id']

        # 2. Teacher enters student marks
        marks_res = self.teacher_client.post('/api/marks/', {
            "student_id": self.student.id,
            "exam_component_id": ec_id,
            "obtained_marks": "75.00"
        }, format='json')
        self.assertEqual(marks_res.status_code, status.HTTP_201_CREATED)
        mark_entry_id = marks_res.data['id']

        # 3. Student requests result PDF download
        pdf_res = self.student_client.get(f'/api/results/{self.student.id}/{exam_id}/pdf/')
        self.assertEqual(pdf_res.status_code, status.HTTP_200_OK)
        self.assertEqual(pdf_res['Content-Type'], 'application/pdf')

        # 4. QR Verification check
        verification = ResultVerification.objects.get(student=self.student, exam_id=exam_id)
        anon_client = APIClient()
        qr_verify_res = anon_client.get(f'/api/verify/result/{verification.verification_token}/')
        self.assertEqual(qr_verify_res.status_code, status.HTTP_200_OK)
        self.assertEqual(qr_verify_res.data['is_valid'], True)

        # 5. Teacher requests Mark Correction
        corr_res = self.teacher_client.post('/api/mark-corrections/', {
            "mark_entry_id": mark_entry_id,
            "requested_marks": "85.00",
            "reason": "Re-evaluation mark correction"
        }, format='json')
        self.assertEqual(corr_res.status_code, status.HTTP_201_CREATED)
        corr_id = corr_res.data['id']

        # 6. Admin approves Mark Correction
        app_res = self.admin_client.post(f'/api/mark-corrections/{corr_id}/approve/', {"review_comment": "Approved after re-checking"}, format='json')
        self.assertEqual(app_res.status_code, status.HTTP_200_OK)

        # 7. Verify final MarkEntry state
        entry = MarkEntry.objects.get(id=mark_entry_id)
        self.assertEqual(entry.obtained_marks, Decimal('85.00'))

        # 8. Verify Analytics reflect new marks
        analytics_res = self.admin_client.get(f'/api/analytics/exam/{exam_id}/')
        self.assertEqual(analytics_res.status_code, status.HTTP_200_OK)
        self.assertEqual(analytics_res.data['passed'], 1)

        # 9. Verify AuditLog & Notifications
        self.assertTrue(AuditLog.objects.filter(action='APPROVE', entity_type='MarkCorrectionRequest', entity_id=str(corr_id)).exists())
        self.assertTrue(Notification.objects.filter(user=self.student_user, notification_type='MARKS').exists())
