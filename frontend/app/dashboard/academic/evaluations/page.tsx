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