'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { DashboardLayout, PageHeader } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { api } from '@/lib/api';
import { User, Student, InternshipPlacement } from '@/lib/types';
import { toast } from 'react-toastify';
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
  CheckCircle2,
  Check
} from 'lucide-react';

export default function StudentsAdminPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [placements, setPlacements] = useState<InternshipPlacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const [studentsResponse, placementsResponse] = await Promise.all([
        api.getStudents(),
        api.getPlacements(),
      ]);

      const userList: Student[] = Array.isArray(studentsResponse)
        ? studentsResponse
        : (studentsResponse?.results ?? []);
      
      const placementList: InternshipPlacement[] = Array.isArray(placementsResponse)
        ? placementsResponse
        : (placementsResponse?.results ?? []);

      setStudents(userList);
      setPlacements(placementList);
    } catch (error) {
      console.error('Failed to fetch students & placements:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMarkCompleted = async (placementId: number) => {
    setUpdatingId(placementId);
    try {
      await api.updatePlacementStatus(placementId, 'COMPLETED');
      toast.success('✓ Placement marked as COMPLETED successfully!', { position: 'top-right', autoClose: 3000 });
      await fetchData();
    } catch (error: any) {
      console.error('Failed to update placement status:', error);
      toast.error('✗ ' + (error?.message || 'Failed to update status.'));
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredStudents = students.filter(s => 
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.student_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <PageHeader 
        title="Student Database"
        subtitle="Manage and oversee all registered students across all faculties."
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
          <Card className="p-0 overflow-hidden" variant="panel">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student ID</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">College</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Program</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Placement Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStudents.map(student => {
                    const placement = placements.find(p => p.student?.id === student.id);
                    const isPlacementActive = placement?.status === 'ACTIVE';

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-[10px]">
                              {student.first_name[0]}{student.last_name[0]}
                            </div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{student.first_name} {student.last_name}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{student.student_id}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{student.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{student.college}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-slate-600 dark:text-slate-400">{student.program}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${student.is_active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
                            {student.is_active ? 'Active' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {placement ? (
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                              placement.status === 'COMPLETED' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' :
                              placement.status === 'ACTIVE' ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' :
                              placement.status === 'PENDING' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800' :
                              'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                            }`}>
                              {placement.status_display || placement.status}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              Unplaced
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {placement && isPlacementActive && (
                            <Button
                              size="md"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] py-1 px-3.5 uppercase tracking-wider rounded-xl transition-all"
                              disabled={updatingId === placement.id}
                              onClick={() => handleMarkCompleted(placement.id)}
                            >
                              {updatingId === placement.id ? 'Saving...' : 'Internship Completed'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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