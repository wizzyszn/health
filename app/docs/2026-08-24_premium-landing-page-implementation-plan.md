# Premium Landing Page Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.
>
> **Goal:** Build a high-converting, premium-grade landing page for the Carelexa telehealth platform that showcases the app's value proposition, builds trust, and drives conversions (signups, demos, or patient onboarding).
>
> **Deliverable:** A fully designed and coded landing page at `src/landing-page.component.shared.tsx` (or `landing.page.shared.tsx`) with premium animations, responsive design, and integration with the existing Carelexa design system.

---

## 1. Overview & Vision

The landing page must communicate:

- **Premium positioning** — sophisticated typography, refined spacing, elevated micro-interactions
- **Multi-role value** — speak to patients, doctors, and admins with tailored messaging
- **Trust & safety** — HIPAA-compliant, secure, private
- **Clear CTAs** — primary action (Get Started/Demo) secondary (Learn More)
- **Social proof** — provider logos, testimonial snippets, patient/staff counts
- **Mobile-first** — seamless experience from phone to desktop

> **Design direction:** Inspired by leading health-tech landing pages (Teladoc, Doctor On Demand) but adapted to the Carelexa brand palette (emerald/teal accent, dark mode ready, accessible contrast).

---

## 2. Design System & UI Components

### 2.1 Color & Typography Tokens (Tailwind)

Extend the existing Tailwind config with premium tokens:

```css
/* In tailwind.config.js extend */
colors: {
  /* Existing colors */
  accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
  /* Premium additions */
  premium: {
    dark: "hsl(210 20% 8%)",
    DEFAULT: "hsl(210 20% 95%)",
    light: "hsl(210 30% 98%)",
    muted: "hsl(210 10% 55%)",
  },
},
```

**Typography** — use `font-display` for headings, `font-body` for body:

```css
// global.css or via @tailwind components
@layer components {
  .heading-display {
    @apply font-display tracking-tight font-medium;
  }
  .heading-display-lg {
    @apply text-5xl sm:text-6xl lg:text-7xl md:text-8xl font-black leading-tight;
  }
  .heading-display-md {
    @apply text-3xl sm:text-4xl font-semibold leading-tight;
  }
  .body-base {
    @apply font-body leading-relaxed;
  }
}
```

### 2.2 Premium Component Library

Create or adapt these components from the existing shared library:

| Component                                 | Status    | Reference                                            |
| ----------------------------------------- | --------- | ---------------------------------------------------- |
| `hero-section.component.shared.tsx`       | **new**   | Premium hero with rotating value props               |
| `stat-card.component.shared.tsx`          | **adapt** | From `tag-chip-input` or `empty-list-state` patterns |
| `trust-badges.component.shared.tsx`       | **new**   | HIPAA, SSL, medical certifications                   |
| `feature-grid.component.shared.tsx`       | **adapt** | From `full-calendar` or `tag-chip-input` grid        |
| `cta-component.shared.tsx`                | **adapt** | From `button.tsx` with premium variants              |
| `scroll-indicator.component.shared.tsx`   | **new**   | Subtle arrow or fade                                 |
| `mobile-nav-preview.component.shared.tsx` | **new**   | Minimal nav for mobile hero                          |

### 2.3 Premium Design Details

- **Glassmorphism panels** on feature sections with `backdrop-blur-md`
- **Subtle motion** — framer-motion stagger children, hover reveals, entrance animations
- **Micro-interactions** — button color shift, border focus-ring, input focus
- **Dark mode ready** — all colors use `hsl(var(--...))` variables
- **Accessible** — contrast ratio ≥ 4.5:1, focus-visible outlines, ARIA labels

---

## 3. Page Structure & Sections

### Section 1: Hero

- Headline: "Telehealth, redefined"
- Subhead: "Secure video visits, seamless scheduling, and patient records — all in one platform"
- Primary CTA: "Get Your Free Demo"
- Secondary: "Watch Demo Video"
- Background: subtle gradient or abstract medical illustration
- Trust badges row (HIPAA, SSL, 10k+ providers)

### Section 2: Key Features (3-column grid)

- **For Patients** — book, visit, prescription, follow up
- **For Doctors** — schedule, consult, notes, billing
- **For Admins** — onboarding, compliance, analytics

### Section 3: Trust & Security

- HIPAA compliance badge
- Data encryption illustration
- 24/7 support badge
- "Trusted by 10,000+ healthcare providers"

### Section 4: Social Proof

- 2-3 testimonial cards (patient/doctor quotes)
- Logos of partner clinics/hospitals
- "Top-rated on G2 / Capterra" (if applicable)

### Section 5: CTA / Get Started

- Full-width gradient button
- Brief form (name, email, role, practice size)
- Or: "Book a 15-min demo — no credit card required"

### Section 6: Footer

- Quick links (Features, Pricing, Integrations, Security)
- Company links (About, Careers, Press)
- Contact info
- Copyright

---

## 4. Implementation Tasks

### Task 1: Design Tokens & Theme Extension

**Objective:** Add premium color/typography tokens and dark-mode support to Tailwind config.

**Files:**

- `tailwind.config.js` — extend colors, add `darkMode: ['class', 'media']`
- `src/styles/premium-tokens.css` — global CSS with `@layer base` typography

**Deliverable:** Updated Tailwind config with `premium` color set and display/body font families.

### Task 2: Hero Section Component

**Objective:** Build the premium hero with entrance animation, CTA buttons, and trust badges.

**Files:**

- `src/shared/components/hero-section.component.shared.tsx`
- `src/shared/components/trust-badges.component.shared.tsx` (optional inline)

**Deliverable:** Fully responsive hero that:

- Shows headline + subhead + two CTAs
- Has staggered entrance animation (framer-motion)
- Features trust badges (HIPAA, SSL, top-rated)
- Has subtle background gradient/morphism effect
- Mobile: full-width stack, touch-friendly buttons

### Task 3: Features Grid Section

**Objective:** Showcase core value propositions in a premium 3-column grid with hover interactions.

**Files:**

- `src/shared/components/feature-grid.component.shared.tsx`

**Deliverable:** Grid with:

- Icon + headline + short description per column
- Distinct styling per role (patients/doctors/admins)
- Hime reveal on hover (lift + shadow + accent underline)
- Responsive: 1 column on mobile, 2 on tablet, 3 on desktop

### Task 4: Trust & Social Proof Section

**Files:**

- `src/shared/components/trust-badges.component.shared.tsx`
- `src/shared/components/testimonials.component.shared.tsx` (if needed)

**Deliverable:** Grid of logo badges + 2 testimonial cards with quote icon, name, role.

### Task 5: CTA & Form Section

**Files:**

- `src/shared/components/cta-component.shared.tsx` (premium variant)
- Form component using react-hook-form + zod validation

**Deliverable:** Full-width CTA with gradient background, concise form fields, "Book Demo" primary action.

### Task 6: Landing Page Container & Integration

**Files:**

- `src/landing-page.component.shared.tsx` — page-level component
- `src/config/routes/landing.route.tsx` — add route if needed

**Deliverable:** Page component that composes all sections with proper page structure, meta tags, and accessibility.

### Task 7: Testing, Polish, and Build Verification

**Files:**

- Run `pnpm run build` — ensure zero TypeScript errors
- Run `pnpm run check-types`
- Verify responsive breakpoints (375px, 768px, 1440px)
- Check accessibility with axe or lighthouse

**Deliverable:** Landing page passes all gates, visually matches premium design spec, and integrates with existing Carelexa theming.

---

## 5. Verification & Acceptance Criteria

| Criterion                                                     | Pass/Fail |
| ------------------------------------------------------------- | --------- |
| `pnpm run build` succeeds (tsc -b + vite build)               |           |
| `pnpm run check-types` — zero `any` types                     |           |
| `pnpm run lint` — zero errors (or auto-fixable)               |           |
| Page renders on mobile (375px) without horizontal scroll      |           |
| Page renders on tablet (768px) with 2-column grid             |           |
| Page renders on desktop (1440px) with 3-column grid           |           |
| All CTAs are focus-visible and have accessible color contrast |           |
| Dark mode respects all color tokens (no hard-coded hex)       |           |
| framer-motion animations run without layout thrash            |           |
| No `any` type anywhere in the landing page code               |           |

---

## 6. Integration Notes

- **Routes:** Add `/src/config/routes/landing.route.tsx` mapping `/` → `LandingPage` if this is the root, or create a dedicated `/carelexa` path.
- **Theming:** All colors use Tailwind `hsl(var(--...))` variables from the existing config — no hard-coded hex values.
- **Accessibility:** Use `aria-label` on buttons, `focus-visible` outlines, meaningful alt text on icons/images.
- **Analytics:** Add click tracking on primary CTA (GA4 event: `landing_cta_click`).
- **SEO:** Add meta title, description, open graph tags in the page component.

---

## 7. Design Handoff & Refinement Loop

1. Create the landing page with the premium tokens and components above
2. Run `pnpm run build` — fix any type/lint errors
3. Review the rendered page at `pnpm dev` — adjust spacing, typography, or motion as needed
4. Verify dark mode by adding `class dark` to `<html>` and checking all color tokens
5. Confirm no `any` types exist — use strict TypeScript throughout
6. Final review: the page should look and feel premium, match the Carelexa brand, and convert visitors

---

## 8. Related Existing Work

This landing page reuses/adapts components from the existing codebase:

- **`src/components/ui/button.tsx`** — base button, extend for CTA variants
- **`src/components/ui/trust-badges`** — may already exist; adapt or create new
- **`src/shared/components/dash-header.component.shared.tsx`** — header pattern to follow
- **`src/styles/premium-tokens.css`** — new file for design tokens
- **`tailwind.config.js`** — extend, don't overwrite existing tokens

> **Note:** The existing `src/shared/components/logo.component.shared.tsx` contains the Carelexa logo asset. Use it in the hero and footer.

---
