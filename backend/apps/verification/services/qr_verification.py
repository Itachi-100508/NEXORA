import io
import qrcode
import secrets
from django.conf import settings
from apps.verification.models import ResultVerification


def get_or_create_verification(student, exam):
    """
    Retrieves existing active ResultVerification or creates a new token.
    """
    verification, created = ResultVerification.objects.get_or_create(
        student=student,
        exam=exam,
        defaults={
            "verification_token": secrets.token_urlsafe(32),
            "is_active": True,
        }
    )

    if not verification.is_active:
        verification.is_active = True
        verification.verification_token = secrets.token_urlsafe(32)
        verification.save()

    return verification


def generate_qr_code_image(verification_token, base_url="http://127.0.0.1:8000"):
    """
    Generates a QR code image as BytesIO stream for the given verification token.
    """
    verification_url = f"{base_url.rstrip('/')}/api/verify/result/{verification_token}/"

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=6,
        border=2,
    )
    qr.add_data(verification_url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return buffer, verification_url
