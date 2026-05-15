'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout, PageHeader, Statusbar } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { InternshipPlacement, WeeklyLog, Evaluation } from '@/lib/types';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Calendar, 
  BookOpen, 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  GraduationCap,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck
} from 'lucide-react';
import Link from 'next/link';

export default function MyStudentsPage() {
  const { user } = useAuth();
  const [placements, setPlacements] = useState<InternshipPlacement[]>([]);
  const [logs, setLogs] = useState<WeeklyLog[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

   useEffect(() => {
    const fetchData = async () => {
      try {
        const [placementsData, logsData, evalsData] = await Promise.all([
          api.getPlacements(),
          api.getWeeklyLogs(),
          api.getEvaluations(),
        ]);
        
        setPlacements(placementsData.results || placementsData || []);
        setLogs(logsData.results || logsData || []);
        setEvaluations(evalsData.results || evalsData || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) fetchData();
  }, [user]);

  const studentStats = placements.filter(placement => {
    const matchesSearch = 
      `${placement.student?.first_name} ${placement.student?.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      placement.student?.student_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'ALL' || placement.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  }).map(placement => {
    const studentLogs = logs.filter(l => l.placement?.id === placement.id);
    const studentEval = evaluations.find(e => e.placement?.id === placement.id);
    const approvedLogs = studentLogs.filter(l => l.status === 'APPROVED').length;
    
    return {
      placement,
      logsCount: studentLogs.length,
      approvedLogs,
      totalHours: studentLogs.reduce((sum, l) => sum + (l.hours_worked || 0), 0),
      evaluation: studentEval,
      hasEvaluation: !!studentEval
    };
  });

  const stats = {
    total: placements.length,
    active: placements.filter(p => p.status === 'ACTIVE').length,
    completed: placements.filter(p => p.status === 'COMPLETED').length,
    pending: placements.filter(p => p.status === 'PENDING' || p.status === 'ON_HOLD').length,
  };
