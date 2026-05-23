/**
 * Feature Flags Configuration
 * Controls UI behavior and experimental features for Ayam Kalintang SOK
 */

export const FEATURES = {
  /**
   * iPad Landscape Layouts
   * When enabled, payment screens (QRIS & Cash) optimize for landscape orientation
   * with two-pane layouts for better tablet UX
   * 
   * Status: ENABLED
   * Affected: QRISScreen, CashWaitScreen
   */
  IPAD_LANDSCAPE_LAYOUT: true,

  /**
   * Fixed Cart Footer
   * When enabled, CartSheet displays fixed payment footer on tablet (md+) breakpoints
   * prevents scroll-to-reach issues for payment buttons
   * 
   * Status: ENABLED
   * Affected: CartSheet component
   */
  FIXED_CART_FOOTER: true,

  /**
   * Enhanced Touch Targets
   * When enabled, increases minimum button size from 44px to 48px
   * improves iPad accessibility and reduces accidental mis-taps
   * 
   * Status: ENABLED
   * Affected: MenuHeader, CartSheet, QRISScreen, CashWaitScreen
   */
  ENHANCED_TOUCH_TARGETS: true,

  /**
   * Responsive Spacing (iPad Optimized)
   * When enabled, applies larger padding/spacing on md+ breakpoints
   * improves thumb reach and comfortable interaction distances
   * 
   * Status: ENABLED
   * Affected: All kiosk components (padding, gaps, modal widths)
   */
  RESPONSIVE_SPACING: true,

  /**
   * Large Text on Tablets
   * When enabled, scales typography proportionally on md/lg breakpoints
   * improves readability from 1-2 meters distance on kiosk displays
   * 
   * Status: ENABLED
   * Affected: Headers, CTAs, labels throughout kiosk UI
   */
  LARGE_TEXT_ON_TABLETS: true,

  /**
   * Larger Modal Max-Width (Landscape)
   * When enabled, increases CustomizationSheet max-width to lg:max-w-4xl
   * takes full advantage of iPad landscape (1024px+) screen real estate
   * 
   * Status: ENABLED
   * Affected: CustomizationSheet component
   */
  LARGER_MODAL_WIDTH: true,

  /**
   * Two-Pane Payment Screens
   * When enabled, uses split-screen layout for QRISScreen and CashWaitScreen
   * Left: Status info, Right: Interactive controls (QR or PIN input)
   * 
   * Status: ENABLED
   * Affected: QRISScreen, CashWaitScreen on lg+ breakpoints
   */
  TWO_PANE_PAYMENT_LAYOUT: true,

  /**
   * Extended Animation Duration
   * When enabled, increases animation transitions on larger screens
   * provides smoother, more intentional UI feedback on tablets
   * 
   * Status: DISABLED (can be enabled for future UX enhancement)
   * Default: Uses standard Tailwind animation timing
   */
  EXTENDED_ANIMATIONS: false,

  /**
   * Disable Order Recap (Future)
   * When enabled, skips CartSheet and proceeds directly to payment method selection
   * useful for kiosk operator testing or streamlined checkout flow
   * 
   * Status: DISABLED
   * Affects: Order flow in menu checkout
   */
  DISABLE_ORDER_RECAP: false,

  /**
   * A/B Testing Mode
   * When enabled, logs all feature flag usage to console
   * helps analyze feature adoption and UX metrics
   * 
   * Status: DISABLED (enable only in development)
   */
  AB_TESTING_MODE: process.env.NODE_ENV === 'development' && false,
}

/**
 * Helper function to check if feature is enabled
 * @param feature - Feature flag key
 * @returns boolean - Feature enabled status
 */
export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature]
}

/**
 * Utility for feature-gated logging (development only)
 */
export function logFeatureUsage(featureName: keyof typeof FEATURES, context?: Record<string, any>) {
  if (FEATURES.AB_TESTING_MODE && process.env.NODE_ENV === 'development') {
    console.log(`[Feature: ${featureName}]`, {
      enabled: FEATURES[featureName],
      context,
      timestamp: new Date().toISOString(),
    })
  }
}
