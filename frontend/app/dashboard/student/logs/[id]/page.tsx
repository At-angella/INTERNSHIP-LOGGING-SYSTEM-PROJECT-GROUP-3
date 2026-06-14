'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout, PageHeader, Statusbar } from '@/components/layout';
import { Card, Button, Input } from '@/components/ui';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';
import { ArrowLeft, Send, Edit2, Save, X, Clock, Calendar, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { WeeklyLog } from '@/lib/types';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function LogDetailPage() {
  const router = useRouter();
  const params = useParams();
  const logId = params.id as string;

  const [log, setLog] = useState<WeeklyLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editedData, setEditedData] = useState<{
    weekNumber: number;
    weekEndDate: string;
    hoursWorked: number;
    dailyLogs: Record<string, string>;
  } | null>(null);

  useEffect(() => {
    fetchLog();
  }, [logId]);

  const fetchLog = async () => {
    try {
      setLoading(true);
      const data = await api.getWeeklyLog(parseInt(logId));
      setLog(data);
      
      // Parse daily logs from activities_performed
      const dailyLogs = parseDailyLogs(data.activities_performed);
      setEditedData({
        weekNumber: data.week_number,
        weekEndDate: data.week_end_date,
        hoursWorked: data.hours_worked,
        dailyLogs,
      });
    } catch (error: any) {
      toast.error('✗ Failed to load log: ' + error.message);
      router.push('/dashboard/student/logs');
    } finally {
      setLoading(false);
    }
  };

  const parseDailyLogs = (activitiesText: string): Record<string, string> => {
    const dailyLogs: Record<string, string> = {};
    DAYS_OF_WEEK.forEach(day => {
      dailyLogs[day] = '';
    });

    const lines = activitiesText.split('\n\n');
    lines.forEach(line => {
      const match = line.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday): (.+)$/);
      if (match) {
        const day = match[1];
        const activity = match[2];
        if (activity !== 'No activities') {
          dailyLogs[day] = activity;
        }
      }
    });

    return dailyLogs;
  };

  const canEdit = !!(log && (log.status === 'DRAFT' || log.status === 'REJECTED' || log.status === 'REVISE'));
  const canSubmit = !!(log && (log.status === 'DRAFT' || log.status === 'REJECTED' || log.status === 'REVISE'));
  const isReadOnly = !!(log && (log.status === 'SUBMITTED' || log.status === 'APPROVED' || log.status === 'REVIEWED'));

  const handleEditChange = (day: string | null, field: string, value: any) => {
    if (!editedData) return;

    if (day) {
      setEditedData(prev => prev ? {
        ...prev,
        dailyLogs: {
          ...prev.dailyLogs,
          [day]: value,
        },
      } : null);
    } else {
      setEditedData(prev => prev ? {
        ...prev,
        [field]: value,
      } : null);
    }
  };

  const handleSaveAndSubmit = async () => {
    if (!editedData) return;

    setIsSubmitting(true);
    try {
      const activitiesPerformed = DAYS_OF_WEEK
        .map(day => `${day}: ${editedData.dailyLogs[day] || 'No activities'}`)
        .join('\n\n');

      await api.updateWeeklyLog(parseInt(logId), {
        week_number: editedData.weekNumber,
        week_end_date: editedData.weekEndDate,
        hours_worked: editedData.hoursWorked,
        activities_performed: activitiesPerformed,
      });

      await api.submitLog(parseInt(logId));

      toast.success('✓ Log submitted successfully for review!', {
        position: 'top-right',
        autoClose: 3000,
      });

      setIsEditing(false);
      fetchLog();
    } catch (error: any) {
      toast.error('✗ ' + (error.message || 'Failed to submit log'), {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Loading Log...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!log || !editedData) {
    return (
      <DashboardLayout>
        <PageHeader title="Log Not Found" subtitle="The log you're looking for doesn't exist." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center gap-2">
        <Link href="/dashboard/student/logs">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Logs
          </Button>
        </Link>
      </div>

      <PageHeader 
        title={`Weekly Log - Week ${log.week_number}`}
        subtitle={`Status: ${log.status}`}
        actions={
          <Statusbar status={log.status} />
        }
      />

      {/* Status-specific messages */}
      {log.status === 'REJECTED' && (
        <Card variant="panel" className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 dark:text-red-300">Feedback from Supervisor</p>
            <p className="text-sm text-red-700 dark:text-red-400 mt-1">
              {log.supervisor_review?.comments || 'Your log was rejected. Please review and resubmit.'}
            </p>
          </div>
        </Card>
      )}

      {log.status === 'REVISE' && (
        <Card variant="panel" className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-300">Revision Required</p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
              {log.supervisor_review?.recommendations || 'Your supervisor has requested revisions. Please review the feedback and resubmit.'}
            </p>
          </div>
        </Card>
      )}

      {log.status === 'APPROVED' && (
        <Card variant="panel" className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 flex gap-3">
          <div className="flex-1">
            <p className="font-semibold text-emerald-800 dark:text-emerald-300">✓ Approved</p>
            <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
              This log has been approved by your supervisor.
            </p>
          </div>
        </Card>
      )}

      {log.status === 'SUBMITTED' && (
        <Card variant="panel" className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 flex gap-3">
          <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-800 dark:text-blue-300">Awaiting Review</p>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
              Your log has been submitted and is awaiting supervisor review. You cannot edit it until feedback is provided.
            </p>
          </div>
        </Card>
      )}

      <div className="space-y-6">
        {/* Week Information */}
        <Card variant="panel" className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Week Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Week Number</label>
                <div className="mt-2 text-lg font-black text-slate-900 dark:text-white">
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editedData.weekNumber}
                      onChange={(e) => handleEditChange(null, 'weekNumber', parseInt(e.target.value))}
                      disabled={isReadOnly}
                      min="1"
                      max="52"
                    />
                  ) : (
                    <>Week {log.week_number}</>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Week End Date</label>
                <div className="mt-2 text-lg font-black text-slate-900 dark:text-white">
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editedData.weekEndDate}
                      onChange={(e) => handleEditChange(null, 'weekEndDate', e.target.value)}
                      disabled={isReadOnly}
                    />
                  ) : (
                    <>{new Date(log.week_end_date).toLocaleDateString()}</>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hours Worked</label>
                <div className="mt-2 text-lg font-black text-slate-900 dark:text-white">
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editedData.hoursWorked}
                      onChange={(e) => handleEditChange(null, 'hoursWorked', parseFloat(e.target.value))}
                      disabled={isReadOnly}
                      min="0"
                      step="0.5"
                    />
                  ) : (
                    <>{log.hours_worked} hours</>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Daily Activities */}
        <Card variant="panel" className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Daily Activities</h2>
            {canEdit && !isEditing && (
              <Button
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="gap-2 text-primary"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
            )}
          </div>

          <div className="space-y-6">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {day}
                </label>
                {isEditing ? (
                  <textarea
                    value={editedData.dailyLogs[day]}
                    onChange={(e) => handleEditChange(day, '', e.target.value)}
                    disabled={isReadOnly}
                    placeholder={`Activities for ${day}...`}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none disabled:opacity-50"
                    rows={4}
                  />
                ) : (
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
                      {editedData.dailyLogs[day] || 'No activities recorded'}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Meta Information */}
        <Card variant="panel" className="p-6 space-y-4 bg-slate-50 dark:bg-slate-900/30">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {log.submitted_at && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Submitted</p>
                <p className="font-semibold text-slate-700 dark:text-slate-300 mt-1">
                  {new Date(log.submitted_at).toLocaleDateString()}
                </p>
              </div>
            )}
            {log.reviewed_at && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reviewed</p>
                <p className="font-semibold text-slate-700 dark:text-slate-300 mt-1">
                  {new Date(log.reviewed_at).toLocaleDateString()}
                </p>
              </div>
            )}
            {log.supervisor_review && (
              <>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Performance Rating</p>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mt-1">
                    {log.supervisor_review.performance_rating}/5
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attendance</p>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mt-1">
                    {log.supervisor_review.attendance_rating}/5
                  </p>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsEditing(false);
                  fetchLog();
                }}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
              <Button
                onClick={handleSaveAndSubmit}
                className="gap-2 bg-primary"
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                <Send className="w-4 h-4" />
                Save & Submit for Review
              </Button>
            </>
          ) : canSubmit ? (
            <Button
              onClick={() => setIsEditing(true)}
              className="gap-2 bg-primary"
            >
              <Edit2 className="w-4 h-4" />
              Edit & Resubmit
            </Button>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  );
}
