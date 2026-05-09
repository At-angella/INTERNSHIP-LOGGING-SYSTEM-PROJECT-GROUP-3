'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout, PageHeader, Statusbar } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { InternshipPlacement, WeeklyLog } from '@/lib/types';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  MessageSquare, 
  Calendar, 
  User, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  FileText
} from 'lucide-react';

export default function LogsPage() {
  const { user } = useAuth();
  const [placements, setPlacements] = useState<InternshipPlacement[]>([]);
  const [logs, setLogs] = useState<WeeklyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('PENDING');
  const [filterStudent, setFilterStudent] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<WeeklyLog | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [placementsData, logsData] = await Promise.all([
          api.getPlacements(),
          api.getWeeklyLogs(),
        ]);
        
        setPlacements(placementsData.results || placementsData || []);
        setLogs(logsData.results || logsData || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) fetchData();
  }, [user]);

   const filteredLogs = logs.filter(log => {
    let statusMatch = true;
    if (filterStatus === 'PENDING') statusMatch = log.status !== 'APPROVED' && log.status !== 'REJECTED';
    else if (filterStatus === 'APPROVED') statusMatch = log.status === 'APPROVED';
    else if (filterStatus === 'REJECTED') statusMatch = log.status === 'REJECTED';
    
    const studentMatch = filterStudent === 'ALL' || log.placement?.id === parseInt(filterStudent);
    return statusMatch && studentMatch;
  });

  const stats = {
    pending: logs.filter(l => l.status !== 'APPROVED' && l.status !== 'REJECTED').length,
    approved: logs.filter(l => l.status === 'APPROVED').length,
    rejected: logs.filter(l => l.status === 'REJECTED').length,
    total: logs.length,
  };

  const uniqueStudents = Array.from(
    new Map(placements.map(p => [p.id, { id: p.id, name: `${p.student?.first_name} ${p.student?.last_name}` }])).values()
  );

  const handleSubmitReview = () => {
    if (selectedLog && reviewAction) {
      const updatedLogs = logs.map(log =>
        log.id === selectedLog.id
          ? { ...log, status: reviewAction === 'APPROVE' ? 'APPROVED' : 'REJECTED', reviewer_comments: reviewComment }
          : log
      );
      setLogs(updatedLogs);
      setSelectedLog(null);
      setReviewAction(null);
      setReviewComment('');
    }
     };

  return (
    <DashboardLayout>
      <PageHeader 
        title="Weekly Logs Review"
        subtitle="Approve or reject student logbook submissions for the current internship cycle."
        actions={
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
            {['PENDING', 'APPROVED', 'REJECTED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterStatus === status ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-400'}`}
              >
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        }
      />

       <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Awaiting Review" value={stats.pending} icon={<Clock />} color="text-amber-500" highlight={stats.pending > 0} />
          <StatCard title="Approved" value={stats.approved} icon={<CheckCircle2 />} color="text-emerald-500" />
          <StatCard title="Rejected" value={stats.rejected} icon={<AlertCircle />} color="text-rose-500" />
          <StatCard title="Total Logs" value={stats.total} icon={<FileText />} color="text-slate-500" />
        </div>

 {/* Filters */}
        <Card className="p-4" variant="glass">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={filterStudent}
                onChange={(e) => setFilterStudent(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="ALL">All Supervised Students</option>
                {uniqueStudents.map(student => (
                  <option key={student.id} value={student.id}>{student.name}</option>
                ))}
              </select>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg inline-block">
                Showing {filteredLogs.length} Submissions
              </p>
            </div>
          </div>
        </Card>