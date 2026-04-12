from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from core.models import (
    CustomUser, AcademicDepartment, Workplace, InternshipPlacement,
    WeeklyLog, SupervisorReview, EvaluationCriteria, Evaluation, AuditLog
)

# USER SERIALIZERS

class UserSerializer(serializers.ModelSerializer):
    """
    Basic user info — used for showing who the student is inside
    a placement, or who the reviewer is inside a review.
    Read-only, never used for creating users.
    """
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = CustomUser
        fields = (
            'id', 'email', 'first_name', 'last_name',
            'role', 'role_display', 'phone_number', 'is_active'
        )
        read_only_fields = fields

class StudentSerializer(serializers.ModelSerializer):
    """
    Detailed student profile — used when viewing a student's
    full profile including academic details.
    """
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = CustomUser
        fields = (
            'id', 'email', 'first_name', 'last_name', 'role', 'role_display',
            'phone_number', 'student_id', 'registration_number',
            'college', 'program', 'is_active', 'date_joined'
        )
        read_only_fields = fields

class AcademicSupervisorSerializer(serializers.ModelSerializer):
    """
    Detailed academic supervisor profile and used when admin views supervisor list.
    """
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = CustomUser
        fields = (
            'id', 'email', 'first_name', 'last_name', 'role', 'role_display',
            'phone_number', 'staff_id', 'faculty', 'department',
            'specialization', 'max_students', 'is_active', 'date_joined'
        )
        read_only_fields = fields

class WorkplaceSupervisorSerializer(serializers.ModelSerializer):
    """
    Detailed workplace supervisor profile.
    """
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = CustomUser
        fields = (
            'id', 'email', 'first_name', 'last_name', 'role', 'role_display',
            'phone_number', 'job_title', 'workplace_department',
            'years_of_experience', 'is_active', 'date_joined'
        )
        read_only_fields = fields

# AUTHENTICATION SERIALIZERS

class StudentRegistrationSerializer(serializers.ModelSerializer):
    """
    Students register themselves — no admin needed.
    """
    password = serializers.CharField(
        write_only=True,
        min_length=8,
    )
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = (
            'email', 'first_name', 'last_name', 'phone_number',
            'student_id', 'registration_number', 'college', 'program',
            'password', 'confirm_password'
        )

    def validate_email(self, value):
        if not value.endswith('@students.mak.ac.ug'):
            raise serializers.ValidationError(
                "Must use your university student email (@students.mak.ac.ug)."
            )
        return value

    def validate_student_id(self, value):
        if CustomUser.objects.filter(student_id=value).exists():
            raise serializers.ValidationError(
                "A student with this student ID already exists."
            )
        return value

    def validate_registration_number(self, value):
        if CustomUser.objects.filter(registration_number=value).exists():
            raise serializers.ValidationError(
                "A student with this registration number already exists."
            )
        return value

    def validate(self, data):
        if data['password'] != data.pop('confirm_password'):
            raise serializers.ValidationError({
                'confirm_password': "Passwords do not match."
            })
        try:
            validate_password(data['password'])
        except ValidationError as e:
            raise serializers.ValidationError({'password': list(e.messages)})
        return data

    def create(self, validated_data):
        password = validated_data.pop('password')
        user, _ = CustomUser.objects.create_user(
            role='STUDENT',
            **validated_data
        )
        user.set_password(password)
        user.save()
        return user
    
class SupervisorRegistrationSerializer(serializers.ModelSerializer):
    """
    Used by ADMIN to register Academic or Workplace supervisors.
    Password is auto-generated and returned once to the admin.
    """
    temp_password = serializers.CharField(read_only=True)

    class Meta:
        model = CustomUser
        fields = (
            'id', 'email', 'first_name', 'last_name', 'role', 'phone_number',
            # Academic supervisor fields
            'staff_id', 'faculty', 'department', 'specialization', 'max_students',
            # Workplace supervisor fields
            'job_title', 'workplace_department', 'years_of_experience',
            # Returned after creation
            'temp_password',
        )
        read_only_fields = ('id', 'temp_password')

    def validate_role(self, value):
        """Only supervisor roles are allowed through this serializer."""
        if value not in ['ACADEMIC_SUPERVISOR', 'WORKPLACE_SUPERVISOR']:
            raise serializers.ValidationError(
                "This endpoint only registers Academic or Workplace Supervisors."
            )
        return value

    def validate_email(self, value):
        if not value.endswith('@mak.ac.ug'):
            raise serializers.ValidationError(
                "Supervisor email must use the '@mak.ac.ug' domain."
            )
        return value

    def validate(self, data):
        role = data.get('role')

        # Enforce required fields per supervisor role
        if role == 'ACADEMIC_SUPERVISOR':
            required = ['staff_id', 'faculty', 'department', 'specialization']
            missing = [f for f in required if not data.get(f)]
            if missing:
                raise serializers.ValidationError({
                    f: "This field is required for Academic Supervisors."
                    for f in missing
                })

        if role == 'WORKPLACE_SUPERVISOR':
            required = ['job_title', 'workplace_department', 'years_of_experience']
            missing = [f for f in required if not data.get(f)]
            if missing:
                raise serializers.ValidationError({
                    f: "This field is required for Workplace Supervisors."
                    for f in missing
                })
        return data

    def create(self, validated_data):
        request = self.context.get('request')
        user, temp_password = CustomUser.objects.create_user(
            created_by=request.user,
            **validated_data
        )
        # Attached temp_password to the instance so it appears in the response
        user.temp_password = temp_password
        return user


class LoginSerializer(serializers.Serializer):
    """
    Used for login.
    Returns tokens + user info.
    """
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class ChangePasswordSerializer(serializers.Serializer):
    """
    Used when a supervisor logs in for the first time
    and must change their temporary password.
    Also used by any user wanting to update their password.
    """
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_new_password = serializers.CharField(write_only=True)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value

    def validate(self, data):
        if data['new_password'] != data['confirm_new_password']:
            raise serializers.ValidationError({
                'confirm_new_password': "New passwords do not match."
            })
        try:
            validate_password(data['new_password'], self.context['request'].user)
        except ValidationError as e:
            raise serializers.ValidationError({'new_password': list(e.messages)})
        return data

    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.must_change_password = False
        user.save()
        return user
    
# ACADEMIC DEPARTMENT & WORKPLACE

class AcademicDepartmentSerializer(serializers.ModelSerializer):
    """
    Used for listing and creating academic departments.
    """
    head = UserSerializer(read_only=True)
    head_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.filter(role='ACADEMIC_SUPERVISOR'),
        source='head',
        write_only=True,
        required=False
    )
    placement_count = serializers.SerializerMethodField()

    class Meta:
        model = AcademicDepartment
        fields = (
            'id', 'name', 'faculty', 'description',
            'head', 'head_id', 'placement_count',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_placement_count(self, obj):
        return obj.placements.count()


class WorkplaceSerializer(serializers.ModelSerializer):
    """
    Used for listing and creating workplaces.
    """
    active_placements_count = serializers.SerializerMethodField()

    class Meta:
        model = Workplace
        fields = (
            'id', 'name', 'industry', 'address', 'contact_person',
            'contact_email', 'contact_phone', 'is_active',
            'active_placements_count', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_active_placements_count(self, obj):
        return obj.internship_placements.filter(status='ACTIVE').count()

# INTERNSHIP PLACEMENT SERIALIZERS

class InternshipPlacementSerializer(serializers.ModelSerializer):
    """
    Full placement detail with nested objects.
    """
    student = StudentSerializer(read_only=True)
    workplace = WorkplaceSerializer(read_only=True)
    academic_supervisor = AcademicSupervisorSerializer(read_only=True)
    workplace_supervisor = WorkplaceSupervisorSerializer(read_only=True)
    department = AcademicDepartmentSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    log_progress = serializers.SerializerMethodField()

    class Meta:
        model = InternshipPlacement
        fields = (
            'id', 'student', 'workplace', 'academic_supervisor',
            'workplace_supervisor', 'department', 'start_date', 'end_date',
            'status', 'status_display', 'position_title', 'description',
            'log_progress', 'created_at', 'updated_at', 'approved_at', 'approved_by'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'approved_at', 'approved_by')

    def get_log_progress(self, obj):
        """Shows approved and total logs"""
        total = obj.weekly_logs.count()
        approved = obj.weekly_logs.filter(status='APPROVED').count()
        return {
            'total_logs': total,
            'approved_logs': approved,
            'pending_logs': total - approved,
        }


class InternshipPlacementCreateSerializer(serializers.ModelSerializer):
    """
    Used for creating and updating placements.
    """
    class Meta:
        model = InternshipPlacement
        fields = (
            'student', 'workplace', 'academic_supervisor', 'workplace_supervisor',
            'department', 'start_date', 'end_date', 'position_title', 'description'
        )

    def validate_student(self, value):
        if value.role != 'STUDENT':
            raise serializers.ValidationError("Selected user is not a student.")
        return value

    def validate_academic_supervisor(self, value):
        if value.role != 'ACADEMIC_SUPERVISOR':
            raise serializers.ValidationError("Selected user is not an academic supervisor.")
        # Check supervisor capacity
        active_count = value.supervised_placements.filter(
            status__in=['APPROVED', 'ACTIVE']
        ).count()
        if value.max_students and active_count >= value.max_students:
            raise serializers.ValidationError(
                f"{value.get_full_name()} has reached their maximum student capacity "
                f"({value.max_students} students)."
            )
        return value

    def validate_workplace_supervisor(self, value):
        if value.role != 'WORKPLACE_SUPERVISOR':
            raise serializers.ValidationError("Selected user is not a workplace supervisor.")
        return value

    def validate(self, data):
        if data['start_date'] >= data['end_date']:
            raise serializers.ValidationError({
                'end_date': "End date must be after start date."
            })
        return data


class PlacementStatusUpdateSerializer(serializers.ModelSerializer):
    """
    Used specifically for approving or rejecting placements.
    """
    class Meta:
        model = InternshipPlacement
        fields = ('status',)

    def validate_status(self, value):
        allowed = ['APPROVED', 'REJECTED', 'ACTIVE', 'COMPLETED', 'CANCELLED']
        if value not in allowed:
            raise serializers.ValidationError(
                f"Status must be one of: {', '.join(allowed)}"
            )
        return value

    def update(self, instance, validated_data):
        request = self.context.get('request')
        instance.status = validated_data['status']
        if validated_data['status'] == 'APPROVED':
            instance.approved_by = request.user
        instance.save()
        return instance

# WEEKLY LOG SERIALIZERS

class WeeklyLogSerializer(serializers.ModelSerializer):
    """
    Full weekly log detail.
    """
    placement = InternshipPlacementSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    supervisor_review = serializers.SerializerMethodField()

    class Meta:
        model = WeeklyLog
        fields = (
            'id', 'placement', 'week_number', 'week_start_date', 'week_end_date',
            'status', 'status_display', 'activities_performed', 'skills_acquired',
            'challenges_faced', 'lessons_learned', 'hours_worked',
            'supervisor_review',
            'created_at', 'updated_at', 'submitted_at', 'reviewed_at', 'approved_at'
        )
        read_only_fields = (
            'id', 'created_at', 'updated_at',
            'submitted_at', 'reviewed_at', 'approved_at'
        )

    def get_supervisor_review(self, obj):
        """Inline the review if it exists, otherwise return null"""
        try:
            review = obj.supervisor_review
            return SupervisorReviewSerializer(review).data
        except Exception:
            return None


class WeeklyLogCreateSerializer(serializers.ModelSerializer):
    """
    Used for creating a new weekly log.
    """
    class Meta:
        model = WeeklyLog
        fields = (
            'placement', 'week_number', 'week_start_date', 'week_end_date',
            'activities_performed', 'skills_acquired',
            'challenges_faced', 'lessons_learned', 'hours_worked',
        )

    def validate_placement(self, value):
        request = self.context.get('request')
        if value.student != request.user:
            raise serializers.ValidationError(
                "You can only create logs for your own placement."
            )
        if value.status not in ['APPROVED', 'ACTIVE']:
            raise serializers.ValidationError(
                "Logs can only be created for approved or active placements."
            )
        return value

    def validate_hours_worked(self, value):
        if value < 0:
            raise serializers.ValidationError("Hours worked cannot be negative.")
        if value > 60:
            raise serializers.ValidationError(
                "Hours worked cannot exceed 60 hours in a week."
            )
        return value

    def validate(self, data):
        if data['week_start_date'] >= data['week_end_date']:
            raise serializers.ValidationError({
                'week_end_date': "Week end date must be after start date."
            })
        return data


class WeeklyLogUpdateSerializer(serializers.ModelSerializer):
    """
    Used for editing a log (only when DRAFT or REVISE).
    """
    class Meta:
        model = WeeklyLog
        fields = (
            'activities_performed', 'skills_acquired',
            'challenges_faced', 'lessons_learned', 'hours_worked',
        )


class LogStatusUpdateSerializer(serializers.ModelSerializer):
    """
    Used for transitioning a log's status.
    Student submits → Supervisor reviews → Academic approves.
    """
    class Meta:
        model = WeeklyLog
        fields = ('status',)

    def validate_status(self, value):
        request = self.context.get('request')
        user = request.user
        instance = self.instance

        allowed_transitions = {
            'STUDENT': {
                'DRAFT': 'SUBMITTED',
                'REVISE': 'SUBMITTED',
            },
            'WORKPLACE_SUPERVISOR': {
                'SUBMITTED': ['REVIEWED', 'REVISE'],
            },
            'ACADEMIC_SUPERVISOR': {
                'REVIEWED': ['APPROVED', 'REJECTED'],
            },
        }

        role_transitions = allowed_transitions.get(user.role, {})
        allowed = role_transitions.get(instance.status)

        if allowed is None:
            raise serializers.ValidationError(
                f"Your role cannot transition a log from '{instance.status}'."
            )

        if isinstance(allowed, list) and value not in allowed:
            raise serializers.ValidationError(
                f"Cannot transition from '{instance.status}' to '{value}'."
            )
        if isinstance(allowed, str) and value != allowed:
            raise serializers.ValidationError(
                f"From '{instance.status}' you can only move to '{allowed}'."
            )
        return value