import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Check, Crown, ChevronDown, ChevronUp } from 'lucide-react';
import { useGameSounds } from '@/hooks/useSound';

interface JackpotDiceRollProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (duration: number, selectedEffects: string[], hasEffect8: boolean, hasEffect9: boolean) => void;
  player: 'player1' | 'player2';
  isRotated?: boolean;
  isSecondChance?: boolean; // If true, effects 8 and 9 are not available
}

// Jackpot effects - colors for visual distinction
const JACKPOT_EFFECTS = [
  { id: 'jackpot-1', name: '1. Tesoros Infinitos', description: 'Los Tesoros no se agotan al usarlos.', color: 'cyan' },
  { id: 'jackpot-2', name: '2. Costo Cero', description: 'Todas las cartas cuestan 0 Tesoros.', color: 'green' },
  { id: 'jackpot-3', name: '3. Acción', description: 'Cada Acción = Roba 1 carta.', color: 'blue' },
  { id: 'jackpot-4', name: '4. Anulación Automática', description: 'Primera carta/efecto rival se anula.', color: 'red' },
  { id: 'jackpot-5', name: '5. Resurrección Masiva', description: 'Monstruos del descarte con Frenesí y Agrupar.', color: 'purple' },
  { id: 'jackpot-6', name: '6. Asalto Total', description: 'Monstruos atacan al invocar + extra + Arrollar.', color: 'orange' },
  { id: 'jackpot-7', name: '7. Daño Descontrolado', description: 'Daño de combate x2 + Arrollar.', color: 'rose' },
  { id: 'jackpot-8', name: '8. Reescritura del Azar', description: '+1 efecto. Reduce severidad del castigo (no reactiva).', color: 'indigo' },
  { id: 'jackpot-9', name: '9. 100% de Chances', description: '+1 efecto. 100% suerte. Si también sacas el 8: Suerte Desbordada.', color: 'emerald' },
];

// Punishment definitions - Updated to reflect current behavior
const PUNISHMENTS = {
  complete: {
    title: 'CASTIGO COMPLETO',
    condition: '(Finaliza en TU turno sin anularse)',
    effects: [
      '💀 DERROTA AUTOMÁTICA',
      'Descarta tu mano, tu mazo y tu descarte',
      'No puedes activar habilidades ni efectos'
    ]
  },
  reduced: {
    title: 'CASTIGO REDUCIDO',
    condition: '(Finaliza en turno RIVAL sin anularse)',
    effects: [
      'Tu Vida se reduce a 5',
      'Descarta solo tu mano',
      '⚠️ ÚLTIMA OPORTUNIDAD: Puedes activar Jackpot una vez más',
      '❌ Efectos 8 y 9 NO disponibles en segunda oportunidad',
      '💀 Si al finalizar no ganas, pierdes automáticamente'
    ]
  }
};

const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

const getDiceIcon = (value: number) => {
  const Icon = diceIcons[Math.min(Math.max(value - 1, 0), 5)];
  return Icon;
};

const getEffectColor = (color: string) => {
  switch (color) {
    case 'cyan': return { bg: 'bg-cyan-500/20', text: 'text-cyan-400', glow: 'rgba(34, 211, 238, 0.6)' };
    case 'green': return { bg: 'bg-green-500/20', text: 'text-green-400', glow: 'rgba(34, 197, 94, 0.6)' };
    case 'blue': return { bg: 'bg-blue-500/20', text: 'text-blue-400', glow: 'rgba(59, 130, 246, 0.6)' };
    case 'red': return { bg: 'bg-red-500/20', text: 'text-red-400', glow: 'rgba(239, 68, 68, 0.6)' };
    case 'purple': return { bg: 'bg-purple-500/20', text: 'text-purple-400', glow: 'rgba(168, 85, 247, 0.6)' };
    case 'orange': return { bg: 'bg-orange-500/20', text: 'text-orange-400', glow: 'rgba(249, 115, 22, 0.6)' };
    case 'rose': return { bg: 'bg-rose-500/20', text: 'text-rose-400', glow: 'rgba(244, 63, 94, 0.6)' };
    case 'indigo': return { bg: 'bg-indigo-500/20', text: 'text-indigo-400', glow: 'rgba(99, 102, 241, 0.6)' };
    case 'emerald': return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', glow: 'rgba(16, 185, 129, 0.6)' };
    default: return { bg: 'bg-amber-500/20', text: 'text-amber-400', glow: 'rgba(251, 191, 36, 0.6)' };
  }
};

// Collapsible section component (matching SkillSelection style)
const CollapsibleSection = ({ 
  title, 
  icon, 
  children, 
  defaultOpen = false,
  colorClass = 'purple'
}: { 
  title: string; 
  icon: string;
  children: React.ReactNode; 
  defaultOpen?: boolean;
  colorClass?: 'purple' | 'red' | 'amber';
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  const colors = {
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
    red: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
  };
  const c = colors[colorClass];
  
  return (
    <div className={`rounded-lg ${c.bg} border ${c.border} overflow-hidden`}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className={`w-full flex items-center justify-between p-2 ${c.text} hover:bg-white/5 transition-colors`}
      >
        <span className="text-xs font-medium flex items-center gap-1.5">
          <span>{icon}</span>
          {title}
        </span>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-2 pt-0 space-y-1.5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

type RollPhase = 'idle' | 'rolling' | 'result';

export const JackpotDiceRoll = ({
  isOpen,
  onClose,
  onComplete,
  player,
  isRotated = false,
  isSecondChance = false,
}: JackpotDiceRollProps) => {
  const { playSound } = useGameSounds();
  const [phase, setPhase] = useState<RollPhase>('idle');
  const [diceValues, setDiceValues] = useState<number[]>([1, 1, 1, 1]); // 3 effect dice + 1 duration dice
  const [animatingDice, setAnimatingDice] = useState<number[]>([1, 1, 1, 1]);
  const [selectedEffects, setSelectedEffects] = useState<typeof JACKPOT_EFFECTS>([]);
  const [duration, setDuration] = useState(0);
  
  const hasCompletedRef = useRef(false);
  
  const playerBorderClass = player === 'player1' ? 'border-player1' : 'border-player2';
  const playerBgClass = player === 'player1' ? 'bg-player1' : 'bg-player2';

  // Select effects based on dice values (1-9 mapped from dice results)
  const selectEffectsFromDice = useCallback((dice: number[]) => {
    // Filter available effects - exclude 8 and 9 on second chance
    const availableEffects = isSecondChance 
      ? JACKPOT_EFFECTS.filter(e => e.id !== 'jackpot-8' && e.id !== 'jackpot-9')
      : JACKPOT_EFFECTS;
    
    // Use first 3 dice for effects
    const effectIndices: number[] = [];
    const usedIndices = new Set<number>();
    
    // Generate 3 unique random effect indices
    while (effectIndices.length < 3) {
      const randomIndex = Math.floor(Math.random() * availableEffects.length);
      if (!usedIndices.has(randomIndex)) {
        usedIndices.add(randomIndex);
        effectIndices.push(randomIndex);
      }
    }
    
    let selected = effectIndices.map(i => availableEffects[i]);
    
    // Check if any selected effect grants an additional effect (8 or 9) - only if not second chance
    if (!isSecondChance) {
      const has8 = selected.some(e => e.id === 'jackpot-8');
      const has9 = selected.some(e => e.id === 'jackpot-9');
      
      // Effect 8: Add one more effect (not 9)
      if (has8) {
        const remaining8 = JACKPOT_EFFECTS.filter(
          e => !selected.some(s => s.id === e.id) && e.id !== 'jackpot-9'
        );
        if (remaining8.length > 0) {
          const extraEffect = remaining8[Math.floor(Math.random() * remaining8.length)];
          selected = [...selected, extraEffect];
        }
      }
      
      // Effect 9: Add one more effect (not 8)
      if (has9) {
        const remaining9 = JACKPOT_EFFECTS.filter(
          e => !selected.some(s => s.id === e.id) && e.id !== 'jackpot-8'
        );
        if (remaining9.length > 0) {
          const extraEffect = remaining9[Math.floor(Math.random() * remaining9.length)];
          selected = [...selected, extraEffect];
        }
      }
    }
    
    return selected;
  }, [isSecondChance]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setPhase('idle');
      setDiceValues([1, 1, 1, 1]);
      setAnimatingDice([1, 1, 1, 1]);
      setSelectedEffects([]);
      setDuration(0);
      hasCompletedRef.current = false;
    }
  }, [isOpen]);

  // Rolling animation
  useEffect(() => {
    if (phase !== 'rolling') return;

    playSound('diceRoll');
    
    const interval = setInterval(() => {
      setAnimatingDice([
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
      ]);
    }, 100);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      
      // Generate final dice values
      const finalDice = [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
      ];
      
      setDiceValues(finalDice);
      setAnimatingDice(finalDice);
      
      // Calculate duration (1-4 from last dice: 1-2=1, 3=2, 4-5=3, 6=4)
      const durationDice = finalDice[3];
      let calculatedDuration = 1;
      if (durationDice <= 2) calculatedDuration = 1;
      else if (durationDice === 3) calculatedDuration = 2;
      else if (durationDice <= 5) calculatedDuration = 3;
      else calculatedDuration = 4;
      
      setDuration(calculatedDuration);
      
      // Select effects
      const effects = selectEffectsFromDice(finalDice);
      setSelectedEffects(effects);
      
      playSound('victory');
      setPhase('result');
    }, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [phase, playSound, selectEffectsFromDice]);

  const handleRoll = () => {
    setPhase('rolling');
  };

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
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-2"
        style={{ transform: isRotated ? 'rotate(180deg)' : 'none' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className={`relative w-full max-w-[92vw] sm:max-w-[85vw] md:max-w-[700px] bg-gradient-to-r from-purple-900/90 via-purple-950/95 to-purple-900/90 ${playerBorderClass} border-2 sm:border-4 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden`}
          style={{
            boxShadow: '0 0 40px 8px rgba(168, 85, 247, 0.3), inset 0 0 20px 3px rgba(168, 85, 247, 0.1)',
          }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: 'spring', damping: 15 }}
        >
          {/* Header - Compact */}
          <div className="relative py-1.5 sm:py-2 px-3 sm:px-4 bg-gradient-to-r from-purple-600 via-violet-500 to-purple-600 text-center overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <div className="relative">
              <h3 className="font-display font-black text-lg sm:text-xl text-white drop-shadow-lg">
                {isSecondChance ? '⚠️ ÚLTIMA OPORTUNIDAD' : 'JACKPOT'}
              </h3>
              <p className="text-[9px] sm:text-[10px] text-purple-200 font-bold">
                {isSecondChance ? 'Si no ganas esta vez, pierdes la partida' : 'Dominio del Azar Absoluto'}
              </p>
            </div>
          </div>

          {/* Second Chance Warning */}
          {isSecondChance && (
            <div className="px-3 py-2 bg-red-500/20 border-b border-red-500/50">
              <p className="text-xs text-red-400 text-center font-bold">
                ⚡ Los efectos 8 y 9 no están disponibles en segunda oportunidad
              </p>
            </div>
          )}

          {/* Horizontal Layout Content */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-b from-black/50 to-black/80">
            {/* Left Side - Dice */}
            <div className="flex flex-col items-center justify-center sm:w-1/3">
              {/* Dice Display - Horizontal row */}
              <div className="flex justify-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                {animatingDice.map((diceValue, index) => {
                  const DiceIcon = getDiceIcon(diceValue);
                  const isEffectDice = index < 3;
                  const isDurationDice = index === 3;
                  
                  return (
                    <motion.div
                      key={index}
                      className={`relative p-1.5 sm:p-2 rounded-lg border-2 ${
                        isDurationDice 
                          ? 'border-amber-500 bg-amber-950/50' 
                          : 'border-purple-500 bg-purple-950/50'
                      }`}
                      animate={phase === 'rolling' ? { 
                        rotate: [0, 15, -15, 0],
                        scale: [1, 1.1, 1],
                      } : {}}
                      transition={{ 
                        repeat: phase === 'rolling' ? Infinity : 0, 
                        duration: 0.2,
                        delay: index * 0.05,
                      }}
                    >
                      <DiceIcon className={`w-6 h-6 sm:w-8 sm:h-8 ${
                        isDurationDice ? 'text-amber-400' : 'text-purple-400'
                      }`} />
                      <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center text-[8px] sm:text-[10px] font-bold ${
                        isDurationDice 
                          ? 'bg-amber-500 text-black' 
                          : 'bg-purple-500 text-white'
                      }`}>
                        {isEffectDice ? index + 1 : 'T'}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              {/* Labels */}
              <div className="flex justify-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 text-[9px] sm:text-[10px]">
                <span className="px-1.5 sm:px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">Efectos (x3)</span>
                <span className="px-1.5 sm:px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">Duración</span>
              </div>

              {/* Roll Button / Rolling State */}
              {phase === 'idle' && (
                <motion.button
                  className={`w-full py-2.5 sm:py-3 ${playerBgClass} text-white rounded-xl font-display font-bold text-xs sm:text-sm uppercase tracking-wider`}
                  onClick={handleRoll}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Tirar Dados
                </motion.button>
              )}

              {phase === 'rolling' && (
                <motion.p
                  className="text-xs sm:text-sm text-purple-400 font-display font-bold text-center py-2.5 sm:py-3"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                >
                  Tirando dados...
                </motion.p>
              )}

              {/* Duration Result - Only in result phase */}
              {phase === 'result' && (
                <div className="text-center">
                  <motion.div
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-amber-500/30 via-yellow-500/30 to-amber-500/30 border-2 border-amber-400"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                  >
                    <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                    <span className="text-base sm:text-lg font-display font-black text-amber-400">
                      {duration} Turno{duration > 1 ? 's' : ''}
                    </span>
                  </motion.div>
                </div>
              )}
            </div>

            {/* Right Side - Info sections (idle phase) */}
            {phase === 'idle' && (
              <div className="flex-1 flex flex-col gap-2 sm:gap-3">
                {/* Collapsible Effects */}
                <CollapsibleSection 
                  title={`${JACKPOT_EFFECTS.length} Efectos Posibles`} 
                  icon="🎲"
                  colorClass="purple"
                >
                  {JACKPOT_EFFECTS.map((effect) => {
                    const effectColor = getEffectColor(effect.color);
                    return (
                      <div
                        key={effect.id}
                        className={`p-1.5 sm:p-2 rounded-lg ${effectColor.bg} border ${effectColor.text.replace('text', 'border')}/40`}
                      >
                        <p className={`font-bold text-[10px] sm:text-xs ${effectColor.text}`}>{effect.name}</p>
                        <p className="text-[9px] sm:text-[10px] text-white/70">{effect.description}</p>
                      </div>
                    );
                  })}
                </CollapsibleSection>

                {/* Collapsible Punishments */}
                <CollapsibleSection 
                  title="Efectos del Dominio" 
                  icon="⚠️"
                  colorClass="red"
                >
                  {/* Complete Punishment */}
                  <div className="p-2 rounded-lg bg-red-950/50 border border-red-500/30">
                    <p className="font-bold text-xs text-red-400">{PUNISHMENTS.complete.title}</p>
                    <p className="text-[9px] text-red-300/60 mb-1">{PUNISHMENTS.complete.condition}</p>
                    <ul className="space-y-0.5">
                      {PUNISHMENTS.complete.effects.map((effect, i) => (
                        <li key={i} className="text-[9px] sm:text-[10px] text-white/70 flex items-start gap-1">
                          <span className="text-red-400">•</span>
                          {effect}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Reduced Punishment */}
                  <div className="p-2 rounded-lg bg-amber-950/50 border border-amber-500/30">
                    <p className="font-bold text-xs text-amber-400">{PUNISHMENTS.reduced.title}</p>
                    <p className="text-[9px] text-amber-300/60 mb-1">{PUNISHMENTS.reduced.condition}</p>
                    <ul className="space-y-0.5">
                      {PUNISHMENTS.reduced.effects.map((effect, i) => (
                        <li key={i} className="text-[9px] sm:text-[10px] text-white/70 flex items-start gap-1">
                          <span className="text-amber-400">•</span>
                          {effect}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CollapsibleSection>
              </div>
            )}

            {/* Right Side - Results */}
            {phase === 'result' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 flex flex-col gap-2 sm:gap-3"
              >
                {/* Special Effects indicators */}
                {(selectedEffects.some(e => e.id === 'jackpot-8') || selectedEffects.some(e => e.id === 'jackpot-9')) && (
                  <div className="flex justify-center gap-1.5 sm:gap-2 flex-wrap">
                    {selectedEffects.some(e => e.id === 'jackpot-8') && (
                      <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400 text-[9px] sm:text-[10px] text-indigo-300 font-bold">
                        Severidad Reducida
                      </span>
                    )}
                    {selectedEffects.some(e => e.id === 'jackpot-9') && (
                      <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-400 text-[9px] sm:text-[10px] text-emerald-300 font-bold">
                        100% Suerte
                      </span>
                    )}
                    {selectedEffects.some(e => e.id === 'jackpot-8') && selectedEffects.some(e => e.id === 'jackpot-9') && (
                      <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/30 to-emerald-500/30 border border-yellow-400 text-[9px] sm:text-[10px] text-yellow-300 font-bold">
                        Suerte Desbordante
                      </span>
                    )}
                  </div>
                )}

                {/* Selected Effects List */}
                <div className="flex-1">
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-purple-400/70 text-center mb-1.5 sm:mb-2">
                    Efectos Activos
                  </p>
                  <div className="space-y-1 sm:space-y-1.5 pr-1">
                    {selectedEffects.map((effect, i) => {
                      const effectColor = getEffectColor(effect.color);
                      return (
                        <motion.div
                          key={effect.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + i * 0.1 }}
                          className={`p-1.5 sm:p-2 rounded-lg ${effectColor.bg} border ${effectColor.text.replace('text', 'border')}/40`}
                          style={{ boxShadow: `0 0 6px 0 ${effectColor.glow}` }}
                        >
                          <p className={`font-bold text-[10px] sm:text-xs ${effectColor.text}`}>{effect.name}</p>
                          <p className="text-[9px] sm:text-[10px] text-white/70">{effect.description}</p>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Confirm Button */}
                <motion.button
                  className={`w-full py-2.5 sm:py-3 ${playerBgClass} text-white rounded-xl font-display font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2`}
                  onClick={handleConfirm}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Activar Dominio
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};
