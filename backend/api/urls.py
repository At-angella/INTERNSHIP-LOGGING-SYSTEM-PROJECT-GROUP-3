from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import (
    StudentRegisterView, SupervisorRegisterView,
    LoginView, LogoutView,
    ChangePasswordView, RefreshTokenView,
    UserViewSet, AcademicDepartmentViewSet, WorkplaceViewSet,
    InternshipPlacementViewSet, WeeklyLogViewSet, SupervisorReviewViewSet,
    EvaluationCriteriaViewSet, EvaluationViewSet, AuditLogViewSet
)

router = DefaultRouter()
router.register(r'users',               UserViewSet,              basename='user')
router.register(r'departments',         AcademicDepartmentViewSet, basename='department')
router.register(r'workplaces',          WorkplaceViewSet,         basename='workplace')
router.register(r'placements',          InternshipPlacementViewSet, basename='placement')
router.register(r'logs',                WeeklyLogViewSet,         basename='log')
router.register(r'reviews',             SupervisorReviewViewSet,  basename='review')
router.register(r'evaluation-criteria', EvaluationCriteriaViewSet, basename='evaluation-criteria')
router.register(r'evaluations',         EvaluationViewSet,        basename='evaluation')
router.register(r'audit-logs',          AuditLogViewSet,          basename='audit-log')

app_name = 'api'

urlpatterns = [
    # Authentication
    # no token required
    path('auth/register/student/',    StudentRegisterView.as_view(),    name='register-student'),
    path('auth/register/supervisor/', SupervisorRegisterView.as_view(), name='register-supervisor'),
    path('auth/login/',               LoginView.as_view(),              name='login'),
    path('auth/token/refresh/',       RefreshTokenView.as_view(),       name='token-refresh'),
    # Protected — token required
    path('auth/logout/',              LogoutView.as_view(),             name='logout'),
    path('auth/change-password/',     ChangePasswordView.as_view(),     name='change-password'),

    # API ViewSets
    path('', include(router.urls)),
]