'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout, PageHeader } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { InternshipPlacement, WeeklyLog } from '@/lib/types';
import { Star, FileText, CheckCircle2, AlertTriangle, ArrowLeft, User, Calendar } from 'lucide-react';

import { useSearchParams } from 'next/navigation';

function NewEvaluationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryPlacementId = searchParams.get('placementId') || '';
  const queryLogId = searchParams.get('logId') || '';

  const { user } = useAuth();
  const [placements, setPlacements] = useState<InternshipPlacement[]>([]);
  const [selectedPlacementId, setSelectedPlacementId] = useState<string>(queryPlacementId);
  const [logs, setLogs] = useState<WeeklyLog[]>([]);
  const [selectedLogId, setSelectedLogId] = useState<string>(queryLogId);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  // Form state
  const [performanceRating, setPerformanceRating] = useState<number>(5);
  const [attendanceRating, setAttendanceRating] = useState<number>(5);
  const [attitudeRating, setAttitudeRating] = useState<number>(5);
  const [comments, setComments] = useState<string>('');
  const [recommendations, setRecommendations] = useState<string>('');

  useEffect(() => {
    const fetchPlacements = async () => {
      try {
        const data = await api.getPlacements();
        setPlacements(data.results || data || []);
      } catch (err) {
        console.error('Failed to fetch placements:', err);
        setError('Failed to load interns.');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchPlacements();
  }, [user]);

  useEffect(() => {
    if (!selectedPlacementId) {
      setLogs([]);
      setSelectedLogId('');
      return;
    }

    const fetchLogs = async () => {
      try {
        const data = await api.getWeeklyLogs({ placement: selectedPlacementId });
        const allLogs = data.results || data || [];
        const unreviewedSubmittedLogs = allLogs.filter(
          (log: WeeklyLog) => log.status === 'SUBMITTED' && !log.supervisor_review
        );
        setLogs(unreviewedSubmittedLogs);
        if (unreviewedSubmittedLogs.length > 0) {
          const exists = unreviewedSubmittedLogs.some((l: WeeklyLog) => l.id.toString() === queryLogId);
          setSelectedLogId(exists ? queryLogId : unreviewedSubmittedLogs[0].id.toString());
        } else {
          setSelectedLogId('');
        }
      } catch (err) {
        console.error('Failed to fetch logs:', err);
      }
    };

    fetchLogs();
  }, [selectedPlacementId, queryLogId]);

  const handleSubmit = async (approvalStatus: 'APPROVED' | 'REJECTED') => {
    if (!selectedLogId) {
      setError('Please select a weekly logbook submission to evaluate.');
      return;
    }
    if (!comments.trim()) {
      setError('Please provide qualitative comments.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const logIdNum = parseInt(selectedLogId);
      await api.createReview({
        log: logIdNum,
        performance_rating: performanceRating,
        attendance_rating: attendanceRating,
        attitude_rating: attitudeRating,
        comments: comments.trim(),
        recommendations: recommendations.trim(),
        approval_status: approvalStatus,
      });

      if (approvalStatus === 'APPROVED') {
        await api.reviewLog(logIdNum);
      } else {
        await api.updateWeeklyLog(logIdNum, { status: 'REVISE' });
      }

      router.push('/dashboard/workplace');
    } catch (err: any) {
      console.error('Failed to submit evaluation:', err);
      setError(err?.message || 'Failed to submit evaluation review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPlacement = placements.find(p => p.id.toString() === selectedPlacementId);
  const selectedLog = logs.find(l => l.id.toString() === selectedLogId);

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-2 h-auto rounded-xl">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <PageHeader
            title="New Workplace Evaluation"
            subtitle="Evaluate student weekly logs, rate performance, and provide development feedback."
          />
        </div>

        {error && (
          <Card className="border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 p-4 text-xs font-bold flex items-center gap-2 rounded-2xl">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </Card>
        )}

        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Loading Evaluation Form...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="p-6 space-y-4" variant="panel">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-500" />
                Intern & Week Selection
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Intern</label>
                  <select
                    value={selectedPlacementId}
                    onChange={(e) => setSelectedPlacementId(e.target.value)}
                    className="w-full px-4 py-3 text-sm font-bold rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none transition-all cursor-pointer"
                  >
                    <option value="">-- Select Intern --</option>
                    {placements.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.student?.first_name} {p.student?.last_name} ({p.position_title})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Weekly Log</label>
                  <select
                    value={selectedLogId}
                    onChange={(e) => setSelectedLogId(e.target.value)}
                    disabled={!selectedPlacementId}
                    className="w-full px-4 py-3 text-sm font-bold rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {!selectedPlacementId ? (
                      <option value="">Select intern first</option>
                    ) : logs.length === 0 ? (
                      <option value="">No pending weekly logs to evaluate</option>
                    ) : (
                      logs.map(l => (
                        <option key={l.id} value={l.id}>
                          Week {l.week_number} ({new Date(l.week_start_date).toLocaleDateString()} - {new Date(l.week_end_date).toLocaleDateString()})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            </Card>

            {selectedLog && (
              <Card className="p-6 bg-slate-50/50 dark:bg-slate-900/30 border-dashed space-y-4" variant="panel">
                <h4 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Activities Logged for Week {selectedLog.week_number}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-bold text-slate-400 block uppercase tracking-wider mb-1">Activities Performed</span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">{selectedLog.activities_performed}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 block uppercase tracking-wider mb-1">Skills Acquired / Lessons</span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">{selectedLog.skills_acquired || '—'}</p>
                  </div>
                </div>
                <div className="flex gap-4 text-xs font-bold text-slate-500 pt-2">
                  <span>Hours Worked: <span className="text-primary">{selectedLog.hours_worked}h</span></span>
                  <span>Submitted: <span className="text-primary">{new Date(selectedLog.submitted_at || '').toLocaleDateString()}</span></span>
                </div>
              </Card>
            )}

            {selectedLog && (
              <Card className="p-6 space-y-6" variant="panel">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  Performance Evaluation Ratings
                </h3>

                <div className="space-y-5">
                  <RatingSlider
                    label="Job Performance & Technical execution"
                    value={performanceRating}
                    onChange={setPerformanceRating}
                    description="Quality, accuracy, and thoroughness of tasks executed."
                  />
                  <RatingSlider
                    label="Attendance & Punctuality"
                    value={attendanceRating}
                    onChange={setAttendanceRating}
                    description="Consistency in reporting and respect for workplace timelines."
                  />
                  <RatingSlider
                    label="Professional Attitude & Teamwork"
                    value={attitudeRating}
                    onChange={setAttitudeRating}
                    description="Initiative, adaptability, teamwork mindset, and conduct."
                  />
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Qualitative Comments</label>
                    <textarea
                      value={comments}
                      onChange={e => setComments(e.target.value)}
                      placeholder="Comment on the student's primary achievements, behavior, and areas of growth..."
                      className="w-full p-4 text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none min-h-[100px] resize-none"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recommendations (Optional)</label>
                    <textarea
                      value={recommendations}
                      onChange={e => setRecommendations(e.target.value)}
                      placeholder="Recommendations for improvement or future career progression..."
                      className="w-full p-4 text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none min-h-[80px] resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    variant="ghost"
                    className="flex-1 border-red-500/20 hover:bg-red-500/10 text-red-500 text-[11px] font-black uppercase tracking-wider h-11"
                    isLoading={submitting}
                    onClick={() => handleSubmit('REJECTED')}
                  >
                    Request Revision
                  </Button>
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-[11px] font-black uppercase tracking-wider h-11"
                    isLoading={submitting}
                    onClick={() => handleSubmit('APPROVED')}
                  >
                    Approve & Submit Review
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function NewEvaluationPage() {
  return (
    <Suspense fallback={
      <div className="py-20 text-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Loading...</p>
      </div>
    }>
      <NewEvaluationForm />
    </Suspense>
  );
}

interface RatingSliderProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  description: string;
}

function RatingSlider({ label, value, onChange, description }: RatingSliderProps) {
  const ratingLabels = ['Poor', 'Below Average', 'Average', 'Good', 'Excellent'];

  return (
    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <label className="text-xs font-bold text-slate-900 dark:text-white block">{label}</label>
          <span className="text-[10px] text-slate-500">{description}</span>
        </div>
        <div className="text-right">
          <span className="text-xs font-black text-primary block">{value} / 5</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{ratingLabels[value - 1]}</span>
        </div>
      </div>

      <div className="flex gap-1.5 pt-1">
        {[1, 2, 3, 4, 5].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onChange(num)}
            className={`flex-1 py-1 rounded-lg text-xs font-black transition-all ${
              num <= value
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50'
            }`}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
}
