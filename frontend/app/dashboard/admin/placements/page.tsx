'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { DashboardLayout, PageHeader, Statusbar } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { api } from '@/lib/api';
import { InternshipPlacement, User, Workplace, AcademicDepartment } from '@/lib/types';
import { toast } from 'react-toastify';
import {
  Briefcase,
  Calendar,
  Building,
  ShieldCheck,
  Plus,
  CheckCircle2,
  Search,
  X,
  ChevronDown,
  Loader2,
} from 'lucide-react';

interface FormState {
  student_id: string;
  workplace_name: string;
  academic_supervisor_id: string;
  workplace_supervisor_id: string;
  department_id: string;
  position_title: string;
  description: string;
  start_date: string;
  end_date: string;
}

const EMPTY_FORM: FormState = {
  student_id: '',
  workplace_name: '',
  academic_supervisor_id: '',
  workplace_supervisor_id: '',
  department_id: '',
  position_title: '',
  description: '',
  start_date: '',
  end_date: '',
};

export default function PlacementsAdminPage() {
  const [placements, setPlacements] = useState<InternshipPlacement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [students, setStudents] = useState<User[]>([]);
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [departments, setDepartments] = useState<AcademicDepartment[]>([]);
  const [academicSupervisors, setAcademicSupervisors] = useState<User[]>([]);
  const [workplaceSupervisors, setWorkplaceSupervisors] = useState<User[]>([]);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchPlacements = async () => {
    try {
      const data = await api.getPlacements();
      setPlacements(data.results ?? data ?? []);
    } catch (err) {
      console.error('Failed to fetch placements:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [usersRes, workplacesRes, deptsRes] = await Promise.all([
        api.getUsers(),
        api.getWorkplaces(),
        api.getDepartments(),
      ]);

      const userList: User[] = Array.isArray(usersRes) ? usersRes : (usersRes?.results ?? []);
      const workplaceList: Workplace[] = Array.isArray(workplacesRes)
        ? workplacesRes
        : (workplacesRes?.results ?? []);
      const deptList: AcademicDepartment[] = Array.isArray(deptsRes)
        ? deptsRes
        : (deptsRes?.results ?? []);

      setStudents(userList.filter(u => u.role === 'STUDENT'));
      setAcademicSupervisors(userList.filter(u => u.role === 'ACADEMIC_SUPERVISOR'));
      setWorkplaceSupervisors(userList.filter(u => u.role === 'WORKPLACE_SUPERVISOR'));
      setWorkplaces(workplaceList);
      setDepartments(deptList);
    } catch (err) {
      console.error('Failed to fetch dropdown data:', err);
    }
  };

  useEffect(() => {
    fetchPlacements();
    fetchDropdownData();
  }, []);


  const filteredPlacements = placements.filter((p: InternshipPlacement) =>
    `${p.student?.first_name} ${p.student?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.workplace?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.position_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const setField = (key: keyof FormState, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const openModal = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (!submitting) setModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // validation
    const required: (keyof FormState)[] = [
      'student_id', 'workplace_name', 'academic_supervisor_id',
      'workplace_supervisor_id', 'department_id',
      'position_title', 'start_date', 'end_date',
    ];
    for (const key of required) {
      if (!form[key]) {
        setFormError('Please fill in all required fields.');
        return;
      }
    }
    if (form.start_date >= form.end_date) {
      setFormError('End date must be after start date.');
      return;
    }

    setSubmitting(true);
    try {
      await api.createPlacement({
        student: Number(form.student_id),
        workplace_name: form.workplace_name.trim(),
        academic_supervisor: Number(form.academic_supervisor_id),
        workplace_supervisor: Number(form.workplace_supervisor_id),
        department: Number(form.department_id),
        position_title: form.position_title,
        description: form.description,
        start_date: form.start_date,
        end_date: form.end_date,
      });
      toast.success('✓ Placement created successfully!', { position: 'top-right', autoClose: 3000 });
      setModalOpen(false);
      setLoading(true);
      await Promise.all([fetchPlacements(), fetchDropdownData()]);
    } catch (err: any) {
      const msg = err?.message || 'Failed to create placement. Please try again.';
      setFormError(msg);
      toast.error('✗ ' + msg, { position: 'top-right', autoClose: 5000 });
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <DashboardLayout>
      <PageHeader
        title="Placement Registry"
        subtitle="Manage and oversee all active internship placements across the institution."
        actions={
          <Button className="gap-2" onClick={openModal}>
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
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>
        </Card>

        {/* Table */}
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
                  {filteredPlacements.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-slate-400 text-sm">
                        No placements found. Click <strong>Create Placement</strong> to get started.
                      </td>
                    </tr>
                  ) : (
                    filteredPlacements.map((placement: InternshipPlacement) => (
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
                              {placement.academic_supervisor?.first_name} {placement.academic_supervisor?.last_name?.[0]}.
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* ── Create Placement Modal ── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-end"
          aria-modal="true"
          role="dialog"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Panel */}
          <div className="relative z-10 w-full max-w-lg h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">Create Placement</h2>
                <p className="text-xs text-slate-500 mt-0.5">Assign a student to an internship position</p>
              </div>
              <button
                onClick={closeModal}
                disabled={submitting}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">

              {/* Section: People */}
              <SectionLabel label="People" />

              <FormSelect
                label="Student *"
                value={form.student_id}
                onChange={v => setField('student_id', v)}
                placeholder="Select a student"
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                ))}
              </FormSelect>

              <FormSelect
                label="Academic Supervisor *"
                value={form.academic_supervisor_id}
                onChange={v => setField('academic_supervisor_id', v)}
                placeholder="Select academic supervisor"
              >
                {academicSupervisors.map(s => (
                  <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                ))}
              </FormSelect>

              <FormSelect
                label="Workplace Supervisor *"
                value={form.workplace_supervisor_id}
                onChange={v => setField('workplace_supervisor_id', v)}
                placeholder="Select workplace supervisor"
              >
                {workplaceSupervisors.map(s => (
                  <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                ))}
              </FormSelect>

              {/* Section: Placement Details */}
              <SectionLabel label="Placement Details" />

              <FormInput
                label="Workplace *"
                type="text"
                placeholder="Type or select workplace"
                value={form.workplace_name}
                onChange={v => setField('workplace_name', v)}
                list="workplace-options"
              />
              <datalist id="workplace-options">
                {workplaces.map(w => (
                  <option key={w.id} value={w.name} />
                ))}
              </datalist>

              <FormSelect
                label="Department *"
                value={form.department_id}
                onChange={v => setField('department_id', v)}
                placeholder="Select department"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </FormSelect>

              <FormInput
                label="Position / Role Title *"
                type="text"
                placeholder="e.g. Junior Software Developer"
                value={form.position_title}
                onChange={v => setField('position_title', v)}
              />

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief description of the internship role..."
                  value={form.description}
                  onChange={e => setField('description', e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                />
              </div>

              {/* Section: Duration */}
              <SectionLabel label="Duration" />

              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Start Date *"
                  type="date"
                  value={form.start_date}
                  onChange={v => setField('start_date', v)}
                />
                <FormInput
                  label="End Date *"
                  type="date"
                  value={form.end_date}
                  onChange={v => setField('end_date', v)}
                />
              </div>

              {/* Error */}
              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
                  {formError}
                </div>
              )}
            </form>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="placement-form"
                disabled={submitting}
                onClick={handleSubmit}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                ) : (
                  <><Plus className="w-4 h-4" /> Create Placement</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{label}</p>
      <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
    </div>
  );
}

function FormSelect({
  label, value, onChange, placeholder, children,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none px-4 py-2.5 pr-10 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all"
        >
          <option value="">{placeholder}</option>
          {children}
        </select>
        <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

function FormInput({
  label, type, placeholder, value, onChange, list,
}: {
  label: string; type: string; placeholder?: string; value: string; onChange: (v: string) => void; list?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        list={list}
        className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all"
      />
    </div>
  );
}
