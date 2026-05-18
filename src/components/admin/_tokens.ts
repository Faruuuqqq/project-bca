/**
 * Shared admin design tokens. Composable Tailwind class strings.
 * Apply via cn() to keep variance bounded.
 *
 * Border radius scale: rounded-xl (controls), rounded-2xl (cards), rounded-3xl (hero/modal).
 * Padding scale: p-4 (compact), p-6 (standard).
 * Text scale: text-xs label, text-sm body, text-lg card title, text-2xl page title.
 * Weight: font-medium body, font-semibold label, font-bold card title, font-black for page titles + hero numbers only.
 */
export const adminTokens = {
  // Page-level
  pageTitle: 'text-2xl font-black text-foreground tracking-tight uppercase',
  pageSubtitle: 'text-xs font-semibold uppercase tracking-wider text-muted-foreground',
  sectionTitle: 'text-lg font-bold text-foreground tracking-tight',
  sectionEyebrow: 'text-xs font-semibold uppercase tracking-wider text-muted-foreground',

  // Cards
  card: 'bg-card border border-border rounded-2xl shadow-sm',
  cardPadded: 'bg-card border border-border rounded-2xl shadow-sm p-6',
  cardCompact: 'bg-card border border-border rounded-xl shadow-sm p-4',
  cardHero: 'bg-card border border-border rounded-3xl shadow-md p-6',

  // Controls (min 44px touch target for iPad)
  control: 'rounded-xl',
  controlInput: 'rounded-xl h-11',
  controlButton: 'rounded-xl h-11 min-h-[44px] px-5 font-semibold text-sm',

  // Stat / KPI
  statLabel: 'text-xs font-semibold uppercase tracking-wider text-muted-foreground',
  statValue: 'text-2xl font-black tracking-tight tabular-nums',
  statHint: 'text-xs text-muted-foreground',

  // Tables
  tableHeader: 'text-xs font-semibold uppercase tracking-wider text-muted-foreground',

  // Badges
  badgeCount: 'bg-brand-primary text-white rounded-md px-2 py-0.5 text-xs font-bold',
  badgeMuted: 'bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-xs font-semibold',

  // Focus
  focus: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary focus-visible:ring-offset-2',
} as const
