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
      return (
    <DashboardLayout>
      <PageHeader 
        title="Institutional Analytics"
        subtitle="Comprehensive data insights and exportable reports for administrative oversight."
        actions={
          <Button onClick={downloadReport} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Download className="w-4 h-4" />
            Export Data
          </Button>
        }
      />

      <div className="space-y-8">
        {/* Overall Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Global Capacity" value={overallStats.totalStudents} icon={<Users />} color="text-slate-500" />
          <StatCard title="Active Interns" value={overallStats.activePlacements} icon={<TrendingUp />} color="text-emerald-500" />
          <StatCard title="Cumulative Hours" value={overallStats.totalHours} icon={<Calendar />} color="text-indigo-500" />
          <StatCard title="Avg Performance" value={`${overallStats.avgEvaluationScore}%`} icon={<Award />} color="text-amber-500" />
        </div>

        {/* View Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl w-fit">
          <button 
            onClick={() => setReportType('overview')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${reportType === 'overview' ? 'bg-white dark:bg-slate-800 shadow-md text-primary' : 'text-slate-400'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setReportType('performance')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${reportType === 'performance' ? 'bg-white dark:bg-slate-800 shadow-md text-primary' : 'text-slate-400'}`}
          >
            Performance
          </button>
          <button 
            onClick={() => setReportType('departmental')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${reportType === 'departmental' ? 'bg-white dark:bg-slate-800 shadow-md text-primary' : 'text-slate-400'}`}
          >
            Departmental
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Generating Analytics...</p>
          </div>
        ) : reportType === 'overview' ? (
          <Card className="p-0 overflow-hidden" variant="panel">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Master Student Registry</h3>
              <div className="flex gap-4">
                <select 
                  value={filterDepartment} 
                  onChange={e => setFilterDepartment(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="ALL">All Departments</option>
                  {uniqueDepartments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Placement</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dept</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Logs</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Hours</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {studentReports.map((report, idx) => (
                    <tr key={report.placement.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{report.placement.student?.first_name} {report.placement.student?.last_name}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{report.placement.student?.student_id}</p>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-400">{report.placement.position_title}</td>
                      <td className="px-6 py-4 text-[10px] font-bold text-slate-500">{report.placement.department?.name}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-lg">
                          {report.approvedLogs}/{report.logsCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-xs font-black text-slate-900 dark:text-white">{report.totalHours}h</td>
                      <td className="px-6 py-4 text-center">
                        {report.hasEvaluation ? (
                          <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center mx-auto text-[10px] font-black">
                            {report.evaluation?.final_grade}
                          </div>
                        ) : <span className="text-[10px] font-bold text-slate-300">N/A</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : reportType === 'performance' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {studentReports.sort((a,b) => (b.evaluation?.total_weighted_score || 0) - (a.evaluation?.total_weighted_score || 0)).map(report => (
              <PerformanceAnalysisCard key={report.placement.id} report={report} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {departmentBreakdown.map(dept => (
              <DepartmentReportCard key={dept.name} dept={dept} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <Card className="p-6 relative overflow-hidden group" hoverable>
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

function PerformanceAnalysisCard({ report }: any) {
  const completion = report.logCompletionRate;
  const score = report.evaluation?.total_weighted_score || 0;
  
  return (
    <Card className="overflow-hidden border-t-4 border-t-indigo-500" variant="panel">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
              {report.placement.student?.first_name} {report.placement.student?.last_name}
            </h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{report.placement.department?.name}</p>
          </div>
          {report.hasEvaluation && (
            <div className="w-10 h-10 rounded-2xl bg-indigo-500 text-white flex items-center justify-center font-black text-lg shadow-lg">
              {report.evaluation.final_grade}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
              <span className="text-slate-400">Log Completion</span>
              <span className="text-indigo-500">{completion}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500" style={{ width: `${completion}%` }} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
              <span className="text-slate-400">Weighted Performance</span>
              <span className="text-emerald-500">{score.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${score}%` }} />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4">
          <div>
            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Total Hours</p>
            <p className="text-sm font-black text-slate-900 dark:text-white">{report.totalHours}h</p>
          </div>
          <div>
            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Avg/Week</p>
            <p className="text-sm font-black text-slate-900 dark:text-white">{report.avgHoursPerWeek}h</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

function DepartmentReportCard({ dept }: any) {
  return (
    <Card className="p-6 relative overflow-hidden group" variant="panel">
      <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
        <div className="w-16 h-16 rounded-3xl bg-linear-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary border border-primary/10">
          <Building className="w-8 h-8" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">{dept.name}</h3>
          <div className="flex gap-6 mt-3">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Students</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">{dept.studentCount}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Active</p>
              <p className="text-xl font-black text-emerald-500">{dept.activeCount}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Hours Logged</p>
              <p className="text-xl font-black text-indigo-500">{dept.totalHours}h</p>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-full border border-slate-100 dark:border-slate-800">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}
