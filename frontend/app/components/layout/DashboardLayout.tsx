'use client';
import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './DashboardLayout.module.css';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!loading && isAuthenticated && user?.must_change_password) {
      router.push('/change-password');
    }
  }, [loading, isAuthenticated, user, router]);

  if (!mounted || loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium animate-pulse">Initializing Dashboard...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={styles.dashboardContainer}>
      <Sidebar />
      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
