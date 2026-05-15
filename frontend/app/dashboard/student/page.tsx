'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout, PageHeader, Statusbar } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { InternshipPlacement, WeeklyLog, Evaluation } from '@/lib/types';
import Link from 'next/link';
import { 
  FileText, 
  Calendar, 
  Briefcase, 
  GraduationCap, 
  Plus, 
  ArrowRight,
  TrendingUp,
  Clock,
  Award
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [placement, setPlacement] = useState<InternshipPlacement | null>(null);
  const [recentLogs, setRecentLogs] = useState<WeeklyLog[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const placements = await api.getPlacements({ student_id: user?.id });
        if (placements.results?.length) {
          setPlacement(placements.results[0]);
          const logs = await api.getWeeklyLogs({ placement_id: placements.results[0].id });
          setRecentLogs(logs.results?.slice(0, 5) || []);
        }
        const evals = await api.getEvaluations();
        setEvaluations(evals.results?.slice(0, 3) || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  return (
    <DashboardLayout>
      <PageHeader 
        title={`Welcome, ${user?.first_name}!`}
        subtitle="Track and manage your internship progress seamlessly."
        actions={
          <Link href="/dashboard/student/logs/new">
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              New Weekly Log
            </Button>
          </Link>
        }
      />