# DECIMAL TUITION — SPEC FILE 02 — Information Architecture

## 1. Sitemap (by space)

```
TUITION
├── LEARN (student)                     /tuition
│   ├── Home                            /tuition
│   ├── Explore                         /tuition/explore
│   ├── My Learning                     /tuition/my-learning
│   ├── Programme detail                /tuition/programmes/[id]
│   ├── Learning player                 /tuition/learn/[programmeId]/[lessonId]
│   ├── Assignments                     /tuition/assignments
│   │   └── Assignment detail           /tuition/assignments/[id]
│   ├── Assessments                     /tuition/assessments
│   │   ├── Instructions                /tuition/assessments/[id]/instructions
│   │   ├── Taking an assessment        /tuition/assessments/[id]/take
│   │   └── Result review               /tuition/assessments/[id]/result
│   ├── Live Classes                    /tuition/classes
│   │   └── Classroom                   /tuition/classes/[id]
│   ├── Activities                      /tuition/activities
│   │   └── Activity detail             /tuition/activities/[id]
│   ├── Progress                        /tuition/progress
│   ├── Achievements                    /tuition/achievements
│   └── Certificates                    /tuition/certificates
│
├── TEACH (teacher workspace)           /tuition/teacher
│   ├── Dashboard                       /tuition/teacher
│   ├── My Programmes                   /tuition/teacher/programmes
│   │   ├── Create step 1–5             /tuition/teacher/programmes/new
│   │   ├── Edit plan                   /tuition/teacher/programmes/[id]/edit
│   │   └── Programme detail (manage)   /tuition/teacher/programmes/[id]
│   ├── Content Library                 /tuition/teacher/content
│   ├── Students                        /tuition/teacher/students
│   │   └── Student profile             /tuition/teacher/students/[id]
│   ├── Assignments                     /tuition/teacher/assignments
│   ├── Assessments                     /tuition/teacher/assessments
│   │   ├── Builder                     /tuition/teacher/assessments/new
│   │   └── Results                     /tuition/teacher/assessments/[id]/results
│   ├── Question Bank                   /tuition/teacher/question-bank
│   ├── Live Classes                    /tuition/teacher/classes
│   ├── Activities                      /tuition/teacher/activities
│   └── Analytics                       /tuition/teacher/analytics
│
├── SCHOOL (principal/admin; read-only for finance/admissions_officer/secretary)            /tuition/school
│   ├── Dashboard                       /tuition/school
│   ├── Programmes                      /tuition/school/programmes
│   │   └── Programme analytics         /tuition/school/programmes/[id]
│   ├── Teachers                        /tuition/school/teachers
│   ├── Students                        /tuition/school/students
│   ├── Enrolments                      /tuition/school/enrolments
│   ├── Assessments                     /tuition/school/assessments
│   │   ├── Adopt network assessment    /tuition/school/assessments/adopt
│   │   └── Assessment participation    /tuition/school/assessments/[id]
│   ├── Activities                      /tuition/school/activities
│   ├── Events                          /tuition/school/events
│   ├── Network                         /tuition/school/network
│   │   ├── Network programmes          /tuition/school/network/programmes
│   │   └── Network assessments         /tuition/school/network/assessments
│   └── Analytics                       /tuition/school/analytics
│
└── NETWORK (platform/network coord; teacher read + participate)    /tuition/network
    ├── Dashboard                       /tuition/network
    ├── Schools                         /tuition/network/schools
    ├── Programmes                      /tuition/network/programmes
    ├── Assessments                     /tuition/network/assessments
    │   └── Results & benchmarking      /tuition/network/assessments/[id]/results
    ├── Activities                      /tuition/network/activities
    └── Analytics                       /tuition/network/analytics
```

Shared, role-independent:
```
/tuition/profile
/tuition/profile/[type]/[id]    (student / teacher / school public profiles)
/tuition/notifications
/tuition/search
/tuition/settings              (tabbed: account, notifications, privacy, learning prefs, accessibility)
/tuition/onboarding            (student-first-run wizard)
```

## 2. Product switcher (global)

Top of the sidebar, above nav items:

```
┌──────────────────────────────┐
│  ◉ DECIMAL   ▾               │   ← brand block, clickable dropdown
├──────────────────────────────┤
│  ▸ School Management         │
│    Run your school           │
│  ▸ Tuition                   │
│    Teach, learn & grow       │   ← active item highlighted
└──────────────────────────────┘
```

Rules:
- Pure navigation. `/dashboard` (or current role portal root) = School Management; `/tuition` = Tuition.
- Never logs out, never resets school context, never clears filters.
- On mobile/open state: rendered as a menu item at the top of the slide-over.
- Active product is also reflected in the topbar brand label so users always know where they are.

## 3. Student navigation (desktop left rail — order + icons)

| # | Item | Route | Icon (lucide) |
|---|---|---|---|
| 1 | Home | `/tuition` | Compass |
| 2 | Explore | `/tuition/explore` | Search |
| 3 | My Learning | `/tuition/my-learning` | BookOpen |
| 4 | Classes | `/tuition/classes` | Video |
| 5 | Assessments | `/tuition/assessments` | ClipboardList |
| 6 | Activities | `/tuition/activities` | Trophy |
| 7 | Progress | `/tuition/progress` | TrendingUp |
| 8 | Achievements | `/tuition/achievements` | Medal |

Secondary (footer): Profile, Notifications, Settings.

## 4. Teacher navigation (desktop left rail — order + icons)

| # | Item | Route | Icon |
|---|---|---|---|
| 1 | Dashboard | `/tuition/teacher` | LayoutDashboard |
| 2 | My Programmes | `/tuition/teacher/programmes` | Library |
| 3 | Content | `/tuition/teacher/content` | FolderOpen |
| 4 | Students | `/tuition/teacher/students` | GraduationCap |
| 5 | Assignments | `/tuition/teacher/assignments` | FileText |
| 6 | Assessments | `/tuition/teacher/assessments` | ClipboardList |
| 7 | Question Bank | `/tuition/teacher/question-bank` | Database |
| 8 | Live Classes | `/tuition/teacher/classes` | Video |
| 9 | Activities | `/tuition/teacher/activities` | Trophy |
| 10 | Analytics | `/tuition/teacher/analytics` | BarChart3 |

Quick "New" button pinned under nav (New Programme · New Assessment · New Lesson) → `+` primary button.

## 5. School admin navigation

Dashboard · Programmes · Teachers · Students · Enrolments · Assessments · Activities · Events · Network · Analytics · Settings.

## 6. Platform/network navigation

Dashboard · Schools · Programmes · Assessments · Network · Activities · Moderation · Content · Analytics · Platform · Settings.

## 7. Mobile navigation (student + teacher)

- Bottom tab bar (student): Home, Explore, My Learning (center, elevated), Assessments, Activities. Teacher keeps sidebar drawer.
- Player screens hide global nav (full-screen, immersive), expose back affordance + progress rail.
- Assessment-taking hides ALL nav (exam isolation). Show only timer + question navigator.

## 8. Role architecture mapping

> Identity note — product user types vs `member_role` values.
> `member_role` enum = `super_admin, principal, teacher, finance, admissions_officer, secretary, parent`.
> `student` is NOT a `member_role` value. `parent` is a member role, but both `student` and `parent` also exist as **product user types** (valid personas). Neither is handled in middleware or `routeRoleMap`: student/parent tuition identities are resolved at the tuition **layout** level via `tuition_student_users.user_id` / `students.parent_user_id` — middleware only protects member-role portals.

| Tuition space | member roles (via RBAC) | product user types (via layout identity bridge) | note |
|---|---|---|---|
| Learn/student screens | parent (read-only), principal/teacher (read), finance/admissions_officer/secretary (read-only) | student (take/learn), parent (read-only via linked child) | student rows come from `students` table + enrolment |
| Teach/teacher screens | teacher, principal, super_admin (school mode); finance/admissions_officer/secretary (read-only) | — | content create/edit/publish |
| Assess | teacher (create/grade), principal (read), finance/admissions_officer/secretary (view_results) | student (take) | parent reads grades only |
| Activities | teacher (organize), principal (approve), finance/admissions_officer/secretary (read) | student (join) | |
| Network | super_admin (publish, moderate), principal (adopt/publish), teacher (read + participate) | — | benchmarking is aggregated only; moderation is super_admin only |

Read-only access for `finance`, `admissions_officer`, `secretary`: RBAC `read` + `view_results` on `tuition_*` resources (dashboard, programmes, assessment statistics, activities, network aggregates). They view data inside their school only — never create/edit/publish/grade/enrol.

Students are not `school_members` — they are `students` rows. Their "user" identity is either `students.parent_user_id`-linked auth user (if the student logs in), or via a `tuition_student_users` join (student → auth user) added in the tuition migration. The student UI authenticates through the same `(platform)` auth gate; student/parent identities are resolved in the tuition layout (not middleware): if `membership.role` is absent or is `parent`, resolve via `students` (by `parent_user_id` or a tuition student-user link) and render the student shell. (Details in route architecture + data model files.)