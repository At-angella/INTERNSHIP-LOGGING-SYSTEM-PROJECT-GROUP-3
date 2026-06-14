'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout, PageHeader } from '@/components/layout';
import { Card, Button, Input } from '@/components/ui';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';
import { ArrowLeft, Save, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function NewLogPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [weekNumber, setWeekNumber] = useState('');
  const [weekEndDate, setWeekEndDate] = useState('');
  const [hoursWorked, setHoursWorked] = useState('');
  const [dailyLogs, setDailyLogs] = useState<Record<string, string>>(
    DAYS_OF_WEEK.reduce((acc, day) => ({ ...acc, [day]: '' }), {})
  );

  const handleDayChange = (day: string, value: string) => {
    setDailyLogs(prev => ({ ...prev, [day]: value }));
  };

  const validateForm = () => {
    const errors: string[] = [];
    if (!weekNumber) errors.push('Week number is required');
    if (!weekEndDate) errors.push('Week end date is required');
    if (!hoursWorked || isNaN(Number(hoursWorked))) errors.push('Valid hours worked is required');
    if (Object.values(dailyLogs).every(log => !log.trim())) errors.push('At least one day must have activities');
    
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
        week_number: parseInt(weekNumber),
        week_end_date: weekEndDate,
        hours_worked: parseFloat(hoursWorked),
        activities_performed: activitiesPerformed,
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

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Week Information */}
        <Card variant="panel" className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Week Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                label="Week Number"
                type="number"
                value={weekNumber}
                onChange={(e) => setWeekNumber(e.target.value)}
                placeholder="e.g., 1"
                icon={<Calendar className="w-5 h-5" />}
                min="1"
                max="52"
              />
              <Input
                label="Week End Date"
                type="date"
                value={weekEndDate}
                onChange={(e) => setWeekEndDate(e.target.value)}
                icon={<Calendar className="w-5 h-5" />}
              />
              <Input
                label="Hours Worked"
                type="number"
                value={hoursWorked}
                onChange={(e) => setHoursWorked(e.target.value)}
                placeholder="e.g., 40"
                icon={<Clock className="w-5 h-5" />}
                min="0"
                step="0.5"
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
              {DAYS_OF_WEEK.map((day, index) => (
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

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <Link href="/dashboard/student/logs">
            <Button variant="ghost">Cancel</Button>
          </Link>
          <Button 
            type="submit"
            className="gap-2 bg-primary"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            <Save className="w-4 h-4" />
            Save & Submit Log
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
