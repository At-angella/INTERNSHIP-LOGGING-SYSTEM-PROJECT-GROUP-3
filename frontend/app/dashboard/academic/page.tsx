'use client';
import React, { useState, useEffect } from 'react';
import { DashboardLayout, PageHeader, Statusbar } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { InternshipPlacement, WeeklyLog, Evaluation } from '@/lib/types';
import Link from 'next/link';
import { 
  GraduationCap, 
  FileText, 
  ClipboardCheck, 
  Search, 
  TrendingUp, 
  Calendar,
  AlertCircle,
  Users,
  ChevronRight,
  Plus,
  BarChart3
} from 'lucide-react';
export default function AcademicDashboard() {
  const { user } = useAuth();
  const [placements, setPlacements] = useState<InternshipPlacement[]>([]);
  const [weeklyLogs, setWeeklyLogs] = useState<WeeklyLog[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
 useEffect(() => {
    const fetchData = async () => {
      try {
        const [placementsData, logsData, evalsData] = await Promise.all([
          api.getPlacements(),
          api.getWeeklyLogs(),
          api.getEvaluations()
        ]);
        setPlacements(placementsData.results?.slice(0, 10) || placementsData.slice(0, 10) || []);
        setWeeklyLogs(logsData.results?.slice(0, 8) || logsData.slice(0, 8) || []);
        setEvaluations(evalsData.results || evalsData || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
      if (user) fetchData();
  }, [user]);
