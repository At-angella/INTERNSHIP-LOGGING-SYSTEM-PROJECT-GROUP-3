'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { DashboardLayout, PageHeader, Statusbar } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Evaluation } from '@/lib/types';
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
  const [logs, setLogs] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('PENDING');
  const [selectedLog, setSelectedLog] = useState<Evaluation | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.getEvaluations();
        setLogs(data.results || data || []);
      } catch (error) {
        console.error('Failed to fetch evaluations:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) fetchData();
  }, [user]);

  const filteredLogs = logs.filter(log => {
    if (filterStatus === 'PENDING') return !log.is_submitted;
    if (filterStatus === 'SUBMITTED') return log.is_submitted;
    return true;
  });

  const stats = {
    pending: logs.filter(l => !l.is_submitted).length,
    submitted: logs.filter(l => l.is_submitted).length,
    total: logs.length,
    avgScore: logs.length
      ? Math.round(logs.reduce((sum, l) => sum + (l.total_weighted_score || 0), 0) / logs.length)
      : 0,
  };

  const handleOpenDetails = (log: Evaluation) => {
    setSelectedLog(log);
    setShowModal(true);
  };

  const handleSubmitEvaluation = async (evalToSubmit?: Evaluation) => {
    const target = evalToSubmit ?? selectedLog;
    if (!target) return;
    try {
      await api.submitEvaluation(target.id);
      setLogs(logs.map(log =>
        log.id === target.id ? { ...log, is_submitted: true } : log
      ));
    } catch (error) {
      console.error('Failed to submit evaluation:', error);
    } finally {
      setShowModal(false);
      setSelectedLog(null);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader 
        title="Evaluation Board"
        subtitle="Review formal internship performance evaluations submitted for your students."
        actions={
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
            {['PENDING', 'SUBMITTED', 'ALL'].map((status) => (
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
          <StatCard title="Pending Submission" value={stats.pending} icon={<Clock />} color="text-amber-500" highlight={stats.pending > 0} />
          <StatCard title="Submitted" value={stats.submitted} icon={<CheckCircle2 />} color="text-emerald-500" />
          <StatCard title="Total Evaluations" value={stats.total} icon={<FileText />} color="text-slate-500" />
          <StatCard title="Avg. Score" value={`${stats.avgScore}%`} icon={<AlertCircle />} color="text-primary" />
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
          <Card className="p-0 overflow-hidden" variant="panel">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Evaluator</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Technical</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Soft Skills</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Score</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Grade</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-[10px]">
                            {log.placement?.student?.first_name?.[0]}{log.placement?.student?.last_name?.[0]}
                          </div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {log.placement?.student?.first_name} {log.placement?.student?.last_name}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {log.evaluator?.first_name} {log.evaluator?.last_name}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{log.technical_score ?? '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{log.soft_skills_score ?? '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-primary">{log.total_weighted_score ?? '—'}%</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-md text-[10px] font-black bg-primary/10 text-primary">
                          {log.final_grade || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${
                          log.is_submitted
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                          {log.is_submitted ? 'Submitted' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all justify-end">
                          <Button variant="ghost" size="sm" className="h-8 px-3 text-[10px] font-bold" onClick={() => handleOpenDetails(log)}>
                            View
                          </Button>
                          {!log.is_submitted && (
                            <Button size="sm" className="h-8 px-3 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700" onClick={() => handleSubmitEvaluation(log)}>
                              Submit
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Evaluation Detail Modal */}
      {showModal && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-lg p-0 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300" variant="panel">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-primary/5">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Evaluation Details</h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                {selectedLog.placement?.student?.first_name} {selectedLog.placement?.student?.last_name}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Technical Score', value: selectedLog.technical_score },
                  { label: 'Soft Skills', value: selectedLog.soft_skills_score },
                  { label: 'Attendance', value: selectedLog.attendance_score },
                  { label: 'Conduct', value: selectedLog.conduct_score },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{value ?? '—'}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Total Weighted Score</span>
                <span className="text-2xl font-black text-primary">{selectedLog.total_weighted_score ?? '—'}%</span>
              </div>
              {selectedLog.summary_comments && (
                <p className="text-sm text-slate-600 dark:text-slate-400 p-4 rounded-xl bg-slate-50 dark:bg-slate-900">
                  {selectedLog.summary_comments}
                </p>
              )}
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setShowModal(false)}>
                Close
              </Button>
              {!selectedLog.is_submitted && (
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleSubmitEvaluation()}>
                  Submit Evaluation
                </Button>
              )}
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
