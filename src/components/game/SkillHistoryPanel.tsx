import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, ChevronDown, X, Clock, Info, Eye,
  Pickaxe, Bug, Lamp, Skull, Sword, Flame, Mountain, 
  Scale, Car, Heart, DoorOpen, Coins, Target, 
  Dices, Sparkles
} from 'lucide-react';
import { AVAILABLE_SKILLS } from './SkillSelection';

export interface SkillHistoryEntry {
  id: string;
  skillId: string;
  skillName: string;
  timestamp: number;
  turnsRemaining?: number;
  activeEffects?: string[];
  effectDescriptions?: string[]; // Detailed descriptions of what each effect does
  isActive: boolean;
}

interface SkillHistoryPanelProps {
  history: SkillHistoryEntry[];
  player: 'player1' | 'player2';
  isRotated?: boolean;
}

const getSkillIcon = (skillId: string) => {
  const iconMap: Record<string, any> = {
    'dwarf-hunt': Pickaxe,
    'insect-queen': Bug,
    'genie-lamp': Lamp,
    'last-breath': Skull,
    'hero-strike': Sword,
    'witch-hunt': Flame,
    'jotunheimr-gate': Mountain,
    'treasure-scale': Scale,
    'delorian': Car,
    'dragon-tamer': Heart,
    'hell-gates': DoorOpen,
    'my-dollars': Coins,
    'destiny-theft': Target,
    'jackpot': Dices,
  };
  return iconMap[skillId] || Info;
};

const getSkillColor = (skillId: string) => {
  if (skillId === 'jackpot') {
    return { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500' };
  }
  if (['dragon-tamer', 'hero-strike', 'jotunheimr-gate', 'insect-queen', 'hell-gates'].includes(skillId)) {
    return { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500' };
  }
  if (['last-breath'].includes(skillId)) {
    return { bg: 'bg-red-500', text: 'text-red-400', border: 'border-red-500' };
  }
  return { bg: 'bg-cyan-500', text: 'text-cyan-400', border: 'border-cyan-500' };
};

export const SkillHistoryPanel = ({
  history,
  player,
  isRotated = false,
}: SkillHistoryPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSkillId, setExpandedSkillId] = useState<string | null>(null);
  
  const bgClass = player === 'player1' ? 'bg-player1' : 'bg-player2';
  const borderClass = player === 'player1' ? 'border-player1' : 'border-player2';
  const textClass = player === 'player1' ? 'text-player1' : 'text-player2';

  const activeSkills = history.filter(h => h.isActive);
  const pastSkills = history.filter(h => !h.isActive);

  if (history.length === 0) return null;

  const getFullSkillDetails = (skillId: string) => {
    return AVAILABLE_SKILLS.find(s => s.id === skillId);
  };

  return (
    <>
      {/* Trigger Button - Compact */}
      <motion.button
        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-full ${bgClass}/20 border ${borderClass}/50 hover:${bgClass}/30 transition-colors`}
        onClick={() => setIsExpanded(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <History className={`w-3.5 h-3.5 ${textClass}`} />
        {activeSkills.length > 0 && (
          <span className={`w-4 h-4 rounded-full ${bgClass} text-white text-[10px] font-bold flex items-center justify-center`}>
            {activeSkills.length}
          </span>
        )}
      </motion.button>

      {/* Expanded Panel Modal */}
      {isExpanded && createPortal(
        <AnimatePresence mode="wait">
          <motion.div
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            style={{ transform: isRotated ? 'rotate(180deg)' : 'none' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={`relative w-[360px] max-w-[95vw] max-h-[80vh] bg-card border-2 ${borderClass} rounded-2xl shadow-2xl overflow-hidden flex flex-col`}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`p-3 ${bgClass}/20 flex items-center justify-between shrink-0`}>
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${bgClass}`}>
                    <History className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm">Historial de Habilidades</h3>
                    <p className="text-xs text-muted-foreground">
                      {player === 'player1' ? 'Jugador 1' : 'Jugador 2'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {/* Active Skills */}
                {activeSkills.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Activas ({activeSkills.length})
                    </p>
                    <div className="space-y-2">
                      {activeSkills.map((entry) => {
                        const Icon = getSkillIcon(entry.skillId);
                        const colors = getSkillColor(entry.skillId);
                        const fullSkill = getFullSkillDetails(entry.skillId);
                        const isThisExpanded = expandedSkillId === entry.id;
                        
                        return (
                          <motion.div
                            key={entry.id}
                            className={`rounded-xl ${colors.bg}/10 border ${colors.border}/50 overflow-hidden`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                          >
                            {/* Main info */}
                            <div className="p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <div className={`p-1.5 rounded-lg ${colors.bg}`}>
                                  <Icon className="w-4 h-4 text-white" />
                                </div>
                                <span className={`font-bold text-sm ${colors.text} flex-1 truncate`}>
                                  {entry.skillName}
                                </span>
                                {entry.turnsRemaining !== undefined && entry.turnsRemaining > 0 && (
                                  <motion.span 
                                    className={`px-2 py-0.5 rounded-full ${colors.bg} text-white text-xs font-bold`}
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                  >
                                    {entry.turnsRemaining}T
                                  </motion.span>
                                )}
                              </div>
                              
                              {/* Active effects - Show what was selected */}
                              {entry.activeEffects && entry.activeEffects.length > 0 && (
                                <div className="space-y-1.5 ml-8">
                                  {entry.activeEffects.map((effect, i) => (
                                    <div key={i} className="text-xs">
                                      <p className={`font-medium ${colors.text}`}>
                                        • {effect}
                                      </p>
                                      {/* Show description if available */}
                                      {entry.effectDescriptions && entry.effectDescriptions[i] && (
                                        <p className="text-[10px] text-muted-foreground mt-0.5 ml-3">
                                          {entry.effectDescriptions[i].includes(':') 
                                            ? entry.effectDescriptions[i].split(':')[1]?.trim() 
                                            : entry.effectDescriptions[i]}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            {/* Expandable all effects button - only show for non-Jackpot or when no active effects */}
                            {fullSkill && fullSkill.isDomainSkill && fullSkill.options && (
                              <>
                                <button
                                  className={`w-full py-2 px-3 flex items-center justify-between border-t ${colors.border}/30 bg-muted/30 hover:bg-muted/50 transition-colors`}
                                  onClick={() => setExpandedSkillId(isThisExpanded ? null : entry.id)}
                                >
                                  <span className="text-xs font-medium flex items-center gap-1.5">
                                    <Eye className="w-3.5 h-3.5" />
                                    Ver todos los efectos posibles
                                  </span>
                                  <motion.div
                                    animate={{ rotate: isThisExpanded ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <ChevronDown className="w-4 h-4" />
                                  </motion.div>
                                </button>
                                
                                <AnimatePresence>
                                  {isThisExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="p-3 bg-muted/20 border-t border-border/50 space-y-2">
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 font-semibold">
                                          📋 Todos los efectos:
                                        </p>
                                        <div className="max-h-[150px] overflow-y-auto space-y-1.5 pr-1">
                                          {fullSkill.options.map((opt, i) => (
                                            <div key={i} className="p-2 rounded-lg bg-muted/30 border border-border/30">
                                              <p className="text-[11px] font-medium text-foreground">
                                                {opt.name}
                                              </p>
                                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                                {opt.description}
                                              </p>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Past Skills */}
                {pastSkills.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Finalizadas ({pastSkills.length})
                    </p>
                    <div className="space-y-1.5">
                      {pastSkills.map((entry) => {
                        const Icon = getSkillIcon(entry.skillId);
                        const colors = getSkillColor(entry.skillId);
                        const isThisExpanded = expandedSkillId === entry.id;
                        
                        return (
                          <div
                            key={entry.id}
                            className={`rounded-lg bg-muted/30 overflow-hidden border ${colors.border}/20`}
                          >
                            <div className="flex items-center gap-2 p-2">
                              <Icon className={`w-4 h-4 ${colors.text} opacity-60`} />
                              <span className="text-xs text-muted-foreground flex-1 truncate">
                                {entry.skillName}
                              </span>
                              <button
                                onClick={() => setExpandedSkillId(isThisExpanded ? null : entry.id)}
                                className="p-1 hover:bg-muted rounded transition-colors"
                              >
                                <motion.div
                                  animate={{ rotate: isThisExpanded ? 180 : 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                </motion.div>
                              </button>
                            </div>
                            
                            <AnimatePresence>
                              {isThisExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="p-2 pt-0 space-y-1.5">
                                    {/* What was activated */}
                                    {entry.activeEffects && entry.activeEffects.length > 0 && (
                                      <div className="space-y-1">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                          Efectos activados:
                                        </p>
                                        {entry.activeEffects.map((effect, i) => (
                                          <div key={i} className="text-[10px]">
                                            <span className={`${colors.text}`}>• {effect}</span>
                                            {entry.effectDescriptions && entry.effectDescriptions[i] && (
                                              <p className="text-muted-foreground/60 ml-2">
                                                {entry.effectDescriptions[i].includes(':') 
                                                  ? entry.effectDescriptions[i].split(':')[1]?.trim() 
                                                  : entry.effectDescriptions[i]}
                                              </p>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {history.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Sin habilidades activadas</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};
