from apps.accounts.models import User
from apps.notifications.models import Notification


def create_notification(user, title, message, notification_type=Notification.NotificationType.SYSTEM, related_entity_type=None, related_entity_id=None):
    """
    Centralized helper function to create a user-specific in-app Notification.
    """
    if not user or not getattr(user, 'is_authenticated', True):
        return None

    return Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notification_type=notification_type,
        is_read=False,
        related_entity_type=str(related_entity_type) if related_entity_type else None,
        related_entity_id=str(related_entity_id) if related_entity_id else None
    )


def notify_correction_requested(correction, request=None):
    """
    Notifies Admin user(s) when a teacher submits a MarkCorrectionRequest.
    """
    admins = User.objects.filter(role=User.Role.ADMIN, is_active=True)
    mark_entry = correction.mark_entry
    student_name = mark_entry.student.user.get_full_name() if mark_entry.student and mark_entry.student.user else f"Student #{mark_entry.student_id}"
    subj_name = mark_entry.exam_component.exam_subject.subject.name if mark_entry.exam_component and mark_entry.exam_component.exam_subject and mark_entry.exam_component.exam_subject.subject else "Subject"

    title = "Mark Correction Requested"
    msg = f"New mark correction request submitted for {student_name} ({subj_name}): {correction.old_marks} -> {correction.requested_marks}."

    notifications = []
    for admin in admins:
        notif = create_notification(
            user=admin,
            title=title,
            message=msg,
            notification_type=Notification.NotificationType.CORRECTION,
            related_entity_type='MarkCorrectionRequest',
            related_entity_id=correction.id
        )
        if notif:
            notifications.append(notif)
    return notifications


def notify_correction_approved(correction, request=None):
    """
    Notifies requesting teacher and student when Admin approves a MarkCorrectionRequest.
    """
    notifications = []
    mark_entry = correction.mark_entry
    student_name = mark_entry.student.user.get_full_name() if mark_entry.student and mark_entry.student.user else ""
    subj_name = mark_entry.exam_component.exam_subject.subject.name if mark_entry.exam_component and mark_entry.exam_component.exam_subject and mark_entry.exam_component.exam_subject.subject else "Subject"

    # Notify Teacher
    if correction.requested_by:
        t_notif = create_notification(
            user=correction.requested_by,
            title="Correction Request Approved",
            message=f"Your correction request for {student_name} ({subj_name}) marks has been approved.",
            notification_type=Notification.NotificationType.CORRECTION,
            related_entity_type='MarkCorrectionRequest',
            related_entity_id=correction.id
        )
        if t_notif:
            notifications.append(t_notif)

    # Notify Student
    if mark_entry.student and mark_entry.student.user:
        s_notif = create_notification(
            user=mark_entry.student.user,
            title="Result Updated",
            message=f"Your marks for {subj_name} have been updated to {correction.requested_marks}.",
            notification_type=Notification.NotificationType.MARKS,
            related_entity_type='MarkEntry',
            related_entity_id=mark_entry.id
        )
        if s_notif:
            notifications.append(s_notif)

    return notifications


def notify_correction_rejected(correction, request=None):
    """
    Notifies requesting teacher when Admin rejects a MarkCorrectionRequest.
    """
    if not correction.requested_by:
        return None

    mark_entry = correction.mark_entry
    student_name = mark_entry.student.user.get_full_name() if mark_entry.student and mark_entry.student.user else ""
    subj_name = mark_entry.exam_component.exam_subject.subject.name if mark_entry.exam_component and mark_entry.exam_component.exam_subject and mark_entry.exam_component.exam_subject.subject else "Subject"
    comment_str = f" Reason: {correction.review_comment}" if correction.review_comment else ""

    return create_notification(
        user=correction.requested_by,
        title="Correction Request Rejected",
        message=f"Your correction request for {student_name} ({subj_name}) marks was rejected.{comment_str}",
        notification_type=Notification.NotificationType.CORRECTION,
        related_entity_type='MarkCorrectionRequest',
        related_entity_id=correction.id
    )


def notify_result_published(student, exam=None):
    """
    Reusable notification helper for Result Publication.
    """
    if not student or not student.user:
        return None

    exam_name = exam.name if exam else "Examination"
    return create_notification(
        user=student.user,
        title="Result Published",
        message=f"Your {exam_name} examination result is now available.",
        notification_type=Notification.NotificationType.RESULT,
        related_entity_type='Exam' if exam else None,
        related_entity_id=exam.id if exam else None
    )
