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