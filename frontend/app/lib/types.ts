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