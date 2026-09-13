"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  GraduationCap,
  Briefcase,
  UserPlus,
  Clock,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

interface School {
  id: string;
  education_level: string;
  curriculum_subjects_loaded: boolean;
}

interface RegistrationRow {
  id: string;
  name: string;
  registration_number: string;
  type: "teacher" | "student" | "non_teaching";
  status: string;
  created_at: string;
}

const typeLabels: Record<string, { label: string; color: string }> = {
  teacher: { label: "Teacher", color: "bg-indigo-50 text-indigo-700" },
  student: { label: "Student", color: "bg-blue-50 text-blue-700" },
  non_teaching: {
    label: "Non-Teaching",
    color: "bg-purple-50 text-purple-700",
  },
};

export default function AdmissionsOfficerPage() {
  const router = useRouter();
  const supabase = createClient();

  const [school, setSchool] = useState<School | null>(null);
  const [teacherCount, setTeacherCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [nonTeachingCount, setNonTeachingCount] = useState(0);
  const [recentRegistrations, setRecentRegistrations] = useState<
    RegistrationRow[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data: sm } = await supabase
        .from("school_members")
        .select("school_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .limit(1)
        .single();

      if (!sm || cancelled) return;

      const schoolId = sm.school_id;

      const { data: schoolData } = await supabase
        .from("schools")
        .select("id, education_level, curriculum_subjects_loaded")
        .eq("id", schoolId)
        .single();

      if (!cancelled && schoolData) {
        setSchool(schoolData as School);
      }

      const [teachers, students, nonTeaching, recentStaff, recentStudents, recentNonTeaching] =
        await Promise.all([
          supabase
            .from("school_members")
            .select("id", { count: "exact", head: true })
            .eq("school_id", schoolId)
            .eq("role", "teacher")
            .eq("is_active", true),
          supabase
            .from("students")
            .select("id", { count: "exact", head: true })
            .eq("school_id", schoolId)
            .eq("is_active", true),
          supabase
            .from("non_teaching_staff")
            .select("id", { count: "exact", head: true })
            .eq("school_id", schoolId)
            .eq("status", "active"),
          supabase
            .from("staff_registrations")
            .select("id, first_name, last_name, employee_number, status, created_at")
            .eq("school_id", schoolId)
            .order("created_at", { ascending: false })
            .limit(10),
          supabase
            .from("student_registrations")
            .select("id, first_name, last_name, admission_number, status, created_at")
            .eq("school_id", schoolId)
            .order("created_at", { ascending: false })
            .limit(10),
          supabase
            .from("non_teaching_staff")
            .select("id, first_name, last_name, staff_number, status, created_at")
            .eq("school_id", schoolId)
            .order("created_at", { ascending: false })
            .limit(10),
        ]);

      if (cancelled) return;

      setTeacherCount(teachers.count ?? 0);
      setStudentCount(students.count ?? 0);
      setNonTeachingCount(nonTeaching.count ?? 0);

      const allRecent: RegistrationRow[] = [
        ...(recentStaff.data ?? []).map((r) => ({
          id: r.id,
          name: `${r.first_name} ${r.last_name}`,
          registration_number: r.employee_number,
          type: "teacher" as const,
          status: r.status,
          created_at: r.created_at,
        })),
        ...(recentStudents.data ?? []).map((r) => ({
          id: r.id,
          name: `${r.first_name} ${r.last_name}`,
          registration_number: r.admission_number,
          type: "student" as const,
          status: r.status,
          created_at: r.created_at,
        })),
        ...(recentNonTeaching.data ?? []).map((r) => ({
          id: r.id,
          name: `${r.first_name} ${r.last_name}`,
          registration_number: r.staff_number,
          type: "non_teaching" as const,
          status: r.status,
          created_at: r.created_at,
        })),
      ]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 10);

      setRecentRegistrations(allRecent);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    if (!school || school.curriculum_subjects_loaded || seeding) return;

    setSeeding(true);
    fetch("/api/admissions/cbc-seed", { method: "POST" })
      .then((r) => r.json())
      .then(() => {
        setSchool((prev) =>
          prev ? { ...prev, curriculum_subjects_loaded: true } : prev
        );
        setSeeding(false);
      })
      .catch(() => setSeeding(false));
  }, [school, seeding]);

  const total = teacherCount + studentCount + nonTeachingCount;

  const stats = [
    {
      label: "Teachers",
      count: teacherCount,
      icon: Users,
      accent: "text-indigo-600 bg-indigo-50",
    },
    {
      label: "Students",
      count: studentCount,
      icon: GraduationCap,
      accent: "text-blue-600 bg-blue-50",
    },
    {
      label: "Non-Teaching",
      count: nonTeachingCount,
      icon: Briefcase,
      accent: "text-purple-600 bg-purple-50",
    },
    {
      label: "Total",
      count: total,
      icon: Users,
      accent: "text-foreground bg-muted",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Admissions Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            School population overview and quick registration
          </p>
        </div>
        {seeding && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Loading CBC subjects…
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.accent}`}
              >
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {loading ? "—" : stat.count}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              Loading…
            </div>
          ) : recentRegistrations.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground text-sm">
              No registrations yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-3 text-left font-medium text-muted-foreground">
                      Name
                    </th>
                    <th className="p-3 text-left font-medium text-muted-foreground">
                      Number
                    </th>
                    <th className="p-3 text-left font-medium text-muted-foreground">
                      Type
                    </th>
                    <th className="p-3 text-left font-medium text-muted-foreground">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentRegistrations.map((reg) => {
                    const typeInfo =
                      typeLabels[reg.type] ?? typeLabels.teacher;
                    return (
                      <tr
                        key={reg.id}
                        className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-3 font-medium text-foreground">
                          {reg.name}
                        </td>
                        <td className="p-3 text-muted-foreground font-mono text-xs">
                          {reg.registration_number}
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${typeInfo.color}`}
                          >
                            {typeInfo.label}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {new Date(reg.created_at).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" }
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => router.push("/admissions-officer/staff/new")}>
            <UserPlus className="h-4 w-4" />
            Register Teacher
          </Button>
          <Button variant="outline" onClick={() => router.push("/admissions-officer/students/new")}>
            <GraduationCap className="h-4 w-4" />
            Register Student
          </Button>
          <Button variant="outline" onClick={() => router.push("/admissions-officer/non-teaching")}>
            <Briefcase className="h-4 w-4" />
            Register Non-Teaching Staff
          </Button>
        </div>
      </div>
    </div>
  );
}
