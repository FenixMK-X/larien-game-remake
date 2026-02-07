import { motion, AnimatePresence } from 'framer-motion';
import { Dices, Clock, X, Sparkles } from 'lucide-react';
import { useState } from 'react';

export interface ActiveDomain {
  id: string;
  skillId: string;
  skillName: string;
  turnsRemaining: number;
  activeEffects: string[];
  player: 'player1' | 'player2';
}

interface DomainTrackerProps {
  domains: ActiveDomain[];
  onUpdateDomain: (id: string, turnsRemaining: number) => void;
  onRemoveDomain: (id: string) => void;
  isRotated?: boolean;
}

const getDomainIcon = (skillId: string) => {
  switch (skillId) {
    case 'jackpot':
      return Dices;
    default:
      return Sparkles;
  }
};

const getDomainColor = (skillId: string) => {
  switch (skillId) {
    case 'jackpot':
      return { bg: 'bg-amber-500', border: 'border-amber-500', text: 'text-amber-500', glow: 'shadow-amber-500/50' };
    default:
      return { bg: 'bg-primary', border: 'border-primary', text: 'text-primary', glow: 'shadow-primary/50' };
  }
};

interface DomainBadgeProps {
  domain: ActiveDomain;
  onUpdate: (turns: number) => void;
  onRemove: () => void;
  isRotated?: boolean;
}

const DomainBadge = ({ domain, onUpdate, onRemove, isRotated }: DomainBadgeProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = getDomainIcon(domain.skillId);
  const colors = getDomainColor(domain.skillId);

  return (
    <>
      <motion.button
        className={`relative px-3 py-1.5 rounded-full ${colors.bg} shadow-lg ${colors.glow} flex items-center gap-2`}
        onClick={() => setIsExpanded(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{ 
          boxShadow: [
            `0 0 10px 0 currentColor`,
            `0 0 20px 5px currentColor`,
            `0 0 10px 0 currentColor`,
          ]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Icon className="w-4 h-4 text-white" />
        <span className="text-xs font-bold text-white">
          {domain.turnsRemaining >= 999 ? '∞' : `${domain.turnsRemaining}T`}
        </span>
      </motion.button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            style={{ transform: isRotated ? 'rotate(180deg)' : 'none' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={`bg-card border-2 ${colors.border} rounded-xl p-4 min-w-[280px] max-w-[320px] shadow-2xl`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${colors.bg}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className={`font-bold ${colors.text}`}>{domain.skillName}</span>
                    <p className="text-xs text-muted-foreground">
                      {domain.player === 'player1' ? 'Jugador 1' : 'Jugador 2'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Duration */}
              <div className="flex items-center justify-between mb-3 p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Turnos restantes</span>
                </div>
                <span className={`px-3 py-1 rounded-full font-bold ${colors.bg} text-white`}>
                  {domain.turnsRemaining >= 999 ? '∞' : domain.turnsRemaining}
                </span>
              </div>

              {/* Active Effects */}
              {domain.activeEffects.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    Efectos Activos
                  </p>
                  <div className="space-y-1">
                    {domain.activeEffects.map((effect, i) => (
                      <div
                        key={i}
                        className={`text-xs p-1.5 rounded ${colors.bg}/10 ${colors.text}`}
                      >
                        • {effect}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Remove Button */}
              <button
                onClick={() => {
                  onRemove();
                  setIsExpanded(false);
                }}
                className="w-full py-2 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Finalizar Dominio
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export const DomainTracker = ({
  domains,
  onUpdateDomain,
  onRemoveDomain,
  isRotated = false,
}: DomainTrackerProps) => {
  // Filtrar dominios permanentes (999 turnos) - se muestran en ActiveEffectsIndicator
  // No mostrar dominios permanentes aquí - no queremos que aparezca nada de 999 ni infinito
  const visibleDomains = domains.filter(d => d.turnsRemaining < 999 && d.skillId !== 'witch-coven');
  
  if (visibleDomains.length === 0) return null;

  return (
    <div className={`absolute top-3 left-1/2 -translate-x-1/2 flex gap-2 ${isRotated ? '' : ''}`}>
      <AnimatePresence mode="popLayout">
        {visibleDomains.map((domain) => (
          <motion.div
            key={domain.id}
            initial={{ opacity: 0, scale: 0, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0, y: -20 }}
            layout
          >
            <DomainBadge
              domain={domain}
              onUpdate={(turns) => onUpdateDomain(domain.id, turns)}
              onRemove={() => onRemoveDomain(domain.id)}
              isRotated={isRotated}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
