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