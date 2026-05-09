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

        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Fetching logbooks...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <Card className="p-20 text-center" variant="panel">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">All caught up!</h3>
            <p className="text-slate-500 text-sm">No logs found for the selected filters.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredLogs.map(log => (
              <LogReviewCard key={log.id} log={log} onReview={() => setSelectedLog(log)} />
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-lg p-0 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300" variant="panel">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Review Submission</h2>
              <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1">Week {selectedLog.week_number} • {selectedLog.placement?.student?.first_name} {selectedLog.placement?.student?.last_name}</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setReviewAction('APPROVE')}
                  className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${reviewAction === 'APPROVE' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-bold">Approve</span>
                </button>
                <button
                  onClick={() => setReviewAction('REJECT')}
                  className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${reviewAction === 'REJECT' ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-600' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}
                >
                  <XCircle className="w-5 h-5" />
                  <span className="font-bold">Reject</span>
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Feedback Comment</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Provide guidance or feedback to the student..."
                  className="w-full p-4 text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none transition-all min-h-[120px] resize-none"
                />
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => { setSelectedLog(null); setReviewAction(null); setReviewComment(''); }}>
                Cancel
              </Button>
              <Button className="flex-1" disabled={!reviewAction} onClick={handleSubmitReview}>
                Submit Review
              </Button>
            </div>
          </Card>
        </div>
      )}