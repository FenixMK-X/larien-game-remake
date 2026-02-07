import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, Flame, Pickaxe, Sparkles, Minus, Plus, X } from 'lucide-react';

export type TokenType = 'insect' | 'demon' | 'dwarf' | 'djinn';

export interface TokenCount {
  type: TokenType;
  count: number;
}

interface TokenCounterProps {
  tokens: TokenCount[];
  onUpdateToken: (type: TokenType, count: number) => void;
  onRemoveToken: (type: TokenType) => void;
  isRotated?: boolean;
  compact?: boolean;
  playerColor?: string; // HSL color string for player indicator
}

const getTokenConfig = (type: TokenType) => {
  switch (type) {
    case 'insect':
      return { 
        icon: Bug, 
        color: 'bg-green-500', 
        border: 'border-green-500',
        text: 'text-green-500',
        glow: 'shadow-green-500/50',
        name: 'Insecto'
      };
    case 'demon':
      return { 
        icon: Flame, 
        color: 'bg-red-600', 
        border: 'border-red-600',
        text: 'text-red-600',
        glow: 'shadow-red-600/50',
        name: 'Demonio'
      };
    case 'dwarf':
      return { 
        icon: Pickaxe, 
        color: 'bg-amber-600', 
        border: 'border-amber-600',
        text: 'text-amber-600',
        glow: 'shadow-amber-600/50',
        name: 'Enano'
      };
    case 'djinn':
      return { 
        icon: Sparkles, 
        color: 'bg-cyan-500', 
        border: 'border-cyan-500',
        text: 'text-cyan-500',
        glow: 'shadow-cyan-500/50',
        name: 'Djinn'
      };
  }
};

interface TokenBadgeProps {
  token: TokenCount;
  onUpdate: (count: number) => void;
  onRemove: () => void;
  isRotated?: boolean;
  playerColor?: string;
}

const TokenBadge = ({ token, onUpdate, onRemove, isRotated, playerColor }: TokenBadgeProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = getTokenConfig(token.type);
  const Icon = config.icon;

  // Generate player indicator ring style
  const playerRingStyle = playerColor ? {
    boxShadow: `0 0 0 2px ${playerColor}, 0 0 8px ${playerColor}40`
  } : {};

  return (
    <>
      {/* Mini Icon Badge */}
      <motion.button
        className={`relative p-1.5 rounded-full ${config.color} shadow-lg ${config.glow}`}
        style={playerRingStyle}
        onClick={() => setIsExpanded(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        layout
      >
        <Icon className="w-3.5 h-3.5 text-white" />
        
        {/* Count Badge */}
        <motion.div
          className={`absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full bg-background border-2 ${config.border} flex items-center justify-center text-[9px] font-bold`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          <span className={config.text}>{token.count}</span>
        </motion.div>
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
              className={`bg-card border-2 ${config.border} rounded-xl shadow-2xl overflow-hidden`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Horizontal Layout */}
              <div className="flex items-stretch">
                {/* Left - Icon & Name */}
                <div className={`${config.color} p-3 flex items-center gap-2`}>
                  <Icon className="w-6 h-6 text-white" />
                  <span className="font-bold text-white whitespace-nowrap">{config.name}</span>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="ml-1 p-0.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>

                {/* Right - Counter Controls */}
                <div className="flex items-center gap-2 px-3 py-2 bg-card">
                  <button
                    onClick={() => onUpdate(Math.max(0, token.count - 1))}
                    className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className={`px-4 py-2 rounded-lg font-bold text-xl ${config.color} text-white min-w-[50px] text-center`}>
                    {token.count}
                  </span>
                  <button
                    onClick={() => onUpdate(token.count + 1)}
                    className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
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

export const TokenCounter = ({
  tokens,
  onUpdateToken,
  onRemoveToken,
  isRotated = false,
  compact = false,
  playerColor,
}: TokenCounterProps) => {
  if (tokens.length === 0) return null;

  return (
    <div className={`flex ${compact ? 'flex-row gap-1' : 'flex-col gap-1.5'}`}>
      <AnimatePresence mode="popLayout">
        {tokens.map((token) => (
          <motion.div
            key={token.type}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            layout
          >
            <TokenBadge
              token={token}
              onUpdate={(count) => onUpdateToken(token.type, count)}
              onRemove={() => onRemoveToken(token.type)}
              isRotated={isRotated}
              playerColor={playerColor}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Export token types for external use
export const TOKEN_TYPES: { type: TokenType; name: string; icon: typeof Bug }[] = [
  { type: 'insect', name: 'Insecto', icon: Bug },
  { type: 'demon', name: 'Demonio', icon: Flame },
  { type: 'dwarf', name: 'Enano', icon: Pickaxe },
  { type: 'djinn', name: 'Djinn', icon: Sparkles },
];
