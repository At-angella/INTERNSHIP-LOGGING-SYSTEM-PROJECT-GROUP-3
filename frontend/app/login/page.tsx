'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { mockUsers } from '@/lib/mockAuth';
import { Button, Input, Card } from '@/components/ui';
import { toast } from 'react-toastify';
import { Mail, Lock, ArrowRight, ShieldCheck, GraduationCap, Briefcase, Settings } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const loggedInUser = await login(email, password);
      toast.success('✓ Login successful! Welcome back!', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      if (loggedInUser?.must_change_password) {
        router.push('/change-password');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Login failed. Please check your credentials.';
      toast.error('✗ ' + errorMsg, {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (mockUser: typeof mockUsers[0]) => {
    setLoading(true);
    setError('');
    try {
      const loggedInUser = await login(mockUser.email, mockUser.password);
      toast.success('✓ Login successful! Welcome back!', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      if (loggedInUser?.must_change_password) {
        router.push('/change-password');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Login failed.';
      toast.error('✗ ' + errorMsg, {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-transparent">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        <Card className="p-8 sm:p-10" variant="panel">
          <div className="flex flex-col items-center mb-8 text-center">
            <Image
                          src="/institution_logo-ADF-1737480805029.jpg"
                          alt="Institution Logo"
                          width={64}
                          height={64}
                          className="rounded-2xl shadow-lg mb-6"
                        />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Welcome Back</h1>
            <p className="text-slate-500 dark:text-slate-400">Sign in to manage your internship journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@mak.ac.ug"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              icon={<Mail className="w-5 h-5" />}
            />

            <div className="space-y-2">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                icon={<Lock className="w-5 h-5" />}
              />
              <div className="flex justify-end">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Contact administrator to reset password
                </span>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-secondary/10 border border-secondary/20 rounded-xl text-secondary text-sm font-medium animate-in shake duration-300">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full py-4 text-lg"
              isLoading={loading}
            >
              Sign In
              {!loading && <ArrowRight className="ml-2 w-5 h-5" />}
            </Button>

            <p className="text-center text-sm text-slate-600 dark:text-slate-400">
              Don't have an account?{' '}
              <Link
                href="/register"
                className="font-bold text-primary hover:text-primary-hover transition-colors"
              >
                Create account
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}