import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MUSIC_STEP_S,
  MUSIC_LOOKAHEAD_S,
  MUSIC_SCHEDULER_MS,
} from '../constants';
import {
  MUSIC_MELODY,
  MUSIC_BASS,
  MUSIC_PAD_CHORDS,
  MUSIC_KICK_BEATS,
  MUSIC_SNARE_BEATS,
} from '../data/music';
import {
  playMagnetActivateSfx,
  playRareCoinPickupSfx,
  playShieldPickupSfx as playShieldPickupSfxFn,
  playShieldBreakSfx as playShieldBreakSfxFn,
  playCoinPickupSfx as playCoinPickupSfxFn,
  playCrashSfx as playCrashSfxFn,
  playBreakerPickupSfx as playBreakerPickupSfxFn,
  playBreakerUsedSfx as playBreakerUsedSfxFn,
  playInvincibilityPickupSfx as playInvincibilityPickupSfxFn,
  playRunFanfareSfx as playRunFanfareSfxFn,
  playNewRecordSfx as playNewRecordSfxFn,
  playBankCoinSfx as playBankCoinSfxFn,
} from './sfx';

interface UseAudioOptions {
  initialMuted: boolean;
  initialMusicVolume: number;
  initialSfxVolume: number;
}

export interface UseAudioReturn {
  // React state for UI rendering
  muted: boolean;
  musicVolume: number;
  sfxVolume: number;
  // UI callbacks
  toggleMute: () => void;
  changeMusicVolume: (v: number) => void;
  changeSfxVolume: (v: number) => void;
  // Functions for React callbacks (stable via useCallback)
  startMusic: () => void;
  stopMusic: () => void;
  startMagnetHum: () => void;
  stopMagnetHum: () => void;
  // Stable refs for use inside game loop (no dependency issues)
  startMusicRef: React.MutableRefObject<() => void>;
  stopMusicRef: React.MutableRefObject<() => void>;
  stopMagnetHumRef: React.MutableRefObject<() => void>;
  playRareCoinSfxRef: React.MutableRefObject<() => void>;
  playShieldPickupSfxRef: React.MutableRefObject<() => void>;
  playShieldBreakSfxRef: React.MutableRefObject<() => void>;
  playCoinSfxRef: React.MutableRefObject<() => void>;
  playCrashSfxRef: React.MutableRefObject<() => void>;
  playBreakerPickupSfxRef: React.MutableRefObject<() => void>;
  playBreakerUsedSfxRef: React.MutableRefObject<() => void>;
  playInvincibilityPickupSfxRef: React.MutableRefObject<() => void>;
  // End-of-run feedback (called from React components)
  playRunFanfare: () => void;
  playNewRecordSfx: () => void;
  playBankCoinSfx: () => void;
}

export function useAudio({
  initialMuted,
  initialMusicVolume,
  initialSfxVolume,
}: UseAudioOptions): UseAudioReturn {
  // ── React state (drives UI) ──────────────────────────────────────────────
  const [muted, setMuted] = useState(initialMuted);
  const [musicVolume, setMusicVolumeState] = useState(initialMusicVolume);
  const [sfxVolume, setSfxVolumeState] = useState(initialSfxVolume);

  // ── Stable setting refs (read by audio callbacks without re-creating them) ─
  const mutedRef = useRef(initialMuted);
  const musicVolumeRef = useRef(initialMusicVolume);
  const sfxVolumeRef = useRef(initialSfxVolume);

  // ── Audio context & node refs ────────────────────────────────────────────
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sfxGainRef = useRef<GainNode | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const humGainRef = useRef<GainNode | null>(null);
  const humOsc1Ref = useRef<OscillatorNode | null>(null);
  const humOsc2Ref = useRef<OscillatorNode | null>(null);

  // ── Music scheduler state ────────────────────────────────────────────────
  const musicSchedulerIdRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const musicNextNoteTimeRef = useRef<number>(0);
  const musicCurrentStepRef = useRef<number>(0);
  const musicIsPlayingRef = useRef<boolean>(false);

  // ── Stable ref targets (so game-loop closures can call them) ─────────────
  const startMusicRef = useRef<() => void>(() => {});
  const stopMusicRef = useRef<() => void>(() => {});
  const stopMagnetHumRef = useRef<() => void>(() => {});
  const playRareCoinSfxRef = useRef<() => void>(() => {});
  const playShieldPickupSfxRef = useRef<() => void>(() => {});
  const playShieldBreakSfxRef = useRef<() => void>(() => {});
  const playCoinSfxRef = useRef<() => void>(() => {});
  const playCrashSfxRef = useRef<() => void>(() => {});
  const playBreakerPickupSfxRef = useRef<() => void>(() => {});
  const playBreakerUsedSfxRef = useRef<() => void>(() => {});
  const playInvincibilityPickupSfxRef = useRef<() => void>(() => {});

  // Rate-limiter for coin SFX: play at most once per 110 ms
  const coinSfxCooldownRef = useRef<number>(0);

  // ── Internal helpers ─────────────────────────────────────────────────────
  const getOrCreateSfxGain = useCallback((ac: AudioContext): GainNode => {
    if (!sfxGainRef.current) {
      const g = ac.createGain();
      g.gain.value = mutedRef.current ? 0 : sfxVolumeRef.current / 100;
      g.connect(ac.destination);
      sfxGainRef.current = g;
    }
    return sfxGainRef.current;
  }, []);

  const getOrCreateMusicGain = useCallback((ac: AudioContext): GainNode => {
    if (!musicGainRef.current) {
      const g = ac.createGain();
      g.gain.value = mutedRef.current ? 0 : musicVolumeRef.current / 100;
      g.connect(ac.destination);
      musicGainRef.current = g;
    }
    return musicGainRef.current;
  }, []);

  // ── Stop background music ────────────────────────────────────────────────
  const stopMusic = useCallback(() => {
    if (musicSchedulerIdRef.current !== null) {
      clearInterval(musicSchedulerIdRef.current);
      musicSchedulerIdRef.current = null;
    }
    musicIsPlayingRef.current = false;
    if (musicGainRef.current && audioCtxRef.current) {
      const ac = audioCtxRef.current;
      const mg = musicGainRef.current;
      const now = ac.currentTime;
      mg.gain.cancelScheduledValues(now);
      mg.gain.setValueAtTime(mg.gain.value, now);
      mg.gain.linearRampToValueAtTime(0, now + 1.5);
    }
  }, []);

  // ── Start background music ───────────────────────────────────────────────
  const startMusic = useCallback(() => {
    if (musicSchedulerIdRef.current !== null) {
      clearInterval(musicSchedulerIdRef.current);
      musicSchedulerIdRef.current = null;
    }
    musicIsPlayingRef.current = false;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
        sfxGainRef.current = null;
        musicGainRef.current = null;
      }
      const ac = audioCtxRef.current;
      if (ac.state === 'suspended') void ac.resume();

      const musicGain = getOrCreateMusicGain(ac);
      const targetGain = mutedRef.current ? 0 : musicVolumeRef.current / 100;
      musicGain.gain.cancelScheduledValues(ac.currentTime);
      musicGain.gain.setValueAtTime(0, ac.currentTime);
      if (targetGain > 0) {
        musicGain.gain.linearRampToValueAtTime(
          targetGain,
          ac.currentTime + 2.0,
        );
      }

      musicIsPlayingRef.current = true;
      musicNextNoteTimeRef.current = ac.currentTime + 0.05;
      musicCurrentStepRef.current = 0;

      const tick = () => {
        if (!audioCtxRef.current || !musicIsPlayingRef.current) return;
        const ctx = audioCtxRef.current;
        const mg = musicGainRef.current;
        if (!mg) return;

        while (
          musicNextNoteTimeRef.current <
          ctx.currentTime + MUSIC_LOOKAHEAD_S
        ) {
          const step = musicCurrentStepRef.current;
          const t = musicNextNoteTimeRef.current;
          const beat = Math.floor(step / 4);

          // ── Synthwave lead ────────────────────────────────────────────
          const freq = MUSIC_MELODY[step];
          if (freq !== null) {
            const g = ctx.createGain();
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.055, t + 0.005);
            g.gain.exponentialRampToValueAtTime(0.001, t + MUSIC_STEP_S * 0.82);
            g.connect(mg);
            const oA = ctx.createOscillator();
            oA.type = 'sawtooth';
            oA.frequency.value = freq;
            oA.connect(g);
            oA.start(t);
            oA.stop(t + MUSIC_STEP_S * 0.88);
            const oB = ctx.createOscillator();
            oB.type = 'sawtooth';
            oB.frequency.value = freq;
            oB.detune.value = 8;
            oB.connect(g);
            oB.start(t);
            oB.stop(t + MUSIC_STEP_S * 0.88);
          }

          if (step % 4 === 0) {
            // ── Bass ─────────────────────────────────────────────────────
            const bassFreq = MUSIC_BASS[beat % MUSIC_BASS.length];
            const bg = ctx.createGain();
            bg.gain.setValueAtTime(0, t);
            bg.gain.linearRampToValueAtTime(0.12, t + 0.008);
            bg.gain.exponentialRampToValueAtTime(0.001, t + MUSIC_STEP_S * 2.9);
            bg.connect(mg);
            const bo = ctx.createOscillator();
            bo.type = 'sawtooth';
            bo.frequency.value = bassFreq;
            bo.connect(bg);
            bo.start(t);
            bo.stop(t + MUSIC_STEP_S * 3.0);

            // ── Four-on-the-floor kick ────────────────────────────────────
            if (MUSIC_KICK_BEATS.has(beat % 8)) {
              const kg = ctx.createGain();
              kg.gain.setValueAtTime(0.26, t);
              kg.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
              kg.connect(mg);
              const ko = ctx.createOscillator();
              ko.type = 'sine';
              ko.frequency.setValueAtTime(180, t);
              ko.frequency.exponentialRampToValueAtTime(38, t + 0.15);
              ko.connect(kg);
              ko.start(t);
              ko.stop(t + 0.19);
            }

            // ── Snare / clap ──────────────────────────────────────────────
            if (MUSIC_SNARE_BEATS.has(beat % 8)) {
              const sg = ctx.createGain();
              sg.gain.setValueAtTime(0.09, t);
              sg.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
              sg.connect(mg);
              const so = ctx.createOscillator();
              so.type = 'triangle';
              so.frequency.setValueAtTime(300, t);
              so.frequency.exponentialRampToValueAtTime(150, t + 0.12);
              so.connect(sg);
              so.start(t);
              so.stop(t + 0.24);
              const ng = ctx.createGain();
              ng.gain.setValueAtTime(0.06, t);
              ng.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
              ng.connect(mg);
              const no_ = ctx.createOscillator();
              no_.type = 'sawtooth';
              no_.frequency.value = 1760;
              no_.detune.value = 1400;
              no_.connect(ng);
              no_.start(t);
              no_.stop(t + 0.2);
            }
          }

          // ── Synthwave pad chords (every 2 beats) ──────────────────────
          if (step % 8 === 0) {
            const padIndex = Math.floor(step / 8) % MUSIC_PAD_CHORDS.length;
            const chordFreqs = MUSIC_PAD_CHORDS[padIndex];
            const padDur = MUSIC_STEP_S * 9.0;
            chordFreqs.forEach((cf, noteIdx) => {
              ([-5, 5] as const).forEach((cents) => {
                const pg = ctx.createGain();
                pg.gain.setValueAtTime(0, t);
                pg.gain.linearRampToValueAtTime(0.032, t + MUSIC_STEP_S * 2.5);
                pg.gain.linearRampToValueAtTime(
                  0.024,
                  t + padDur - MUSIC_STEP_S,
                );
                pg.gain.linearRampToValueAtTime(0, t + padDur);
                pg.connect(mg);
                const po = ctx.createOscillator();
                po.type = 'sawtooth';
                po.frequency.value = cf;
                po.detune.value = cents + noteIdx * 2;
                po.connect(pg);
                po.start(t);
                po.stop(t + padDur + 0.05);
              });
            });
          }

          musicNextNoteTimeRef.current += MUSIC_STEP_S;
          musicCurrentStepRef.current = (step + 1) % MUSIC_MELODY.length;
        }
      };

      tick();
      musicSchedulerIdRef.current = setInterval(tick, MUSIC_SCHEDULER_MS);
    } catch {
      /* AudioContext unavailable */
    }
  }, [getOrCreateMusicGain]);

  // ── Magnet hum: start ────────────────────────────────────────────────────
  const startMagnetHum = useCallback(() => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ac = audioCtxRef.current;
      if (ac.state === 'suspended') void ac.resume();
      const sfxGain = getOrCreateSfxGain(ac);
      if (!humGainRef.current) {
        // Activate zap fires only once per hum session (not on every repeated press).
        playMagnetActivateSfx(ac, sfxGain);
        const gain = ac.createGain();
        gain.gain.setValueAtTime(0, ac.currentTime);
        gain.gain.linearRampToValueAtTime(0.04, ac.currentTime + 0.04);
        gain.connect(sfxGain);
        const osc1 = ac.createOscillator();
        osc1.type = 'sawtooth';
        osc1.frequency.value = 60;
        osc1.connect(gain);
        osc1.start();
        const osc2 = ac.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = 160;
        osc2.connect(gain);
        osc2.start();
        humGainRef.current = gain;
        humOsc1Ref.current = osc1;
        humOsc2Ref.current = osc2;
      }
    } catch {
      /* AudioContext unavailable */
    }
  }, [getOrCreateSfxGain]);

  // ── Magnet hum: stop ─────────────────────────────────────────────────────
  const stopMagnetHum = useCallback(() => {
    try {
      if (humGainRef.current && audioCtxRef.current) {
        const ac = audioCtxRef.current;
        const gain = humGainRef.current;
        const now = ac.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.08);
        const stopAt = now + 0.09;
        humOsc1Ref.current?.stop(stopAt);
        humOsc2Ref.current?.stop(stopAt);
        humGainRef.current = null;
        humOsc1Ref.current = null;
        humOsc2Ref.current = null;
      }
    } catch {
      /* AudioContext unavailable */
    }
  }, []);

  // ── Settings ─────────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    localStorage.setItem('coinbound_muted', String(next));
    setMuted(next);
    if (sfxGainRef.current)
      sfxGainRef.current.gain.value = next ? 0 : sfxVolumeRef.current / 100;
    if (musicGainRef.current)
      musicGainRef.current.gain.value = next ? 0 : musicVolumeRef.current / 100;
  }, []);

  const changeMusicVolume = useCallback((v: number) => {
    musicVolumeRef.current = v;
    localStorage.setItem('coinbound_music_volume', String(v));
    setMusicVolumeState(v);
    if (musicGainRef.current && !mutedRef.current)
      musicGainRef.current.gain.value = v / 100;
  }, []);

  const changeSfxVolume = useCallback((v: number) => {
    sfxVolumeRef.current = v;
    localStorage.setItem('coinbound_sfx_volume', String(v));
    setSfxVolumeState(v);
    if (sfxGainRef.current && !mutedRef.current)
      sfxGainRef.current.gain.value = v / 100;
  }, []);

  // ── Game-loop SFX wrappers ────────────────────────────────────────────────
  const playRareCoinSfx = useCallback(() => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ac = audioCtxRef.current;
      if (ac.state === 'suspended') void ac.resume();
      playRareCoinPickupSfx(ac, getOrCreateSfxGain(ac));
    } catch {
      /* no-op */
    }
  }, [getOrCreateSfxGain]);

  const playShieldPickupSfx = useCallback(() => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ac = audioCtxRef.current;
      if (ac.state === 'suspended') void ac.resume();
      playShieldPickupSfxFn(ac, getOrCreateSfxGain(ac));
    } catch {
      /* no-op */
    }
  }, [getOrCreateSfxGain]);

  const playShieldBreakSfx = useCallback(() => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ac = audioCtxRef.current;
      if (ac.state === 'suspended') void ac.resume();
      playShieldBreakSfxFn(ac, getOrCreateSfxGain(ac));
    } catch {
      /* no-op */
    }
  }, [getOrCreateSfxGain]);

  const playCoinSfx = useCallback(() => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ac = audioCtxRef.current;
      if (ac.state === 'suspended') void ac.resume();
      // Rate-limit to prevent sound spam when collecting many coins per frame.
      const now = ac.currentTime;
      if (now - coinSfxCooldownRef.current < 0.11) return;
      coinSfxCooldownRef.current = now;
      playCoinPickupSfxFn(ac, getOrCreateSfxGain(ac));
    } catch {
      /* no-op */
    }
  }, [getOrCreateSfxGain]);

  const playCrashSfx = useCallback(() => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ac = audioCtxRef.current;
      if (ac.state === 'suspended') void ac.resume();
      playCrashSfxFn(ac, getOrCreateSfxGain(ac));
    } catch {
      /* no-op */
    }
  }, [getOrCreateSfxGain]);

  const playBreakerPickupSfx = useCallback(() => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ac = audioCtxRef.current;
      if (ac.state === 'suspended') void ac.resume();
      playBreakerPickupSfxFn(ac, getOrCreateSfxGain(ac));
    } catch {
      /* no-op */
    }
  }, [getOrCreateSfxGain]);

  const playBreakerUsedSfx = useCallback(() => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ac = audioCtxRef.current;
      if (ac.state === 'suspended') void ac.resume();
      playBreakerUsedSfxFn(ac, getOrCreateSfxGain(ac));
    } catch {
      /* no-op */
    }
  }, [getOrCreateSfxGain]);

  const playInvincibilityPickupSfx = useCallback(() => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ac = audioCtxRef.current;
      if (ac.state === 'suspended') void ac.resume();
      playInvincibilityPickupSfxFn(ac, getOrCreateSfxGain(ac));
    } catch {
      /* no-op */
    }
  }, [getOrCreateSfxGain]);

  const playRunFanfare = useCallback(() => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ac = audioCtxRef.current;
      if (ac.state === 'suspended') void ac.resume();
      playRunFanfareSfxFn(ac, getOrCreateSfxGain(ac));
    } catch {
      /* no-op */
    }
  }, [getOrCreateSfxGain]);

  const playNewRecordSfx = useCallback(() => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ac = audioCtxRef.current;
      if (ac.state === 'suspended') void ac.resume();
      playNewRecordSfxFn(ac, getOrCreateSfxGain(ac));
    } catch {
      /* no-op */
    }
  }, [getOrCreateSfxGain]);

  const playBankCoinSfx = useCallback(() => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ac = audioCtxRef.current;
      if (ac.state === 'suspended') void ac.resume();
      playBankCoinSfxFn(ac, getOrCreateSfxGain(ac));
    } catch {
      /* no-op */
    }
  }, [getOrCreateSfxGain]);

  // ── Sync stable refs ──────────────────────────────────────────────────────
  useEffect(() => {
    startMusicRef.current = startMusic;
  }, [startMusic]);
  useEffect(() => {
    stopMusicRef.current = stopMusic;
  }, [stopMusic]);
  useEffect(() => {
    stopMagnetHumRef.current = stopMagnetHum;
  }, [stopMagnetHum]);
  useEffect(() => {
    playRareCoinSfxRef.current = playRareCoinSfx;
  }, [playRareCoinSfx]);
  useEffect(() => {
    playShieldPickupSfxRef.current = playShieldPickupSfx;
  }, [playShieldPickupSfx]);
  useEffect(() => {
    playShieldBreakSfxRef.current = playShieldBreakSfx;
  }, [playShieldBreakSfx]);
  useEffect(() => {
    playCoinSfxRef.current = playCoinSfx;
  }, [playCoinSfx]);
  useEffect(() => {
    playCrashSfxRef.current = playCrashSfx;
  }, [playCrashSfx]);
  useEffect(() => {
    playBreakerPickupSfxRef.current = playBreakerPickupSfx;
  }, [playBreakerPickupSfx]);
  useEffect(() => {
    playBreakerUsedSfxRef.current = playBreakerUsedSfx;
  }, [playBreakerUsedSfx]);
  useEffect(() => {
    playInvincibilityPickupSfxRef.current = playInvincibilityPickupSfx;
  }, [playInvincibilityPickupSfx]);

  return {
    muted,
    musicVolume,
    sfxVolume,
    toggleMute,
    changeMusicVolume,
    changeSfxVolume,
    startMusic,
    stopMusic,
    startMagnetHum,
    stopMagnetHum,
    startMusicRef,
    stopMusicRef,
    stopMagnetHumRef,
    playRareCoinSfxRef,
    playShieldPickupSfxRef,
    playShieldBreakSfxRef,
    playCoinSfxRef,
    playCrashSfxRef,
    playBreakerPickupSfxRef,
    playBreakerUsedSfxRef,
    playInvincibilityPickupSfxRef,
    playRunFanfare,
    playNewRecordSfx,
    playBankCoinSfx,
  };
}
