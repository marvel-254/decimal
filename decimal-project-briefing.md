# Phikila Multi-School Management System

## Product Briefing, UX Direction & MVP Development Plan

**Version:** 1.0\
**Date:** September 2026\
**Product:** Phikila\
**Positioning:** Multi-school management and school operations platform

------------------------------------------------------------------------

# 1. Executive Summary

## 1.1 Product vision

Phikila is a multi-school management platform designed primarily for
**school administrations**, while providing dedicated experiences for
principals, teachers, non-teaching staff, and parents.

The product should help a school move from fragmented administration and
disconnected information toward a single operational system where
decision-makers can quickly see what needs attention, take action, and
monitor school performance.

The product should feel like a **modern command center for running a
school**, rather than a children's learning application.

## 1.2 Elevator pitch

> **Phikila brings school administration, academics, attendance,
> finance, admissions, communication, reporting and intelligent
> timetable management into one connected platform --- designed to keep
> schools running even when connectivity is unreliable.**

## 1.3 Core problem

Schools need to coordinate many interconnected operations:

-   Students and staff
-   Attendance
-   Fees and finance
-   Academic records
-   Admissions and enrolment
-   Communication
-   Timetables
-   Reports and decision-making

The central UX problem is not simply storing this information. It is
helping administrators answer:

> **What needs my attention today, and what should I do about it?**

Phikila therefore uses an **action-first information hierarchy** rather
than treating every metric as equally important.

## 1.4 Product principles

1.  **Action before information.**
2.  **One platform, role-specific experiences.**
3.  **One design system, slightly different portal personalities.**
4.  **Mobile is important from day one.**
5.  **Offline capability is a core product requirement.**
6.  **Critical records must never be silently overwritten.**
7.  **Authentication identifies the person; Phikila determines
    authorization.**
8.  **AI assists people and deterministic scheduling logic rather than
    replacing it.**
9.  **School context must always be obvious to administrators working
    across schools.**
10. **Build from first principles rather than reproducing the existing
    application.**

The existing GitHub repository was identified as
`phikila-school-management-system` under `langattr-cloud`; it is treated
as a technical/reference artifact rather than the UX or product
specification for the new product. fileciteturn1file0

------------------------------------------------------------------------

# 2. Target Audience & Personas

## 2.1 Primary audience

The primary commercial and operational audience is **school
administration**.

### Persona: Super Admin

**Goal:** Operate and support the entire Phikila platform.

Needs: - See platform-wide problems - Manage schools - Manage users -
Monitor system health - Manage subscription foundations - Communicate
with principals - Enter a school and operate it as a principal - Audit
important actions

Personality of portal: **Analytical, precise, authoritative, calm.**

### Persona: Principal / School Administrator

**Goal:** Run the school effectively.

Needs: - Know what requires attention - Monitor attendance - Monitor
staff presence - Track fees - Manage admissions - Monitor academic
performance - Communicate with staff and parents - Manage timetable and
school operations - Access reports

Personality: **Executive, decision-oriented, operational.**

### Persona: Teacher

**Goal:** Manage teaching responsibilities efficiently.

Needs: - See today's classes - View timetable - View assigned students -
Take attendance - Record marks and academic information - Communicate
with school - See workload and tasks - Work in poor-connectivity
environments

Personality: **Productive, focused, fast.**

### Persona: Non-teaching staff

Initial fixed operational roles can include: - Finance/Bursar -
Admissions Officer - Secretary/Office Administrator

The MVP should use **fixed role-specific portals**, rather than exposing
a complicated custom-role builder.

Personality: **Task-focused and role-specific.**

### Persona: Parent / Guardian

**Goal:** Understand how their child is doing and what the school needs
from them.

Needs: - Child overview - Attendance - Fees - Academic performance -
Timetable - Announcements - Communication

Personality: **Simple, reassuring, clear.**

### Students

Students are **not direct portal users in the MVP**. Their records are
managed through the administration, teacher and parent experiences.

------------------------------------------------------------------------

# 3. Product Architecture & Portal Model

## 3.1 Portals

Phikila consists of:

1.  Super Admin Portal
2.  Principal / School Admin Portal
3.  Teacher Portal
4.  Non-teaching Staff Portals
5.  Parent Portal

All use one underlying design system.

Each portal changes: - Information hierarchy - Dashboard composition -
Available navigation - Density - Terminology - Relevant accent
treatments

The portals should still unmistakably feel like one product.

------------------------------------------------------------------------

# 4. Authentication & Entry Experience

## 4.1 Authentication decision

**Google OAuth is the only authentication mechanism.**

There is no Phikila email/password login.

Google answers:

> **Who is this person?**

Phikila answers:

> **Which school(s) and role(s) does this person have, and what are they
> allowed to do?**

## 4.2 Existing-user flow

``` text
LANDING PAGE
     |
     v
SIGN IN
     |
     v
Continue with Google
     |
     v
Google authentication
     |
     v
Find Phikila account
     |
     +---- Account not found ----> Explain + Register School / Try another account
     |
     v
Check account status
     |
     v
Determine school + role + permissions
     |
     v
Open correct portal
```

A user should not manually select their role during normal sign-in.

## 4.3 Multiple-school account

If a user belongs to multiple schools:

``` text
Google authentication
       |
       v
Multiple school memberships?
       |
     YES
       |
       v
Choose School
       |
       v
Open role-specific portal
```

A single-school user should go directly to their portal without seeing a
school-selection screen.

------------------------------------------------------------------------

# 5. Landing Page Wireframe

## 5.1 Desktop

``` text
┌────────────────────────────────────────────────────────────────────────────┐
│ PHIKILA       Platform  Features  Timetable  For Schools  About            │
│                                      Sign In   [ Register your School ]     │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│     THE SCHOOL MANAGEMENT PLATFORM                                        │
│                                                                            │
│     Run your school                                                       │
│     with clarity.                                                         │
│                                                                            │
│     Administration, academics, attendance, finance, admissions,            │
│     communication and intelligent scheduling in one platform.             │
│                                                                            │
│     [ Register your School ]   [ Get a Demo ]                             │
│     Sign in with Google →                                                 │
│                                                                            │
│                         ┌────────────────────────────────────────────┐     │
│                         │        PHIKILA DASHBOARD PREVIEW          │     │
│                         │                                            │     │
│                         │  Needs Attention      Attendance   Fees    │     │
│                         │  ───────────────      ─────────   ─────    │     │
│                         │  12 absent             94%         82%     │     │
│                         │  3 admissions          8 overdue           │     │
│                         │                                            │     │
│                         │             Timetable preview              │     │
│                         └────────────────────────────────────────────┘     │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│ KNOW WHAT NEEDS YOUR ATTENTION                                            │
│                                                                            │
│  12 students absent       8 fee accounts overdue      3 admissions       │
│  [View Attendance]        [Review Fees]               [Review]             │
├────────────────────────────────────────────────────────────────────────────┤
│ EVERYTHING YOUR SCHOOL NEEDS                                              │
│                                                                            │
│ School Operations    Academic Management    Finance & Admissions          │
│ Students             Academics              Fees & Finance                │
│ Staff                Assessments             Admissions                   │
│ Attendance            Results                 Enrolment                    │
│ Office               Performance              Reports                      │
│                                                                            │
│ Communication        Intelligent Timetables                                │
│ Announcements        Classes / Teachers / Rooms                            │
│ Messages             Workload / Availability                              │
│ Notifications        Constraints / Conflicts / AI                         │
├────────────────────────────────────────────────────────────────────────────┤
│ BUILD BETTER TIMETABLES. AUTOMATICALLY.                                   │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────┐     │
│  │ MON      TUE       WED       THU       FRI                      │     │
│  │ 8:00     Math      English   Math      Science                  │     │
│  │ 9:00     ...       ...       ...       ...                      │     │
│  │                                                                  │     │
│  │ 🔴 Scheduling conflict                                            │     │
│  │ Mr. Kamau is assigned to two lessons at 10:00.                   │     │
│  │                                                                  │     │
│  │ AI suggestion: Move Grade 9B Mathematics to Tuesday 11:00.      │     │
│  │ [ Review suggestion ]                                             │     │
│  └──────────────────────────────────────────────────────────────────┘     │
├────────────────────────────────────────────────────────────────────────────┤
│ KEEP WORKING WHEN THE CONNECTION DOESN'T                                  │
│                                                                            │
│       ONLINE → WORK → OFFLINE → RECONNECT → AUTO-SYNC → ✓ UP TO DATE      │
│                                                                            │
│  Attendance · Timetable · Student Records · Academic Records              │
├────────────────────────────────────────────────────────────────────────────┤
│ ONE PLATFORM. BUILT AROUND EVERY ROLE.                                    │
│                                                                            │
│ Super Admin | Principal | Teacher | Staff | Parent                        │
├────────────────────────────────────────────────────────────────────────────┤
│ KEEP EVERYONE CONNECTED                                                   │
│                                                                            │
│ Principal ↔ Teachers       Principal ↔ Parents       Super Admin ↔ School │
├────────────────────────────────────────────────────────────────────────────┤
│ BUILT FOR RESPONSIBLE SCHOOL MANAGEMENT                                   │
│                                                                            │
│ Role-based access | Audit trails | Secure authentication | Safe sync       │
├────────────────────────────────────────────────────────────────────────────┤
│                    READY TO RUN YOUR SCHOOL DIFFERENTLY?                   │
│              [ Register your School ]   [ Get a Demo ]                     │
├────────────────────────────────────────────────────────────────────────────┤
│ PHIKILA     Platform  Features  Timetable  Privacy  Terms  Contact         │
└────────────────────────────────────────────────────────────────────────────┘
```

## 5.2 Landing-page hierarchy

The visual priority should be:

1.  Value proposition
2.  Register a School
3.  Product proof
4.  Action-first school management
5.  Core capabilities
6.  Timetable/AI differentiator
7.  Offline capability
8.  Role-specific experiences
9.  Communication
10. Trust/security
11. Conversion CTA

The page should be **product-led**, not dominated by stock photography.

------------------------------------------------------------------------

# 6. Login Wireframe

``` text
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│                         PHIKILA                                            │
│                                                                            │
│              ┌──────────────────────────────────┐                          │
│              │                                  │                          │
│              │           Welcome back           │                          │
│              │                                  │                          │
│              │   Sign in to your Phikila        │                          │
│              │   account.                       │                          │
│              │                                  │                          │
│              │   ┌──────────────────────────┐   │                          │
│              │   │  G  Continue with Google │   │                          │
│              │   └──────────────────────────┘   │                          │
│              │                                  │                          │
│              │   Phikila uses Google to         │                          │
│              │   securely authenticate your     │                          │
│              │   account. No Phikila password   │                          │
│              │   is required.                   │                          │
│              │                                  │                          │
│              │   Don't have a school?           │                          │
│              │   Register your School           │                          │
│              │                                  │                          │
│              │   Want to see Phikila first?     │                          │
│              │   Get a Demo                     │                          │
│              │                                  │                          │
│              │   Terms · Privacy                │                          │
│              └──────────────────────────────────┘                          │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

No: - Email field - Password field - Forgot password - Username - Manual
role selector

------------------------------------------------------------------------

# 7. School Registration Flow

``` text
Landing
  |
  v
Register your School
  |
  v
Continue with Google
  |
  v
1. SCHOOL
  School name
  School type
  Country
  Address
  Phone
  Email
  Website
  Staff count
  Education level
  |
  v
2. ADMINISTRATION
  Principal name
  Principal phone
  Principal email
  |
  v
3. SCHOOL PROFILE
  Initial profile/configuration
  |
  v
4. REVIEW & SUBMIT
  |
  v
Registration submitted
  |
  v
Pending approval
```

The registration should be short and guided. Detailed setup happens
after approval.

The "Get a Website" option can remain a secondary CTA connected to the
organization's website service; it must never interrupt or block school
registration.

------------------------------------------------------------------------

# 8. Super Admin Portal

## 8.1 Dashboard objective

Primary question:

> **What needs my attention right now?**

The dashboard hierarchy:

1.  Errors / significant issues
2.  Schools needing attention
3.  System health
4.  Recent activity
5.  Secondary platform metrics

## 8.2 Desktop wireframe

``` text
┌────────────────────────────────────────────────────────────────────────────┐
│ PHIKILA    Search schools, users, students, issues...   🔔  Admin ▼       │
├───────────────────┬────────────────────────────────────────────────────────┤
│ PLATFORM          │                                                        │
│                   │ Good morning, Admin                                   │
│ Dashboard         │ Here's what needs your attention.                     │
│ Schools           │                                                        │
│ Users             │ ┌──────────────────────────────────────────────────┐  │
│ Subscriptions     │ │ NEEDS YOUR ATTENTION                            │  │
│ Monitoring        │ │                                                  │  │
│ Communication     │ │ 🔴 2 critical system issues                     │  │
│ Reports           │ │ 🟠 3 schools require attention                  │  │
│                   │ │ 🟡 1 subscription expires in 5 days             │  │
│ ADMINISTRATION    │ │                                                  │  │
│                   │ │ [Review Attention Items]                         │  │
│ Audit Log         │ └──────────────────────────────────────────────────┘  │
│ Settings          │                                                        │
│ Super Admins      │ Schools Needing Attention                             │
│                   │ ┌──────────────┬─────────────┬────────┬────────────┐ │
│                   │ │ School       │ Issue       │Priority│ Action     │ │
│                   │ ├──────────────┼─────────────┼────────┼────────────┤ │
│                   │ │ Green Valley │ Subscription │ High  │ Review     │ │
│                   │ │ St Mary's    │ User limit  │ Med   │ Review     │ │
│                   │ │ Hillcrest    │ Onboarding  │ Low   │ Continue   │ │
│                   │ └──────────────┴─────────────┴────────┴────────────┘ │
│                   │                                                        │
│                   │ Platform Overview                                      │
│                   │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐          │
│                   │ │Schools │ │ Users  │ │Students│ │ Subs   │          │
│                   │ │ 48     │ │ 1,284  │ │18,642  │ │43      │          │
│                   │ └────────┘ └────────┘ └────────┘ └────────┘          │
│                   │                                                        │
│                   │ System Health                 Recent Activity          │
│                   │ ✓ API Operational             2m Settings updated      │
│                   │ ✓ Database Operational        14m New registration     │
│                   │ ✓ Authentication              31m Import completed     │
│                   │ ✓ Sync Operational            1h School accessed       │
└───────────────────┴────────────────────────────────────────────────────────┘
```

## 8.3 Healthy-state behavior

When there are no significant issues:

> **All systems operating normally**

The interface should become visually quieter instead of manufacturing
urgency.

## 8.4 Needs Attention model

Items can be:

-   Critical
-   High
-   Medium
-   Low

Sources:

-   System-generated
-   Admin-generated

Every attention item should communicate:

**What happened → Why it matters → What can I do?**

Admin-created flags should support: - Reason - Priority - Optional due
date - Notes - Assignment to Super Admin

------------------------------------------------------------------------

# 9. Super Admin School Control Center

The Super Admin must be able to operate a school without duplicating the
entire school-management interface.

Flow:

``` text
Super Admin Dashboard
      ↓
Schools
      ↓
Select School
      ↓
School Control Center
      ↓
Enter School
      ↓
Normal Principal Experience
      ↓
Exit School
      ↓
Super Admin
```

The header must make context unmistakable:

> **SUPER ADMIN · GREEN VALLEY ACADEMY · PRINCIPAL VIEW**

A persistent **Exit School** action should be available.

Sensitive actions should record: - Who - What - Which school - When

------------------------------------------------------------------------

# 10. Principal Portal

## 10.1 Dashboard hierarchy

Primary question:

> **What requires action at my school today?**

### Section 1 --- Needs Your Attention

Examples:

-   12 students with attendance concerns
-   2 teachers/staff absent
-   8 overdue fee accounts
-   3 admissions requiring action
-   Important messages
-   Pending administrative tasks

Each item should deep-link directly to the relevant workflow.

### Section 2 --- Today's School Overview

-   Student attendance
-   Staff attendance
-   Fees
-   Admissions/enrolment
-   Timetable/events where useful

### Section 3 --- School Performance

-   Academic performance
-   Attendance trends
-   Fee collection trends
-   Enrollment trends

### Section 4 --- Communication

Important conversations and announcements.

## 10.2 Mobile wireframe

``` text
┌───────────────────────────────┐
│ PHIKILA                  🔔    │
│ Principal                     │
├───────────────────────────────┤
│ Good morning                  │
│ Here's what needs attention.  │
│                               │
│ NEEDS YOUR ATTENTION           │
│ ┌───────────────────────────┐ │
│ │ 12 Attendance concerns    │ │
│ │ [View Attendance]         │ │
│ ├───────────────────────────┤ │
│ │ 8 Overdue fee accounts    │ │
│ │ [Review Fees]             │ │
│ ├───────────────────────────┤ │
│ │ 3 Admissions              │ │
│ │ [Review Admissions]       │ │
│ └───────────────────────────┘ │
│                               │
│ TODAY                         │
│ Student Attendance     94%    │
│ Staff Attendance       97%    │
│ Fee Collection         82%    │
│                               │
│ PERFORMANCE                   │
│ Academic trend  ↗             │
│ Attendance trend ↗            │
│                               │
├───────────────────────────────┤
│ Home  Students  Staff  More  │
└───────────────────────────────┘
```

------------------------------------------------------------------------

# 11. Teacher Portal

The teacher experience must not look like a smaller Principal portal.

## Primary navigation

-   Dashboard
-   My Timetable
-   My Students
-   Attendance
-   Academics
-   Communication
-   Profile

## Dashboard

``` text
┌────────────────────────────────┐
│ Good morning, James       🔔   │
│                                │
│ TODAY                          │
│ ┌────────────────────────────┐ │
│ │ 08:00  Grade 8A Mathematics│ │
│ │ 09:00  Grade 9B Mathematics│ │
│ │ 11:00  Grade 8A Science    │ │
│ └────────────────────────────┘ │
│                                │
│ TASKS                          │
│ Attendance: Grade 8A           │
│ Marks pending: 2 assessments   │
│                                │
│ MY WORKLOAD                    │
│ 22 / 24 lessons                │
│ 2 free capacity                │
│                                │
│ ANNOUNCEMENTS                  │
│ School announcement...         │
├────────────────────────────────┤
│ Home  Timetable  Students More │
└────────────────────────────────┘
```

Teacher permissions must restrict access to assigned classes, students
and subjects.

------------------------------------------------------------------------

# 12. Non-teaching Staff Portals

Use dedicated role-focused interfaces.

### Finance/Bursar

Primary areas: - Dashboard - Student Accounts - Payments - Balances -
Receipts - Fee Structures - Finance Reports - Communication

### Admissions Officer

Primary areas: - Dashboard - Applications - Applicants - Review -
Enrolment - Records - Reports - Communication

### Secretary/Office Administrator

Primary areas: - Dashboard - Office Tasks - Students - Staff -
Admissions support - Timetable/Calendar - Communication - Reports

Avoid a complicated custom-permission builder in the MVP.

------------------------------------------------------------------------

# 13. Parent Portal

The parent experience should be deliberately simple.

Primary questions:

> **How is my child doing?**

> **Does the school need anything from me?**

> **What important information do I need?**

## Mobile wireframe

``` text
┌───────────────────────────────┐
│ PHIKILA                 🔔    │
│                               │
│ Hello, Parent                 │
│                               │
│ MY CHILDREN                   │
│ ┌───────────────────────────┐ │
│ │ Jane Wanjiku              │ │
│ │ Grade 8A                  │ │
│ │ Attendance       96%      │ │
│ │ Academic status  Good     │ │
│ └───────────────────────────┘ │
│                               │
│ ATTENTION                     │
│ Fee balance available         │
│ [View Fees]                   │
│                               │
│ RECENT                        │
│ School announcement           │
│ Academic result posted        │
│                               │
│ QUICK ACCESS                  │
│ Attendance | Fees | Academics │
│ Timetable | Messages          │
├───────────────────────────────┤
│ Home  Child  Messages  More   │
└───────────────────────────────┘
```

Multiple children should be supported.

------------------------------------------------------------------------

# 14. Core School Modules

## Students

-   Student directory
-   Student profiles
-   Classes/streams
-   Attendance history
-   Academic records
-   Fee accounts
-   Import/export

## Staff

-   Teachers
-   Non-teaching staff
-   Profiles
-   Attendance
-   Roles/permissions
-   Workload

## Attendance

-   Student attendance
-   Staff attendance
-   Daily/monthly reports
-   Trends
-   Alerts

## Fees & Finance

-   Fee structures
-   Student accounts
-   Payments
-   Balances
-   Receipts
-   Financial reports

Actual payment processing is a later monetization/payment phase; the
product should establish the finance architecture now.

## Academics

-   Subjects
-   Classes
-   Assessments/exams
-   Marks/results
-   Comments
-   Academic reports
-   Performance analytics

## Admissions

-   Applications
-   Applicants
-   Review workflow
-   Admission
-   Enrolment
-   Records

## Communication

-   Announcements
-   Direct messages
-   Targeted messages
-   Broadcasts
-   Notification center

## Reports

-   Attendance
-   Finance
-   Academic
-   Admissions
-   Staff
-   Exports

## Office

Office should be an **operational planning workspace**, not simply CRUD.

Includes: - Timetable - Teacher timetables - Class timetables - Student
timetables - Rooms - Workload - Academic calendar - Conflicts

## Settings

-   School profile
-   Academic configuration
-   Users and permissions
-   Notifications
-   Branding
-   Import/export

------------------------------------------------------------------------

# 15. Timetable System

The timetable is a major product differentiator.

## 15.1 Design principles

The visual grid should be consistent across:

-   Class timetable
-   Teacher timetable
-   Room timetable
-   Student timetable

Users should learn one timetable interface and understand all views.

## 15.2 Core entities

-   Classes/streams
-   Students
-   Teachers
-   Subjects
-   Rooms
-   Periods
-   School days

## 15.3 Constraints

### Hard constraints --- Must

Examples: - Teacher cannot teach two classes simultaneously. - Class
cannot have two lessons simultaneously. - Room cannot host incompatible
simultaneous lessons. - Teacher unavailable periods must be respected.

### Preferred constraints --- Should

Examples: - Preferred teacher availability - Balanced teacher workload -
Preferred subject placement - Avoid undesirable gaps

### Nice-to-have

Soft preferences that may be sacrificed when necessary.

## 15.4 Workload

Example:

``` text
Teacher: Mr. Kamau

Assigned lessons       22 / 24
Free capacity           2
Consecutive overloads   0
Availability conflicts  0
```

## 15.5 Conflict visualization

Conflicts must be vivid and explainable.

``` text
┌────────────────────────────────────────────┐
│ 🔴 COLLISION DETECTED                      │
│                                            │
│ Mr. Kamau                                  │
│ Grade 8A Mathematics   10:00               │
│ Grade 9B Mathematics   10:00               │
│                                            │
│ Suggested resolution                       │
│ Move Grade 9B Mathematics → Tue 11:00      │
│                                            │
│ [ Fix with AI ]  [ Fix Manually ]          │
└────────────────────────────────────────────┘
```

Severity: - Critical - Warning - Suggestion

## 15.6 AI model

Recommended architecture:

``` text
Admin intent / constraints
          ↓
AI interpretation
          ↓
Structured scheduling constraints
          ↓
Deterministic scheduling engine
          ↓
Candidate timetable
          ↓
Validation / collision detection
          ↓
AI explanation + suggestions
          ↓
Human review
          ↓
Publish
```

AI should not be allowed to silently make authoritative timetable
changes.

The system should report preference satisfaction, for example:

> **98% preference satisfaction** 1 preference could not be satisfied.

------------------------------------------------------------------------

# 16. Offline-First Product Strategy

Offline support is a first-day requirement.

## 16.1 Offline-capable workflows

Where safely supported:

-   Attendance
-   Timetable viewing
-   Assigned student viewing
-   Academic/mark entry
-   Notes
-   Student records relevant to the user
-   Other essential staff workflows

## 16.2 Offline UX

When offline:

> **Offline · Changes saved on this device**

When synchronizing:

> **Syncing 8 changes...**

After completion:

> **All changes synced**

The system should not make users manually manage synchronization.

## 16.3 Synchronization model

``` text
User action
    ↓
Save locally immediately
    ↓
Queue change
    ↓
Connectivity unavailable?
    ├── Yes → Continue working
    └── No  → Sync
                 ↓
             Validate
                 ↓
          Conflict detected?
             ├── No → Complete
             └── Yes → Resolve
```

## 16.4 Critical records

The following must be protected against accidental overwriting:

-   Attendance
-   Academic/marks
-   Fees
-   Student records

Every change should carry sufficient metadata for safe reconciliation,
including: - User - Timestamp - Record/version information -
Device/session context where appropriate

## 16.5 Conflict resolution

Do not use a simplistic last-write-wins policy for important records.

Example:

``` text
ATTENDANCE CONFLICT

Jane Wanjiku

Your offline version:     PRESENT
Current server version:   ABSENT

Changed while this device was offline.

[ Review & Resolve ]
```

Normal users should only see synchronization complexity when a genuine
conflict exists.

------------------------------------------------------------------------

# 17. Communication Architecture

## 17.1 Hierarchy

### Super Admin ↔ Principal

Direct platform communication is limited to principals.

### Principal ↔ Staff

Principal can communicate with teachers and non-teaching staff.

### Principal ↔ Parents

Principal/school can communicate with parents.

### Staff anonymous suggestions

Teachers and non-teaching staff can submit suggestions anonymously to
the Principal.

The Super Admin must **not** be able to see: - Suggestion content -
Author identity

This must be protected at the data/authorization layer, not merely
hidden in the UI.

Suggested status:

``` text
New
 ↓
Under Review
 ↓
In Progress
 ↓
Resolved
 ↓
Archived
```

The Principal can respond without revealing the author.

Super Admin may receive aggregate statistics, but not identifying
suggestion data.

------------------------------------------------------------------------

# 18. Notifications

MVP uses **in-app notifications only**.

Email and SMS can be added later.

## Shared notification center

-   Unread count
-   Read/unread
-   Important
-   Archived
-   Deep links

Examples:

### Principal

-   Staff message
-   Parent message
-   Attendance alert
-   Fee alert
-   Admissions task
-   Timetable change
-   Super Admin message
-   Anonymous suggestion update

### Teacher

-   Announcement
-   Timetable change
-   Attendance task
-   Academic task
-   Principal message

### Parent

-   School announcement
-   Fee update
-   Attendance update
-   Academic result
-   Timetable change

### Super Admin

-   Platform error
-   School needing attention
-   New registration
-   Subscription event
-   Principal message
-   System incident

------------------------------------------------------------------------

# 19. School Registration & Onboarding

## 19.1 School lifecycle

``` text
Pending
   ↓
Approved
   ↓
Active
   ↓
Suspended
   ↓
Archived
```

Subscription status is separate.

Example:

``` text
Account: Active
Subscription: Trial
Onboarding: 80%
```

## 19.2 Registration fields

### School

-   School name
-   School type: Public / Private / International / Other
-   Country
-   Address
-   Phone
-   Email
-   Website
-   Staff count
-   Education level:
    -   Junior School
    -   Senior School
    -   Junior & Senior School

### Principal

-   Name
-   Phone
-   Email

School type and education level should remain separate concepts.

## 19.3 Setup wizard

After approval:

``` text
1. School Profile
2. Academic Structure
3. Staff
4. Students
5. Finance
6. Communication
7. Review
```

### School Profile

-   Logo
-   Name
-   Contact
-   Address
-   Website
-   Type
-   Education level

### Academic Structure

-   Academic year
-   Terms
-   Grades/classes
-   Streams
-   Subjects
-   Curriculum configuration

The product should be flexible enough to support Kenya's CBC/CBE
environment without hardcoding assumptions that prevent future
configuration.

### Staff

-   Administrators
-   Teachers
-   Other staff
-   Roles

### Students

-   Manual entry
-   Bulk import

### Finance

-   Fee categories
-   Fee structures
-   Payment settings

### Communication

-   Announcement configuration
-   Notification preferences

### Review

> **Your school is 85% ready.**

**\[ Finish Setup \]**

The wizard should allow Save & Continue and sensible Skip for later
actions. A missing student spreadsheet should not prevent a school from
entering the dashboard.

------------------------------------------------------------------------

# 20. Bulk Import UX

Students and staff require bulk import in the MVP.

## Flow

``` text
Download template
       ↓
Fill CSV/Excel
       ↓
Upload
       ↓
Validate
       ↓
Validation report
       ↓
Confirm
       ↓
Import
       ↓
Completion summary
```

Example:

> **482 records**
>
> 467 ready 15 need attention

Errors should identify: - Missing required field - Duplicate record -
Invalid date - Invalid class/grade - Unknown subject/class - Invalid
identifier

Imports must not silently destroy existing records.

Maintain import history and make failed/incomplete imports eligible for
the relevant attention system.

------------------------------------------------------------------------

# 21. Subscription & Monetization Foundation

Actual monetization/payment processing can be activated later.

The architecture should nevertheless support:

``` text
School
  ↓
Plan
  ↓
Subscription
  ↓
Status
  ↓
Limits / Entitlements
```

This allows the platform to introduce pricing later without rebuilding
school/account architecture.

Possible future subscription events: - Trial ending - Subscription
expiring - User limit approaching - Student limit approaching -
Suspended subscription

These can feed Super Admin's Needs Attention system.

------------------------------------------------------------------------

# 22. UI/UX Design Direction

## 22.1 Overall aesthetic

**Modern education SaaS + professional school administration.**

Characteristics:

-   Clean
-   Calm
-   Professional
-   Trustworthy
-   Data-aware
-   Generous spacing
-   Strong hierarchy
-   Restrained rounded components
-   Dense tables where operationally appropriate
-   Clear status indicators
-   Responsive layouts

Avoid: - Childish educational graphics - Excessive gradients - Overly
playful illustrations - Dashboard overload - Excessive rounded cards -
Treating every metric as equally important

## 22.2 Design system

Create one shared Phikila design system containing:

### Typography

Use a highly legible modern sans-serif family.

Recommended direction: - Inter - Plus Jakarta Sans - Or another
comparable accessible UI font

Use clear hierarchy rather than excessive font weights.

### Color

Use a restrained brand palette: - Primary brand color - Neutral
surface/background system - Success - Warning - Error - Informational

Do not make each portal a different product through different colors.

Portal differentiation should be subtle.

### Components

Build reusable: - Buttons - Inputs - Selects - Search - Cards - Tables -
Badges - Tabs - Dropdowns - Modals - Drawers - Toasts - Notification
cards - Charts - Timetable cells - Empty states - Loading states - Error
states - Offline/sync indicators

## 22.3 Accessibility

Target strong WCAG-oriented accessibility.

Requirements: - Adequate contrast - Keyboard accessibility - Visible
focus states - Touch targets appropriate for mobile - Labels for form
controls - Do not rely only on color to communicate status -
Screen-reader-friendly semantics - Clear error messages - Accessible
tables and timetable interactions

------------------------------------------------------------------------

# 23. Responsive Design Strategy

Mobile is important from day one.

The product should be designed as a responsive web application/PWA
rather than treating mobile as a later desktop adaptation.

## Desktop

Best for: - Administration - Reports - Finance - Complex student
management - Timetable construction - Platform monitoring

## Tablet

Best for: - Teachers - Principals - Office operations - Attendance

## Mobile

Best for: - Attendance - Timetable viewing - Communication - Quick
actions - Parent portal - Teacher workflows

Responsive behavior should change **layout and interaction patterns**,
not merely shrink components.

------------------------------------------------------------------------

# 24. Information Architecture

## Super Admin

``` text
Dashboard
Schools
Users
Subscriptions
Monitoring
Communication
Reports
Audit Log
Settings
Super Admins
```

## Principal

``` text
Dashboard
Students
Staff
Attendance
Fees & Finance
Academics
Admissions
Communication
Reports
Office
Settings
```

## Teacher

``` text
Dashboard
My Timetable
My Students
Attendance
Academics
Communication
Profile
```

## Non-teaching staff

Role-specific navigation.

## Parent

``` text
Home
Children
Attendance
Fees
Academics
Timetable
Communication
Profile
```

------------------------------------------------------------------------

# 25. Development Action Plan

## Phase 0 --- Product & technical foundation

Define: - Domain model - Multi-school tenancy model - User identity
model - Role model - Permission model - Audit model - Subscription
model - Notification model - Offline/sync architecture - Design token
architecture

Establish: - Responsive component system - Accessibility standards - API
conventions - Error handling - Loading/empty states - Security
boundaries

## Phase 1 --- Authentication & public experience

Build: - Landing page - Google OAuth - Account lookup - Role-based
routing - Multiple-school selection - Unknown-account state - School
registration - Registration approval state - Demo request flow

## Phase 2 --- School onboarding

Build: - School approval - School lifecycle - Setup wizard - Academic
structure - Staff setup - Student setup - Initial finance
configuration - Communication setup

## Phase 3 --- Core school operations

Build: - Students - Staff - Attendance - Academics - Fees & Finance -
Admissions - Communication - Reports - Settings

Prioritize mobile workflows from the beginning.

## Phase 4 --- Role portals

Complete: - Principal portal - Teacher portal - Non-teaching portals -
Parent portal

Implement strict role/school/class/subject permissions.

## Phase 5 --- Office & timetable

Build: - Classes - Teachers - Rooms - Periods - Availability -
Workload - Hard/soft constraints - Timetable grid - Collision
detection - Conflict explanation - Manual editing - Publish/unpublish -
Teacher/class/room/student views

## Phase 6 --- AI timetable assistance

Build AI around the scheduling engine:

-   Natural-language scheduling intent
-   Constraint interpretation
-   Suggested changes
-   Conflict explanation
-   Preference satisfaction explanation
-   "Fix with AI"
-   Human approval before authoritative changes

## Phase 7 --- Offline and synchronization hardening

Implement: - Local data/cache - Offline queues - Automatic sync -
Versioning - Idempotency - Conflict detection - Conflict resolution -
Sync status - Audit/history

Critical records: - Attendance - Marks - Fees - Student records

## Phase 8 --- Super Admin platform controls

Build: - Platform dashboard - School management - School Control
Center - Enter School / Exit School - User management - Monitoring -
Logs - Needs Attention - Communication center - Subscription
foundation - Audit log

------------------------------------------------------------------------

# 26. MVP Scope

## Build now

### Platform

-   Multi-school architecture
-   Super Admin
-   School management
-   Google OAuth
-   Role-based access
-   School context switching
-   Auditability
-   Subscription foundation

### School operations

-   Students
-   Staff
-   Attendance
-   Academics
-   Fees & Finance foundation
-   Admissions
-   Communication
-   Reports
-   Office

### Timetable

-   Classes
-   Teachers
-   Rooms
-   Workload
-   Availability
-   Constraints
-   Collision detection
-   Visual timetable
-   Manual adjustment
-   Publish/unpublish
-   AI-assisted scheduling

### Data

-   Student bulk import
-   Staff bulk import
-   Validation
-   Import history

### UX

-   Responsive design
-   Mobile-first important workflows
-   Offline support
-   Automatic synchronization
-   Critical-record conflict protection
-   In-app notifications

### Portals

-   Super Admin
-   Principal
-   Teacher
-   Non-teaching staff
-   Parent

## Later

-   Student portal
-   Email notifications
-   SMS notifications
-   Full payment processing
-   Advanced custom role builder
-   Advanced custom reporting
-   Broader integrations
-   Expanded monetization capabilities
-   Additional advanced AI features
-   Other optional school services

The exact later roadmap should be revisited after MVP usage and
engineering estimates.

------------------------------------------------------------------------

# 27. Critical UX Acceptance Criteria

The product should not be considered ready unless:

### Authentication

-   A user can authenticate with Google without a Phikila password.
-   Existing users are routed directly to the correct portal.
-   Unknown users cannot gain access simply by authenticating.
-   Multi-school users can select the correct school.

### School administration

-   Principal can identify important work immediately.
-   Super Admin can identify platform risk immediately.
-   Super Admin can enter a school without duplicating the school
    interface.
-   School context is always obvious.

### Mobile

-   Core workflows are usable comfortably on a phone.
-   Navigation is designed for touch.
-   Tables and timetable interfaces have mobile interaction strategies.

### Offline

-   Critical supported workflows can continue offline.
-   User changes are saved locally.
-   Changes automatically sync after reconnecting.
-   Sync failures are visible.
-   Critical conflicts are detected.
-   Critical data is not silently overwritten.

### Permissions

-   Users only see data they are authorized to access.
-   Teachers only access assigned students/classes/subjects.
-   Parent data is limited to their children.
-   Super Admin actions are auditable.
-   Anonymous staff suggestions remain anonymous to Super Admin.

### Timetable

-   The same visual language works across timetable views.
-   Collisions are obvious.
-   Errors explain the affected resources.
-   AI suggestions require appropriate human control.
-   Workload and room constraints are represented.

------------------------------------------------------------------------

# 28. Recommended Product North Star

The strongest unifying concept for Phikila is:

> **From information to action.**

A successful Phikila dashboard should not make a school administrator
wonder:

> "Where do I look?"

It should tell them:

> **"Here is what needs your attention, why it matters, and what you can
> do next."**

And a successful Phikila mobile/offline experience should not make a
teacher think:

> "I have no internet, so I can't work."

It should communicate:

> **"Keep working. Phikila will safely synchronize your work when you're
> connected again."**

That combination --- **action-first administration + role-specific
experiences + reliable offline operation + intelligent scheduling** ---
forms the core product identity of the new Phikila.

------------------------------------------------------------------------

# 29. Final UX Blueprint

``` text
                         PHIKILA
                            │
              ┌─────────────┴─────────────┐
              │                           │
         PUBLIC WEB                    AUTH
              │                           │
     ┌────────┼────────┐            Google OAuth
     │        │        │                  │
  Sign In  Register  Demo                 ↓
     │        │                     Identify User
     │        │                           │
     │     Google OAuth                   ↓
     │        │                     Determine Role
     │        │                           │
     │    School Review                   ↓
     │        │                   Determine School
     │        │                           │
     │        ↓                           ↓
     │   Setup Wizard              Correct Portal
     │
     └───────────────────────────────────────────────┐
                                                     │
                    ┌────────────────────────────────┼──────────────────┐
                    │                │               │                  │
               SUPER ADMIN       PRINCIPAL        TEACHER            PARENT
                    │                │               │                  │
                    │                │               │                  │
             Platform risk      School action    Daily work        Child status
             Schools            Students         Timetable         Attendance
             Monitoring         Staff            Attendance         Fees
             Subscriptions     Attendance       Academics          Academics
             Communication     Finance          Students            Timetable
                    │           Academics        Communication      Messages
                    │           Admissions
                    │           Timetable
                    │
                    ↓
             ENTER SCHOOL
                    │
                    ↓
             PRINCIPAL VIEW
                    │
                    ↓
              EXIT SCHOOL
                    │
                    ↓
             SUPER ADMIN
```

------------------------------------------------------------------------

# 30. Closing Product Statement

Phikila should be built as a **new product from first principles**, not
as a visual redesign of the previous application.

The MVP should establish a strong platform foundation while delivering
real operational value to schools:

**A school registers → gets approved → completes setup → administrators
manage the school → teachers operate from their own portal → parents
stay informed → essential work continues offline → data synchronizes
safely → principals see what needs attention → Super Admin can monitor
and support every school.**

The product's visual identity should remain coherent across all of these
experiences while allowing each portal to feel purpose-built for its
user.

The central design goal is simple:

> **Make running a school clearer, faster, safer and more connected.**
