import { mockUsers } from './mockAuth';
import { User, InternshipPlacement, WeeklyLog, AcademicDepartment, Workplace, Evaluation } from './types';

export { mockUsers };

// Mock Departments
export const mockDepartments: AcademicDepartment[] = [
  {
    id: 1,
    name: 'Computer Science',
    faculty: 'Computing and IT',
    description: 'Department of Computer Science',
    head: null,
    placement_count: 12,
  },
  {
    id: 2,
    name: 'Information Systems',
    faculty: 'Computing and IT',
    description: 'Department of Information Systems',
    head: null,
    placement_count: 8,
  },
  {
    id: 3,
    name: 'Software Engineering',
    faculty: 'Computing and IT',
    description: 'Department of Software Engineering',
    head: null,
    placement_count: 10,
  },
  {
    id: 4,
    name: 'Business Computing',
    faculty: 'Computing and IT',
    description: 'Department of Business Computing',
    head: null,
    placement_count: 5,
  },
  {
    id: 5,
    name: 'Data Science',
    faculty: 'Computing and IT',
    description: 'Department of Data Science',
    head: null,
    placement_count: 3,
  },
];

// Mock Workplaces
export const mockWorkplaces: Workplace[] = [
  {
    id: 1,
    name: 'Tech Solutions Ltd',
    industry: 'Software Development',
    address: 'Kampala, Uganda',
    contact_person: 'Mathias Mponye',
    contact_email: 'mathias@techsolutions.ug',
    contact_phone: '+256 700 100006',
    is_active: true,
    active_placements_count: 5,
  },
  {
    id: 2,
    name: 'National Innovation Hub',
    industry: 'IT Consulting',
    address: 'Kampala, Uganda',
    contact_person: 'Silver Mukundane',
    contact_email: 'silver@nationalinnovation.ug',
    contact_phone: '+256 700 20067',
    is_active: true,
    active_placements_count: 3,
  },
  {
    id: 3,
    name: 'Mind Hub Africa',
    industry: 'Data Analytics',
    address: 'Kampala, Uganda',
    contact_person: 'Hyalo Marvin',
    contact_email: 'marvin@mindhuba.ug',
    contact_phone: '+256 700 00078',
    is_active: true,
    active_placements_count: 4,
  },
];

// Mock Placements
export const mockPlacements: InternshipPlacement[] = [
  {
    id: 1,
    student: {
      id: 1,
      email: 'angella@gmail.com',
      first_name: 'Angella',
      last_name: 'Student',
      role: 'STUDENT',
      role_display: 'Student',
      is_active: true,
      student_id: 'CSC001',
      registration_number: 'REG001',
      college: 'College of Computing',
      program: 'BSc Computer Science',
    } as any,
    workplace: mockWorkplaces[0],
    academic_supervisor: {
      id: 2,
      email: 'supervisor@mak.ac.ug',
      first_name: 'Mathias',
      last_name: 'Supervisor',
      role: 'ACADEMIC_SUPERVISOR',
      role_display: 'Academic Supervisor',
      is_active: true,
      staff_id: 'STAFF001',
      faculty: 'Computing and IT',
      department: 'Computer Science',
      specialization: 'Software Engineering',
      max_students: 10,
    } as any,
    workplace_supervisor: {
      id: 3,
      email: 'workplace@company.com',
      first_name: 'Hyalo Richard',
      last_name: 'Mentor',
      role: 'WORKPLACE_SUPERVISOR',
      role_display: 'Workplace Supervisor',
      is_active: true,
      job_title: 'Senior Developer',
      workplace_department: 'Engineering',
      years_of_experience: 8,
    } as any,
    department: mockDepartments[0],
    start_date: '2025-01-01',
    end_date: '2025-06-30',
    status: 'ACTIVE',
    status_display: 'Active',
    position_title: 'Junior Software Developer',
    description: 'Developing web applications using React and Node.js',
    log_progress: {
      total_logs: 12,
      approved_logs: 8,
      pending_logs: 2,
    },
  },
  {
    id: 2,
    student: {
      id: 5,
      email: 'Mark@example.com',
      first_name: 'Angella',
      last_name: 'Atdevine',
      role: 'STUDENT',
      role_display: 'Student',
      is_active: true,
      student_id: 'CSC002',
      registration_number: 'REG002',
      college: 'College of Computing',
      program: 'BSc Information Systems',
    } as any,
    workplace: mockWorkplaces[1],
    academic_supervisor: {
      id: 2,
      email: 'supervisor@mak.ac.ug',
      first_name: 'Mathias',
      last_name: 'Supervisor',
      role: 'ACADEMIC_SUPERVISOR',
      role_display: 'Academic Supervisor',
      is_active: true,
      staff_id: 'STAFF002',
      faculty: 'Computing and IT',
      department: 'Computer Science',
      specialization: 'Software Engineering',
      max_students: 10,
    } as any,
    workplace_supervisor: {
      id: 3,
      email: 'workplace@company.com',
      first_name: 'Hyalo Richard',
      last_name: 'Mentor',
      role: 'WORKPLACE_SUPERVISOR',
      role_display: 'Workplace Supervisor',
      is_active: true,
      job_title: 'Senior Developer',
      workplace_department: 'Engineering',
      years_of_experience: 8,
    } as any,
    department: mockDepartments[1],
    start_date: '2025-01-15',
    end_date: '2025-07-15',
    status: 'ACTIVE',
    status_display: 'Active',
    position_title: 'Systems Analyst',
    description: 'Analyzing and improving business systems',
    log_progress: {
      total_logs: 12,
      approved_logs: 10,
      pending_logs: 0,
    },
  },
];

// Mock Weekly Logs
export const mockWeeklyLogs: WeeklyLog[] = [
  {
    id: 1,
    placement: mockPlacements[0],
    week_number: 8,
    week_start_date: '2025-03-31',
    week_end_date: '2025-04-06',
    status: 'APPROVED',
    status_display: 'Approved',
    activities_performed: 'Completed the dashboard UI components and integrated with API',
    skills_acquired: 'React, TypeScript, API integration',
    challenges_faced: 'Complex state management',
    lessons_learned: 'Importance of proper architecture',
    hours_worked: 40,
    supervisor_review: null,
    submitted_at: '2025-04-06',
    reviewed_at: '2025-04-08',
    approved_at: '2025-04-09',
  },
  {
    id: 2,
    placement: mockPlacements[0],
    week_number: 7,
    week_start_date: '2025-03-24',
    week_end_date: '2025-03-30',
    status: 'APPROVED',
    status_display: 'Approved',
    activities_performed: 'Fixed bugs in the user authentication system',
    skills_acquired: 'Debugging, JWT implementation',
    challenges_faced: 'Token expiration issues',
    lessons_learned: 'Proper token management',
    hours_worked: 38,
    supervisor_review: null,
    submitted_at: '2025-03-31',
    reviewed_at: '2025-04-02',
    approved_at: '2025-04-03',
  },
  {
    id: 3,
    placement: mockPlacements[0],
    week_number: 6,
    week_start_date: '2025-03-17',
    week_end_date: '2025-03-23',
    status: 'APPROVED',
    status_display: 'Approved',
    activities_performed: 'Created database schema and API endpoints',
    skills_acquired: 'Database design, REST API design',
    challenges_faced: 'Schema normalization',
    lessons_learned: 'Importance of good database design',
    hours_worked: 42,
    supervisor_review: null,
    submitted_at: '2025-03-24',
    reviewed_at: '2025-03-26',
    approved_at: '2025-03-27',
  },
];

// Mock Evaluations
export const mockEvaluations: Evaluation[] = [
  {
    id: 1,
    placement: mockPlacements[0],
    evaluator: mockPlacements[0].academic_supervisor,
    technical_score: 85,
    soft_skills_score: 90,
    attendance_score: 95,
    conduct_score: 88,
    total_weighted_score: 89.5,
    final_grade: 'A',
    summary_comments: 'Excellent performance. Strong technical skills and great communication.',
    recommendation: 'Highly recommended for full-time employment',
    is_submitted: true,
  },
  {
    id: 2,
    placement: mockPlacements[1],
    evaluator: mockPlacements[1].academic_supervisor,
    technical_score: 78,
    soft_skills_score: 82,
    attendance_score: 90,
    conduct_score: 85,
    total_weighted_score: 83.75,
    final_grade: 'B+',
    summary_comments: 'Good technical knowledge and showed good initiative.',
    recommendation: 'Recommended for employment',
    is_submitted: true,
  },
];

// Simulate API delay
const delay = () => new Promise(resolve => setTimeout(resolve, 300));

export const mockApiData = {
  async getUsers() {
    await delay();
    return mockUsers.map(u => ({
      id: u.id,
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name,
      role: u.role,
      role_display: u.role.replace(/_/g, ' '),
      is_active: true,
    }));
  },

  async getPlacements() {
    await delay();
    return {
      count: mockPlacements.length,
      results: mockPlacements,
    };
  },

  async getPlacement(id: number) {
    await delay();
    return mockPlacements.find(p => p.id === id) || null;
  },

  async getWeeklyLogs() {
    await delay();
    return {
      count: mockWeeklyLogs.length,
      results: mockWeeklyLogs,
    };
  },

  async getWeeklyLog(id: number) {
    await delay();
    return mockWeeklyLogs.find(l => l.id === id) || null;
  },

  async getDepartments() {
    await delay();
    return mockDepartments;
  },

  async getWorkplaces() {
    await delay();
    return mockWorkplaces;
  },

  async getEvaluations() {
    await delay();
    return {
      count: mockEvaluations.length,
      results: mockEvaluations,
    };
  },

  async createPlacement(data: any) {
    await delay();
    return { id: Date.now(), ...data };
  },

  async createWeeklyLog(data: any) {
    await delay();
    return { id: Date.now(), ...data, status: 'DRAFT' };
  },

  async registerSupervisor(data: any) {
    await delay();
    return { id: Date.now(), ...data, role_display: data.role.replace(/_/g, ' ') };
  },

  async getAuditLogs() {
    await delay();
    return { count: 0, results: [] };
  },
};
