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