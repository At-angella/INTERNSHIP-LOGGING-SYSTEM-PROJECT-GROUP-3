'use client';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/lib/auth';
import { FileText, Clock, CheckCircle, AlertCircle, ChevronRight, Calendar, Briefcase } from 'lucide-react';
import Link from 'next/link';
//import { PageHeader } from '@/components/pageheader';

const recentLogs = [
  { id: '1', week: 8, period: 'Mar 31 – Apr 6', status: 'APPROVED', hours: 40 },
  { id: '2', week: 7, period: 'Mar 24 – Mar 30', status: 'REVIEWED', hours: 38 },
  { id: '3', week: 6, period: 'Mar 17 – Mar 23', status: 'APPROVED', hours: 42 },
  { id: '4', week: 5, period: 'Mar 10 – Mar 16', status: 'SUBMITTED', hours: 35 },
];

export default function StudentDashboard() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Good morning, {user?.first_name} 👋</h1>
          <p className="text-gray-600 mt-2">Here's your internship progress at a glance</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Weeks Completed</p>
            <p className="text-3xl font-bold">8</p>
            <p className="text-xs text-gray-500 mt-2">of 12 total</p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Approved Logs</p>
            <p className="text-3xl font-bold">6</p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Pending Review</p>
            <p className="text-3xl font-bold">2</p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Hours Logged</p>
            <p className="text-3xl font-bold">314</p>
            <p className="text-xs text-gray-500 mt-2">this week: 40h</p>
          </div>
        </div>

        {/* Recent Logs */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Recent Weekly Logs</h2>
            <Link href="/dashboard/student/logs" className="text-blue-600 text-sm flex items-center gap-1">
              View all <ChevronRight size={16} />
            </Link>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Week</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Period</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Hours</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.map(log => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">Week {log.week}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{log.period}</td>
                  <td className="py-3 px-4">{log.hours}h</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      log.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Link href={`/dashboard/student/logs/${log.id}`} className="text-blue-600 hover:underline text-sm">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}