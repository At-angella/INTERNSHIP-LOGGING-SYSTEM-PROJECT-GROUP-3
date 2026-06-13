'use client';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Users,
  CheckCircle,
  BarChart3,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Settings,
  Clock,
  Briefcase,
  BookOpen,
  User as UserIcon,
} from 'lucide-react';
import { useState } from 'react';
import styles from './Sidebar.module.css';

export function Sidebar() {
  const { user, logout, hasRole } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const getMenuItems = () => {
    const baseItems = [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ];

    if (hasRole('STUDENT')) {
      return [
        ...baseItems,
        { label: 'My Placement', href: '/dashboard/student/placement', icon: Briefcase },
        { label: 'Weekly Logs', href: '/dashboard/student/logs', icon: FileText },
        { label: 'Evaluations', href: '/dashboard/student/evaluations', icon: BarChart3 },
      ];
    }

    if (hasRole('ACADEMIC_SUPERVISOR')) {
      return [
        ...baseItems,
        { label: 'My Students', href: '/dashboard/academic/students', icon: Users },
        { label: 'Logs Review', href: '/dashboard/academic/logs', icon: FileText },
        { label: 'Evaluations', href: '/dashboard/academic/evaluations', icon: CheckCircle },
        { label: 'Reports', href: '/dashboard/academic/reports', icon: BarChart3 },
      ];
    }

    if (hasRole('WORKPLACE_SUPERVISOR')) {
      return [
        ...baseItems,
        { label: 'My Interns', href: '/dashboard/workplace/interns', icon: Users },
        { label: 'Review Logs', href: '/dashboard/workplace/reviews', icon: FileText },
        { label: 'Performance', href: '/dashboard/workplace/performance', icon: BarChart3 },
      ];
    }

    if (hasRole('ADMIN')) {
      return [
        ...baseItems,
        { label: 'Supervisors', href: '/dashboard/admin/supervisors', icon: Users },
        { label: 'Placements', href: '/dashboard/admin/placements', icon: Briefcase },
        { label: 'Students', href: '/dashboard/admin/students', icon: BookOpen },
        { label: 'Departments', href: '/dashboard/admin/departments', icon: BarChart3 },
        { label: 'Settings', href: '/dashboard/admin/settings', icon: Settings },
      ];
    }

    return baseItems;
  };

  const menuItems = getMenuItems();
  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.mobileToggle}
        aria-label="Toggle Menu"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <Link href="/dashboard" className={styles.logo}>
            <div className="w-10 h-10 bg-linear-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-primary/20">
              ILES
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-tight leading-none mb-1">Internship Hub</div>
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Management System</div>
            </div>
          </Link>
        </div>

        <div className={styles.userInfo}>
          <div className="w-11 h-11 bg-slate-800 rounded-xl flex items-center justify-center text-primary font-bold border border-slate-700 shadow-inner">
            {user.first_name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white truncate leading-none mb-1">
              {user.first_name} {user.last_name}
            </div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
              {user.role_display}
            </div>
          </div>
        </div>

        <nav className={styles.menu}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`${styles.menuItem} ${active ? styles.active : ''}`}
              >
                <Icon size={18} className={active ? 'text-primary' : 'text-slate-400'} />
                <span>{item.label}</span>
                {active && <div className={styles.activeIndicator} />}
              </Link>
            );
          })}
        </nav>

        <div className={styles.footer}>
          <button onClick={logout} className={styles.logoutBtn}>
            <LogOut size={18} />
            <span className="font-bold">Logout</span>
          </button>
        </div>
      </aside>

      {isOpen && (
        <div
          className={styles.overlay}
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
