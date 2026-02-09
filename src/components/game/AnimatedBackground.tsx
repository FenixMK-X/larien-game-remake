import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';

interface AnimatedBackgroundProps {
  currentPlayer: 'player1' | 'player2';
  gameStarted?: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  shape: 'circle' | 'square' | 'diamond';
}

export const AnimatedBackground = ({ currentPlayer, gameStarted = true }: AnimatedBackgroundProps) => {
  // Generate particles with memoization to avoid re-renders
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 8 + 4,
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 4,
      shape: (['circle', 'square', 'diamond'] as const)[Math.floor(Math.random() * 3)],
    }));
  }, []);

  if (!gameStarted) return null;

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Dynamic gradient background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPlayer}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="absolute inset-0"
          style={{
            background: currentPlayer === 'player1'
              ? 'radial-gradient(ellipse at top left, hsl(var(--player1) / 0.15) 0%, transparent 50%), radial-gradient(ellipse at bottom right, hsl(var(--player1) / 0.05) 0%, transparent 50%)'
              : 'radial-gradient(ellipse at bottom right, hsl(var(--player2) / 0.15) 0%, transparent 50%), radial-gradient(ellipse at top left, hsl(var(--player2) / 0.05) 0%, transparent 50%)',
          }}
        />
      </AnimatePresence>

      {/* Ambient glow orbs */}
      <motion.div
        key={`orb-1-${currentPlayer}`}
        animate={{
          x: currentPlayer === 'player1' ? ['-10%', '5%', '-10%'] : ['110%', '95%', '110%'],
          y: ['-10%', '10%', '-10%'],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute w-64 h-64 rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, hsl(var(--${currentPlayer}) / 0.2) 0%, transparent 70%)`,
        }}
      />
      
      <motion.div
        key={`orb-2-${currentPlayer}`}
        animate={{
          x: currentPlayer === 'player1' ? ['20%', '30%', '20%'] : ['80%', '70%', '80%'],
          y: ['80%', '90%', '80%'],
          scale: [1.1, 0.9, 1.1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute w-48 h-48 rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, hsl(var(--${currentPlayer}) / 0.15) 0%, transparent 70%)`,
        }}
      />

      {/* Floating particles */}
      {particles.map((particle) => (
        <motion.div
          key={`${particle.id}-${currentPlayer}`}
          initial={{
            x: `${particle.x}vw`,
            y: `${100 + particle.y * 0.2}vh`,
            opacity: 0,
            scale: 0,
          }}
          animate={{
            y: [null, `-${20 + particle.y * 0.3}vh`],
            opacity: [0, 0.6, 0.6, 0],
            scale: [0, 1, 1, 0.5],
            rotate: particle.shape === 'diamond' ? [0, 180, 360] : 0,
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeOut',
          }}
          className={`absolute ${
            particle.shape === 'circle' ? 'rounded-full' : 
            particle.shape === 'diamond' ? 'rotate-45' : 'rounded-sm'
          }`}
          style={{
            width: particle.size,
            height: particle.size,
            background: `hsl(var(--${currentPlayer}) / 0.7)`,
            boxShadow: `0 0 ${particle.size * 2}px hsl(var(--${currentPlayer}) / 0.5)`,
          }}
        />
      ))}

      {/* Subtle scan line effect */}
      <motion.div
        animate={{
          y: ['-100%', '200%'],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute inset-x-0 h-32 opacity-[0.02]"
        style={{
          background: `linear-gradient(to bottom, transparent, hsl(var(--${currentPlayer}) / 0.3), transparent)`,
        }}
      />

      {/* Corner vignettes */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, hsl(var(--background) / 0.8) 100%)',
        }}
      />
    </div>
  );
};
