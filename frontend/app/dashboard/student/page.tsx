'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout, PageHeader, Statusbar } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { InternshipPlacement, WeeklyLog, Evaluation } from '@/lib/types';
import Link from 'next/link';
import { 
  FileText, 
  Calendar, 
  Briefcase, 
  GraduationCap, 
  Plus, 
  ArrowRight,
  TrendingUp,
  Clock,
  Award
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [placement, setPlacement] = useState<InternshipPlacement | null>(null);
  const [recentLogs, setRecentLogs] = useState<WeeklyLog[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const placements = await api.getPlacements({ student_id: user?.id });
        if (placements.results?.length) {
          setPlacement(placements.results[0]);
          const logs = await api.getWeeklyLogs({ placement_id: placements.results[0].id });
          setRecentLogs(logs.results?.slice(0, 5) || []);
        }
        const evals = await api.getEvaluations();
        setEvaluations(evals.results?.slice(0, 3) || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  return (
    <DashboardLayout>
      <PageHeader 
        title={`Welcome, ${user?.first_name}!`}
        subtitle="Track and manage your internship progress seamlessly."
        actions={
          <Link href="/dashboard/student/logs/new">
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              New Weekly Log
            </Button>
          </Link>
        }
      />

      <div className="space-y-10">
        {/* Placement Overview */}
        <section>
          {placement ? (
            <Card className="p-8" variant="panel">
              <div className="flex flex-col lg:flex-row gap-10">
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">{placement.position_title}</h2>
                      <p className="text-slate-500 text-sm">{placement.workplace.name}</p>
                    </div>
                    <div className="ml-auto">
                      <Statusbar status={placement.status} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Academic Supervisor</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {placement.academic_supervisor.first_name} {placement.academic_supervisor.last_name}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Workplace Supervisor</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {placement.workplace_supervisor.first_name} {placement.workplace_supervisor.last_name}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Internship Period</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {new Date(placement.start_date).toLocaleDateString()} - {new Date(placement.end_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="lg:w-80 flex flex-col justify-center p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <Statusbar 
                    progress={Math.round((placement.log_progress.approved_logs / placement.log_progress.total_logs) * 100) || 0} 
                    label="Logbook Progress"
                  />
                  <p className="mt-4 text-center text-xs font-bold text-slate-500 uppercase tracking-tighter">
                    {placement.log_progress.approved_logs} of {placement.log_progress.total_logs} logs approved
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center text-amber-600 mx-auto mb-4">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-amber-900 dark:text-amber-200 mb-2">No Active Placement</h3>
              <p className="text-amber-700 dark:text-amber-400 max-w-md mx-auto">
                You don't have an active internship placement yet. Please contact your academic supervisor or department administrator.
              </p>
            </Card>
          )}
        </section>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <QuickActionCard 
            title="Submit Log" 
            icon={<Plus className="w-6 h-6" />} 
            href="/dashboard/student/logs/new"
            color="bg-primary"
          />
          <QuickActionCard 
            title="View History" 
            icon={<FileText className="w-6 h-6" />} 
            href="/dashboard/student/logs"
            color="bg-emerald-500"
          />
          <QuickActionCard 
            title="Final Result" 
            icon={<Award className="w-6 h-6" />} 
            href="/dashboard/student/evaluations"
            color="bg-amber-500"
          />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Logs */}
          <Card className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <TrendingUp className="text-primary w-5 h-5" />
                <h3 className="text-lg font-bold">Recent Logs</h3>
              </div>
              <Link href="/dashboard/student/logs" className="text-xs font-bold text-primary hover:underline uppercase tracking-widest">
                See All
              </Link>
            </div>

            {recentLogs.length === 0 ? (
              <div className="text-center py-10 opacity-50">
                <FileText className="w-10 h-10 mx-auto mb-2" />
                <p className="text-sm">No logs submitted yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentLogs.map(log => (
                  <div key={log.id} className="group p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-primary/30 transition-colors">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Week {log.week_number}</p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {new Date(log.week_start_date).toLocaleDateString()} - {new Date(log.week_end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Statusbar status={log.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Evaluation Summary */}
          <Card className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Award className="text-amber-500 w-5 h-5" />
                <h3 className="text-lg font-bold">Latest Evaluation</h3>
              </div>
              <Link href="/dashboard/student/evaluations" className="text-xs font-bold text-primary hover:underline uppercase tracking-widest">
                Full Details
              </Link>
            </div>

            {evaluations.length === 0 ? (
              <div className="text-center py-10 opacity-50">
                <GraduationCap className="w-10 h-10 mx-auto mb-2" />
                <p className="text-sm">No evaluations published yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {evaluations.map(evalu => (
                  <div key={evalu.id} className="relative overflow-hidden p-6 rounded-2xl bg-linear-to-br from-slate-900 to-slate-800 text-white shadow-xl">
                    <div className="relative z-10">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Final Grade</p>
                          <p className="text-5xl font-black">{evalu.final_grade}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Score</p>
                          <p className="text-2xl font-bold">{evalu.total_weighted_score.toFixed(1)}<span className="text-xs text-slate-500">/100</span></p>
                        </div>
                      </div>
                      <div className="mt-6 pt-6 border-t border-white/10">
                        <p className="text-xs text-slate-300 italic">"{evalu.summary_comments}"</p>
                      </div>
                    </div>
                    {/* Decorative element */}
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function QuickActionCard({ title, icon, href, color }: { title: string, icon: React.ReactNode, href: string, color: string }) {
  return (
    <Link href={href}>
      <Card className="p-6 group flex items-center gap-4 border-slate-100 hover:border-primary/30" hoverable>
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white leading-none">{title}</h4>
          <div className="flex items-center gap-1 text-[10px] text-primary font-bold uppercase tracking-widest mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            Open <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </Card>
    </Link>
  );
}