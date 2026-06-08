'use client';
import React, { useState, useEffect } from 'react';
import { DashboardLayout, PageHeader, Statusbar } from '@/components/layout';
import { Card, Button, Input } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { User, AcademicSupervisor, WorkplaceSupervisor } from '@/lib/types';
import { 
  Mail, 
  Phone, 
  Award, 
  BookOpen, 
  Briefcase, 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  ShieldCheck,
  Building,
  Users,
  ChevronRight,
  MoreVertical,
  MapPin,
  GraduationCap,
  Activity,
  Star
} from 'lucide-react';

export default function SupervisorsPage() {
  const { user: currentUser } = useAuth();
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const users = await api.getUsers();
        const supervisorList = users.filter((u: User) => 
          u.role === 'ACADEMIC_SUPERVISOR' || u.role === 'WORKPLACE_SUPERVISOR'
        );
        setSupervisors(supervisorList);
      } catch (error) {
        console.error('Failed to fetch supervisors:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser) fetchData();
  }, [currentUser]);

  const filteredSupervisors = supervisors.filter(supervisor => {
    const fullName = `${supervisor.first_name} ${supervisor.last_name}`.toLowerCase();
    const email = supervisor.email?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    
    const matchesSearch = fullName.includes(search) || email.includes(search);
    const matchesRole = filterRole === 'ALL' || supervisor.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: supervisors.length,
    academic: supervisors.filter(s => s.role === 'ACADEMIC_SUPERVISOR').length,
    workplace: supervisors.filter(s => s.role === 'WORKPLACE_SUPERVISOR').length,
    totalSlots: supervisors.reduce((sum, s) => sum + ((s as any).max_students || 10), 0),
  };

  return (
    <DashboardLayout>
      <PageHeader 
        title="Supervisory Council"
        subtitle="Orchestrate and manage the academic and industrial mentorship network."
        actions={
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-400 hover:text-slate-600'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-400 hover:text-slate-600'}`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        }
      />

      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Active Mentors" value={stats.total} icon={<Users />} color="text-slate-500" />
          <StatCard title="University Faculty" value={stats.academic} icon={<ShieldCheck />} color="text-indigo-500" />
          <StatCard title="Industry Experts" value={stats.workplace} icon={<Briefcase />} color="text-emerald-500" />
          <StatCard title="Capacity Pool" value={stats.totalSlots} icon={<Activity />} color="text-amber-500" />
        </div>

        <Card className="p-4" variant="glass">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="relative group">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Find supervisor by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400"
              />
            </div>
            <div className="relative group">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer font-medium"
              >
                <option value="ALL">Global Staff (All)</option>
                <option value="ACADEMIC_SUPERVISOR">Academic Supervisors</option>
                <option value="WORKPLACE_SUPERVISOR">Workplace Supervisors</option>
              </select>
            </div>
            <div className="flex justify-end items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl">
                {filteredSupervisors.length} Verified Accounts
              </span>
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="py-32 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-6" />
            <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Synchronizing Matrix...</p>
          </div>
        ) : filteredSupervisors.length === 0 ? (
          <Card className="p-20 text-center flex flex-col items-center" variant="panel">
            <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl mb-6">
              <Search className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">No supervisors match your query</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">Expand your search horizons by adjusting the filters above.</p>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredSupervisors.map(supervisor => (
              <SupervisorGridCard key={supervisor.id} supervisor={supervisor} />
            ))}
          </div>
        ) : (
          <Card className="p-0 overflow-hidden" variant="panel">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Profile</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identity & Contact</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Classification</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Load</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSupervisors.map(supervisor => (
                    <tr key={supervisor.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-300 group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-xl transform group-hover:scale-110 transition-transform ${supervisor.role === 'ACADEMIC_SUPERVISOR' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                            {supervisor.first_name[0]}{supervisor.last_name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 dark:text-white leading-none mb-1">{supervisor.first_name} {supervisor.last_name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Verified Provider</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <Mail className="w-3.5 h-3.5 text-primary/60" />
                          </div>
                          {supervisor.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`w-fit px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${supervisor.role === 'ACADEMIC_SUPERVISOR' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                            {supervisor.role === 'ACADEMIC_SUPERVISOR' ? 'Academic' : 'Corporate'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex flex-col items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 min-w-[60px]">
                          <span className="text-sm font-black text-slate-900 dark:text-white leading-none mb-1">
                            {((supervisor as any).max_students) || 10}
                          </span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Slots</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl hover:bg-white dark:hover:bg-slate-800 shadow-sm opacity-0 group-hover:opacity-100 transition-all">
                          <ChevronRight className="w-5 h-5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color: string }) {
  return (
    <Card className="p-6 relative overflow-hidden group" hoverable>
      <div className="relative z-10">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 opacity-70">{title}</p>
        <h3 className="text-4xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">{value}</h3>
      </div>
      <div className={`absolute -bottom-2 -right-2 ${color} opacity-[0.03] group-hover:opacity-10 group-hover:scale-125 transition-all duration-700 [&_svg]:size-[120px]`}>
        {icon}
      </div>
    </Card>
  );
}

function SupervisorGridCard({ supervisor }: { supervisor: User }) {
  const isAcademic = supervisor.role === 'ACADEMIC_SUPERVISOR';
  
  return (
    <Card className="overflow-hidden border-t-4 border-t-slate-200 dark:border-t-slate-800 hover:border-t-primary transition-all duration-500 group" variant="panel">
      <div className={`h-24 ${isAcademic ? 'bg-linear-to-br from-indigo-500/10 to-indigo-600/5' : 'bg-linear-to-br from-emerald-500/10 to-emerald-600/5'} p-6 flex justify-between items-start`}>
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-2xl transform -rotate-6 group-hover:rotate-0 group-hover:scale-110 transition-all duration-500 ${isAcademic ? 'bg-indigo-600 shadow-indigo-500/20' : 'bg-emerald-600 shadow-emerald-500/20'}`}>
          {supervisor.first_name[0]}{supervisor.last_name[0]}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] shadow-sm ${isAcademic ? 'bg-white dark:bg-indigo-900 text-indigo-600' : 'bg-white dark:bg-emerald-900 text-emerald-600'}`}>
            {isAcademic ? 'Academic' : 'Industry'}
          </span>
          <div className="flex gap-1">
            {[1,2,3,4,5].map(i => <Star key={i} className={`w-2.5 h-2.5 ${i <= 4 ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-800'}`} />)}
          </div>
        </div>
      </div>
      
      <div className="p-6 pt-12 relative">
        <div className="mb-8">
          <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight group-hover:text-primary transition-colors">
            {supervisor.first_name} {supervisor.last_name}
          </h3>
          <p className="text-[10px] font-black text-primary flex items-center gap-1.5 uppercase tracking-[0.15em] mt-2">
            {isAcademic ? <GraduationCap className="w-3.5 h-3.5" /> : <Building className="w-3.5 h-3.5" />}
            {isAcademic ? (supervisor as AcademicSupervisor).department || 'Computational Intelligence' : (supervisor as WorkplaceSupervisor).workplace_department || 'Strategic Tech Partner'}
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-400">
            <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <Mail className="w-4 h-4 text-primary/50" />
            </div>
            {supervisor.email}
          </div>
          <div className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-400">
            <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <Phone className="w-4 h-4 text-primary/50" />
            </div>
            {supervisor.phone_number || '+256 700 000 000'}
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 group-hover:border-primary/20 group-hover:bg-white dark:group-hover:bg-slate-900 transition-all">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Capacity Index</span>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-2/3 rounded-full" />
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">{((supervisor as AcademicSupervisor).max_students) || 10} Interns</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl hover:bg-primary hover:text-white shadow-sm transition-all">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}