'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout, PageHeader, Statusbar } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { InternshipPlacement } from '@/lib/types';
import { 
  Briefcase, 
  MapPin, 
  Calendar, 
  User, 
  Building, 
  Phone, 
  Mail, 
  Clock, 
  ShieldCheck,
  Globe,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

export default function StudentPlacementPage() {
  const { user } = useAuth();
  const [placement, setPlacement] = useState<InternshipPlacement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.getPlacements({ student_id: user?.id });
        if (data.results?.length) {
          setPlacement(data.results[0]);
        }
      } catch (error) {
        console.error('Failed to fetch placement:', error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  if (loading) return (
    <DashboardLayout>
      <div className="py-20 text-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Syncing Placement Profile...</p>
      </div>
    </DashboardLayout>
  );

  if (!placement) return (
    <DashboardLayout>
      <PageHeader title="Placement Status" subtitle="View and manage your active internship assignment." />
      <Card className="p-20 text-center" variant="panel">
        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-slate-300">
          <Briefcase className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-slate-900 dark:text-white">No active placement found</h3>
        <p className="text-slate-500 text-sm max-w-md mx-auto mt-2">
          It seems you haven't been assigned an internship placement yet. Please contact your department coordinator for assistance.
        </p>
      </Card>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <PageHeader 
        title="Official Placement Profile" 
        subtitle="Full details of your current industrial training assignment."
        actions={
          <Button variant="outline" className="gap-2">
            <ExternalLink className="w-4 h-4" />
            Download Letter
          </Button>
        }
      />

      <div className="space-y-8">
        {/* Main Info Hero */}
        <Card className="relative overflow-hidden group" variant="panel">
          <div className="relative z-10 p-8 flex flex-col md:flex-row gap-10 items-center">
            <div className="w-32 h-32 rounded-3xl bg-primary flex items-center justify-center text-white shadow-2xl shadow-primary/20 shrink-0">
              <Building className="w-16 h-16" />
            </div>
            <div className="text-center md:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
                  {placement.workplace?.name}
                </h2>
                <Statusbar status={placement.status} />
              </div>
              <p className="text-xl font-bold text-primary mb-4">{placement.position_title}</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm font-bold text-slate-500">
                <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Kampala, Uganda</span>
                <span className="flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> workplace-portal.com</span>
              </div>
            </div>
            <div className="shrink-0 w-full md:w-64 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <Statusbar 
                progress={Math.round((placement.log_progress.approved_logs / (placement.log_progress.total_logs || 1)) * 100)} 
                label="Overall Progress" 
              />
              <p className="mt-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                {placement.log_progress.approved_logs} / {placement.log_progress.total_logs} Logs Validated
              </p>
            </div>
          </div>
          
          <div className="absolute right-0 top-0 w-full h-full bg-linear-to-r from-transparent via-transparent to-primary/5 pointer-events-none" />
        </Card>

        {/* Supervisors Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SupervisorCard 
            title="Academic Supervisor" 
            name={`${placement.academic_supervisor?.first_name} ${placement.academic_supervisor?.last_name}`}
            email={placement.academic_supervisor?.email}
            phone="+256 700 000000"
            role="University Faculty Staff"
          />
          <SupervisorCard 
            title="Workplace Supervisor" 
            name={`${placement.workplace_supervisor?.first_name} ${placement.workplace_supervisor?.last_name}`}
            email={placement.workplace_supervisor?.email}
            phone="+256 701 000000"
            role="Organization Department Head"
          />
        </div>

        {/* Timeline & Documents */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 p-8" variant="panel">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-8 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Internship Timeline
            </h3>
            <div className="relative space-y-12 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
              <TimelineItem 
                title="Placement Confirmed" 
                date={new Date(placement.start_date).toLocaleDateString()} 
                desc="Your placement was officially registered and approved by the university."
                active 
              />
              <TimelineItem 
                title="Industrial Training Commencement" 
                date={new Date(placement.start_date).toLocaleDateString()} 
                desc="Official start of your work period at the host organization."
                active 
              />
              <TimelineItem 
                title="Scheduled Completion" 
                date={new Date(placement.end_date).toLocaleDateString()} 
                desc="Final day of internship and logbook submission deadline."
              />
            </div>
          </Card>

          <Card className="p-8" variant="glass">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6">Support</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-8">
              Need assistance with your placement? Contact your supervisor directly or reach out to the university placement office.
            </p>
            <div className="space-y-3">
              <Button className="w-full h-12 gap-2 text-xs font-black uppercase tracking-widest">
                <MessageSquare className="w-4 h-4" />
                Open Support Ticket
              </Button>
              <Button variant="outline" className="w-full h-12 gap-2 text-xs font-black uppercase tracking-widest">
                Guidelines PDF
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function SupervisorCard({ title, name, email, phone, role }: any) {
  return (
    <Card className="p-8" variant="panel">
      <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-6">{title}</p>
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-black text-xl">
          {name[0]}
        </div>
        <div>
          <h4 className="text-lg font-black text-slate-900 dark:text-white leading-none mb-2">{name}</h4>
          <p className="text-xs text-slate-500 font-medium">{role}</p>
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center"><Mail className="w-3 h-3" /></div>
          <span className="font-bold">{email}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center"><Phone className="w-3 h-3" /></div>
          <span className="font-bold">{phone}</span>
        </div>
      </div>
      <Button variant="ghost" className="w-full mt-8 h-11 text-[10px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-900/50 hover:bg-primary hover:text-white transition-all">
        Contact Supervisor
      </Button>
    </Card>
  );
}

function TimelineItem({ title, date, desc, active = false }: any) {
  return (
    <div className="relative pl-10">
      <div className={`absolute left-0 top-1.5 w-8 h-8 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center z-10 ${active ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'}`}>
        {active && <ShieldCheck className="w-4 h-4 text-white" />}
      </div>
      <div>
        <div className="flex justify-between items-center mb-1">
          <h4 className={`text-sm font-black ${active ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{title}</h4>
          <span className="text-[10px] font-bold text-slate-400">{date}</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
