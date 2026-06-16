// Tests for grade calculation, weighted scoring, and placement state machine

// ─── Grade Calculation (mirrors backend determine_grade logic) ─────────────
function determineGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

// ─── Frontend getGrade label (mirrors evaluations/new page logic) ──────────
function getGradeLabel(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B+';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C+';
  if (score >= 40) return 'C';
  return 'F';
}

// ─── Average score calculation ────────────────────────────────────────────
function calculateAverageScore(
  technical: number,
  softSkills: number,
  attendance: number,
  conduct: number
): number {
  return (technical + softSkills + attendance + conduct) / 4;
}

// ─── Weighted score (mirrors backend calculate_total_score logic) ──────────
interface Criteria {
  category: 'TECHNICAL' | 'SOFT_SKILLS' | 'ATTENDANCE' | 'CONDUCT';
  weight: number; // out of 100
}

function calculateWeightedScore(
  scores: { technical: number; soft_skills: number; attendance: number; conduct: number },
  criteria: Criteria[]
): number {
  let total = 0;
  for (const criterion of criteria) {
    const weight = criterion.weight / 100;
    let score = 0;
    if (criterion.category === 'TECHNICAL') score = scores.technical;
    if (criterion.category === 'SOFT_SKILLS') score = scores.soft_skills;
    if (criterion.category === 'ATTENDANCE') score = scores.attendance;
    if (criterion.category === 'CONDUCT') score = scores.conduct;
    total += score * weight;
  }
  return Math.round(total * 100) / 100;
}

// ─── Placement status machine (mirrors signals.py valid_transitions) ───────
const validTransitions: Record<string, string[]> = {
  PENDING: ['APPROVED', 'REJECTED'],
  APPROVED: ['ACTIVE', 'CANCELLED', 'COMPLETED'],
  ACTIVE: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
};

function isValidTransition(from: string, to: string): boolean {
  return validTransitions[from]?.includes(to) ?? false;
}

// ─── Defensive display helper ─────────────────────────────────────────────
function safeScore(value: number | null | undefined): string {
  return typeof value === 'number' ? value.toFixed(1) : '0.0';
}

// ════════════════════════════════════════════════════════════════
// TEST SUITES
// ════════════════════════════════════════════════════════════════

describe('Grade Calculation (Backend Mirror)', () => {
  test('returns A for score >= 90', () => {
    expect(determineGrade(90)).toBe('A');
    expect(determineGrade(100)).toBe('A');
    expect(determineGrade(95.5)).toBe('A');
  });

  test('returns B for scores 80-89', () => {
    expect(determineGrade(80)).toBe('B');
    expect(determineGrade(89)).toBe('B');
  });

  test('returns C for scores 70-79', () => {
    expect(determineGrade(70)).toBe('C');
    expect(determineGrade(79)).toBe('C');
  });

  test('returns D for scores 60-69', () => {
    expect(determineGrade(60)).toBe('D');
    expect(determineGrade(69)).toBe('D');
  });

  test('returns F for scores below 60', () => {
    expect(determineGrade(59)).toBe('F');
    expect(determineGrade(0)).toBe('F');
  });
});

describe('Frontend Grade Label', () => {
  test('returns A+ for score >= 90', () => {
    expect(getGradeLabel(90)).toBe('A+');
    expect(getGradeLabel(99)).toBe('A+');
  });

  test('returns A for score 80-89', () => {
    expect(getGradeLabel(80)).toBe('A');
    expect(getGradeLabel(89)).toBe('A');
  });

  test('returns B+ for score 70-79', () => {
    expect(getGradeLabel(70)).toBe('B+');
  });

  test('returns B for score 60-69', () => {
    expect(getGradeLabel(60)).toBe('B');
  });

  test('returns C+ for score 50-59', () => {
    expect(getGradeLabel(50)).toBe('C+');
  });

  test('returns C for score 40-49', () => {
    expect(getGradeLabel(40)).toBe('C');
  });

  test('returns F for score below 40', () => {
    expect(getGradeLabel(39)).toBe('F');
    expect(getGradeLabel(0)).toBe('F');
  });
});

describe('Average Score Calculation', () => {
  test('calculates simple average of four scores', () => {
    expect(calculateAverageScore(80, 80, 80, 80)).toBe(80);
  });

  test('calculates correct average with varied inputs', () => {
    expect(calculateAverageScore(90, 70, 80, 60)).toBe(75);
  });

  test('handles edge case with all zeros', () => {
    expect(calculateAverageScore(0, 0, 0, 0)).toBe(0);
  });

  test('handles edge case with all 100s', () => {
    expect(calculateAverageScore(100, 100, 100, 100)).toBe(100);
  });
});

describe('Weighted Score Computation (Backend Mirror)', () => {
  const standardCriteria: Criteria[] = [
    { category: 'TECHNICAL', weight: 40 },
    { category: 'SOFT_SKILLS', weight: 30 },
    { category: 'ATTENDANCE', weight: 20 },
    { category: 'CONDUCT', weight: 10 },
  ];

  test('calculates correctly with standard criteria weights', () => {
    const scores = { technical: 80, soft_skills: 70, attendance: 90, conduct: 100 };
    // 80*0.4 + 70*0.3 + 90*0.2 + 100*0.1 = 32 + 21 + 18 + 10 = 81
    expect(calculateWeightedScore(scores, standardCriteria)).toBe(81);
  });

  test('returns 0 when all scores are 0', () => {
    const scores = { technical: 0, soft_skills: 0, attendance: 0, conduct: 0 };
    expect(calculateWeightedScore(scores, standardCriteria)).toBe(0);
  });

  test('returns 100 when all scores are 100 and weights total 100', () => {
    const scores = { technical: 100, soft_skills: 100, attendance: 100, conduct: 100 };
    expect(calculateWeightedScore(scores, standardCriteria)).toBe(100);
  });

  test('handles criteria with equal weights', () => {
    const equalCriteria: Criteria[] = [
      { category: 'TECHNICAL', weight: 25 },
      { category: 'SOFT_SKILLS', weight: 25 },
      { category: 'ATTENDANCE', weight: 25 },
      { category: 'CONDUCT', weight: 25 },
    ];
    const scores = { technical: 60, soft_skills: 70, attendance: 80, conduct: 90 };
    expect(calculateWeightedScore(scores, equalCriteria)).toBe(75);
  });
});

describe('Placement Status Machine Transitions', () => {
  test('PENDING can transition to APPROVED', () => {
    expect(isValidTransition('PENDING', 'APPROVED')).toBe(true);
  });

  test('PENDING can transition to REJECTED', () => {
    expect(isValidTransition('PENDING', 'REJECTED')).toBe(true);
  });

  test('APPROVED can transition to ACTIVE', () => {
    expect(isValidTransition('APPROVED', 'ACTIVE')).toBe(true);
  });

  test('APPROVED can transition directly to COMPLETED (admin shortcut)', () => {
    expect(isValidTransition('APPROVED', 'COMPLETED')).toBe(true);
  });

  test('APPROVED can be CANCELLED', () => {
    expect(isValidTransition('APPROVED', 'CANCELLED')).toBe(true);
  });

  test('ACTIVE can be COMPLETED', () => {
    expect(isValidTransition('ACTIVE', 'COMPLETED')).toBe(true);
  });

  test('ACTIVE can be CANCELLED', () => {
    expect(isValidTransition('ACTIVE', 'CANCELLED')).toBe(true);
  });

  test('COMPLETED is a terminal state — no transitions allowed', () => {
    expect(isValidTransition('COMPLETED', 'ACTIVE')).toBe(false);
    expect(isValidTransition('COMPLETED', 'PENDING')).toBe(false);
    expect(isValidTransition('COMPLETED', 'CANCELLED')).toBe(false);
  });

  test('REJECTED is a terminal state — no transitions allowed', () => {
    expect(isValidTransition('REJECTED', 'APPROVED')).toBe(false);
    expect(isValidTransition('REJECTED', 'PENDING')).toBe(false);
  });

  test('CANCELLED is a terminal state — no transitions allowed', () => {
    expect(isValidTransition('CANCELLED', 'ACTIVE')).toBe(false);
  });

  test('PENDING cannot skip directly to COMPLETED', () => {
    expect(isValidTransition('PENDING', 'COMPLETED')).toBe(false);
  });

  test('PENDING cannot skip directly to ACTIVE', () => {
    expect(isValidTransition('PENDING', 'ACTIVE')).toBe(false);
  });

  test('ACTIVE cannot go back to PENDING', () => {
    expect(isValidTransition('ACTIVE', 'PENDING')).toBe(false);
  });
});

describe('Defensive Score Display Helper', () => {
  test('renders numeric score with one decimal place', () => {
    expect(safeScore(85.5)).toBe('85.5');
    expect(safeScore(90)).toBe('90.0');
  });

  test('renders 0.0 when value is null', () => {
    expect(safeScore(null)).toBe('0.0');
  });

  test('renders 0.0 when value is undefined', () => {
    expect(safeScore(undefined)).toBe('0.0');
  });

  test('renders 0.0 when value is 0', () => {
    expect(safeScore(0)).toBe('0.0');
  });
});
