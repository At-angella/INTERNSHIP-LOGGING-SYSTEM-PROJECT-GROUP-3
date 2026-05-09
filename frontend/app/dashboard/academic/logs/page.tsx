'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout, PageHeader, Statusbar } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { InternshipPlacement, WeeklyLog } from '@/lib/types';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  MessageSquare, 
  Calendar, 
  User, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  FileText
} 