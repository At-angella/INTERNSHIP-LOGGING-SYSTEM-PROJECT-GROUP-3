export interface MockUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'STUDENT' | 'ACADEMIC_SUPERVISOR' | 'WORKPLACE_SUPERVISOR' | 'ADMIN';
  password: string; // Only for testing
}

// Test users database
export const mockUsers: MockUser[] = [
  {
    id: 1,
    email: 'angella@student.mak.ac.ug',
    password: 'angella111',
    first_name: 'Angella',
    last_name: 'Atukwatse',
    role: 'STUDENT'
  },
  {
    id: 2,
    email: 'supervisor@mak.ac.ug',
    password: 'supervisor123',
    first_name: 'Mathias',
    last_name: 'Mponye',
    role: 'ACADEMIC_SUPERVISOR'
  },
  {
    id: 3,
    email: 'workplace@company.com',
    password: 'workplace123',
    first_name: 'Sliver',
    last_name: 'Mukundane',
    role: 'WORKPLACE_SUPERVISOR'
  },
  {
    id: 4,
    email: 'admin@system.com',
    password: 'admin123',
    first_name: 'System',
    last_name: 'Admin',
    role: 'ADMIN'
  }
];