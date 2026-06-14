'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout, PageHeader, Statusbar } from '@/components/layout';
import { Card, Button, Input } from '@/components/ui';
import { api } from '@/lib/api';
import { InternshipPlacement } from '@/lib/types';
import {
  Users,
  Briefcase,
  Building,
  Plus,
  ChevronRight,
  TrendingUp,
  LayoutDashboard,
  ShieldCheck,
  Clock,
  RefreshCw,
  AlertCircle,
  Database,
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ students: 0, supervisors: 0, placements: 0, departments: 0 });
  const [recentPlacements, setRecentPlacements] = useState<InternshipPlacement[]>([]);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [createdSupervisor, setCreatedSupervisor] = useState<{ name: string; email: string; temp_password: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [newSupervisor, setNewSupervisor] = useState<{
    email: string; first_name: string; last_name: string;
    role: 'ACADEMIC_SUPERVISOR' | 'WORKPLACE_SUPERVISOR';
    phone_number: string; staff_id: string; faculty: string; department: string;
    specialization: string; max_students: number; job_title: string;
    workplace_department: string; years_of_experience: number;
  }>({
    email: '', first_name: '', last_name: '', role: 'ACADEMIC_SUPERVISOR',
    phone_number: '', staff_id: '', faculty: '', department: '',
    specialization: '', max_students: 10, job_title: '',
    workplace_department: '', years_of_experience: 0,
  });

  /* ── Data fetching ──────────────────────────────────────────────────────── */
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const [studentsRes, academicRes, workplaceRes, placementsRes, departmentsRes] = await Promise.all([
        api.getUsers({ role: 'STUDENT' }),
        api.getUsers({ role: 'ACADEMIC_SUPERVISOR' }),
        api.getUsers({ role: 'WORKPLACE_SUPERVISOR' }),
        api.getPlacements(),
        api.getDepartments(),
      ]);

      const count = (r: any) => r?.count ?? (Array.isArray(r) ? r.length : r?.results?.length ?? 0);

      setStats({
        students:    count(studentsRes),
        supervisors: count(academicRes) + count(workplaceRes),
        placements:  count(placementsRes),
        departments: count(departmentsRes),
      });

      const list: InternshipPlacement[] = placementsRes?.results ?? (Array.isArray(placementsRes) ? placementsRes : []);
      setRecentPlacements(list.slice(0, 5));
      setLastSynced(new Date());
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      setError(err?.message || 'Could not connect to the server. Make sure the backend is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 30 s
  useEffect(() => {
    const id = setInterval(() => fetchData(true), 30_000);
    return () => clearInterval(id);
  }, [fetchData]);

  /* ── Register supervisor ────────────────────────────────────────────────── */
  const handleRegisterSupervisor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let payload: any = {
        email: newSupervisor.email,
        first_name: newSupervisor.first_name,
        last_name: newSupervisor.last_name,
        phone_number: newSupervisor.phone_number,
        role: newSupervisor.role,
      };
      if (newSupervisor.role === 'ACADEMIC_SUPERVISOR') {
        payload = { ...payload, staff_id: newSupervisor.staff_id, faculty: newSupervisor.faculty, department: newSupervisor.department, specialization: newSupervisor.specialization, max_students: newSupervisor.max_students };
      } else {
        payload = { ...payload, job_title: newSupervisor.job_title, workplace_department: newSupervisor.workplace_department, years_of_experience: newSupervisor.years_of_experience };
      }
      const result = await api.registerSupervisor(payload);
      setCreatedSupervisor({ name: `${newSupervisor.first_name} ${newSupervisor.last_name}`, email: newSupervisor.email, temp_password: result.temp_password || '(auto-generated — check server logs)' });
      setNewSupervisor({ email: '', first_name: '', last_name: '', role: 'ACADEMIC_SUPERVISOR', phone_number: '', staff_id: '', faculty: '', department: '', specialization: '', max_students: 10, job_title: '', workplace_department: '', years_of_experience: 0 });
      fetchData(true);
    } catch (err: any) {
      console.error('Failed to register supervisor:', err);
      alert('Error: ' + (err.message || 'Failed to register supervisor'));
    }
  };

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <DashboardLayout>
      <PageHeader
        title="Admin Control Center"
        subtitle="Manage students, supervisors, and industrial training placements."
        actions={
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Live / Mock badge */}
            {api.isMockMode() ? (
              <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-full uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Mock Data Mode
              </span>
            ) : (
              <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-full uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live DB
              </span>
            )}
            {/* Refresh button with last-synced time */}
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              title={lastSynced ? `Last synced: ${lastSynced.toLocaleTimeString()}` : 'Click to refresh'}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {lastSynced ? lastSynced.toLocaleTimeString() : 'Refresh'}
            </button>
            <Button onClick={() => setShowRegisterModal(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Register Supervisor
            </Button>
            <a href="/dashboard/admin/supervisors" style={{ padding: '8px 16px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 14 }}>
              <ShieldCheck size={16} />
              View All Supervisors
            </a>
          </div>
        }
      />

      <div className="space-y-8">

        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">Could not load live data</p>
              <p className="text-xs mt-0.5 opacity-80 break-words">{error}</p>
            </div>
            <button
              onClick={() => fetchData()}
              className="shrink-0 text-xs font-bold px-3 py-1.5 bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard loading={loading} title="Total Students"   value={stats.students}    icon={<Users />}      color="text-indigo-500" />
          <StatCard loading={loading} title="Supervisors"      value={stats.supervisors} icon={<ShieldCheck />} color="text-emerald-500" />
          <StatCard loading={loading} title="Total Placements" value={stats.placements}  icon={<Briefcase />}   color="text-amber-500" />
          <StatCard loading={loading} title="Departments"      value={stats.departments} icon={<Building />}    color="text-rose-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Placements */}
          <Card className="lg:col-span-2 p-0 overflow-hidden" variant="panel">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                Recent Placements
              </h3>
              <a href="/dashboard/admin/placements">
                <Button variant="ghost" size="sm" className="text-xs font-bold uppercase tracking-widest">View All</Button>
              </a>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-slate-500 text-sm font-medium">Fetching live data from database…</p>
              </div>
            ) : recentPlacements.length === 0 ? (
              <div className="p-14 text-center">
                <Database className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 font-bold text-sm">No placements found</p>
                <p className="text-slate-400 text-xs mt-1">
                  {error ? 'Could not fetch data — check your connection and backend.' : 'Create the first placement to see it here.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50">
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Workplace</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {recentPlacements.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold text-xs">
                              {p.student?.first_name?.[0]}{p.student?.last_name?.[0]}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{p.student?.first_name} {p.student?.last_name}</p>
                              <p className="text-[10px] text-slate-500 font-medium">ID: {p.student?.student_id || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{p.workplace?.name}</p>
                          <p className="text-[10px] text-slate-500">{p.position_title}</p>
                        </td>
                        <td className="px-6 py-4"><Statusbar status={p.status} /></td>
                        <td className="px-6 py-4">
                          <a href="/dashboard/admin/placements">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6" variant="glass">
              <h3 className="font-bold mb-4 text-slate-900 dark:text-white">System Tools</h3>
              <div className="space-y-2">
                <ToolButton href="/dashboard/admin/students"    icon={<Users className="w-4 h-4" />}        label="Manage Students"    count={stats.students} />
                <ToolButton href="/dashboard/admin/supervisors" icon={<ShieldCheck className="w-4 h-4" />} label="Manage Supervisors"  count={stats.supervisors} />
                <ToolButton href="/dashboard/admin/placements"  icon={<Briefcase className="w-4 h-4" />}   label="Placements"          count={stats.placements} />
                <ToolButton href="/dashboard/admin/departments" icon={<Building className="w-4 h-4" />}    label="Departments"         count={stats.departments} />
                <ToolButton href="/dashboard/admin/audit-logs"  icon={<LayoutDashboard className="w-4 h-4" />} label="Audit Logs" />
              </div>
            </Card>

            {/* Auto-refresh info card */}
            <Card className="p-6 bg-linear-to-br from-indigo-600 to-indigo-800 text-white shadow-xl shadow-indigo-500/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-bold">Auto-Refresh</h4>
              </div>
              <p className="text-indigo-100 text-sm mb-4">
                Data syncs with the live database every <strong>30 seconds</strong>.
              </p>
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-indigo-200">
                  {lastSynced ? `Synced: ${lastSynced.toLocaleTimeString()}` : 'Loading…'}
                </span>
                <button
                  onClick={() => fetchData(true)}
                  disabled={refreshing}
                  className="flex items-center gap-1.5 text-white text-xs font-bold uppercase tracking-widest hover:text-indigo-200 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                  Sync Now
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* ── Credentials modal ───────────────────────────────────────────────── */}
      {createdSupervisor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <Card className="w-full max-w-md p-8" variant="panel">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                <ShieldCheck className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Account Created!</h2>
              <p className="text-slate-500 text-sm">Share these credentials securely. <strong className="text-rose-500">Password won&apos;t be shown again.</strong></p>
            </div>
            <div className="space-y-3 mb-6">
              <InfoBox label="Name"         value={createdSupervisor.name} />
              <InfoBox label="Email (Login)" value={createdSupervisor.email} />
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700 relative">
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Temporary Password</p>
                <p className="font-black text-xl text-slate-900 dark:text-white font-mono tracking-widest">{createdSupervisor.temp_password}</p>
                <button
                  onClick={() => navigator.clipboard.writeText(createdSupervisor.temp_password)}
                  className="absolute top-3 right-3 text-[10px] font-black text-amber-600 bg-amber-100 dark:bg-amber-900/40 px-2 py-1 rounded-lg hover:bg-amber-200 transition-colors uppercase tracking-widest"
                >Copy</button>
              </div>
              <p className="text-[11px] text-slate-400 text-center">The supervisor must change this password on first login.</p>
            </div>
            <Button className="w-full" onClick={() => { setCreatedSupervisor(null); setShowRegisterModal(false); }}>Done</Button>
          </Card>
        </div>
      )}

      {/* ── Register modal ──────────────────────────────────────────────────── */}
      {showRegisterModal && !createdSupervisor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto" variant="panel">
            <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Register Supervisor</h2>
            <form onSubmit={handleRegisterSupervisor} className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Input label="First Name" value={newSupervisor.first_name} onChange={e => setNewSupervisor({ ...newSupervisor, first_name: e.target.value })} required />
                  <Input label="Last Name"  value={newSupervisor.last_name}  onChange={e => setNewSupervisor({ ...newSupervisor, last_name: e.target.value })} required />
                </div>
                <Input label="Email (@mak.ac.ug)" type="email" value={newSupervisor.email}        onChange={e => setNewSupervisor({ ...newSupervisor, email: e.target.value })} required />
                <div className="mt-4">
                  <Input label="Phone Number" type="tel" value={newSupervisor.phone_number} onChange={e => setNewSupervisor({ ...newSupervisor, phone_number: e.target.value })} required />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Supervisor Role</h3>
                <select
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 py-3 px-4 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newSupervisor.role}
                  onChange={e => setNewSupervisor({ ...newSupervisor, role: e.target.value as any })}
                  required
                >
                  <option value="ACADEMIC_SUPERVISOR">Academic Supervisor</option>
                  <option value="WORKPLACE_SUPERVISOR">Workplace Supervisor</option>
                </select>
              </div>

              {newSupervisor.role === 'ACADEMIC_SUPERVISOR' && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Academic Information</h3>
                  <div className="space-y-4">
                    <Input label="Staff ID"       value={newSupervisor.staff_id}       onChange={e => setNewSupervisor({ ...newSupervisor, staff_id: e.target.value })}       placeholder="e.g., STF/2024/001" required />
                    <Input label="Faculty"        value={newSupervisor.faculty}        onChange={e => setNewSupervisor({ ...newSupervisor, faculty: e.target.value })}        placeholder="e.g., CoCIS" required />
                    <Input label="Department"     value={newSupervisor.department}     onChange={e => setNewSupervisor({ ...newSupervisor, department: e.target.value })}     placeholder="e.g., Computer Science" required />
                    <Input label="Specialization" value={newSupervisor.specialization} onChange={e => setNewSupervisor({ ...newSupervisor, specialization: e.target.value })} placeholder="e.g., Software Engineering" required />
                    <Input label="Max Students"   type="number" value={newSupervisor.max_students} onChange={e => setNewSupervisor({ ...newSupervisor, max_students: parseInt(e.target.value) })} required />
                  </div>
                </div>
              )}

              {newSupervisor.role === 'WORKPLACE_SUPERVISOR' && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Workplace Information</h3>
                  <div className="space-y-4">
                    <Input label="Job Title"           value={newSupervisor.job_title}           onChange={e => setNewSupervisor({ ...newSupervisor, job_title: e.target.value })}           placeholder="e.g., Senior Software Engineer" required />
                    <Input label="Department"          value={newSupervisor.workplace_department} onChange={e => setNewSupervisor({ ...newSupervisor, workplace_department: e.target.value })} placeholder="e.g., IT, Finance, HR" required />
                    <Input label="Years of Experience" type="number" value={newSupervisor.years_of_experience} onChange={e => setNewSupervisor({ ...newSupervisor, years_of_experience: parseInt(e.target.value) })} required />
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-6">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowRegisterModal(false)}>Cancel</Button>
                <Button type="submit" className="flex-1">Register Supervisor</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────────── */

function StatCard({ title, value, icon, color, loading }: { title: string; value: number; icon: React.ReactNode; color: string; loading?: boolean }) {
  return (
    <Card className="p-6 relative overflow-hidden group" hoverable>
      <div className="relative z-10 flex flex-col gap-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</span>
        {loading ? (
          <div className="h-9 w-20 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse mt-1" />
        ) : (
          <span className="text-3xl font-black text-slate-900 dark:text-white">{value}</span>
        )}
      </div>
      <div className={`absolute top-4 right-4 ${color} opacity-20 group-hover:scale-110 group-hover:opacity-100 transition-all duration-500 [&_svg]:size-10`}>
        {icon}
      </div>
    </Card>
  );
}

function ToolButton({ href, icon, label, count }: { href: string; icon: React.ReactNode; label: string; count?: number }) {
  return (
    <a href={href} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group no-underline">
      <div className="flex items-center gap-3">
        <div className="text-slate-400 group-hover:text-indigo-500 transition-colors">{icon}</div>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      </div>
      {count !== undefined && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">{count}</span>
      )}
    </a>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}