# AMAL — Task & Productivity App

AMAL is a personal productivity app built with **Next.js 16** and **Firebase**. It covers the full GTD (Getting Things Done) workflow: capturing tasks, managing routines, organising meetings, writing notes, and tracking progress with gamification.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Getting Started](#getting-started)
4. [Firebase Setup](#firebase-setup)
5. [Environment Variables](#environment-variables)
6. [Application Routes](#application-routes)
7. [Data Models](#data-models)
8. [Firestore Collections & Security Rules](#firestore-collections--security-rules)
9. [Key Libraries & Hooks](#key-libraries--hooks)
10. [Component Architecture](#component-architecture)
11. [Running Tests](#running-tests)
12. [Deployment](#deployment)
13. [Development Conventions](#development-conventions)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Database | Cloud Firestore |
| Auth | Firebase Authentication (email/password + Google) |
| Styling | Vanilla CSS (`globals.css` + CSS variables) |
| Animation | Framer Motion |
| Icons | Lucide React |
| Testing | Vitest + React Testing Library + jsdom |
| Deployment | Firebase Hosting (`out/` static export) |

---

## Project Structure

```
amal-todo-app/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Login / signup pages (unauthenticated)
│   │   ├── (main)/               # Protected app shell (requires login)
│   │   │   ├── layout.tsx        # Auth guard + Sidebar + BottomNav
│   │   │   ├── dashboard/        # Home dashboard
│   │   │   ├── today/            # Today view (tasks + routines)
│   │   │   ├── tasks/            # All-tasks list + detail
│   │   │   ├── add/              # Quick-capture form
│   │   │   ├── new/              # Full task creation form
│   │   │   ├── edit/             # Task edit form
│   │   │   ├── someday/          # Someday/Maybe list
│   │   │   ├── logbook/          # Completed task history
│   │   │   ├── routines/         # Routine management
│   │   │   ├── meetings/         # Meeting list + detail
│   │   │   ├── notes/            # Notes (text & checklist)
│   │   │   ├── accounts/         # Accounts (projects/areas) list
│   │   │   ├── account/          # Single account view
│   │   │   ├── area/             # Area view
│   │   │   └── profile/          # User profile & settings
│   │   ├── globals.css           # Global CSS variables & base styles
│   │   └── layout.tsx            # Root layout (ThemeProvider, AuthProvider)
│   │
│   ├── components/
│   │   ├── today/                # UnifiedItemCard, Today-specific UI
│   │   ├── notes/                # Note editor, note card, checklist
│   │   ├── tasks/                # Task list, task card components
│   │   ├── gamification/         # StatsWidget, SomedaySweeper
│   │   ├── accounts/             # Account card components
│   │   ├── shared/               # Sidebar, BottomNav (navigation)
│   │   ├── providers/            # ThemeProvider wrapper
│   │   ├── ui/                   # Loading spinner, ThemeToggle, modals
│   │   └── universal/            # CaptureForm (quick add)
│   │
│   ├── lib/
│   │   ├── firebase/
│   │   │   ├── client.ts         # Firebase app init (auth + db exports)
│   │   │   ├── auth-context.tsx  # useAuth() React context
│   │   │   ├── tasks.ts          # Task CRUD + realtime listeners
│   │   │   ├── routines.ts       # Routine CRUD
│   │   │   ├── meetings.ts       # Meeting CRUD
│   │   │   ├── notes.ts          # Notes CRUD
│   │   │   ├── accounts.ts       # Accounts CRUD
│   │   │   ├── user_stats.ts     # Karma & streak logic
│   │   │   └── converters.ts     # Firestore type converters
│   │   ├── hooks/
│   │   │   ├── use-tasks.ts      # Task data hook with real-time updates
│   │   │   ├── use-routines.ts   # Routine data hook
│   │   │   ├── use-accounts.ts   # Accounts data hook
│   │   │   ├── use-routine-completion.ts  # Mark routine done
│   │   │   └── use-debounce.ts   # General debounce utility
│   │   ├── constants.ts          # App-wide constants
│   │   └── sounds.ts             # Audio feedback utilities
│   │
│   └── types/
│       └── index.ts              # All TypeScript interfaces & input types
│
├── firestore.rules               # Firestore security rules
├── firestore.indexes.json        # Composite index definitions
├── firebase.json                 # Firebase Hosting + Firestore config
├── .env.local.example            # Environment variable template
├── vitest.config.ts              # Test configuration
├── next.config.ts                # Next.js config
└── tsconfig.json
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- A **Firebase project** (free Spark plan is fine for development)
- **Firebase CLI** — install globally once:
  ```bash
  npm install -g firebase-tools
  firebase login
  ```

### Installation

```bash
# 1. Clone the repo
git clone <repo-url>
cd amal-todo-app

# 2. Install dependencies
npm install

# 3. Set up environment variables (see section below)
cp .env.local.example .env.local
# Fill in your Firebase credentials in .env.local

# 4. Deploy Firestore rules & indexes to your project
firebase use <your-firebase-project-id>
firebase deploy --only firestore:rules,firestore:indexes

# 5. Start the dev server
npm run dev
```

The app is available at `http://localhost:3000`.

---

## Firebase Setup

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a new project.
2. **Enable Authentication** → Sign-in method → enable **Email/Password** and optionally **Google**.
3. **Enable Cloud Firestore** → Start in **production mode** (rules are deployed separately).
4. Register a **Web app** in Project Settings → Your apps → copy the config object.
5. Paste the values into `.env.local` (see below).
6. Deploy security rules and indexes:
   ```bash
   firebase deploy --only firestore
   ```

---

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Firebase project values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

> **Note:** All variables are prefixed with `NEXT_PUBLIC_` because they are used client-side. Never add secret server-side keys here.

---

## Application Routes

| Route | Description |
|---|---|
| `/login` | Sign-in page (unauthenticated) |
| `/dashboard` | Home overview with stats and sweeper banner |
| `/today` | Today view — active tasks + due routines |
| `/tasks` | All tasks filtered by status |
| `/add` | Quick-capture form for a new task |
| `/new` | Full task creation form |
| `/edit?id=<taskId>` | Edit an existing task |
| `/someday` | Someday/Maybe backlog |
| `/logbook` | History of completed tasks |
| `/routines` | Routine list and management |
| `/meetings` | Meeting list |
| `/meetings/<id>` | Meeting detail with prep tasks & notes |
| `/notes` | Notes list (text & checklist types) |
| `/notes/<id>` | Note detail / editor |
| `/accounts` | Accounts (projects/areas) list |
| `/account/<id>` | Tasks & notes scoped to an account |
| `/area/<id>` | Area view |
| `/profile` | User profile, preferences, navigation to management pages |

All routes under `(main)` are protected by an auth guard in `src/app/(main)/layout.tsx`. Unauthenticated users are redirected to `/login`.

---

## Data Models

All types are defined in `src/types/index.ts`.

### Task

```ts
interface Task {
  id: string;
  ownerId: string;          // Firebase Auth UID
  accountId?: string | null;
  meetingId?: string | null;
  routineId?: string | null;
  title: string;
  description: string;
  status: TaskStatus;       // 'next' | 'waiting' | 'blocked' | 'scheduled' | 'fyi' | 'done' | 'someday'
  deadline?: Timestamp | null;
  dependencies: string[];   // Task IDs this task depends on
  references: Reference[];  // Links, emails, meetings
  subtasks?: Subtask[];
  isFrog?: boolean;         // "Eat the Frog" priority flag
  isTwoMinute?: boolean;    // 2-minute rule tag
  order?: number;
  history: { action: string; timestamp: Timestamp; userId: string; }[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Other Models

| Model | Key Fields |
|---|---|
| `Account` | `name`, `description`, `color`, `status ('active'\|'archived')` |
| `Meeting` | `title`, `startTime`, `notes.{before,during,after}`, `prepTaskIds`, `checklist` |
| `Routine` | `title`, `schedule`, `type ('fixed'\|'flexible')`, `days`, `completionLog` |
| `Note` | `title`, `content` (markdown), `type ('text'\|'checklist')`, `isPinned` |
| `UserStats` | `karma`, `currentStreak`, `longestStreak`, `lastActiveDate` |

---

## Firestore Collections & Security Rules

All collections enforce **owner-only** access — users can only read and write their own documents.

| Collection | Description |
|---|---|
| `tasks` | Individual action items |
| `meetings` | Meetings with prep tasks and notes |
| `accounts` | Projects / areas of responsibility |
| `routines` | Recurring habits and scheduled tasks |
| `notes` | Text and checklist notes |
| `user_stats` | Gamification data (karma, streaks) |

Rules are in `firestore.rules`. After editing, redeploy with:
```bash
firebase deploy --only firestore:rules
```

Composite indexes (required for multi-field queries) are in `firestore.indexes.json`. Deploy with:
```bash
firebase deploy --only firestore:indexes
```

---

## Key Libraries & Hooks

### Custom Hooks (`src/lib/hooks/`)

| Hook | Purpose |
|---|---|
| `use-tasks.ts` | Real-time Firestore listener for tasks; returns filtered/sorted task lists |
| `use-routines.ts` | Real-time listener for routines; computes today's due routines |
| `use-accounts.ts` | Fetches and caches the user's accounts |
| `use-routine-completion.ts` | Marks a routine as complete for today; updates `completionLog` |
| `use-debounce.ts` | Generic debounce hook for search inputs |

### Firebase Service Layer (`src/lib/firebase/`)

Each file exports async CRUD functions and real-time listeners for a single collection. Call these directly from hooks or page components — **do not call Firestore directly from UI components**.

```ts
// Example usage in a component
import { createTask, updateTask } from '@/lib/firebase/tasks';
```

### Notable Third-Party Libraries

| Library | Use |
|---|---|
| `framer-motion` | Entrance animations, list transitions |
| `lucide-react` | Icon set — use these, do not add other icon libraries |
| `canvas-confetti` | Confetti burst on task completion |
| `next-themes` | Light/dark theme switching |
| `react-to-print` | Print-to-PDF for notes |

---

## Component Architecture

```
Page (server or client component)
  └── uses Hook (use-tasks, use-routines, …)
        └── calls Firebase Service (tasks.ts, routines.ts, …)
              └── Firestore SDK
```

**Shared layout components** (`Sidebar`, `BottomNav`) are rendered by `(main)/layout.tsx` and display on every authenticated page. `Sidebar` is desktop-only; `BottomNav` is mobile-only — controlled by CSS media queries in `globals.css`.

**Feature components** live in matching subdirectories under `src/components/` (e.g., `today/UnifiedItemCard.tsx` is specific to the Today view).

**`src/components/ui/`** contains generic, reusable primitives: `Loading`, `ThemeToggle`, modal wrappers, etc.

---

## Running Tests

Tests use **Vitest** with `jsdom` and **React Testing Library**. Test files live alongside the code they test in `__tests__/` subdirectories.

```bash
# Run all tests (watch mode)
npm test

# Run once (CI mode)
npm run test:run

# Open the Vitest UI
npm run test:ui
```

Test setup is in `vitest.setup.ts` (imports `@testing-library/jest-dom` matchers).

---

## Deployment

The app is configured for **Firebase Hosting** as a static export.

```bash
# 1. Build the static export
npm run build

# 2. Deploy to Firebase Hosting
firebase deploy --only hosting
```

The `out/` directory is the static export target (configured in `firebase.json`). Make sure `next.config.ts` includes `output: 'export'` if it is not already set.

To deploy everything at once:
```bash
firebase deploy
```

---

## Development Conventions

- **Path alias:** Use `@/` to import from `src/`. E.g. `import { Task } from '@/types'`.
- **No direct Firestore calls in components** — always go through `src/lib/firebase/` service functions.
- **Types first:** All new data shapes go in `src/types/index.ts` with corresponding `CreateXInput` and `UpdateXInput` types.
- **CSS variables for theming:** Colours are defined as CSS custom properties in `globals.css`. Use `var(--background)`, `var(--foreground)`, etc. — do not hardcode hex values in components.
- **Icons:** Use `lucide-react` exclusively.
- **Linting:** Run `npm run lint` before committing. ESLint is configured in `eslint.config.mjs`.
- **Firestore indexes:** If you add a new compound query, add an entry to `firestore.indexes.json` and redeploy.
