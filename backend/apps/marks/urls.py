from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MarkEntryViewSet, MarksViewSet, MarkCorrectionRequestViewSet, ExcelImportView

router = DefaultRouter()
router.register('mark-entries', MarkEntryViewSet, basename='mark-entry')
router.register('marks', MarksViewSet, basename='mark')
router.register('mark-corrections', MarkCorrectionRequestViewSet, basename='mark-correction')

urlpatterns = [
    path('marks/import/', ExcelImportView.as_view(), name='marks-import'),
    path('', include(router.urls)),
]
