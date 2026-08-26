---
name: web-responsiveness
description: "Build responsive web components and layouts for mobile-first design with WCAG 2.1 Level AA accessibility. Use when implementing responsive layouts, debugging layout issues across breakpoints, testing responsive behavior, or ensuring accessibility compliance with Tailwind breakpoints."
argument-hint: "Component name or responsive layout challenge (optional)"
---

# Web Responsiveness Skill

Build and test responsive web components using mobile-first design principles and Tailwind CSS breakpoints. This skill provides a complete workflow from design to testing across different screen sizes.

## When to Use

- **Building responsive components**: Creating new React components that adapt to different screen sizes
- **Layout troubleshooting**: Fixing layout problems on specific screen sizes or devices
- **Mobile-first implementation**: Starting with mobile design and progressively enhancing for larger screens
- **Testing responsive behavior**: Verifying that designs work across breakpoints and devices
- **Responsive debugging**: Investigating why a component doesn't display correctly on certain viewports

## Tailwind Breakpoints Reference

The health-app-frontend uses standard Tailwind CSS breakpoints:

| Breakpoint | Class Prefix             | Screen Width  | Use Case                        |
| ---------- | ------------------------ | ------------- | ------------------------------- |
| `xs`       | mobile-first (no prefix) | 0–639px       | Mobile phones                   |
| `sm`       | `sm:`                    | 640px–767px   | Small tablets, landscape phones |
| `md`       | `md:`                    | 768px–1023px  | Tablets                         |
| `lg`       | `lg:`                    | 1024px–1279px | Small desktops, large tablets   |
| `xl`       | `xl:`                    | 1280px–1535px | Desktops                        |
| `2xl`      | `2xl:`                   | 1536px+       | Large displays                  |

## Mobile-First Workflow

### Step 1: Design for Mobile (xs/base)

Start with the mobile layout without any breakpoint prefix. Use these as defaults:

- Stack elements vertically
- Use full width or constrained with padding
- Prioritize touch-friendly sizes (min 44px for interactive elements)

Example:

```tsx
<div className="px-4 py-2 text-sm">{/* Mobile layout */}</div>
```

### Step 2: Progressive Enhancement (sm, md, lg, xl, 2xl)

Add responsive utilities for larger screens, building upward:

- `sm:` for landscape phones or small tablets
- `md:` for tablets
- `lg:` for small desktops
- `xl:` for standard desktops
- `2xl:` for large displays

Example:

```tsx
<div className="px-4 py-2 text-sm sm:text-base md:text-lg lg:px-6 xl:px-8">
  {/* Adjusts padding and typography across breakpoints */}
</div>
```

### Step 3: Test the Responsive Behavior

Use DevTools responsive design mode or the testing procedure below to verify each breakpoint.

## Common Responsive Patterns

### Flexible Grid Layouts

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 1 column on mobile, 2 on tablets, 3 on desktops */}
</div>
```

### Conditional Visibility

```tsx
<button className="hidden md:block">Desktop-only button</button>
<button className="block md:hidden">Mobile-only button</button>
```

### Responsive Typography

```tsx
<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
  Responsive heading
</h1>
```

### Flexible Spacing

```tsx
<div className="mx-4 sm:mx-6 md:mx-8 lg:mx-0">
  {/* Adjusts margins based on viewport */}
</div>
```

### Responsive Navigation

Use Tailwind's responsive utilities with the `sheet.tsx` component:

```tsx
<nav className="hidden md:flex">
  {/* Desktop navigation */}
</nav>
<Sheet>
  {/* Mobile navigation drawer */}
</Sheet>
```

## WCAG 2.1 Level AA Accessibility Standards

Building responsive layouts is interconnected with accessibility. WCAG 2.1 Level AA is the industry standard compliance level for inclusive web design.

### Four WCAG Principles (POUR)

| Principle          | What It Means                                   | Responsive Design Impact                  |
| ------------------ | ----------------------------------------------- | ----------------------------------------- |
| **Perceivable**    | Users can see/hear content                      | Text sizing, contrast, color, images      |
| **Operable**       | Users can navigate with keyboard/assistive tech | Touch targets, focus states, keyboard nav |
| **Understandable** | Users can comprehend content & interactions     | Clear labeling, consistent navigation     |
| **Robust**         | Works across browsers, assistive technologies   | Semantic HTML, ARIA labels, testing       |

### WCAG Level AA Requirements (Health App Relevant)

#### 1. **Perceivable — Contrast & Color**

- **1.4.3 Contrast (Minimum)**: Text must have at least 4.5:1 contrast ratio (or 3:1 for large text)
- **1.4.11 Non-text Contrast**: UI components need 3:1 contrast minimum
- **1.4.5 Images of Text**: Avoid text in images; use real text instead

**Responsive consideration**:

```tsx
/* ✅ Good: Sufficient contrast at all sizes */
<p className="text-gray-900 bg-white text-base md:text-lg">
  Readable text with 13.5:1 contrast
</p>

/* ❌ Bad: Gray text may fail contrast on mobile */
<p className="text-gray-500 bg-gray-100 text-xs md:text-base">
  Insufficient contrast, especially at small sizes
</p>
```

#### 2. **Operable — Touch & Keyboard Navigation**

- **2.1.1 Keyboard**: All functionality available via keyboard
- **2.5.5 Target Size (Level AAA)**: 44×44 CSS pixels minimum (applies across all screen sizes)
- **2.5.2 Pointer Cancel**: Click/tap events cancel after selection

**Responsive consideration**:

```tsx
/* ✅ Good: 44px minimum at all sizes */
<button className="px-3 py-2.5 md:py-3">
  {/* ~44px height: 2.5rem = 40px + padding = 44px+ */}
</button>

/* ❌ Bad: Too small on mobile */
<button className="px-2 py-1 text-xs">
  Only 24-28px — too small for reliable touch
</button>
```

#### 3. **Understandable — Structure & Labels**

- **1.3.1 Info and Relationships**: Use semantic HTML for structure (headings, lists, labels)
- **2.4.3 Focus Order**: Logical tab order matches visual order
- **3.3.2 Labels or Instructions**: Form controls have associated labels

**Responsive consideration**:

```tsx
/* ✅ Good: Semantic structure visible at all sizes */
<section aria-labelledby="metrics-heading">
  <h2 id="metrics-heading">Patient Metrics</h2>
  <div className="grid grid-cols-1 md:grid-cols-3">
    {/* Heading creates clear relationship to content */}
  </div>
</section>

/* ❌ Bad: No semantic structure */
<div>
  <div className="font-bold text-lg">Patient Metrics</div>
  <div className="grid grid-cols-1 md:grid-cols-3">
    {/* No relationship between title and grid */}
  </div>
</div>
```

#### 4. **Robust — Semantic HTML & ARIA**

- **4.1.2 Name, Role, Value**: Custom components expose correct role/state for assistive tech
- **4.1.3 Status Messages**: Dynamic updates announced without moving focus

**Responsive consideration**:

```tsx
/* ✅ Good: Semantic HTML + ARIA for custom components */
<div
  role="button"
  tabIndex={0}
  aria-pressed={isActive}
  onKeyDown={handleKeyDown}
  className="px-4 py-2.5"
>
  Toggle
</div>

/* Also use native elements when possible */
<button className="px-4 py-2.5">
  Preferred: Native button needs no ARIA
</button>
```

### Responsive Accessibility Checklist

- [ ] **Color**: Don't rely on color alone to convey meaning
  - Use `text-red-600` + icon for error state, not just color
  - Provide patterns/text in addition to color coding

- [ ] **Text Sizing**:
  - Base text at least 16px on mobile (read `text-base` = 16px)
  - Zoom: Users can zoom to 200% without horizontal scrolling
  - `<html className="text-base">` ensures proper zoom baseline

- [ ] **Contrast**:
  - Test with WebAIM Contrast Checker
  - Body text: 4.5:1 or higher
  - UI components: 3:1 or higher
  - Check at all breakpoints (text may resize)

- [ ] **Touch Targets**:
  - Buttons/links: 44×44 CSS pixels minimum
  - Spacing between touch targets: 8px minimum
  - Use `p-2.5` (10px) or `p-3` (12px) on mobile buttons

- [ ] **Focus Indicators**:
  - Visible focus outlines on keyboard navigation
  - Don't remove `:focus` styles
  - Use `focus:ring-2 focus:ring-blue-500` in Tailwind

- [ ] **Semantic HTML**:
  - `<button>` for buttons, not `<div>` styled as button
  - `<a>` for navigation links
  - `<label htmlFor="inputId">` for form fields
  - Headings in order: h1, h2, h3 (not h1, h3, h2)

- [ ] **Skip Links**:
  - Hidden skip link to main content: `<a href="#main" className="sr-only">Skip to main content</a>`
  - Useful for screen reader users on every page

- [ ] **Images & Icons**:
  - All images have `alt` text
  - Decorative images: `alt=""` and `aria-hidden="true"`
  - Icons without text: `aria-label="Close"`

- [ ] **Form Labels**:
  - Every input has associated `<label>` via `htmlFor`
  - Error messages linked to input via `aria-describedby`
  - Required fields marked: `aria-required="true"` or HTML5 `required`

- [ ] **Keyboard Navigation**:
  - All interactive elements reachable via Tab key
  - Logical tab order matches layout order
  - Escape key closes modals/dropdowns

### Tailwind Accessibility Utilities

Tailwind provides built-in accessibility helpers:

```tsx
/* Screen reader only (visually hidden) */
<span className="sr-only">Loading...</span>

/* Focus indicators */
<button className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
  Accessible button
</button>

/* Reduced motion for users with vestibular disorders */
<div className="motion-safe:animate-bounce motion-reduce:opacity-75">
  Animation respects prefers-reduced-motion
</div>

/* High contrast mode support */
<button className="contrast-more:border-2">
  Extra visible in forced colors mode
</button>
```

### Example: Accessible Responsive Metric Card

```tsx
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  ariaLabel?: string;
}

export function AccessibleMetricCard({
  title,
  value,
  icon,
  ariaLabel,
}: MetricCardProps) {
  return (
    <article
      className="w-full rounded-lg border-2 border-gray-200 bg-white p-4 sm:p-5 md:p-6"
      aria-label={ariaLabel || title}
    >
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1">
          {/* Use semantic heading, not div */}
          <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-700">
            {title}
          </h3>
          {/* Ensure sufficient contrast: gray-900 on white = 16.6:1 */}
          <p className="mt-2 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
            {value}
          </p>
        </div>
        {/* Icon is decorative, properly marked */}
        <div
          className="hidden sm:flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg bg-blue-100"
          aria-hidden="true"
        >
          {icon}
        </div>
      </div>
    </article>
  );
}
```

**Accessibility features**:

- Semantic `<article>` and `<h3>`
- Explicit `aria-label` for context
- Icon marked as `aria-hidden` (decorative)
- 44×44px icon minimum on tablet+
- 4.5:1+ contrast text-gray-900 on white
- Gap spacing between icon and text for clarity

### Testing for WCAG Compliance

#### Browser Extensions

- **axe DevTools**: Automated accessibility scanning
- **Lighthouse** (Chrome DevTools): Performance + accessibility scores
- **WAVE** (WebAIM): Visual indicator of issues
- **Colour Contrast Analyzer**: Specific color testing

#### Manual Testing

1. **Keyboard navigation**: Can you tab through all interactions?
2. **Screen reader**: Test with NVDA (Windows), JAWS, or VoiceOver (Mac/iOS)
3. **Zoom test**: Set browser zoom to 200%, verify no horizontal scrolling
4. **Color contrast**: Use WebAIM tool on text and UI components
5. **Focus indicators**: Are `:focus` states clearly visible?

## Debugging Responsive Issues

### Common Issues & Solutions

**Problem**: Layout breaks at a specific breakpoint

**Solution**:

1. Use DevTools device emulation to reproduce the issue
2. Inspect the element and check which classes are applied
3. Verify Tailwind breakpoint utilities are correct (e.g., `md:flex` vs `md:inline-flex`)
4. Check for conflicting `hidden`/`block` classes
5. Test with `dev` mode running to see live updates

**Problem**: Component looks good on one device but breaks on another

**Solution**:

1. Open DevTools and test each Tailwind breakpoint systematically
2. Compare the design specification with the current output
3. Check if a previous breakpoint's styles are cascading incorrectly
4. Consider using `md:max-w-none` to override parent constraints
5. Verify flex/grid layouts with explicit `flex-col`/`grid-cols-1` on mobile

**Problem**: Touch targets too small on mobile

**Solution**:

1. Ensure interactive elements are at least 44×44px on mobile
2. Use `py-2.5 px-3` or larger for better touch targets
3. Increase padding for small UI components: `p-2 sm:p-3`
4. Test with actual mobile devices when possible

## Testing Responsive Layouts

### Manual Testing Procedure

1. **Start your dev server**:

   ```bash
   pnpm dev
   ```

2. **Open DevTools** (F12 in browser) and enable Device Emulation
   - Click the device toggle or press Ctrl+Shift+M

3. **Test each breakpoint sequentially**:
   - Select **iPhone 12** (390px) for `xs`
   - Select **iPad Mini** (768px) for `md`
   - Select **iPad Pro** (1024px) for `lg`
   - Resize browser to 1280px for `xl`
   - Resize browser to 1536px for `2xl`

4. **For each breakpoint, verify**:
   - No horizontal scrolling
   - Text is readable
   - Interactive elements are clickable
   - Images scale appropriately
   - Spacing looks balanced

5. **Check device orientation**:
   - Test portrait and landscape on tablets (iPad, Android tablets)
   - Verify landscape mode on phones doesn't overflow

### Automated Testing (Playwright)

Reference the `playwright-testing` skill for setting up automated responsive tests using device presets.

## Component Checklist

When implementing a new responsive component:

### Responsiveness

- [ ] Mobile layout works without breakpoint utilities (xs/base)
- [ ] Each breakpoint defined in design has corresponding Tailwind class
- [ ] No horizontal scrolling on any viewport
- [ ] Images and media scale appropriately
- [ ] Tested in DevTools on at least 3 breakpoints (mobile, tablet, desktop)
- [ ] Tested on actual mobile device if available

### Accessibility (WCAG 2.1 Level AA)

- [ ] Text has 4.5:1 contrast ratio (or 3:1 for large text 18px+)
- [ ] UI components have 3:1 contrast minimum
- [ ] Touch targets are at least 44×44px on mobile
- [ ] All interactive elements keyboard accessible (Tab, Enter, Escape)
- [ ] Focus indicators visible (`:focus` styles present)
- [ ] Semantic HTML used (`<button>`, `<a>`, `<label>`, headings in order)
- [ ] Form labels associated with inputs via `htmlFor`
- [ ] Images have descriptive `alt` text (or `alt=""` + `aria-hidden` if decorative)
- [ ] Icons without text have `aria-label`
- [ ] Component tested with axe DevTools or Lighthouse with no errors
- [ ] Font sizes at least 16px on mobile (readable without zoom)
- [ ] Component respects `prefers-reduced-motion` if animated

## Resources & References

- [Tailwind Responsive Design Docs](https://tailwindcss.com/docs/responsive-design)
- [MDN: Responsive Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [Mobile-First Approach Explanation](https://www.freecodecamp.org/news/what-is-mobile-first-design-how-to-make-a-website-responsive-for-mobile/)
- Tailwind config: [tailwind.config.js](../../tailwind.config.js)

## Example: Implementing a Responsive Card

Here's a complete example of a responsive card component:

```tsx
export function MetricCard({ title, value, icon }: MetricCardProps) {
  return (
    <div className="w-full rounded-lg border border-gray-200 bg-white p-4 sm:p-5 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs sm:text-sm md:text-base text-gray-600 font-medium">
            {title}
          </p>
          <p className="mt-2 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
            {value}
          </p>
        </div>
        <div className="hidden sm:flex ml-4 md:ml-6 h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg bg-blue-100">
          {icon}
        </div>
      </div>
    </div>
  );
}
```

**Responsive features**:

- Base: mobile-friendly padding (`p-4`), stacked with icon
- `sm:` icon becomes visible, smaller sizing
- `md:` increased padding, larger text and icon
- `lg:` even larger typography for desktop

## Next Steps

After building a responsive component:

1. Test across all breakpoints using DevTools
2. Verify on actual devices (mobile, tablet, desktop)
3. Check performance with Lighthouse audit
4. Document any custom breakpoint logic in comments
