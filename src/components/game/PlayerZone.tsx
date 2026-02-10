import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LifeCounter } from './LifeCounter';
import { LastBreathModal } from './LastBreathModal';
import { SummonTracker, ActiveSummon } from './SummonTracker';
import { TokenType, TOKEN_TYPES } from './TokenCounter';
import { 
  Sparkles, X, Pickaxe, Lamp, Info, Zap, Bug,
  Skull, Sword, Flame, Mountain, Scale, Car, Heart, Clock, Lock, Plus,
  DoorOpen, Coins, Target, Dices, ChevronDown
} from 'lucide-react';
import type { Player } from '@/hooks/useGameState';
import type { Skill, SkillOption } from './SkillSelection';
import { useGameSounds } from '@/hooks/useSound';

interface ActiveDomain {
  id: string;
  skillId: string;
  skillName: string;
  turnsRemaining: number;
  activeEffects: string[];
  player: 'player1' | 'player2';
}

interface PlayerZoneProps {
  player: Player;
  life: number;
  isDefeated: boolean;
  isCurrentTurn: boolean;
  onLifeChange: (delta: number) => void;
  onLifeSet: (value: number) => void;
  isRotated?: boolean;
  skill?: Skill | null;
  onUseSkill?: (optionId?: string, extraData?: { lethalDamage?: number }) => void;
  onApplyDamage?: (targetPlayer: 'player1' | 'player2', damage: number) => void;
  summons?: ActiveSummon[];
  onAddSummon?: (summon: Omit<ActiveSummon, 'id'>) => void;
  onUpdateSummon?: (summonId: string, updates: Partial<ActiveSummon>) => void;
  onRemoveSummon?: (summonId: string) => void;
  onAddToken?: (type: TokenType) => void;
  customColor?: string;
  activeDomain?: ActiveDomain | null;
  isSecondChance?: boolean;
  hasOverflowingLuck?: boolean;
  playerTurnCount?: number; // Turnos del jugador específico (para restricción 3 turnos)
}

const getSkillIcon = (iconType: Skill['icon']) => {
  switch (iconType) {
    case 'dwarf': return Pickaxe;
    case 'insect': return Bug;
    case 'lamp': return Lamp;
    case 'lastbreath': return Skull;
    case 'hero': return Sword;
    case 'witch': return Flame;
    case 'giant': return Mountain;
    case 'treasure': return Scale;
    case 'delorian': return Car;
    case 'dragon': return Heart;
    case 'hellgate': return DoorOpen;
    case 'dollars': return Coins;
    case 'destiny': return Target;
    case 'jackpot': return Dices;
    default: return Info;
  }
};

export const PlayerZone = ({
  player,
  life,
  isDefeated,
  isCurrentTurn,
  onLifeChange,
  onLifeSet,
  isRotated = false,
  skill,
  onUseSkill,
  onApplyDamage,
  summons = [],
  onAddSummon,
  onUpdateSummon,
  onRemoveSummon,
  onAddToken,
  customColor,
  activeDomain,
  isSecondChance = false,
  hasOverflowingLuck = false,
  playerTurnCount = 0,
}: PlayerZoneProps) => {
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showActivationEffect, setShowActivationEffect] = useState(false);
  const [showLastBreathModal, setShowLastBreathModal] = useState(false);
  const [showSummonMenu, setShowSummonMenu] = useState(false);
  const [showDomainEffects, setShowDomainEffects] = useState(false);
  const [showPunishmentDetails, setShowPunishmentDetails] = useState(false);
  const { playSound } = useGameSounds();
  
  const zoneClass = player === 'player1' ? 'player1-zone' : 'player2-zone';
  const label = player === 'player1' ? 'Jugador 1' : 'Jugador 2';
  const turnIndicatorColor = player === 'player1' ? 'bg-player1' : 'bg-player2';
  const playerColorClass = player === 'player1' ? 'text-player1' : 'text-player2';
  const playerBgClass = player === 'player1' ? 'bg-player1' : 'bg-player2';
  const playerBorderClass = player === 'player1' ? 'border-player1' : 'border-player2';
  const playerBgLightClass = player === 'player1' ? 'bg-player1/20' : 'bg-player2/20';
  const playerBgHoverClass = player === 'player1' ? 'hover:bg-player1/30' : 'hover:bg-player2/30';

  const SkillIcon = skill ? getSkillIcon(skill.icon) : Sparkles;

  const getUsesText = () => {
    if (!skill) return '';
    if (skill.usageType === 'once') {
      return skill.used ? 'Usada' : 'Disponible';
    }
    if (skill.usageType === 'limited' && skill.maxUses) {
      const remaining = skill.usesRemaining ?? skill.maxUses;
      return `${remaining}/${skill.maxUses} usos`;
    }
    if (skill.usageType === 'cooldown') {
      if (skill.cooldownRemaining && skill.cooldownRemaining > 0) {
        return `${skill.cooldownRemaining} turnos`;
      }
      return 'Disponible';
    }
    return 'Condicional';
  };

  // Get max life for percentage calculations (assume 20 or 40 based on current life)
  const maxLife = life > 20 ? 40 : 20;
  
  // Check if life condition is met for domain skills
  const meetsLifeCondition = () => {
    if (!skill || !skill.activationCondition || skill.activationCondition === 'none') return true;
    const lifePercent = (life / maxLife) * 100;
    switch (skill.activationCondition) {
      case 'life50': return lifePercent <= 50;
      case 'life40': return lifePercent <= 40;
      case 'life25': return lifePercent <= 25;
      default: return true;
    }
  };

  const getLifeConditionText = () => {
    if (!skill?.activationCondition || skill.activationCondition === 'none') return null;
    switch (skill.activationCondition) {
      case 'life50': return `Vida ≤50% (${Math.floor(maxLife * 0.5)} PV)`;
      case 'life40': return `Vida ≤40% (${Math.floor(maxLife * 0.4)} PV)`;
      case 'life25': return `Vida ≤25% (${Math.floor(maxLife * 0.25)} PV)`;
      default: return null;
    }
  };

  // Check if summon skill is blocked by 3-turn restriction
  const isBlockedBySummonRestriction = () => {
    if (!skill) return false;
    if (!skill.isSummonSkill) return false;
    return playerTurnCount < 3;
  };

  const getSummonRestrictionText = () => {
    if (!skill?.isSummonSkill) return null;
    const turnsLeft = 3 - playerTurnCount;
    if (turnsLeft <= 0) return null;
    return `Disponible en ${turnsLeft} turno${turnsLeft > 1 ? 's' : ''}`;
  };

  // Check if witch-coven skill is blocked by 5-turn restriction
  const isBlockedByCovenRestriction = () => {
    if (!skill) return false;
    if (skill.id !== 'witch-coven') return false;
    return playerTurnCount < 5;
  };

  const getCovenRestrictionText = () => {
    if (skill?.id !== 'witch-coven') return null;
    const turnsLeft = 5 - playerTurnCount;
    if (turnsLeft <= 0) return null;
    return `Turno 5+ (faltan ${turnsLeft})`;
  };

  const canUseSkill = () => {
    if (!skill) return false;
    if (skill.usageType === 'once' && skill.used) return false;
    if (skill.usageType === 'limited') {
      const remaining = skill.usesRemaining ?? skill.maxUses ?? 0;
      if (remaining <= 0) return false;
    }
    if (skill.usageType === 'cooldown') {
      if (skill.cooldownRemaining && skill.cooldownRemaining > 0) return false;
    }
    // Check owner turn only restriction (skill-level)
    if (skill.ownerTurnOnly && !isCurrentTurn) return false;
    // Check life condition for domain skills
    if (!meetsLifeCondition()) return false;
    // Check summon skill 3-turn restriction
    if (isBlockedBySummonRestriction()) return false;
    // Check witch-coven 5-turn restriction
    if (isBlockedByCovenRestriction()) return false;
    return true;
  };

  const isSkillExhausted = () => {
    if (!skill) return false;
    if (skill.usageType === 'once' && skill.used) return true;
    if (skill.usageType === 'limited') {
      const remaining = skill.usesRemaining ?? skill.maxUses ?? 0;
      if (remaining <= 0) return true;
    }
    return false;
  };

  const isSkillOnCooldown = () => {
    if (!skill) return false;
    if (skill.usageType === 'cooldown' && skill.cooldownRemaining && skill.cooldownRemaining > 0) {
      return true;
    }
    return false;
  };

  const isBlockedByTurn = () => {
    if (!skill) return false;
    return skill.ownerTurnOnly && !isCurrentTurn;
  };

  const isBlockedByLife = () => {
    if (!skill) return false;
    return !meetsLifeCondition();
  };

  const canUseOption = (option: SkillOption) => {
    if (option.used) return false;
    if (!canUseSkill()) return false;
    // Check if this specific option requires owner turn
    if (skill?.ownerTurnOnlyOptions?.includes(option.id) && !isCurrentTurn) return false;
    return true;
  };

  const isOptionBlockedByTurn = (optionId: string) => {
    if (!skill) return false;
    return skill.ownerTurnOnlyOptions?.includes(optionId) && !isCurrentTurn;
  };

  // For domain skills, options are NOT manually selectable
  const isDomainSkill = skill?.isDomainSkill === true;
  const hasOptions = skill?.options && skill.options.length > 0 && !isDomainSkill;

  const isLastBreathSkill = skill?.id === 'last-breath';

  const handleUseSkill = (optionId?: string) => {
    if (onUseSkill && canUseSkill()) {
      // If has options (non-domain), require an optionId
      if (hasOptions && !optionId) return;
      
      // Special handling for Last Breath skill
      if (isLastBreathSkill) {
        setShowSkillModal(false);
        setShowLastBreathModal(true);
        return;
      }
      
      // Play sound
      playSound('skillActivate');
      
      // Show activation effect
      setShowActivationEffect(true);
      setTimeout(() => setShowActivationEffect(false), 1500);
      
      onUseSkill(optionId);
      setShowSkillModal(false);
    }
  };

  const handleLastBreathComplete = (result: { winner: 'player1' | 'player2'; loser: 'player1' | 'player2'; damage: number }) => {
    // Play activation effect
    playSound('skillActivate');
    setShowActivationEffect(true);
    setTimeout(() => setShowActivationEffect(false), 1500);
    
    // Apply damage to loser
    if (onApplyDamage) {
      onApplyDamage(result.loser, result.damage);
    }
    
    // Mark skill as used
    if (onUseSkill) {
      onUseSkill();
    }
    
    setShowLastBreathModal(false);
  };

  return (
    <motion.div
      className={`player-zone h-full w-full flex flex-col ${zoneClass} ${isRotated ? 'rotate-180' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Skill Activation Effect Overlay */}
      <AnimatePresence>
        {showActivationEffect && (
          <motion.div
            className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Radial burst */}
            <motion.div
              className={`absolute w-[200%] h-[200%] ${playerBgClass}`}
              initial={{ scale: 0, opacity: 0.6 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{ borderRadius: '50%' }}
            />
            
            {/* Sparkle particles */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute ${playerColorClass}`}
                initial={{ 
                  scale: 0, 
                  x: 0, 
                  y: 0,
                  opacity: 1 
                }}
                animate={{ 
                  scale: [0, 1, 0],
                  x: Math.cos(i * 30 * Math.PI / 180) * 150,
                  y: Math.sin(i * 30 * Math.PI / 180) * 150,
                  opacity: [1, 1, 0]
                }}
                transition={{ duration: 0.8, delay: i * 0.03 }}
              >
                <Zap className="w-6 h-6" />
              </motion.div>
            ))}
            
            {/* Central icon burst */}
            <motion.div
              className={`${playerColorClass}`}
              initial={{ scale: 0, opacity: 1, rotate: 0 }}
              animate={{ scale: [0, 2, 0], opacity: [1, 1, 0], rotate: 180 }}
              transition={{ duration: 0.8 }}
            >
              <SkillIcon className="w-20 h-20" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player Label with Turn Indicator */}
      <div className="absolute top-3 left-4 flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider opacity-60">
          {label}
        </span>
        <AnimatePresence>
          {isCurrentTurn && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className={`w-2 h-2 rounded-full ${turnIndicatorColor}`}
              style={{
                boxShadow: `0 0 8px hsl(var(--${player}))`,
              }}
            />
          )}
        </AnimatePresence>
        
        {/* Suerte Desbordada Indicator */}
        <AnimatePresence>
          {hasOverflowingLuck && !isSecondChance && (
            <motion.div
              className="flex items-center gap-2 px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-500/30 via-green-500/20 to-emerald-500/30 border-2 border-emerald-400/60 backdrop-blur-md"
              style={{ 
                boxShadow: '0 0 20px 3px rgba(16, 185, 129, 0.4), inset 0 0 10px 0 rgba(16, 185, 129, 0.2)',
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <motion.span
                className="text-base"
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                🍀
              </motion.span>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-emerald-400 drop-shadow-lg uppercase tracking-wider">
                  Suerte Desbordada
                </span>
                <span className="text-[8px] text-emerald-300/80">
                  100% próxima pasiva
                </span>
              </div>
              <motion.div
                className="w-4 h-4 rounded-full bg-emerald-500/40 border border-emerald-400 flex items-center justify-center"
                animate={{
                  boxShadow: [
                    '0 0 0 0 rgba(16, 185, 129, 0)',
                    '0 0 12px 6px rgba(16, 185, 129, 0.5)',
                    '0 0 0 0 rgba(16, 185, 129, 0)',
                  ]
                }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                <Sparkles className="w-2.5 h-2.5 text-emerald-300" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Second Chance Warning Indicator - Similar style to Suerte Desbordada */}
        <AnimatePresence>
          {isSecondChance && (
            <motion.div
              className="flex items-center gap-2 px-3 py-1 rounded-xl bg-gradient-to-r from-red-500/30 via-red-600/20 to-red-500/30 border-2 border-red-400/60 backdrop-blur-md"
              style={{ 
                boxShadow: '0 0 20px 3px rgba(239, 68, 68, 0.4), inset 0 0 10px 0 rgba(239, 68, 68, 0.2)',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
            >
              <motion.span
                className="text-base"
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, -5, 5, 0]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ⚠️
              </motion.span>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-red-400 drop-shadow-lg uppercase tracking-wider">
                  2ª Oportunidad
                </span>
                <span className="text-[8px] text-red-300/80">
                  Pasiva desactivada
                </span>
              </div>
              <motion.div
                className="w-4 h-4 rounded-full bg-red-500/40 border border-red-400 flex items-center justify-center"
                animate={{
                  boxShadow: [
                    '0 0 0 0 rgba(239, 68, 68, 0)',
                    '0 0 12px 6px rgba(239, 68, 68, 0.5)',
                    '0 0 0 0 rgba(239, 68, 68, 0)',
                  ]
                }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                <Skull className="w-2.5 h-2.5 text-red-300" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Skill Button - Only show if skill exists */}
      {skill && (
        <motion.button
          className={`absolute top-3 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full border-2 transition-all ${
            isSkillExhausted()
              ? 'border-muted-foreground/30 bg-muted/30 opacity-40 grayscale'
              : isSkillOnCooldown()
              ? 'border-cyan-500/50 bg-cyan-500/10'
              : isBlockedByTurn()
              ? 'border-amber-500/50 bg-amber-500/10'
              : isBlockedBySummonRestriction()
              ? 'border-orange-500/50 bg-orange-500/10'
              : isBlockedByCovenRestriction()
              ? 'border-purple-500/50 bg-purple-500/10'
              : isBlockedByLife()
              ? 'border-red-500/50 bg-red-500/10'
              : `${playerBorderClass} ${playerBgLightClass} ${playerBgHoverClass}`
          }`}
          onClick={() => setShowSkillModal(true)}
          whileHover={!isSkillExhausted() ? { scale: 1.05 } : {}}
          whileTap={!isSkillExhausted() ? { scale: 0.95 } : {}}
          animate={!isSkillExhausted() && !isSkillOnCooldown() && !isBlockedByTurn() && !isBlockedBySummonRestriction() && !isBlockedByCovenRestriction() && !isBlockedByLife() ? { 
            boxShadow: [
              '0 0 0 0 rgba(255,255,255,0)',
              '0 0 15px 2px rgba(255,255,255,0.3)',
              '0 0 0 0 rgba(255,255,255,0)'
            ]
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {isSkillOnCooldown() ? (
            <Clock className="w-4 h-4 text-cyan-500" />
          ) : isBlockedByTurn() ? (
            <Lock className="w-4 h-4 text-amber-500" />
          ) : isBlockedBySummonRestriction() ? (
            <Clock className="w-4 h-4 text-orange-500" />
          ) : isBlockedByCovenRestriction() ? (
            <Clock className="w-4 h-4 text-purple-500" />
          ) : isBlockedByLife() ? (
            <Lock className="w-4 h-4 text-red-500" />
          ) : (
            <SkillIcon className={`w-4 h-4 ${isSkillExhausted() ? 'text-muted-foreground/50' : playerColorClass}`} />
          )}
          <span className={`text-xs font-bold ${
            isSkillExhausted() 
              ? 'text-muted-foreground/50' 
              : isSkillOnCooldown() 
              ? 'text-cyan-500'
              : isBlockedByTurn()
              ? 'text-amber-500'
              : isBlockedBySummonRestriction()
              ? 'text-orange-500'
              : isBlockedByCovenRestriction()
              ? 'text-purple-500'
              : isBlockedByLife()
              ? 'text-red-500'
              : ''
          }`}>
            {isBlockedByTurn() 
              ? 'Tu turno' 
              : isBlockedBySummonRestriction() 
              ? getSummonRestrictionText() 
              : isBlockedByCovenRestriction()
              ? getCovenRestrictionText()
              : isBlockedByLife() 
              ? getLifeConditionText() 
              : getUsesText()}
          </span>
        </motion.button>
      )}

      {/* Main Content - Life Counter - Expands to fill available space */}
      <div className="flex-1 flex flex-col items-center justify-center relative min-h-0">
        <LifeCounter
          life={life}
          onLifeChange={onLifeChange}
          onLifeSet={onLifeSet}
          player={player}
          isDefeated={isDefeated}
          customColor={customColor}
        />
      </div>

      {/* Add Token Button - Only tokens, no monsters */}
      {onAddToken && (
        <div className="absolute bottom-3 left-3">
          <motion.button
            className={`p-2 rounded-full ${playerBgLightClass} ${playerBorderClass} border-2 hover:scale-105 transition-transform`}
            onClick={() => setShowSummonMenu(!showSummonMenu)}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className={`w-4 h-4 ${playerColorClass}`} />
          </motion.button>

          {/* Token Menu - Using Portal for proper rendering */}
          {showSummonMenu && createPortal(
            <motion.div
              className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 backdrop-blur-sm"
              style={{ transform: isRotated ? 'rotate(180deg)' : 'none' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className={`bg-card border-2 ${playerBorderClass} rounded-xl shadow-2xl p-4 min-w-[200px]`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold uppercase tracking-wider">Añadir Ficha</span>
                  <button
                    onClick={() => setShowSummonMenu(false)}
                    className="p-1 rounded-full hover:bg-muted transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-1">
                  {TOKEN_TYPES.map(({ type, name, icon: TokenIcon }) => (
                    <button
                      key={type}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-left transition-colors"
                      onClick={() => {
                        onAddToken(type);
                        setShowSummonMenu(false);
                      }}
                    >
                      <TokenIcon className={`w-5 h-5 ${
                        type === 'insect' ? 'text-green-500' :
                        type === 'demon' ? 'text-red-600' :
                        type === 'dwarf' ? 'text-amber-600' :
                        'text-cyan-500'
                      }`} />
                      <span className="font-medium">{name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>,
            document.body
          )}
        </div>
      )}

      {/* Skill Modal - Using Portal to render outside parent transform */}
      {showSkillModal && skill && createPortal(
        <AnimatePresence mode="wait">
          <motion.div
            className="fixed inset-0 z-[9999] flex items-start sm:items-center justify-center bg-black/80 backdrop-blur-md p-2 overflow-y-auto"
            style={{ transform: isRotated ? 'rotate(180deg)' : 'none' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={`relative w-full max-w-[92vw] sm:max-w-[90vw] md:max-w-[700px] bg-card ${playerBorderClass} border-2 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col ${
                isSkillExhausted() ? 'opacity-80 grayscale-[40%]' : ''
              }`}
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 p-1 sm:p-1.5 rounded-full bg-muted/50 hover:bg-muted transition-colors z-10"
                onClick={() => setShowSkillModal(false)}
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              {/* Horizontal Layout for Domain Skills */}
              {isDomainSkill ? (
                <div className="flex flex-col">
                  {/* Compact Header */}
                  <div className={`p-2.5 sm:p-3 ${playerBgLightClass} shrink-0`}>
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className={`p-1.5 sm:p-2 rounded-lg ${isSkillExhausted() ? 'bg-muted' : playerBgClass}`}>
                        <SkillIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${isSkillExhausted() ? 'text-muted-foreground' : 'text-white'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-bold text-sm sm:text-base truncate">{skill.name}</h3>
                        <div className="flex items-center gap-1 sm:gap-1.5 mt-0.5 sm:mt-1">
                          <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                            Dominio
                          </span>
                          <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                            1 Vez
                          </span>
                          <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">
                            Manual
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Horizontal Content Area */}
                  <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 p-2.5 sm:p-3 border-t border-border/50 flex-1 overflow-hidden">
                    {/* Left - Description */}
                    <div className="sm:w-1/2 flex flex-col gap-1.5 sm:gap-2">
                      <p className="text-[11px] sm:text-xs text-foreground/80 whitespace-pre-line leading-relaxed">
                        {skill.description}
                      </p>
                      
                      {/* Life condition warning */}
                      {skill.activationCondition && skill.activationCondition !== 'none' && (
                        <div className={`p-1.5 sm:p-2 rounded-lg border ${
                          meetsLifeCondition() 
                            ? 'bg-green-500/10 border-green-500/30' 
                            : 'bg-red-500/10 border-red-500/30'
                        }`}>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <Heart className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${meetsLifeCondition() ? 'text-green-500' : 'text-red-500'}`} />
                            <span className={`text-[9px] sm:text-[10px] font-medium ${meetsLifeCondition() ? 'text-green-400' : 'text-red-400'}`}>
                              {meetsLifeCondition() 
                                ? `Condición cumplida`
                                : `Requiere: ${getLifeConditionText()}`
                              }
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right - Collapsibles */}
                    {skill.options && skill.options.length > 0 && (
                      <div className="sm:w-1/2 flex flex-col gap-1.5 sm:gap-2">
                        {/* Effects Collapsible */}
                        <button
                          className="w-full flex items-center justify-between p-1.5 sm:p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 transition-colors border border-purple-500/30"
                          onClick={() => setShowDomainEffects(!showDomainEffects)}
                        >
                          <span className="text-[10px] sm:text-xs font-bold text-purple-400 flex items-center gap-1 sm:gap-1.5">
                            <Dices className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            {skill.options.length} Efectos Posibles
                          </span>
                          <motion.div
                            animate={{ rotate: showDomainEffects ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
                          </motion.div>
                        </button>

                        <AnimatePresence>
                          {showDomainEffects && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="space-y-1 pr-1">
                                {skill.options.map((option, index) => (
                                  <div
                                    key={option.id}
                                    className="p-1 sm:p-1.5 rounded-lg bg-purple-500/5 border border-purple-500/20"
                                  >
                                    <div className="flex items-start gap-1 sm:gap-1.5">
                                      <span className="flex-shrink-0 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-purple-500/30 text-purple-400 flex items-center justify-center text-[8px] sm:text-[9px] font-bold">
                                        {index + 1}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-[9px] sm:text-[10px] text-purple-300">
                                          {option.name}
                                        </h4>
                                        <p className="text-[8px] sm:text-[9px] text-muted-foreground leading-tight">
                                          {option.description}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Punishment Collapsible */}
                        {skill.detailedRules && (
                          <>
                            <button
                              className="w-full flex items-center justify-between p-1.5 sm:p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors border border-red-500/30"
                              onClick={() => setShowPunishmentDetails(!showPunishmentDetails)}
                            >
                              <span className="text-[10px] sm:text-xs font-bold text-red-400 flex items-center gap-1 sm:gap-1.5">
                                <Skull className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                Castigos del Dominio
                              </span>
                              <motion.div
                                animate={{ rotate: showPunishmentDetails ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
                              </motion.div>
                            </button>

                            <AnimatePresence>
                              {showPunishmentDetails && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="space-y-1 sm:space-y-1.5">
                                    {skill.detailedRules.punishmentComplete && (
                                      <div className="p-1.5 sm:p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                                        <h4 className="font-bold text-[9px] sm:text-[10px] text-red-400 mb-0.5">
                                          {skill.detailedRules.punishmentComplete.title}
                                        </h4>
                                        <p className="text-[8px] sm:text-[9px] text-red-300/70 mb-0.5 sm:mb-1">
                                          {skill.detailedRules.punishmentComplete.condition}
                                        </p>
                                        <ul className="space-y-0.5">
                                          {skill.detailedRules.punishmentComplete.effects.map((effect, i) => (
                                            <li key={i} className="text-[8px] sm:text-[9px] text-muted-foreground flex items-start gap-1">
                                              <span className="text-red-500">•</span> {effect}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    {skill.detailedRules.punishmentReduced && (
                                      <div className="p-1.5 sm:p-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
                                        <h4 className="font-bold text-[9px] sm:text-[10px] text-orange-400 mb-0.5">
                                          {skill.detailedRules.punishmentReduced.title}
                                        </h4>
                                        <p className="text-[8px] sm:text-[9px] text-orange-300/70 mb-0.5 sm:mb-1">
                                          {skill.detailedRules.punishmentReduced.condition}
                                        </p>
                                        <ul className="space-y-0.5">
                                          {skill.detailedRules.punishmentReduced.effects.map((effect, i) => (
                                            <li key={i} className="text-[8px] sm:text-[9px] text-muted-foreground flex items-start gap-1">
                                              <span className="text-orange-500">•</span> {effect}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="p-2.5 sm:p-3 border-t border-border shrink-0">
                    {isBlockedByTurn() && !isBlockedByLife() && (
                      <div className="w-full py-2 sm:py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 font-display font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                        <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Solo en tu turno
                      </div>
                    )}
                    {isBlockedByLife() && !isBlockedByTurn() && (
                      <div className="w-full py-2 sm:py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-display font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                        <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Requiere {getLifeConditionText()}
                      </div>
                    )}
                    {isBlockedByLife() && isBlockedByTurn() && (
                      <div className="w-full py-2 sm:py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-display font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px]">
                        <Heart className="w-3 h-3" />
                        <Lock className="w-3 h-3" />
                        Vida insuficiente + No es tu turno
                      </div>
                    )}
                    {!isBlockedByTurn() && !isBlockedByLife() && canUseSkill() && !activeDomain && (
                      <motion.button
                        className="w-full py-2.5 sm:py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-display font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg text-xs sm:text-sm"
                        onClick={() => handleUseSkill()}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Activar Dominio
                      </motion.button>
                    )}
                    {activeDomain && (
                      <div className="w-full py-2 sm:py-2.5 rounded-xl bg-purple-600/20 border-2 border-purple-500 text-purple-400 font-display font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Activo: {activeDomain.turnsRemaining} turno{activeDomain.turnsRemaining > 1 ? 's' : ''}
                      </div>
                    )}
                    {!isBlockedByTurn() && !isBlockedByLife() && !canUseSkill() && !activeDomain && (
                      <div className="w-full py-2 sm:py-2.5 rounded-xl bg-muted text-muted-foreground font-display font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                        <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Habilidad Agotada
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Standard Skill Modal - Vertical Layout */
                <>
                  {/* Skill Header */}
                  <div className={`p-3 ${playerBgLightClass} shrink-0`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isSkillExhausted() ? 'bg-muted' : playerBgClass}`}>
                        <SkillIcon className={`w-6 h-6 ${isSkillExhausted() ? 'text-muted-foreground' : 'text-white'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-bold text-base truncate">{skill.name}</h3>
                        <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full ${
                          isSkillExhausted()
                            ? 'bg-muted text-muted-foreground'
                            : skill.usageType === 'once' 
                              ? 'bg-amber-500/20 text-amber-500' 
                              : skill.usageType === 'limited'
                              ? 'bg-purple-500/20 text-purple-500'
                              : 'bg-primary/20 text-primary'
                        }`}>
                          {getUsesText()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="p-3 border-t border-border/50 shrink-0 max-h-[120px] overflow-y-auto">
                    <p className="text-xs text-foreground/80 whitespace-pre-line leading-relaxed">
                      {skill.description}
                    </p>
                  </div>

                  {/* Options List - for skills with options */}
                  {hasOptions && skill.options && (
                    <div className="flex-1 overflow-y-auto p-3 pt-0 space-y-1.5">
                      {/* Cooldown message */}
                      {skill.usageType === 'cooldown' && isSkillOnCooldown() && (
                        <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 mb-1">
                          <div className="flex items-center gap-2 text-cyan-500">
                            <Clock className="w-3 h-3" />
                            <span className="text-xs font-medium">
                              Enfriamiento: {skill.cooldownRemaining} turnos
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Turn blocked message */}
                      {isBlockedByTurn() && (
                        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 mb-1">
                          <div className="flex items-center gap-2 text-amber-500">
                            <Lock className="w-3 h-3" />
                            <span className="text-xs font-medium">
                              Solo usable en tu turno
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {skill.options.map((option, index) => {
                        const isCooldownSkill = skill.usageType === 'cooldown';
                        const isLockedByCooldown = isCooldownSkill && isSkillOnCooldown();
                        const isLockedByTurnOption = isOptionBlockedByTurn(option.id);
                        const isOptionUsed = !isCooldownSkill && option.used;
                        const canUse = isCooldownSkill 
                          ? !isLockedByCooldown && !isBlockedByTurn() 
                          : canUseOption(option);
                        
                        return (
                          <motion.button
                            key={option.id}
                            className={`w-full p-2.5 rounded-lg border-2 text-left transition-all ${
                              isOptionUsed
                                ? 'border-muted bg-muted/30 opacity-50 grayscale cursor-not-allowed'
                                : isLockedByCooldown
                                ? 'border-cyan-500/30 bg-cyan-500/5 opacity-60 cursor-not-allowed'
                                : isLockedByTurnOption || (isCooldownSkill && isBlockedByTurn())
                                ? 'border-amber-500/30 bg-amber-500/5 opacity-60 cursor-not-allowed'
                                : `border-border bg-card/50 hover:${playerBorderClass} hover:${playerBgLightClass}`
                            }`}
                            onClick={() => canUse && handleUseSkill(option.id)}
                            disabled={!canUse}
                            whileHover={canUse ? { scale: 1.01 } : {}}
                            whileTap={canUse ? { scale: 0.99 } : {}}
                          >
                            <div className="flex items-start gap-2">
                              <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                isOptionUsed 
                                  ? 'bg-muted text-muted-foreground' 
                                  : isLockedByCooldown
                                  ? 'bg-cyan-500/20 text-cyan-500'
                                  : isLockedByTurnOption || (isCooldownSkill && isBlockedByTurn())
                                  ? 'bg-amber-500/20 text-amber-500'
                                  : `${playerBgClass} text-white`
                              }`}>
                                {isOptionUsed 
                                  ? <X className="w-2.5 h-2.5" /> 
                                  : isLockedByCooldown 
                                  ? <Clock className="w-2.5 h-2.5" /> 
                                  : isLockedByTurnOption || (isCooldownSkill && isBlockedByTurn())
                                  ? <Lock className="w-2.5 h-2.5" />
                                  : index + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <h4 className={`font-display font-bold text-xs ${
                                  isOptionUsed 
                                    ? 'text-muted-foreground line-through' 
                                    : isLockedByCooldown 
                                    ? 'text-cyan-500/70' 
                                    : isLockedByTurnOption || (isCooldownSkill && isBlockedByTurn())
                                    ? 'text-amber-500/70'
                                    : ''
                                }`}>
                                  {option.name}
                                </h4>
                                <p className={`text-[10px] mt-0.5 ${
                                  isOptionUsed 
                                    ? 'text-muted-foreground/60' 
                                    : isLockedByCooldown 
                                    ? 'text-cyan-500/50' 
                                    : isLockedByTurnOption || (isCooldownSkill && isBlockedByTurn())
                                    ? 'text-amber-500/50'
                                    : 'text-muted-foreground'
                                }`}>
                                  {option.description}
                                </p>
                              </div>
                              {!isOptionUsed && !isLockedByCooldown && !isLockedByTurnOption && !(isCooldownSkill && isBlockedByTurn()) && (
                                <Zap className={`w-3 h-3 ${playerColorClass} flex-shrink-0`} />
                              )}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}

                  {/* Action Button - for skills without options */}
                  {!hasOptions && (
                    <div className="p-3 border-t border-border shrink-0">
                      {isBlockedByTurn() && (
                        <div className="w-full py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 font-display font-bold uppercase tracking-wider text-center flex items-center justify-center gap-2 text-xs">
                          <Lock className="w-4 h-4" />
                          Solo en tu turno
                        </div>
                      )}
                      {!isBlockedByTurn() && canUseSkill() && (
                        <motion.button
                          className={`w-full py-3 rounded-xl ${playerBgClass} text-white font-display font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg text-sm`}
                          onClick={() => handleUseSkill()}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Zap className="w-4 h-4" />
                          Usar Habilidad
                        </motion.button>
                      )}
                      {!isBlockedByTurn() && !canUseSkill() && (
                        <div className="w-full py-2.5 rounded-xl bg-muted text-muted-foreground font-display font-bold uppercase tracking-wider text-center flex items-center justify-center gap-2 text-xs">
                          <X className="w-4 h-4" />
                          {isSkillOnCooldown() ? `Enfriamiento: ${skill.cooldownRemaining} turnos` : 'Habilidad Agotada'}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Exhausted message for skills with options */}
                  {hasOptions && isSkillExhausted() && (
                    <div className="p-3 border-t border-border shrink-0">
                      <div className="w-full py-2.5 rounded-xl bg-muted text-muted-foreground font-display font-bold uppercase tracking-wider text-center text-xs flex items-center justify-center gap-2">
                        <X className="w-3 h-3" />
                        Todos los deseos usados
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* Last Breath Modal */}
      <LastBreathModal
        isOpen={showLastBreathModal}
        onClose={() => setShowLastBreathModal(false)}
        onComplete={handleLastBreathComplete}
        player={player}
        currentLife={life}
      />

      {/* Defeat Overlay */}
      <AnimatePresence>
        {isDefeated && (
          <motion.div
            className="defeat-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-center"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 15 }}
            >
              <span className="text-4xl md:text-5xl font-display font-black text-destructive">
                ¡PERDISTE!
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
