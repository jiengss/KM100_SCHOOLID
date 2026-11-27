// ==============================================================================
// Web Audio API Synthesizer & Speech Synthesis for School ID Kiosk
// ==============================================================================

let audioCtx = null;
let isUnlocked = false;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().then(() => {
      isUnlocked = true;
    }).catch(() => {});
  }
  return audioCtx;
}

// Global user interaction listener to automatically unlock Web Audio on first tap/key
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().then(() => {
        isUnlocked = true;
      });
    } else {
      isUnlocked = true;
    }
    // Remove listeners once unlocked
    ['click', 'keydown', 'touchstart', 'pointerdown'].forEach(evt => {
      window.removeEventListener(evt, unlockAudio, true);
    });
  };

  ['click', 'keydown', 'touchstart', 'pointerdown'].forEach(evt => {
    window.addEventListener(evt, unlockAudio, { once: false, capture: true });
  });
}

/**
 * Play authentic barcode scanner "BEEP!" (Iconic sharp laser scanner tone)
 */
export function playScannerBeep() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // Sharp 2400 Hz barcode scanner frequency
    osc.type = 'square';
    osc.frequency.setValueAtTime(2400, now);

    // Short crisp 75ms beep
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.setValueAtTime(0.3, now + 0.06);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  } catch (e) {
    console.warn("Scanner beep error:", e);
  }
}

/**
 * Play high-quality success chime (Time In)
 */
export function playSuccessChime() {
  try {
    // First trigger the sharp scanner beep
    playScannerBeep();

    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    // After 90ms, play the pleasant welcoming chime
    const startTime = ctx.currentTime + 0.09;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    // Ascending bright chime: C6 (1046Hz) -> E6 (1318Hz) -> G6 (1567Hz) -> C7 (2093Hz)
    osc1.frequency.setValueAtTime(1046.5, startTime);
    osc1.frequency.setValueAtTime(1318.5, startTime + 0.12);
    osc1.frequency.setValueAtTime(1567.98, startTime + 0.24);
    osc1.frequency.setValueAtTime(2093.0, startTime + 0.36);

    osc2.frequency.setValueAtTime(523.25, startTime);
    osc2.frequency.setValueAtTime(659.25, startTime + 0.12);
    osc2.frequency.setValueAtTime(783.99, startTime + 0.24);
    osc2.frequency.setValueAtTime(1046.5, startTime + 0.36);

    gainNode.gain.setValueAtTime(0.28, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.7);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + 0.7);
    osc2.stop(startTime + 0.7);
  } catch (e) {
    console.warn("Success chime error:", e);
  }
}

/**
 * Play smooth departure chime (Time Out)
 */
export function playDepartureChime() {
  try {
    playScannerBeep();

    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const startTime = ctx.currentTime + 0.09;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    // Gentle descending chord tone: G5 (784Hz) -> E5 (659Hz) -> C5 (523Hz)
    osc.frequency.setValueAtTime(783.99, startTime);
    osc.frequency.setValueAtTime(659.25, startTime + 0.14);
    osc.frequency.setValueAtTime(523.25, startTime + 0.28);

    gainNode.gain.setValueAtTime(0.28, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.75);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.75);
  } catch (e) {
    console.warn("Departure chime error:", e);
  }
}

/**
 * Play an alert buzzer for unrecognized/invalid ID
 */
export function playAlertBuzzer() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.setValueAtTime(190, now + 0.15);

    gainNode.gain.setValueAtTime(0.35, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  } catch (e) {
    console.warn("Alert buzzer error:", e);
  }
}

/**
 * Text-to-speech announcement (e.g. "Welcome, Sophia!" or "Goodbye, Marcus!")
 */
export function speakGreeting(text) {
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // Cancel any lingering speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn("Speech synthesis error:", e);
  }
}
