'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Button, Input, Card } from '@/components/ui';
import { toast } from 'react-toastify';
import { Lock, ArrowRight, ShieldAlert } from 'lucide-react';
import Image from 'next/image';

export default function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  // Route protection: only users who must change password should be here
  useEffect(() => {
    if (!authLoading && (!user || !user.must_change_password)) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      await api.changePassword(oldPassword, newPassword);
      toast.success('✓ Password changed successfully! Please log in with your new password.', {
        position: 'top-right',
        autoClose: 3000,
      });
      // Logout to clear the temporary session and prompt user to login with new password
      setTimeout(() => {
        logout();
      }, 1500);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to change password. Please check your temporary password.';
      toast.error('✗ ' + errorMsg, {
        position: 'top-right',
        autoClose: 5000,
      });
      setError(errorMsg);
      setLoading(false);
    }
  };

  if (authLoading || (user && !user.must_change_password)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-transparent">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        <Card className="p-8 sm:p-10 animate-in zoom-in-95 duration-300" variant="panel">
          <div className="flex flex-col items-center mb-6 text-center">
            <Image
              src="/institution_logo-ADF-1737480805029.jpg"
              alt="Institution Logo"
              width={64}
              height={64}
              className="rounded-2xl shadow-lg mb-4"
            />
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6 text-amber-600" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Security Action Required</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
              Your account uses a temporary password. Choose a new secure password to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Temporary Password"
              type="password"
              placeholder="Enter temporary password"
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              required
              icon={<Lock className="w-5 h-5" />}
            />

            <Input
              label="New Password"
              type="password"
              placeholder="Minimum 8 characters"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              icon={<Lock className="w-5 h-5" />}
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              icon={<Lock className="w-5 h-5" />}
            />

            {error && (
              <div className="p-4 bg-secondary/10 border border-secondary/20 rounded-xl text-secondary text-sm font-medium animate-in shake duration-300">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full py-4 text-base font-bold"
              isLoading={loading}
            >
              Update Password
              {!loading && <ArrowRight className="ml-2 w-5 h-5" />}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
