from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import authenticate
from django.db.models import Q
from django.utils import timezone

from core.models import (
    CustomUser, AcademicDepartment, Workplace, InternshipPlacement,
    WeeklyLog, SupervisorReview, EvaluationCriteria, Evaluation, AuditLog
)

from api.serializers import (
    UserSerializer, StudentSerializer,
    AcademicSupervisorSerializer, WorkplaceSupervisorSerializer,
    # Auth
    StudentRegistrationSerializer, SupervisorRegistrationSerializer,
    LoginSerializer, ChangePasswordSerializer,
    #Academic Department & Workplace
    AcademicDepartmentSerializer, WorkplaceSerializer,
    # Placement
    InternshipPlacementSerializer, InternshipPlacementCreateSerializer,
    PlacementStatusUpdateSerializer,
    # Weekly Log
    WeeklyLogSerializer, WeeklyLogCreateSerializer,
    WeeklyLogUpdateSerializer, LogStatusUpdateSerializer,
    # Review
    SupervisorReviewSerializer, SupervisorReviewCreateSerializer,
    # Evaluation
    EvaluationCriteriaSerializer,
    EvaluationSerializer, EvaluationCreateSerializer, EvaluationUpdateSerializer,
    # Audit
    AuditLogSerializer,
)

from api.permissions import (
    IsAdmin, IsStudent, IsAcademicSupervisor, IsWorkplaceSupervisor, IsAdminOrAcademicSupervisor, IsAdminOrWorkplaceSupervisor, IsOwnProfileOrAdmin,
    IsOwnPlacementOrAdmin, IsOwnLogOrSupervisorOrAdmin, CanEditLog, IsOwnReviewOrAdmin, IsOwnEvaluationOrAdmin, IsOwnEvaluationCriteriaOrAdmin, CanViewAuditLog, MustChangePassword,
)

# AUTHENTICATION VIEWS

class StudentRegisterView(APIView):
    """
    Student self-registration.
    Returns: user data + JWT tokens so student is logged in immediately.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = StudentRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            tokens = _get_tokens(user)
            return Response({
                'message': f"Welcome {user.get_full_name()}! Registration successful.",
                'user': StudentSerializer(user).data,
                'tokens': tokens,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)