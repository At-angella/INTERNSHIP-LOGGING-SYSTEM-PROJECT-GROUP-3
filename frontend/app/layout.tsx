import './globals.css';
import { AuthProvider } from '@/lib/auth';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Internship Management Platform',
  description: 'Comprehensive platform for internship logging and evaluation',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
