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
// Mock Workplaces
export const mockWorkplaces: Workplace[] = [
  {
    id: 1,
    name: 'Harz Tech Solutions Ltd',
    industry: 'Software Development',
    address: 'Kampala, Uganda',
    contact_person: 'Mponye Mart',
    contact_email: 'mathias@harztechsolutions.ug',
    contact_phone: '+256 747562706',
    is_active: true,
    active_placements_count: 5,
  },
  {
    id: 2,
    name: 'National Innovation Hub',
    industry: 'IT Consulting',
    address: 'Kampala, Uganda',
    contact_person: 'Silver Mk',
    contact_email: 'silver@innovation.ug',
    contact_phone: '+256 776745117',
    is_active: true,
    active_placements_count: 3,
  },
  {
    id: 3,
    name: 'Mind Hub Africa',
    industry: 'Data Analytics',
    address: 'Kampala, Uganda',
    contact_person: 'Hyalo Marvin',
    contact_email: 'marvin@mindhub.ug',
    contact_phone: '+256 702959328',
    is_active: true,
    active_placements_count: 4,
  },
];
