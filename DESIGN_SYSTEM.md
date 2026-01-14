# DealForge Design System

> **"Institutional Fintech with Modern Warmth"**

A comprehensive design system for building professional, trustworthy, and accessible real estate investment analysis tools.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Brand Identity](#2-brand-identity)
3. [Typography](#3-typography)
4. [Color System](#4-color-system)
5. [Layout & Spacing](#5-layout--spacing)
6. [Component Library](#6-component-library)
7. [Data Visualization](#7-data-visualization)
8. [Educational Patterns](#8-educational-patterns-learn-mode)
9. [Financial Credibility Patterns](#9-financial-credibility-patterns)
10. [Motion & Animation](#10-motion--animation)
11. [Accessibility](#11-accessibility)
12. [Dark Mode Guidelines](#12-dark-mode-guidelines)

---

## 1. Design Philosophy

### Three Pillars

DealForge balances three essential qualities equally:

| Pillar | Purpose | Expression |
|--------|---------|------------|
| **Financial Credibility** | Users trust us with serious investment decisions | Precise numbers, institutional aesthetics, bank-grade trust signals |
| **Educational Accessibility** | Beginners should feel welcome and learn as they go | Clear explanations, progressive disclosure, helpful tooltips |
| **Data Visualization** | Complex financial data must be understandable | Charts, trends, color-coded metrics, visual analytics |

### Target Audience

Our users span a wide range of real estate investment experience:

- **Beginners**: First-time rental property buyers learning the fundamentals
- **Active Investors**: Managing 2-10 properties, seeking efficiency
- **Professionals**: Syndication operators, property managers, fund managers

### Design Principles

1. **Clarity over cleverness** — Financial data must be instantly readable
2. **Progressive complexity** — Simple by default, detailed when needed
3. **Consistent precision** — Numbers formatted identically everywhere
4. **Accessible luxury** — Professional appearance without intimidation
5. **Dark mode first** — Optimized for extended analysis sessions

---

## 2. Brand Identity

### Logo

The DealForge logo combines a **sparkle/forge icon** with the wordmark:

```
[Sparkle Icon] DealForge
```

- **Icon**: Represents the "forge" concept — refining raw data into actionable insights
- **Color**: Primary teal on light backgrounds, lighter teal on dark backgrounds
- **Minimum size**: 24px height for icon, 32px for full logo

### Brand Colors

**Primary: Teal**
- Conveys trust, stability, and financial security
- Differentiates from typical blue/purple SaaS products
- Associated with growth and prosperity in finance

### Voice & Tone

| Context | Tone | Example |
|---------|------|---------|
| Headlines | Confident, direct | "Forge Better Deals with Data" |
| Instructions | Clear, helpful | "Enter the purchase price to calculate your cash-on-cash return" |
| Errors | Constructive, calm | "Unable to calculate IRR. Please verify your exit year assumptions." |
| Success | Affirming, brief | "Deal saved successfully" |
| Education | Approachable, expert | "Cash-on-cash return measures your annual pre-tax cash flow..." |

---

## 3. Typography

### Font Stack

| Role | Font | Fallbacks |
|------|------|-----------|
| **Sans Serif** | Geist Sans | system-ui, sans-serif |
| **Monospace** | Geist Mono | "SF Mono", monospace |

**Why Geist?**
- Purpose-built by Vercel for dashboards and developer tools
- Excellent readability at all sizes
- Native Next.js integration via `geist` package
- Mono variant has proper tabular figures for financial alignment

### Type Scale

| Name | Size | Line Height | Weight | Usage |
|------|------|-------------|--------|-------|
| `text-xs` | 12px | 16px | 400/500 | Labels, captions, badges |
| `text-sm` | 14px | 20px | 400/500 | Body text, form labels |
| `text-base` | 16px | 24px | 400 | Default body text |
| `text-lg` | 18px | 28px | 500/600 | Card titles, section headers |
| `text-xl` | 20px | 28px | 600 | Page subtitles |
| `text-2xl` | 24px | 32px | 600/700 | Page titles |
| `text-3xl` | 30px | 36px | 700 | Dashboard headers |
| `text-4xl+` | 36px+ | 1.1 | 700 | Hero headlines, marketing |

### Financial Number Formatting

Always use **Geist Mono** with `tabular-nums` for financial figures:

```css
.financial-number {
  font-family: var(--font-geist-mono);
  font-variant-numeric: tabular-nums;
}
```

**Formatting Rules:**

| Type | Format | Example |
|------|--------|---------|
| Currency | `$X,XXX.XX` | $125,450.00 |
| Large currency | `$X.XXM` | $1.25M |
| Percentage | `X.XX%` | 8.54% |
| Ratio | `X.XX` | 1.25 |
| Year | `YYYY` | 2024 |

---

## 4. Color System

### Brand Teal Scale

The primary brand color expresses trust, stability, and modern fintech sophistication.

| Token | HSL | Hex | Usage |
|-------|-----|-----|-------|
| `brand-50` | 166 76% 97% | #F0FDFA | Subtle backgrounds |
| `brand-100` | 167 76% 92% | #CCFBF1 | Hover states |
| `brand-200` | 168 74% 83% | #99F6E4 | Light accents |
| `brand-300` | 170 70% 72% | #5EEAD4 | Secondary accents |
| `brand-400` | 172 66% 58% | #2DD4BF | Dark mode primary |
| `brand-500` | 174 62% 47% | #14B8A6 | **Light mode primary** |
| `brand-600` | 175 72% 38% | #0D9488 | Hover on primary |
| `brand-700` | 176 74% 31% | #0F766E | Active states |
| `brand-800` | 177 70% 26% | #115E59 | Dark accents |
| `brand-900` | 178 67% 21% | #134E4A | Darkest teal |
| `brand-950` | 180 74% 11% | #042F2E | Near-black teal |

### Slate Neutrals

Warmer than pure gray, slate creates a sophisticated, professional feel.

| Token | HSL | Usage |
|-------|-----|-------|
| `slate-50` | 210 40% 98% | Light mode background |
| `slate-100` | 210 40% 96% | Secondary backgrounds |
| `slate-200` | 214 32% 91% | Borders, dividers |
| `slate-300` | 213 27% 84% | Disabled states |
| `slate-400` | 215 20% 65% | Placeholder text |
| `slate-500` | 215 16% 47% | Muted text |
| `slate-600` | 215 19% 35% | Secondary text |
| `slate-700` | 215 25% 27% | Dark mode borders |
| `slate-800` | 217 33% 17% | Dark mode cards |
| `slate-900` | 222 47% 11% | Dark mode background |
| `slate-950` | 229 84% 5% | Deepest background |

### Semantic Colors

| Semantic | Light Mode | Dark Mode | Usage |
|----------|------------|-----------|-------|
| **Success** | `success-500` (142 71% 45%) | Same | Positive returns, gains, confirmations |
| **Warning** | `warning-500` (38 92% 50%) | Same | Caution states, borderline metrics |
| **Destructive** | `destructive-500` (0 84% 60%) | `destructive-600` | Losses, errors, negative cash flow |

### Theme Tokens

**Light Mode (Default)**
```css
--background: var(--slate-50);
--foreground: var(--slate-900);
--card: 0 0% 100%; /* Pure white */
--primary: var(--brand-500);
--muted: var(--slate-100);
--border: var(--slate-200);
```

**Dark Mode**
```css
--background: var(--slate-900);
--foreground: var(--slate-50);
--card: var(--slate-800);
--primary: var(--brand-400); /* Lighter for visibility */
--muted: var(--slate-800);
--border: var(--slate-700);
```

### Chart Colors

A 5-color palette optimized for financial data visualization:

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `chart-1` | brand-500 | brand-400 | Primary data series |
| `chart-2` | 262 83% 58% | 262 83% 68% | Secondary series (purple) |
| `chart-3` | warning-500 | warning-500 | Tertiary series (amber) |
| `chart-4` | 199 89% 48% | 199 89% 58% | Fourth series (sky blue) |
| `chart-5` | success-500 | success-500 | Fifth series (green) |

**Special Chart Colors:**
- `chart-positive`: Green for gains, income, positive trends
- `chart-negative`: Red for losses, expenses, negative trends
- `chart-neutral`: Slate for neutral/benchmark values

---

## 5. Layout & Spacing

### Breakpoints

| Name | Min Width | Target Devices |
|------|-----------|----------------|
| `sm` | 640px | Large phones, small tablets |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large desktops |

### Container Widths

| Context | Max Width | Class |
|---------|-----------|-------|
| Marketing pages | 1280px | `container` |
| Dashboard content | 1400px | `max-w-7xl` |
| Form sections | 640px | `max-w-xl` |
| Reading content | 768px | `max-w-3xl` |

### Spacing Scale

Base unit: **4px**

| Token | Size | Usage |
|-------|------|-------|
| `space-0.5` | 2px | Tight inline spacing |
| `space-1` | 4px | Minimal gaps |
| `space-2` | 8px | Icon-text gaps, tight padding |
| `space-3` | 12px | Small padding |
| `space-4` | 16px | Default padding, card gaps |
| `space-6` | 24px | Section padding |
| `space-8` | 32px | Large section gaps |
| `space-10` | 40px | Page section spacing |
| `space-12` | 48px | Major section breaks |
| `space-16` | 64px | Hero section padding |
| `space-20` | 80px | Page top/bottom margins |

### Grid System

**Dashboard Layout:**
```
┌─────────────────────────────────────────────┐
│ Header (h-14, sticky)                       │
├──────────┬──────────────────────────────────┤
│ Sidebar  │ Main Content                     │
│ (w-64)   │ (flex-1, scrollable)             │
│          │                                  │
│          │ ┌─────────────────────────────┐  │
│          │ │ Page Header                 │  │
│          │ ├─────────────────────────────┤  │
│          │ │ Content Area                │  │
│          │ │ (grid or flex layout)       │  │
│          │ └─────────────────────────────┘  │
└──────────┴──────────────────────────────────┘
```

**Metric Cards Grid:**
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3-4 columns

```jsx
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {/* Metric cards */}
</div>
```

---

## 6. Component Library

### Navigation

#### Sidebar
- **Width expanded**: 256px (`--sidebar-width: 16rem`)
- **Width collapsed**: 48px (`--sidebar-width-icon: 3rem`)
- **Background**: `sidebar-background` (slate-50 light, slate-950 dark)
- **Border**: Right border in `sidebar-border`

**Sections:**
1. Header with logo
2. Main navigation group
3. Support navigation group
4. Theme toggle (expanded only)
5. User profile dropdown (footer)

#### Mobile Navigation
- **Trigger**: Hamburger icon in mobile header
- **Component**: Sheet sliding from left
- **Z-index hierarchy**: Overlay (z-40), Content (z-50)

### Cards

#### MetricCard
For displaying key performance indicators (KPIs):

```jsx
<div className="rounded-xl border bg-card p-6">
  <div className="text-sm text-muted-foreground">{label}</div>
  <div className="mt-2 text-2xl font-bold tabular-nums">{value}</div>
  <div className="mt-1 text-xs text-muted-foreground">{description}</div>
</div>
```

**Variants:**
- Default: Neutral metric
- Positive: Green text for gains (`text-positive`)
- Negative: Red text for losses (`text-negative`)
- With trend: Arrow + percentage change

#### PropertyCard / DealCard
For listing properties in grids:

```jsx
<div className="group rounded-xl border bg-card overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg">
  {/* Image or placeholder */}
  <div className="p-4">
    <h3 className="font-semibold">{address}</h3>
    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
      {/* Key metrics */}
    </div>
  </div>
</div>
```

### Forms

#### Input with Addon
For currency and percentage inputs:

```jsx
<div className="flex rounded-md border focus-within:ring-2 focus-within:ring-ring">
  <span className="flex items-center px-3 text-muted-foreground border-r bg-muted">
    $
  </span>
  <input className="flex-1 px-3 py-2 bg-transparent outline-none" />
</div>
```

#### Slider with Value Display
For percentage inputs with visual feedback:

```jsx
<div className="space-y-2">
  <div className="flex justify-between">
    <label>{label}</label>
    <span className="tabular-nums">{value}%</span>
  </div>
  <Slider value={value} min={0} max={100} step={0.25} />
</div>
```

### Feedback

#### Loading Skeletons
Match dimensions of content being loaded:

```jsx
<div className="animate-pulse">
  <div className="h-4 w-24 rounded bg-muted" /> {/* Label */}
  <div className="mt-2 h-8 w-32 rounded bg-muted" /> {/* Value */}
</div>
```

#### Toast Notifications
Using Sonner for non-blocking feedback:

| Type | Usage | Duration |
|------|-------|----------|
| Success | Action completed | 3s |
| Error | Action failed | 5s |
| Info | General notification | 4s |

---

## 7. Data Visualization

### Chart Types & Usage

| Chart Type | Best For | Example Use |
|------------|----------|-------------|
| **Line Chart** | Trends over time | Cash flow projections, equity buildup |
| **Bar Chart** | Comparisons | Income vs expenses, monthly breakdown |
| **Area Chart** | Cumulative values | Total equity over loan term |
| **Donut Chart** | Part-to-whole | Expense breakdown, investment allocation |
| **Gauge** | Single metric vs target | DSCR, CoC return vs benchmark |

### Chart Theming

All charts use CSS variables for automatic light/dark mode support:

```typescript
// lib/chart-theme.ts
export const chartColors = {
  income: 'hsl(var(--chart-positive))',
  expense: 'hsl(var(--chart-negative))',
  mortgage: 'hsl(var(--chart-1))',
  taxes: 'hsl(var(--chart-3))',
  insurance: 'hsl(var(--chart-4))',
  maintenance: 'hsl(var(--chart-2))',
};
```

### Financial Metric Display

#### Trend Indicators

```jsx
// Positive trend
<span className="flex items-center gap-1 text-positive">
  <ArrowUp className="size-3" />
  <span>+12.5%</span>
</span>

// Negative trend
<span className="flex items-center gap-1 text-negative">
  <ArrowDown className="size-3" />
  <span>-3.2%</span>
</span>
```

#### Benchmark Comparisons

Show how a metric compares to market standards:

```jsx
<div className="space-y-1">
  <div className="flex justify-between text-sm">
    <span>Your CoC Return</span>
    <span className="font-mono">8.5%</span>
  </div>
  <div className="h-2 rounded-full bg-muted overflow-hidden">
    <div
      className="h-full bg-primary"
      style={{ width: '85%' }} // 8.5% of 10% benchmark
    />
  </div>
  <div className="text-xs text-muted-foreground">
    Market average: 6-8%
  </div>
</div>
```

#### Color Coding Values

```jsx
function getMetricColor(value: number, thresholds: { good: number; warning: number }) {
  if (value >= thresholds.good) return 'text-positive';
  if (value >= thresholds.warning) return 'text-warning';
  return 'text-negative';
}

// Usage: DSCR (Debt Service Coverage Ratio)
<span className={getMetricColor(dscr, { good: 1.25, warning: 1.0 })}>
  {dscr.toFixed(2)}
</span>
```

---

## 8. Educational Patterns (Learn Mode)

### Tooltip Explanations

Every financial metric should have an explanation tooltip:

```jsx
<div className="flex items-center gap-1">
  <span>Cash-on-Cash Return</span>
  <Tooltip>
    <TooltipTrigger>
      <HelpCircle className="size-4 text-muted-foreground" />
    </TooltipTrigger>
    <TooltipContent className="max-w-xs">
      <p className="font-medium">What is Cash-on-Cash Return?</p>
      <p className="mt-1 text-sm">
        Annual pre-tax cash flow divided by total cash invested.
        A 10% CoC return means you earn $10 per year for every $100 invested.
      </p>
    </TooltipContent>
  </Tooltip>
</div>
```

### Progressive Disclosure

Show simple views by default, with expandable details:

```jsx
<Accordion type="single" collapsible>
  <AccordionItem value="details">
    <AccordionTrigger>
      <span className="flex items-center gap-2">
        <GraduationCap className="size-4" />
        Learn how this is calculated
      </span>
    </AccordionTrigger>
    <AccordionContent>
      {/* Detailed breakdown and explanation */}
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

### Inline Help Text

For form fields that need explanation:

```jsx
<div className="space-y-2">
  <Label htmlFor="capRate">Cap Rate</Label>
  <Input id="capRate" />
  <p className="text-xs text-muted-foreground">
    Net Operating Income divided by property value.
    Higher cap rates indicate higher risk/return.
  </p>
</div>
```

### Learn Mode Toggle

Optional expanded explanations throughout the interface:

```jsx
const [learnMode, setLearnMode] = useState(false);

// Toggle in settings or header
<Switch checked={learnMode} onCheckedChange={setLearnMode}>
  Learn Mode
</Switch>

// Conditional help text
{learnMode && (
  <div className="rounded-lg bg-muted/50 p-4 text-sm">
    <h4 className="font-medium">Understanding NOI</h4>
    <p className="mt-1 text-muted-foreground">
      Net Operating Income is your gross rental income minus
      all operating expenses (excluding mortgage payments)...
    </p>
  </div>
)}
```

---

## 9. Financial Credibility Patterns

### Number Precision Rules

| Metric Type | Precision | Example |
|-------------|-----------|---------|
| Currency (small) | 2 decimals | $1,234.56 |
| Currency (large) | 0 decimals | $125,000 |
| Percentage | 2 decimals | 8.54% |
| Ratio (DSCR, etc.) | 2 decimals | 1.25 |
| Years | Integer | 30 |
| Units | Integer | 4 |

### Formatting Functions

```typescript
// Currency formatting
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: value >= 10000 ? 0 : 2,
    maximumFractionDigits: value >= 10000 ? 0 : 2,
  }).format(value);
}

// Percentage formatting
export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

// Large number abbreviation
export function formatCompact(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return formatCurrency(value);
}
```

### Trust Signals

Visual cues that communicate accuracy and reliability:

1. **Consistent formatting** — Numbers always appear the same way
2. **Source attribution** — "Data from HUD, Census Bureau"
3. **Calculation transparency** — Show formulas on hover/expand
4. **Last updated timestamps** — "Market data as of Jan 2024"
5. **Precision indicators** — "Estimated" vs "Actual" badges

### Calculation Display

Show work for transparency:

```jsx
<div className="rounded-lg border bg-muted/30 p-4 font-mono text-sm">
  <div className="text-muted-foreground">Cash-on-Cash Return</div>
  <div className="mt-2 space-y-1">
    <div>Annual Cash Flow: $12,000</div>
    <div>Total Cash Invested: $50,000</div>
    <div className="border-t pt-1 mt-1">
      = $12,000 / $50,000 = <strong>24.00%</strong>
    </div>
  </div>
</div>
```

---

## 10. Motion & Animation

### Timing & Easing

| Duration | Usage |
|----------|-------|
| 150ms | Micro-interactions (hover, focus) |
| 200ms | Component state changes (toggle, expand) |
| 300ms | Page element transitions |
| 400ms | Page transitions, modals |

**Default easing**: `ease-out` for enter, `ease-in` for exit

### Animation Classes

```css
/* Fade in with slight upward motion */
.animate-fade-in {
  animation: fade-in 0.2s ease-out forwards;
}

/* Slide in from direction */
.animate-slide-in-right { animation: slide-in-from-right 0.3s ease-out; }
.animate-slide-in-left { animation: slide-in-from-left 0.3s ease-out; }
.animate-slide-in-bottom { animation: slide-in-from-bottom 0.3s ease-out; }

/* Scale in (for modals, popovers) */
.animate-scale-in {
  animation: scale-in 0.2s ease-out forwards;
}

/* Subtle pulse (for live indicators) */
.animate-pulse-subtle {
  animation: pulse-subtle 2s ease-in-out infinite;
}

/* Skeleton loading shimmer */
.animate-shimmer {
  animation: shimmer 2s linear infinite;
}
```

### Staggered Entry

For lists and grids, stagger children with `animation-delay`:

```jsx
{items.map((item, index) => (
  <div
    key={item.id}
    className="animate-fade-in"
    style={{ animationDelay: `${index * 50}ms` }}
  >
    {/* Content */}
  </div>
))}
```

### Number Animations

Animate financial values counting up:

```jsx
import { motion, useSpring, useTransform } from 'motion/react';

function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 100, damping: 30 });
  const display = useTransform(spring, (v) => formatCurrency(v));

  useEffect(() => { spring.set(value); }, [value]);

  return <motion.span className="tabular-nums">{display}</motion.span>;
}
```

### Reduced Motion

Respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 11. Accessibility

### Color Contrast

All text must meet WCAG AA standards:

| Context | Minimum Ratio |
|---------|---------------|
| Normal text | 4.5:1 |
| Large text (18px+ bold, 24px+ regular) | 3:1 |
| UI components | 3:1 |

**Verified combinations:**
- Light mode: slate-900 on slate-50 ✓
- Dark mode: slate-50 on slate-900 ✓
- Primary on white: brand-500 on white ✓
- Error text: destructive-600 on light backgrounds ✓

### Focus States

All interactive elements must have visible focus:

```css
.focus-ring {
  @apply outline-none ring-2 ring-ring ring-offset-2 ring-offset-background;
}

/* For dark backgrounds */
.focus-ring-invert {
  @apply outline-none ring-2 ring-white/50 ring-offset-2 ring-offset-slate-900;
}
```

### Touch Targets

Minimum touch target size: **44x44 pixels**

```jsx
// Good: Button with adequate padding
<button className="min-h-11 min-w-11 px-4 py-2">
  Click me
</button>

// Good: Icon button with extended hit area
<button className="relative p-2">
  <Icon className="size-5" />
  <span className="absolute -inset-2" /> {/* Extended hit area */}
</button>
```

### Screen Reader Considerations

```jsx
// Decorative icons
<Icon aria-hidden="true" />

// Meaningful icons
<Icon aria-label="Warning" role="img" />

// Live regions for updates
<div aria-live="polite" aria-atomic="true">
  {/* Dynamic content updates */}
</div>

// Skip links
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

### Keyboard Navigation

- **Tab**: Move between focusable elements
- **Enter/Space**: Activate buttons, links
- **Arrow keys**: Navigate within components (tabs, menus)
- **Escape**: Close modals, dropdowns

---

## 12. Dark Mode Guidelines

### When to Use

**Dark mode as default** for:
- Dashboard/analysis views (extended use)
- Chart-heavy pages (better contrast for data)

**Light mode as default** for:
- Marketing pages (approachability)
- Documentation (readability)

### Implementation

Using `next-themes` with class-based switching:

```tsx
// app/layout.tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
>
  {children}
</ThemeProvider>
```

### Color Adjustments

| Element | Light Mode | Dark Mode | Reason |
|---------|------------|-----------|--------|
| Primary | brand-500 | brand-400 | Needs to pop on dark backgrounds |
| Card background | white | slate-800 | Distinct from page background |
| Borders | slate-200 | slate-700 | Visible but not harsh |
| Muted text | slate-500 | slate-400 | Readable but secondary |

### Maintaining Contrast

Test all color combinations in both modes:

```typescript
// Utility to check contrast ratio
function getContrastRatio(fg: string, bg: string): number {
  // Implementation
}

// Ensure minimum 4.5:1 for normal text
assert(getContrastRatio('slate-50', 'slate-900') >= 4.5);
```

### Dark Mode Sidebar

The sidebar uses the deepest slate (`slate-950`) in dark mode to create:
- Visual separation from main content
- "Trading terminal" professional aesthetic
- Clear navigation hierarchy

---

## Quick Reference

### CSS Variables

```css
/* Backgrounds */
--background, --foreground, --card, --popover, --muted

/* Actions */
--primary, --secondary, --accent, --destructive

/* States */
--success, --warning

/* Borders */
--border, --input, --ring

/* Sidebar */
--sidebar, --sidebar-foreground, --sidebar-primary, --sidebar-accent, --sidebar-border
```

### Utility Classes

```css
/* Financial metrics */
.tabular-nums    /* Aligned numbers */
.text-positive   /* Green for gains */
.text-negative   /* Red for losses */
.text-neutral    /* Gray for neutral */

/* Focus */
.focus-ring      /* Brand-colored focus ring */

/* Animation */
.animate-fade-in
.animate-slide-in-*
.animate-scale-in
.animate-pulse-subtle
.animate-shimmer
```

### Component Imports

```typescript
// UI Components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sidebar } from '@/components/ui/sidebar';

// Layout Components
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { AppSidebar } from '@/components/layout/app-sidebar';

// Chart Theme
import { chartColors, chartTheme } from '@/lib/chart-theme';
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | January 2024 | Initial design system documentation |

---

*This design system is a living document. Update it as the product evolves to maintain consistency across all interfaces.*
