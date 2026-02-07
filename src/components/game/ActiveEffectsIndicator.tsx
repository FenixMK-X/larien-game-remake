import { motion } from 'framer-motion';
import { 
  Dices, 
  Coins, Shield, Skull, Swords, Zap, Sparkles,
  Crown, Lock, Flame
} from 'lucide-react';
import type { ActiveDomain } from './DomainTracker';

interface ActiveEffectsIndicatorProps {
  domains: ActiveDomain[];
  player: 'player1' | 'player2';
  isRotated?: boolean;
  hasOverflowingLuck?: boolean;
}

// Map effect names to icons
const getEffectIcon = (effectName: string) => {
  const name = effectName.toLowerCase();
  
  // Jackpot effects
  if (name.includes('tesoros infinitos') || name.includes('1♣')) return Coins;
  if (name.includes('costo cero') || name.includes('2♠')) return Shield;
  if (name.includes('acción') || name.includes('3♦')) return Zap;
  if (name.includes('anulación') || name.includes('4♣')) return Lock;
  if (name.includes('resurrección') || name.includes('5♠')) return Skull;
  if (name.includes('asalto') || name.includes('6♦')) return Swords;
  if (name.includes('daño') || name.includes('7♣')) return Flame;
  if (name.includes('reescritura') || name.includes('8♠')) return Sparkles;
  if (name.includes('chances') || name.includes('9♦')) return Crown;
  
  return Sparkles;
};

const getSymbolColor = (effectName: string) => {
  if (effectName.includes('♣')) return { text: 'text-emerald-400', bg: 'bg-emerald-500/30', border: 'border-emerald-500/60', glow: 'rgba(16, 185, 129, 0.4)' };
  if (effectName.includes('♦')) return { text: 'text-amber-400', bg: 'bg-amber-500/30', border: 'border-amber-500/60', glow: 'rgba(245, 158, 11, 0.4)' };
  if (effectName.includes('♠')) return { text: 'text-slate-300', bg: 'bg-slate-500/30', border: 'border-slate-500/60', glow: 'rgba(100, 116, 139, 0.4)' };
  return { text: 'text-purple-400', bg: 'bg-purple-500/30', border: 'border-purple-500/60', glow: 'rgba(168, 85, 247, 0.4)' };
};

const getDomainColor = (skillId: string) => {
  if (skillId === 'jackpot') {
    return { 
      main: 'text-amber-400', 
      bg: 'bg-gradient-to-br from-amber-500/30 to-yellow-600/20', 
      border: 'border-amber-400/60', 
      glow: 'rgba(251, 191, 36, 0.5)',
      gradient: 'linear-gradient(135deg, rgba(251,191,36,0.3), rgba(217,119,6,0.2))'
    };
  }
  if (skillId === 'witch-coven') {
    return { 
      main: 'text-purple-400', 
      bg: 'bg-gradient-to-br from-purple-500/30 to-violet-600/20', 
      border: 'border-purple-400/60', 
      glow: 'rgba(168, 85, 247, 0.5)',
      gradient: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(139,92,246,0.2))'
    };
  }
  return { 
    main: 'text-primary', 
    bg: 'bg-primary/20', 
    border: 'border-primary/50', 
    glow: 'rgba(147, 51, 234, 0.4)',
    gradient: 'linear-gradient(135deg, rgba(147,51,234,0.3), rgba(192,38,211,0.2))'
  };
};

const getDomainIcon = (skillId: string) => {
  if (skillId === 'jackpot') return Dices;
  if (skillId === 'witch-coven') return Flame;
  return Sparkles;
};

const getDomainEmoji = (skillId: string) => {
  if (skillId === 'jackpot') return '🎰';
  if (skillId === 'witch-coven') return '🔥';
  return '✨';
};

export const ActiveEffectsIndicator = ({
  domains,
  player,
  isRotated = false,
  hasOverflowingLuck = false,
}: ActiveEffectsIndicatorProps) => {
  // Filtrar dominios permanentes como witch-coven - no queremos mostrar el infinito
  const visibleDomains = domains.filter(d => d.skillId !== 'witch-coven');
  
  // Show component if there are visible domains OR if player has overflowing luck
  if (visibleDomains.length === 0 && !hasOverflowingLuck) return null;

  return (
    <div className={`flex flex-col gap-2 ${isRotated ? 'items-end' : 'items-start'}`}>
      {/* Suerte Desbordada Indicator - Always visible when active */}
      {hasOverflowingLuck && (
        <motion.div
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500/30 via-green-500/20 to-emerald-500/30 border-2 border-emerald-400/60 backdrop-blur-md"
          style={{ 
            boxShadow: '0 0 25px 5px rgba(16, 185, 129, 0.5), inset 0 0 15px 0 rgba(16, 185, 129, 0.3)',
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
          }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          <motion.span
            className="text-xl"
            animate={{ 
              scale: [1, 1.3, 1],
              rotate: [0, 15, -15, 0]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            🍀
          </motion.span>
          <div className="flex flex-col">
            <span className="text-xs font-black text-emerald-400 drop-shadow-lg">
              SUERTE DESBORDADA
            </span>
            <span className="text-[9px] text-emerald-300/80">
              100% próxima pasiva
            </span>
          </div>
          <motion.div
            className="w-5 h-5 rounded-full bg-emerald-500/40 border border-emerald-400 flex items-center justify-center"
            animate={{
              boxShadow: [
                '0 0 0 0 rgba(16, 185, 129, 0)',
                '0 0 15px 8px rgba(16, 185, 129, 0.6)',
                '0 0 0 0 rgba(16, 185, 129, 0)',
              ]
            }}
            transition={{ duration: 1.2, repeat: Infinity }}
          >
            <Sparkles className="w-3 h-3 text-emerald-300" />
          </motion.div>
        </motion.div>
      )}
      {visibleDomains.map((domain) => {
        const DomainIcon = getDomainIcon(domain.skillId);
        const colors = getDomainColor(domain.skillId);
        
        return (
          <motion.div
            key={domain.id}
            className={`flex flex-col gap-2 p-2.5 rounded-xl ${colors.bg} border-2 ${colors.border} backdrop-blur-md`}
            style={{ 
              boxShadow: `0 0 25px 5px ${colors.glow}, inset 0 0 15px 0 ${colors.glow}`,
            }}
            initial={{ opacity: 0, scale: 0.8, x: isRotated ? 20 : -20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              x: 0,
            }}
            exit={{ opacity: 0, scale: 0.8, x: isRotated ? 20 : -20 }}
          >
            {/* Header with domain icon and name */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <motion.span 
                  className="text-lg"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {getDomainEmoji(domain.skillId)}
                </motion.span>
                <motion.div
                  animate={{ 
                    rotate: [0, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                    scale: { duration: 1.5, repeat: Infinity }
                  }}
                >
                  <DomainIcon className={`w-5 h-5 ${colors.main} drop-shadow-lg`} />
                </motion.div>
              </div>
              
              {/* Dramatic pulsating turn counter - Show "∞" for permanent domains */}
              <motion.div 
                className={`px-3 py-1 rounded-full bg-black/40 border-2 ${colors.border}`}
                animate={{ 
                  scale: [1, 1.2, 1],
                  boxShadow: [
                    `0 0 0 0 ${colors.glow}`,
                    `0 0 20px 8px ${colors.glow}`,
                    `0 0 0 0 ${colors.glow}`,
                  ]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <span className={`text-sm font-black ${colors.main} drop-shadow-lg`}>
                  {domain.turnsRemaining >= 999 ? '∞' : `${domain.turnsRemaining}T`}
                </span>
              </motion.div>
            </div>
            
            {/* Effects Icons - Enhanced blinking with glow */}
            <div className="flex flex-wrap gap-1.5 max-w-[120px]">
              {domain.activeEffects?.slice(0, 4).map((effect, i) => {
                const EffectIcon = getEffectIcon(effect);
                const symbolColors = getSymbolColor(effect);
                
                return (
                  <motion.div
                    key={i}
                    className={`w-7 h-7 rounded-lg ${symbolColors.bg} border-2 ${symbolColors.border} flex items-center justify-center`}
                    initial={{ opacity: 0, scale: 0, rotate: -180 }}
                    animate={{ 
                      opacity: [0.7, 1, 0.7],
                      scale: [1, 1.15, 1],
                      boxShadow: [
                        `0 0 0 0 ${symbolColors.glow}`,
                        `0 0 15px 5px ${symbolColors.glow}`,
                        `0 0 0 0 ${symbolColors.glow}`,
                      ]
                    }}
                    transition={{ 
                      duration: 1.2, 
                      repeat: Infinity,
                      delay: i * 0.25,
                    }}
                    title={effect}
                  >
                    <EffectIcon className={`w-4 h-4 ${symbolColors.text} drop-shadow-md`} />
                  </motion.div>
                );
              })}
              
              {/* Show +N if more than 4 effects */}
              {domain.activeEffects && domain.activeEffects.length > 4 && (
                <motion.div
                  className="w-7 h-7 rounded-lg bg-white/10 border border-white/30 flex items-center justify-center"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <span className="text-[10px] font-bold text-white">
                    +{domain.activeEffects.length - 4}
                  </span>
                </motion.div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
