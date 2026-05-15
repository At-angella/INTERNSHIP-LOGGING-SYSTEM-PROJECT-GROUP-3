'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout, PageHeader, Statusbar } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { InternshipPlacement } from '@/lib/types';
import { 
  Briefcase, 
  MapPin, 
  Calendar, 
  User, 
  Building, 
  Phone, 
  Mail, 
  Clock, 
  ShieldCheck,
  Globe,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

export default function StudentPlacementPage() {
  const { user } = useAuth();
  const [placement, setPlacement] = useState<InternshipPlacement | null>(null);
  const [loading, setLoading] = useState(true);
