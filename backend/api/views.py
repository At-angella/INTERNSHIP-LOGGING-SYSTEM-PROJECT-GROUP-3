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
    
# WORKPLACE VIEWSET

class WorkplaceViewSet(viewsets.ModelViewSet):
    """
    Workplace management.
    """
    queryset = Workplace.objects.all()
    serializer_class = WorkplaceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['is_active', 'industry']
    search_fields = ['name', 'contact_person']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]
    
# INTERNSHIP PLACEMENT VIEWSET

class InternshipPlacementViewSet(viewsets.ModelViewSet):
    """
    Internship placement management.
        filtered by role
        ADMIN only
        own placement or ADMIN
        ADMIN only (approve/reject)
    """
    permission_classes = [IsAuthenticated, MustChangePassword]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'department', 'workplace']
    ordering_fields = ['start_date', 'created_at']
    ordering = ['-start_date']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return InternshipPlacementCreateSerializer
        if self.action == 'update_status':
            return PlacementStatusUpdateSerializer
        return InternshipPlacementSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return InternshipPlacement.objects.select_related(
                'student', 'workplace', 'academic_supervisor',
                'workplace_supervisor', 'department'
            ).all()
        elif user.role == 'STUDENT':
            return InternshipPlacement.objects.filter(student=user)
        elif user.role in ['WORKPLACE_SUPERVISOR', 'ACADEMIC_SUPERVISOR']:
            return InternshipPlacement.objects.filter(
                Q(workplace_supervisor=user) | Q(academic_supervisor=user)
            )
        return InternshipPlacement.objects.none()

    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated(), IsAdmin()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated(), IsOwnPlacementOrAdmin()]

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated, IsAdmin])
    def update_status(self, request, pk=None):
        """
        Update placement status.
        Used by: Admin to approve, reject, activate, complete, or cancel placements.
        """
        placement = self.get_object()
        serializer = PlacementStatusUpdateSerializer(
            placement,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(
                InternshipPlacementSerializer(placement).data,
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdmin])
    def approve(self, request, pk=None):
        """
        Approve a placement.
        """
        placement = self.get_object()
        if placement.status != 'PENDING':
            return Response(
                {'detail': f"Cannot approve a placement with status '{placement.status}'."},
                status=status.HTTP_400_BAD_REQUEST
            )
        placement.status = 'APPROVED'
        placement.approved_at = timezone.now()
        placement.approved_by = request.user
        placement.save()
        return Response(
            InternshipPlacementSerializer(placement).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdmin])
    def reject(self, request, pk=None):
        """
        Reject a placement.
        """
        placement = self.get_object()
        if placement.status != 'PENDING':
            return Response(
                {'detail': f"Cannot reject a placement with status '{placement.status}'."},
                status=status.HTTP_400_BAD_REQUEST
            )
        placement.status = 'REJECTED'
        placement.save()
        return Response(
            InternshipPlacementSerializer(placement).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['get'])
    def logs(self, request, pk=None):
        """
        Get all weekly logs for a specific placement.
        Used by: Supervisors and admin viewing a student's full logbook.
        """
        placement = self.get_object()
        logs = placement.weekly_logs.all().order_by('week_number')
        serializer = WeeklyLogSerializer(logs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def evaluation(self, request, pk=None):
        """
        Get the evaluation for a specific placement.
        Used by: Student viewing their result, supervisor viewing their submission.
        """
        placement = self.get_object()
        try:
            evaluation = placement.evaluation
            serializer = EvaluationSerializer(evaluation)
            return Response(serializer.data)
        except Evaluation.DoesNotExist:
            return Response(
                {'detail': 'No evaluation found for this placement.'},
                status=status.HTTP_404_NOT_FOUND
            )

# WEEKLY LOG VIEWSET

class WeeklyLogViewSet(viewsets.ModelViewSet):
    """
    Weekly log management.
        filtered by role
        Student only
        Student (own draft logs only)
        Student submits draft
        Workplace supervisor marks as reviewed
        Academic supervisor approves
        Academic supervisor sends back for revision
        generic status update
    """
    permission_classes = [IsAuthenticated, MustChangePassword]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'placement__department']
    ordering_fields = ['week_number', 'submitted_at']
    ordering = ['-week_number']

    def get_serializer_class(self):
        if self.action == 'create':
            return WeeklyLogCreateSerializer
        if self.action in ['update', 'partial_update']:
            return WeeklyLogUpdateSerializer
        if self.action == 'update_status':
            return LogStatusUpdateSerializer
        return WeeklyLogSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return WeeklyLog.objects.select_related(
                'placement__student',
                'placement__workplace_supervisor',
                'placement__academic_supervisor'
            ).all()
        elif user.role == 'STUDENT':
            return WeeklyLog.objects.filter(placement__student=user)
        elif user.role == 'WORKPLACE_SUPERVISOR':
            return WeeklyLog.objects.filter(placement__workplace_supervisor=user)
        elif user.role == 'ACADEMIC_SUPERVISOR':
            return WeeklyLog.objects.filter(placement__academic_supervisor=user)
        return WeeklyLog.objects.none()

    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated(), IsStudent()]
        if self.action in ['update', 'partial_update']:
            return [IsAuthenticated(), IsOwnLogOrSupervisorOrAdmin(), CanEditLog()]
        return [IsAuthenticated(), IsOwnLogOrSupervisorOrAdmin()]

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsStudent])
    def submit(self, request, pk=None):
        """
        Student submits a draft log.
        """
        log = self.get_object()
        if log.placement.student != request.user:
            return Response(
                {'detail': 'You can only submit your own logs.'},
                status=status.HTTP_403_FORBIDDEN
            )
        if log.status not in ['DRAFT', 'REVISE']:
            return Response(
                {'detail': f"Cannot submit a log with status '{log.status}'."},
                status=status.HTTP_400_BAD_REQUEST
            )
        log.status = 'SUBMITTED'
        log.save()
        return Response(WeeklyLogSerializer(log).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsWorkplaceSupervisor])
    def review(self, request, pk=None):
        """
        Workplace supervisor marks log as reviewed.
        """
        log = self.get_object()
        if log.placement.workplace_supervisor != request.user:
            return Response(
                {'detail': 'You can only review logs for your assigned interns.'},
                status=status.HTTP_403_FORBIDDEN
            )
        if log.status != 'SUBMITTED':
            return Response(
                {'detail': f"Cannot review a log with status '{log.status}'."},
                status=status.HTTP_400_BAD_REQUEST
            )
        log.status = 'REVIEWED'
        log.save()
        return Response(WeeklyLogSerializer(log).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAcademicSupervisor])
    def approve(self, request, pk=None):
        """
        Academic supervisor approves a reviewed log.
        """
        log = self.get_object()
        if log.placement.academic_supervisor != request.user:
            return Response(
                {'detail': 'You can only approve logs for your assigned students.'},
                status=status.HTTP_403_FORBIDDEN
            )
        if log.status != 'REVIEWED':
            return Response(
                {'detail': f"Cannot approve a log with status '{log.status}'."},
                status=status.HTTP_400_BAD_REQUEST
            )
        log.status = 'APPROVED'
        log.save()
        return Response(WeeklyLogSerializer(log).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAcademicSupervisor])
    def reject(self, request, pk=None):
        """
        Academic supervisor sends log back for revision.
        """
        log = self.get_object()
        if log.placement.academic_supervisor != request.user:
            return Response(
                {'detail': 'You can only reject logs for your assigned students.'},
                status=status.HTTP_403_FORBIDDEN
            )
        if log.status != 'REVIEWED':
            return Response(
                {'detail': f"Cannot reject a log with status '{log.status}'."},
                status=status.HTTP_400_BAD_REQUEST
            )
        log.status = 'REVISE'
        log.save()
        return Response(
            {'detail': 'Log sent back for revision.'},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """
        Generic status update with role-based transition validation.
        """
        log = self.get_object()
        serializer = LogStatusUpdateSerializer(
            log,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(WeeklyLogSerializer(log).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# SUPERVISOR REVIEW VIEWSET

class SupervisorReviewViewSet(viewsets.ModelViewSet):
    """
    Supervisor review management.
        own reviews (supervisor) or all (admin)
        Workplace supervisor only can create reviews for their interns
    """
    permission_classes = [IsAuthenticated, MustChangePassword]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['approval_status']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return SupervisorReviewCreateSerializer
        return SupervisorReviewSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return SupervisorReview.objects.all()
        elif user.role == 'WORKPLACE_SUPERVISOR':
            return SupervisorReview.objects.filter(reviewer=user)
        elif user.role == 'ACADEMIC_SUPERVISOR':
            return SupervisorReview.objects.filter(
                log__placement__academic_supervisor=user
            )
        elif user.role == 'STUDENT':
            return SupervisorReview.objects.filter(
                log__placement__student=user
            )
        return SupervisorReview.objects.none()

    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated(), IsWorkplaceSupervisor()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsOwnReviewOrAdmin()]
        return [IsAuthenticated(), IsOwnReviewOrAdmin()]

# EVALUATION CRITERIA VIEWSET

class EvaluationCriteriaViewSet(viewsets.ModelViewSet):
    """
    Evaluation criteria management.
        Admin + Academic supervisors (read)
    """
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['department', 'category', 'is_active']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return EvaluationCriteria.objects.all()
        # Others only see active criteria
        return EvaluationCriteria.objects.filter(is_active=True)

    def get_serializer_class(self):
        return EvaluationCriteriaSerializer

    def get_permissions(self):
        return [IsAuthenticated(), IsOwnEvaluationCriteriaOrAdmin()]
    
# EVALUATION VIEWSET

class EvaluationViewSet(viewsets.ModelViewSet):
    """
    Evaluation management.
        own evaluations filtered by role
        Academic supervisor (own evaluations, before submission)
        Academic supervisor submits (locks evaluation)
    """
    permission_classes = [IsAuthenticated, MustChangePassword]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_submitted', 'placement__department']

    def get_serializer_class(self):
        if self.action == 'create':
            return EvaluationCreateSerializer
        if self.action in ['update', 'partial_update']:
            return EvaluationUpdateSerializer
        return EvaluationSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Evaluation.objects.all()
        elif user.role == 'ACADEMIC_SUPERVISOR':
            return Evaluation.objects.filter(evaluator=user)
        elif user.role == 'STUDENT':
            # Students only see submitted evaluations
            return Evaluation.objects.filter(
                placement__student=user,
                is_submitted=True
            )
        return Evaluation.objects.none()

    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated(), IsAcademicSupervisor()]
        if self.action in ['update', 'partial_update']:
            return [IsAuthenticated(), IsOwnEvaluationOrAdmin()]
        if self.action == 'destroy':
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated(), IsOwnEvaluationOrAdmin()]

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAcademicSupervisor])
    def submit(self, request, pk=None):
        """
        Submit and lock an evaluation.
        Endpoint: POST /evaluations/{id}/submit/
        Once submitted: student can see it, no further edits allowed.
        Triggers signal: EVALUATION_SUBMITTED audit entry.
        """
        evaluation = self.get_object()
        if evaluation.evaluator != request.user:
            return Response(
                {'detail': 'You can only submit your own evaluations.'},
                status=status.HTTP_403_FORBIDDEN
            )
        if evaluation.is_submitted:
            return Response(
                {'detail': 'This evaluation has already been submitted.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Validate all scores are present before submitting
        missing_scores = []
        for field in ['technical_score', 'soft_skills_score', 'attendance_score', 'conduct_score']:
            if getattr(evaluation, field) is None:
                missing_scores.append(field)
        if missing_scores:
            return Response(
                {'detail': f"Missing scores: {', '.join(missing_scores)}. All scores required before submitting."},
                status=status.HTTP_400_BAD_REQUEST
            )
        evaluation.is_submitted = True
        evaluation.save()
        return Response(EvaluationSerializer(evaluation).data, status=status.HTTP_200_OK)

# AUDIT LOG VIEWSET

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Audit log — read only.
    """
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, CanViewAuditLog]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['action', 'content_type', 'actor']
    ordering_fields = ['timestamp']
    ordering = ['-timestamp']

    def get_queryset(self):
        return AuditLog.objects.select_related('actor').all()
    
# HELPER FUNCTIONS

def _get_tokens(user):
    """
    Generate JWT access + refresh tokens for a user.
    """
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

def _get_role_serializer(user):
    """Return an instantiated serializer based on the user's role."""
    return _get_role_serializer_class(user)(user)

def _get_role_serializer_class(user):
    """
    Used across login, registration, and profile views
    """
    role_map = {
        'STUDENT': StudentSerializer,
        'ACADEMIC_SUPERVISOR': AcademicSupervisorSerializer,
        'WORKPLACE_SUPERVISOR': WorkplaceSupervisorSerializer,
    }
    return role_map.get(user.role, UserSerializer)
