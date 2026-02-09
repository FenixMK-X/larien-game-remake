import { motion, AnimatePresence } from 'framer-motion';
import { Swords } from 'lucide-react';
import { useEffect } from 'react';
import { useGameSounds } from '@/hooks/useSound';

interface TurnTransitionProps {
  show: boolean;
  player: 'player1' | 'player2';
  onComplete: () => void;
}

export const TurnTransition = ({ show, player, onComplete }: TurnTransitionProps) => {
  const { playSound, vibrate } = useGameSounds();
  const playerLabel = player === 'player1' ? 'Jugador 1' : 'Jugador 2';

  useEffect(() => {
    if (show) {
      playSound('phase');
      vibrate([30, 50, 30]); // Mechanical sequence haptic
    }
  }, [show, playSound, vibrate]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onAnimationComplete={() => {
            setTimeout(onComplete, 1200);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
        >
          {/* Dark backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-background/95 backdrop-blur-xl"
          />

          {/* Diagonal slash effect - Left side */}
          <motion.div
            initial={{ x: '-100%', skewX: -15 }}
            animate={{ x: '0%' }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-y-0 left-0 w-1/2"
            style={{
              background: player === 'player1'
                ? 'linear-gradient(135deg, hsl(var(--player1) / 0.3) 0%, hsl(var(--player1) / 0.1) 100%)'
                : 'linear-gradient(135deg, hsl(var(--player2) / 0.3) 0%, hsl(var(--player2) / 0.1) 100%)',
              clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)',
            }}
          />

          {/* Diagonal slash effect - Right side */}
          <motion.div
            initial={{ x: '100%', skewX: -15 }}
            animate={{ x: '0%' }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="absolute inset-y-0 right-0 w-1/2"
            style={{
              background: player === 'player1'
                ? 'linear-gradient(-135deg, hsl(var(--player1) / 0.3) 0%, hsl(var(--player1) / 0.1) 100%)'
                : 'linear-gradient(-135deg, hsl(var(--player2) / 0.3) 0%, hsl(var(--player2) / 0.1) 100%)',
              clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0 100%)',
            }}
          />

          {/* Center slash line */}
          <motion.div
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            exit={{ scaleY: 0, opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="absolute h-full w-1"
            style={{
              background: player === 'player1'
                ? 'linear-gradient(180deg, transparent, hsl(var(--player1)), transparent)'
                : 'linear-gradient(180deg, transparent, hsl(var(--player2)), transparent)',
              boxShadow: player === 'player1'
                ? '0 0 30px hsl(var(--player1)), 0 0 60px hsl(var(--player1) / 0.5)'
                : '0 0 30px hsl(var(--player2)), 0 0 60px hsl(var(--player2) / 0.5)',
            }}
          />

          {/* Rotating ring 1 (outer) */}
          <motion.div
            initial={{ rotate: 0, scale: 0, opacity: 0 }}
            animate={{ 
              rotate: 360, 
              scale: 1, 
              opacity: [0, 0.8, 0.8, 0]
            }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className="absolute w-80 h-80 rounded-full border-2 border-dashed"
            style={{
              borderColor: player === 'player1' ? 'hsl(var(--player1) / 0.5)' : 'hsl(var(--player2) / 0.5)',
            }}
          />

          {/* Rotating ring 2 (inner, counter-rotate) */}
          <motion.div
            initial={{ rotate: 0, scale: 0, opacity: 0 }}
            animate={{ 
              rotate: -360, 
              scale: 1, 
              opacity: [0, 1, 1, 0]
            }}
            transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.1 }}
            className="absolute w-56 h-56 rounded-full border-4"
            style={{
              borderColor: player === 'player1' ? 'hsl(var(--player1) / 0.7)' : 'hsl(var(--player2) / 0.7)',
              borderStyle: 'solid',
              borderTopColor: 'transparent',
              borderBottomColor: 'transparent',
            }}
          />

          {/* Radial burst */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 2, 3],
              opacity: [0, 0.6, 0]
            }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            className="absolute w-48 h-48 rounded-full"
            style={{
              background: player === 'player1'
                ? 'radial-gradient(circle, hsl(var(--player1)) 0%, transparent 70%)'
                : 'radial-gradient(circle, hsl(var(--player2)) 0%, transparent 70%)',
            }}
          />

          {/* Center content */}
          <motion.div
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ 
              type: 'spring', 
              stiffness: 300, 
              damping: 15,
              delay: 0.3
            }}
            className="flex flex-col items-center gap-6 z-10"
          >
            {/* Icon with massive glow */}
            <motion.div
              animate={{ 
                rotate: [0, -15, 15, -15, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 0.6, 
                delay: 0.5,
                repeat: 1
              }}
              className="relative"
            >
              {/* Glow layers */}
              <div 
                className="absolute inset-0 blur-2xl scale-150"
                style={{
                  background: player === 'player1'
                    ? 'hsl(var(--player1) / 0.6)'
                    : 'hsl(var(--player2) / 0.6)',
                }}
              />
              <div 
                className="absolute inset-0 blur-xl scale-125"
                style={{
                  background: player === 'player1'
                    ? 'hsl(var(--player1) / 0.4)'
                    : 'hsl(var(--player2) / 0.4)',
                }}
              />
              <Swords 
                className="w-20 h-20 relative z-10"
                style={{
                  color: player === 'player1' ? 'hsl(var(--player1))' : 'hsl(var(--player2))',
                  filter: player === 'player1'
                    ? 'drop-shadow(0 0 20px hsl(var(--player1))) drop-shadow(0 0 40px hsl(var(--player1)))'
                    : 'drop-shadow(0 0 20px hsl(var(--player2))) drop-shadow(0 0 40px hsl(var(--player2)))',
                }}
              />
            </motion.div>

            {/* Player label with epic glow */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <motion.span
                className="text-xs uppercase tracking-[0.4em] text-muted-foreground block mb-2"
              >
                Turno de
              </motion.span>
              <motion.h2
                className="text-5xl md:text-6xl font-display font-black tracking-tight"
                style={{
                  color: player === 'player1' ? 'hsl(var(--player1))' : 'hsl(var(--player2))',
                  textShadow: player === 'player1'
                    ? '0 0 20px hsl(var(--player1)), 0 0 40px hsl(var(--player1)), 0 0 60px hsl(var(--player1) / 0.5), 0 0 80px hsl(var(--player1) / 0.3)'
                    : '0 0 20px hsl(var(--player2)), 0 0 40px hsl(var(--player2)), 0 0 60px hsl(var(--player2) / 0.5), 0 0 80px hsl(var(--player2) / 0.3)',
                }}
                animate={{
                  textShadow: player === 'player1'
                    ? [
                        '0 0 20px hsl(var(--player1)), 0 0 40px hsl(var(--player1) / 0.5)',
                        '0 0 40px hsl(var(--player1)), 0 0 80px hsl(var(--player1)), 0 0 120px hsl(var(--player1) / 0.5)',
                        '0 0 20px hsl(var(--player1)), 0 0 40px hsl(var(--player1) / 0.5)',
                      ]
                    : [
                        '0 0 20px hsl(var(--player2)), 0 0 40px hsl(var(--player2) / 0.5)',
                        '0 0 40px hsl(var(--player2)), 0 0 80px hsl(var(--player2)), 0 0 120px hsl(var(--player2) / 0.5)',
                        '0 0 20px hsl(var(--player2)), 0 0 40px hsl(var(--player2) / 0.5)',
                      ],
                }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                {playerLabel}
              </motion.h2>
            </motion.div>

            {/* Decorative energy lines */}
            <div className="flex gap-3 mt-4">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 - i * 0.15 }}
                  transition={{ delay: 0.5 + i * 0.08, duration: 0.3 }}
                  className="h-1 rounded-full"
                  style={{
                    width: `${32 - i * 4}px`,
                    background: player === 'player1'
                      ? 'linear-gradient(90deg, hsl(var(--player1)), hsl(var(--player1) / 0.3))'
                      : 'linear-gradient(90deg, hsl(var(--player2)), hsl(var(--player2) / 0.3))',
                    boxShadow: player === 'player1'
                      ? '0 0 10px hsl(var(--player1) / 0.5)'
                      : '0 0 10px hsl(var(--player2) / 0.5)',
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* Particle explosion effect on exit */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
              animate={{
                scale: [0, 1, 0],
                x: Math.cos((i * 30 * Math.PI) / 180) * 200,
                y: Math.sin((i * 30 * Math.PI) / 180) * 200,
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 0.8,
                delay: 0.9,
                ease: 'easeOut',
              }}
              className="absolute w-3 h-3 rounded-full"
              style={{
                background: player === 'player1' ? 'hsl(var(--player1))' : 'hsl(var(--player2))',
                boxShadow: player === 'player1'
                  ? '0 0 15px hsl(var(--player1))'
                  : '0 0 15px hsl(var(--player2))',
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
