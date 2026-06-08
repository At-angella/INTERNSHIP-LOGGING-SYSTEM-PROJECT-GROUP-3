'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout, PageHeader } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { api } from '@/lib/api';
import { User } from '@/lib/types';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Mail, 
  Phone, 
  GraduationCap, 
  ChevronRight,
  MoreVertical,
  Activity,
  CheckCircle2
} from 'lucide-react';

export default function StudentsAdminPage() {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const users = await api.getUsers();
        setStudents(users.filter((u: User) => u.role === 'STUDENT'));
      } catch (error) {
        console.error('Failed to fetch students:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredStudents = students.filter(s => 
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.student_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <PageHeader 
        title="Student Database"
        subtitle="Manage and oversee all registered students across all faculties."
        actions={
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Student
          </Button>
        }
      />

      <div className="space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Total Students" value={students.length} icon={<Users />} color="text-primary" />
          <StatCard title="Placed" value={students.filter(s => s.is_active).length} icon={<CheckCircle2 />} color="text-emerald-500" />
          <StatCard title="Pending Placement" value={students.filter(s => !s.is_active).length} icon={<Activity />} color="text-amber-500" />
        </div>

        {/* Filter Bar */}
        <Card className="p-4" variant="glass">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID or faculty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>
        </Card>

        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Accessing Student Files...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredStudents.map(student => (
              <StudentGridCard key={student.id} student={student} />
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

function StudentGridCard({ student }: { student: User }) {
  return (
    <Card className="p-6 hover:border-primary/30 transition-all group" variant="panel">
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary font-black text-lg border border-slate-200 dark:border-slate-700">
          {student.first_name[0]}{student.last_name[0]}
        </div>
        <button className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">
            {student.first_name} {student.last_name}
          </h4>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {student.student_id}</p>
        </div>

        <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <GraduationCap className="w-4 h-4 text-primary/50" />
            <span>Computing & Information Technology</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <Mail className="w-4 h-4 text-primary/50" />
            <span className="truncate">{student.email}</span>
          </div>
        </div>

        <Button variant="ghost" size="sm" className="w-full mt-2 text-[10px] font-black uppercase tracking-widest h-10">
          View Portfolio
          <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      </div>
    </Card>
  );
}