'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout, PageHeader } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Evaluation } from '@/lib/types';
import { 
  Award, 
  Target, 
  Zap, 
  Activity, 
  MessageSquare, 
  Calendar, 
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Star
} from 'lucide-react';

export default function StudentEvaluationsPage() {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.getEvaluations();
        setEvaluations(data.results || data || []);
      } catch (error) {
        console.error('Failed to fetch evaluations:', error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  return (
    <DashboardLayout>
      <PageHeader 
        title="Performance Portfolio"
        subtitle="Review your professional assessments and supervisor feedback."
      />

      <div className="space-y-8">
        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Assembling Results...</p>
          </div>
        ) : evaluations.length === 0 ? (
          <Card className="p-20 text-center" variant="panel">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No evaluations yet</h3>
            <p className="text-slate-500 text-sm">Your performance reports will appear here once published by supervisors.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-10">
            {evaluations.map(evalu => (
              <EvaluationDetailCard key={evalu.id} evalu={evalu} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function EvaluationDetailCard({ evalu }: { evalu: Evaluation }) {
  return (
    <div className="space-y-6">
      {/* Grade Hero */}
      <Card className="relative overflow-hidden bg-slate-900 dark:bg-black border-none text-white shadow-2xl" variant="panel">
        <div className="relative z-10 p-8 md:p-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">Final Academic Standing</p>
              <h2 className="text-8xl font-black leading-none">{evalu.final_grade}</h2>
              <div className="mt-6 flex items-center gap-4">
                <div className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold">
                  Total Score: {evalu.total_weighted_score.toFixed(1)}/100
                </div>
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  Verified by University
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
              <QuickMetric label="Technical" value={evalu.technical_score} />
              <QuickMetric label="Soft Skills" value={evalu.soft_skills_score} />
              <QuickMetric label="Attendance" value={evalu.attendance_score} />
              <QuickMetric label="Conduct" value={evalu.conduct_score} />
            </div>
          </div>
        </div>
        
        {/* Abstract Background Decor */}
        <div className="absolute right-0 top-0 w-1/3 h-full bg-linear-to-l from-primary/20 to-transparent blur-3xl opacity-50" />
        <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />
      </Card>

      {/* Feedback Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 p-8" variant="panel">
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Supervisor Feedback</h3>
          </div>
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">
                "{evalu.summary_comments}"
              </p>
            </div>
            <div className="flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                {evalu.placement?.academic_supervisor?.first_name[0]}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {evalu.placement?.academic_supervisor?.first_name} {evalu.placement?.academic_supervisor?.last_name}
                </p>
                <p className="text-[10px] text-slate-500 font-medium">Academic Supervisor</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-8 bg-linear-to-br from-indigo-600 to-indigo-800 text-white" variant="panel">
          <h3 className="font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Next Steps
          </h3>
          <ul className="space-y-4">
            <li className="flex gap-3 text-sm">
              <div className="w-5 h-5 rounded-full bg-white/20 flex-shrink-0 flex items-center justify-center text-[10px] font-bold">1</div>
              <span className="text-indigo-100">Review detailed technical breakdown</span>
            </li>
            <li className="flex gap-3 text-sm">
              <div className="w-5 h-5 rounded-full bg-white/20 flex-shrink-0 flex items-center justify-center text-[10px] font-bold">2</div>
              <span className="text-indigo-100">Schedule feedback session with supervisor</span>
            </li>
            <li className="flex gap-3 text-sm">
              <div className="w-5 h-5 rounded-full bg-white/20 flex-shrink-0 flex items-center justify-center text-[10px] font-bold">3</div>
              <span className="text-indigo-100">Download official transcript</span>
            </li>
          </ul>
          <Button variant="ghost" className="w-full mt-10 border-white/20 text-white hover:bg-white/10 font-bold text-xs uppercase tracking-widest h-12">
            Download PDF Report
          </Button>
        </Card>
      </div>
    </div>
  );
}

function QuickMetric({ label, value }: { label: string, value: number }) {
  return (
    <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 min-w-[120px]">
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-black">{value}</span>
        <span className="text-[10px] text-slate-500">/25</span>
      </div>
    </div>
  );
}