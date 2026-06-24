export function playNotificationSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // Helper to play a single note with a bell-like envelope
    const playChime = (freq: number, startTime: number, isChord = false) => {
      // Create two oscillators for a richer, softer tone (Sine for body, Triangle for warmth)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      
      const gainNode = ctx.createGain();
      
      osc1.type = 'sine';
      osc2.type = 'triangle';
      
      osc1.frequency.value = freq;
      // The triangle wave is tuned an octave higher for overtone richness
      osc2.frequency.value = freq * 2; 

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      // ADSR Envelope for a "Pluck" or "Marimba/Bell" feel
      // Attack: very fast
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(isChord ? 0.2 : 0.4, startTime + 0.02);
      // Decay & Sustain & Release: exponential fade out
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 1.5);

      osc1.start(startTime);
      osc2.start(startTime);
      
      osc1.stop(startTime + 1.5);
      osc2.stop(startTime + 1.5);
    };

    // --- Sound Design based on UX Psychology ---
    // 1. Rising sequence: indicates success, positivity, and forward momentum.
    // 2. Frequencies: 440Hz (A4) and 659Hz (E5). This is a Perfect 5th interval, 
    //    which sounds extremely stable, professional, and pleasant (not overly happy/sad).
    // 3. Timbre: Soft sine+triangle mimics a gentle reception bell or modern UI chime.

    const rootFreq = 440.00; // A4
    const fifthFreq = 659.25; // E5

    // Play the rising arpeggio
    playChime(rootFreq, now); // First note
    playChime(fifthFreq, now + 0.15); // Second note (rises up)
    
    // Optional: Add a very soft bass undertone to the final note for "grounding" (A3)
    playChime(220.00, now + 0.15, true); 

  } catch (e) {
    console.error('Audio play failed:', e);
  }
}
