'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout, PageHeader, Statusbar } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { InternshipPlacement, WeeklyLog, Evaluation } from '@/lib/types';
import { 
  FileText, 
  Download, 
  Filter, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Award,
  ChevronRight,
  PieChart,
  BarChart3,
  Calendar,
  Search,
  Building
}from 'lucide-react';

export default function ReportsPage() {
  const { user } = useAuth();
  const [placements, setPlacements] = useState<InternshipPlacement[]>([]);
  const [logs, setLogs] = useState<WeeklyLog[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<'overview' | 'performance' | 'departmental'>('overview');
  const [filterDepartment, setFilterDepartment] = useState('ALL');

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

  const uniqueDepartments = Array.from(new Set(placements.map(p => p.department?.name).filter(Boolean)));
  const filteredPlacements = filterDepartment === 'ALL' ? placements : placements.filter(p => p.department?.name === filterDepartment);

  const overallStats = {
    totalStudents: placements.length,
    activePlacements: placements.filter(p => p.status === 'ACTIVE').length,
    totalHours: logs.reduce((sum, l) => sum + (l.hours_worked || 0), 0),
    avgEvaluationScore: evaluations.length > 0 ? (evaluations.reduce((sum, e) => sum + (e.total_weighted_score || 0), 0) / evaluations.length).toFixed(1) : 0,
  };

  const studentReports = filteredPlacements.map(placement => {
    const studentLogs = logs.filter(l => l.placement?.id === placement.id);
    const studentEval = evaluations.find(e => e.placement?.id === placement.id);
    const approvedLogs = studentLogs.filter(l => l.status === 'APPROVED').length;
    const totalHours = studentLogs.reduce((sum, l) => sum + (l.hours_worked || 0), 0);
    
    return {
      placement,
      logsCount: studentLogs.length,
      approvedLogs,
      totalHours,
      avgHoursPerWeek: studentLogs.length > 0 ? (totalHours / studentLogs.length).toFixed(1) : 0,
      evaluation: studentEval,
      hasEvaluation: !!studentEval,
      logCompletionRate: studentLogs.length > 0 ? ((approvedLogs / studentLogs.length) * 100).toFixed(0) : 0,
    };
  });

  const departmentBreakdown = uniqueDepartments.map(dept => {
    const deptStudents = placements.filter(p => p.department?.name === dept);
    const deptLogs = logs.filter(l => deptStudents.some(s => s.id === l.placement?.id));
    return {
      name: dept,
      studentCount: deptStudents.length,
      activeCount: deptStudents.filter(p => p.status === 'ACTIVE').length,
      totalLogs: deptLogs.length,
      totalHours: deptLogs.reduce((sum, l) => sum + (l.hours_worked || 0), 0),
    };
  });

  const downloadReport = () => {
    let csvContent = 'Student Name,Student ID,Position,Department,Status,Logs Approved,Total Hours,Avg Hours/Week,Evaluation Grade,Technical Score,Overall Score\n';
    studentReports.forEach(({ placement, approvedLogs, logsCount, totalHours, avgHoursPerWeek, evaluation }) => {
      csvContent += `"${placement.student?.first_name} ${placement.student?.last_name}",${placement.student?.student_id},"${placement.position_title}","${placement.department?.name}",${placement.status},${approvedLogs}/${logsCount},${totalHours},${avgHoursPerWeek},"${evaluation?.final_grade || 'N/A'}",${evaluation?.technical_score || 'N/A'},${evaluation?.total_weighted_score?.toFixed(1) || 'N/A'}\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `internship_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
     };