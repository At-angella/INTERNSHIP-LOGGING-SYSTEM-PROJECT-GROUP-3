'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout, PageHeader, Statusbar } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { InternshipPlacement, WeeklyLog } from '@/lib/types';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  MessageSquare, 
  Calendar, 
  User, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  FileText
} from 'lucide-react';

export default function LogsPage() {
  const { user } = useAuth();
  const [placements, setPlacements] = useState<InternshipPlacement[]>([]);
  const [logs, setLogs] = useState<WeeklyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('PENDING');
  const [filterStudent, setFilterStudent] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<WeeklyLog | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [placementsData, logsData] = await Promise.all([
          api.getPlacements(),
          api.getWeeklyLogs(),
        ]);
        
        setPlacements(placementsData.results || placementsData || []);
        setLogs(logsData.results || logsData || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) fetchData();
  }, [user]);

   const filteredLogs = logs.filter(log => {
    let statusMatch = true;
    if (filterStatus === 'PENDING') statusMatch = log.status !== 'APPROVED' && log.status !== 'REJECTED';
    else if (filterStatus === 'APPROVED') statusMatch = log.status === 'APPROVED';
    else if (filterStatus === 'REJECTED') statusMatch = log.status === 'REJECTED';
    
    const studentMatch = filterStudent === 'ALL' || log.placement?.id === parseInt(filterStudent);
    return statusMatch && studentMatch;
  });

  const stats = {
    pending: logs.filter(l => l.status !== 'APPROVED' && l.status !== 'REJECTED').length,
    approved: logs.filter(l => l.status === 'APPROVED').length,
    rejected: logs.filter(l => l.status === 'REJECTED').length,
    total: logs.length,
  };