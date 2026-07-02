<div align="center">
  <img src="front-end/src/assets/samsen-logo.png" alt="Samsen Wittayalai School Logo" width="120" style="border-radius: 24px;" />

  # Grader Samsen

  **An online grading system and judge platform designed for Samsen Wittayalai School.**

  [![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4.svg?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-Auth_&_DB-3ECF8E.svg?logo=supabase&logoColor=white)](https://supabase.com/)
  [![Express](https://img.shields.io/badge/Express-Backend-000000.svg?logo=express&logoColor=white)](https://expressjs.com/)
</div>

---

Grader Samsen is a online programming grader built for students and teachers of Samsen Wittayalai School.

## 🗂️ Project Structure

```text
Grader-Samsen/
├── front-end/                # Frontend application (React/Vite/TypeScript/Tailwind v4)
│   ├── src/
│   │   ├── components/       # Reusable UI components (CodeEditor, BrandMark, ResizablePanes)
│   │   ├── pages/            # Page views (Landing, Login, Register, admin, dashboard)
│   │   ├── layouts/          # Layout wrappers (DashboardLayout)
│   │   ├── store/            # State management hooks (Zustand useAppStore.ts)
│   │   └── index.css         # Global styles & Glassmorphic variables
├── backend/                  # Backend REST API (Node.js/Express)
│   ├── src/
│   │   ├── routes/           # Express API Endpoints (assignments, auth, classrooms, problems)
│   │   ├── utils/            # Sandbox execution environments & compilers
│   │   └── supabase.ts       # Database client
│   └── supabase/             # SQL Migrations and database setup
```

## ✨ Key Features

* 💻 **Liquid-Shiny Glassmorphism UI:** A premium, fully responsive glass dashboard that supports real-time shifting light refractions and drifting glow reflections on hover.
* 🎨 **Five Color-Grading Themes:** Switch between **Emerald**, **Sapphire**, **Amethyst**, **Ruby**, and **Amber** custom themes directly in the appearance settings page.
* 🌀 **Circular Reveal Theme Transitions:** Custom expanding clip-path sweep animation centered on user's cursor when switching between light/dark modes and color grades.
* 👨‍💻 **Interactive Coding Sandbox:** Write and submit solutions using an embedded Monaco Editor, supporting C, C++, JavaScript, TypeScript, Python, Java, Go, and Rust.
* ⏱️ **Live Clock & Dashboard Roadmaps:** Home screen displays a ticking local date/time capsule and highlights the platform release roadmap (July Beta, August Public, September School).
* 👤 **Avatar Picture File Uploader:** Upload, crop, and configure your own avatar picture in Settings, updating both headers and profile cards instantly.
* 📈 **Leaderboard Previews & Git Timelines:** Displays live top-10 student standings and a text-only, non-interactive real-time GitHub repository commit log feed.
* 🛣️ **8-Tier XP Roadmap Modal:** Clicking the header rank badge launches a vertical timeline connecting 8 competitive tiers (Bronze, Silver, Gold, Platinum, Diamond, Master, Grandmaster, Challenger) with real-time progress details.
* 🏫 **Classroom Administration:** Join classrooms using unique codes, manage homework assignments, broadcast announcements, and check class rosters.
* 🏆 **Animated Cascadings & Toggles:** Cascading spring verdict badges for testcases, loading spinners, and layout animations that can be globally toggled on or off in Settings.

## ⚡ Quick Start

Get the project up and running locally in three quick steps.

### 1. Install Dependencies
Run the installation command in the root directory to setup dependencies across the packages:
```bash
npm run install:all
```

### 2. Configure Environment Variables
Create `.env` files in both backend and frontend directories based on the example templates:
* **Backend**: Copy `backend/.env.example` to `backend/.env`
* **Frontend**: Copy `front-end/.env.example` to `front-end/.env`

### 3. Start Development Servers
Spin up both the React frontend and Express backend concurrently:
```bash
npm run dev
```

* **Frontend:** [http://localhost:5174](http://localhost:5174)
* **Backend:** [http://localhost:3001](http://localhost:3001)

## 💾 Database Setup (Supabase)

Connect the application to your own Supabase project:

1. **Create a Supabase Project** on [supabase.com](https://supabase.com).
2. **Execute Database Schemas:** Navigate to the **SQL Editor** in your Supabase dashboard and run the migrations inside `backend/supabase/migrations/` in order:
   1. [001_profiles.sql](backend/supabase/migrations/001_profiles.sql)
   2. [002_classrooms.sql](backend/supabase/migrations/002_classrooms.sql)
   3. [003_problems.sql](backend/supabase/migrations/003_problems.sql)
   4. [004_assignments_and_cheats.sql](backend/supabase/migrations/004_assignments_and_cheats.sql)
   5. [005_profiles_avatar.sql](backend/supabase/migrations/005_profiles_avatar.sql)
3. **Configure API Secrets:** Add your Project URL, Anon Key, and Service Role Key to `backend/.env`.

## 💻 CLI Commands

| Command | Action |
| :--- | :--- |
| `npm run install:all` | Installs root packages, frontend, and backend dependencies. |
| `npm run dev` | Runs both frontend and backend concurrently in development mode. |
| `npm run dev:front` | Runs only the React frontend. |
| `npm run dev:back` | Runs only the Express backend. |
| `npm run build` | Builds both frontend and backend for production. |
| `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` | For Access to NodeJS |

## 🤝 Contributing

Issues and Pull Requests are welcome. Feel free to open a ticket or submit a PR for new compiler runtimes, sandbox configurations, or visual components.

## 📄 License

MIT © [Samsen Wittayalai School](https://www.samsenwit.ac.th)
