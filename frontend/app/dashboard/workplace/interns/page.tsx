'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout, PageHeader, Statusbar } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { InternshipPlacement } from '@/lib/types';
import Link from 'next/link';
import { 
  Mail, 
  Phone, 
  Calendar, 
  Award, 
  Search, 
  Filter, 
  Users, 
  CheckCircle2, 
  Clock, 
  Briefcase,
  ChevronRight,
  MessageSquare,
  Building,
  GraduationCap
} from 'lucide-react';

export default function InternsPage() {
  const { user } = useAuth();
  const [placements, setPlacements] = useState<InternshipPlacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const placementsData = await api.getPlacements();
        setPlacements(placementsData.results || placementsData || []);
      } catch (error) {
        console.error('Failed to fetch interns:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) fetchData();
  }, [user]);

  const filteredPlacements = placements.filter(placement => {
    const matchesSearch = 
      `${placement.student?.first_name} ${placement.student?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      placement.position_title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || placement.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: placements.length,
    active: placements.filter(p => p.status === 'ACTIVE').length,
    completed: placements.filter(p => p.status === 'COMPLETED').length,
    pending: placements.filter(p => p.status === 'PENDING' || p.status === 'ON_HOLD').length,
  };

  return (
    <DashboardLayout>
      <PageHeader 
        title="Workplace Interns"
        subtitle="Monitor and manage the students currently placed at your organization."
        actions={
          <Button className="gap-2 bg-primary">
            <Users className="w-4 h-4" />
            Manage Attendance
          </Button>
        }
      />

      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Assigned Interns" value={stats.total} icon={<Users />} color="text-slate-500" />
          <StatCard title="Actively Reporting" value={stats.active} icon={<CheckCircle2 />} color="text-emerald-500" />
          <StatCard title="Cycles Completed" value={stats.completed} icon={<Award />} color="text-indigo-500" />
          <StatCard title="Needs Attention" value={stats.pending} icon={<Clock />} color="text-amber-500" highlight={stats.pending > 0} />
        </div>

        {/* Filter Bar */}
        <Card className="p-4" variant="glass">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>
            <div className="relative">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Currently Active</option>
                <option value="COMPLETED">Completed Term</option>
                <option value="ON_HOLD">Temporary Hold</option>
              </select>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                Organization Staff
              </span>
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Updating Staff Directory...</p>
          </div>
        ) : filteredPlacements.length === 0 ? (
          <Card className="p-20 text-center" variant="panel">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No interns found</h3>
            <p className="text-slate-500 text-sm">No students match the current filter criteria.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredPlacements.map(placement => (
              <InternGridCard key={placement.id} placement={placement} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, icon, color, highlight = false }: any) {
  return (
    <Card className={`p-6 relative overflow-hidden group ${highlight ? 'ring-2 ring-amber-500/50' : ''}`} hoverable>
      <div className="relative z-10">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-none">{value}</h3>
      </div>
      <div className={`absolute top-4 right-4 ${color} opacity-10 group-hover:opacity-40 group-hover:scale-110 transition-all duration-500 [&_svg]:size-10`}>
        {icon}
      </div>
    </Card>
  );
}

function InternGridCard({ placement }: { placement: InternshipPlacement }) {
  const progress = placement.log_progress ? (placement.log_progress.approved_logs / (placement.log_progress.total_logs || 1)) * 100 : 0;
  
  return (
    <Card className="overflow-hidden border-t-4 border-t-slate-200 dark:border-t-slate-800 hover:border-t-primary transition-all duration-500 group" variant="panel">
      <div className={`h-24 p-6 flex justify-between items-start ${placement.status === 'ACTIVE' ? 'bg-linear-to-br from-emerald-500/10 to-emerald-600/5' : 'bg-linear-to-br from-indigo-500/10 to-indigo-600/5'}`}>
        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center text-primary font-black text-xl border border-slate-100 dark:border-slate-800">
          {placement.student?.first_name[0]}{placement.student?.last_name[0]}
        </div>
        <Statusbar status={placement.status} />
      </div>

      <div className="p-6 pt-10 space-y-6">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">
            {placement.student?.first_name} {placement.student?.last_name}
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {placement.student?.student_id}</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
            <Briefcase className="w-4 h-4 text-primary/50" />
            <span className="font-bold">{placement.position_title}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
            <GraduationCap className="w-4 h-4 text-primary/50" />
            <span>{placement.department?.name || 'Computing & IT'}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
            <Calendar className="w-4 h-4 text-primary/50" />
            <span className="font-medium">Ends {new Date(placement.end_date).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
            <span className="text-slate-400">Activity Completion</span>
            <span className="text-primary">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
          <Link href={`/dashboard/workplace/interns/${placement.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full h-10 text-[10px] font-black uppercase tracking-widest">
              Profile
            </Button>
          </Link>
          <Button size="sm" className="h-10 w-10 p-0 rounded-xl" title="Contact Intern">
            <MessageSquare className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
