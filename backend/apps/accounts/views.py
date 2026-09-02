from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .permissions import IsAdmin, IsTeacher, IsStudent, IsAdminOrTeacher, IsTeacherAssigned
from .serializers import (
    UserSerializer,
    CustomTokenObtainPairSerializer,
    LogoutSerializer,
)


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    POST /api/auth/login/
    Authenticates user credentials and returns access token, refresh token, and user profile with role.
    """
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class CustomTokenRefreshView(TokenRefreshView):
    """
    POST /api/auth/token/refresh/
    Takes a valid refresh token and returns a new access token.
    """
    permission_classes = [AllowAny]


class CurrentUserView(APIView):
    """
    GET /api/auth/me/
    Returns the profile information of the currently authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Blacklists the provided refresh token to invalidate future token renewals.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        if serializer.is_valid():
            try:
                refresh_token = serializer.validated_data["refresh"]
                token = RefreshToken(refresh_token)
                token.blacklist()
                return Response(
                    {"detail": "Successfully logged out."},
                    status=status.HTTP_200_OK
                )
            except TokenError as e:
                return Response(
                    {"detail": str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProtectedTestView(APIView):
    """
    GET /api/auth/protected-test/
    Shared protected test endpoint accessible by any authenticated role.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "message": "Authentication successful",
            "user_id": request.user.id,
            "role": request.user.role
        }, status=status.HTTP_200_OK)


class AdminTestView(APIView):
    """
    GET /api/auth/admin-test/
    Role-protected verification endpoint accessible ONLY by ADMIN role or superuser.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        return Response({
            "message": "Admin authorization successful",
            "user_id": request.user.id,
            "role": "ADMIN"
        }, status=status.HTTP_200_OK)


class TeacherTestView(APIView):
    """
    GET /api/auth/teacher-test/
    Role-protected verification endpoint accessible ONLY by TEACHER role.
    """
    permission_classes = [IsTeacher]

    def get(self, request):
        return Response({
            "message": "Teacher authorization successful",
            "user_id": request.user.id,
            "role": "TEACHER"
        }, status=status.HTTP_200_OK)


class StudentTestView(APIView):
    """
    GET /api/auth/student-test/
    Role-protected verification endpoint accessible ONLY by STUDENT role.
    """
    permission_classes = [IsStudent]

    def get(self, request):
        return Response({
            "message": "Student authorization successful",
            "user_id": request.user.id,
            "role": "STUDENT"
        }, status=status.HTTP_200_OK)


class AdminTeacherTestView(APIView):
    """
    GET /api/auth/admin-teacher-test/
    Role-protected verification endpoint accessible by either ADMIN or TEACHER roles.
    """
    permission_classes = [IsAdminOrTeacher]

    def get(self, request):
        return Response({
            "message": "Admin or Teacher authorization successful",
            "user_id": request.user.id,
            "role": request.user.role
        }, status=status.HTTP_200_OK)


class TeacherAssignmentTestView(APIView):
    """
    GET /api/auth/teacher-assignment-test/
    Object-level assignment verification endpoint accessible ONLY by a TEACHER assigned to the target subject and class.
    """
    permission_classes = [IsTeacherAssigned]

    def get(self, request):
        subject_id = request.query_params.get('subject_id') or (request.data.get('subject_id') if isinstance(request.data, dict) else None)
        class_id = request.query_params.get('class_id') or (request.data.get('class_id') if isinstance(request.data, dict) else None)

        return Response({
            "message": "Teacher assignment authorization successful",
            "user_id": request.user.id,
            "role": "TEACHER",
            "subject_id": int(subject_id) if subject_id else None,
            "class_id": int(class_id) if class_id else None
        }, status=status.HTTP_200_OK)
