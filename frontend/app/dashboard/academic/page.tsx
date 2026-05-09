'use client';
import React, { useState, useEffect } from 'react';
import { DashboardLayout, PageHeader, Statusbar } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { InternshipPlacement, WeeklyLog, Evaluation } from '@/lib/types';
import Link from 'next/link';
import { 
  GraduationCap, 
  FileText, 
  ClipboardCheck, 
  Search, 
  TrendingUp, 
  Calendar,
  AlertCircle,
  Users,
  ChevronRight,
  Plus,
  BarChart3
} from 'lucide-react';

export default function AcademicDashboard() {
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
        setWeeklyLogs(logsData.results?.slice(0, 8) || logsData.slice(0, 8) || []);
        setEvaluations(evalsData.results || evalsData || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

      if (user) fetchData();
  }, [user]);

const pendingApprovals = weeklyLogs.filter(l => l.status === 'REVIEWED').length;

  return (
    <DashboardLayout>
      <PageHeader 
        title={`Good morning, ${user?.first_name} 👋`}
        subtitle="Overview of your supervised students and pending approvals."
        actions={
          <div className="flex gap-3">
            <Link href="/dashboard/academic/students">
              <Button variant="outline" size="sm" className="gap-2">
                <Users className="w-4 h-4" />
                Student List
              </Button>
            </Link>
            <Link href="/dashboard/academic/reports">
              <Button size="sm" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Final Reports
              </Button>
            </Link>
          </div>
        }
      />

      <div className="space-y-8">
        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="My Students" value={placements.length} icon={<GraduationCap />} color="text-primary" />
          <StatCard title="Log Approvals" value={pendingApprovals} icon={<ClipboardCheck />} color="text-amber-500" highlight={pendingApprovals > 0} />
          <StatCard title="Total Logs" value={weeklyLogs.length} icon={<FileText />} color="text-indigo-500" />
          <StatCard title="Evaluations" value={evaluations.length} icon={<ClipboardCheck />} color="text-emerald-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main List */}
          <Card className="lg:col-span-2 p-0 overflow-hidden" variant="panel">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Supervised Students
              </h3>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search student..." 
                    className="pl-9 pr-4 py-1.5 text-xs rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student Details</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Workplace</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progress</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {placements.map(placement => (
                    <tr key={placement.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{placement.student?.first_name} {placement.student?.last_name}</span>
                          <span className="text-[10px] text-slate-500 font-medium tracking-tight uppercase tracking-tighter opacity-70">ID: {placement.student?.student_id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{placement.workplace?.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full" 
                              style={{ width: `${(placement.log_progress.approved_logs / placement.log_progress.total_logs) * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500">{placement.log_progress.approved_logs}/{placement.log_progress.total_logs}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/dashboard/academic/students/${placement.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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