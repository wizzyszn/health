# HealthMe

A comprehensive healthcare management Progressive Web Application (PWA) facilitating seamless interaction between patients, doctors, and administrators.

HealthMe supports multi-role access, real-time consultations, appointment scheduling, and electronic medical records, all built with a modern, responsive, mobile-first design.

---

## 🚀 Core Features

- **Multi-Role Authentication**: Separate access flows for Patients, Doctors, and Admin (powered by Google OAuth and standard JWT).
- **Consultations**: Support for chat, audio, video, in-person (Meet-a-Doctor), and home service visits.
- **Scheduling**: Interactive calendars for doctors to set availability and patients to book 15-minute time slots.
- **Medical Records**: Digital prescriptions, diagnosis tracking, and investigation logging.
- **Progressive Web App**: Offline capabilities and seamless installation as a desktop/mobile app.

---

## 🛠️ Tech Stack

- **Framework**: [React 18](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [TailwindCSS](https://tailwindcss.com/) & [Framer Motion](https://www.framer.com/motion/)
- **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/) & [TanStack React Query](https://tanstack.com/query/latest)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **UI Primitives**: [Radix UI](https://www.radix-ui.com/)

---

## 💻 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- `pnpm` (preferred package manager)

### Installation

1. Clone the repository and navigate to the frontend application:

   ```bash
   git clone <repository-url>
   cd health-app-frontend/app
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Configure your environment variables by creating a `.env.local` file (use `.env.example` if available).

   ```env
   VITE_GOOGLE_CLIENT_ID=your-google-client-id
   VITE_API_BASE_URL=https://health-app-backend-inzm.onrender.com
   ```

4. Start the development server:
   ```bash
   pnpm dev
   ```

---

## 📁 Project Structure & Conventions

Consistency is crucial. Developers contributing to HealthMe **must** follow these naming and structural conventions.

```text
app/
├── public/                 # Static assets (PWA icons, manifest)
└── src/
    ├── assets/             # Images, global styles, raw assets
    ├── auth/               # Module for authentication flows (Login/Register)
    ├── components/         # Reusable UI components (Radix/Tailwind components)
    ├── config/             # App-wide configurations (routes, stores, env)
    ├── doctor/             # Doctor portal (pages, features, specific components)
    ├── lib/                # Utility functions, axios config, types
    ├── patient/            # Patient portal (pages, features, specific components)
    └── shared/             # Shared business logic features (hooks, layouts)
```

### 📏 Development Rules & File Naming Conventions

To keep our codebase scalable and easy to navigate, adhere to these explicit naming conventions based on the file's responsibility:

1. **Kebab-Case File Naming**: All files should be named using kebab-case (e.g., `button.tsx`, `medication-list.tsx`). PascalCase or camelCase is strictly prohibited for filenames.
2. **Component Suffixing**: Any file exporting a React component must end with `.component.tsx`.
   - _Example: `patient-profile.component.tsx`_
   - _Exception: Generic UI components inside `src/components/ui/` (e.g., `button.tsx`, `dialog.tsx`)_
3. **Page Suffixing**: Any file acting as a routable page must end with `.page.tsx`.
   - _Example: `dashboard.page.tsx`, `appointments.page.tsx`_
4. **Role Suffixing**: If a component, page, or util is strictly tied to a specific role, append the role name before the extension.
   - _Example: `dashboard.page.doctor.tsx`, `medication.modal.patient.tsx`_
5. **Shared/Generic Components**: If a component is used across multiple roles horizontally, it sits in `src/shared/components/` and should explicitly be marked as shared if needed, or simply `.component.tsx`.
   - _Example: `dash.layout.component.tsx`, `main-page-header.component.shared.tsx`_
6. **Utility Suffixing**:
   - Slice files: `.slice.ts` (e.g., `auth.slice.ts`)
   - Schema files: `.schema.ts` (e.g., `login.schema.ts`)
   - Types files: `.types.ts`
   - Hooks: start with `use-` and end with `.ts` or `.tsx` (e.g., `use-google-oauth.ts`)
     7

### 📌 Example Feature Folder Map

```text
src/doctor/
  ├── components/
  │   ├── modals/
  │   │   └── diagnosis.modal.component.doctor.tsx
  │   └── medical-records.component.doctor.tsx
  └── pages/
      ├── dashboard.page.doctor.tsx
      └── appointment.page.doctor.tsx
```

---

## ✨ Code Formatting & Quality

Before submitting a Pull Request, ensure your code meets our styling standards. The project enforces quality checks using Husky pre-commit hooks.

- **Check Types**: `pnpm run check-types`
- **Lint**: `pnpm run check-lint` (Fixes auto-applied with `pnpm run format`)

When committing, Husky will run `lint-staged` ensuring all TypeScript and ESLint rules are strictly checked.
