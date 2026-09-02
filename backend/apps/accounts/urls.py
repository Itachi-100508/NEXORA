from django.urls import path
from .views import (
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    CurrentUserView,
    LogoutView,
    ProtectedTestView,
    AdminTestView,
    TeacherTestView,
    StudentTestView,
    AdminTeacherTestView,
    TeacherAssignmentTestView,
)

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='auth_login'),
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='auth_refresh'),
    path('me/', CurrentUserView.as_view(), name='auth_me'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
    path('protected-test/', ProtectedTestView.as_view(), name='auth_protected_test'),
    path('admin-test/', AdminTestView.as_view(), name='auth_admin_test'),
    path('teacher-test/', TeacherTestView.as_view(), name='auth_teacher_test'),
    path('student-test/', StudentTestView.as_view(), name='auth_student_test'),
    path('admin-teacher-test/', AdminTeacherTestView.as_view(), name='auth_admin_teacher_test'),
    path('teacher-assignment-test/', TeacherAssignmentTestView.as_view(), name='auth_teacher_assignment_test'),
]
