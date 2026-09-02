from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from apps.results.services import ResultCalculator
from .models import ResultVerification


class PublicResultVerificationView(APIView):
    """
    Public verification endpoint (No JWT required).
    Third parties scan QR code to verify student result authenticity.
    GET /api/verify/result/<token>/
    """
    permission_classes = [AllowAny]

    def get(self, request, token):
        try:
            verification = ResultVerification.objects.select_related(
                'student',
                'student__user',
                'exam',
                'exam__academic_year'
            ).get(verification_token=token)
        except ResultVerification.DoesNotExist:
            return Response(
                {
                    "verified": False,
                    "message": "Invalid verification token."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if not verification.is_active:
            return Response(
                {
                    "verified": False,
                    "message": "This verification record is no longer active."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        student = verification.student
        exam = verification.exam

        # Dynamic backend result calculation
        result_data = ResultCalculator.calculate_exam_result(student, exam)

        return Response(
            {
                "verified": True,
                "message": "Result verified successfully.",
                "student": {
                    "name": student.user.get_full_name() if student.user else "",
                    "roll_number": student.roll_number,
                    "enrollment_number": getattr(student, 'enrollment_number', None)
                },
                "exam": {
                    "name": exam.name,
                    "academic_year": exam.academic_year.name if exam.academic_year else ""
                },
                "result": {
                    "total_marks": result_data["total_marks"],
                    "maximum_marks": result_data["maximum_marks"],
                    "percentage": result_data["percentage"],
                    "grade": result_data["grade"],
                    "status": result_data["status"],
                    "sgpa": result_data["sgpa"],
                }
            },
            status=status.HTTP_200_OK
        )
