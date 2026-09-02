from django.urls import path
from .views import (
    ResultPDFView,
    ExamAnalyticsView,
    SubjectAnalyticsView,
    ClassAnalyticsView,
    GradeDistributionView,
    MarksDistributionView,
    StudentAnalyticsView,
    StudentAIAnalyticsView,
    ExamAIAnalyticsView,
)

urlpatterns = [
    path('results/<int:student_id>/<int:exam_id>/pdf/', ResultPDFView.as_view(), name='result-pdf'),
    path('analytics/exam/<int:exam_id>/', ExamAnalyticsView.as_view(), name='analytics-exam'),
    path('analytics/subject/<int:subject_id>/', SubjectAnalyticsView.as_view(), name='analytics-subject'),
    path('analytics/class/<int:class_id>/', ClassAnalyticsView.as_view(), name='analytics-class'),
    path('analytics/exam/<int:exam_id>/grades/', GradeDistributionView.as_view(), name='analytics-exam-grades'),
    path('analytics/exam/<int:exam_id>/distribution/', MarksDistributionView.as_view(), name='analytics-exam-distribution'),
    path('analytics/student/<int:student_id>/', StudentAnalyticsView.as_view(), name='analytics-student'),
    path('ai-analytics/student/<int:student_id>/', StudentAIAnalyticsView.as_view(), name='ai-analytics-student'),
    path('ai-analytics/exam/<int:exam_id>/', ExamAIAnalyticsView.as_view(), name='ai-analytics-exam'),
]
