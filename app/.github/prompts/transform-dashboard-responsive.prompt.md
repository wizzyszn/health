---
description: "Audit and transform dashboards to be responsive using Tailwind breakpoints and WCAG 2.1 Level AA accessibility standards. Use when making admin, doctor, or patient dashboards mobile-friendly."
argument-hint: "Dashboard role (admin/doctor/patient) or specific page name, optional"
---

# Transform Dashboard to Responsive

Systematically audit and refactor a dashboard to be responsive across all screen sizes while ensuring WCAG 2.1 Level AA accessibility compliance.

## Context

The health-app-frontend has dashboards for three user roles:

- **Admin**: `src/admin/pages/` (dashboard, patients, patient-detail, add-doctor)
- **Doctor**: `src/doctor/pages/` (dashbord, appointments, consultation, diagnosis, etc.)
- **Patient**: `src/patient/pages/` (dashboard, appointments, consultation, medications, etc.)

## Objective

Transform a target dashboard from the argument into a responsive, accessible design:

1. **Audit current structure** for layout rigidity and accessibility gaps
2. **Apply responsive breakpoints** using Tailwind utilities (mobile-first approach)
3. **Ensure WCAG 2.1 Level AA compliance** (contrast, touch targets, keyboard nav)
4. **Test across all breakpoints** (xs, sm, md, lg, xl, 2xl)
5. **Validate accessibility** with tools and manual testing

## Audit Phase

Before making changes, analyze the dashboard:

### Layout Analysis

- [ ] Current layout: Is it fixed-width, responsive, or mobile-oriented?
- [ ] Container constraints: Does it use `max-w-*` or full-width layouts?
- [ ] Grid/Flex usage: Are grids hardcoded to specific column counts?
- [ ] Media queries: Are there existing breakpoints in CSS?
- [ ] Overflow: Any horizontal scrolling on mobile?

### Component Structure

- [ ] Which components are used? (tables, cards, charts, forms)
- [ ] Are data tables responsive? (How do they behave on mobile?)
- [ ] Are status indicators/badges appropriately sized?
- [ ] Is navigation full-width or sticky?
- [ ] Are modals/dialogs mobile-friendly?

### Accessibility Gaps

- [ ] Touch targets minimum 44×44px on mobile?
- [ ] Text contrast 4.5:1 or higher?
- [ ] Focus indicators visible?
- [ ] Semantic HTML used?
- [ ] Form labels associated with inputs?
- [ ] Images have alt text?

## Transform Phase

### Step 1: Container & Layout

**Mobile-first (xs base)**:

```tsx
<div className="w-full px-4 py-4">
  {/* Full width with consistent padding */}
</div>
```

**Progressive enhancement**:

```tsx
<div className="w-full px-4 py-4 sm:px-6 md:px-8 lg:max-w-7xl lg:mx-auto">
  {/* Wider screens get max-width and centered layout */}
</div>
```

### Step 2: Grid/Flex Layouts

**Data grids** (responsive columns):

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  {/* 1 column mobile, 2 on tablets, 3 on desktops, 4 on large displays */}
</div>
```

**Tables** (horizontal scroll on mobile):

```tsx
<div className="overflow-x-auto sm:overflow-x-visible">
  <table className="w-full min-w-full sm:w-auto">
    {/* Table scrolls on mobile, normal on tablet+ */}
  </table>
</div>
```

**Sidebar + Content** (stack on mobile, side-by-side on desktop):

```tsx
<div className="flex flex-col lg:flex-row gap-6">
  <aside className="w-full lg:w-64 flex-shrink-0">
    {/* Full width on mobile, fixed width on desktop */}
  </aside>
  <main className="flex-1">{/* Expands to fill remaining space */}</main>
</div>
```

### Step 3: Typography & Spacing

**Responsive text sizes**:

```tsx
<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
  {/* Scales from 24px → 32px → 36px → 48px → 60px */}
</h1>

<p className="text-sm sm:text-base md:text-lg text-gray-700">
  {/* 14px → 16px → 18px with good readability */}
</p>
```

**Responsive spacing**:

```tsx
<div className="space-y-2 sm:space-y-3 md:space-y-4">
  {/* Gap between items scales per breakpoint */}
</div>
```

### Step 4: Interactive Elements

**Buttons** (minimum 44×44 touch targets):

```tsx
<button className="px-3 py-2.5 sm:px-4 sm:py-2.5 md:px-4 md:py-3 focus:ring-2 focus:ring-blue-500">
  Action
</button>
```

**Forms** (stack on mobile, side-by-side on desktop):

```tsx
<form className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
  <div className="sm:col-span-2 md:col-span-1">
    {/* Full width on mobile, takes specified span on larger screens */}
  </div>
</form>
```

### Step 5: Accessibility Enhancements

**Contrast compliance**:

```tsx
{
  /* ✅ Good: 4.5:1+ on white background */
}
<p className="text-gray-900">High contrast body text</p>;

{
  /* ❌ Bad: Insufficient contrast on light background */
}
<p className="text-gray-500 bg-gray-100">Poor contrast</p>;
```

**Focus indicators**:

```tsx
<button className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
  Keyboard accessible
</button>
```

**Screen reader support**:

```tsx
{/* Skip link */}
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>

{/* Decorative icons */}
<div aria-hidden="true">{icon}</div>

{/* Form labels */}
<label htmlFor="email">Email address</label>
<input id="email" type="email" required aria-required="true" />
```

## Testing Phase

### Responsive Testing Checklist

- [ ] **Mobile (xs, 390px)**: No horizontal scrolling, readable text
- [ ] **Tablet (md, 768px)**: Layout adapts, spacing intentional
- [ ] **Desktop (lg, 1024px)**: Content organized horizontally
- [ ] **Large display (2xl, 1536px)**: No stretched content, max-width applied
- [ ] **Zoom 200%**: No horizontal scrolling, still readable
- [ ] **Landscape mode**: Proper layout adaptation

### Accessibility Testing

- [ ] **Contrast**: WebAIM Contrast Checker, 4.5:1 minimum
- [ ] **Touch targets**: All interactive elements 44×44px minimum
- [ ] **Keyboard nav**: Tab through entire dashboard, logical order
- [ ] **Focus indicators**: Visible on all buttons, links, inputs
- [ ] **Screen reader**: Test with VoiceOver/NVDA/JAWS
- [ ] **Semantic HTML**: Use `<button>`, `<a>`, `<label>`, headings in order
- [ ] **Axe DevTools**: Run automated scan, fix all errors

### Tools to Use

```bash
# Run development server
pnpm dev

# Open DevTools (F12) and:
# 1. Toggle device toolbar (Ctrl+Shift+M)
# 2. Test each breakpoint width
# 3. Check Lighthouse > Accessibility
```

Browser extensions:

- **axe DevTools**: Automated accessibility scanning
- **Lighthouse**: Performance + accessibility scores
- **WAVE**: Visual feedback on accessibility
- **WebAIM Contrast Checker**: Color contrast validation

## Common Dashboard Patterns

### Metric Cards Grid

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
  {metrics.map((metric) => (
    <div
      key={metric.id}
      className="rounded-lg border bg-white p-4 sm:p-5 md:p-6 shadow-sm"
    >
      <h3 className="text-sm md:text-base font-semibold text-gray-600">
        {metric.title}
      </h3>
      <p className="mt-2 text-2xl md:text-3xl font-bold text-gray-900">
        {metric.value}
      </p>
    </div>
  ))}
</div>
```

### Data Table with Responsive Scroll

```tsx
<div className="overflow-x-auto">
  <table className="w-full min-w-[640px]">
    <thead>
      <tr>
        <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600">
          Column
        </th>
      </tr>
    </thead>
    <tbody>
      {data.map((row) => (
        <tr key={row.id} className="border-t hover:bg-gray-50">
          <td className="px-4 py-3 text-xs sm:text-sm text-gray-900">
            {row.value}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### Sidebar + Main (Responsive Stacking)

```tsx
<div className="flex flex-col lg:flex-row lg:gap-6">
  <aside className="w-full lg:w-64 mb-6 lg:mb-0 order-2 lg:order-1">
    <nav className="sticky top-4 space-y-2">{/* Navigation items */}</nav>
  </aside>
  <main className="flex-1 order-1 lg:order-2">{/* Main content */}</main>
</div>
```

## Example: Dashboard Transformation

**Before** (Desktop-only):

```tsx
export function AdminDashboard() {
  return (
    <div
      style={{ maxWidth: "1400px", marginLeft: "auto", marginRight: "auto" }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: "20px",
        }}
      >
        {metrics.map((m) => (
          <MetricCard key={m.id} {...m} />
        ))}
      </div>
      <div style={{ marginTop: "40px", display: "flex" }}>
        <div style={{ width: "250px" }}>
          <Sidebar />
        </div>
        <div style={{ flex: 1, marginLeft: "20px" }}>
          <Content />
        </div>
      </div>
    </div>
  );
}
```

**After** (Responsive + Accessible):

```tsx
export function AdminDashboard() {
  return (
    <main className="w-full px-4 py-6 sm:px-6 md:px-8 lg:max-w-7xl lg:mx-auto lg:py-8">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
        Dashboard
      </h1>

      {/* Responsive metric grid: 1 col mobile → 4 cols desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {metrics.map((metric) => (
          <MetricCard key={metric.id} {...metric} />
        ))}
      </div>

      {/* Responsive layout: stacked mobile → side-by-side desktop */}
      <div className="flex flex-col lg:flex-row lg:gap-8">
        <aside className="w-full lg:w-64 flex-shrink-0 mb-6 lg:mb-0">
          <Sidebar />
        </aside>
        <article className="flex-1">
          <Content />
        </article>
      </div>
    </main>
  );
}
```

## Integration with web-responsiveness Skill

Reference the `/web-responsiveness` skill for:

- Tailwind breakpoint definitions
- WCAG 2.1 Level AA guidelines
- Contrast and touch target specifications
- Testing procedures and tools
- Accessibility patterns

Type `/web-responsiveness` in chat to load the full skill with references.

## Completion Checklist

- [ ] Dashboard reviewed for layout, components, and accessibility gaps
- [ ] Container and layout transformed with responsive breakpoints
- [ ] Grids/flex layouts adapted (1 col mobile → multi-col desktop)
- [ ] Typography and spacing scaled responsively
- [ ] Interactive elements 44×44px minimum
- [ ] WCAG 2.1 Level AA compliance verified (contrast, labels, focus)
- [ ] Tested on mobile, tablet, and desktop in DevTools
- [ ] Tested on real device if available
- [ ] Axe DevTools scan passed with no errors
- [ ] Changes reviewed and committed to `responsive` branch
