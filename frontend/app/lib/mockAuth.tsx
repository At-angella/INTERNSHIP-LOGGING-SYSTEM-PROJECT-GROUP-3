export interface MockUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'STUDENT' | 'ACADEMIC_SUPERVISOR' | 'WORKPLACE_SUPERVISOR' | 'ADMIN';
  password: string; // Only for testing
}