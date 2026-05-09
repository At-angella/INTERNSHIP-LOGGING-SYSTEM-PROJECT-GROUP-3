'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout, PageHeader, Statusbar } from '@/components/layout';
import { Card, Button, Input } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { InternshipPlacement, Evaluation } from '@/lib/types';
import {
  Award,
  TrendingUp,
  Target,
  Zap,
  Calendar,
  User,
  Filter,
  Search,
  Plus,
  ChevronRight,
  ClipboardCheck,
  Star,
  Activity,
  UserCheck
} 