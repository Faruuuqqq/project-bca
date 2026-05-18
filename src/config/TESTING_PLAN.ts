/**
 * iPad UX Redesign - Visual Regression & Testing Guide
 * Testing plan for Ayam Kalintang SOK kiosk optimizations
 */

export const TESTING_CHECKLIST = {
  // ========================================
  // PHASE 1: Touch Target Verification (48px minimum)
  // ========================================
  PHASE_1_TOUCH_TARGETS: {
    description: "Verify all interactive buttons meet 48px (h-12 w-12) minimum",
    tests: [
      {
        component: "MenuHeader - Back Button",
        target: "h-12 w-12 (48px square)",
        how_to_test: "Navigate to /menu, check back button size in top-left",
        success_criteria: "Button is clearly larger, easily tappable with thumb",
      },
      {
        component: "CartSheet - Quantity Controls",
        target: "h-12 w-12 (48px square)",
        how_to_test: "Open cart, check +/- buttons on each item",
        success_criteria: "Buttons are 48px, no accidental mis-taps on adjacent areas",
      },
      {
        component: "CartSheet - Close Button",
        target: "h-12 w-12 (48px square)",
        how_to_test: "Open cart, check X button in top-right",
        success_criteria: "Consistent sizing with quantity buttons",
      },
      {
        component: "QRISScreen - Back Button",
        target: "h-12 w-12 (48px square)",
        how_to_test: "Navigate to payment (QRIS), check back button",
        success_criteria: "Safe touch target in landscape mode",
      },
      {
        component: "CustomizationSheet - Qty Controls",
        target: "h-12 w-12 (48px square)",
        how_to_test: "Click menu item, check +/- in customization modal",
        success_criteria: "Buttons are larger and easier to tap",
      },
    ],
    device: "iPad (portrait & landscape)",
    viewport: "768px width minimum",
  },

  // ========================================
  // PHASE 2: Responsive Layout Tests
  // ========================================
  PHASE_2_RESPONSIVE_LAYOUTS: {
    iPad_Portrait_768px: {
      description: "Test md: breakpoint optimizations (iPad portrait)",
      tests: [
        {
          screen: "/menu",
          checks: [
            "Padding increased from p-4 to md:p-6 in header",
            "Menu grid gap increased for easier selection",
            "Text sizing scaled up (text-xl → text-2xl in headers)",
            "Rounded corners increased (rounded-2xl → rounded-3xl)",
          ],
        },
        {
          screen: "Cart Drawer (Cart Sheet)",
          checks: [
            "Cart items display with md:p-6 padding",
            "Quantity button sizing lg:h-14 w-14",
            "Footer sections have better spacing md:p-10",
            "Buttons are larger and easier to tap",
          ],
        },
        {
          screen: "Customization Modal",
          checks: [
            "Modal width optimized md:max-w-2xl",
            "Option items have increased padding",
            "Text is larger for readability",
          ],
        },
      ],
    },
    iPad_Landscape_1024px: {
      description: "Test lg: breakpoint optimizations (iPad landscape)",
      tests: [
        {
          screen: "/menu",
          checks: [
            "Padding increased from md:p-6 to lg:p-12",
            "Menu items display in wider grid (lg:grid-cols-4)",
            "Text further scaled (lg:text-3xl on headers)",
            "Better use of horizontal screen space",
          ],
        },
        {
          screen: "Cart Drawer (Two-pane if applicable)",
          checks: [
            "Items list on left, payment controls on right (future enhancement)",
            "Footer fixed at bottom on lg+ breakpoints",
            "Buttons are largest (lg:h-24)",
            "Text is largest for 1-2m viewing distance",
          ],
        },
        {
          screen: "Customization Modal",
          checks: [
            "Modal width further increased lg:max-w-4xl",
            "Options arranged in two columns (future grid-cols-2)",
            "Better scanning and selection experience",
          ],
        },
      ],
    },
  },

  // ========================================
  // PHASE 3: Two-Pane Landscape Layouts
  // ========================================
  PHASE_3_LANDSCAPE_LAYOUTS: {
    QRIS_Screen_Landscape: {
      description: "Test QRIS payment screen lg: two-pane layout",
      viewport: "1024px+ (landscape)",
      tests: [
        {
          check: "Header responsive sizing",
          details: "Logo scales, time displays correctly",
        },
        {
          check: "Left pane (hidden on mobile)",
          details: [
            "Shows promotional text 'Scan lebih cepat & praktis'",
            "Displays myBCA and BCA Mobile app icons",
            "Hidden on md: breakpoint, visible on lg:",
          ],
        },
        {
          check: "Right pane (QR code area)",
          details: [
            "QR code displays at appropriate size",
            "Buttons below QR are properly sized (lg:h-16)",
            "'Cek Status Pembayaran' button is accessible",
          ],
        },
        {
          check: "Footer responsive",
          details: "Trust badges display correctly with wrapping support",
        },
      ],
    },
    Cash_Wait_Screen_Landscape: {
      description: "Test Cash Wait screen lg: two-pane layout",
      viewport: "1024px+ (landscape)",
      tests: [
        {
          check: "Left pane (Payment status)",
          details: [
            "Shows queue number prominently",
            "Displays 'Menunggu Kasir' and 'Otomatis Berlanjut' info",
            "Left pane takes 50% width on lg:",
          ],
        },
        {
          check: "Right pane (Cashier PIN input)",
          details: [
            "PIN input field displays at lg:w-[450px] minimum",
            "Buttons are larger (lg:h-24) for easy tapping",
            "Input field scaled to lg:text-5xl for visibility",
          ],
        },
        {
          check: "Lock overlay (when triggered)",
          details: [
            "Recovery code input field is properly sized",
            "Unlock button is accessible and visible",
          ],
        },
      ],
    },
  },

  // ========================================
  // PHASE 4: Feature Flag Verification
  // ========================================
  PHASE_4_FEATURE_FLAGS: {
    description: "Verify feature flag system in src/config/features.ts",
    tests: [
      {
        flag: "ENHANCED_TOUCH_TARGETS",
        expected: "true",
        impact: "All buttons are 48px minimum",
      },
      {
        flag: "RESPONSIVE_SPACING",
        expected: "true",
        impact: "Padding increases on md/lg breakpoints",
      },
      {
        flag: "LARGER_MODAL_WIDTH",
        expected: "true",
        impact: "CustomizationSheet width increases on lg:",
      },
      {
        flag: "TWO_PANE_PAYMENT_LAYOUT",
        expected: "true",
        impact: "Payment screens optimize for landscape",
      },
    ],
  },

  // ========================================
  // PHASE 5: Manual Interaction Testing (iPad)
  // ========================================
  PHASE_5_INTERACTION_TESTS: {
    device: "iPad Pro 11\" or iPad Air 4+",
    tests: [
      {
        scenario: "Customer Flow (Portrait Mode)",
        steps: [
          "1. Start at welcome screen",
          "2. Navigate to menu (tap back button - verify 48px size)",
          "3. Select item for customization",
          "4. Adjust quantity using +/- buttons (verify 48px size)",
          "5. Add to cart",
          "6. Open cart drawer",
          "7. Verify all buttons are large and responsive",
          "8. Select payment method",
        ],
        success_criteria: [
          "No accidental mis-taps",
          "All buttons respond immediately",
          "Text is clearly readable",
          "Spacing is comfortable for 2-handed use",
        ],
      },
      {
        scenario: "Landscape Rotation Test",
        steps: [
          "1. Complete customer flow in portrait",
          "2. Rotate iPad to landscape",
          "3. Verify layout reflows correctly (takes ~500ms)",
          "4. Test QRIS payment screen - two-pane layout",
          "5. Verify QR code displays properly",
          "6. Rotate back to portrait",
        ],
        success_criteria: [
          "Layout transitions smoothly",
          "No content overflow or cutoff",
          "Two-pane layout visible on lg: breakpoint",
          "All interactive elements remain accessible",
        ],
      },
      {
        scenario: "Touch Feedback Verification",
        steps: [
          "1. Tap back button - verify scale animation (active:scale-90)",
          "2. Tap quantity buttons - verify feedback",
          "3. Long-press any button - verify no callout menu appears",
          "4. Rapid-tap buttons - verify debouncing works",
        ],
        success_criteria: [
          "Immediate visual feedback on tap",
          "No system callout menus appear",
          "Rapid taps don't cause double-actions",
          "animations are smooth (no jank)",
        ],
      },
      {
        scenario: "Payment Flow (Cash PIN Entry)",
        steps: [
          "1. Complete order to payment",
          "2. Select 'Bayar Tunai di Kasir'",
          "3. Verify CashWaitScreen displays correctly",
          "4. Verify PIN input field is large and accessible",
          "5. Test PIN entry (even if not real)",
          "6. Verify button feedback on tap",
        ],
        success_criteria: [
          "PIN input field is clearly visible (lg:h-24)",
          "Number pad entry is smooth",
          "Confirm button is easy to tap",
          "Landscape layout shows two panes properly",
        ],
      },
    ],
  },

  // ========================================
  // Automated Testing (Playwright)
  // ========================================
  AUTOMATED_TESTS: {
    description: "Run Playwright tests to capture visual regressions",
    commands: [
      "pnpm test:e2e -- --headed (interactive mode)",
      "pnpm test:visual (visual regression only)",
    ],
    focus_areas: [
      "MenuHeader back button sizing",
      "CartSheet layout and spacing",
      "CustomizationSheet modal width on lg:",
      "QRISScreen two-pane layout on lg:",
      "CashWaitScreen two-pane layout on lg:",
    ],
  },

  // ========================================
  // Browser DevTools Testing
  // ========================================
  DEVTOOLS_CHECKS: {
    description: "Use Chrome DevTools for viewport testing",
    steps: [
      "1. Open DevTools (F12)",
      "2. Click Device Toolbar (Ctrl+Shift+M)",
      "3. Select 'iPad Pro' preset",
      "4. Test portrait orientation (768px width)",
      "5. Test landscape orientation (1024px width)",
      "6. Verify all elements scale correctly",
      "7. Check computed styles match expected breakpoints",
      "8. Verify button sizes using Element Inspector",
    ],
  },
}

export const TESTING_SUMMARY = {
  total_phases: 5,
  estimated_manual_testing_time: "30-45 minutes",
  automated_testing_time: "5-10 minutes",
  devices_recommended: [
    "iPad Pro 11 or 12.9",
    "iPad Air 4 or later",
    "iPad (7th gen) with 1024px max",
  ],
  success_metrics: [
    "All touch targets are minimum 48px",
    "Responsive layouts adapt correctly at md: (768px) and lg: (1024px)",
    "Two-pane payment screens work in landscape mode",
    "No visual regressions compared to baseline",
    "All buttons have tactile feedback",
    "Zero accidental mis-taps in user testing",
  ],
}
