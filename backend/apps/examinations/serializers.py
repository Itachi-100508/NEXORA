from decimal import Decimal
from rest_framework import serializers
from apps.academics.models import AcademicYear, Semester, Subject
from .models import Exam, ExamSubject, ExamComponent


class ExamListSerializer(serializers.ModelSerializer):
    academic_year = serializers.CharField(source='academic_year.name', default='', read_only=True)
    academic_year_id = serializers.IntegerField(source='academic_year.id', read_only=True)
    semester = serializers.SerializerMethodField(method_name='get_semester_number')
    semester_id = serializers.IntegerField(source='semester.id', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Exam
        fields = [
            'id',
            'name',
            'academic_year',
            'academic_year_id',
            'semester',
            'semester_id',
            'status',
            'status_display',
        ]

    def get_semester_number(self, obj):
        return obj.semester.number if obj.semester else None


class ExamDetailSerializer(ExamListSerializer):
    class Meta(ExamListSerializer.Meta):
        fields = ExamListSerializer.Meta.fields + [
            'description',
            'created_at',
            'updated_at',
        ]


class ExamCreateSerializer(serializers.ModelSerializer):
    name = serializers.CharField(max_length=200)
    academic_year_id = serializers.IntegerField()
    semester_id = serializers.IntegerField()

    class Meta:
        model = Exam
        fields = [
            'name',
            'description',
            'academic_year_id',
            'semester_id',
        ]

    def validate_name(self, value):
        normalized_name = value.strip()
        if not normalized_name:
            raise serializers.ValidationError("Exam name cannot be empty.")
        return normalized_name

    def validate_academic_year_id(self, value):
        try:
            ay = AcademicYear.objects.get(id=value)
        except AcademicYear.DoesNotExist:
            raise serializers.ValidationError("Selected academic year does not exist.")
        if not ay.is_active:
            raise serializers.ValidationError("Cannot create exam for an inactive academic year.")
        return value

    def validate_semester_id(self, value):
        if not Semester.objects.filter(id=value).exists():
            raise serializers.ValidationError("Selected semester does not exist.")
        return value

    def validate(self, data):
        name = data.get('name', '').strip()
        ay_id = data.get('academic_year_id')
        sem_id = data.get('semester_id')

        if ay_id and sem_id and name:
            ay = AcademicYear.objects.get(id=ay_id)
            sem = Semester.objects.get(id=sem_id)

            if Exam.objects.filter(name=name, academic_year=ay, semester=sem).exists():
                raise serializers.ValidationError("An exam with this name already exists for the selected Academic Year and Semester.")

        return data

    def create(self, validated_data):
        ay_id = validated_data.pop('academic_year_id')
        sem_id = validated_data.pop('semester_id')

        academic_year = AcademicYear.objects.get(id=ay_id)
        semester = Semester.objects.get(id=sem_id)

        exam = Exam.objects.create(
            academic_year=academic_year,
            semester=semester,
            status=Exam.Status.DRAFT,
            **validated_data
        )
        return exam


class ExamUpdateSerializer(serializers.ModelSerializer):
    name = serializers.CharField(max_length=200, required=False)
    academic_year_id = serializers.IntegerField(required=False)
    semester_id = serializers.IntegerField(required=False)

    class Meta:
        model = Exam
        fields = [
            'name',
            'description',
            'academic_year_id',
            'semester_id',
            'status',
        ]

    def validate(self, data):
        instance = self.instance

        # 1. Completed Exam Immutability Check
        if instance.status == Exam.Status.COMPLETED:
            raise serializers.ValidationError("Completed examinations cannot be modified.")

        # 2. Active Exam Restrictions
        if instance.status == Exam.Status.ACTIVE:
            if 'academic_year_id' in data and data['academic_year_id'] != instance.academic_year_id:
                raise serializers.ValidationError({"academic_year_id": "Cannot change academic year of an ACTIVE exam."})
            if 'semester_id' in data and data['semester_id'] != instance.semester_id:
                raise serializers.ValidationError({"semester_id": "Cannot change semester of an ACTIVE exam."})

        # 3. Status Transition Rules
        new_status = data.get('status')
        if new_status and new_status != instance.status:
            if instance.status == Exam.Status.DRAFT and new_status == Exam.Status.COMPLETED:
                raise serializers.ValidationError({"status": "An exam must be ACTIVE before it can be COMPLETED."})
            if instance.status == Exam.Status.COMPLETED and new_status in [Exam.Status.ACTIVE, Exam.Status.DRAFT]:
                raise serializers.ValidationError({"status": "A COMPLETED exam cannot transition back to ACTIVE or DRAFT."})
            if new_status == Exam.Status.ACTIVE:
                # Check single active exam rule
                ay = AcademicYear.objects.get(id=data.get('academic_year_id', instance.academic_year_id))
                sem = Semester.objects.get(id=data.get('semester_id', instance.semester_id))
                if Exam.objects.filter(academic_year=ay, semester=sem, status=Exam.Status.ACTIVE).exclude(id=instance.id).exists():
                    raise serializers.ValidationError({"status": "An ACTIVE exam already exists for this Academic Year and Semester."})

                # Validate component total for all active subjects
                from .services import validate_exam_component_configuration
                invalid_subs = validate_exam_component_configuration(instance)
                if invalid_subs:
                    raise serializers.ValidationError({
                        "detail": "Exam cannot be activated because one or more subjects have incomplete mark component configuration.",
                        "invalid_subjects": invalid_subs
                    })

        return data

    def update(self, instance, validated_data):
        ay_id = validated_data.pop('academic_year_id', None)
        sem_id = validated_data.pop('semester_id', None)

        if ay_id:
            instance.academic_year = AcademicYear.objects.get(id=ay_id)
        if sem_id:
            instance.semester = Semester.objects.get(id=sem_id)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance


# ============================================================
# EXAM SUBJECT SERIALIZERS (PHASE 11)
# ============================================================

class ExamSubjectListSerializer(serializers.ModelSerializer):
    exam = serializers.SerializerMethodField()
    subject = serializers.SerializerMethodField()

    class Meta:
        model = ExamSubject
        fields = [
            'id',
            'exam',
            'subject',
            'maximum_marks',
            'passing_marks',
            'is_active',
            'display_order',
        ]

    def get_exam(self, obj):
        if not obj.exam:
            return None
        return {
            "id": obj.exam.id,
            "name": obj.exam.name,
            "status": obj.exam.status,
            "status_display": obj.exam.get_status_display()
        }

    def get_subject(self, obj):
        if not obj.subject:
            return None
        return {
            "id": obj.subject.id,
            "code": obj.subject.code,
            "name": obj.subject.name,
            "credits": obj.subject.credits
        }


class ExamSubjectDetailSerializer(ExamSubjectListSerializer):
    class Meta(ExamSubjectListSerializer.Meta):
        fields = ExamSubjectListSerializer.Meta.fields + [
            'created_at',
            'updated_at',
        ]


class ExamSubjectCreateSerializer(serializers.ModelSerializer):
    exam_id = serializers.IntegerField()
    subject_id = serializers.IntegerField()
    maximum_marks = serializers.DecimalField(max_digits=6, decimal_places=2)
    passing_marks = serializers.DecimalField(max_digits=6, decimal_places=2)

    class Meta:
        model = ExamSubject
        fields = [
            'exam_id',
            'subject_id',
            'maximum_marks',
            'passing_marks',
            'is_active',
            'display_order',
        ]

    def validate_exam_id(self, value):
        try:
            exam = Exam.objects.get(id=value)
        except Exam.DoesNotExist:
            raise serializers.ValidationError("Selected examination does not exist.")
        if exam.status != Exam.Status.DRAFT:
            raise serializers.ValidationError("Subjects can only be added to an examination in DRAFT status.")
        return value

    def validate_subject_id(self, value):
        try:
            subject = Subject.objects.get(id=value)
        except Subject.DoesNotExist:
            raise serializers.ValidationError("Selected subject does not exist.")
        if not subject.is_active:
            raise serializers.ValidationError("Selected subject is inactive.")
        return value

    def validate(self, data):
        exam_id = data.get('exam_id')
        subject_id = data.get('subject_id')
        max_m = data.get('maximum_marks')
        pass_m = data.get('passing_marks')

        if max_m is not None and max_m <= 0:
            raise serializers.ValidationError({"maximum_marks": "Maximum marks must be greater than zero."})
        if pass_m is not None and pass_m <= 0:
            raise serializers.ValidationError({"passing_marks": "Passing marks must be greater than zero."})
        if max_m is not None and pass_m is not None and pass_m > max_m:
            raise serializers.ValidationError({"passing_marks": "Passing marks cannot be greater than maximum marks."})

        if exam_id and subject_id:
            exam = Exam.objects.get(id=exam_id)
            subject = Subject.objects.get(id=subject_id)

            if ExamSubject.objects.filter(exam=exam, subject=subject).exists():
                raise serializers.ValidationError("This subject is already part of the selected examination.")

            if subject.semester and subject.semester != exam.semester:
                raise serializers.ValidationError({"subject_id": "Subject semester must match the Exam semester."})

        return data

    def create(self, validated_data):
        exam_id = validated_data.pop('exam_id')
        subject_id = validated_data.pop('subject_id')

        exam = Exam.objects.get(id=exam_id)
        subject = Subject.objects.get(id=subject_id)

        exam_subject = ExamSubject.objects.create(
            exam=exam,
            subject=subject,
            **validated_data
        )
        return exam_subject


class ExamSubjectUpdateSerializer(serializers.ModelSerializer):
    maximum_marks = serializers.DecimalField(max_digits=6, decimal_places=2, required=False)
    passing_marks = serializers.DecimalField(max_digits=6, decimal_places=2, required=False)

    class Meta:
        model = ExamSubject
        fields = [
            'maximum_marks',
            'passing_marks',
            'is_active',
            'display_order',
        ]

    def validate(self, data):
        instance = self.instance
        exam = instance.exam

        if exam.status == Exam.Status.COMPLETED:
            raise serializers.ValidationError("Subjects of a COMPLETED examination cannot be modified.")

        max_m = data.get('maximum_marks', instance.maximum_marks)
        pass_m = data.get('passing_marks', instance.passing_marks)

        if exam.status == Exam.Status.ACTIVE:
            if 'maximum_marks' in data and data['maximum_marks'] != instance.maximum_marks:
                raise serializers.ValidationError({"maximum_marks": "Cannot modify maximum marks for an ACTIVE examination."})
            if 'passing_marks' in data and data['passing_marks'] != instance.passing_marks:
                raise serializers.ValidationError({"passing_marks": "Cannot modify passing marks for an ACTIVE examination."})

        if max_m is not None and max_m <= 0:
            raise serializers.ValidationError({"maximum_marks": "Maximum marks must be greater than zero."})
        if pass_m is not None and pass_m <= 0:
            raise serializers.ValidationError({"passing_marks": "Passing marks must be greater than zero."})
        if max_m is not None and pass_m is not None and pass_m > max_m:
            raise serializers.ValidationError({"passing_marks": "Passing marks cannot be greater than maximum marks."})

        return data

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


# ============================================================
# EXAM COMPONENT SERIALIZERS (PHASE 12)
# ============================================================

class ExamComponentListSerializer(serializers.ModelSerializer):
    exam_subject = serializers.SerializerMethodField()

    class Meta:
        model = ExamComponent
        fields = [
            'id',
            'exam_subject',
            'name',
            'code',
            'maximum_marks',
            'passing_marks',
            'is_active',
            'display_order',
        ]

    def get_exam_subject(self, obj):
        if not obj.exam_subject:
            return None
        ex = obj.exam_subject.exam
        sub = obj.exam_subject.subject
        return {
            "id": obj.exam_subject.id,
            "exam": {
                "id": ex.id if ex else None,
                "name": ex.name if ex else "",
                "status": ex.status if ex else ""
            },
            "subject": {
                "id": sub.id if sub else None,
                "code": sub.code if sub else "",
                "name": sub.name if sub else ""
            },
            "maximum_marks": str(obj.exam_subject.maximum_marks)
        }


class ExamComponentDetailSerializer(ExamComponentListSerializer):
    class Meta(ExamComponentListSerializer.Meta):
        fields = ExamComponentListSerializer.Meta.fields + [
            'created_at',
            'updated_at',
        ]


class ExamComponentCreateSerializer(serializers.ModelSerializer):
    exam_subject_id = serializers.IntegerField()
    name = serializers.CharField(max_length=100)
    code = serializers.CharField(max_length=50, required=False, allow_blank=True)
    maximum_marks = serializers.DecimalField(max_digits=6, decimal_places=2)
    passing_marks = serializers.DecimalField(max_digits=6, decimal_places=2, required=False, allow_null=True)

    class Meta:
        model = ExamComponent
        fields = [
            'exam_subject_id',
            'name',
            'code',
            'maximum_marks',
            'passing_marks',
            'is_active',
            'display_order',
        ]

    def validate_name(self, value):
        norm = value.strip()
        if not norm:
            raise serializers.ValidationError("Component name cannot be empty.")
        return norm

    def validate_exam_subject_id(self, value):
        try:
            es = ExamSubject.objects.select_related('exam').get(id=value)
        except ExamSubject.DoesNotExist:
            raise serializers.ValidationError("Selected exam subject does not exist.")
        if not es.is_active:
            raise serializers.ValidationError("Selected exam subject is inactive.")
        if es.exam and es.exam.status != Exam.Status.DRAFT:
            raise serializers.ValidationError("Mark components can only be added when the examination is in DRAFT status.")
        return value

    def validate(self, data):
        es_id = data.get('exam_subject_id')
        name = data.get('name', '').strip()
        code = data.get('code', '').strip().upper() or name.upper()
        max_m = data.get('maximum_marks')
        pass_m = data.get('passing_marks')

        data['code'] = code

        if max_m is not None and max_m <= 0:
            raise serializers.ValidationError({"maximum_marks": "Maximum marks must be greater than zero."})
        if pass_m is not None:
            if pass_m <= 0:
                raise serializers.ValidationError({"passing_marks": "Passing marks must be greater than zero."})
            if max_m is not None and pass_m > max_m:
                raise serializers.ValidationError({"passing_marks": "Passing marks cannot be greater than maximum marks."})

        if es_id:
            es = ExamSubject.objects.get(id=es_id)
            if ExamComponent.objects.filter(exam_subject=es, code=code).exists():
                raise serializers.ValidationError({"code": "A component with this code already exists for this ExamSubject."})

            # Check component total sum overflow
            if data.get('is_active', True):
                from django.db.models import Sum
                current_sum = es.components.filter(is_active=True).aggregate(total=Sum('maximum_marks'))['total'] or Decimal('0.00')
                if (current_sum + max_m) > es.maximum_marks:
                    raise serializers.ValidationError({"maximum_marks": f"Component maximum marks total ({current_sum + max_m}) cannot exceed ExamSubject maximum marks ({es.maximum_marks})."})

        return data

    def create(self, validated_data):
        es_id = validated_data.pop('exam_subject_id')
        es = ExamSubject.objects.get(id=es_id)
        component = ExamComponent.objects.create(
            exam_subject=es,
            **validated_data
        )
        return component


class ExamComponentUpdateSerializer(serializers.ModelSerializer):
    name = serializers.CharField(max_length=100, required=False)
    code = serializers.CharField(max_length=50, required=False, allow_blank=True)
    maximum_marks = serializers.DecimalField(max_digits=6, decimal_places=2, required=False)
    passing_marks = serializers.DecimalField(max_digits=6, decimal_places=2, required=False, allow_null=True)

    class Meta:
        model = ExamComponent
        fields = [
            'name',
            'code',
            'maximum_marks',
            'passing_marks',
            'is_active',
            'display_order',
        ]

    def validate(self, data):
        instance = self.instance
        es = instance.exam_subject
        exam = es.exam

        if exam.status == Exam.Status.COMPLETED:
            raise serializers.ValidationError("Mark components of a COMPLETED examination cannot be modified.")

        max_m = data.get('maximum_marks', instance.maximum_marks)
        pass_m = data.get('passing_marks', instance.passing_marks)
        new_active = data.get('is_active', instance.is_active)

        if exam.status == Exam.Status.ACTIVE:
            if 'maximum_marks' in data and data['maximum_marks'] != instance.maximum_marks:
                raise serializers.ValidationError({"maximum_marks": "Cannot modify maximum marks after the examination becomes active."})
            if 'passing_marks' in data and data['passing_marks'] != instance.passing_marks:
                raise serializers.ValidationError({"passing_marks": "Cannot modify passing marks after the examination becomes active."})
            if 'name' in data and data['name'] != instance.name:
                raise serializers.ValidationError({"name": "Cannot modify component name after the examination becomes active."})
            if 'code' in data and data['code'].strip().upper() != instance.code:
                raise serializers.ValidationError({"code": "Cannot modify component code after the examination becomes active."})

        if max_m is not None and max_m <= 0:
            raise serializers.ValidationError({"maximum_marks": "Maximum marks must be greater than zero."})
        if pass_m is not None:
            if pass_m <= 0:
                raise serializers.ValidationError({"passing_marks": "Passing marks must be greater than zero."})
            if max_m is not None and pass_m > max_m:
                raise serializers.ValidationError({"passing_marks": "Passing marks cannot be greater than maximum marks."})

        # Check total sum overflow
        if new_active:
            from django.db.models import Sum
            qs = es.components.filter(is_active=True).exclude(id=instance.id)
            current_sum = qs.aggregate(total=Sum('maximum_marks'))['total'] or Decimal('0.00')
            if (current_sum + max_m) > es.maximum_marks:
                raise serializers.ValidationError({"maximum_marks": f"Component maximum marks total ({current_sum + max_m}) cannot exceed ExamSubject maximum marks ({es.maximum_marks})."})

        return data

    def update(self, instance, validated_data):
        if 'code' in validated_data and validated_data['code']:
            validated_data['code'] = validated_data['code'].strip().upper()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
