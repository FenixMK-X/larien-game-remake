import { useCallback, useRef } from 'react';

type SoundType = 'phase' | 'lifeLoss' | 'lifeGain' | 'timerEnd' | 'defeat' | 'click' | 'skillActivate' | 'diceRoll' | 'diceResult' | 'victory' | 'jackpotSpin' | 'jackpotWin' | 'domainEnd';

// Haptic feedback patterns
type HapticPattern = number | number[];

const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

// Vibration utility
const vibrateDevice = (pattern: HapticPattern): void => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

export const useGameSounds = () => {
  const lastPlayTime = useRef<Record<SoundType, number>>({
    phase: 0,
    lifeLoss: 0,
    lifeGain: 0,
    timerEnd: 0,
    defeat: 0,
    click: 0,
    skillActivate: 0,
    diceRoll: 0,
    diceResult: 0,
    victory: 0,
    jackpotSpin: 0,
    jackpotWin: 0,
    domainEnd: 0,
  });

  const vibrate = useCallback((pattern: HapticPattern) => {
    vibrateDevice(pattern);
  }, []);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) => {
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  }, []);

  const playSound = useCallback((type: SoundType) => {
    if (!audioContext) return;
    
    // Prevent rapid repeated sounds
    const now = Date.now();
    if (now - lastPlayTime.current[type] < 100) return;
    lastPlayTime.current[type] = now;

    // Resume audio context if suspended
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    switch (type) {
      case 'phase':
        playTone(880, 0.15, 'sine', 0.2);
        setTimeout(() => playTone(1100, 0.1, 'sine', 0.15), 100);
        vibrate(10); // Sharp tick
        break;
      case 'lifeLoss':
        playTone(300, 0.2, 'sawtooth', 0.15);
        vibrate(40); // Heavy thud
        break;
      case 'lifeGain':
        playTone(523, 0.1, 'sine', 0.2);
        setTimeout(() => playTone(659, 0.15, 'sine', 0.15), 80);
        vibrate(20); // Light tap
        break;
      case 'timerEnd':
        for (let i = 0; i < 3; i++) {
          setTimeout(() => playTone(800, 0.3, 'square', 0.2), i * 400);
        }
        vibrate([100, 50, 100, 50, 100]); // Urgent pattern
        break;
      case 'defeat':
        playTone(400, 0.3, 'sawtooth', 0.25);
        setTimeout(() => playTone(300, 0.3, 'sawtooth', 0.2), 200);
        setTimeout(() => playTone(200, 0.5, 'sawtooth', 0.15), 400);
        vibrate([50, 30, 80, 30, 120]); // Dramatic descend
        break;
      case 'click':
        playTone(600, 0.05, 'sine', 0.1);
        vibrate(10); // Sharp tick
        break;
      case 'skillActivate':
        // Magical activation sound
        playTone(523, 0.1, 'sine', 0.25);
        setTimeout(() => playTone(659, 0.1, 'sine', 0.2), 80);
        setTimeout(() => playTone(784, 0.15, 'sine', 0.25), 160);
        setTimeout(() => playTone(1047, 0.2, 'sine', 0.2), 260);
        vibrate([20, 30, 20, 30, 40]); // Ascending pattern
        break;
      case 'diceRoll':
        // Quick rattle sound
        playTone(200 + Math.random() * 200, 0.05, 'triangle', 0.15);
        vibrate(15); // Quick tap
        break;
      case 'diceResult':
        // Dramatic reveal
        playTone(400, 0.15, 'sine', 0.2);
        setTimeout(() => playTone(600, 0.15, 'sine', 0.25), 150);
        setTimeout(() => playTone(800, 0.2, 'sine', 0.3), 300);
        vibrate([30, 50, 60]); // Build-up
        break;
      case 'victory':
        // Triumphant fanfare
        playTone(523, 0.15, 'sine', 0.3);
        setTimeout(() => playTone(659, 0.15, 'sine', 0.3), 150);
        setTimeout(() => playTone(784, 0.15, 'sine', 0.3), 300);
        setTimeout(() => playTone(1047, 0.3, 'sine', 0.35), 450);
        setTimeout(() => playTone(784, 0.15, 'sine', 0.25), 700);
        setTimeout(() => playTone(1047, 0.4, 'sine', 0.4), 850);
        vibrate([50, 50, 50, 50, 100, 50, 150]); // Victory rumble
        break;
      case 'jackpotSpin':
        // Tuca Donka style intro - funky bass groove
        const bassNotes = [82.41, 98, 110, 82.41, 130.81, 110, 98, 82.41];
        bassNotes.forEach((note, i) => {
          setTimeout(() => {
            playTone(note, 0.1, 'sawtooth', 0.28);
            if (i % 2 === 0) {
              playTone(note * 2, 0.06, 'square', 0.12);
            }
          }, i * 90);
        });
        for (let i = 0; i < 8; i++) {
          setTimeout(() => {
            playTone(8000 + Math.random() * 2000, 0.02, 'square', 0.05);
          }, i * 90 + 45);
        }
        vibrate([30, 30, 30, 30, 30, 30, 30, 30]); // Rapid rhythm
        break;
      case 'jackpotWin':
        // Tuca Donka main drop
        playTone(55, 0.5, 'sawtooth', 0.4);
        playTone(110, 0.4, 'square', 0.2);
        
        const melody = [
          { note: 329.63, delay: 150 },
          { note: 392, delay: 300 },
          { note: 440, delay: 450 },
          { note: 523.25, delay: 600 },
          { note: 587.33, delay: 750 },
          { note: 523.25, delay: 900 },
          { note: 440, delay: 1050 },
          { note: 523.25, delay: 1200 },
        ];
        
        melody.forEach(({ note, delay }) => {
          setTimeout(() => {
            playTone(note, 0.12, 'square', 0.3);
            playTone(note * 0.5, 0.12, 'sawtooth', 0.15);
          }, delay);
        });
        
        const bassPattern = [82.41, 98, 82.41, 110, 82.41, 130.81, 110, 98];
        bassPattern.forEach((note, i) => {
          setTimeout(() => {
            playTone(note, 0.08, 'sawtooth', 0.2);
          }, 200 + i * 150);
        });
        
        setTimeout(() => {
          playTone(659.25, 0.3, 'square', 0.35);
          playTone(523.25, 0.3, 'square', 0.25);
          playTone(783.99, 0.3, 'sine', 0.2);
        }, 1400);
        vibrate([50, 50, 50, 50, 100, 100, 200]); // Epic rumble
        break;
      case 'domainEnd':
        // Tuca Donka style ending
        playTone(55, 0.8, 'sawtooth', 0.35);
        playTone(110, 0.6, 'square', 0.18);
        setTimeout(() => {
          playTone(41.2, 0.6, 'sawtooth', 0.3);
          playTone(82.41, 0.5, 'square', 0.15);
        }, 300);
        setTimeout(() => playTone(392, 0.2, 'square', 0.2), 500);
        setTimeout(() => playTone(293.66, 0.2, 'square', 0.18), 650);
        setTimeout(() => playTone(220, 0.3, 'square', 0.15), 800);
        setTimeout(() => playTone(164.81, 0.4, 'sawtooth', 0.2), 950);
        vibrate([80, 40, 60, 40, 100]); // Descending rumble
        break;
    }
  }, [playTone, vibrate]);

  return { playSound, vibrate };
};
