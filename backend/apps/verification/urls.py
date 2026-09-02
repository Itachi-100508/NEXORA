from django.urls import path
from .views import PublicResultVerificationView

urlpatterns = [
    path('verify/result/<str:token>/', PublicResultVerificationView.as_view(), name='result-verify'),
]
