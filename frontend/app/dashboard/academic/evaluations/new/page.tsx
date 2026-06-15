'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout, PageHeader } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { InternshipPlacement } from '@/lib/types';
import { ArrowLeft, User, Award, CheckCircle2, AlertTriangle, Sparkles, BookOpen } from 'lucide-react';

function NewAssessmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryPlacementId = searchParams.get('placementId') || '';

  const { user } = useAuth();
  const [placements, setPlacements] = useState<InternshipPlacement[]>([]);
  const [selectedPlacementId, setSelectedPlacementId] = useState<string>(queryPlacementId);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  // Assessment scores (0 - 100)
  const [technicalScore, setTechnicalScore] = useState<number>(80);
  const [softSkillsScore, setSoftSkillsScore] = useState<number>(80);
  const [attendanceScore, setAttendanceScore] = useState<number>(80);
  const [conductScore, setConductScore] = useState<number>(80);
  const [comments, setComments] = useState<string>('');
  const [recommendation, setRecommendation] = useState<string>('');

  useEffect(() => {
    const fetchPlacements = async () => {
      try {
        const data = await api.getPlacements();
        const results = data.results || data || [];
        // Academic supervisors can evaluate placements
        setPlacements(results);
      } catch (err) {
        console.error('Failed to fetch placements:', err);
        setError('Failed to load supervised placements.');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchPlacements();
  }, [user]);

  const selectedPlacement = placements.find(p => p.id.toString() === selectedPlacementId);

  // Dynamic grade calculation
  const averageScore = (technicalScore + softSkillsScore + attendanceScore + conductScore) / 4;
  
  const getGrade = (score: number) => {
    if (score >= 90) return { label: 'A+', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200' };
    if (score >= 80) return { label: 'A', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100' };
    if (score >= 70) return { label: 'B+', color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200' };
    if (score >= 60) return { label: 'B', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100' };
    if (score >= 50) return { label: 'C+', color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30 border-amber-200' };
    if (score >= 40) return { label: 'C', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-100' };
    return { label: 'F', color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/30 border-rose-200' };
  };

  const gradeInfo = getGrade(averageScore);

  const handleSubmit = async (submitAndLock: boolean) => {
    if (!selectedPlacementId) {
      setError('Please select a student to assess.');
      return;
    }
    if (!comments.trim()) {
      setError('Summary comments are required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // 1. Create the Evaluation record
      const evalData = {
        placement: parseInt(selectedPlacementId),
        technical_score: technicalScore,
        soft_skills_score: softSkillsScore,
        attendance_score: attendanceScore,
        conduct_score: conductScore,
        summary_comments: comments,
        recommendation: recommendation
      };

      const createdEval = await api.createEvaluation(evalData);

      // 2. Submit/Lock evaluation if requested
      if (submitAndLock && createdEval?.id) {
        await api.submitEvaluation(createdEval.id);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/academic/evaluations');
      }, 2000);
    } catch (err: any) {
      console.error('Failed to submit assessment:', err);
      setError(err.message || 'Failed to submit evaluation. Make sure the placement status is COMPLETED and no evaluation exists yet.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-20 text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30 animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Assessment Submitted!</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            The student performance evaluation has been successfully recorded. Redirecting you back to evaluations...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={() => router.push('/dashboard/academic/evaluations')}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-all" />
          Back to Evaluations
        </button>

        <PageHeader
          title="New Intern Assessment"
          subtitle="Define scores across core skills, write summary feedback, and submit the final evaluation."
        />

        {error && (
          <Card className="p-4 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900 flex items-start gap-3 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-xs font-semibold">{error}</div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Fields */}
          <div className="lg:col-span-2 space-y-6">
            {/* Selection card */}
            <Card className="p-6 space-y-4" variant="panel">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Student Assignment
              </h3>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Intern</label>
                <select
                  value={selectedPlacementId}
                  onChange={(e) => {
                    setSelectedPlacementId(e.target.value);
                    setError('');
                  }}
                  className="w-full px-4 py-3 text-sm font-bold rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none transition-all cursor-pointer"
                >
                  <option value="">-- Select Intern --</option>
                  {placements.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.student?.first_name} {p.student?.last_name} ({p.position_title}) {p.status !== 'COMPLETED' ? ' - ' + p.status_display : ''}
                    </option>
                  ))}
                </select>
                {selectedPlacement && selectedPlacement.status !== 'COMPLETED' && (
                  <p className="text-[10px] text-amber-500 font-bold flex items-center gap-1.5 mt-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Note: Backend requires placement status to be completed before submitting final evaluation.
                  </p>
                )}
              </div>
            </Card>

            {/* Assessment Scores */}
            <Card className="p-6 space-y-6" variant="panel">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" />
                Performance Metrics (0 - 100)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ScoreSlider
                  label="Technical Skills"
                  description="Quality of work, technical competence, task completion"
                  value={technicalScore}
                  onChange={setTechnicalScore}
                />
                <ScoreSlider
                  label="Soft Skills"
                  description="Communication, collaboration, learning agility"
                  value={softSkillsScore}
                  onChange={setSoftSkillsScore}
                />
                <ScoreSlider
                  label="Attendance & Punctuality"
                  description="Reliability, time management, consistent reporting"
                  value={attendanceScore}
                  onChange={setAttendanceScore}
                />
                <ScoreSlider
                  label="Conduct & Attitude"
                  description="Professionalism, response to feedback, work ethic"
                  value={conductScore}
                  onChange={setConductScore}
                />
              </div>
            </Card>

            {/* Feedback and Recommendations */}
            <Card className="p-6 space-y-4" variant="panel">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                Qualitative Assessment
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Summary Comments (Required)</label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Provide a comprehensive summary of the student's performance..."
                    className="w-full p-4 text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none transition-all min-h-[120px] resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recommendations</label>
                  <textarea
                    value={recommendation}
                    onChange={(e) => setRecommendation(e.target.value)}
                    placeholder="Provide any recommendations for future growth or career placement..."
                    className="w-full p-4 text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none transition-all min-h-[100px] resize-none"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar calculations & submit */}
          <div className="space-y-6">
            <Card className="p-6 space-y-6" variant="panel">
              <h3 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider">
                Assessment Summary
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-slate-400">Average Score</span>
                  <span className="text-3xl font-black text-slate-900 dark:text-white">{averageScore.toFixed(1)}%</span>
                </div>

                <div className="flex justify-between items-center py-2.5 px-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                  <span className="text-xs font-bold text-slate-500">Calculated Grade</span>
                  <span className={`px-3 py-1 rounded-xl text-xs font-black border ${gradeInfo.color}`}>
                    {gradeInfo.label}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  className="w-full"
                  disabled={submitting}
                  onClick={() => handleSubmit(false)}
                  variant="secondary"
                >
                  Save Evaluation Draft
                </Button>
                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  disabled={submitting}
                  onClick={() => handleSubmit(true)}
                >
                  Submit & Lock Assessment
                </Button>
              </div>

              <div className="text-[10px] text-slate-400 leading-normal flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  Submitting & locking the assessment will make the final grade visible to the student and restrict further edits.
                </span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

interface ScoreSliderProps {
  label: string;
  description: string;
  value: number;
  onChange: (val: number) => void;
}

function ScoreSlider({ label, description, value, onChange }: ScoreSliderProps) {
  return (
    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-3">
      <div className="flex justify-between items-start">
        <div className="max-w-[70%]">
          <label className="text-xs font-bold text-slate-900 dark:text-white block">{label}</label>
          <span className="text-[9px] text-slate-500 leading-tight block mt-0.5">{description}</span>
        </div>
        <div className="text-right">
          <span className="text-sm font-black text-primary block">{value}%</span>
        </div>
      </div>

      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
      />
    </div>
  );
}

export default function NewAssessmentPage() {
  return (
    <Suspense fallback={
      <div className="py-20 text-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Loading...</p>
      </div>
    }>
      <NewAssessmentForm />
    </Suspense>
  );
}
