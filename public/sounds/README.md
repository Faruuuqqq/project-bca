# KDS Audio Cue

Place a short notification sound here as `new-order.mp3` to enable audio alerts on
new paid orders in the Kitchen Display System.

## Requirements
- Filename: `new-order.mp3` (referenced from `src/components/admin/OrderBoard.tsx`)
- Format: MP3 preferred (broadest browser support); ~50KB
- Length: 0.5-1.5s (longer cues annoy chefs; too short gets ignored)
- Volume: normalized; the page does not adjust gain
- Royalty-free / properly licensed

## Suggested sources
- https://freesound.org/ (search "notification ping" / "bell")
- https://pixabay.com/sound-effects/ (search "notification")
- iOS / Android system tones if you have rights

## Browser autoplay policy
Audio is gesture-gated by browsers. The first click anywhere in the KDS tab
unlocks playback. Until that happens, `audioRef.current.play()` rejects silently
(wrapped in `.catch(() => {})`). Open the KDS, click once, and subsequent
new-order events will play the cue.

## Verifying
1. Place file at `public/sounds/new-order.mp3`
2. Run `pnpm dev`
3. Visit `/admin/orders`, click anywhere on the page once
4. From another tab, place a kiosk order and pay it (or `UPDATE orders SET payment_status='paid'` in Supabase). The card appears in the cook queue and the cue plays.

If no sound: confirm `<audio src="/sounds/new-order.mp3">` resolves in DevTools
network tab. 404 = file missing or wrong extension/case.
