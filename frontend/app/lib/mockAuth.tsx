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
    email: 'angella@gmail.com',
    password: 'angella111',
    first_name: 'Angella',
    last_name: 'Student',
    role: 'STUDENT'
  },
  {
    id: 2,
    email: 'supervisor@mak.ac.ug',
    password: 'supervisor123',
    first_name: 'Mathias',
    last_name: 'Supervisor',
    role: 'ACADEMIC_SUPERVISOR'
  },
  {
    id: 3,
    email: 'workplace@companyname.com',
    password: 'workplace123',
    first_name: 'Sliver',
    last_name: 'Mentor',
    role: 'WORKPLACE_SUPERVISOR'
  },
  {
    id: 4,
    email: 'admin@group3.com',
    password: 'admin123',
    first_name: 'Admin',
    last_name: 'User',
    role: 'ADMIN'
  }
];

export const mockLogin = async (email: string, password: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
  
  const user = mockUsers.find(u => u.email === email && u.password === password);
  
  if (!user) {
    throw new Error('Invalid email or password');
  }
    const { password: _, ...userWithoutPassword } = user;
    // Store in localStorage
  localStorage.setItem('user', JSON.stringify(userWithoutPassword));
  localStorage.setItem('isAuthenticated', 'true');
  
  return userWithoutPassword;
};

export const mockLogout = async () => {
  localStorage.removeItem('user');
  localStorage.removeItem('isAuthenticated');
};

export const getMockUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    return JSON.parse(userStr);
  }
  return null;
};
