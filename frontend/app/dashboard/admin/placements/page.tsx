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
  MessageSquare,
  Plus,
  CheckCircle2,
  Search
} from 'lucide-react';

export default function StudentPlacementPage() {
  const { user } = useAuth();
  const [placements, setPlacements] = useState<InternshipPlacement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.getPlacements();
        setPlacements(data.results || data || []);
      } catch (error) {
        console.error('Failed to fetch placements:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredPlacements = placements.filter((p: InternshipPlacement) => 
    p.student?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.workplace?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.position_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <PageHeader 
        title="Placement Registry"
        subtitle="Manage and oversee all active internship placements across the institution."
        actions={
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Create Placement
          </Button>
        }
      />

      <div className="space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Total Placements" value={placements.length} icon={<Briefcase />} color="text-primary" />
          <StatCard title="Active Now" value={placements.filter(p => p.status === 'ACTIVE').length} icon={<CheckCircle2 />} color="text-emerald-500" />
          <StatCard title="Partnerships" value={new Set(placements.map(p => p.workplace?.id)).size} icon={<Building />} color="text-indigo-500" />
        </div>

        {/* Filter Bar */}
        <Card className="p-4" variant="glass">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student, workplace or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>
        </Card>

        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Loading Registry...</p>
          </div>
        ) : (
          <Card className="p-0 overflow-hidden" variant="panel">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Workplace</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Supervisor</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Period</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredPlacements.map((placement: InternshipPlacement) => (
                    <tr key={placement.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-[10px]">
                            {placement.student?.first_name[0]}{placement.student?.last_name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{placement.student?.first_name} {placement.student?.last_name}</p>
                            <p className="text-[10px] text-slate-500">{placement.student?.student_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{placement.workplace?.name}</p>
                        <p className="text-[10px] text-slate-500">{placement.position_title}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-3 h-3 text-indigo-500" />
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                            {placement.academic_supervisor?.first_name} {placement.academic_supervisor?.last_name[0]}.
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Statusbar status={placement.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-[10px] font-bold text-slate-500">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(placement.start_date).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1 text-slate-300 dark:text-slate-600">—</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(placement.end_date).toLocaleDateString()}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
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
