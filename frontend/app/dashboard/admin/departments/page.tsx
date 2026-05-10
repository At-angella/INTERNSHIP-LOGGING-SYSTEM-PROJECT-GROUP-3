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
        setDepartments(data || []);
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