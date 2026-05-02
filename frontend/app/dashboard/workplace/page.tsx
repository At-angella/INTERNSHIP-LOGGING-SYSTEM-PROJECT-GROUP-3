'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout, PageHeader, Statusbar } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { InternshipPlacement, WeeklyLog, Evaluation } from '@/lib/types';
import Link from 'next/link';
import { 
  Users, 
  FileCheck, 
  Award, 
  Plus, 
  TrendingUp, 
  Calendar,
  Clock,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function WorkplaceSupervisorDashboard() {
  const { user } = useAuth();
  const [placements, setPlacements] = useState<InternshipPlacement[]>([]);
  const [weeklyLogs, setWeeklyLogs] = useState<WeeklyLog[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [placementsData, logsData, evalsData] = await Promise.all([
          api.getPlacements(),
          api.getWeeklyLogs(),
          api.getEvaluations()
        ]);
        setPlacements(placementsData.results?.slice(0, 10) || placementsData.slice(0, 10) || []);
        setWeeklyLogs(logsData.results?.slice(0, 10) || logsData.slice(0, 10) || []);
        setEvaluations(evalsData.results || evalsData || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) fetchData();
  }, [user]);

  const pendingReviews = weeklyLogs.filter(l => l.status === 'SUBMITTED').length;
  const reviewedCount = weeklyLogs.filter(l => l.status === 'REVIEWED' || l.status === 'APPROVED').length;

  return (
    <DashboardLayout>
      <PageHeader 
        title={`Hello, ${user?.first_name} 👋`}
        subtitle="Review logbooks and track intern performance at your workplace."
        actions={
          <div className="flex gap-3">
            <Link href="/dashboard/workplace/reviews">
              <Button variant="outline" size="sm" className="gap-2">
                <FileCheck className="w-4 h-4" />
                Review Logs
              </Button>
            </Link>
            <Link href="/dashboard/workplace/evaluations/new">
              <Button size="sm" className="gap-2">
                <Award className="w-4 h-4" />
                New Evaluation
              </Button>
            </Link>
          </div>
        }
      />

      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard 
            title="Active Interns" 
            value={placements.length} 
            icon={<Users className="text-blue-500" />} 
            description="Assigned to you"
          />
          <StatCard 
            title="Awaiting Review" 
            value={pendingReviews} 
            icon={<Clock className="text-amber-500" />} 
            description="Submitted by students"
            highlight={pendingReviews > 0}
          />
          <StatCard 
            title="Reviewed This Week" 
            value={reviewedCount} 
            icon={<CheckCircle2 className="text-emerald-500" />} 
            description="Approval pending academic"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Interns List */}
          <Card className="lg:col-span-2 p-0 overflow-hidden" variant="panel">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-500" />
                My Interns
              </h3>
              <Link href="/dashboard/workplace/interns" className="text-xs font-bold text-primary hover:underline uppercase tracking-widest">
                Manage All
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Intern</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Position</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progress</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {placements.map(placement => (
                    <tr key={placement.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-sm text-slate-900 dark:text-white">
                        {placement.student?.first_name} {placement.student?.last_name}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">{placement.position_title}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden min-w-[60px]">
                            <div 
                              className="h-full bg-emerald-500 rounded-full" 
                              style={{ width: `${(placement.log_progress.approved_logs / placement.log_progress.total_logs) * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500">{placement.log_progress.approved_logs}/{placement.log_progress.total_logs}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/dashboard/workplace/interns/${placement.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pending Logs Feed */}
          <div className="space-y-6">
            <Card className="p-6" variant="glass">
              <h3 className="font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Latest Submissions
              </h3>
              <div className="space-y-4">
                {weeklyLogs.filter(l => l.status === 'SUBMITTED').slice(0, 4).map(log => (
                  <div key={log.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-primary/30 transition-all group">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Week {log.week_number}</p>
                      <Statusbar status={log.status} />
                    </div>
                    <p className="text-[11px] font-bold text-slate-500 mb-2 truncate">{log.placement?.student?.first_name} {log.placement?.student?.last_name}</p>
                    <Link href={`/dashboard/workplace/reviews/${log.id}`}>
                      <Button variant="outline" size="sm" className="w-full h-8 text-[10px] font-bold uppercase tracking-widest group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
                        Review Now
                      </Button>
                    </Link>
                  </div>
                ))}
                {pendingReviews === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500/30 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 font-medium">All caught up!</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6 bg-linear-to-br from-emerald-600 to-emerald-800 text-white shadow-xl shadow-emerald-500/20">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-5 h-5" />
                <h4 className="font-bold">Evaluation Period</h4>
              </div>
              <p className="text-emerald-100 text-xs mb-4">Final workplace assessments are due by June 30th for all semester 2 interns.</p>
              <Button variant="ghost" className="text-white hover:bg-white/10 w-full font-bold text-[10px] uppercase tracking-widest">
                Guidelines & Criteria
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, icon, description, highlight = false }: { title: string, value: number, icon: React.ReactNode, description: string, highlight?: boolean }) {
  return (
    <Card className={`p-6 border-b-4 ${highlight ? 'border-b-amber-500 animate-pulse' : 'border-b-transparent'}`} hoverable>
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl">
          {icon}
        </div>
        <span className="text-3xl font-black text-slate-900 dark:text-white">{value}</span>
      </div>
      <div>
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</h4>
        <p className="text-xs font-medium text-slate-500">{description}</p>
      </div>
    </Card>
  );
}
