from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudentViewSet, TeacherViewSet, SubjectViewSet, TeacherAssignmentViewSet

router = DefaultRouter()
router.register('students', StudentViewSet, basename='student')
router.register('teachers', TeacherViewSet, basename='teacher')
router.register('subjects', SubjectViewSet, basename='subject')
router.register('assignments', TeacherAssignmentViewSet, basename='assignment')

urlpatterns = [
    path('', include(router.urls)),
]
