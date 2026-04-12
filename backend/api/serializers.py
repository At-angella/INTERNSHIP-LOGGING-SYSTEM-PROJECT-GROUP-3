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