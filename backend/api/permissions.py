from rest_framework.permissions import BasePermission, SAFE_METHODS

# Custom permissions for role-based access control.

# BASED ON ROLE

class IsAuthenticated(BasePermission):
    #Rejects all unauthenticated requests outright.
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)
    
class IsAdmin(BasePermission):
    """
    Allows access only to ADMIN users.
    Used for: registering supervisors, managing placements,
    approving/rejecting placements, viewing audit logs.
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role == 'ADMIN'
        )
    
class IsStudent(BasePermission):
    """
    Allows access only to STUDENTS.
    Used for: creating weekly logs, viewing own placement,
    viewing own evaluations.
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role == 'STUDENT'
        )
    
class IsAcademicSupervisor(BasePermission):
    """
    Allows access only to ACADEMIC_SUPERVISORS.
    Used for: submitting evaluations, approving weekly logs,
    viewing assigned students' logs.
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role == 'ACADEMIC_SUPERVISOR'
        )
    
class IsWorkplaceSupervisor(BasePermission):
    """
    Allows access only to WORKPLACE_SUPERVISORS.
    Used for: reviewing weekly logs, submitting supervisor
    reviews, viewing assigned interns' logs.
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role == 'WORKPLACE_SUPERVISOR'
        )
    
# COMBINED ROLE PERMISSIONS

class IsAdminOrAcademicSupervisor(BasePermission):
    """
    Allows ADMIN or ACADEMIC_SUPERVISORS.
    Used for: viewing all placements in a department,
    managing evaluation criteria, submitting final evaluations.
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role in ['ADMIN', 'ACADEMIC_SUPERVISOR']
        )


class IsAdminOrWorkplaceSupervisor(BasePermission):
    """
    Allows ADMIN or WORKPLACE_SUPERVISORS.
    Used for: reviewing submitted weekly logs,
    submitting supervisor reviews.
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role in ['ADMIN', 'WORKPLACE_SUPERVISOR']
        )


class IsAnySupervisor(BasePermission):
    """
    Allows ACADEMIC_SUPERVISORS or WORKPLACE_SUPERVISORS.
    Used for: reading student profiles, viewing
    placement details of assigned students.
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role in ['ACADEMIC_SUPERVISOR', 'WORKPLACE_SUPERVISOR']
        )


class IsAdminOrAnySupervisor(BasePermission):
    """
    Allows ADMIN, ACADEMIC_SUPERVISORS, or WORKPLACE_SUPERVISORS.
    Used for: reading weekly logs, reading placement info.
    Blocks students from accessing other students' data.
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role in ['ADMIN', 'ACADEMIC_SUPERVISOR', 'WORKPLACE_SUPERVISOR']
        )

# OBJECT-LEVEL PERMISSIONS

class IsOwnProfileOrAdmin(BasePermission):
    """
    Controls who can view/edit a user profile.
    - ADMIN      : can view and edit any profile
    - Any user   : can only view and edit their own profile
    """
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'ADMIN':
            return True
        return obj == request.user


class IsOwnPlacementOrAdmin(BasePermission):
    """
    Controls who can view/edit an internship placement.
    - ADMIN                 : full access to all placements
    - STUDENT               : can only see their own placement
    - ACADEMIC_SUPERVISOR   : can see placements they are supervising
    - WORKPLACE_SUPERVISOR  : can see placements they are supervising
    """
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'ADMIN':
            return True
        if request.user.role == 'STUDENT':
            return obj.student == request.user
        if request.user.role == 'ACADEMIC_SUPERVISOR':
            return obj.academic_supervisor == request.user
        if request.user.role == 'WORKPLACE_SUPERVISOR':
            return obj.workplace_supervisor == request.user
        return False


class IsOwnLogOrSupervisorOrAdmin(BasePermission):
    """
    Controls who can view/edit a weekly log.
    - ADMIN                 : full access to all logs
    - STUDENT               : can only view/edit their own logs
    - WORKPLACE_SUPERVISOR  : can view and review logs of assigned interns
    - ACADEMIC_SUPERVISOR   : can view and approve logs of assigned interns
    """
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'ADMIN':
            return True
        if request.user.role == 'STUDENT':
            return obj.placement.student == request.user
        if request.user.role == 'WORKPLACE_SUPERVISOR':
            return obj.placement.workplace_supervisor == request.user
        if request.user.role == 'ACADEMIC_SUPERVISOR':
            return obj.placement.academic_supervisor == request.user
        return False


class CanEditLog(BasePermission):
    """
    Controls whether a weekly log can still be edited.
    A log can only be edited when it is in DRAFT or REVISE state.
    Approved or submitted logs are locked.
    """
    def has_object_permission(self, request, view, obj):
        # Read-only requests are always allowed
        if request.method in SAFE_METHODS:
            return True
        # Only allow edits on logs that are not yet submitted
        return obj.status in ['DRAFT', 'REVISE']


class IsOwnReviewOrAdmin(BasePermission):
    """
    Controls who can view/edit a supervisor review.
    - ADMIN                : full access
    - WORKPLACE_SUPERVISOR : can only view/edit reviews they submitted
    - ACADEMIC_SUPERVISOR  : can read reviews of their assigned students
    - STUDENT              : can only read their own review
    """
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'ADMIN':
            return True

        # Write access — only the reviewer who created it
        if request.method not in SAFE_METHODS:
            return (
                request.user.role == 'WORKPLACE_SUPERVISOR' and
                obj.reviewer == request.user
            )

        # Read access
        if request.user.role == 'WORKPLACE_SUPERVISOR':
            return obj.reviewer == request.user
        if request.user.role == 'ACADEMIC_SUPERVISOR':
            return obj.log.placement.academic_supervisor == request.user
        if request.user.role == 'STUDENT':
            return obj.log.placement.student == request.user
        return False


class IsOwnEvaluationOrAdmin(BasePermission):
    """
    Controls who can view/edit a final evaluation.
    - ADMIN               : full access
    - ACADEMIC_SUPERVISOR : can view and edit evaluations they are conducting
    - STUDENT             : can only read their own evaluation after it is submitted
    - WORKPLACE_SUPERVISOR : no access (evaluations are academic only)
    """
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'ADMIN':
            return True

        if request.user.role == 'ACADEMIC_SUPERVISOR':
            return obj.evaluator == request.user

        if request.user.role == 'STUDENT':
            return (
                obj.placement.student == request.user and
                obj.is_submitted
            )
        return False


class IsOwnEvaluationCriteriaOrAdmin(BasePermission):
    """
    Controls who can view/edit evaluation criteria.
    - ADMIN               : full access (create, edit, delete criteria)
    - ACADEMIC_SUPERVISOR : read-only (they apply criteria, not define them)
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.role == 'ADMIN':
            return True
        if request.user.role == 'ACADEMIC_SUPERVISOR':
            return request.method in SAFE_METHODS
        return False


class CanViewAuditLog(BasePermission):
    """
    Audit logs are read-only and visible to ADMIN only.
    No one can create, edit, or delete audit logs via the API.
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role == 'ADMIN' and
            request.method in SAFE_METHODS
        )


class MustChangePassword(BasePermission):
    """
    Supervisor accounts created by admin are forced
    to change their temporary password before proceeding.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.must_change_password:
            return view.__class__.__name__ == 'ChangePasswordView'
        return True