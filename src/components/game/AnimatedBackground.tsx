import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, memo } from 'react';

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
  shape: 'circle' | 'square';
}

export const AnimatedBackground = memo(({ currentPlayer, gameStarted = true }: AnimatedBackgroundProps) => {
  // Reduced particle count for mobile performance (8 instead of 15)
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 3,
      duration: Math.random() * 10 + 8,
      delay: Math.random() * 5,
      shape: (i % 2 === 0 ? 'circle' : 'square') as 'circle' | 'square',
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

      {/* Single ambient glow orb (reduced from 2) */}
      <motion.div
        key={`orb-${currentPlayer}`}
        animate={{
          x: currentPlayer === 'player1' ? ['-10%', '5%', '-10%'] : ['110%', '95%', '110%'],
          y: ['-10%', '10%', '-10%'],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute w-48 h-48 rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, hsl(var(--${currentPlayer}) / 0.15) 0%, transparent 70%)`,
        }}
      />

      {/* Floating particles (reduced) */}
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
            opacity: [0, 0.5, 0.5, 0],
            scale: [0, 1, 1, 0.5],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeOut',
          }}
          className={`absolute ${particle.shape === 'circle' ? 'rounded-full' : 'rounded-sm'}`}
          style={{
            width: particle.size,
            height: particle.size,
            background: `hsl(var(--${currentPlayer}) / 0.6)`,
            boxShadow: `0 0 ${particle.size}px hsl(var(--${currentPlayer}) / 0.4)`,
          }}
        />
      ))}

      {/* Corner vignettes */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, hsl(var(--background) / 0.8) 100%)',
        }}
      />
    </div>
  );
});

AnimatedBackground.displayName = 'AnimatedBackground';
