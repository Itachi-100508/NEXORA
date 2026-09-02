from decimal import Decimal
from rest_framework import serializers

from apps.accounts.models import User
from apps.academics.models import StudentProfile, TeacherAssignment
from apps.academics.services import is_teacher_assigned
from apps.examinations.models import Exam, ExamComponent
from .models import MarkEntry, MarkCorrectionRequest


class MarkEntryListSerializer(serializers.ModelSerializer):
    student = serializers.SerializerMethodField()
    exam_component = serializers.SerializerMethodField()
    subject = serializers.SerializerMethodField()
    exam = serializers.SerializerMethodField()
    entered_by = serializers.SerializerMethodField()

    class Meta:
        model = MarkEntry
        fields = [
            'id',
            'student',
            'exam_component',
            'subject',
            'exam',
            'obtained_marks',
            'entered_by',
            'is_active',
        ]

    def get_student(self, obj):
        if not obj.student:
            return None
        u = obj.student.user
        return {
            "id": obj.student.id,
            "name": u.get_full_name() if u else "",
            "roll_number": obj.student.roll_number,
        }

    def get_exam_component(self, obj):
        if not obj.exam_component:
            return None
        return {
            "id": obj.exam_component.id,
            "name": obj.exam_component.name,
            "code": obj.exam_component.code,
            "maximum_marks": str(obj.exam_component.maximum_marks),
            "passing_marks": str(obj.exam_component.passing_marks) if obj.exam_component.passing_marks else None,
        }

    def get_subject(self, obj):
        if not obj.exam_component or not obj.exam_component.exam_subject or not obj.exam_component.exam_subject.subject:
            return None
        sub = obj.exam_component.exam_subject.subject
        return {
            "id": sub.id,
            "code": sub.code,
            "name": sub.name,
        }

    def get_exam(self, obj):
        if not obj.exam_component or not obj.exam_component.exam_subject or not obj.exam_component.exam_subject.exam:
            return None
        ex = obj.exam_component.exam_subject.exam
        return {
            "id": ex.id,
            "name": ex.name,
            "status": ex.status,
        }

    def get_entered_by(self, obj):
        if not obj.entered_by:
            return None
        return {
            "id": obj.entered_by.id,
            "name": obj.entered_by.get_full_name(),
            "role": obj.entered_by.role,
        }


class MarkEntryDetailSerializer(MarkEntryListSerializer):
    updated_by = serializers.SerializerMethodField()

    class Meta(MarkEntryListSerializer.Meta):
        fields = MarkEntryListSerializer.Meta.fields + [
            'updated_by',
            'created_at',
            'updated_at',
        ]

    def get_updated_by(self, obj):
        if not obj.updated_by:
            return None
        return {
            "id": obj.updated_by.id,
            "name": obj.updated_by.get_full_name(),
            "role": obj.updated_by.role,
        }


class MarkEntryCreateSerializer(serializers.ModelSerializer):
    student_id = serializers.IntegerField()
    exam_component_id = serializers.IntegerField()
    obtained_marks = serializers.DecimalField(max_digits=6, decimal_places=2)

    class Meta:
        model = MarkEntry
        fields = [
            'student_id',
            'exam_component_id',
            'obtained_marks',
            'is_active',
        ]

    def validate_student_id(self, value):
        try:
            student = StudentProfile.objects.select_related('user', 'section').get(id=value)
        except StudentProfile.DoesNotExist:
            raise serializers.ValidationError("Selected student profile does not exist.")
        if not student.is_active or not student.user.is_active:
            raise serializers.ValidationError("Selected student is inactive.")
        return value

    def validate_exam_component_id(self, value):
        try:
            comp = ExamComponent.objects.select_related('exam_subject', 'exam_subject__exam', 'exam_subject__subject').get(id=value)
        except ExamComponent.DoesNotExist:
            raise serializers.ValidationError("Selected exam component does not exist.")
        if not comp.is_active:
            raise serializers.ValidationError("Cannot record marks for an inactive ExamComponent.")

        exam = comp.exam_subject.exam
        if exam.status == Exam.Status.DRAFT:
            raise serializers.ValidationError("Marks entry is not allowed while the examination is in DRAFT status.")
        if exam.status == Exam.Status.COMPLETED:
            raise serializers.ValidationError("Marks of a COMPLETED examination cannot be entered or modified.")
        return value

    def validate(self, data):
        student_id = data.get('student_id')
        comp_id = data.get('exam_component_id')
        obtained_m = data.get('obtained_marks')

        request = self.context.get('request')
        user = request.user if request else None

        if obtained_m is not None and obtained_m < 0:
            raise serializers.ValidationError({"obtained_marks": "Obtained marks cannot be negative."})

        if student_id and comp_id:
            student = StudentProfile.objects.select_related('section', 'section__classroom').get(id=student_id)
            comp = ExamComponent.objects.select_related('exam_subject', 'exam_subject__exam', 'exam_subject__subject').get(id=comp_id)

            if obtained_m is not None and obtained_m > comp.maximum_marks:
                raise serializers.ValidationError({"obtained_marks": f"Obtained marks ({obtained_m}) cannot exceed component maximum marks ({comp.maximum_marks})."})

            # Uniqueness check
            if MarkEntry.objects.filter(student=student, exam_component=comp).exists():
                raise serializers.ValidationError("A mark entry already exists for this student and exam component.")

            # Teacher assignment scoping check
            if user and user.role == User.Role.TEACHER:
                if not hasattr(user, 'teacher_profile'):
                    raise serializers.ValidationError("Authenticated user does not have a valid teacher profile.")
                tp = user.teacher_profile
                sub = comp.exam_subject.subject
                ay = comp.exam_subject.exam.academic_year
                sec = student.section

                if not sec or not is_teacher_assigned(tp, sub, sec, ay):
                    raise serializers.ValidationError("You are not assigned to enter marks for this subject and student section.")

        return data

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user if request else None

        student_id = validated_data.pop('student_id')
        comp_id = validated_data.pop('exam_component_id')

        student = StudentProfile.objects.get(id=student_id)
        comp = ExamComponent.objects.get(id=comp_id)

        mark_entry = MarkEntry.objects.create(
            student=student,
            exam_component=comp,
            entered_by=user,
            **validated_data
        )
        return mark_entry


class MarkEntryUpdateSerializer(serializers.ModelSerializer):
    obtained_marks = serializers.DecimalField(max_digits=6, decimal_places=2, required=False)

    class Meta:
        model = MarkEntry
        fields = [
            'obtained_marks',
            'is_active',
        ]

    def validate(self, data):
        instance = self.instance
        comp = instance.exam_component
        student = instance.student

        request = self.context.get('request')
        user = request.user if request else None

        obtained_m = data.get('obtained_marks', instance.obtained_marks)

        from django.core.exceptions import ValidationError as DjangoValidationError, PermissionDenied as DjangoPermissionDenied
        from .services import MarksValidator

        try:
            MarksValidator.validate(
                user=user,
                student=student,
                exam_component=comp,
                obtained_marks=obtained_m,
                is_update=True
            )
        except (DjangoValidationError, DjangoPermissionDenied) as e:
            if hasattr(e, 'message_dict'):
                raise serializers.ValidationError(e.message_dict)
            elif hasattr(e, 'detail'):
                raise serializers.ValidationError(e.detail)
            elif hasattr(e, 'message'):
                raise serializers.ValidationError({"detail": str(e.message)})
            else:
                raise serializers.ValidationError({"detail": str(e)})

        return data

    def update(self, instance, validated_data):
        request = self.context.get('request')
        user = request.user if request else None

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if user:
            instance.updated_by = user

        instance.save()
        return instance


# ============================================================
# PHASE 14 — MARKS ENTRY API SERIALIZERS
# ============================================================

class MarksCreateSerializer(serializers.Serializer):
    student_id = serializers.IntegerField(required=True)
    exam_component_id = serializers.IntegerField(required=True)
    exam_subject_id = serializers.IntegerField(required=False, allow_null=True)
    obtained_marks = serializers.DecimalField(max_digits=6, decimal_places=2, required=True)


class MarksFormattedResponseSerializer(serializers.ModelSerializer):
    student = serializers.SerializerMethodField()
    exam = serializers.SerializerMethodField()
    subject = serializers.SerializerMethodField()
    component = serializers.SerializerMethodField()
    entered_by = serializers.SerializerMethodField()

    class Meta:
        model = MarkEntry
        fields = [
            'id',
            'student',
            'exam',
            'subject',
            'component',
            'obtained_marks',
            'entered_by',
        ]

    def get_student(self, obj):
        if not obj.student:
            return None
        u = obj.student.user
        return {
            "id": obj.student.id,
            "name": u.get_full_name() if u else "",
            "roll_number": obj.student.roll_number,
        }

    def get_exam(self, obj):
        if not obj.exam_component or not obj.exam_component.exam_subject or not obj.exam_component.exam_subject.exam:
            return None
        ex = obj.exam_component.exam_subject.exam
        return {
            "id": ex.id,
            "name": ex.name,
        }

    def get_subject(self, obj):
        if not obj.exam_component or not obj.exam_component.exam_subject or not obj.exam_component.exam_subject.subject:
            return None
        sub = obj.exam_component.exam_subject.subject
        return {
            "id": sub.id,
            "code": sub.code,
            "name": sub.name,
        }

    def get_component(self, obj):
        if not obj.exam_component:
            return None
        return {
            "id": obj.exam_component.id,
            "name": obj.exam_component.name,
            "maximum_marks": str(obj.exam_component.maximum_marks),
        }

    def get_entered_by(self, obj):
        if not obj.entered_by:
            return None
        return {
            "id": obj.entered_by.id,
            "name": obj.entered_by.get_full_name(),
            "role": obj.entered_by.role,
        }


# ============================================================
# PHASE 20 — MARK CORRECTION WORKFLOW SERIALIZERS
# ============================================================

class MarkCorrectionRequestSerializer(serializers.ModelSerializer):
    student = serializers.SerializerMethodField()
    subject = serializers.SerializerMethodField()
    component = serializers.SerializerMethodField()
    requested_by = serializers.SerializerMethodField()
    reviewed_by = serializers.SerializerMethodField()

    class Meta:
        model = MarkCorrectionRequest
        fields = [
            'id',
            'mark_entry_id',
            'student',
            'subject',
            'component',
            'old_marks',
            'requested_marks',
            'reason',
            'status',
            'requested_by',
            'reviewed_by',
            'review_comment',
            'created_at',
            'updated_at',
            'reviewed_at',
        ]

    def get_student(self, obj):
        if not obj.mark_entry or not obj.mark_entry.student:
            return None
        st = obj.mark_entry.student
        return {
            "id": st.id,
            "name": st.user.get_full_name() if st.user else "",
            "roll_number": st.roll_number,
        }

    def get_subject(self, obj):
        if not obj.mark_entry or not obj.mark_entry.exam_component or not obj.mark_entry.exam_component.exam_subject or not obj.mark_entry.exam_component.exam_subject.subject:
            return None
        sub = obj.mark_entry.exam_component.exam_subject.subject
        return {
            "id": sub.id,
            "code": sub.code,
            "name": sub.name,
        }

    def get_component(self, obj):
        if not obj.mark_entry or not obj.mark_entry.exam_component:
            return None
        comp = obj.mark_entry.exam_component
        return {
            "id": comp.id,
            "name": comp.name,
            "maximum_marks": str(comp.maximum_marks),
        }

    def get_requested_by(self, obj):
        if not obj.requested_by:
            return None
        return {
            "id": obj.requested_by.id,
            "name": obj.requested_by.get_full_name(),
            "role": obj.requested_by.role,
        }

    def get_reviewed_by(self, obj):
        if not obj.reviewed_by:
            return None
        return {
            "id": obj.reviewed_by.id,
            "name": obj.reviewed_by.get_full_name(),
            "role": obj.reviewed_by.role,
        }


class MarkCorrectionCreateSerializer(serializers.Serializer):
    mark_entry_id = serializers.IntegerField(required=True)
    requested_marks = serializers.DecimalField(max_digits=6, decimal_places=2, required=True)
    reason = serializers.CharField(required=True)

    def validate_mark_entry_id(self, value):
        try:
            mark_entry = MarkEntry.objects.select_related(
                'student',
                'student__section',
                'exam_component',
                'exam_component__exam_subject',
                'exam_component__exam_subject__exam',
                'exam_component__exam_subject__subject'
            ).get(id=value)
        except MarkEntry.DoesNotExist:
            raise serializers.ValidationError("Selected mark entry does not exist.")
        return value

    def validate(self, data):
        mark_entry_id = data.get('mark_entry_id')
        req_marks = data.get('requested_marks')

        request = self.context.get('request')
        user = request.user if request else None

        if req_marks is not None:
            if req_marks < 0:
                raise serializers.ValidationError({"requested_marks": "Requested marks cannot be negative."})

        if mark_entry_id:
            mark_entry = MarkEntry.objects.select_related(
                'student',
                'student__section',
                'exam_component',
                'exam_component__exam_subject',
                'exam_component__exam_subject__exam',
                'exam_component__exam_subject__subject'
            ).get(id=mark_entry_id)

            if req_marks is not None and req_marks > mark_entry.exam_component.maximum_marks:
                raise serializers.ValidationError({"requested_marks": f"Requested marks ({req_marks}) cannot exceed component maximum marks ({mark_entry.exam_component.maximum_marks})."})

            # Prevent duplicate PENDING request for same MarkEntry
            if MarkCorrectionRequest.objects.filter(mark_entry=mark_entry, status=MarkCorrectionRequest.Status.PENDING).exists():
                raise serializers.ValidationError({"detail": "A pending correction request already exists for this mark entry."})

            # Teacher assignment check
            if user and user.role == User.Role.TEACHER:
                if not hasattr(user, 'teacher_profile'):
                    raise serializers.ValidationError("Teacher profile not found.")
                tp = user.teacher_profile
                sub = mark_entry.exam_component.exam_subject.subject
                ay = mark_entry.exam_component.exam_subject.exam.academic_year
                sec = mark_entry.student.section

                if not sec or not is_teacher_assigned(tp, sub, sec, ay):
                    raise serializers.ValidationError("You are not assigned to request corrections for this subject/section.")

        return data


class MarkCorrectionReviewSerializer(serializers.Serializer):
    review_comment = serializers.CharField(required=False, allow_blank=True, default="")


class ExcelImportSerializer(serializers.Serializer):
    file = serializers.FileField(required=True)
    exam_id = serializers.IntegerField(required=True)
