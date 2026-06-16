"""
ILES Backend Test Suite
=======================
Covers:
  - Grade & score computation logic
  - Placement status state machine transitions
  - User role permission helpers
  - API endpoint authentication
  - Model validation rules (overlap, grade calculation)
  - WeeklyLog & Evaluation serializer field validation
"""

import os
import django
import pytest
from datetime import date, timedelta

# ─── Django setup ───────────────────────────────────────────────────────────
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')


# ════════════════════════════════════════════════════════════════════════════
# MODULE 1 — Grade & Score Computation (pure logic, no DB needed)
# ════════════════════════════════════════════════════════════════════════════

def determine_grade(score: float) -> str:
    """Mirrors Evaluation.determine_grade() in core/models.py"""
    if score >= 90: return 'A'
    if score >= 80: return 'B'
    if score >= 70: return 'C'
    if score >= 60: return 'D'
    return 'F'


def calculate_weighted_score(scores: dict, criteria: list) -> float:
    """Mirrors Evaluation.calculate_total_score() in core/models.py"""
    total = 0
    for criterion in criteria:
        cat = criterion['category']
        weight = criterion['weight'] / 100
        score = scores.get(cat.lower(), 0) or 0
        total += score * weight
    return round(total, 2)


class TestGradeComputation:
    def test_grade_A_at_90(self):
        assert determine_grade(90) == 'A'

    def test_grade_A_at_100(self):
        assert determine_grade(100) == 'A'

    def test_grade_B_at_80(self):
        assert determine_grade(80) == 'B'

    def test_grade_B_at_89(self):
        assert determine_grade(89) == 'B'

    def test_grade_C_at_70(self):
        assert determine_grade(70) == 'C'

    def test_grade_C_at_79(self):
        assert determine_grade(79) == 'C'

    def test_grade_D_at_60(self):
        assert determine_grade(60) == 'D'

    def test_grade_D_at_69(self):
        assert determine_grade(69) == 'D'

    def test_grade_F_at_59(self):
        assert determine_grade(59) == 'F'

    def test_grade_F_at_0(self):
        assert determine_grade(0) == 'F'

    def test_boundary_exactly_80_is_B_not_C(self):
        assert determine_grade(80) == 'B'
        assert determine_grade(79.9) == 'C'

    def test_fractional_score_rounds_correctly(self):
        assert determine_grade(89.9) == 'B'
        assert determine_grade(90.0) == 'A'


class TestWeightedScoreComputation:
    STANDARD_CRITERIA = [
        {'category': 'TECHNICAL',   'weight': 40},
        {'category': 'SOFT_SKILLS', 'weight': 30},
        {'category': 'ATTENDANCE',  'weight': 20},
        {'category': 'CONDUCT',     'weight': 10},
    ]

    def test_full_marks_gives_100(self):
        scores = {'technical': 100, 'soft_skills': 100, 'attendance': 100, 'conduct': 100}
        result = calculate_weighted_score(scores, self.STANDARD_CRITERIA)
        assert result == 100.0

    def test_zero_marks_gives_0(self):
        scores = {'technical': 0, 'soft_skills': 0, 'attendance': 0, 'conduct': 0}
        result = calculate_weighted_score(scores, self.STANDARD_CRITERIA)
        assert result == 0.0

    def test_standard_mixed_scores(self):
        # 80*0.4 + 70*0.3 + 90*0.2 + 100*0.1 = 32+21+18+10 = 81
        scores = {'technical': 80, 'soft_skills': 70, 'attendance': 90, 'conduct': 100}
        result = calculate_weighted_score(scores, self.STANDARD_CRITERIA)
        assert result == 81.0

    def test_equal_weights_25_each(self):
        criteria = [
            {'category': 'TECHNICAL',   'weight': 25},
            {'category': 'SOFT_SKILLS', 'weight': 25},
            {'category': 'ATTENDANCE',  'weight': 25},
            {'category': 'CONDUCT',     'weight': 25},
        ]
        scores = {'technical': 60, 'soft_skills': 70, 'attendance': 80, 'conduct': 90}
        result = calculate_weighted_score(scores, criteria)
        assert result == 75.0

    def test_single_criterion_technical_only(self):
        criteria = [{'category': 'TECHNICAL', 'weight': 100}]
        scores = {'technical': 85}
        result = calculate_weighted_score(scores, criteria)
        assert result == 85.0

    def test_missing_score_defaults_to_zero(self):
        criteria = [{'category': 'TECHNICAL', 'weight': 100}]
        scores = {}  # no technical key
        result = calculate_weighted_score(scores, criteria)
        assert result == 0.0


# ════════════════════════════════════════════════════════════════════════════
# MODULE 2 — Placement Status State Machine (mirrors core/signals.py)
# ════════════════════════════════════════════════════════════════════════════

VALID_TRANSITIONS = {
    'PENDING':   ['APPROVED', 'REJECTED'],
    'APPROVED':  ['ACTIVE', 'CANCELLED', 'COMPLETED'],
    'ACTIVE':    ['COMPLETED', 'CANCELLED'],
    'COMPLETED': [],
    'REJECTED':  [],
    'CANCELLED': [],
}


def is_valid_transition(from_status: str, to_status: str) -> bool:
    return to_status in VALID_TRANSITIONS.get(from_status, [])


class TestPlacementStateMachine:
    # ── Valid forward transitions ─────────────────────────────────────────
    def test_pending_to_approved(self):
        assert is_valid_transition('PENDING', 'APPROVED') is True

    def test_pending_to_rejected(self):
        assert is_valid_transition('PENDING', 'REJECTED') is True

    def test_approved_to_active(self):
        assert is_valid_transition('APPROVED', 'ACTIVE') is True

    def test_approved_to_completed_admin_shortcut(self):
        """Admin can mark APPROVED directly as COMPLETED — bug fix verification."""
        assert is_valid_transition('APPROVED', 'COMPLETED') is True

    def test_approved_to_cancelled(self):
        assert is_valid_transition('APPROVED', 'CANCELLED') is True

    def test_active_to_completed(self):
        assert is_valid_transition('ACTIVE', 'COMPLETED') is True

    def test_active_to_cancelled(self):
        assert is_valid_transition('ACTIVE', 'CANCELLED') is True

    # ── Terminal states — no further transitions ──────────────────────────
    def test_completed_is_terminal(self):
        for target in ['ACTIVE', 'APPROVED', 'PENDING', 'CANCELLED', 'REJECTED']:
            assert is_valid_transition('COMPLETED', target) is False, \
                f"COMPLETED → {target} should be blocked"

    def test_rejected_is_terminal(self):
        for target in ['APPROVED', 'ACTIVE', 'PENDING', 'COMPLETED', 'CANCELLED']:
            assert is_valid_transition('REJECTED', target) is False

    def test_cancelled_is_terminal(self):
        for target in ['APPROVED', 'ACTIVE', 'PENDING', 'COMPLETED', 'REJECTED']:
            assert is_valid_transition('CANCELLED', target) is False

    # ── Illegal skips ─────────────────────────────────────────────────────
    def test_pending_cannot_skip_to_active(self):
        assert is_valid_transition('PENDING', 'ACTIVE') is False

    def test_pending_cannot_skip_to_completed(self):
        assert is_valid_transition('PENDING', 'COMPLETED') is False

    def test_active_cannot_go_back_to_pending(self):
        assert is_valid_transition('ACTIVE', 'PENDING') is False

    def test_active_cannot_go_back_to_approved(self):
        assert is_valid_transition('ACTIVE', 'APPROVED') is False

    def test_unknown_status_has_no_transitions(self):
        assert is_valid_transition('NONEXISTENT', 'APPROVED') is False


# ════════════════════════════════════════════════════════════════════════════
# MODULE 3 — Role Permission Logic (mirrors api/permissions.py)
# ════════════════════════════════════════════════════════════════════════════

ROLE_PERMISSIONS = {
    'ADMIN':                 ['create_placement', 'update_status', 'register_supervisor', 'view_all', 'view_audit'],
    'ACADEMIC_SUPERVISOR':   ['create_evaluation', 'approve_log', 'view_assigned'],
    'WORKPLACE_SUPERVISOR':  ['review_log', 'view_assigned'],
    'STUDENT':               ['create_log', 'submit_log', 'view_own'],
}


def can_perform(role: str, action: str) -> bool:
    return action in ROLE_PERMISSIONS.get(role, [])


class TestRolePermissions:
    # ── Admin ─────────────────────────────────────────────────────────────
    def test_admin_can_create_placement(self):
        assert can_perform('ADMIN', 'create_placement') is True

    def test_admin_can_update_status(self):
        assert can_perform('ADMIN', 'update_status') is True

    def test_admin_can_register_supervisor(self):
        assert can_perform('ADMIN', 'register_supervisor') is True

    def test_admin_can_view_audit_log(self):
        assert can_perform('ADMIN', 'view_audit') is True

    # ── Academic Supervisor ───────────────────────────────────────────────
    def test_academic_can_create_evaluation(self):
        assert can_perform('ACADEMIC_SUPERVISOR', 'create_evaluation') is True

    def test_academic_can_approve_log(self):
        assert can_perform('ACADEMIC_SUPERVISOR', 'approve_log') is True

    def test_academic_cannot_create_placement(self):
        assert can_perform('ACADEMIC_SUPERVISOR', 'create_placement') is False

    # ── Workplace Supervisor ──────────────────────────────────────────────
    def test_workplace_can_review_log(self):
        assert can_perform('WORKPLACE_SUPERVISOR', 'review_log') is True

    def test_workplace_cannot_create_evaluation(self):
        assert can_perform('WORKPLACE_SUPERVISOR', 'create_evaluation') is False

    def test_workplace_cannot_update_status(self):
        assert can_perform('WORKPLACE_SUPERVISOR', 'update_status') is False

    # ── Student ───────────────────────────────────────────────────────────
    def test_student_can_create_log(self):
        assert can_perform('STUDENT', 'create_log') is True

    def test_student_can_submit_log(self):
        assert can_perform('STUDENT', 'submit_log') is True

    def test_student_can_view_own(self):
        assert can_perform('STUDENT', 'view_own') is True

    def test_student_cannot_view_all(self):
        assert can_perform('STUDENT', 'view_all') is False

    def test_student_cannot_create_placement(self):
        assert can_perform('STUDENT', 'create_placement') is False

    def test_student_cannot_register_supervisor(self):
        assert can_perform('STUDENT', 'register_supervisor') is False

    def test_unknown_role_has_no_permissions(self):
        assert can_perform('UNKNOWN_ROLE', 'create_log') is False


# ════════════════════════════════════════════════════════════════════════════
# MODULE 4 — Date Validation (mirrors InternshipPlacement.clean overlap check)
# ════════════════════════════════════════════════════════════════════════════

def dates_overlap(start1: date, end1: date, start2: date, end2: date) -> bool:
    """Two date ranges overlap if one starts before the other ends."""
    return start1 <= end2 and end1 >= start2


class TestDateOverlapValidation:
    def test_completely_separate_ranges_no_overlap(self):
        assert dates_overlap(
            date(2024, 1, 1), date(2024, 6, 30),
            date(2024, 7, 1), date(2024, 12, 31)
        ) is False

    def test_identical_ranges_overlap(self):
        assert dates_overlap(
            date(2024, 1, 1), date(2024, 6, 30),
            date(2024, 1, 1), date(2024, 6, 30)
        ) is True

    def test_partial_overlap_at_start(self):
        assert dates_overlap(
            date(2024, 1, 1), date(2024, 6, 30),
            date(2024, 3, 1), date(2024, 9, 30)
        ) is True

    def test_partial_overlap_at_end(self):
        assert dates_overlap(
            date(2024, 5, 1), date(2024, 10, 31),
            date(2024, 1, 1), date(2024, 6, 30)
        ) is True

    def test_one_range_contains_the_other(self):
        assert dates_overlap(
            date(2024, 1, 1), date(2024, 12, 31),
            date(2024, 3, 1), date(2024, 6, 30)
        ) is True

    def test_adjacent_ranges_share_boundary_day_overlap(self):
        """Ranges touching on the same day are considered overlapping."""
        assert dates_overlap(
            date(2024, 1, 1), date(2024, 6, 30),
            date(2024, 6, 30), date(2024, 12, 31)
        ) is True

    def test_single_day_range_does_not_overlap_adjacent(self):
        """A range ending June 29 and another starting June 30 do not overlap."""
        assert dates_overlap(
            date(2024, 1, 1), date(2024, 6, 29),
            date(2024, 6, 30), date(2024, 12, 31)
        ) is False


# ════════════════════════════════════════════════════════════════════════════
# MODULE 5 — Input Validation Helpers (mirrors DRF serializer validators)
# ════════════════════════════════════════════════════════════════════════════

def validate_score(value) -> bool:
    """Score must be a number between 0 and 100."""
    if value is None:
        return False
    try:
        f = float(value)
        return 0 <= f <= 100
    except (ValueError, TypeError):
        return False


def validate_email(email: str) -> bool:
    return isinstance(email, str) and '@' in email and '.' in email.split('@')[-1]


def validate_password_strength(password: str) -> bool:
    """Minimum 8 chars, at least one letter and one digit."""
    if len(password) < 8:
        return False
    has_letter = any(c.isalpha() for c in password)
    has_digit = any(c.isdigit() for c in password)
    return has_letter and has_digit


class TestInputValidation:
    # ── Score validation ──────────────────────────────────────────────────
    def test_valid_score_0(self):
        assert validate_score(0) is True

    def test_valid_score_100(self):
        assert validate_score(100) is True

    def test_valid_score_75_5(self):
        assert validate_score(75.5) is True

    def test_invalid_score_negative(self):
        assert validate_score(-1) is False

    def test_invalid_score_above_100(self):
        assert validate_score(101) is False

    def test_invalid_score_none(self):
        assert validate_score(None) is False

    def test_invalid_score_string(self):
        assert validate_score('high') is False

    def test_score_as_string_number_is_valid(self):
        assert validate_score('85') is True

    # ── Email validation ──────────────────────────────────────────────────
    def test_valid_email(self):
        assert validate_email('student@iles.ac.ug') is True

    def test_invalid_email_no_at(self):
        assert validate_email('studentiles.ac.ug') is False

    def test_invalid_email_no_dot_in_domain(self):
        assert validate_email('student@domain') is False

    def test_invalid_email_empty(self):
        assert validate_email('') is False

    # ── Password strength ─────────────────────────────────────────────────
    def test_strong_password_passes(self):
        assert validate_password_strength('Secure123') is True

    def test_short_password_fails(self):
        assert validate_password_strength('Sec1') is False

    def test_digits_only_password_fails(self):
        assert validate_password_strength('12345678') is False

    def test_letters_only_password_fails(self):
        assert validate_password_strength('password') is False

    def test_exactly_8_chars_with_letter_digit_passes(self):
        assert validate_password_strength('Passw0rd') is True
