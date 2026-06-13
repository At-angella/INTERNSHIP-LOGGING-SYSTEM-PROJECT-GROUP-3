'use client';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Route to role-specific dashboard
      switch (user.role) {
        case 'STUDENT':
          router.push('/dashboard/student');
          break;
        case 'ACADEMIC_SUPERVISOR':
          router.push('/dashboard/academic');
          break;
        case 'WORKPLACE_SUPERVISOR':
          router.push('/dashboard/workplace');
          break;
        case 'ADMIN':
          router.push('/dashboard/admin');
          break;
        default:
          router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <p>Redirecting to your dashboard...</p>
    </div>
  );
}
