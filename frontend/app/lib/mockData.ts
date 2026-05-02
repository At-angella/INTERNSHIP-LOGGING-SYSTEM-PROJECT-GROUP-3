import { mockUsers } from './mockAuth';
import { User, InternshipPlacement, WeeklyLog, AcademicDepartment, Workplace, Evaluation } from './types';

export { mockUsers };

// Mock Departments
export const mockDepartments: AcademicDepartment[] = [
  {
    id: 1,
    name: 'Bachelor of Science in Computer Science',
    faculty: 'College of Computing and Information Sciences',
    description: 'Department of Computer Science',
    head: null,
    placement_count: 20,
  },
  {
    id: 2,
    name: 'Bachelor of Information Systems and Technology',
    faculty: 'College of Computing and Information Sciences',
    description: 'Department of Information Systems',
    head: null,
    placement_count: 20,
  },
  {
    id: 3,
    name: 'Bachelor of Science in Software Engineering',
    faculty: 'College of Computing and Information Sciences',
    description: 'Department of Software Engineering',
    head: null,
    placement_count: 20,
  },
  {
    id: 4,
    name: 'Bachelor of Library and Information Science',
    faculty: 'College of Computing and Information Sciences',
    description: 'Department of Library and Information Science',
    head: null,
    placement_count: 20,
  },
  {
    id: 5,
    name: 'Bachelor of Science in Data communication Networks',
    faculty: 'College of Computing and Information Sciences',
    description: 'Department of Data Science',
    head: null,
    placement_count: 20,
  },
];