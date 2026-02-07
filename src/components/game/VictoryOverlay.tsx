import { motion } from 'framer-motion';
import { Trophy, Sparkles, Crown, Star } from 'lucide-react';
import type { Player } from '@/hooks/useGameState';

interface VictoryOverlayProps {
  winner: Player;
  onNewGame: () => void;
  onExit: () => void;
}

export const VictoryOverlay = ({ winner, onNewGame, onExit }: VictoryOverlayProps) => {
  const winnerLabel = winner === 'player1' ? 'Jugador 1' : 'Jugador 2';
  const winnerColor = winner === 'player1' ? 'text-player1' : 'text-player2';
  const winnerBg = winner === 'player1' ? 'bg-player1' : 'bg-player2';
  const winnerBorderClass = winner === 'player1' ? 'border-player1' : 'border-player2';

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-lg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Particle effects */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute ${winnerColor}`}
          initial={{
            opacity: 0,
            scale: 0,
            x: 0,
            y: 0,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0.5],
            x: Math.cos(i * 18 * Math.PI / 180) * (150 + Math.random() * 100),
            y: Math.sin(i * 18 * Math.PI / 180) * (150 + Math.random() * 100),
          }}
          transition={{
            duration: 2,
            delay: i * 0.05,
            repeat: Infinity,
            repeatDelay: 1,
          }}
        >
          {i % 3 === 0 ? (
            <Star className="w-4 h-4 fill-current" />
          ) : i % 3 === 1 ? (
            <Sparkles className="w-5 h-5" />
          ) : (
            <div className={`w-2 h-2 rounded-full ${winnerBg}`} />
          )}
        </motion.div>
      ))}

      {/* Main content */}
      <motion.div
        className="flex flex-col items-center gap-6 z-10"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 12, delay: 0.2 }}
      >
        {/* Crown animation */}
        <motion.div
          className={`relative ${winnerColor}`}
          initial={{ y: -50, opacity: 0, rotate: -20 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 10, delay: 0.4 }}
        >
          <Crown className="w-20 h-20" />
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Crown className="w-20 h-20 blur-sm" />
          </motion.div>
        </motion.div>

        {/* Trophy */}
        <motion.div
          className={`p-6 rounded-full ${winnerBg}/20 border-4 ${winnerBorderClass}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 8, delay: 0.6 }}
        >
          <Trophy className={`w-16 h-16 ${winnerColor}`} />
        </motion.div>

        {/* Victory text */}
        <motion.div
          className="text-center"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <motion.h1
            className={`text-4xl md:text-5xl font-display font-black ${winnerColor}`}
            animate={{
              textShadow: [
                '0 0 20px rgba(255,255,255,0.3)',
                '0 0 40px rgba(255,255,255,0.5)',
                '0 0 20px rgba(255,255,255,0.3)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ¡VICTORIA!
          </motion.h1>
          <p className="text-xl font-display font-bold text-foreground/80 mt-2">
            {winnerLabel} ha ganado
          </p>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          className="flex gap-4 mt-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <motion.button
            className={`px-6 py-3 ${winnerBg} text-white rounded-xl font-display font-bold uppercase tracking-wider shadow-lg`}
            onClick={onNewGame}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Nueva Partida
          </motion.button>
          <motion.button
            className="px-6 py-3 bg-muted text-foreground rounded-xl font-display font-bold uppercase tracking-wider"
            onClick={onExit}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Salir
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
