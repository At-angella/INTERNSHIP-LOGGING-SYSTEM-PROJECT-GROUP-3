'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button, Input, Card } from '@/components/ui';
import { 
  User, Mail, Hash, BookOpen, 
  Phone, Building, ArrowRight, Lock
} from 'lucide-react';

const Register = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT',
    phoneNumber: '',
    studentId: '',
    registrationNumber: '',
    college: '',
    program: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!emailRegex.test(formData.email)) newErrors.email = 'Enter a valid email';

    if (!formData.password.trim()) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    if (!formData.confirmPassword.trim()) newErrors.confirmPassword = 'Confirm password is required';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    if (!formData.role) newErrors.role = 'Role is required';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Required';
    else if (formData.phoneNumber.length > 10) newErrors.phoneNumber = 'Phone number must be 10 digits or less';

    if (!formData.studentId.trim()) newErrors.studentId = 'Student ID is required';
    if (!formData.registrationNumber.trim()) newErrors.registrationNumber = 'Registration number is required';
    if (!formData.college.trim()) newErrors.college = 'College is required';
    if (!formData.program.trim()) newErrors.program = 'Program is required';

    return newErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSuccessMessage('Registration successful! Redirecting to login...');
      setTimeout(() => router.push('/login'), 2000);
    } catch (error) {
      setErrors({ submit: 'Registration failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 flex items-center justify-center bg-transparent">
      <div className="w-full max-w-3xl animate-in fade-in zoom-in-95 duration-700">
        <Card className="p-8 sm:p-12" variant="panel">
          <div className="flex flex-col items-center mb-10 text-center">
            <Image
              src="/institution_logo-ADF-1737480805029.jpg"
              alt="Institution Logo"
              width={64}
              height={64}
              className="rounded-2xl shadow-lg mb-6"
            />
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">Student Registration</h1>
            <p className="text-slate-500 dark:text-slate-400">Join the internship management platform</p>
          </div>

          {successMessage && (
            <div className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm font-medium animate-in fade-in slide-in-from-top-4">
              {successMessage}
            </div>
          )}

          {errors.submit && (
            <div className="mb-8 p-4 bg-secondary/10 border border-secondary/20 rounded-xl text-secondary text-sm font-medium animate-in shake">
              {errors.submit}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <section className="space-y-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 pb-2 mb-6">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="firstname"
                  error={errors.firstName}
                  icon={<User className="w-5 h-5" />}
                />
                <Input
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="lastname"
                  error={errors.lastName}
                  icon={<User className="w-5 h-5" />}
                />
              </div>

              <Input
                label="Email Address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="firstname.lastname@students.mak.ac.ug"
                error={errors.email}
                icon={<Mail className="w-5 h-5" />}
              />

              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter a strong password"
                error={errors.password}
                icon={<Lock className="w-5 h-5" />}
              />

              <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                error={errors.confirmPassword}
                icon={<Lock className="w-5 h-5" />}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm py-3 px-4 outline-none focus:ring-2 focus:ring-primary transition-all"
                  >
                    <option value="STUDENT">Student</option>
                  </select>
                  {errors.role && <p className="text-xs text-secondary mt-1">{errors.role}</p>}
                </div>
                <Input
                  label="Phone Number"
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="e.g., 0771234567"
                  error={errors.phoneNumber}
                  icon={<Phone className="w-5 h-5" />}
                />
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 pb-2 mb-6">Academic Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Student ID"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  placeholder="e.g., 260012345"
                  error={errors.studentId}
                  icon={<Hash className="w-5 h-5" />}
                />
                <Input
                  label="Registration Number"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  placeholder="e.g., 25/U/12345/EVE"
                  error={errors.registrationNumber}
                  icon={<Hash className="w-5 h-5" />}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="College"
                  name="college"
                  value={formData.college}
                  onChange={handleChange}
                  placeholder="e.g., CoCIS"
                  error={errors.college}
                  icon={<Building className="w-5 h-5" />}
                />
                <Input
                  label="Program"
                  name="program"
                  value={formData.program}
                  onChange={handleChange}
                  placeholder="e.g., BSc Computer Science"
                  error={errors.program}
                  icon={<BookOpen className="w-5 h-5" />}
                />
              </div>
            </section>

            <div className="pt-6">
              <Button 
                type="submit"
                className="w-full py-4 text-lg"
                isLoading={isSubmitting}
              >
                Create Account
                {!isSubmitting && <ArrowRight className="ml-2 w-5 h-5" />}
              </Button>

              <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-6">
                Already have an account?{' '}
                <Link 
                  href="/login" 
                  className="font-bold text-primary hover:text-primary-hover transition-colors"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Register;
