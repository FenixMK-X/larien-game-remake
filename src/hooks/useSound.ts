import { useCallback, useRef } from 'react';

type SoundType = 'phase' | 'lifeLoss' | 'lifeGain' | 'timerEnd' | 'defeat' | 'click' | 'skillActivate' | 'diceRoll' | 'diceResult' | 'victory' | 'jackpotSpin' | 'jackpotWin' | 'domainEnd';

const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

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
        break;
      case 'lifeLoss':
        playTone(300, 0.2, 'sawtooth', 0.15);
        break;
      case 'lifeGain':
        playTone(523, 0.1, 'sine', 0.2);
        setTimeout(() => playTone(659, 0.15, 'sine', 0.15), 80);
        break;
      case 'timerEnd':
        for (let i = 0; i < 3; i++) {
          setTimeout(() => playTone(800, 0.3, 'square', 0.2), i * 400);
        }
        break;
      case 'defeat':
        playTone(400, 0.3, 'sawtooth', 0.25);
        setTimeout(() => playTone(300, 0.3, 'sawtooth', 0.2), 200);
        setTimeout(() => playTone(200, 0.5, 'sawtooth', 0.15), 400);
        break;
      case 'click':
        playTone(600, 0.05, 'sine', 0.1);
        break;
      case 'skillActivate':
        // Magical activation sound
        playTone(523, 0.1, 'sine', 0.25);
        setTimeout(() => playTone(659, 0.1, 'sine', 0.2), 80);
        setTimeout(() => playTone(784, 0.15, 'sine', 0.25), 160);
        setTimeout(() => playTone(1047, 0.2, 'sine', 0.2), 260);
        break;
      case 'diceRoll':
        // Quick rattle sound
        playTone(200 + Math.random() * 200, 0.05, 'triangle', 0.15);
        break;
      case 'diceResult':
        // Dramatic reveal
        playTone(400, 0.15, 'sine', 0.2);
        setTimeout(() => playTone(600, 0.15, 'sine', 0.25), 150);
        setTimeout(() => playTone(800, 0.2, 'sine', 0.3), 300);
        break;
      case 'victory':
        // Triumphant fanfare
        playTone(523, 0.15, 'sine', 0.3);
        setTimeout(() => playTone(659, 0.15, 'sine', 0.3), 150);
        setTimeout(() => playTone(784, 0.15, 'sine', 0.3), 300);
        setTimeout(() => playTone(1047, 0.3, 'sine', 0.35), 450);
        setTimeout(() => playTone(784, 0.15, 'sine', 0.25), 700);
        setTimeout(() => playTone(1047, 0.4, 'sine', 0.4), 850);
        break;
      case 'jackpotSpin':
        // Tuca Donka style intro - funky bass groove
        // Bass line pattern
        const bassNotes = [82.41, 98, 110, 82.41, 130.81, 110, 98, 82.41]; // E2-based groove
        bassNotes.forEach((note, i) => {
          setTimeout(() => {
            playTone(note, 0.1, 'sawtooth', 0.28);
            // Add synth stabs
            if (i % 2 === 0) {
              playTone(note * 2, 0.06, 'square', 0.12);
            }
          }, i * 90);
        });
        // Funky hi-hat pattern
        for (let i = 0; i < 8; i++) {
          setTimeout(() => {
            playTone(8000 + Math.random() * 2000, 0.02, 'square', 0.05);
          }, i * 90 + 45);
        }
        break;
      case 'jackpotWin':
        // Tuca Donka main drop - energetic synth melody
        // Characteristic bass drop
        playTone(55, 0.5, 'sawtooth', 0.4);
        playTone(110, 0.4, 'square', 0.2);
        
        // Main melody hook (synth lead)
        const melody = [
          { note: 329.63, delay: 150 },  // E4
          { note: 392, delay: 300 },      // G4
          { note: 440, delay: 450 },      // A4
          { note: 523.25, delay: 600 },   // C5
          { note: 587.33, delay: 750 },   // D5
          { note: 523.25, delay: 900 },   // C5
          { note: 440, delay: 1050 },     // A4
          { note: 523.25, delay: 1200 },  // C5
        ];
        
        melody.forEach(({ note, delay }) => {
          setTimeout(() => {
            playTone(note, 0.12, 'square', 0.3);
            playTone(note * 0.5, 0.12, 'sawtooth', 0.15); // Bass octave
          }, delay);
        });
        
        // Funky bass pattern underneath
        const bassPattern = [82.41, 98, 82.41, 110, 82.41, 130.81, 110, 98];
        bassPattern.forEach((note, i) => {
          setTimeout(() => {
            playTone(note, 0.08, 'sawtooth', 0.2);
          }, 200 + i * 150);
        });
        
        // Victory stab at the end
        setTimeout(() => {
          playTone(659.25, 0.3, 'square', 0.35);
          playTone(523.25, 0.3, 'square', 0.25);
          playTone(783.99, 0.3, 'sine', 0.2);
        }, 1400);
        break;
      case 'domainEnd':
        // Tuca Donka style ending - dramatic bass drop
        playTone(55, 0.8, 'sawtooth', 0.35);
        playTone(110, 0.6, 'square', 0.18);
        setTimeout(() => {
          playTone(41.2, 0.6, 'sawtooth', 0.3);
          playTone(82.41, 0.5, 'square', 0.15);
        }, 300);
        // Descending synth
        setTimeout(() => playTone(392, 0.2, 'square', 0.2), 500);
        setTimeout(() => playTone(293.66, 0.2, 'square', 0.18), 650);
        setTimeout(() => playTone(220, 0.3, 'square', 0.15), 800);
        setTimeout(() => playTone(164.81, 0.4, 'sawtooth', 0.2), 950);
        break;
    }
  }, [playTone]);

  return { playSound };
};
