'use client';
import { useState } from 'react';
import { DashboardLayout, PageHeader } from '@/components/layout';
import { Card, Button, Input } from '@/components/ui';
import { 
  Settings, 
  Shield, 
  Bell, 
  Database, 
  Globe, 
  Lock, 
  Mail, 
  Server,
  Cloud,
  Terminal,
  Activity
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('system');

  const tabs = [
    { id: 'system', label: 'System Configuration', icon: Server },
    { id: 'security', label: 'Security & Access', icon: Shield },
    { id: 'notifications', label: 'Communications', icon: Bell },
    { id: 'backup', label: 'Data & Backup', icon: Database },
  ];

  return (
    <DashboardLayout>
      <PageHeader 
        title="Institutional Control"
        subtitle="Manage global system parameters, security policies, and data integrity."
      />

      <div className="space-y-8">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl w-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-tighter ${activeTab === tab.id ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Settings Panel */}
          <Card className="lg:col-span-2 p-8" variant="panel">
            {activeTab === 'system' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-6">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white">Global Infrastructure</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base environment variables</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="System Name" defaultValue="ILES Platform v2.0" />
                  <Input label="Institution Domain" defaultValue="mak.ac.ug" />
                  <Input label="API Endpoint URL" defaultValue="https://api.iles-mak.org" />
                  <Input label="Admin Email" defaultValue="admin@iles.mak.ac.ug" />
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Year Parameters</p>
                  <div className="grid grid-cols-2 gap-4">
                    <select className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 py-3 px-4 text-sm font-bold">
                      <option>2023/2024 Academic Year</option>
                      <option>2024/2025 Academic Year</option>
                    </select>
                    <select className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 py-3 px-4 text-sm font-bold">
                      <option>Semester 1</option>
                      <option>Semester 2</option>
                      <option>Recess Term</option>
                    </select>
                  </div>
                </div>

                <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                  <Button variant="ghost">Reset Defaults</Button>
                  <Button className="px-8">Deploy Changes</Button>
                </div>
              </div>
            )}
            
            {activeTab !== 'system' && (
              <div className="py-20 text-center opacity-40">
                <Terminal className="w-12 h-12 mx-auto mb-4" />
                <h4 className="text-sm font-black uppercase tracking-widest">Advanced Console Locked</h4>
                <p className="text-xs">This module is currently undergoing security audit.</p>
              </div>
            )}
          </Card>

          {/* System Status Side Panel */}
          <div className="space-y-6">
            <Card className="p-6 bg-slate-900 text-white" variant="panel">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-xs font-black uppercase tracking-[0.2em]">Live Nodes</h4>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-bold text-emerald-500 uppercase">Operational</span>
                </div>
              </div>
              <div className="space-y-4">
                <StatusRow label="Core API" status="99.9% Uptime" />
                <StatusRow label="DB Engine" status="4ms Latency" />
                <StatusRow label="CDN Assets" status="Active" />
              </div>
              <Button variant="ghost" className="w-full mt-8 border-white/10 text-white hover:bg-white/5 h-10 text-[10px] font-black uppercase tracking-widest">
                Full System Report
              </Button>
            </Card>

            <Card className="p-6 border-dashed border-2 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-4 text-amber-500">
                <Activity className="w-5 h-5" />
                <h4 className="font-black text-sm uppercase tracking-tight">System Audit</h4>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Last integrity scan performed 14 minutes ago. No anomalies detected in placement records or evaluation hashes.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatusRow({ label, status }: { label: string, status: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/5">
      <span className="text-[10px] font-medium text-slate-400">{label}</span>
      <span className="text-[10px] font-black text-white">{status}</span>
    </div>
  );
}