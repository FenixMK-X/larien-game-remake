import { motion, AnimatePresence } from 'framer-motion';
import { SkipForward, Swords, Hand, Sparkles } from 'lucide-react';

export type Phase = 'robo' | 'juego' | 'ataque';
export type Player = 'player1' | 'player2';

interface PhaseWheelProps {
  currentPhase: Phase;
  currentPlayer: Player;
  onAdvancePhase: () => void;
  onPass: () => void;
  onEndTurn: () => void;
}

const phases: { id: Phase; label: string; icon: React.ReactNode }[] = [
  { id: 'robo', label: 'Robo', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'juego', label: 'Juego', icon: <Hand className="w-4 h-4" /> },
  { id: 'ataque', label: 'Ataque', icon: <Swords className="w-4 h-4" /> },
];

const phaseColors: Record<Phase, string> = {
  robo: 'from-phase-robo to-phase-robo/70',
  juego: 'from-phase-juego to-phase-juego/70',
  ataque: 'from-phase-ataque to-phase-ataque/70',
};

const phaseGlows: Record<Phase, string> = {
  robo: '0 0 30px hsl(280 70% 55% / 0.5)',
  juego: '0 0 30px hsl(150 70% 45% / 0.5)',
  ataque: '0 0 30px hsl(0 75% 55% / 0.5)',
};

export const PhaseWheel = ({
  currentPhase,
  currentPlayer,
  onAdvancePhase,
  onPass,
  onEndTurn,
}: PhaseWheelProps) => {
  const currentIndex = phases.findIndex((p) => p.id === currentPhase);
  const isAttackPhase = currentPhase === 'ataque';
  const isJuegoPhase = currentPhase === 'juego';
  const playerColor = currentPlayer === 'player1' ? 'text-player1' : 'text-player2';
  const playerLabel = currentPlayer === 'player1' ? 'J1' : 'J2';
  const playerBg = currentPlayer === 'player1' ? 'bg-player1' : 'bg-player2';

  // Rotation for the wheel based on current phase
  const rotation = -currentIndex * 120;

  return (
    <div className="flex items-center gap-4">
      {/* Player Turn Indicator */}
      <motion.div
        key={currentPlayer}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`flex flex-col items-center`}
      >
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Turno</span>
        <motion.div
          className={`w-10 h-10 rounded-full ${playerBg} flex items-center justify-center font-display font-bold text-sm text-primary-foreground`}
          animate={{ 
            boxShadow: currentPlayer === 'player1' 
              ? ['0 0 10px hsl(40 90% 50% / 0.3)', '0 0 25px hsl(40 90% 50% / 0.6)', '0 0 10px hsl(40 90% 50% / 0.3)']
              : ['0 0 10px hsl(210 80% 55% / 0.3)', '0 0 25px hsl(210 80% 55% / 0.6)', '0 0 10px hsl(210 80% 55% / 0.3)']
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {playerLabel}
        </motion.div>
      </motion.div>

      {/* Phase Wheel */}
      <div className="relative w-24 h-24">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-2 border-border bg-card/50 backdrop-blur-sm" />
        
        {/* Rotating phases container */}
        <motion.div
          className="absolute inset-2"
          animate={{ rotate: rotation }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        >
          {phases.map((phase, index) => {
            const angle = index * 120 - 90; // Start from top
            const radius = 28;
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;
            const isActive = phase.id === currentPhase;

            return (
              <motion.div
                key={phase.id}
                className="absolute left-1/2 top-1/2"
                style={{
                  x: x - 12,
                  y: y - 12,
                }}
                animate={{
                  rotate: -rotation, // Counter-rotate to keep icons upright
                  scale: isActive ? 1.1 : 0.85,
                  opacity: isActive ? 1 : 0.4,
                }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isActive ? `bg-gradient-to-br ${phaseColors[phase.id]} text-white` : 'bg-muted text-muted-foreground'
                  }`}
                  style={{
                    boxShadow: isActive ? phaseGlows[phase.id] : 'none',
                  }}
                >
                  {phase.icon}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Center - Current Phase Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPhase}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-center"
            >
              <span className={`text-xs font-display font-bold uppercase tracking-wider ${
                currentPhase === 'robo' ? 'text-phase-robo' :
                currentPhase === 'juego' ? 'text-phase-juego' : 'text-phase-ataque'
              }`}>
                {phases[currentIndex].label}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2">
        {/* Next Phase / End Turn */}
        <motion.button
          onClick={isAttackPhase ? onEndTurn : onAdvancePhase}
          className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${
            isAttackPhase
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-muted text-foreground hover:bg-muted/80'
          }`}
          whileTap={{ scale: 0.95 }}
        >
          {isAttackPhase ? (
            <>
              <SkipForward className="w-4 h-4" />
              Fin Turno
            </>
          ) : (
            <>
              Siguiente
            </>
          )}
        </motion.button>

        {/* Pass Button (only in Juego phase - skip attack) */}
        <AnimatePresence>
          {isJuegoPhase && (
            <motion.button
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onClick={onPass}
              className="px-4 py-2 rounded-lg font-medium text-sm bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors border border-border"
              whileTap={{ scale: 0.95 }}
            >
              Pasar
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
