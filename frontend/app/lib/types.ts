export type UserRole = 'STUDENT' | 'ACADEMIC_SUPERVISOR' | 'WORKPLACE_SUPERVISOR' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  role_display: string;
  phone_number?: string;
  is_active: boolean;
  date_joined?: string;
}

export interface Student extends User {
  student_id: string;
  registration_number: string;
  college: string;
  program: string;
}

export interface AcademicSupervisor extends User {
  staff_id: string;
  faculty: string;
  department: string;
  specialization: string;
  max_students: number;
}

export interface WorkplaceSupervisor extends User {
  job_title: string;
  workplace_department: string;
  years_of_experience: number;
}

export interface InternshipPlacement {
  id: number;
  student: Student;
  workplace: Workplace;
  academic_supervisor: AcademicSupervisor;
  workplace_supervisor: WorkplaceSupervisor;
  department: AcademicDepartment;
  start_date: string;
  end_date: string;
  status: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
  status_display: string;
  position_title: string;
  description: string;
  log_progress: {
    total_logs: number;
    approved_logs: number;
    pending_logs: number;
  };
}

export interface Workplace {
  id: number;
  name: string;
  industry: string;
  address: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  is_active: boolean;
  active_placements_count: number;
}

export interface AcademicDepartment {
  id: number;
  name: string;
  faculty: string;
  description: string;
  head: User | null;
  placement_count: number;
}

export interface WeeklyLog {
  id: number;
  placement: InternshipPlacement;
  week_number: number;
  week_start_date: string;
  week_end_date: string;
  status: 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'APPROVED' | 'REJECTED' | 'REVISE';
  status_display: string;
  activities_performed: string;
  skills_acquired: string;
  challenges_faced: string;
  lessons_learned: string;
  hours_worked: number;
  supervisor_review: SupervisorReview | null;
  submitted_at?: string;
  reviewed_at?: string;
  approved_at?: string;
}

export interface SupervisorReview {
  id: number;
  log: number;
  reviewer: User;
  performance_rating: number;
  attendance_rating: number;
  attitude_rating: number;
  comments: string;
  recommendations: string;
  approval_status: string;
}

export interface Evaluation {
  id: number;
  placement: InternshipPlacement;
  evaluator: AcademicSupervisor;
  technical_score: number;
  soft_skills_score: number;
  attendance_score: number;
  conduct_score: number;
  total_weighted_score: number;
  final_grade: string;
  summary_comments: string;
  recommendation: string;
  is_submitted: boolean;
}