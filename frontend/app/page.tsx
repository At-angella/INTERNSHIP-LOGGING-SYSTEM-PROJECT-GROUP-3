import Link from 'next/link';
import { LogIn, UserPlus } from 'lucide-react';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-4">
      <main className="flex flex-col items-center justify-center w-full max-w-5xl text-center space-y-12">
        <div className="space-y-6 animate-in fade-in duration-1000">
          <div className="inline-block px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary font-medium text-sm mb-4 backdrop-blur-md">
            Internship Logging & Evaluation System
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-white">
            Elevate Your <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-secondary">Internship Experience</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Bob the Builder, can wwe fix it.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-md mx-auto">
          <Link href="/login" className="btn-primary flex items-center justify-center gap-2 group w-full text-lg">
            <LogIn className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Sign In
          </Link>
          <Link href="/register" className="glass-card flex items-center justify-center gap-2 group w-full text-lg px-6 py-3 font-semibold text-slate-800 dark:text-slate-100 border hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors">
            <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform text-primary" />
            Register
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 w-full opacity-0 animate-[fade-in_1s_ease-out_0.5s_forwards]">
          <FeatureCard 
            title="Weekly Logbooks"
            description="Students can easily submit and track their weekly activities, reflections, and hours worked."
            icon="📝"
          />
          <FeatureCard 
            title="Supervisor Reviews"
            description="Workplace supervisors can review logs, provide feedback, and rate performance efficiently."
            icon="✅"
          />
          <FeatureCard 
            title="Academic Evaluations"
            description="Final automated weighted scoring and evaluation by academic supervisors."
            icon="📊"
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <div className="glass-card p-8 flex flex-col items-center text-center space-y-4 hover:border-primary/50 group cursor-default">
      <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform duration-300">
        <span className="group-hover:rotate-12 transition-transform duration-300 inline-block">{icon}</span>
      </div>
      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400">{description}</p>
    </div>
  );
}
