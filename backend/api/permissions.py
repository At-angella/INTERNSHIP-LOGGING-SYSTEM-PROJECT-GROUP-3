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