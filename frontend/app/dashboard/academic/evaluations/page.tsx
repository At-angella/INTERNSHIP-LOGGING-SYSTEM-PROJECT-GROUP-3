'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout, PageHeader, Statusbar } from '@/components/layout';
import { Card, Button, Input } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { InternshipPlacement, Evaluation } from '@/lib/types';
import {
  Award,
  TrendingUp,
  Target,
  Zap,
  Calendar,
  User,
  Filter,
  Search,
  Plus,
  ChevronRight,

  ClipboardCheck,
  Star,
  Activity,
  UserCheck
} from 'lucide-react';
export default function EvaluationsPage() {
  const { user } = useAuth();
  const [placements, setPlacements] = useState<InternshipPlacement[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStudent, setFilterStudent] = useState('ALL');
  const [selectedEval, setSelectedEval] = useState<Evaluation | null>(null);
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    technical_score: 0,
    soft_skills_score: 0,
    attendance_score: 0,
    conduct_score: 0,
    summary_comments: '',
    recommendation: ''
  });

   useEffect(() => {
    const fetchData = async () => {
      try {
        const [placementsData, evalsData] = await Promise.all([
          api.getPlacements(),
          api.getEvaluations(),
        ]);

        setPlacements(placementsData.results || placementsData || []);
        setEvaluations(evalsData.results || evalsData || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchData();
  }, [user]);

  const filteredEvaluations = evaluations.filter(evaluation => {
    const studentMatch = filterStudent === 'ALL' || evaluation.placement?.id === parseInt(filterStudent);
    return studentMatch;
  });

  const stats = {
    submitted: evaluations.filter(e => e.is_submitted).length,
    pending: Math.max(0, placements.length - evaluations.filter(e => e.is_submitted).length),
    avgTechnical: evaluations.length > 0 ? (evaluations.reduce((sum, e) => sum + (e.technical_score || 0), 0) / evaluations.length).toFixed(1) : 0,
    avgOverall: evaluations.length > 0 ? (evaluations.reduce((sum, e) => sum + (e.total_weighted_score || 0), 0) / evaluations.length).toFixed(1) : 0,
  };

   const uniqueStudents = Array.from(
    new Map(placements.map(p => [p.id, { id: p.id, name: `${p.student?.first_name} ${p.student?.last_name}` }])).values()
  );

  const handleEditEvaluation = (evaluation: Evaluation) => {
    setSelectedEval(evaluation);
    setEditFormData({
      technical_score: evaluation.technical_score || 0,
      soft_skills_score: evaluation.soft_skills_score || 0,
      attendance_score: evaluation.attendance_score || 0,
      conduct_score: evaluation.conduct_score || 0,
      summary_comments: evaluation.summary_comments || '',
      recommendation: evaluation.recommendation || ''
    });
    setShowEvalModal(true);
  };

  const handleSubmitEvaluation = () => {
    if (selectedEval) {
      const avgScore = (editFormData.technical_score + editFormData.soft_skills_score + editFormData.attendance_score + editFormData.conduct_score) / 4;
      let grade = 'C';
      if (avgScore >= 90) grade = 'A+';
      else if (avgScore >= 80) grade = 'A';
      else if (avgScore >= 70) grade = 'B+';
      else if (avgScore >= 60) grade = 'B';

       const updatedEvaluations = evaluations.map(e =>
        e.id === selectedEval.id
          ? {
            ...e,
            ...editFormData,
            total_weighted_score: avgScore,
            final_grade: grade,
            is_submitted: true
          }
          : e
      );
      setEvaluations(updatedEvaluations);
      setShowEvalModal(false);
      setSelectedEval(null);
    }
  };

   return (
    <DashboardLayout>
      <PageHeader
        title="Performance Evaluations"
        subtitle="Submit final assessments and monitor student performance metrics."
        actions={
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Assessment
          </Button>
        }
      />

      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Submitted" value={stats.submitted} icon={<ClipboardCheck />} color="text-emerald-500" />
          <StatCard title="Pending" value={stats.pending} icon={<Activity />} color="text-amber-500" highlight={stats.pending > 0} />
          <StatCard title="Avg Tech Score" value={`${stats.avgTechnical}%`} icon={<Zap />} color="text-indigo-500" />
          <StatCard title="Class Average" value={`${stats.avgOverall}%`} icon={<TrendingUp />} color="text-primary" />
        </div>

{/* Filter Bar */}
        <Card className="p-4" variant="glass">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="relative">
              <UserCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={filterStudent}
                onChange={(e) => setFilterStudent(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="ALL">All Students</option>
                {uniqueStudents.map(student => (
                  <option key={student.id} value={student.id}>{student.name}</option>
                ))}
              </select>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                Showing {filteredEvaluations.length} Evaluations
              </span>
            </div>
          </div>
        </Card>

          {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Processing Scores...</p>
          </div>
        ) : filteredEvaluations.length === 0 ? (
          <Card className="p-20 text-center" variant="panel">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No evaluations recorded</h3>
            <p className="text-slate-500 text-sm">Select a student to begin their final performance review.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredEvaluations.map(evaluation => (
              <EvaluationCard key={evaluation.id} evaluation={evaluation} onEdit={() => handleEditEvaluation(evaluation)} />
            ))}
          </div>
        )}
      </div>

       {/* Evaluation Modal */}
      {showEvalModal && selectedEval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
          <Card className="w-full max-w-2xl p-0 overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-500" variant="panel">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Performance Review</h2>
                <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1">
                  {selectedEval.placement?.student?.first_name} {selectedEval.placement?.student?.last_name}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Current Grade</span>
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-black text-lg">
                  {selectedEval.final_grade || '-'}
                </div>
              </div>
            </div>

<div className="p-8 max-h-[70vh] overflow-y-auto space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <ScoreInput
                  label="Technical Competence"
                  value={editFormData.technical_score}
                  onChange={val => setEditFormData({ ...editFormData, technical_score: val })}
                />
                 <ScoreInput
                  label="Soft Skills & Teamwork"
                  value={editFormData.soft_skills_score}
                  onChange={val => setEditFormData({ ...editFormData, soft_skills_score: val })}
                />
                <ScoreInput
                  label="Attendance & Punctuality"
                  value={editFormData.attendance_score}
                  onChange={val => setEditFormData({ ...editFormData, attendance_score: val })}
                />
                <ScoreInput
                  label="Professional Conduct"
                  value={editFormData.conduct_score}
                  onChange={val => setEditFormData({ ...editFormData, conduct_score: val })}
                />
              </div>

               <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Qualitative Summary</label>
                  <textarea
                    value={editFormData.summary_comments}
                    onChange={e => setEditFormData({ ...editFormData, summary_comments: e.target.value })}
                    placeholder="Provide a detailed summary of the intern's growth and impact..."
                    className="w-full p-4 text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none min-h-[100px] resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Final Recommendation</label>
                  <textarea
                    value={editFormData.recommendation}
                    onChange={e => setEditFormData({ ...editFormData, recommendation: e.target.value })}
                    placeholder="Future development areas or employment recommendation..."
                    className="w-full p-4 text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none min-h-[80px] resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex gap-4">
              <Button variant="ghost" className="flex-1" onClick={() => setShowEvalModal(false)}>Discard</Button>
              <Button className="flex-1" onClick={handleSubmitEvaluation}>Save Assessment</Button>
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

function EvaluationCard({ evaluation, onEdit }: { evaluation: Evaluation, onEdit: () => void }) {
  const score = evaluation.total_weighted_score || 0;
  const grade = evaluation.final_grade;

  return (
    <Card className="overflow-hidden border-t-4 border-t-slate-200 dark:border-t-slate-800 hover:border-t-primary transition-all duration-300" variant="panel">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-linear-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800/50">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
            {evaluation.placement?.student?.first_name} {evaluation.placement?.student?.last_name}
          </h3>
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">{evaluation.placement?.position_title}</p>
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg transform rotate-3 ${score >= 80 ? 'bg-emerald-500 text-white' : score >= 60 ? 'bg-indigo-500 text-white' : 'bg-amber-500 text-white'}`}>
          {grade || '-'}
        </div>
      </div>

<div className="p-6 space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Performance Score</span>
            <span className="text-sm font-black text-slate-900 dark:text-white">{score.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-indigo-500' : 'bg-amber-500'}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ScoreBadge label="Technical" score={evaluation.technical_score} />
          <ScoreBadge label="Soft Skills" score={evaluation.soft_skills_score} />
          <ScoreBadge label="Attendance" score={evaluation.attendance_score} />
          <ScoreBadge label="Conduct" score={evaluation.conduct_score} />
        </div>

         <div className="space-y-4">
          {evaluation.summary_comments && (
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Feedback</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 italic line-clamp-2">"{evaluation.summary_comments}"</p>
            </div>
          )}
          {evaluation.recommendation && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20">
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                <Star className="w-3 h-3" /> Recommendation
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">{evaluation.recommendation}</p>
            </div>
          )}
        </div>

        <Button variant="outline" className="w-full h-10 text-[10px] font-black uppercase tracking-widest group" onClick={onEdit}>
          Update Assessment
          <ChevronRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </Card>
  );
}

function ScoreBadge({ label, score }: any) {
  return (
    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-center">
      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">{label}</p>
      <p className="text-xs font-black text-slate-900 dark:text-white">{score || 0}</p>
    </div>
  );
}
