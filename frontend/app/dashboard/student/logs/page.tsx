'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout, PageHeader, Statusbar } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { WeeklyLog } from '@/lib/types';
import Link from 'next/link';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

export default function StudentLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<WeeklyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.getWeeklyLogs();
        setLogs(data.results || data || []);
      } catch (error) {
        console.error('Failed to fetch logs:', error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  const filteredLogs = logs.filter(l => 
    l.activities_performed?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.week_number.toString().includes(searchTerm)
  );

  return (
    <DashboardLayout>
      <PageHeader 
        title="Weekly Logs Registry"
        subtitle="Maintain and submit your professional activity reports for verification."
        actions={
          <Link href="/dashboard/student/logs/new">
            <Button className="gap-2 bg-primary">
              <Plus className="w-4 h-4" />
              Submit New Log
            </Button>
          </Link>
        }
      />