'use client';
import React, { useState, useEffect } from 'react';
import { DashboardLayout, PageHeader, Statusbar } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { InternshipPlacement, WeeklyLog, Evaluation } from '@/lib/types';
import Link from 'next/link';
import { 
  GraduationCap, 
  FileText, 
  ClipboardCheck, 
  Search, 
  TrendingUp, 
  Calendar,
  AlertCircle,
  Users,
  ChevronRight,
  Plus,
  BarChart3
} from 'lucide-react';