'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout, PageHeader } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { api } from '@/lib/api';
import { 
  Building, 
  Plus, 
  Search, 
  Users, 
  MapPin, 
  ChevronRight,
  GraduationCap,
  Globe,
  Activity,
  Layers
} from 'lucide-react';

export default function DepartmentsAdminPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.getDepartments();
        setDepartments(data || []);
      } catch (error) {
        console.error('Failed to fetch departments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <DashboardLayout>
      <PageHeader 
        title="Departmental Hierarchy"