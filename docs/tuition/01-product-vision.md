# DECIMAL TUITION — SPEC FILE 01 — Product Vision

## 1. Decimal vision

Decimal is evolving from *The School Management Platform* into:

> **A Digital Education Operating System for schools, teachers and learners in Africa.**

Two major domains share identity, auth, school context, permissions, billing and platform infrastructure:

```
DECIMAL
├── SCHOOL MANAGEMENT          →  "How do I run my school?"
│   ├── Dashboard · Students · Staff · Admissions · Attendance · Fees
│   ├── Timetable · Exams · Report Cards · Documents · Billing · Administration
│
└── TUITION                    →  "How do I teach, learn, assess and participate?"
    ├── LEARN      (student content + progress)
    ├── TEACH      (teacher content building)
    ├── ASSESS     (assignments, quizzes, exams, network benchmarking)
    ├── ACTIVITIES (clubs, sports, competitions, events)
    └── NETWORK    (cross-school programmes, assessments, benchmarking)
```

## 2. Tuition vision

Tuition is a **complete learning, teaching, assessment and co-curricular domain**, not a feature inside School Management. It lets a school run its academic and co-curricular life on one platform, and — through the Network — connect to other schools for shared assessments, benchmarking and competitions without ever leaking student identity across schools.

It works today for a single school (teacher-created programmes). It scales into the network (shared programmes, common assessments, leagues). It is designed so it could eventually be operated as a standalone product while remaining deeply integrated with Decimal.

## 3. Product relationship

- **Shared identity:** one Decimal login, one school context, one subscription.
- **Shared people:** the same `students`, `staff`, `parents`, `school_members` rows power both domains.
- **Shared primitives:** classes, grades, subjects, terms, academic years, notifications, permissions, billing.
- **Owned domain data:** programme/module/lesson/assessment/activity tables are new (migration 028+) and belong to Tuition.
- **Switching:** a product switcher in the sidebar ("Decimal ▾ → School Management · Tuition"). Authentication and school context persist across switches. Switching is pure navigation, no state.

## 4. Personas

| Persona | Needs |
|---|---|
| **Student** (Grade 4–12) | Clear next-step learning, engaging lessons, assignments with deadlines, quizzes that feel safe to retry, visible progress, certificates. |
| **Teacher** | Fast programme/lesson creation, reusable content library, question bank, assignment + assessment management, automated marking for objective questions, live visibility of completion, analsysis of weaknesses. |
| **Principal / School admin** | Adoption oversight, teacher workload, enrolment, engagement, assessment participation, results + benchmarking, network participation decisions. |
| **Parent** | Passive visibility: programme progress, upcoming assessments, grades, certificates. Read-only. |
| **Network coordinator / Platform admin** | Publisher/content moderation, school participation, common assessments, aggregate benchmarking, leagues/events. |

## 5. Design principles (binding)

1. Simple before clever.
2. Information hierarchy before decoration.
3. Reusable components before one-off components.
4. Clear actions before visual novelty.
5. Student-first learning experience (distraction-free).
6. Teacher-first content creation (low clicks-to-publish).
7. Administrator-first visibility and control.
8. Network features must feel trustworthy; privacy must be obvious (aggregated, anonymized only).
9. Mobile learning must be excellent (offline-cacheable, thumb-reachable).
10. Accessibility is not optional (WCAG 2.2 AA).
11. Every page has a clear purpose; every action gives clear feedback.
12. Avoid dashboard overload and excessive card layouts; make dense tables readable.
13. Everything ships with empty, loading, error, and success states.
14. Reuse Decimal's tokens, shell and components — never invent an orphan design.
15. AI features are future hooks, not MVP requirements, and never dominate the UI.

## 6. Quality bar

The spec targets the information architecture and interaction quality of Google Classroom, Moodle, Coursera, Khan Academy and Canvas — **not their visual designs**. The result must feel uniquely Decimal: modern, professional, fast, clear, educational, scalable, African, network-oriented.