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