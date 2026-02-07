import { motion } from 'framer-motion';
import { Pause, Play, RotateCcw } from 'lucide-react';

interface TimerProps {
  remaining: number;
  isRunning: boolean;
  hasEnded: boolean;
  onToggle: () => void;
  onReset: () => void;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const Timer = ({ remaining, isRunning, hasEnded, onToggle, onReset }: TimerProps) => {
  const getTimerColor = () => {
    if (hasEnded) return 'text-timer-danger';
    if (remaining <= 60) return 'text-timer-danger';
    if (remaining <= 300) return 'text-timer-warning';
    return 'text-timer';
  };

  return (
    <motion.div 
      className="flex items-center gap-3 px-4 py-2 bg-card/80 backdrop-blur-sm rounded-full border border-border"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <motion.button
        className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
        onClick={onToggle}
        whileTap={{ scale: 0.9 }}
        aria-label={isRunning ? 'Pausar' : 'Continuar'}
      >
        {isRunning ? (
          <Pause className="w-4 h-4 text-foreground" />
        ) : (
          <Play className="w-4 h-4 text-foreground ml-0.5" />
        )}
      </motion.button>

      <motion.span 
        className={`timer-display ${getTimerColor()}`}
        animate={hasEnded ? { 
          opacity: [1, 0.5, 1],
        } : {}}
        transition={{
          duration: 1,
          repeat: hasEnded ? Infinity : 0,
        }}
      >
        {formatTime(remaining)}
      </motion.span>

      <motion.button
        className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
        onClick={onReset}
        whileTap={{ scale: 0.9 }}
        aria-label="Reiniciar temporizador"
      >
        <RotateCcw className="w-4 h-4 text-foreground" />
      </motion.button>
    </motion.div>
  );
};
