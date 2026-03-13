// ─── Pure SFX play functions ──────────────────────────────────────────────────
// Each function schedules oscillators immediately using the provided AudioContext
// and GainNode. All nodes are self-stopping and do not leak memory.

export function playRareCoinPickupSfx(
  ac: AudioContext,
  sfxGain: GainNode,
): void {
  // Rising arpeggio: C6 → E6 → G6
  const notes = [1047, 1319, 1568];
  notes.forEach((freq, idx) => {
    const g = ac.createGain();
    const t0 = ac.currentTime + idx * 0.09;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.18, t0 + 0.025);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3);
    g.connect(sfxGain);
    const o = ac.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq;
    o.connect(g);
    o.start(t0);
    o.stop(t0 + 0.32);
  });
}

export function playShieldPickupSfx(ac: AudioContext, sfxGain: GainNode): void {
  // Rising chime: A4 → E6
  const g = ac.createGain();
  g.gain.setValueAtTime(0.14, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.6);
  g.connect(sfxGain);
  const o = ac.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(440, ac.currentTime);
  o.frequency.exponentialRampToValueAtTime(1320, ac.currentTime + 0.2);
  o.connect(g);
  o.start();
  o.stop(ac.currentTime + 0.6);
}

export function playShieldBreakSfx(ac: AudioContext, sfxGain: GainNode): void {
  // Low crunch
  const g1 = ac.createGain();
  g1.gain.setValueAtTime(0.15, ac.currentTime);
  g1.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.38);
  g1.connect(sfxGain);
  const o1 = ac.createOscillator();
  o1.type = 'sawtooth';
  o1.frequency.setValueAtTime(200, ac.currentTime);
  o1.frequency.exponentialRampToValueAtTime(40, ac.currentTime + 0.32);
  o1.connect(g1);
  o1.start();
  o1.stop(ac.currentTime + 0.38);

  // High crack
  const g2 = ac.createGain();
  g2.gain.setValueAtTime(0.09, ac.currentTime);
  g2.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.18);
  g2.connect(sfxGain);
  const o2 = ac.createOscillator();
  o2.type = 'square';
  o2.frequency.setValueAtTime(1200, ac.currentTime);
  o2.frequency.exponentialRampToValueAtTime(300, ac.currentTime + 0.14);
  o2.connect(g2);
  o2.start();
  o2.stop(ac.currentTime + 0.18);
}

export function playMagnetActivateSfx(
  ac: AudioContext,
  sfxGain: GainNode,
): void {
  // Zap: sawtooth sweep 880 Hz → 80 Hz
  const zapGain = ac.createGain();
  zapGain.gain.setValueAtTime(0.09, ac.currentTime);
  zapGain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.14);
  zapGain.connect(sfxGain);
  const zapOsc = ac.createOscillator();
  zapOsc.type = 'sawtooth';
  zapOsc.frequency.setValueAtTime(880, ac.currentTime);
  zapOsc.frequency.exponentialRampToValueAtTime(80, ac.currentTime + 0.14);
  zapOsc.connect(zapGain);
  zapOsc.start();
  zapOsc.stop(ac.currentTime + 0.15);
}

// ─── Normal coin pickup ───────────────────────────────────────────────────────
export function playCoinPickupSfx(ac: AudioContext, sfxGain: GainNode): void {
  // Quick bright ping with a subtle harmonic overtone.
  const g1 = ac.createGain();
  g1.gain.setValueAtTime(0, ac.currentTime);
  g1.gain.linearRampToValueAtTime(0.12, ac.currentTime + 0.008);
  g1.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.18);
  g1.connect(sfxGain);
  const o1 = ac.createOscillator();
  o1.type = 'sine';
  o1.frequency.setValueAtTime(880, ac.currentTime);
  o1.frequency.exponentialRampToValueAtTime(1320, ac.currentTime + 0.06);
  o1.connect(g1);
  o1.start();
  o1.stop(ac.currentTime + 0.2);

  const g2 = ac.createGain();
  g2.gain.setValueAtTime(0, ac.currentTime);
  g2.gain.linearRampToValueAtTime(0.055, ac.currentTime + 0.01);
  g2.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.14);
  g2.connect(sfxGain);
  const o2 = ac.createOscillator();
  o2.type = 'sine';
  o2.frequency.setValueAtTime(1760, ac.currentTime);
  o2.frequency.exponentialRampToValueAtTime(2640, ac.currentTime + 0.05);
  o2.connect(g2);
  o2.start();
  o2.stop(ac.currentTime + 0.14);
}

// ─── Player crash (fatal collision, no shield) ────────────────────────────────
export function playCrashSfx(ac: AudioContext, sfxGain: GainNode): void {
  const t0 = ac.currentTime;

  // Deep impact thud: sine sweep from 120 → 25 Hz
  const thudG = ac.createGain();
  thudG.gain.setValueAtTime(0.32, t0);
  thudG.gain.exponentialRampToValueAtTime(0.001, t0 + 0.38);
  thudG.connect(sfxGain);
  const thudO = ac.createOscillator();
  thudO.type = 'sine';
  thudO.frequency.setValueAtTime(120, t0);
  thudO.frequency.exponentialRampToValueAtTime(25, t0 + 0.32);
  thudO.connect(thudG);
  thudO.start(t0);
  thudO.stop(t0 + 0.4);

  // Distorted crunch: sawtooth sweep 280 → 45 Hz
  const crunchG = ac.createGain();
  crunchG.gain.setValueAtTime(0.2, t0);
  crunchG.gain.exponentialRampToValueAtTime(0.001, t0 + 0.24);
  crunchG.connect(sfxGain);
  const crunchO = ac.createOscillator();
  crunchO.type = 'sawtooth';
  crunchO.frequency.setValueAtTime(280, t0);
  crunchO.frequency.exponentialRampToValueAtTime(45, t0 + 0.22);
  crunchO.connect(crunchG);
  crunchO.start(t0);
  crunchO.stop(t0 + 0.26);

  // High-frequency crack/splinter: square sweep 1600 → 180 Hz
  const crackG = ac.createGain();
  crackG.gain.setValueAtTime(0.12, t0);
  crackG.gain.exponentialRampToValueAtTime(0.001, t0 + 0.13);
  crackG.connect(sfxGain);
  const crackO = ac.createOscillator();
  crackO.type = 'square';
  crackO.frequency.setValueAtTime(1600, t0);
  crackO.frequency.exponentialRampToValueAtTime(180, t0 + 0.11);
  crackO.connect(crackG);
  crackO.start(t0);
  crackO.stop(t0 + 0.14);
}

// ─── Breaker pickup ────────────────────────────────────────────────────────────────
export function playBreakerPickupSfx(
  ac: AudioContext,
  sfxGain: GainNode,
): void {
  const t0 = ac.currentTime;
  // Punchy ascending power tone
  const g1 = ac.createGain();
  g1.gain.setValueAtTime(0.16, t0);
  g1.gain.exponentialRampToValueAtTime(0.001, t0 + 0.48);
  g1.connect(sfxGain);
  const o1 = ac.createOscillator();
  o1.type = 'sawtooth';
  o1.frequency.setValueAtTime(180, t0);
  o1.frequency.exponentialRampToValueAtTime(580, t0 + 0.16);
  o1.connect(g1);
  o1.start(t0);
  o1.stop(t0 + 0.5);
  // Harmonic ring
  const g2 = ac.createGain();
  g2.gain.setValueAtTime(0.07, t0);
  g2.gain.exponentialRampToValueAtTime(0.001, t0 + 0.38);
  g2.connect(sfxGain);
  const o2 = ac.createOscillator();
  o2.type = 'square';
  o2.frequency.setValueAtTime(270, t0);
  o2.frequency.exponentialRampToValueAtTime(870, t0 + 0.16);
  o2.connect(g2);
  o2.start(t0);
  o2.stop(t0 + 0.4);
}

// ─── Breaker activated (obstacle destroyed) ────────────────────────────────────────
export function playBreakerUsedSfx(ac: AudioContext, sfxGain: GainNode): void {
  const t0 = ac.currentTime;
  // Low explosive boom
  const g1 = ac.createGain();
  g1.gain.setValueAtTime(0.22, t0);
  g1.gain.exponentialRampToValueAtTime(0.001, t0 + 0.55);
  g1.connect(sfxGain);
  const o1 = ac.createOscillator();
  o1.type = 'sine';
  o1.frequency.setValueAtTime(140, t0);
  o1.frequency.exponentialRampToValueAtTime(26, t0 + 0.48);
  o1.connect(g1);
  o1.start(t0);
  o1.stop(t0 + 0.56);
  // Mid crunch
  const g2 = ac.createGain();
  g2.gain.setValueAtTime(0.14, t0);
  g2.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3);
  g2.connect(sfxGain);
  const o2 = ac.createOscillator();
  o2.type = 'sawtooth';
  o2.frequency.setValueAtTime(380, t0);
  o2.frequency.exponentialRampToValueAtTime(65, t0 + 0.26);
  o2.connect(g2);
  o2.start(t0);
  o2.stop(t0 + 0.32);
  // High sizzle crack
  const g3 = ac.createGain();
  g3.gain.setValueAtTime(0.08, t0);
  g3.gain.exponentialRampToValueAtTime(0.001, t0 + 0.2);
  g3.connect(sfxGain);
  const o3 = ac.createOscillator();
  o3.type = 'square';
  o3.frequency.setValueAtTime(1900, t0);
  o3.frequency.exponentialRampToValueAtTime(280, t0 + 0.16);
  o3.connect(g3);
  o3.start(t0);
  o3.stop(t0 + 0.22);
}

// ─── Invincibility pickup ─────────────────────────────────────────────────────
// An ethereal shimmer: ascending glassy sine tones + a soft noise swell.
export function playInvincibilityPickupSfx(
  ac: AudioContext,
  sfxGain: GainNode,
): void {
  const t0 = ac.currentTime;

  // Rising arpeggio of pure sine tones (E5, A5, C#6, E6)
  const notes = [659, 880, 1109, 1319];
  notes.forEach((freq, idx) => {
    const g = ac.createGain();
    const t = t0 + idx * 0.1;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.14, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    g.connect(sfxGain);
    const o = ac.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq;
    o.connect(g);
    o.start(t);
    o.stop(t + 0.58);
  });

  // Soft harmonic undertone sweep (gives it an ethereal halo quality)
  const hg = ac.createGain();
  hg.gain.setValueAtTime(0, t0);
  hg.gain.linearRampToValueAtTime(0.08, t0 + 0.08);
  hg.gain.exponentialRampToValueAtTime(0.001, t0 + 0.7);
  hg.connect(sfxGain);
  const ho = ac.createOscillator();
  ho.type = 'triangle';
  ho.frequency.setValueAtTime(330, t0);
  ho.frequency.exponentialRampToValueAtTime(1320, t0 + 0.35);
  ho.connect(hg);
  ho.start(t0);
  ho.stop(t0 + 0.72);
}
