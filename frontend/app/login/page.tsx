'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { mockUsers } from '@/lib/mockAuth';
import { Button, Input, Card } from '@/components/ui';
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
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (mockUser: typeof mockUsers[0]) => {
    setLoading(true);
    setError('');
    try {
      await login(mockUser.email, mockUser.password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed.');
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
            <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-primary to-secondary flex items-center justify-center text-white shadow-lg mb-6">
              <ShieldCheck className="w-10 h-10" />
            </div>
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
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
                >
                  Forgot password?
                </Link>
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

          {/* Users Section */}
          <div className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-6 text-center uppercase tracking-widest">
              Access Accounts
            </p>
            <div className="grid grid-cols-2 gap-3">
              {mockUsers.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickLogin(u)}
                  disabled={loading}
                  className="flex flex-col items-center p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/30 dark:bg-slate-900/30 hover:border-primary/50 hover:bg-primary/5 transition-all group disabled:opacity-50"
                >
                  <span className="text-lg mb-1 group-hover:scale-125 transition-transform duration-300">
                    {u.role === 'STUDENT' ? <GraduationCap className="w-5 h-5 text-primary" /> :
                      u.role === 'ACADEMIC_SUPERVISOR' ? <GraduationCap className="w-5 h-5 text-secondary" /> :
                        u.role === 'WORKPLACE_SUPERVISOR' ? <Briefcase className="w-5 h-5 text-emerald-500" /> :
                          <Settings className="w-5 h-5 text-amber-500" />}
                  </span>
                  <span className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-tighter">
                    {u.role.split('_')[0]}
                  </span>
                  <span className="text-[9px] text-slate-500 dark:text-slate-500">
                    {u.first_name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}