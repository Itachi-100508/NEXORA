import json
from decimal import Decimal
from datetime import datetime, date

from apps.audit.models import AuditLog


def get_client_ip(request):
    """
    Extracts client IP address safely from request meta headers.
    """
    if not request:
        return None
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def sanitize_data(data):
    """
    Sanitizes dictionary data for JSON field storage.
    Converts Decimals, dates, and datetimes to serializable types.
    Removes sensitive keys like passwords or secrets.
    """
    if data is None:
        return None

    if not isinstance(data, dict):
        if isinstance(data, (Decimal, float)):
            return str(data)
        if isinstance(data, (datetime, date)):
            return data.isoformat()
        return str(data)

    sanitized = {}
    SENSITIVE_KEYS = {'password', 'token', 'secret', 'jwt', 'authorization', 'api_key'}

    for key, value in data.items():
        if key.lower() in SENSITIVE_KEYS:
            continue

        if isinstance(value, Decimal):
            sanitized[key] = str(value)
        elif isinstance(value, (datetime, date)):
            sanitized[key] = value.isoformat()
        elif isinstance(value, dict):
            sanitized[key] = sanitize_data(value)
        elif isinstance(value, list):
            sanitized[key] = [sanitize_data(item) for item in value]
        else:
            sanitized[key] = value

    return sanitized


def log_action(user, action, entity_type, entity_id, description, old_data=None, new_data=None, request=None):
    """
    Centralized helper to record an append-only AuditLog.
    """
    ip_addr = get_client_ip(request) if request else None

    # Ensure user is valid authenticated User instance or None
    user_inst = user if (user and getattr(user, 'is_authenticated', False)) else None

    log_entry = AuditLog.objects.create(
        user=user_inst,
        action=action,
        entity_type=str(entity_type),
        entity_id=str(entity_id),
        description=description or "",
        old_data=sanitize_data(old_data),
        new_data=sanitize_data(new_data),
        ip_address=ip_addr
    )
    return log_entry
