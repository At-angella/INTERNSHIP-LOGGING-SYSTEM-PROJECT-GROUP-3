'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout, PageHeader } from '@/components/layout';
import { Card, Button, Input } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { InternshipPlacement } from '@/lib/types';
import { toast } from 'react-toastify';
import { ArrowLeft, Save, Calendar, Clock, Briefcase, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function NewLogPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placements, setPlacements] = useState<InternshipPlacement[]>([]);
  const [selectedPlacement, setSelectedPlacement] = useState('');
  const [loadingPlacements, setLoadingPlacements] = useState(true);
  const [weekNumber, setWeekNumber] = useState('');
  const [weekStartDate, setWeekStartDate] = useState('');
  const [weekEndDate, setWeekEndDate] = useState('');
  const [hoursWorked, setHoursWorked] = useState('');
  const [skillsAcquired, setSkillsAcquired] = useState('');
  const [challengesFaced, setChallengesFaced] = useState('');
  const [lessonsLearned, setLessonsLearned] = useState('');
  
  const [dailyLogs, setDailyLogs] = useState<Record<string, string>>(
    DAYS_OF_WEEK.reduce((acc, day) => ({ ...acc, [day]: '' }), {})
  );

  useEffect(() => {
    const fetchPlacements = async () => {
      try {
        const response = await api.getPlacements();
        const results = response.results || response || [];
        const activePlacements = results.filter(
          (p: InternshipPlacement) => p.status === 'APPROVED' || p.status === 'ACTIVE'
        );
        setPlacements(activePlacements);
        if (activePlacements.length > 0) {
          setSelectedPlacement(activePlacements[0].id.toString());
        }
      } catch (error) {
        console.error('Failed to fetch placements:', error);
        toast.error('Failed to load placements');
      } finally {
        setLoadingPlacements(false);
      }
    };
    if (user) {
      fetchPlacements();
    }
  }, [user]);

  const handleDayChange = (day: string, value: string) => {
    setDailyLogs(prev => ({ ...prev, [day]: value }));
  };

  const validateForm = () => {
    const errors: string[] = [];
    if (!selectedPlacement) errors.push('Placement is required');
    if (!weekNumber) errors.push('Week number is required');
    if (!weekStartDate) errors.push('Week start date is required');
    if (!weekEndDate) errors.push('Week end date is required');
    if (weekStartDate && weekEndDate && weekStartDate >= weekEndDate) {
      errors.push('Week end date must be after start date');
    }
    if (!hoursWorked || isNaN(Number(hoursWorked))) errors.push('Valid hours worked is required');
    if (Number(hoursWorked) < 0 || Number(hoursWorked) > 60) {
      errors.push('Hours worked must be between 0 and 60');
    }
    if (Object.values(dailyLogs).every(log => !log.trim())) errors.push('At least one day must have activities');
    if (!skillsAcquired.trim()) errors.push('Skills acquired is required');
    if (!challengesFaced.trim()) errors.push('Challenges faced is required');
    if (!lessonsLearned.trim()) errors.push('Lessons learned is required');
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach(error => toast.error('✗ ' + error));
      return;
    }

    setIsSubmitting(true);
    try {
      const activitiesPerformed = DAYS_OF_WEEK
        .map(day => `${day}: ${dailyLogs[day] || 'No activities'}`)
        .join('\n\n');

      await api.createWeeklyLog({
        placement: parseInt(selectedPlacement),
        week_number: parseInt(weekNumber),
        week_start_date: weekStartDate,
        week_end_date: weekEndDate,
        hours_worked: parseFloat(hoursWorked),
        activities_performed: activitiesPerformed,
        skills_acquired: skillsAcquired,
        challenges_faced: challengesFaced,
        lessons_learned: lessonsLearned,
        status: 'DRAFT',
      });

      toast.success('✓ Weekly log created successfully!', {
        position: 'top-right',
        autoClose: 3000,
      });

      router.push('/dashboard/student/logs');
    } catch (error: any) {
      toast.error('✗ ' + (error.message || 'Failed to create log'), {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center gap-2">
        <Link href="/dashboard/student/logs">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Logs
          </Button>
        </Link>
      </div>

      <PageHeader 
        title="Create Weekly Log"
        subtitle="Document your daily activities and hours worked for this week"
      />

      {!loadingPlacements && placements.length === 0 && (
        <div className="mb-6">
          <Card className="p-6 border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20" variant="glass">
            <div className="flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-amber-800 dark:text-amber-200">No Approved/Active Placement Found</h3>
                <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-1">
                  You must have an approved or active internship placement before you can submit weekly logs. If you recently submitted a placement request, please wait for administrative approval.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Log Details & Week Information */}
        <Card variant="panel" className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Log Details & Period</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Placement Select */}
              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">
                  Internship Placement *
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <select
                    value={selectedPlacement}
                    onChange={(e) => setSelectedPlacement(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm py-3 pl-12 pr-10 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 shadow-sm appearance-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-600"
                    disabled={loadingPlacements || placements.length === 0}
                    required
                  >
                    <option value="" disabled className="text-slate-400 bg-white dark:bg-slate-900">
                      {loadingPlacements ? 'Loading placements...' : 'Select your placement...'}
                    </option>
                    {placements.map((p) => (
                      <option key={p.id} value={p.id} className="text-slate-900 dark:text-white bg-white dark:bg-slate-900">
                        {p.position_title} at {p.workplace?.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Week Number */}
              <Input
                label="Week Number *"
                type="number"
                value={weekNumber}
                onChange={(e) => setWeekNumber(e.target.value)}
                placeholder="e.g., 1"
                icon={<Calendar className="w-5 h-5" />}
                min="1"
                max="52"
                required
              />

              {/* Week Start Date */}
              <Input
                label="Week Start Date *"
                type="date"
                value={weekStartDate}
                onChange={(e) => setWeekStartDate(e.target.value)}
                icon={<Calendar className="w-5 h-5" />}
                required
              />

              {/* Week End Date */}
              <Input
                label="Week End Date *"
                type="date"
                value={weekEndDate}
                onChange={(e) => setWeekEndDate(e.target.value)}
                icon={<Calendar className="w-5 h-5" />}
                required
              />

              {/* Hours Worked */}
              <Input
                label="Hours Worked *"
                type="number"
                value={hoursWorked}
                onChange={(e) => setHoursWorked(e.target.value)}
                placeholder="e.g., 40"
                icon={<Clock className="w-5 h-5" />}
                min="0"
                max="60"
                step="0.5"
                required
              />
            </div>
          </div>
        </Card>

        {/* Daily Activities */}
        <Card variant="panel" className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Daily Activities</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Document the activities, tasks, and accomplishments for each day of the week.
            </p>

            <div className="space-y-6">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day} className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {day}
                  </label>
                  <textarea
                    value={dailyLogs[day]}
                    onChange={(e) => handleDayChange(day, e.target.value)}
                    placeholder={`Describe activities and accomplishments for ${day}...`}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                    rows={4}
                  />
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Reflections & Challenges */}
        <Card variant="panel" className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Learning & Reflection</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Reflect on your experiences, skills developed, and challenges overcome during the week.
            </p>

            <div className="space-y-6">
              {/* Skills Acquired */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Skills Acquired *
                </label>
                <textarea
                  value={skillsAcquired}
                  onChange={(e) => setSkillsAcquired(e.target.value)}
                  placeholder="Describe the technical or soft skills you acquired or improved this week..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none animate-all duration-200"
                  rows={4}
                  required
                />
              </div>

              {/* Challenges Faced */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Challenges Faced *
                </label>
                <textarea
                  value={challengesFaced}
                  onChange={(e) => setChallengesFaced(e.target.value)}
                  placeholder="Detail any technical, team, or operational challenges you faced..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none animate-all duration-200"
                  rows={4}
                  required
                />
              </div>

              {/* Lessons Learned */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Lessons Learned *
                </label>
                <textarea
                  value={lessonsLearned}
                  onChange={(e) => setLessonsLearned(e.target.value)}
                  placeholder="What are the key takeaways or insights you gained from this week's activities..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none animate-all duration-200"
                  rows={4}
                  required
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <Link href="/dashboard/student/logs">
            <Button variant="ghost">Cancel</Button>
          </Link>
          <Button 
            type="submit"
            className="gap-2 bg-primary"
            isLoading={isSubmitting}
            disabled={isSubmitting || placements.length === 0}
          >
            <Save className="w-4 h-4" />
            Save & Submit Log
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
