from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StudentViewSet, TeacherViewSet, SubjectViewSet, TeacherAssignmentViewSet,
    DepartmentViewSet, AcademicYearViewSet, SemesterViewSet,
    ClassroomViewSet, SectionViewSet
)

router = DefaultRouter()
router.register('students', StudentViewSet, basename='student')
router.register('teachers', TeacherViewSet, basename='teacher')
router.register('subjects', SubjectViewSet, basename='subject')
router.register('assignments', TeacherAssignmentViewSet, basename='assignment')
router.register('departments', DepartmentViewSet, basename='department')
router.register('academic-years', AcademicYearViewSet, basename='academic-year')
router.register('semesters', SemesterViewSet, basename='semester')
router.register('classrooms', ClassroomViewSet, basename='classroom')
router.register('sections', SectionViewSet, basename='section')

urlpatterns = [
    path('', include(router.urls)),
]
