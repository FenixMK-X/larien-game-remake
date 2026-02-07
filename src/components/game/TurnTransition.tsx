import { motion, AnimatePresence } from 'framer-motion';
import { Swords } from 'lucide-react';

interface TurnTransitionProps {
  show: boolean;
  player: 'player1' | 'player2';
  onComplete: () => void;
}

export const TurnTransition = ({ show, player, onComplete }: TurnTransitionProps) => {
  const playerLabel = player === 'player1' ? 'Jugador 1' : 'Jugador 2';
  const playerColor = player === 'player1' ? 'from-player1' : 'from-player2';
  const playerGlow = player === 'player1' 
    ? 'drop-shadow-[0_0_30px_hsl(40,90%,50%)]' 
    : 'drop-shadow-[0_0_30px_hsl(210,80%,55%)]';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onAnimationComplete={() => {
            setTimeout(onComplete, 800);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md"
        >
          {/* Radial burst effect */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 1.5, 2],
              opacity: [0, 0.5, 0]
            }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`absolute w-64 h-64 rounded-full bg-gradient-radial ${playerColor} to-transparent`}
          />

          {/* Rotating ring */}
          <motion.div
            initial={{ rotate: 0, scale: 0.5, opacity: 0 }}
            animate={{ 
              rotate: 360, 
              scale: 1, 
              opacity: [0, 1, 1, 0]
            }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            className={`absolute w-48 h-48 rounded-full border-4 border-dashed ${
              player === 'player1' ? 'border-player1' : 'border-player2'
            }`}
          />

          {/* Center content */}
          <motion.div
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ 
              type: 'spring', 
              stiffness: 300, 
              damping: 15,
              delay: 0.1
            }}
            className="flex flex-col items-center gap-4 z-10"
          >
            {/* Icon with glow */}
            <motion.div
              animate={{ 
                rotate: [0, -10, 10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 0.5, 
                delay: 0.3,
                repeat: 1
              }}
              className={playerGlow}
            >
              <Swords className={`w-16 h-16 ${
                player === 'player1' ? 'text-player1' : 'text-player2'
              }`} />
            </motion.div>

            {/* Player label */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <motion.span
                className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-1"
              >
                Turno de
              </motion.span>
              <motion.h2
                className={`text-3xl font-display font-bold ${
                  player === 'player1' ? 'text-player1' : 'text-player2'
                }`}
                animate={{
                  textShadow: player === 'player1'
                    ? ['0 0 10px hsl(40 90% 50% / 0.3)', '0 0 30px hsl(40 90% 50% / 0.8)', '0 0 10px hsl(40 90% 50% / 0.3)']
                    : ['0 0 10px hsl(210 80% 55% / 0.3)', '0 0 30px hsl(210 80% 55% / 0.8)', '0 0 10px hsl(210 80% 55% / 0.3)']
                }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                {playerLabel}
              </motion.h2>
            </motion.div>

            {/* Decorative lines */}
            <div className="flex gap-2 mt-2">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.3 }}
                  className={`h-1 w-8 rounded-full ${
                    player === 'player1' ? 'bg-player1' : 'bg-player2'
                  }`}
                  style={{ opacity: 1 - i * 0.2 }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
