'use client';
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
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function StudentsPage() {
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
    pending: placements.filter(p => p.status === 'PENDING' || p.status === 'ON_HOLD').length,
  };

  return (
    <DashboardLayout>
      <PageHeader 
        title="My Students"
        subtitle="Manage and track the progress of all interns assigned to your supervision."
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
          <QuickStatCard title="Total" value={stats.total} icon={<GraduationCap />} color="text-slate-500" />
          <QuickStatCard title="Active" value={stats.active} icon={<CheckCircle2 />} color="text-emerald-500" />
          <QuickStatCard title="Completed" value={stats.completed} icon={<TrendingUp />} color="text-indigo-500" />
          <QuickStatCard title="Attention" value={stats.pending} icon={<AlertCircle />} color="text-amber-500" highlight={stats.pending > 0} />
        </div>

        {/* Filters */}
        <Card className="p-4" variant="glass">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or ID..."
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
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="ON_HOLD">On Hold</option>
              </select>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Showing {studentStats.length} Students
              </p>
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Loading student data...</p>
          </div>
        ) : studentStats.length === 0 ? (
          <Card className="p-20 text-center" variant="panel">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No matches found</h3>
            <p className="text-slate-500 text-sm">Try adjusting your search terms or filters.</p>
          </Card>
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
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Organization</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Logs</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Hours</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Grade</th>
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
                        <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold">
                          {approvedLogs}/{logsCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-xs font-black text-slate-900 dark:text-white">{totalHours}h</td>
                      <td className="px-6 py-4">
                        <Statusbar status={placement.status} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        {hasEvaluation ? (
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center mx-auto text-xs font-black">
                            {evaluation?.final_grade}
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400">PENDING</span>
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
