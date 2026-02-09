import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useGameSounds } from '@/hooks/useSound';
import { useDomainMusic } from '@/hooks/useDomainMusic';
import { AVAILABLE_SKILLS, Skill } from '@/components/game/SkillSelection';
import type { DomainPunishment } from '@/components/game/DomainPunishmentModal';
import type { ActiveDomain } from '@/components/game/DomainTracker';
import type { SkillHistoryEntry } from '@/components/game/SkillHistoryPanel';
import type { TokenType, TokenCount } from '@/components/game/TokenCounter';

interface JackpotEffectsState {
  player1: { hasEffect8: boolean; hasEffect9: boolean; overflowingLuck: boolean; isSecondChance: boolean };
  player2: { hasEffect8: boolean; hasEffect9: boolean; overflowingLuck: boolean; isSecondChance: boolean };
}

interface PendingDomain {
  player: 'player1' | 'player2';
  skillId: string;
  skillName: string;
}

interface PendingInsectQueen {
  player: 'player1' | 'player2';
}

interface PendingLuckPassive {
  player: 'player1' | 'player2';
  punishment: DomainPunishment;
  skillName: string;
  luckPercentage: number;
}

interface UseJackpotGameProps {
  gameState: {
    player1: { life: number };
    player2: { life: number };
  };
  activeSkills: { player1: Skill | null; player2: Skill | null };
  setActiveSkills: React.Dispatch<React.SetStateAction<{ player1: Skill | null; player2: Skill | null }>>;
  setLife: (player: 'player1' | 'player2', life: number) => void;
  activeDomains: { player1: ActiveDomain[]; player2: ActiveDomain[] };
  setActiveDomains: React.Dispatch<React.SetStateAction<{ player1: ActiveDomain[]; player2: ActiveDomain[] }>>;
  setSkillHistory: React.Dispatch<React.SetStateAction<{ player1: SkillHistoryEntry[]; player2: SkillHistoryEntry[] }>>;
  setActiveTokens: React.Dispatch<React.SetStateAction<{ player1: TokenCount[]; player2: TokenCount[] }>>;
}

const initialJackpotEffects: JackpotEffectsState = {
  player1: { hasEffect8: false, hasEffect9: false, overflowingLuck: false, isSecondChance: false },
  player2: { hasEffect8: false, hasEffect9: false, overflowingLuck: false, isSecondChance: false },
};

export const useJackpotGame = ({
  gameState,
  activeSkills,
  setActiveSkills,
  setLife,
  activeDomains,
  setActiveDomains,
  setSkillHistory,
  setActiveTokens,
}: UseJackpotGameProps) => {
  const { playSound } = useGameSounds();
  const { toast } = useToast();
  const { stopDomainMusic } = useDomainMusic();

  const [jackpotEffects, setJackpotEffects] = useState<JackpotEffectsState>(initialJackpotEffects);
  const [pendingDomain, setPendingDomain] = useState<PendingDomain | null>(null);
  const [showJackpotModal, setShowJackpotModal] = useState(false);
  const [pendingInsectQueen, setPendingInsectQueen] = useState<PendingInsectQueen | null>(null);
  const [showInsectQueenModal, setShowInsectQueenModal] = useState(false);
  const [pendingPunishment, setPendingPunishment] = useState<DomainPunishment | null>(null);
  const [showPunishmentModal, setShowPunishmentModal] = useState(false);
  const [pendingLuckPassive, setPendingLuckPassive] = useState<PendingLuckPassive | null>(null);
  const [showLuckPassiveModal, setShowLuckPassiveModal] = useState(false);

  const insectsFromQueenRef = useRef<{ player1: boolean; player2: boolean }>({
    player1: false,
    player2: false,
  });

  const handleDomainDiceComplete = useCallback((duration: number, selectedEffectIds: string[], hasEffect8: boolean, hasEffect9: boolean) => {
    if (!pendingDomain) return;

    const { player, skillId, skillName } = pendingDomain;
    const skill = AVAILABLE_SKILLS.find(s => s.id === skillId);

    const effectDetails = selectedEffectIds.map(id => {
      const opt = skill?.options?.find(o => o.id === id);
      return {
        name: opt?.name || id,
        description: opt?.description || '',
      };
    });

    const effectNames = effectDetails.map(e => e.name);
    const hasBothEffects = hasEffect8 && hasEffect9;
    const currentIsSecondChance = jackpotEffects[player].isSecondChance;

    setJackpotEffects(prev => ({
      ...prev,
      [player]: {
        hasEffect8: currentIsSecondChance ? false : hasEffect8,
        hasEffect9: currentIsSecondChance ? false : hasEffect9,
        overflowingLuck: hasBothEffects && !currentIsSecondChance ? true : prev[player].overflowingLuck,
        isSecondChance: currentIsSecondChance,
      },
    }));

    const newDomain: ActiveDomain = {
      id: `${skillId}-${Date.now()}`,
      skillId,
      skillName,
      turnsRemaining: duration,
      activeEffects: effectNames,
      player,
    };

    setActiveDomains(prev => ({
      ...prev,
      [player]: [...prev[player], newDomain],
    }));

    const historyEntry: SkillHistoryEntry = {
      id: `${skillId}-${Date.now()}`,
      skillId,
      skillName,
      timestamp: Date.now(),
      turnsRemaining: duration,
      activeEffects: effectNames,
      effectDescriptions: effectDetails.map(e => `${e.name}: ${e.description}`),
      isActive: true,
    };
    setSkillHistory(prev => ({
      ...prev,
      [player]: [...prev[player], historyEntry],
    }));

    setActiveSkills(prev => {
      const currentSkill = prev[player];
      if (!currentSkill) return prev;

      if (currentSkill.usageType === 'once') {
        return { ...prev, [player]: { ...currentSkill, used: true } };
      } else if (currentSkill.usageType === 'cooldown' && currentSkill.cooldown) {
        return { ...prev, [player]: { ...currentSkill, cooldownRemaining: currentSkill.cooldown } };
      }
      return prev;
    });

    setPendingDomain(null);
    setShowJackpotModal(false);
  }, [pendingDomain, jackpotEffects, setActiveDomains, setSkillHistory, setActiveSkills]);

  const handleInsectQueenComplete = useCallback((poisonedCount: number) => {
    if (!pendingInsectQueen) return;

    const { player } = pendingInsectQueen;
    insectsFromQueenRef.current[player] = true;

    setActiveTokens(prev => {
      const existing = prev[player].find(t => t.type === 'insect');
      if (existing) {
        return {
          ...prev,
          [player]: prev[player].map(t =>
            t.type === 'insect' ? { ...t, count: t.count + poisonedCount } : t
          ),
        };
      }
      return {
        ...prev,
        [player]: [...prev[player], { type: 'insect' as TokenType, count: poisonedCount }],
      };
    });

    setActiveSkills(prev => {
      const currentSkill = prev[player];
      if (!currentSkill) return prev;
      return { ...prev, [player]: { ...currentSkill, used: true } };
    });

    toast({
      title: `🐛 ¡Insectos invocados!`,
      description: `${poisonedCount} ficha${poisonedCount > 1 ? 's' : ''} insecto con +${poisonedCount} de ataque.`,
    });

    playSound('skillActivate');
    setPendingInsectQueen(null);
    setShowInsectQueenModal(false);
  }, [pendingInsectQueen, setActiveTokens, setActiveSkills, toast, playSound]);

  const handleTryLuck = useCallback((punishment: DomainPunishment) => {
    setShowPunishmentModal(false);

    if (punishment.isSecondChance) {
      const player = punishment.player;
      const playerLabel = player === 'player1' ? 'Jugador 1' : 'Jugador 2';

      stopDomainMusic();
      setLife(player, 0);

      setJackpotEffects(prev => ({
        ...prev,
        [player]: { hasEffect8: false, hasEffect9: false, overflowingLuck: false, isSecondChance: false },
      }));

      playSound('defeat');

      toast({
        title: '💀 Segunda Oportunidad Agotada',
        description: `${playerLabel} ha perdido. El dominio terminó sin victoria.`,
      });

      return;
    }

    setPendingLuckPassive({
      player: punishment.player,
      punishment,
      skillName: punishment.domainName,
      luckPercentage: punishment.luckPercentage ?? 25,
    });
    setShowLuckPassiveModal(true);
  }, [stopDomainMusic, playSound, toast, setLife]);

  const handleLuckPassiveResult = useCallback((success: boolean) => {
    if (!pendingLuckPassive) return;

    const { punishment, skillName, player } = pendingLuckPassive;
    const playerLabel = player === 'player1' ? 'Jugador 1' : 'Jugador 2';

    setPendingLuckPassive(null);
    setShowLuckPassiveModal(false);
    stopDomainMusic();

    if (success) {
      toast({
        title: `🍀 ¡Pasiva de Suerte Activada!`,
        description: `${playerLabel} anuló el castigo de ${skillName}. La habilidad puede reactivarse.`,
      });

      setActiveSkills(prev => {
        const currentSkill = prev[player];
        if (!currentSkill) return prev;
        return { ...prev, [player]: { ...currentSkill, used: false } };
      });

      setJackpotEffects(prev => ({
        ...prev,
        [player]: { hasEffect8: false, hasEffect9: false, overflowingLuck: prev[player].overflowingLuck, isSecondChance: false },
      }));

      playSound('skillActivate');
      return;
    }

    const { skillId, punishmentType, hasEffect8 } = punishment;

    let effectiveType = punishmentType;
    if (hasEffect8) {
      if (punishmentType === 'complete') {
        effectiveType = 'reduced';
      } else if (punishmentType === 'reduced') {
        effectiveType = 'canceled';
      }
    }

    if (effectiveType === 'canceled') {
      toast({
        title: '🍀 ¡Reescritura del Azar!',
        description: `${playerLabel}: El Efecto 8 anuló el castigo. ¡La habilidad puede reactivarse!`,
      });

      playSound('skillActivate');

      setActiveSkills(prev => {
        const currentSkill = prev[player];
        if (!currentSkill) return prev;
        return { ...prev, [player]: { ...currentSkill, used: false } };
      });

      setJackpotEffects(prev => ({
        ...prev,
        [player]: { hasEffect8: false, hasEffect9: false, overflowingLuck: prev[player].overflowingLuck, isSecondChance: false },
      }));
      return;
    }

    const isSecondChance = jackpotEffects[player].isSecondChance;
    const opponent = player === 'player1' ? 'player2' : 'player1';
    const opponentLife = gameState[opponent].life;

    if (skillId === 'jackpot') {
      if (effectiveType === 'complete' || isSecondChance) {
        if (opponentLife > 0) {
          setLife(player, 0);
          toast({
            title: isSecondChance ? '💀 ¡Segunda Oportunidad Fallida!' : '☠️ Castigo Jackpot Completo',
            description: isSecondChance
              ? `${playerLabel}: El segundo Jackpot terminó sin ganar. ¡Derrota automática!`
              : `${playerLabel}: Castigo completo aplicado. ¡Derrota automática!`,
            variant: 'destructive',
          });
        }

        setJackpotEffects(prev => ({
          ...prev,
          [player]: { hasEffect8: false, hasEffect9: false, overflowingLuck: false, isSecondChance: false },
        }));
      } else {
        setLife(player, 5);
        toast({
          title: '🟠 Castigo Reducido Aplicado',
          description: `${playerLabel}: Vida reducida a 5. Descarta tu mano. ¡Última oportunidad con Jackpot!`,
          variant: 'destructive',
        });

        setActiveSkills(prev => {
          const currentSkill = prev[player];
          if (!currentSkill) return prev;
          return { ...prev, [player]: { ...currentSkill, used: false } };
        });

        setJackpotEffects(prev => ({
          ...prev,
          [player]: { hasEffect8: false, hasEffect9: false, overflowingLuck: false, isSecondChance: true },
        }));
      }
    }

    playSound('defeat');
  }, [pendingLuckPassive, toast, playSound, setLife, stopDomainMusic, jackpotEffects, gameState, setActiveSkills]);

  const applyPunishment = useCallback((punishment: DomainPunishment) => {
    const { player, skillId, punishmentType, hasEffect8 } = punishment;
    const playerLabel = player === 'player1' ? 'Jugador 1' : 'Jugador 2';

    let effectiveType = punishmentType;
    if (hasEffect8) {
      if (punishmentType === 'complete') {
        effectiveType = 'reduced';
      } else if (punishmentType === 'reduced') {
        effectiveType = 'canceled';
      }
    }

    if (effectiveType === 'canceled') {
      toast({
        title: '🍀 ¡Reescritura del Azar!',
        description: `${playerLabel}: El Efecto 8 anuló el castigo. ¡La habilidad puede reactivarse!`,
      });

      playSound('skillActivate');

      setActiveSkills(prev => {
        const currentSkill = prev[player];
        if (!currentSkill) return prev;
        return { ...prev, [player]: { ...currentSkill, used: false } };
      });

      setJackpotEffects(prev => ({
        ...prev,
        [player]: { hasEffect8: false, hasEffect9: false, overflowingLuck: prev[player].overflowingLuck, isSecondChance: false },
      }));
      return;
    }

    if (skillId === 'jackpot') {
      if (effectiveType === 'complete') {
        setLife(player, 1);
        toast({
          title: '☠️ Castigo Jackpot Aplicado',
          description: `${playerLabel}: Vida reducida a 1. Descarta mano, mazo y descarte.`,
          variant: 'destructive',
        });
      } else {
        setLife(player, 5);
        toast({
          title: '🟠 Castigo Reducido Aplicado',
          description: `${playerLabel}: Vida reducida a 5. Descarta tu mano. Puedes activar Jackpot una vez más.`,
          variant: 'destructive',
        });

        setActiveSkills(prev => {
          const currentSkill = prev[player];
          if (!currentSkill) return prev;
          return { ...prev, [player]: { ...currentSkill, used: false } };
        });
      }
    }

    setJackpotEffects(prev => ({
      ...prev,
      [player]: { hasEffect8: false, hasEffect9: false, overflowingLuck: prev[player].overflowingLuck, isSecondChance: false },
    }));

    playSound('defeat');
  }, [setLife, toast, playSound, setActiveSkills]);

  const resetJackpot = useCallback(() => {
    setJackpotEffects(initialJackpotEffects);
    setPendingDomain(null);
    setShowJackpotModal(false);
    setPendingInsectQueen(null);
    setShowInsectQueenModal(false);
    setPendingPunishment(null);
    setShowPunishmentModal(false);
    setPendingLuckPassive(null);
    setShowLuckPassiveModal(false);
    insectsFromQueenRef.current = { player1: false, player2: false };
  }, []);

  return {
    state: {
      jackpotEffects,
      pendingDomain,
      showJackpotModal,
      pendingInsectQueen,
      showInsectQueenModal,
      pendingPunishment,
      showPunishmentModal,
      pendingLuckPassive,
      showLuckPassiveModal,
      insectsFromQueenRef,
    },
    actions: {
      handleDomainDiceComplete,
      handleInsectQueenComplete,
      handleTryLuck,
      handleLuckPassiveResult,
      applyPunishment,
      resetJackpot,
      setJackpotEffects,
      setPendingDomain,
      setShowJackpotModal,
      setPendingInsectQueen,
      setShowInsectQueenModal,
      setPendingPunishment,
      setShowPunishmentModal,
      setPendingLuckPassive,
      setShowLuckPassiveModal,
    },
  };
};
