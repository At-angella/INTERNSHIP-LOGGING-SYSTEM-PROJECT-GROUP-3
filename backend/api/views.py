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
    
class SupervisorRegisterView(APIView):
    """
    Admin registers Academic or Workplace supervisors.
    Returns: new supervisor data + temp password (shown once only).
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request):
        serializer = SupervisorRegistrationSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'message': (
                    f"Account created for {user.get_full_name()}. "
                    f"Share these credentials securely — "
                    f"the password will not be shown again."
                ),
                'user': _get_role_serializer(user).data,
                'temp_password': user.temp_password,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class LoginView(APIView):
    """
    Login for all roles.
    Returns: JWT tokens + user data + must_change_password flag.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        user = authenticate(request, username=email, password=password)

        if not user:
            return Response(
                {'detail': 'Invalid email or password.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {'detail': 'Your account has been deactivated. Contact the administrator.'},
                status=status.HTTP_403_FORBIDDEN
            )

        tokens = _get_tokens(user)

        return Response({
            'message': f"Welcome back, {user.get_full_name()}!",
            'user': _get_role_serializer(user).data,
            'tokens': tokens,
            'must_change_password': user.must_change_password,
        }, status=status.HTTP_200_OK)
    
class LogoutView(APIView):
    """
    Logout — blacklists the refresh token and deletes tokens from its local storage.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {'detail': 'Refresh token is required.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {'message': 'Logged out successfully.'},
                status=status.HTTP_200_OK
            )
        except TokenError:
            return Response(
                {'detail': 'Invalid or expired token.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
class ChangePasswordView(APIView):
    """
    Change password.
    Used for:
    1. Supervisors forced to change temp password on first login
    2. Any user voluntarily changing their password
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            # Issues new tokens since password changed
            tokens = _get_tokens(request.user)
            return Response({
                'message': 'Password changed successfully.',
                'tokens': tokens,
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class RefreshTokenView(APIView):
    """
    Refresh access token using refresh token.
    Returns: new access token.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {'detail': 'Refresh token is required.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            token = RefreshToken(refresh_token)
            return Response({
                'access': str(token.access_token),
            }, status=status.HTTP_200_OK)
        except TokenError:
            return Response(
                {'detail': 'Invalid or expired refresh token. Please log in again.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
# USER VIEWS

class UserViewSet(viewsets.ModelViewSet):
    """
    User management.
        ADMIN sees all, others see only themselves
        own profile or ADMIN
        current logged in user
        own profile or ADMIN
        ADMIN or supervisors see student list
        ADMIN sees supervisor list
    """
    permission_classes = [IsAuthenticated, MustChangePassword]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['role', 'is_active', 'college', 'faculty']
    search_fields = [
        'email', 'first_name', 'last_name',
        'student_id', 'registration_number', 'staff_id'
    ]
    ordering_fields = ['date_joined', 'email', 'first_name']
    ordering = ['-date_joined']

    def get_serializer_class(self):
        """Return role-appropriate serializer."""
        user = self.request.user
        obj = self.get_object() if self.action == 'retrieve' else user
        return _get_role_serializer_class(obj)

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return CustomUser.objects.all()
        elif user.role in ['ACADEMIC_SUPERVISOR', 'WORKPLACE_SUPERVISOR']:
            # Supervisors see their assigned students
            return CustomUser.objects.filter(
                Q(pk=user.pk) |
                Q(
                    internship_placements__academic_supervisor=user
                ) |
                Q(
                    internship_placements__workplace_supervisor=user
                )
            ).distinct()
        # Students see only themselves
        return CustomUser.objects.filter(pk=user.pk)

    def get_permissions(self):
        if self.action in ['destroy']:
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated(), MustChangePassword(), IsOwnProfileOrAdmin()]

    @action(detail=False, methods=['get'])
    def me(self, request):
        # Get current logged-in user's full profile.
        serializer = _get_role_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsAdminOrAcademicSupervisor])
    def students(self, request):
        """
        List all students.
        Used by: Admin managing placements, supervisors viewing their interns.
        """
        queryset = CustomUser.objects.filter(role='STUDENT')
        serializer = StudentSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsAdmin])
    def supervisors(self, request):
        """
        List all supervisors.
        Used by: Admin when assigning supervisors to placements.
        """
        role = request.query_params.get('role')
        queryset = CustomUser.objects.filter(
            role__in=['ACADEMIC_SUPERVISOR', 'WORKPLACE_SUPERVISOR']
        )
        if role:
            queryset = queryset.filter(role=role)
        serializer = UserSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsAdmin])
    def available_supervisors(self, request):
        """
        List academic supervisors who still have student capacity.
        Used by: Admin when creating a new placement — only shows
        supervisors who haven't hit their max_students limit.
        """
        supervisors = CustomUser.objects.filter(
            role='ACADEMIC_SUPERVISOR',
            is_active=True
        )
        available = [
            s for s in supervisors
            if s.supervised_placements.filter(
                status__in=['APPROVED', 'ACTIVE']
            ).count() < (s.max_students or 999)
        ]
        serializer = AcademicSupervisorSerializer(available, many=True)
        return Response(serializer.data)
    
# ACADEMIC DEPARTMENT VIEWSET

class AcademicDepartmentViewSet(viewsets.ModelViewSet):
    """
    Academic Department management.
    """
    queryset = AcademicDepartment.objects.all()
    serializer_class = AcademicDepartmentSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'faculty']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]
