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