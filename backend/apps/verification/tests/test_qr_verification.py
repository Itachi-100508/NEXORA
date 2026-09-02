from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model

from apps.academics.models import Department, Program, Semester, Classroom, Section, StudentProfile, AcademicYear
from apps.examinations.models import Exam
from apps.verification.models import ResultVerification
from apps.verification.services import get_or_create_verification, generate_qr_code_image

User = get_user_model()


class QRVerificationTests(TestCase):
    def setUp(self):
        self.dept = Department.objects.create(name="Computer Science", code="CS")
        self.prog = Program.objects.create(department=self.dept, name="B.Tech CS", code="BTCS")
        self.ay = AcademicYear.objects.create(name="2025-2026")
        self.sem = Semester.objects.create(program=self.prog, number=5, name="Semester 5")
        self.classroom = Classroom.objects.create(academic_year=self.ay, program=self.prog, semester=self.sem, name="S5 CS", code="CS-S5")
        self.sec_a = Section.objects.create(classroom=self.classroom, name="A", code="SEC-A")

        self.student_user = User.objects.create_user('student1', 'student1@example.com', 'StudentPass123', role='STUDENT', first_name="Rahul", last_name="Kumar")
        self.student = StudentProfile.objects.create(user=self.student_user, roll_number="101", section=self.sec_a)

        self.exam = Exam.objects.create(
            academic_year=self.ay,
            semester=self.sem,
            name="Semester 5 Examination",
            code="EXAM-S5",
            status=Exam.Status.ACTIVE
        )

        self.anon_client = APIClient()

    def test_qr_verification_service_and_public_api(self):
        """Test verification token generation, QR image stream, and public verification endpoint"""
        verification = get_or_create_verification(self.student, self.exam)
        self.assertIsNotNone(verification.verification_token)

        qr_buf, url = generate_qr_code_image(verification.verification_token)
        self.assertTrue(url.endswith(verification.verification_token))
        self.assertGreater(len(qr_buf.getvalue()), 0)

        # Public GET /api/verify/result/<token>/ (No JWT required)
        res = self.anon_client.get(f'/api/verify/result/{verification.verification_token}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['verification_token'], verification.verification_token)
        self.assertEqual(res.data['student']['roll_number'], '101')
        self.assertEqual(res.data['is_valid'], True)

    def test_invalid_token_rejection(self):
        res = self.anon_client.get('/api/verify/result/invalid_token_12345/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
