/**
 * Decimal Tuition — per-space navigation (student/teacher/school/network).
 * Icons follow the platform sidebar convention (lucide).
 */

import {
  LayoutDashboard,
  Compass,
  BookOpen,
  Calendar,
  ClipboardList,
  Trophy,
  TrendingUp,
  Users,
  FileText,
  Database,
  Video,
  BarChart3,
  Award,
} from "lucide-react";
import type { TuitionNavItem, TuitionShellMode } from "@/lib/tuition/types";

export const tuitionNav: Record<TuitionShellMode, TuitionNavItem[]> = {
  student: [
    { label: "Home", href: "/tuition", icon: LayoutDashboard },
    { label: "Explore", href: "/tuition/explore", icon: Compass },
    { label: "My Learning", href: "/tuition/my-learning", icon: BookOpen },
    { label: "Classes", href: "/tuition/classes", icon: Calendar },
    { label: "Assessments", href: "/tuition/assessments", icon: ClipboardList },
    { label: "Activities", href: "/tuition/activities", icon: Trophy },
    { label: "Progress", href: "/tuition/progress", icon: TrendingUp },
  ],
  teacher: [
    { label: "Dashboard", href: "/tuition/teacher", icon: LayoutDashboard },
    { label: "My Programmes", href: "/tuition/teacher/programmes", icon: BookOpen },
    { label: "Content", href: "/tuition/teacher/content", icon: Database },
    { label: "Students", href: "/tuition/teacher/students", icon: Users },
    { label: "Assessments", href: "/tuition/teacher/assessments", icon: ClipboardList },
    { label: "Question Bank", href: "/tuition/teacher/question-bank", icon: FileText },
    { label: "Live Classes", href: "/tuition/teacher/live-classes", icon: Video },
    { label: "Activities", href: "/tuition/teacher/activities", icon: Trophy },
    { label: "Analytics", href: "/tuition/teacher/analytics", icon: BarChart3 },
  ],
  school: [
    { label: "Dashboard", href: "/tuition/school", icon: LayoutDashboard },
    { label: "Programmes", href: "/tuition/school/programmes", icon: BookOpen },
    { label: "Teachers", href: "/tuition/school/teachers", icon: Users },
    { label: "Students", href: "/tuition/school/students", icon: Award },
    { label: "Assessments", href: "/tuition/school/assessments", icon: ClipboardList },
    { label: "Activities", href: "/tuition/school/activities", icon: Trophy },
    { label: "Network", href: "/tuition/school/network", icon: TrendingUp },
  ],
  network: [
    { label: "Dashboard", href: "/tuition/network", icon: LayoutDashboard },
    { label: "Schools", href: "/tuition/network/schools", icon: Users },
    { label: "Programmes", href: "/tuition/network/programmes", icon: BookOpen },
    { label: "Assessments", href: "/tuition/network/assessments", icon: ClipboardList },
    { label: "Activities", href: "/tuition/network/activities", icon: Trophy },
    { label: "Moderation", href: "/tuition/network/moderation", icon: FileText },
  ],
};