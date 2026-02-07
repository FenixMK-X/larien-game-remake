import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, Crown, PartyPopper } from 'lucide-react';
import { useGameSounds } from '@/hooks/useSound';

interface JackpotSlotMachineProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (duration: number, selectedEffects: string[], hasEffect8: boolean, hasEffect9: boolean) => void;
  player: 'player1' | 'player2';
  isRotated?: boolean;
}

// Jackpot effects with symbols
const JACKPOT_EFFECTS = [
  { id: 'jackpot-1', name: '1. Tesoros Infinitos', description: 'Los Tesoros no se agotan al usarlos.', symbol: '💎' },
  { id: 'jackpot-2', name: '2. Costo Cero', description: 'Todas las cartas cuestan 0 Tesoros.', symbol: '🆓' },
  { id: 'jackpot-3', name: '3. Acción', description: 'Cada Acción = Roba 1 carta.', symbol: '🎴' },
  { id: 'jackpot-4', name: '4. Anulación Automática', description: 'Primera carta/efecto rival se anula.', symbol: '🚫' },
  { id: 'jackpot-5', name: '5. Resurrección Masiva', description: 'Monstruos del descarte con Frenesí y Agrupar.', symbol: '💀' },
  { id: 'jackpot-6', name: '6. Asalto Total', description: 'Monstruos atacan al invocar + extra + Arrollar.', symbol: '⚔️' },
  { id: 'jackpot-7', name: '7. Daño Descontrolado', description: 'Daño de combate x2 + Arrollar.', symbol: '💥' },
  { id: 'jackpot-8', name: '8. Reescritura del Azar', description: '+1 efecto. Reduce severidad del castigo.', symbol: '🔄' },
  { id: 'jackpot-9', name: '9. 100% de Chances', description: '+1 efecto. 100% probabilidad pasiva suerte.', symbol: '🍀' },
];

const getSymbolColor = (symbol: string) => {
  switch (symbol) {
    case '💎': return { bg: 'bg-cyan-500/20', text: 'text-cyan-400', glow: 'rgba(34, 211, 238, 0.6)' };
    case '🆓': return { bg: 'bg-green-500/20', text: 'text-green-400', glow: 'rgba(34, 197, 94, 0.6)' };
    case '🎴': return { bg: 'bg-blue-500/20', text: 'text-blue-400', glow: 'rgba(59, 130, 246, 0.6)' };
    case '🚫': return { bg: 'bg-red-500/20', text: 'text-red-400', glow: 'rgba(239, 68, 68, 0.6)' };
    case '💀': return { bg: 'bg-purple-500/20', text: 'text-purple-400', glow: 'rgba(168, 85, 247, 0.6)' };
    case '⚔️': return { bg: 'bg-orange-500/20', text: 'text-orange-400', glow: 'rgba(249, 115, 22, 0.6)' };
    case '💥': return { bg: 'bg-rose-500/20', text: 'text-rose-400', glow: 'rgba(244, 63, 94, 0.6)' };
    case '🔄': return { bg: 'bg-indigo-500/20', text: 'text-indigo-400', glow: 'rgba(99, 102, 241, 0.6)' };
    case '🍀': return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', glow: 'rgba(16, 185, 129, 0.6)' };
    default: return { bg: 'bg-amber-500/20', text: 'text-amber-400', glow: 'rgba(251, 191, 36, 0.6)' };
  }
};

// Duration is now random 1-4 turns
const getRandomDuration = (): number => {
  return Math.floor(Math.random() * 4) + 1; // Random 1-4
};

// Confetti particle component
const Confetti = ({ count = 50 }: { count?: number }) => {
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[10000]">
      {[...Array(count)].map((_, i) => {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const left = Math.random() * 100;
        const animDuration = 2 + Math.random() * 2;
        const delay = Math.random() * 0.5;
        const size = 8 + Math.random() * 8;
        
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${left}%`,
              top: '-20px',
              width: size,
              height: size,
              backgroundColor: color,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            }}
            initial={{ y: -20, opacity: 1, rotate: 0 }}
            animate={{
              y: window.innerHeight + 50,
              opacity: [1, 1, 0],
              rotate: Math.random() * 720 - 360,
              x: (Math.random() - 0.5) * 200,
            }}
            transition={{
              duration: animDuration,
              delay: delay,
              ease: 'easeOut',
            }}
          />
        );
      })}
    </div>
  );
};

export const JackpotSlotMachine = ({
  isOpen,
  onClose,
  onComplete,
  player,
  isRotated = false,
}: JackpotSlotMachineProps) => {
  const { playSound } = useGameSounds();
  const [phase, setPhase] = useState<'spinning' | 'result'>('spinning');
  const [reelPositions, setReelPositions] = useState([0, 0, 0]);
  const [selectedEffects, setSelectedEffects] = useState<typeof JACKPOT_EFFECTS>([]);
  const [duration, setDuration] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Prevent double execution
  const hasCompletedRef = useRef(false);
  
  const playerBorderClass = player === 'player1' ? 'border-player1' : 'border-player2';

  const selectRandomEffects = useCallback(() => {
    // Shuffle and select 3 unique effects
    const shuffled = [...JACKPOT_EFFECTS].sort(() => Math.random() - 0.5);
    let selected = shuffled.slice(0, 3);
    
    // Check if any selected effect grants an additional effect (8 or 9)
    const has8 = selected.some(e => e.id === 'jackpot-8');
    const has9 = selected.some(e => e.id === 'jackpot-9');
    
    // Effect 8: Add one more effect (not 9)
    if (has8) {
      const remaining8 = shuffled.filter(
        e => !selected.some(s => s.id === e.id) && e.id !== 'jackpot-9'
      );
      if (remaining8.length > 0) {
        const extraEffect = remaining8[Math.floor(Math.random() * remaining8.length)];
        selected = [...selected, extraEffect];
      }
    }
    
    // Effect 9: Add one more effect (not 8)
    if (has9) {
      const remaining9 = shuffled.filter(
        e => !selected.some(s => s.id === e.id) && e.id !== 'jackpot-8'
      );
      if (remaining9.length > 0) {
        const extraEffect = remaining9[Math.floor(Math.random() * remaining9.length)];
        selected = [...selected, extraEffect];
      }
    }
    
    return selected;
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setPhase('spinning');
      setReelPositions([0, 0, 0]);
      setSelectedEffects([]);
      setDuration(0);
      setShowConfetti(false);
      hasCompletedRef.current = false;
      return;
    }

    // Start spinning animation
    playSound('diceRoll');
    
    // Animate reels spinning
    const spinInterval = setInterval(() => {
      setReelPositions(prev => prev.map(() => Math.floor(Math.random() * JACKPOT_EFFECTS.length)));
    }, 80);

    // Stop reels one by one
    const stopTimes = [1200, 1800, 2400];
    const finalEffects = selectRandomEffects();
    
    stopTimes.forEach((time, index) => {
      setTimeout(() => {
        playSound('click');
        setReelPositions(prev => {
          const newPos = [...prev];
          newPos[index] = JACKPOT_EFFECTS.findIndex(e => e.id === finalEffects[index]?.id) || 0;
          return newPos;
        });
      }, time);
    });

    // Final result - only execute once
    const finalTimeout = setTimeout(() => {
      clearInterval(spinInterval);
      
      if (hasCompletedRef.current) return;
      
      setSelectedEffects(finalEffects);
      
      // Calculate random duration 1-4 turns
      const calculatedDuration = getRandomDuration();
      setDuration(calculatedDuration);
      
      playSound('victory');
      setShowConfetti(true);
      setPhase('result');
      
      // Hide confetti after animation
      setTimeout(() => setShowConfetti(false), 4000);
    }, 2800);

    return () => {
      clearInterval(spinInterval);
      clearTimeout(finalTimeout);
    };
  }, [isOpen, playSound, selectRandomEffects]);

  const handleConfirm = () => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    
    const hasEffect8 = selectedEffects.some(e => e.id === 'jackpot-8');
    const hasEffect9 = selectedEffects.some(e => e.id === 'jackpot-9');
    
    onComplete(duration, selectedEffects.map(e => e.id), hasEffect8, hasEffect9);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence mode="wait">
      {showConfetti && <Confetti count={80} />}
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
        style={{ transform: isRotated ? 'rotate(180deg)' : 'none' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className={`relative w-[380px] max-w-[95vw] bg-gradient-to-b from-amber-900/90 via-amber-950/95 to-black ${playerBorderClass} border-4 rounded-3xl shadow-2xl overflow-hidden`}
          style={{
            boxShadow: '0 0 60px 10px rgba(251, 191, 36, 0.3), inset 0 0 30px 5px rgba(251, 191, 36, 0.1)',
          }}
          initial={{ scale: 0.5, opacity: 0, rotateY: -180 }}
          animate={{ scale: 1, opacity: 1, rotateY: 0 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: 'spring', damping: 15 }}
        >
          {/* Header - Slot Machine Top */}
          <div className="relative p-4 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-center overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <div className="relative flex items-center justify-center gap-3">
              <motion.span 
                className="text-4xl"
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                🎰
              </motion.span>
              <h3 className="font-display font-black text-2xl text-black drop-shadow-lg">
                JACKPOT
              </h3>
              <motion.span 
                className="text-4xl"
                animate={{ 
                  rotate: [0, -10, 10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
              >
                🎰
              </motion.span>
            </div>
            <p className="text-xs text-amber-900 font-bold mt-1">Dominio del Azar Absoluto</p>
          </div>

          {/* Slot Machine Reels */}
          <div className="p-6 bg-gradient-to-b from-black/50 to-black/80">
            <div className="flex justify-center gap-3 mb-6">
              {reelPositions.map((pos, reelIndex) => {
                const effect = phase === 'result' && selectedEffects[reelIndex] 
                  ? selectedEffects[reelIndex] 
                  : JACKPOT_EFFECTS[pos];
                const symbolColor = getSymbolColor(effect?.symbol || '');
                
                return (
                  <motion.div
                    key={reelIndex}
                    className={`w-20 h-24 rounded-xl border-4 border-amber-600 bg-black flex items-center justify-center overflow-hidden relative`}
                    style={{
                      boxShadow: phase === 'result' 
                        ? `0 0 20px 5px ${symbolColor.glow}`
                        : 'inset 0 0 20px rgba(0,0,0,0.5)',
                    }}
                    animate={phase === 'spinning' ? {
                      scale: [1, 1.05, 1],
                    } : {
                      scale: [1, 1.1, 1],
                    }}
                    transition={{ 
                      duration: phase === 'spinning' ? 0.15 : 0.5,
                      repeat: phase === 'spinning' ? Infinity : 0,
                    }}
                  >
                    {/* Reel content */}
                    <motion.div
                      className="flex flex-col items-center justify-center"
                      animate={phase === 'spinning' ? { y: [0, -20, 0] } : { y: 0 }}
                      transition={{ duration: 0.1, repeat: phase === 'spinning' ? Infinity : 0 }}
                    >
                      <span className="text-4xl mb-1">
                        {effect?.symbol || '🎰'}
                      </span>
                    </motion.div>
                    
                    {/* Shine effect */}
                    {phase === 'result' && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Result Display */}
            {phase === 'result' && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-4"
              >
                {/* Duration Result */}
                <div className="text-center">
                  <motion.div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/30 via-yellow-500/30 to-amber-500/30 border-2 border-amber-400"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.4 }}
                  >
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      <Crown className="w-5 h-5 text-amber-400" />
                    </motion.div>
                    <span className="text-xl font-display font-black text-amber-400">
                      {duration} Turno{duration > 1 ? 's' : ''}
                    </span>
                    <span className="text-sm text-amber-300">
                      (Aleatorio)
                    </span>
                  </motion.div>
                </div>

                {/* Special Effects indicators */}
                {(selectedEffects.some(e => e.id === 'jackpot-8') || selectedEffects.some(e => e.id === 'jackpot-9')) && (
                  <div className="flex justify-center gap-2 flex-wrap">
                    {selectedEffects.some(e => e.id === 'jackpot-8') && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="px-2 py-1 rounded-full bg-indigo-500/30 border border-indigo-400 text-xs text-indigo-300 font-bold"
                      >
                        🔄 Severidad Reducida
                      </motion.div>
                    )}
                    {selectedEffects.some(e => e.id === 'jackpot-9') && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="px-2 py-1 rounded-full bg-emerald-500/30 border border-emerald-400 text-xs text-emerald-300 font-bold"
                      >
                        🍀 100% Suerte
                      </motion.div>
                    )}
                    {selectedEffects.some(e => e.id === 'jackpot-8') && selectedEffects.some(e => e.id === 'jackpot-9') && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="px-2 py-1 rounded-full bg-gradient-to-r from-indigo-500/30 to-emerald-500/30 border border-yellow-400 text-xs text-yellow-300 font-bold"
                      >
                        ✨ Suerte Desbordante
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Selected Effects List */}
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-widest text-amber-400/70 text-center">
                    Efectos Activos
                  </p>
                  {selectedEffects.map((effect, i) => {
                    const symbolColor = getSymbolColor(effect.symbol);
                    return (
                      <motion.div
                        key={effect.id}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.15 }}
                        className={`p-2.5 rounded-xl ${symbolColor.bg} border ${symbolColor.text.replace('text', 'border')}/40 flex items-center gap-3`}
                        style={{ boxShadow: `0 0 10px 0 ${symbolColor.glow}` }}
                      >
                        <span className="text-lg">{effect.symbol}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-sm ${symbolColor.text}`}>{effect.name}</p>
                          <p className="text-xs text-white/70 truncate">{effect.description}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>

          {/* Action Button */}
          {phase === 'result' && (
            <div className="p-4 border-t-2 border-amber-600/50 bg-black/50">
              <motion.button
                className={`w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black font-display font-black uppercase tracking-wider flex items-center justify-center gap-3 shadow-lg`}
                onClick={handleConfirm}
                whileHover={{ scale: 1.02, boxShadow: '0 0 30px 10px rgba(251, 191, 36, 0.4)' }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <PartyPopper className="w-6 h-6" />
                ¡Activar Jackpot!
                <PartyPopper className="w-6 h-6" />
              </motion.button>
            </div>
          )}

          {/* Spinning indicator */}
          {phase === 'spinning' && (
            <div className="p-4 border-t-2 border-amber-600/50 bg-black/50">
              <motion.div
                className="flex items-center justify-center gap-3 py-3"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span className="font-display font-bold text-amber-400">Girando...</span>
                <Sparkles className="w-5 h-5 text-amber-400" />
              </motion.div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};
