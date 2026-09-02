from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ExamViewSet, ExamSubjectViewSet, ExamComponentViewSet

router = DefaultRouter()
router.register('exams', ExamViewSet, basename='exam')
router.register('exam-subjects', ExamSubjectViewSet, basename='exam-subject')
router.register('exam-components', ExamComponentViewSet, basename='exam-component')

urlpatterns = [
    path('', include(router.urls)),
]
