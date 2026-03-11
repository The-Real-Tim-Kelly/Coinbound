// 32-step (2-bar) synthwave melody in A natural minor (Am → F → C → G)
// ♩ = 120 bpm, 16th-note grid
export const MUSIC_MELODY: (number | null)[] = [
  //  bar 1, beats 1-2 — Am arpeggio
  440.0,
  null,
  523.25,
  659.25,
  null,
  440.0,
  523.25,
  null,
  //  bar 1, beats 3-4 — F chord motif
  349.23,
  null,
  440.0,
  523.25,
  null,
  349.23,
  440.0,
  null,
  //  bar 2, beats 1-2 — C chord motif
  329.63,
  392.0,
  null,
  329.63,
  523.25,
  null,
  392.0,
  null,
  //  bar 2, beats 3-4 — G chord resolution
  392.0,
  null,
  493.88,
  587.33,
  null,
  493.88,
  392.0,
  null,
];

// Bass root per beat (8 beats across 2 bars): Am → F → C → G
export const MUSIC_BASS: number[] = [
  110.0,
  110.0, // A2 — Am
  87.31,
  87.31, // F2 — F
  130.81,
  130.81, // C3 — C
  98.0,
  98.0, // G2 — G
];

// Synthwave pad chords per 2-beat block (step % 8 == 0): Am, F, C, G
export const MUSIC_PAD_CHORDS: number[][] = [
  [220.0, 261.63, 329.63], // Am: A3 C4 E4
  [174.61, 220.0, 261.63], // F:  F3 A3 C4
  [130.81, 164.81, 196.0], // C:  C3 E3 G3
  [196.0, 246.94, 293.66], // G:  G3 B3 D4
];

// Four-on-the-floor kick (every beat)
export const MUSIC_KICK_BEATS = new Set([0, 1, 2, 3, 4, 5, 6, 7]);

// Snare / clap on beats 2 & 4 of each bar
export const MUSIC_SNARE_BEATS = new Set([1, 3, 5, 7]);
