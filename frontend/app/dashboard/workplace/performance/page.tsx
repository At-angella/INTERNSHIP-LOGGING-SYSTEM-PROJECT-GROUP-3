'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout, PageHeader, Statusbar } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { InternshipPlacement, WeeklyLog, Evaluation } from '@/lib/types';
import { 
  TrendingUp, 
  Award, 
  Target, 
  Zap, 
  ChevronRight, 
  User, 
  Search, 
  BarChart3,
  CheckCircle2,
  Clock,
  Briefcase,
  Activity,
  Star,
  Users,
  LayoutGrid,
  List
} from 'lucide-react';

export default function PerformancePage() {
  const { user } = useAuth();
  const [placements, setPlacements] = useState<InternshipPlacement[]>([]);
  const [logs, setLogs] = useState<WeeklyLog[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'rating' | 'hours' | 'logs' | 'name'>('rating');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

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
        console.error('Failed to fetch performance data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) fetchData();
  }, [user]);

  const studentPerformance = placements.map(placement => {
    const studentLogs = logs.filter(l => l.placement?.id === placement.id);
    const studentEval = evaluations.find(e => e.placement?.id === placement.id);
    const approvedLogs = studentLogs.filter(l => l.status === 'APPROVED').length;
    const totalHours = studentLogs.reduce((sum, l) => sum + (l.hours_worked || 0), 0);
    
    const overallRating = studentEval
      ? (studentEval.technical_score + studentEval.soft_skills_score + studentEval.attendance_score + studentEval.conduct_score) / 4
      : 0;

    return {
      id: placement.id,
      studentName: `${placement.student?.first_name} ${placement.student?.last_name}`,
      studentId: placement.student?.student_id,
      position: placement.position_title,
      totalLogs: studentLogs.length,
      approvedLogs,
      logCompletionRate: studentLogs.length > 0 ? (approvedLogs / studentLogs.length) * 100 : 0,
      totalHours,
      technicalScore: studentEval?.technical_score || 0,
      softSkillsScore: studentEval?.soft_skills_score || 0,
      attendanceScore: studentEval?.attendance_score || 0,
      conductScore: studentEval?.conduct_score || 0,
      overallRating,
      grade: studentEval?.final_grade || 'N/A',
    };
  });

  const sortedPerformance = [...studentPerformance].sort((a, b) => {
    if (sortBy === 'rating') return b.overallRating - a.overallRating;
    if (sortBy === 'hours') return b.totalHours - a.totalHours;
    if (sortBy === 'logs') return b.approvedLogs - a.approvedLogs;
    if (sortBy === 'name') return a.studentName.localeCompare(b.studentName);
    return 0;
  });

  const overallStats = {
    avgPerformance: studentPerformance.length > 0 
      ? (studentPerformance.reduce((sum, s) => sum + s.overallRating, 0) / studentPerformance.length).toFixed(1)
      : 0,
    avgLogCompletion: studentPerformance.length > 0
      ? (studentPerformance.reduce((sum, s) => sum + s.logCompletionRate, 0) / studentPerformance.length).toFixed(1)
      : 0,
    totalHoursLogged: studentPerformance.reduce((sum, s) => sum + s.totalHours, 0),
    highPerformers: studentPerformance.filter(s => s.overallRating >= 80).length
  };

  return (
    <DashboardLayout>
      <PageHeader 
        title="Performance Analytics"
        subtitle="Detailed metrics and professional ratings for all interns under your organization's supervision."
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
          <StatCard title="Corporate Average" value={`${overallStats.avgPerformance}%`} icon={<Award />} color="text-indigo-500" />
          <StatCard title="Sync Completion" value={`${overallStats.avgLogCompletion}%`} icon={<Activity />} color="text-emerald-500" />
          <StatCard title="Billed Hours" value={overallStats.totalHoursLogged} icon={<Clock />} color="text-amber-500" />
          <StatCard title="High Achievers" value={overallStats.highPerformers} icon={<Star />} color="text-rose-500" highlight={overallStats.highPerformers > 0} />
        </div>

        {/* Filters */}
        <Card className="p-4" variant="glass">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="flex items-center gap-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Sort Analysis By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="rating">Professional Rating</option>
                <option value="hours">Hours Logged</option>
                <option value="logs">Log Consistency</option>
                <option value="name">Intern Name</option>
              </select>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                Showing {sortedPerformance.length} Individual Reports
              </span>
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Compiling Professional Metrics...</p>
          </div>
        ) : viewMode === 'table' ? (
          <Card className="p-0 overflow-hidden" variant="panel">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Intern</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Score</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Tech</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Soft</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Logs</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Hours</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sortedPerformance.map(student => (
                    <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{student.studentName}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{student.position}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-xs font-black ${student.overallRating >= 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {student.overallRating.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-xs font-bold text-slate-700 dark:text-slate-300">{student.technicalScore}</td>
                      <td className="px-6 py-4 text-center text-xs font-bold text-slate-700 dark:text-slate-300">{student.softSkillsScore}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[9px] font-black">
                          {student.approvedLogs}/{student.totalLogs}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-xs font-black text-slate-900 dark:text-white">{student.totalHours}h</td>
                      <td className="px-6 py-4 text-center">
                        <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center mx-auto text-[10px] font-black">
                          {student.grade}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedPerformance.map(student => (
              <StudentPerformanceCard key={student.id} student={student} />
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

function StudentPerformanceCard({ student }: { student: any }) {
  return (
    <Card className="overflow-hidden border-t-4 border-t-slate-200 dark:border-t-slate-800 hover:border-t-primary transition-all duration-300" variant="panel">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">{student.studentName}</h3>
          <p className="text-[9px] font-bold text-primary uppercase tracking-widest mt-1">{student.position}</p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-lg shadow-lg">
          {student.grade}
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
            <span className="text-slate-400">Professional Index</span>
            <span className="text-primary">{student.overallRating.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-1000"
              style={{ width: `${student.overallRating}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <PerformanceMetric label="Technical" score={student.technicalScore} />
          <PerformanceMetric label="Soft Skills" score={student.softSkillsScore} />
          <PerformanceMetric label="Attendance" score={student.attendanceScore} />
          <PerformanceMetric label="Conduct" score={student.conductScore} />
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Logs</p>
              <p className="text-xs font-black text-slate-900 dark:text-white">{student.approvedLogs}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Hours</p>
              <p className="text-xs font-black text-slate-900 dark:text-white">{student.totalHours}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function PerformanceMetric({ label, score }: any) {
  return (
    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">{label}</p>
      <p className="text-xs font-black text-slate-900 dark:text-white">{score || 0}</p>
    </div>
  );
}
