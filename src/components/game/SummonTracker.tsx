import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sword, Mountain, Skull, X, Minus, Plus, AlertTriangle } from 'lucide-react';

export interface ActiveSummon {
  id: string;
  type: 'dragon' | 'hero' | 'giant';
  name: string;
  // Dragon specific
  deathCounter?: number;
  attackBonus?: number;
}

interface SummonTrackerProps {
  summons: ActiveSummon[];
  onUpdateSummon: (id: string, updates: Partial<ActiveSummon>) => void;
  onRemoveSummon: (id: string) => void;
  player: 'player1' | 'player2';
  isRotated?: boolean;
  playerColor?: string; // HSL color string for player indicator
}

const getSummonIcon = (type: ActiveSummon['type']) => {
  switch (type) {
    case 'dragon':
      return Heart;
    case 'hero':
      return Sword;
    case 'giant':
      return Mountain;
    default:
      return Skull;
  }
};

const getSummonColor = (type: ActiveSummon['type']) => {
  switch (type) {
    case 'dragon':
      return { bg: 'bg-red-500', border: 'border-red-500', text: 'text-red-500', glow: 'shadow-red-500/50' };
    case 'hero':
      return { bg: 'bg-amber-500', border: 'border-amber-500', text: 'text-amber-500', glow: 'shadow-amber-500/50' };
    case 'giant':
      return { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-500', glow: 'shadow-purple-500/50' };
    default:
      return { bg: 'bg-muted', border: 'border-muted', text: 'text-muted-foreground', glow: '' };
  }
};

const getDeathCounterColor = (counter: number) => {
  if (counter >= 3) return 'bg-green-500 text-white';
  if (counter === 2) return 'bg-yellow-500 text-black';
  if (counter === 1) return 'bg-red-500 text-white animate-pulse';
  return 'bg-gray-500 text-white';
};

interface SummonBadgeProps {
  summon: ActiveSummon;
  onUpdate: (updates: Partial<ActiveSummon>) => void;
  onRemove: () => void;
  isRotated?: boolean;
  playerColor?: string;
}

const SummonBadge = ({ summon, onUpdate, onRemove, isRotated, playerColor }: SummonBadgeProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = getSummonIcon(summon.type);
  const colors = getSummonColor(summon.type);

  // Determine warning state for dragon
  const isDragonDying = summon.type === 'dragon' && summon.deathCounter === 1;
  const isDragonDead = summon.type === 'dragon' && (summon.deathCounter ?? 3) <= 0;

  // Get badge indicator value
  const getBadgeValue = () => {
    if (summon.type === 'dragon') {
      return summon.deathCounter ?? 3;
    }
    return null;
  };

  const badgeValue = getBadgeValue();

  // Generate player indicator ring style
  const playerRingStyle = playerColor ? {
    boxShadow: `0 0 0 2px ${playerColor}, 0 0 8px ${playerColor}40`
  } : {};

  return (
    <>
      {/* Mini Icon Badge */}
      <motion.button
        className={`relative p-2 rounded-full ${colors.bg} shadow-lg ${colors.glow} ${
          isDragonDying ? 'animate-pulse' : ''
        } ${isDragonDead ? 'opacity-50 grayscale' : ''}`}
        style={playerRingStyle}
        onClick={() => setIsExpanded(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        layout
      >
        <Icon className="w-4 h-4 text-white" />
        
        {/* Dragon Counter Badge */}
        {summon.type === 'dragon' && badgeValue !== null && (
          <motion.div
            className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold ${getDeathCounterColor(badgeValue)}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            {badgeValue}
          </motion.div>
        )}

        {/* Hero indicator - skull for "destroy at end of turn" */}
        {summon.type === 'hero' && (
          <motion.div
            className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full bg-amber-600 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <Skull className="w-2.5 h-2.5 text-white" />
          </motion.div>
        )}

        {/* Giant indicator - infinity symbol */}
        {summon.type === 'giant' && (
          <motion.div
            className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full bg-purple-600 flex items-center justify-center text-[10px] font-bold text-white"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            ∞
          </motion.div>
        )}
      </motion.button>

      {/* Expanded Popover - Unified horizontal design */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            style={{ transform: isRotated ? 'rotate(180deg)' : 'none' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(false)}
          >
            <motion.div
              className={`bg-card border-2 ${colors.border} rounded-xl shadow-2xl overflow-hidden`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Horizontal Layout */}
              <div className="flex items-stretch">
                {/* Left - Icon & Name */}
                <div className={`${colors.bg} p-3 flex items-center gap-2`}>
                  <Icon className="w-6 h-6 text-white" />
                  <span className="font-bold text-white whitespace-nowrap">{summon.name}</span>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="ml-1 p-0.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>

                {/* Right - Controls */}
                <div className="flex items-center gap-3 px-3 py-2 bg-card">
                  {/* Dragon Controls */}
                  {summon.type === 'dragon' && (
                    <>
                      {/* Death Counter */}
                      <div className="flex items-center gap-1">
                        <Skull className="w-4 h-4 text-muted-foreground" />
                        <button
                          onClick={() => onUpdate({ deathCounter: Math.max(0, (summon.deathCounter ?? 3) - 1) })}
                          className="p-1.5 rounded bg-muted hover:bg-muted/80"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className={`px-2 py-1 rounded font-bold text-sm min-w-[32px] text-center ${getDeathCounterColor(summon.deathCounter ?? 3)}`}>
                          {summon.deathCounter ?? 3}
                        </span>
                        <button
                          onClick={() => onUpdate({ deathCounter: Math.min(9, (summon.deathCounter ?? 3) + 1) })}
                          className="p-1.5 rounded bg-muted hover:bg-muted/80"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Attack Bonus */}
                      <div className="flex items-center gap-1">
                        <Sword className="w-4 h-4 text-red-400" />
                        <button
                          onClick={() => onUpdate({ attackBonus: Math.max(0, (summon.attackBonus ?? 0) - 2) })}
                          className="p-1.5 rounded bg-muted hover:bg-muted/80"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 py-1 rounded font-bold text-sm bg-red-500/20 text-red-400 min-w-[40px] text-center">
                          +{summon.attackBonus ?? 0}
                        </span>
                        <button
                          onClick={() => onUpdate({ attackBonus: (summon.attackBonus ?? 0) + 2 })}
                          className="p-1.5 rounded bg-muted hover:bg-muted/80"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </>
                  )}

                  {/* Hero Info */}
                  {summon.type === 'hero' && (
                    <div className="flex items-center gap-2 px-3 py-2">
                      <Skull className="w-4 h-4 text-amber-400" />
                      <span className="text-sm text-amber-400/80 italic whitespace-nowrap">
                        Destruir al fin del turno
                      </span>
                    </div>
                  )}

                  {/* Giant Info */}
                  {summon.type === 'giant' && (
                    <div className="flex items-center gap-2 px-3 py-2">
                      <span className="text-lg font-bold text-purple-400">∞</span>
                      <span className="text-sm text-purple-400/80 italic whitespace-nowrap">
                        Permanente
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Remove Button - Full width at bottom */}
              <button
                onClick={() => {
                  onRemove();
                  setIsExpanded(false);
                }}
                className="w-full py-2 bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Eliminar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export const SummonTracker = ({
  summons,
  onUpdateSummon,
  onRemoveSummon,
  player,
  isRotated = false,
  playerColor,
}: SummonTrackerProps) => {
  if (summons.length === 0) return null;

  return (
    <div className="flex gap-1">
      <AnimatePresence mode="popLayout">
        {summons.map((summon) => (
          <motion.div
            key={summon.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            layout
          >
            <SummonBadge
              summon={summon}
              onUpdate={(updates) => onUpdateSummon(summon.id, updates)}
              onRemove={() => onRemoveSummon(summon.id)}
              isRotated={isRotated}
              playerColor={playerColor}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};