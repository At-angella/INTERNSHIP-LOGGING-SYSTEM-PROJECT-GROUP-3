'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
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
  CheckCheck,
  XCircle,
  AlertCircle,
  User as UserIcon,
  MapPin,
  Clock,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PlacementsAdminPage() {
  const [placements, setPlacements] = useState<InternshipPlacement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Create-placement modal
  const [modalOpen, setModalOpen] = useState(false);
  const [students, setStudents] = useState<User[]>([]);
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [departments, setDepartments] = useState<AcademicDepartment[]>([]);
  const [academicSupervisors, setAcademicSupervisors] = useState<User[]>([]);
  const [workplaceSupervisors, setWorkplaceSupervisors] = useState<User[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Detail / approve-reject panel
  const [selected, setSelected] = useState<InternshipPlacement | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // ── Data fetching ────────────────────────────────────────────────────────────

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
      const [studentsRes, supervisorsRes, workplacesRes, deptsRes] = await Promise.all([
        api.getStudents(),
        api.getSupervisors(),
        api.getWorkplaces(),
        api.getDepartments(),
      ]);

      const studentList: User[] = Array.isArray(studentsRes) ? studentsRes : (studentsRes?.results ?? []);
      const supervisorList: User[] = Array.isArray(supervisorsRes) ? supervisorsRes : (supervisorsRes?.results ?? []);
      const workplaceList: Workplace[] = Array.isArray(workplacesRes) ? workplacesRes : (workplacesRes?.results ?? []);
      const deptList: AcademicDepartment[] = Array.isArray(deptsRes) ? deptsRes : (deptsRes?.results ?? []);

      setStudents(studentList);
      setAcademicSupervisors(supervisorList.filter(u => u.role === 'ACADEMIC_SUPERVISOR'));
      setWorkplaceSupervisors(supervisorList.filter(u => u.role === 'WORKPLACE_SUPERVISOR'));
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

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const filteredPlacements = placements.filter((p: InternshipPlacement) =>
    `${p.student?.first_name} ${p.student?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.workplace?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.position_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const setField = (key: keyof FormState, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const openModal = () => { setForm(EMPTY_FORM); setFormError(''); setModalOpen(true); };
  const closeModal = () => { if (!submitting) setModalOpen(false); };

  const openDetail = (p: InternshipPlacement) => {
    setSelected(p);
  };
  const closeDetail = () => { if (!actionLoading) setSelected(null); };

  // ── Create placement ──────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const required: (keyof FormState)[] = [
      'student_id', 'workplace_name', 'academic_supervisor_id',
      'workplace_supervisor_id', 'department_id',
      'position_title', 'start_date', 'end_date',
    ];
    for (const key of required) {
      if (!form[key]) { setFormError('Please fill in all required fields.'); return; }
    }
    if (form.start_date >= form.end_date) { setFormError('End date must be after start date.'); return; }

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

  // ── Approve ───────────────────────────────────────────────────────────────────

  const handleApprove = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await api.approvePlacement(selected.id);
      toast.success('✓ Placement approved!', { position: 'top-right', autoClose: 3000 });
      setSelected(null);
      setLoading(true);
      await fetchPlacements();
    } catch (err: any) {
      toast.error('✗ ' + (err?.message || 'Failed to approve placement.'), { position: 'top-right', autoClose: 5000 });
    } finally {
      setActionLoading(false);
    }
  };

  // ── Reject ────────────────────────────────────────────────────────────────────

  const handleReject = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await api.rejectPlacement(selected.id);
      toast.success('✓ Placement rejected.', { position: 'top-right', autoClose: 3000 });
      setSelected(null);
      setLoading(true);
      await fetchPlacements();
    } catch (err: any) {
      toast.error('✗ ' + (err?.message || 'Failed to reject placement.'), { position: 'top-right', autoClose: 5000 });
    } finally {
      setActionLoading(false);
    }
  };

  // ── Complete ──────────────────────────────────────────────────────────────────

  const handleComplete = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await api.updatePlacementStatus(selected.id, 'COMPLETED');
      toast.success('✓ Placement marked as COMPLETED!', { position: 'top-right', autoClose: 3000 });
      setSelected(null);
      setLoading(true);
      await fetchPlacements();
    } catch (err: any) {
      toast.error('✗ ' + (err?.message || 'Failed to complete placement.'), { position: 'top-right', autoClose: 5000 });
    } finally {
      setActionLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

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
          <StatCard title="Pending Review" value={placements.filter(p => p.status === 'PENDING').length} icon={<AlertCircle />} color="text-amber-500" />
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
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredPlacements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center text-slate-400 text-sm">
                        No placements found. Click <strong>Create Placement</strong> to get started.
                      </td>
                    </tr>
                  ) : (
                    filteredPlacements.map((placement: InternshipPlacement) => (
                      <tr
                        key={placement.id}
                        onClick={() => openDetail(placement)}
                        className="hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors group cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-[10px]">
                              {placement.student?.first_name?.[0]}{placement.student?.last_name?.[0]}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {placement.student?.first_name} {placement.student?.last_name}
                              </p>
                              <p className="text-[10px] text-slate-500">{(placement.student as any)?.student_id}</p>
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
                        <td className="px-6 py-4 text-center">
                          {placement.status === 'PENDING' ? (
                            <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800 uppercase tracking-widest">
                              Review
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">View</span>
                          )}
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

      {/* ── Detail / Action Panel ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-start justify-end" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeDetail} />

          {/* Panel */}
          <div className="relative z-10 w-full max-w-lg h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-900 flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 z-10">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">Placement Details</h2>
                <p className="text-xs text-slate-500 mt-0.5">Review and take action on this internship placement</p>
              </div>
              <button
                onClick={closeDetail}
                disabled={actionLoading}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Banner */}
            <div className={`mx-6 mt-6 p-4 rounded-2xl border flex items-center gap-3 ${
              selected.status === 'APPROVED'  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' :
              selected.status === 'REJECTED'  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
              selected.status === 'PENDING'   ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' :
              selected.status === 'ACTIVE'    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
              'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
            }`}>
              <Statusbar status={selected.status} />
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {selected.status === 'PENDING'  && 'Awaiting admin review and approval decision.'}
                  {selected.status === 'APPROVED' && `Approved by admin.`}
                  {selected.status === 'ACTIVE'   && 'Internship is currently active.'}
                  {selected.status === 'REJECTED' && 'This placement was rejected.'}
                  {selected.status === 'COMPLETED'&& 'Internship has been completed.'}
                  {selected.status === 'CANCELLED'&& 'This placement was cancelled.'}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="px-6 py-6 space-y-5 flex-1">

              <SectionLabel label="Student" />
              <InfoRow icon={<UserIcon className="w-4 h-4" />} label="Name"
                value={`${selected.student?.first_name} ${selected.student?.last_name}`} />
              <InfoRow icon={<UserIcon className="w-4 h-4" />} label="Student ID"
                value={(selected.student as any)?.student_id || '—'} />
              <InfoRow icon={<UserIcon className="w-4 h-4" />} label="Email"
                value={selected.student?.email || '—'} />

              <SectionLabel label="Placement Details" />
              <InfoRow icon={<Building className="w-4 h-4" />} label="Workplace"
                value={selected.workplace?.name || '—'} />
              <InfoRow icon={<Briefcase className="w-4 h-4" />} label="Position"
                value={selected.position_title || '—'} />
              {(selected as any).description && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400">
                  {(selected as any).description}
                </div>
              )}

              <SectionLabel label="Duration" />
              <InfoRow icon={<Calendar className="w-4 h-4" />} label="Start Date"
                value={new Date(selected.start_date).toLocaleDateString()} />
              <InfoRow icon={<Calendar className="w-4 h-4" />} label="End Date"
                value={new Date(selected.end_date).toLocaleDateString()} />

              <SectionLabel label="Supervisors" />
              <InfoRow icon={<ShieldCheck className="w-4 h-4" />} label="Academic Supervisor"
                value={`${selected.academic_supervisor?.first_name} ${selected.academic_supervisor?.last_name}`} />
              <InfoRow icon={<ShieldCheck className="w-4 h-4" />} label="Workplace Supervisor"
                value={`${selected.workplace_supervisor?.first_name} ${selected.workplace_supervisor?.last_name}`} />

            </div>

            {/* Action Footer — shown for PENDING or ACTIVE */}
            {selected.status === 'PENDING' && (
              <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-6 py-4">
                <div className="flex gap-3">
                  <button
                    onClick={handleReject}
                    disabled={actionLoading}
                    className="flex-1 py-2.5 rounded-xl border border-red-200 dark:border-red-700 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    Reject
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
                    Approve
                  </button>
                </div>
              </div>
            )}

            {selected.status === 'ACTIVE' && (
              <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-6 py-4">
                <button
                  onClick={handleComplete}
                  disabled={actionLoading}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
                  Complete Placement
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Create Placement Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-end" aria-modal="true" role="dialog">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />

          <div className="relative z-10 w-full max-w-lg h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
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

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <SectionLabel label="People" />

              <FormSelect label="Student *" value={form.student_id} onChange={v => setField('student_id', v)} placeholder="Select a student">
                {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
              </FormSelect>

              <FormSelect label="Academic Supervisor *" value={form.academic_supervisor_id} onChange={v => setField('academic_supervisor_id', v)} placeholder="Select academic supervisor">
                {academicSupervisors.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
              </FormSelect>

              <FormSelect label="Workplace Supervisor *" value={form.workplace_supervisor_id} onChange={v => setField('workplace_supervisor_id', v)} placeholder="Select workplace supervisor">
                {workplaceSupervisors.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
              </FormSelect>

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
                {workplaces.map(w => <option key={w.id} value={w.name} />)}
              </datalist>

              <FormSelect label="Department *" value={form.department_id} onChange={v => setField('department_id', v)} placeholder="Select department">
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </FormSelect>

              <FormInput label="Position / Role Title *" type="text" placeholder="e.g. Junior Software Developer" value={form.position_title} onChange={v => setField('position_title', v)} />

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Description</label>
                <textarea
                  rows={3}
                  placeholder="Brief description of the internship role..."
                  value={form.description}
                  onChange={e => setField('description', e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                />
              </div>

              <SectionLabel label="Duration" />
              <div className="grid grid-cols-2 gap-4">
                <FormInput label="Start Date *" type="date" value={form.start_date} onChange={v => setField('start_date', v)} />
                <FormInput label="End Date *" type="date" value={form.end_date} onChange={v => setField('end_date', v)} />
              </div>

              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
                  {formError}
                </div>
              )}
            </form>

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
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Plus className="w-4 h-4" /> Create Placement</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

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

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{value}</p>
      </div>
    </div>
  );
}

function FormSelect({ label, value, onChange, placeholder, children }: {
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

function FormInput({ label, type, placeholder, value, onChange, list }: {
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
