import { useRef, useEffect, useCallback } from 'react';

const DOMAIN_MUSIC: Record<string, string> = {
  jackpot: '/audio/jackpot-theme.mp3',
};

export const useDomainMusic = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentDomainRef = useRef<string | null>(null);
  const volumeRef = useRef(0.3);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playDomainMusic = useCallback((domainId: string) => {
    const musicPath = DOMAIN_MUSIC[domainId];
    if (!musicPath) return;

    // If already playing this domain's music, don't restart
    if (currentDomainRef.current === domainId && audioRef.current && !audioRef.current.paused) {
      return;
    }

    // Stop any currently playing music
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Create and play new audio
    const audio = new Audio(musicPath);
    audio.loop = true;
    audio.volume = volumeRef.current;
    
    audio.play().catch(err => {
      console.warn('Could not play domain music:', err);
    });

    audioRef.current = audio;
    currentDomainRef.current = domainId;
  }, []);

  const stopDomainMusic = useCallback(() => {
    if (audioRef.current) {
      // Fade out for smooth transition
      const audio = audioRef.current;
      const fadeOut = setInterval(() => {
        if (audio.volume > 0.05) {
          audio.volume = Math.max(0, audio.volume - 0.05);
        } else {
          clearInterval(fadeOut);
          audio.pause();
          audio.currentTime = 0;
        }
      }, 50);
      
      audioRef.current = null;
      currentDomainRef.current = null;
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    volumeRef.current = Math.max(0, Math.min(1, volume));
    if (audioRef.current) {
      audioRef.current.volume = volumeRef.current;
    }
  }, []);

  const isPlaying = useCallback(() => {
    return audioRef.current !== null && !audioRef.current.paused;
  }, []);

  return {
    playDomainMusic,
    stopDomainMusic,
    setVolume,
    isPlaying,
  };
};
