# Decimal

**School management for clearer, faster, and more connected school operations.**

[![Live app](https://img.shields.io/badge/live%20app-decimal.omixsystems.store-4F46E5?style=flat-square)](https://decimal.omixsystems.store)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)

Decimal is a multi-school management platform for administrators, teachers, finance teams, admissions officers, secretaries, and parents. It provides role-based portals for managing students, staff, attendance, fees, admissions, exams, timetables, announcements, and notifications.

The application is available as a responsive web app and can also be packaged as a Progressive Web App, Android application, or desktop application.

## Highlights

- Role-based access for platform administrators, principals, teachers, finance teams, admissions officers, secretaries, and parents
- School, student, staff, class, subject, and academic-year management
- Attendance tracking with offline support and background synchronization
- Fees, student accounts, payments, admissions, announcements, and internal messaging
- Exams, grading, results analysis, and report workflows
- Timetable creation, printing, teacher assignments, and room management
- Supabase Row Level Security (RLS) for school-scoped data access
- Google OAuth and Cloudflare Turnstile support
- Responsive PWA experience with Android and desktop packaging

## Tech stack

| Area | Technology |
| --- | --- |
| Web framework | Next.js 16 App Router |
| Language | TypeScript |
| UI | React 19, Tailwind CSS 4, Base UI, Framer Motion |
| Authentication and database | Supabase Auth and Supabase Postgres |
| Offline support | Serwist and IndexedDB |
| Mobile packaging | Capacitor 8 |
| Desktop packaging | Tauri 2 |
| Hosting | Vercel |

## Prerequisites

- Node.js 22 or newer
- npm
- A Supabase project
- A Google Cloud OAuth application for Google sign-in
- A Cloudflare Turnstile site and secret key

## Getting started

From the repository root:

```bash
cd decimal-app
npm install
cp .env.local.example .env.local
```

Fill in `.env.local` with values for your Supabase project, Google OAuth, and Cloudflare Turnstile configuration. The environment variable names and descriptions are documented in [`.env.local.example`](.env.local.example).

Apply the database migrations to your Supabase project:

```bash
npx supabase db push --project-ref <your-project-ref>
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For the complete Supabase, OAuth, first-school, and first-admin setup, see [`DOCUMENTATION.md`](DOCUMENTATION.md).

## Available commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | Check TypeScript without emitting files |
| `npm run build` | Create a production build using the required Webpack pipeline |
| `npm run start` | Serve the production build locally |
| `bash scripts/generate-icons.sh` | Regenerate PWA, favicon, Android, and Tauri icons |
| `bash scripts/build-android.sh` | Build the Android package |
| `bash scripts/build-desktop.sh` | Build the desktop package |

## Application areas

| Area | Purpose |
| --- | --- |
| Super admin | Manage schools, users, platform settings, and audit activity |
| Principal | Manage school operations, staff, students, academics, fees, exams, admissions, and timetables |
| Teacher | View classes and timetables, manage attendance, and work with exams |
| Parent | View children, attendance, fees, and school communication |
| Admissions officer | Review applications and manage admissions-related records |
| Finance | Manage fee structures, payments, balances, and collection reporting |
| Secretary | Manage announcements, messages, staff information, and office tasks |

Access is controlled by the authenticated user's school membership and role. Database access is further protected by Supabase RLS policies.

## Project structure

```text
decimal-app/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Login, registration, and auth callbacks
│   │   ├── (public)/        # Landing, docs, legal, and download pages
│   │   ├── (platform)/      # Role-based portals
│   │   └── api/             # Auth, admin, and offline sync endpoints
│   ├── components/          # Shared UI, landing, and platform components
│   ├── hooks/               # Online status and offline mutation hooks
│   └── lib/                 # Supabase, IndexedDB, sync, and shared utilities
├── supabase/migrations/     # Ordered database schema and policy migrations
├── public/                  # PWA assets, icons, manifest, and offline fallback
├── android/                 # Capacitor Android project
├── src-tauri/               # Tauri desktop project
└── scripts/                 # Build, icon, signing, and compatibility scripts
```

## Database migrations

Migrations are stored in [`supabase/migrations`](supabase/migrations) and should be applied in filename order. They define the schema, role types, timetable and exam features, self-registration, and RLS policies.

To link a local Supabase CLI project:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

Do not commit `.env.local`, service-role keys, OAuth secrets, Turnstile secrets, signing keys, or other credentials.

## Building for Android

Android builds require an Android SDK and JDK 21. Set `JAVA_HOME` and `ANDROID_HOME`, then run:

```bash
npx cap sync android
cd android
./gradlew assembleDebug
```

If your local environment only has JDK 17, run the compatibility patch before building:

```bash
bash scripts/patch-capacitor-jdk17.sh
```

The patch must be reapplied after each `npx cap sync android`.

## Building for desktop

Install Rust and the platform dependencies, then run:

```bash
npx tauri build
```

Desktop artifacts are written under `src-tauri/target/release/bundle/`.

## Deployment

The web application is designed for Vercel:

```bash
npm run build
npm run start
```

For a production deployment with the Vercel CLI:

```bash
vercel --prod --yes
```

Configure all runtime environment variables in the Vercel project settings. Do not expose server-only values such as `TURNSTILE_SECRET_KEY` or `SUPABASE_CAPTCHA_SECRET` to the browser.

## Contributing

1. Create a branch for your change.
2. Install dependencies with `npm install`.
3. Run `npm run lint`, `npx tsc --noEmit`, and `npm run build`.
4. Keep database changes in a new, ordered migration.
5. Open a pull request with a concise description and verification notes.

The project-specific development conventions are documented in [`AGENTS.md`](AGENTS.md).

## Links

- [Live application](https://decimal.omixsystems.store)
- [Full setup and operations documentation](DOCUMENTATION.md)
- [GitHub repository](https://github.com/twistedoliver211fs-art/decimal)
