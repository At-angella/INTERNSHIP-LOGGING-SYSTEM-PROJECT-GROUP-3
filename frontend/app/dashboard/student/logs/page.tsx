'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { DashboardLayout, PageHeader, Statusbar } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';
import { WeeklyLog } from '@/lib/types';
import Link from 'next/link';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

export default function StudentLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<WeeklyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.getWeeklyLogs();
        const logsData = data.results || data || [];
        setLogs(logsData);

        // Show notifications for status changes
        logsData.forEach((log: WeeklyLog) => {
          if (log.status === 'APPROVED') {
            toast.success(`✓ Week ${log.week_number} approved!`, {
              position: 'top-right',
              autoClose: 3000,
            });
          } else if (log.status === 'REJECTED') {
            toast.error(`✗ Week ${log.week_number} needs revision`, {
              position: 'top-right',
              autoClose: 5000,
            });
          } else if (log.status === 'REVISE') {
            toast.warning(`⚠ Week ${log.week_number} - Revision requested`, {
              position: 'top-right',
              autoClose: 5000,
            });
          }
        });
      } catch (error) {
        console.error('Failed to fetch logs:', error);
        toast.error('✗ Failed to load logs');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  const filteredLogs = logs.filter(l => 
    l.activities_performed?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.week_number.toString().includes(searchTerm)
  );

  return (
    <DashboardLayout>
      <PageHeader 
        title="Weekly Logs Registry"
        subtitle="Maintain and submit your professional activity reports for verification."
        actions={
          <Link href="/dashboard/student/logs/new">
            <Button className="gap-2 bg-primary">
              <Plus className="w-4 h-4" />
              Submit New Log
            </Button>
          </Link>
        }
      />

      <div className="space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Submitted" value={logs.length} icon={<FileText />} color="text-slate-500" />
          <StatCard title="Validated" value={logs.filter(l => l.status === 'APPROVED').length} icon={<CheckCircle2 />} color="text-emerald-500" />
          <StatCard title="Awaiting Review" value={logs.filter(l => l.status === 'SUBMITTED').length} icon={<Clock />} color="text-amber-500" />
          <StatCard title="Action Required" value={logs.filter(l => l.status === 'REJECTED' || l.status === 'REVISE').length} icon={<AlertCircle />} color="text-rose-500" highlight={logs.filter(l => l.status === 'REJECTED' || l.status === 'REVISE').length > 0} />
        </div>

        {/* Filter Bar */}
        <Card className="p-4" variant="glass">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search activity description or week number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>
        </Card>

        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Retrieving Activity History...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredLogs.map(log => (
              <LogListCard key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, icon, color, highlight = false }: any) {
  return (
    <Card className={`p-6 relative overflow-hidden group ${highlight ? 'ring-2 ring-rose-500/50 animate-pulse' : ''}`} hoverable>
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

function LogListCard({ log }: { log: WeeklyLog }) {
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'DRAFT': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
      case 'SUBMITTED': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'REVIEWED': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'APPROVED': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'REJECTED': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'REVISE': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'APPROVED': return <CheckCircle2 className="w-4 h-4" />;
      case 'SUBMITTED': return <Clock className="w-4 h-4" />;
      case 'REJECTED': return <AlertCircle className="w-4 h-4" />;
      case 'REVISE': return <AlertCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <Link href={`/dashboard/student/logs/${log.id}`}>
      <Card className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all" variant="panel">
        <div className="flex flex-col md:flex-row">
          <div className="p-6 md:w-64 bg-slate-50 dark:bg-slate-900/50 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center md:flex-col md:items-start gap-4">
              <div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">Week {log.week_number}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">End: {new Date(log.week_end_date).toLocaleDateString()}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 ${getStatusColor(log.status)}`}>
                {getStatusIcon(log.status)}
                {log.status}
              </div>
            </div>
            <div className="mt-6 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-xl font-black text-slate-900 dark:text-white leading-none">{log.hours_worked}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Hours</span>
            </div>
          </div>
          
          <div className="p-6 flex-1 flex flex-col justify-between">
            <div>
              <h5 className="text-[9px] font-black text-primary uppercase tracking-widest mb-2">Key Activities</h5>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                {log.activities_performed}
              </p>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold text-slate-400 uppercase">Submitted</span>
                  <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">
                    {log.submitted_at ? new Date(log.submitted_at).toLocaleDateString() : 'Not yet'}
                  </span>
                </div>
                {(log.status === 'REJECTED' || log.status === 'REVISE') && (
                  <div className="flex flex-col ml-4 pl-4 border-l border-red-200 dark:border-red-900">
                    <span className="text-[8px] font-bold text-red-500 uppercase">Action Required</span>
                    <span className="text-[10px] font-black text-red-600 dark:text-red-400">Review & Resubmit</span>
                  </div>
                )}
              </div>
              <Button variant="ghost" size="sm" className="h-9 px-4 text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
                View Details
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
