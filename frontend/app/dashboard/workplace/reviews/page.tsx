'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout, PageHeader, Statusbar } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { WeeklyLog } from '@/lib/types';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  MessageSquare, 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  FileText,
  User,
  ArrowRight
} from 'lucide-react';

export default function ReviewsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<WeeklyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('PENDING');
  const [selectedLog, setSelectedLog] = useState<WeeklyLog | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT' | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const logsData = await api.getWeeklyLogs();
        setLogs(logsData.results || logsData || []);
      } catch (error) {
        console.error('Failed to fetch logs:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) fetchData();
  }, [user]);

  const filteredLogs = logs.filter(log => {
    if (filterStatus === 'PENDING') return log.status !== 'APPROVED' && log.status !== 'REJECTED';
    if (filterStatus === 'APPROVED') return log.status === 'APPROVED';
    if (filterStatus === 'REJECTED') return log.status === 'REJECTED';
    return true;
  });

  const stats = {
    pending: logs.filter(l => l.status !== 'APPROVED' && l.status !== 'REJECTED').length,
    approved: logs.filter(l => l.status === 'APPROVED').length,
    rejected: logs.filter(l => l.status === 'REJECTED').length,
    total: logs.length,
  };

  const handleOpenReview = (log: WeeklyLog, action: 'APPROVE' | 'REJECT') => {
    setSelectedLog(log);
    setReviewAction(action);
    setReviewComment('');
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedLog || !reviewAction) return;
    setLogs(logs.map(log =>
      log.id === selectedLog.id
        ? { ...log, status: reviewAction === 'APPROVE' ? 'APPROVED' : 'REJECTED' }
        : log
    ));
    setShowReviewModal(false);
    setSelectedLog(null);
  };

  return (
    <DashboardLayout>
      <PageHeader 
        title="Weekly Review Board"
        subtitle="Verify and validate student technical activities and skill acquisition logs."
        actions={
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
            {['PENDING', 'APPROVED', 'REJECTED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all uppercase tracking-tighter ${filterStatus === status ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-400'}`}
              >
                {status}
              </button>
            ))}
          </div>
        }
      />

      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Review Queue" value={stats.pending} icon={<Clock />} color="text-amber-500" highlight={stats.pending > 0} />
          <StatCard title="Validated" value={stats.approved} icon={<CheckCircle2 />} color="text-emerald-500" />
          <StatCard title="Sent Back" value={stats.rejected} icon={<AlertCircle />} color="text-rose-500" />
          <StatCard title="Total Submissions" value={stats.total} icon={<FileText />} color="text-slate-500" />
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Processing Log History...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <Card className="p-20 text-center" variant="panel">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Board clear!</h3>
            <p className="text-slate-500 text-sm">No submissions match the current status filter.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredLogs.map(log => (
              <ReviewItemCard key={log.id} log={log} onAction={handleOpenReview} />
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-lg p-0 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300" variant="panel">
            <div className={`p-6 border-b border-slate-100 dark:border-slate-800 ${reviewAction === 'APPROVE' ? 'bg-emerald-50/50 dark:bg-emerald-900/20' : 'bg-rose-50/50 dark:bg-rose-900/20'}`}>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                {reviewAction === 'APPROVE' ? 'Approve Log Entry' : 'Reject Log Entry'}
              </h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                Confirming Week {selectedLog.week_number} for {selectedLog.placement?.student?.first_name}
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {reviewAction === 'APPROVE' 
                  ? "Are you sure you want to approve this log? This confirms the student's activities and hours for the week."
                  : "Please provide a reason for rejection so the student can update their log accordingly."}
              </p>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Write your feedback here..."
                className="w-full p-4 text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none transition-all min-h-[120px] resize-none"
              />
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setShowReviewModal(false)}>
                Cancel
              </Button>
              <Button 
                className={`flex-1 ${reviewAction === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`} 
                onClick={handleSubmitReview}
              >
                Confirm {reviewAction === 'APPROVE' ? 'Approval' : 'Rejection'}
              </Button>
            </div>
          </Card>
        </div>
      )}
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

function ReviewItemCard({ log, onAction }: { log: WeeklyLog, onAction: (log: WeeklyLog, action: 'APPROVE' | 'REJECT') => void }) {
  const isPending = log.status !== 'APPROVED' && log.status !== 'REJECTED';
  
  return (
    <Card className="overflow-hidden group" variant="panel">
      <div className="flex flex-col lg:flex-row">
        <div className="p-6 lg:w-1/3 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center font-black">
              {log.placement?.student?.first_name[0]}{log.placement?.student?.last_name[0]}
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                {log.placement?.student?.first_name} {log.placement?.student?.last_name}
              </h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Week {log.week_number} Submission</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-bold text-slate-400 uppercase">Period</span>
              <span className="font-black text-slate-700 dark:text-slate-300">Week Ending {new Date(log.week_end_date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-bold text-slate-400 uppercase">Volume</span>
              <span className="font-black text-slate-700 dark:text-slate-300">{log.hours_worked} Hours</span>
            </div>
            <Statusbar status={log.status} />
          </div>
        </div>
        
        <div className="p-6 flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="text-[9px] font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-1">
                <FileText className="w-3 h-3" /> Core Activities
              </h5>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{log.activities_performed}</p>
            </div>
            <div>
              <h5 className="text-[9px] font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Skills Acquired
              </h5>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{log.skills_acquired || log.skills_gained || "N/A"}</p>
            </div>
          </div>
          
          {log.challenges_faced && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
              <h5 className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Blockers & Challenges
              </h5>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">{log.challenges_faced}</p>
            </div>
          )}

          {isPending ? (
            <div className="flex gap-3 pt-4">
              <Button variant="ghost" className="flex-1 h-10 border-rose-100 dark:border-rose-900/30 text-rose-600 hover:bg-rose-50" onClick={() => onAction(log, 'REJECT')}>
                Reject
              </Button>
              <Button className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700" onClick={() => onAction(log, 'APPROVE')}>
                Approve Entry
              </Button>
            </div>
          ) : log.reviewer_comments && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Final Feedback</p>
              <p className="text-xs text-slate-500 italic">"{log.reviewer_comments}"</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
