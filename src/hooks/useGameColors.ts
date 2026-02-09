import { useEffect, useCallback } from 'react';
import { getColorHsl } from '@/components/game/SettingsModal';

interface UseGameColorsProps {
  player1Color: string;
  player2Color: string;
  currentPlayer?: 'player1' | 'player2';
}

// Helper to parse HSL string and return components
const parseHsl = (hslString: string): { h: number; s: number; l: number } | null => {
  // Handle format: "45 90% 55%" (space-separated)
  const spaceMatch = hslString.match(/^(\d+)\s+(\d+)%?\s+(\d+)%?$/);
  if (spaceMatch) {
    return {
      h: parseInt(spaceMatch[1]),
      s: parseInt(spaceMatch[2]),
      l: parseInt(spaceMatch[3]),
    };
  }
  
  // Handle format: "hsl(45, 90%, 55%)"
  const hslMatch = hslString.match(/hsl\((\d+),?\s*(\d+)%?,?\s*(\d+)%?\)/);
  if (hslMatch) {
    return {
      h: parseInt(hslMatch[1]),
      s: parseInt(hslMatch[2]),
      l: parseInt(hslMatch[3]),
    };
  }
  
  return null;
};

// Generate glow version (higher saturation and lightness)
const generateGlow = (h: number, s: number, l: number): string => {
  return `${h} ${Math.min(100, s + 10)}% ${Math.min(100, l + 10)}%`;
};

// Generate background version (low opacity feel via lightness)
const generateBg = (h: number, s: number): string => {
  return `${h} ${Math.max(20, s - 20)}% 12%`;
};

export const useGameColors = ({ player1Color, player2Color, currentPlayer }: UseGameColorsProps) => {
  const updateCSSVariables = useCallback(() => {
    const root = document.documentElement;
    
    // Get HSL values for each player
    const p1Hsl = getColorHsl(player1Color);
    const p2Hsl = getColorHsl(player2Color);
    
    const p1Parsed = parseHsl(p1Hsl);
    const p2Parsed = parseHsl(p2Hsl);
    
    if (p1Parsed) {
      root.style.setProperty('--player1', p1Hsl);
      root.style.setProperty('--player1-glow', generateGlow(p1Parsed.h, p1Parsed.s, p1Parsed.l));
      root.style.setProperty('--player1-bg', generateBg(p1Parsed.h, p1Parsed.s));
    }
    
    if (p2Parsed) {
      root.style.setProperty('--player2', p2Hsl);
      root.style.setProperty('--player2-glow', generateGlow(p2Parsed.h, p2Parsed.s, p2Parsed.l));
      root.style.setProperty('--player2-bg', generateBg(p2Parsed.h, p2Parsed.s));
    }
    
    // Set active player variable for reactive elements
    if (currentPlayer) {
      const activeHsl = currentPlayer === 'player1' ? p1Hsl : p2Hsl;
      const activeParsed = currentPlayer === 'player1' ? p1Parsed : p2Parsed;
      
      root.style.setProperty('--active-player', activeHsl);
      if (activeParsed) {
        root.style.setProperty('--active-player-glow', generateGlow(activeParsed.h, activeParsed.s, activeParsed.l));
      }
    }
  }, [player1Color, player2Color, currentPlayer]);
  
  useEffect(() => {
    updateCSSVariables();
  }, [updateCSSVariables]);
  
  return {
    updateColors: updateCSSVariables,
    player1Hsl: getColorHsl(player1Color),
    player2Hsl: getColorHsl(player2Color),
  };
};
