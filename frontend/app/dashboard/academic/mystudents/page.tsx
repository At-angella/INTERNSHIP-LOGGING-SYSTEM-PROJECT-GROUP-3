'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { DashboardLayout, PageHeader, Statusbar } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { InternshipPlacement, WeeklyLog, Evaluation } from '@/lib/types';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Calendar, 
  BookOpen, 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  GraduationCap,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck
} from 'lucide-react';
import Link from 'next/link';

export default function MyStudentsPage() {
  const { user } = useAuth();
  const [placements, setPlacements] = useState<InternshipPlacement[]>([]);
  const [logs, setLogs] = useState<WeeklyLog[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

   useEffect(() => {
    const fetchData = async () => {
      try {
        const [placementsData, logsData, evalsData] = await Promise.all([
          api.getPlacements(),
          api.getWeeklyLogs(),
          api.getEvaluations(),
        ]);
        
        setPlacements(placementsData.results || placementsData || []);
        setLogs(logsData.results || logsData || []);
        setEvaluations(evalsData.results || evalsData || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) fetchData();
  }, [user]);

  const studentStats = placements.filter(placement => {
    const matchesSearch = 
      `${placement.student?.first_name} ${placement.student?.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      placement.student?.student_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'ALL' || placement.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  }).map(placement => {
    const studentLogs = logs.filter(l => l.placement?.id === placement.id);
    const studentEval = evaluations.find(e => e.placement?.id === placement.id);
    const approvedLogs = studentLogs.filter(l => l.status === 'APPROVED').length;
    
    return {
      placement,
      logsCount: studentLogs.length,
      approvedLogs,
      totalHours: studentLogs.reduce((sum, l) => sum + (l.hours_worked || 0), 0),
      evaluation: studentEval,
      hasEvaluation: !!studentEval
    };
  });

  const stats = {
    total: placements.length,
    active: placements.filter(p => p.status === 'ACTIVE').length,
    completed: placements.filter(p => p.status === 'COMPLETED').length,
    pending: placements.filter(p => p.status === 'PENDING').length,
  };

  return (
    <DashboardLayout>
      <PageHeader 
        title="Direct Supervision"
        subtitle="Detailed tracking for students assigned directly to your academic oversight."
        actions={
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-400'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-400'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        }
      />

      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="My Students" value={stats.total} icon={<UserCheck />} color="text-slate-500" />
          <StatCard title="Active In Field" value={stats.active} icon={<CheckCircle2 />} color="text-emerald-500" />
          <StatCard title="Finished" value={stats.completed} icon={<TrendingUp />} color="text-indigo-500" />
          <StatCard title="Avg Logs" value={Math.round(logs.length / (placements.length || 1))} icon={<Clock />} color="text-amber-500" />
        </div>

        {/* Filters */}
        <Card className="p-4" variant="glass">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Find a student..."
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
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-primary outline-none transition-all appearance-none"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                Direct Supervision
              </span>
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Syncing student profiles...</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studentStats.map(({ placement, logsCount, approvedLogs, totalHours, evaluation, hasEvaluation }) => (
              <StudentGridCard 
                key={placement.id}
                placement={placement}
                logsCount={logsCount}
                approvedLogs={approvedLogs}
                totalHours={totalHours}
                evaluation={evaluation}
                hasEvaluation={hasEvaluation}
              />
            ))}
          </div>
        ) : (
          <Card className="p-0 overflow-hidden" variant="panel">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Position</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Workplace</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Progress</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Evaluation</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {studentStats.map(({ placement, logsCount, approvedLogs, totalHours, evaluation, hasEvaluation }) => (
                    <tr key={placement.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {placement.student?.first_name} {placement.student?.last_name}
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium">ID: {placement.student?.student_id}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-700 dark:text-slate-300">{placement.position_title}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-700 dark:text-slate-300">{placement.workplace?.name}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-black text-primary">
                            {Math.round(logsCount > 0 ? (approvedLogs / logsCount) * 100 : 0)}%
                          </span>
                          <div className="w-16 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${logsCount > 0 ? (approvedLogs / logsCount) * 100 : 0}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Statusbar status={placement.status} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        {hasEvaluation ? (
                          <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center mx-auto text-[10px] font-black">
                            {evaluation?.final_grade}
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/dashboard/academic/students/${placement.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </Link>
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

function StatCard({ title, value, icon, color }: any) {
  return (
    <Card className="p-6 relative overflow-hidden group" hoverable>
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

function StudentGridCard({ placement, logsCount, approvedLogs, totalHours, evaluation, hasEvaluation }: any) {
  const progress = logsCount > 0 ? (approvedLogs / logsCount) * 100 : 0;
  
  return (
    <Card className="overflow-hidden border-t-4 border-t-primary hover:shadow-xl transition-all duration-500 group" variant="panel">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-primary font-black text-lg border border-slate-100 dark:border-slate-800">
              {placement.student?.first_name[0]}{placement.student?.last_name[0]}
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                {placement.student?.first_name} {placement.student?.last_name}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {placement.student?.student_id}</p>
            </div>
          </div>
          <Statusbar status={placement.status} />
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
            <Briefcase className="w-4 h-4 text-slate-400" />
            <span className="font-bold">{placement.position_title}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>{placement.workplace?.name}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Log Progress</span>
            <span className="text-[10px] font-black text-primary">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div className="w-full h-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">L{i}</div>
              </div>
            ))}
            <div className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-[8px] font-bold text-slate-400">+{logsCount}</div>
          </div>
          <Link href={`/dashboard/academic/students/${placement.id}`}>
            <Button size="sm" variant="ghost" className="h-8 px-2 text-[10px] font-black uppercase tracking-widest hover:text-primary">
              Details <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

  