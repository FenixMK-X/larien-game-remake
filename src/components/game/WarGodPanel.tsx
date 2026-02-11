import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Swords, Heart, Flame, X, ChevronDown } from 'lucide-react';
import type { DecreeType, WarGodState } from '@/hooks/useWarGod';

interface WarGodPanelProps {
  state: WarGodState;
  player: 'player1' | 'player2';
  isCurrentTurn: boolean;
  isRotated?: boolean;
  availableDecrees: DecreeType[];
  onUseDecree: (decree: DecreeType) => void;
  damageReduction: number;
  minDamage: number;
  bonusDamage: number;
  playerTurnCount: number;
}

const DECREE_INFO: Record<string, { name: string; icon: React.ElementType; description: string; color: string }> = {
  blood: { name: 'Decreto de Sangre', icon: Swords, description: 'Inflige daño directo igual a tus Puntos de Guerra.', color: 'red' },
  domination: { name: 'Decreto de Dominio', icon: Heart, description: 'Recupera vida igual a tus Puntos de Guerra.', color: 'green' },
  extermination: { name: 'Decreto de Exterminio', icon: Flame, description: 'Todo daño que inflijas este turno se duplica.', color: 'orange' },
};

export const WarGodPanel = React.memo(({
  state,
  player,
  isCurrentTurn,
  isRotated = false,
  availableDecrees,
  onUseDecree,
  damageReduction,
  minDamage,
  bonusDamage,
  playerTurnCount,
}: WarGodPanelProps) => {
  const [showDecreeModal, setShowDecreeModal] = useState(false);

  if (!state.isActive) return null;

  const scalingPhase = playerTurnCount >= 7 ? 3 : playerTurnCount >= 4 ? 2 : 1;

  return (
    <>
      {/* War Points Indicator - Compact badge */}
      <motion.div
        className="flex items-center gap-1.5"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
      >
        {/* War Points Badge */}
        <motion.button
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-red-900/60 to-red-800/40 border border-red-500/50 backdrop-blur-sm"
          onClick={() => isCurrentTurn && setShowDecreeModal(true)}
          whileTap={isCurrentTurn ? { scale: 0.95 } : {}}
          animate={{
            boxShadow: isCurrentTurn && !state.decreeUsedThisTurn
              ? ['0 0 8px rgba(239,68,68,0.3)', '0 0 16px rgba(239,68,68,0.5)', '0 0 8px rgba(239,68,68,0.3)']
              : '0 0 4px rgba(239,68,68,0.2)',
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Shield className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs font-black text-red-300">{state.warPoints}</span>
          <span className="text-[9px] text-red-400/70 font-medium">PG</span>
          {isCurrentTurn && !state.decreeUsedThisTurn && availableDecrees.length > 0 && (
            <ChevronDown className="w-3 h-3 text-red-400/70" />
          )}
        </motion.button>

        {/* Extermination active indicator */}
        <AnimatePresence>
          {state.exterminationActive && (
            <motion.div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/40"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
            >
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                🔥
              </motion.span>
              <span className="text-[9px] font-bold text-orange-400">x2</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scaling indicator */}
        {scalingPhase >= 2 && (
          <div className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold ${
            scalingPhase === 3 
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
          }`}>
            {scalingPhase === 3 ? '⚡T7+' : '⬆T4+'}
          </div>
        )}
      </motion.div>

      {/* Decree Modal */}
      {showDecreeModal && createPortal(
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          style={{ transform: isRotated ? 'rotate(180deg)' : 'none' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowDecreeModal(false)}
        >
          <motion.div
            className="bg-card/95 backdrop-blur-xl border-2 border-red-500/40 rounded-2xl shadow-2xl p-5 w-[320px] max-w-[90vw]"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-red-500/20">
                  <Shield className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-display font-black text-sm text-red-300">Decreto de Aniquilación</h3>
                  <p className="text-[10px] text-muted-foreground">{state.warPoints} Puntos de Guerra</p>
                </div>
              </div>
              <button onClick={() => setShowDecreeModal(false)} className="p-1 rounded-full hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                <p className="text-[9px] text-red-400/70 uppercase">Daño+</p>
                <p className="text-sm font-black text-red-300">+{bonusDamage}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                <p className="text-[9px] text-blue-400/70 uppercase">Reducción</p>
                <p className="text-sm font-black text-blue-300">-{damageReduction}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-center">
                <p className="text-[9px] text-purple-400/70 uppercase">Mín. daño</p>
                <p className="text-sm font-black text-purple-300">{minDamage}</p>
              </div>
            </div>

            {/* Decrees */}
            {state.decreeUsedThisTurn ? (
              <div className="p-3 rounded-lg bg-muted/30 border border-border text-center">
                <p className="text-xs text-muted-foreground">Ya usaste un decreto este turno.</p>
                {state.lastDecree && (
                  <p className="text-[10px] text-red-400/70 mt-1">
                    Último: {DECREE_INFO[state.lastDecree]?.name}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {(['blood', 'domination', 'extermination'] as DecreeType[]).filter(Boolean).map(decree => {
                  if (!decree) return null;
                  const info = DECREE_INFO[decree];
                  const isAvailable = availableDecrees.includes(decree);
                  const Icon = info.icon;
                  const colorMap: Record<string, string> = {
                    red: 'border-red-500/40 bg-red-500/10 hover:bg-red-500/20',
                    green: 'border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20',
                    orange: 'border-orange-500/40 bg-orange-500/10 hover:bg-orange-500/20',
                  };
                  const textMap: Record<string, string> = {
                    red: 'text-red-400',
                    green: 'text-emerald-400',
                    orange: 'text-orange-400',
                  };

                  return (
                    <motion.button
                      key={decree}
                      className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                        isAvailable ? colorMap[info.color] : 'border-muted/30 bg-muted/10 opacity-40'
                      }`}
                      disabled={!isAvailable}
                      onClick={() => {
                        onUseDecree(decree);
                        setShowDecreeModal(false);
                      }}
                      whileTap={isAvailable ? { scale: 0.97 } : {}}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isAvailable ? `bg-${info.color}-500/20` : 'bg-muted/20'}`}>
                          <Icon className={`w-5 h-5 ${isAvailable ? textMap[info.color] : 'text-muted-foreground/50'}`} />
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-bold text-xs ${isAvailable ? textMap[info.color] : 'text-muted-foreground/50'}`}>
                            {info.name}
                          </h4>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {decree === 'blood' ? `${state.warPoints} daño directo` :
                             decree === 'domination' ? `+${state.warPoints} vida` :
                             'Daño x2 este turno'}
                          </p>
                        </div>
                        {!isAvailable && state.lastDecree === decree && (
                          <span className="text-[8px] text-muted-foreground/50 px-1.5 py-0.5 rounded bg-muted/20">
                            Último usado
                          </span>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Passive info */}
            <div className="mt-3 p-2 rounded-lg bg-muted/20 border border-border/50">
              <p className="text-[9px] text-muted-foreground leading-relaxed">
                <span className="font-bold text-red-400">Tributo:</span> -{Math.ceil(1 + state.warPoints / 2)} vida/turno • 
                <span className="font-bold text-blue-400"> Reducción:</span> -{damageReduction} daño recibido (mín {minDamage}) • 
                <span className="font-bold text-amber-400"> Daño+:</span> +{bonusDamage} a todo daño infligido
              </p>
            </div>
          </motion.div>
        </motion.div>,
        document.body
      )}
    </>
  );
});

WarGodPanel.displayName = 'WarGodPanel';
