from rest_framework.permissions import BasePermission

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
