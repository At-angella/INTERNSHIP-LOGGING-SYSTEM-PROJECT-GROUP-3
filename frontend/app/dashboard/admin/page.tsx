'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { DashboardLayout, PageHeader, Statusbar } from '@/components/layout';
import { Card, Button, Input } from '@/components/ui';
import { api } from '@/lib/api';
import { User, InternshipPlacement } from '@/lib/types';
import { 
  Users, 
  Briefcase, 
  Building, 
  Plus, 
  Search, 
  Filter, 
  ChevronRight,
  TrendingUp,
  LayoutDashboard,
  ShieldCheck,
  MapPin,
  Clock,
  Link as LinkIcon
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    students: 0,
    supervisors: 0,
    placements: 0,
    departments: 0,
  });
  const [recentPlacements, setRecentPlacements] = useState<InternshipPlacement[]>([]);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newSupervisor, setNewSupervisor] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'ACADEMIC_SUPERVISOR' as const,
    phone_number: '',
    staff_id: '',
    faculty: '',
    department: '',
    specialization: '',
    max_students: 10,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [users, placements, departments] = await Promise.all([
        api.getUsers(),
        api.getPlacements(),
        api.getDepartments()
      ]);
      
      const students = users.filter((u: User) => u.role === 'STUDENT');
      const supervisors = users.filter((u: User) => u.role === 'ACADEMIC_SUPERVISOR' || u.role === 'WORKPLACE_SUPERVISOR');
      
      setStats({
        students: students.length,
        supervisors: supervisors.length,
        placements: placements.count || placements.length || 0,
        departments: departments.length,
      });
      
      const placementsList = placements.results || placements;
      setRecentPlacements(placementsList.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSupervisor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.registerSupervisor(newSupervisor);
      setShowRegisterModal(false);
      setNewSupervisor({
        email: '',
        first_name: '',
        last_name: '',
        role: 'ACADEMIC_SUPERVISOR',
        phone_number: '',
        staff_id: '',
        faculty: '',
        department: '',
        specialization: '',
        max_students: 10,
      });
      fetchData();
    } catch (error) {
      console.error('Failed to register supervisor:', error);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader 
        title="Admin Control Center"
        subtitle="Manage students, supervisors, and industrial training placements."
        actions={
          <div style={{ display: 'flex', gap: 12 }}>
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
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Students" value={stats.students} icon={<Users />} color="text-indigo-500" />
          <StatCard title="Supervisors" value={stats.supervisors} icon={<ShieldCheck />} color="text-emerald-500" />
          <StatCard title="Active Placements" value={stats.placements} icon={<Briefcase />} color="text-amber-500" />
          <StatCard title="Departments" value={stats.departments} icon={<Building />} color="text-rose-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Placements Table */}
          <Card className="lg:col-span-2 p-0 overflow-hidden" variant="panel">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                Recent Placements
              </h3>
              <Button variant="ghost" size="sm" className="text-xs font-bold uppercase tracking-widest">
                View All
              </Button>
            </div>
            
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-slate-500 text-sm">Syncing data...</p>
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
                    {recentPlacements.map((placement) => (
                      <tr key={placement.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold text-xs">
                              {placement.student?.first_name[0]}{placement.student?.last_name[0]}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{placement.student?.first_name} {placement.student?.last_name}</p>
                              <p className="text-[10px] text-slate-500 font-medium tracking-tight">ID: {placement.student?.student_id || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{placement.workplace?.name}</p>
                          <p className="text-[10px] text-slate-500">{placement.position_title}</p>
                        </td>
                        <td className="px-6 py-4">
                          <Statusbar status={placement.status} />
                        </td>
                        <td className="px-6 py-4">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Quick Actions & System Info */}
          <div className="space-y-6">
            <Card className="p-6" variant="glass">
              <h3 className="font-bold mb-4 text-slate-900 dark:text-white">System Tools</h3>
              <div className="space-y-3">
                <ToolButton icon={<Users className="w-4 h-4" />} label="Manage Users" count={stats.students + stats.supervisors} />
                <ToolButton icon={<Building className="w-4 h-4" />} label="Workplaces" count={stats.departments} />
                <ToolButton icon={<LayoutDashboard className="w-4 h-4" />} label="Audit Logs" />
              </div>
            </Card>

            <Card className="p-6 bg-linear-to-br from-indigo-600 to-indigo-800 text-white shadow-xl shadow-indigo-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-bold">Next Deadline</h4>
              </div>
              <p className="text-indigo-100 text-sm mb-4">End of 2nd semester logbook submissions.</p>
              <div className="flex justify-between items-end">
                <span className="text-2xl font-black">12 Days</span>
                <Button variant="ghost" className="text-white hover:bg-white/10 p-0 h-auto font-bold text-xs uppercase tracking-widest">
                  View Schedule
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Register Modal (Simplified for refactor) */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-lg p-8 animate-in zoom-in-95 duration-300" variant="panel">
            <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Register Supervisor</h2>
            <form onSubmit={handleRegisterSupervisor} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="First Name" value={newSupervisor.first_name} onChange={e => setNewSupervisor({...newSupervisor, first_name: e.target.value})} required />
                <Input label="Last Name" value={newSupervisor.last_name} onChange={e => setNewSupervisor({...newSupervisor, last_name: e.target.value})} required />
              </div>
              <Input label="Email" type="email" value={newSupervisor.email} onChange={e => setNewSupervisor({...newSupervisor, email: e.target.value})} required />
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Supervisor Role</label>
                <select 
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 py-3 px-4 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newSupervisor.role}
                  onChange={e => setNewSupervisor({...newSupervisor, role: e.target.value as any})}
                >
                  <option value="ACADEMIC_SUPERVISOR">Academic Supervisor</option>
                  <option value="WORKPLACE_SUPERVISOR">Workplace Supervisor</option>
                </select>
              </div>
              <div className="flex gap-4 pt-6">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowRegisterModal(false)}>Cancel</Button>
                <Button type="submit" className="flex-1">Register</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color: string }) {
  return (
    <Card className="p-6 relative overflow-hidden group" hoverable>
      <div className="relative z-10 flex flex-col gap-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</span>
        <span className="text-3xl font-black text-slate-900 dark:text-white">{value}</span>
      </div>
      <div className={`absolute top-4 right-4 ${color} opacity-20 group-hover:scale-110 group-hover:opacity-100 transition-all duration-500 [&_svg]:size-10`}>
        {icon}
      </div>
    </Card>
  );
}

function ToolButton({ icon, label, count }: { icon: React.ReactNode, label: string, count?: number }) {
  return (
    <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
      <div className="flex items-center gap-3">
        <div className="text-slate-400 group-hover:text-indigo-500 transition-colors">
          {icon}
        </div>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      </div>
      {count !== undefined && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
          {count}
        </span>
      )}
    </button>
  );
}