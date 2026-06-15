'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { DashboardLayout, PageHeader, Statusbar } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { WeeklyLog } from '@/lib/types';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Eye,
} from 'lucide-react';

export default function ReviewsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<WeeklyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('SUBMITTED');
  const [selectedLog, setSelectedLog] = useState<WeeklyLog | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.getWeeklyLogs();
        setLogs(data.results || data || []);
      } catch (error) {
        console.error('Failed to fetch weekly logs:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchData();
  }, [user]);

  const filteredLogs = logs.filter(log => {
    if (filterStatus === 'SUBMITTED') return log.status === 'SUBMITTED';
    if (filterStatus === 'REVIEWED') return log.status === 'REVIEWED';
    if (filterStatus === 'APPROVED') return log.status === 'APPROVED';
    return true; // ALL
  });

  const stats = {
    pending: logs.filter(l => l.status === 'SUBMITTED').length,
    reviewed: logs.filter(l => l.status === 'REVIEWED').length,
    approved: logs.filter(l => l.status === 'APPROVED').length,
    total: logs.length,
  };

  const handleOpenLog = (log: WeeklyLog) => {
    setSelectedLog(log);
    setShowModal(true);
  };

  const handleMarkReviewed = async (log: WeeklyLog) => {
    setSubmitting(true);
    try {
      await api.reviewLog(log.id);
      setLogs(prev =>
        prev.map(l => l.id === log.id ? { ...l, status: 'REVIEWED' } : l)
      );
      setShowModal(false);
      setSelectedLog(null);
    } catch (error) {
      console.error('Failed to mark log as reviewed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Weekly Log Review Board"
        subtitle="Review and mark student weekly log submissions for your assigned interns."
        actions={
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
            {['SUBMITTED', 'REVIEWED', 'APPROVED', 'ALL'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all uppercase tracking-tighter ${
                  filterStatus === status
                    ? 'bg-white dark:bg-slate-800 shadow-sm text-primary'
                    : 'text-slate-400'
                }`}
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
          <StatCard title="Awaiting Review" value={stats.pending} icon={<Clock />} color="text-amber-500" highlight={stats.pending > 0} />
          <StatCard title="Marked Reviewed" value={stats.reviewed} icon={<CheckCircle2 />} color="text-blue-500" />
          <StatCard title="Approved" value={stats.approved} icon={<AlertCircle />} color="text-emerald-500" />
          <StatCard title="Total Logs" value={stats.total} icon={<FileText />} color="text-slate-500" />
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Loading Log Submissions...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <Card className="p-20 text-center" variant="panel">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">All clear!</h3>
            <p className="text-slate-500 text-sm">No logs match the current filter.</p>
          </Card>
        ) : (
          <Card className="p-0 overflow-hidden" variant="panel">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Week</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Period</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hours</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Activities</th>
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
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Week {log.week_number}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-500">
                          {new Date(log.week_start_date).toLocaleDateString()} — {new Date(log.week_end_date).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{log.hours_worked}h</p>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{log.activities_performed}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Statusbar status={log.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 text-[10px] font-bold"
                            onClick={() => handleOpenLog(log)}
                          >
                            <Eye className="w-3 h-3 mr-1" /> View
                          </Button>
                          {log.status === 'SUBMITTED' && (
                            <Button
                              size="sm"
                              className="h-8 px-3 text-[10px] font-bold bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleMarkReviewed(log)}
                            >
                              Mark Reviewed
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

      {/* Log Detail Modal */}
      {showModal && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-2xl p-0 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300" variant="panel">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-primary/5">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Week {selectedLog.week_number} Log
              </h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                {selectedLog.placement?.student?.first_name} {selectedLog.placement?.student?.last_name}
                {' · '}
                {new Date(selectedLog.week_start_date).toLocaleDateString()} — {new Date(selectedLog.week_end_date).toLocaleDateString()}
              </p>
            </div>

            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
              {[
                { label: 'Activities Performed', value: selectedLog.activities_performed },
                { label: 'Skills Acquired', value: selectedLog.skills_acquired },
                { label: 'Challenges Faced', value: selectedLog.challenges_faced },
                { label: 'Lessons Learned', value: selectedLog.lessons_learned },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{value || '—'}</p>
                </div>
              ))}
              <div className="flex items-center gap-6 pt-2">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hours Worked</p>
                  <p className="text-2xl font-black text-primary">{selectedLog.hours_worked}h</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                  <Statusbar status={selectedLog.status} />
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setShowModal(false)}>
                Close
              </Button>
              {selectedLog.status === 'SUBMITTED' && (
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  isLoading={submitting}
                  onClick={() => handleMarkReviewed(selectedLog)}
                >
                  Mark as Reviewed
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
