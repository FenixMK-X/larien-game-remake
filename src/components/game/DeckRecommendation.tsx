import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Lightbulb, Bug, Flame, Pickaxe, Mountain, Skull, 
  Sword, Shield, Sparkles, Waves, Moon
} from 'lucide-react';
import type { Skill } from './SkillSelection';
import { AVAILABLE_SKILLS } from './SkillSelection';

export type DeckType = 
  | 'drow' 
  | 'enanos' 
  | 'desertores' 
  | 'soldados' 
  | 'elementales' 
  | 'demonios' 
  | 'brujas' 
  | 'gigantes' 
  | 'insectos' 
  | 'monstruos' 
  | 'triton';

interface DeckConfig {
  name: string;
  icon: typeof Bug;
  color: string;
  recommendedSkills: string[]; // skill IDs in order of recommendation
}

export const DECK_CONFIGS: Record<DeckType, DeckConfig> = {
  drow: {
    name: 'Drow',
    icon: Moon,
    color: 'text-purple-500',
    recommendedSkills: ['destiny-theft', 'delorian', 'jackpot', 'genie-lamp', 'last-breath'],
  },
  enanos: {
    name: 'Enanos',
    icon: Pickaxe,
    color: 'text-amber-600',
    recommendedSkills: ['dwarf-hunt', 'treasure-scale', 'my-dollars', 'delorian', 'genie-lamp'],
  },
  desertores: {
    name: 'Desertores',
    icon: Shield,
    color: 'text-gray-500',
    recommendedSkills: ['last-breath', 'destiny-theft', 'delorian', 'jackpot', 'genie-lamp'],
  },
  soldados: {
    name: 'Soldados',
    icon: Sword,
    color: 'text-red-500',
    recommendedSkills: ['hero-strike', 'last-breath', 'treasure-scale', 'genie-lamp', 'delorian'],
  },
  elementales: {
    name: 'Elementales',
    icon: Sparkles,
    color: 'text-cyan-500',
    recommendedSkills: ['jackpot', 'genie-lamp', 'treasure-scale', 'destiny-theft', 'delorian'],
  },
  demonios: {
    name: 'Demonios',
    icon: Flame,
    color: 'text-red-600',
    recommendedSkills: ['hell-gates', 'last-breath', 'destiny-theft', 'jackpot', 'delorian'],
  },
  brujas: {
    name: 'Brujas',
    icon: Skull,
    color: 'text-purple-600',
    recommendedSkills: ['witch-hunt', 'jackpot', 'delorian', 'genie-lamp', 'destiny-theft'],
  },
  gigantes: {
    name: 'Gigantes',
    icon: Mountain,
    color: 'text-stone-500',
    recommendedSkills: ['jotunheimr-gate', 'treasure-scale', 'my-dollars', 'genie-lamp', 'delorian'],
  },
  insectos: {
    name: 'Insectos',
    icon: Bug,
    color: 'text-green-500',
    recommendedSkills: ['insect-queen', 'treasure-scale', 'last-breath', 'delorian', 'genie-lamp'],
  },
  monstruos: {
    name: 'Monstruos',
    icon: Skull,
    color: 'text-orange-500',
    recommendedSkills: ['dragon-tamer', 'treasure-scale', 'delorian', 'jackpot', 'genie-lamp'],
  },
  triton: {
    name: 'Tritón',
    icon: Waves,
    color: 'text-blue-500',
    recommendedSkills: ['genie-lamp', 'treasure-scale', 'destiny-theft', 'jackpot', 'delorian'],
  },
};

interface DeckRecommendationProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSkill: (skill: Skill) => void;
  excludeSkillIds?: string[];
  playerColor?: 'player1' | 'player2';
}

export const DeckRecommendation = ({
  isOpen,
  onClose,
  onSelectSkill,
  excludeSkillIds = [],
  playerColor = 'player1',
}: DeckRecommendationProps) => {
  const [selectedDeck, setSelectedDeck] = useState<DeckType | null>(null);
  
  const getRecommendedSkills = (deckType: DeckType): Skill[] => {
    const config = DECK_CONFIGS[deckType];
    return config.recommendedSkills
      .filter(id => !excludeSkillIds.includes(id))
      .map(id => AVAILABLE_SKILLS.find(s => s.id === id))
      .filter((s): s is Skill => s !== undefined)
      .slice(0, 3);
  };
  
  const colorClasses = {
    player1: { border: 'border-player1', bg: 'bg-player1', bgLight: 'bg-player1/20' },
    player2: { border: 'border-player2', bg: 'bg-player2', bgLight: 'bg-player2/20' },
  };
  const colors = colorClasses[playerColor];

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className={`w-full max-w-md max-h-[85vh] bg-card ${colors.border} border-2 rounded-2xl shadow-2xl overflow-hidden flex flex-col`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-4 ${colors.bgLight} flex items-center justify-between shrink-0`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${colors.bg}`}>
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg">Recomendación por Mazo</h3>
              <p className="text-xs text-muted-foreground">Selecciona tu tipo de mazo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {!selectedDeck ? (
            // Deck Type Selection
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(DECK_CONFIGS) as [DeckType, DeckConfig][]).map(([type, config]) => {
                const Icon = config.icon;
                return (
                  <motion.button
                    key={type}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-border bg-card hover:border-primary transition-all"
                    onClick={() => setSelectedDeck(type)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className={`w-6 h-6 ${config.color}`} />
                    <span className="text-xs font-medium text-center">{config.name}</span>
                  </motion.button>
                );
              })}
            </div>
          ) : (
            // Recommended Skills
            <div>
              <button
                onClick={() => setSelectedDeck(null)}
                className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
              >
                ← Cambiar mazo
              </button>
              
              <div className="flex items-center gap-2 mb-4">
                {(() => {
                  const config = DECK_CONFIGS[selectedDeck];
                  const Icon = config.icon;
                  return (
                    <>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                      <span className="font-bold">Recomendadas para {config.name}</span>
                    </>
                  );
                })()}
              </div>
              
              <div className="space-y-2">
                {getRecommendedSkills(selectedDeck).map((skill, index) => (
                  <motion.button
                    key={skill.id}
                    className={`w-full p-3 rounded-xl border-2 border-border bg-card hover:${colors.border} transition-all text-left`}
                    onClick={() => {
                      onSelectSkill(skill);
                      onClose();
                    }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`w-6 h-6 rounded-full ${colors.bg} text-white flex items-center justify-center text-xs font-bold shrink-0`}>
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display font-bold text-sm">{skill.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {skill.description.split('\n')[0]}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
