'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout, PageHeader } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { api } from '@/lib/api';
import { 
  Building, 
  Plus, 
  Search, 
  Users, 
  MapPin, 
  ChevronRight,
  GraduationCap,
  Globe,
  Activity,
  Layers
} from 'lucide-react';

export default function DepartmentsAdminPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.getDepartments();
        const deptList = Array.isArray(data) ? data : (data?.results ?? []);
        setDepartments(deptList);
      } catch (error) {
        console.error('Failed to fetch departments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <DashboardLayout>
      <PageHeader 
        title="Departmental Hierarchy"
        subtitle="Manage academic divisions and institutional infrastructure."
        actions={
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Department
          </Button>
        }
      />

      <div className="space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Total Departments" value={departments.length} icon={<Layers />} color="text-primary" />
          <StatCard title="Active Courses" value={24} icon={<GraduationCap />} color="text-indigo-500" />
          <StatCard title="Total Staff" value={142} icon={<Users />} color="text-emerald-500" />
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Mapping Infrastructure...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {departments.map(dept => (
              <DepartmentCard key={dept.id} dept={dept} />
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



function DepartmentCard({ dept }: { dept: any }) {
  return (
    <Card className="p-8 hover:border-primary/30 transition-all group overflow-hidden relative" variant="panel">
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
            <Building className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
              {dept.name}
            </h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">CODE: {dept.code || 'CS-IT'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Supervisor Capacity</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">12/15</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Total Interns</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">86</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 text-[10px] font-black uppercase tracking-widest h-11">
            View Staff
          </Button>
          <Button className="flex-1 text-[10px] font-black uppercase tracking-widest h-11">
            Edit Profile
          </Button>
        </div>
      </div>
      
      {/* Background Decor */}
      <div className="absolute -right-10 -bottom-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700">
        <Building className="w-48 h-48" />
      </div>
    </Card>
  );
}