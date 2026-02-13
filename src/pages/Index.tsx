import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { SetupScreen } from '@/components/game/SetupScreen';
import { GameScreen } from '@/components/game/GameScreen';
import { DiceRoll } from '@/components/game/DiceRoll';
import { SkillSelection, Skill, AVAILABLE_SKILLS } from '@/components/game/SkillSelection';
import { GameModalsContainer } from '@/components/game/GameModalsContainer';
import { useGameState } from '@/hooks/useGameState';
import { useGameSounds } from '@/hooks/useSound';
import { useDomainMusic } from '@/hooks/useDomainMusic';
import { useToast } from '@/hooks/use-toast';
import { useWitchCoven } from '@/hooks/useWitchCoven';
import { useJackpotGame } from '@/hooks/useJackpotGame';
import { useGameColors } from '@/hooks/useGameColors';
import { getColorHsl } from '@/components/game/SettingsModal';
import type { ActiveSummon } from '@/components/game/SummonTracker';
import type { TokenCount, TokenType } from '@/components/game/TokenCounter';
import type { ActiveDomain } from '@/components/game/DomainTracker';
import type { SkillHistoryEntry } from '@/components/game/SkillHistoryPanel';
import type { WitchCovenState } from '@/components/game/WitchCovenModal';

type GamePhase = 'setup' | 'dice' | 'skills' | 'game';

const SKILL_SUMMON_MAP: Record<string, { type: 'summon' | 'token'; summonType?: ActiveSummon['type']; tokenType?: TokenType }> = {
  'dragon-tamer': { type: 'summon', summonType: 'dragon' },
  'hero-strike': { type: 'summon', summonType: 'hero' },
  'jotunheimr-gate': { type: 'summon', summonType: 'giant' },
  'insect-queen': { type: 'token', tokenType: 'insect' },
  'hell-gates': { type: 'token', tokenType: 'demon' },
};

interface PendingGame {
  life: number;
  timerMinutes: number | null;
  skillsMode: boolean;
  startingPlayer?: 'player1' | 'player2';
  diceWinner?: 'player1' | 'player2';
  player1Skills?: Skill[];
  player2Skills?: Skill[];
  playerColors?: { player1: string; player2: string };
}

const Index = () => {
  const [currentPhase, setCurrentPhase] = useState<GamePhase>('setup');
  const [pendingGame, setPendingGame] = useState<PendingGame | null>(null);
  const [playerColors, setPlayerColors] = useState<{ player1: string; player2: string }>({ player1: 'gold', player2: 'blue' });
  const [activeSkills, setActiveSkills] = useState<{ player1: Skill | null; player2: Skill | null }>({ player1: null, player2: null });
  const [activeSummons, setActiveSummons] = useState<{ player1: ActiveSummon[]; player2: ActiveSummon[] }>({ player1: [], player2: [] });
  const [activeTokens, setActiveTokens] = useState<{ player1: TokenCount[]; player2: TokenCount[] }>({ player1: [], player2: [] });
  const [activeDomains, setActiveDomains] = useState<{ player1: ActiveDomain[]; player2: ActiveDomain[] }>({ player1: [], player2: [] });
  const [skillHistory, setSkillHistory] = useState<{ player1: SkillHistoryEntry[]; player2: SkillHistoryEntry[] }>({ player1: [], player2: [] });

  const insectsFromQueenRef = useRef<{ player1: boolean; player2: boolean }>({ player1: false, player2: false });

  const { playSound } = useGameSounds();
  const { playDomainMusic, stopDomainMusic } = useDomainMusic();
  const { toast } = useToast();

  const {
    gameState, startGame, updateLife, setLife,
    advancePhase, passPhase, endTurn,
    toggleTimer, resetTimer, resetGame, exitToSetup,
  } = useGameState();

  // Initialize reactive color system at root level so ALL screens (dice, skills, game) use selected colors
  useGameColors({
    player1Color: playerColors.player1,
    player2Color: playerColors.player2,
    currentPlayer: gameState.currentPlayer,
  });

  // Use extracted hooks
  const witchCoven = useWitchCoven({
    gameState,
    activeSkills,
    setActiveSkills,
    setActiveDomains,
    updateLife,
  });

  const jackpot = useJackpotGame({
    gameState,
    activeSkills,
    setActiveSkills,
    setLife,
    activeDomains,
    setActiveDomains,
    setSkillHistory,
    setActiveTokens,
  });

  // Domain music control - play when jackpot domain is active, stop when it ends
  useEffect(() => {
    const hasActiveJackpot = activeDomains.player1.some(d => d.skillId === 'jackpot') ||
                             activeDomains.player2.some(d => d.skillId === 'jackpot');
    if (hasActiveJackpot) {
      playDomainMusic('jackpot');
    } else {
      stopDomainMusic();
    }
  }, [activeDomains, playDomainMusic, stopDomainMusic]);

  const handleSetupComplete = useCallback((life: number, timerMinutes: number | null, skillsMode: boolean, colors?: { player1: string; player2: string }) => {
    setPendingGame({ life, timerMinutes, skillsMode, playerColors: colors });
    if (colors) setPlayerColors(colors);
    setCurrentPhase('dice');
  }, []);

  const handleDiceComplete = useCallback((startingPlayer: 'player1' | 'player2', diceWinner: 'player1' | 'player2') => {
    if (!pendingGame) return;
    if (pendingGame.skillsMode) {
      setPendingGame({ ...pendingGame, startingPlayer, diceWinner });
      setCurrentPhase('skills');
    } else {
      startGame(pendingGame.life, pendingGame.timerMinutes, startingPlayer);
      setActiveSkills({ player1: null, player2: null });
      setPendingGame(null);
      setCurrentPhase('game');
    }
  }, [pendingGame, startGame]);

  const handleSkillsComplete = useCallback((player1Skills: Skill[], player2Skills: Skill[]) => {
    if (pendingGame?.startingPlayer) {
      startGame(pendingGame.life, pendingGame.timerMinutes, pendingGame.startingPlayer);
      setActiveSkills({ player1: player1Skills[0] || null, player2: player2Skills[0] || null });
      setPendingGame(null);
      setCurrentPhase('game');
    }
  }, [pendingGame, startGame]);

  // Handle skill activation
  const handleUseSkill = useCallback((player: 'player1' | 'player2', optionId?: string) => {
    const skill = activeSkills[player];
    if (!skill) return;

    if (skill.id === 'jackpot') {
      jackpot.actions.setPendingDomain({ player, skillId: skill.id, skillName: skill.name });
      jackpot.actions.setShowJackpotModal(true);
      return;
    }

    if (skill.id === 'witch-coven') {
      const playerTurnCount = player === 'player1' ? gameState.player1TurnCount : gameState.player2TurnCount;
      if (playerTurnCount >= 5 && !witchCoven.state.witchCovenState[player].isActive) {
        witchCoven.actions.handleActivateWitchCoven(player);
        witchCoven.actions.setWitchCovenState(prev => ({
          ...prev,
          [player]: { ...prev[player], isActive: true, activatedTurn: playerTurnCount },
        }));
      }
      witchCoven.actions.handleOpenWitchCovenModal(player);
      return;
    }

    if (skill.id === 'insect-queen') {
      jackpot.actions.setPendingInsectQueen({ player });
      jackpot.actions.setShowInsectQueenModal(true);
      return;
    }

    const autoGen = SKILL_SUMMON_MAP[skill.id];
    if (autoGen) {
      if (autoGen.type === 'summon' && autoGen.summonType) {
        const newSummon: ActiveSummon = {
          id: `${autoGen.summonType}-${Date.now()}`,
          type: autoGen.summonType,
          name: autoGen.summonType === 'dragon' ? 'Dragón' : autoGen.summonType === 'hero' ? 'Héroe' : 'Gigante',
          ...(autoGen.summonType === 'dragon' ? { deathCounter: 3, attackBonus: 0 } : {}),
        };
        setActiveSummons(prev => ({ ...prev, [player]: [...prev[player], newSummon] }));
        toast({ title: `🎯 ¡${newSummon.name} invocado!`, description: `${player === 'player1' ? 'Jugador 1' : 'Jugador 2'} ha invocado un ${newSummon.name}.` });
      } else if (autoGen.type === 'token' && autoGen.tokenType === 'demon') {
        setActiveTokens(prev => {
          const existing = prev[player].find(t => t.type === 'demon');
          if (existing) return { ...prev, [player]: prev[player].map(t => t.type === 'demon' ? { ...t, count: t.count + 1 } : t) };
          return { ...prev, [player]: [...prev[player], { type: 'demon' as TokenType, count: 1 }] };
        });
        toast({ title: `👹 ¡Demonio invocado!`, description: `${player === 'player1' ? 'Jugador 1' : 'Jugador 2'} ha invocado un Demonio desde el averno.` });
      }
    }

    setActiveSkills(prev => {
      const currentSkill = prev[player];
      if (!currentSkill) return prev;

      if (currentSkill.usageType === 'cooldown' && currentSkill.options && optionId) {
        return { ...prev, [player]: { ...currentSkill, cooldownRemaining: currentSkill.cooldown } };
      }

      if (currentSkill.options && optionId) {
        const updatedOptions = currentSkill.options.map(opt => opt.id === optionId ? { ...opt, used: true } : opt);
        const usedCount = updatedOptions.filter(opt => opt.used).length;
        const remaining = (currentSkill.maxUses ?? currentSkill.options.length) - usedCount;
        return { ...prev, [player]: { ...currentSkill, options: updatedOptions, usesRemaining: remaining, used: remaining <= 0 } };
      }

      if (currentSkill.usageType === 'once') return { ...prev, [player]: { ...currentSkill, used: true } };
      if (currentSkill.usageType === 'limited' && currentSkill.maxUses) {
        const remaining = (currentSkill.usesRemaining ?? currentSkill.maxUses) - 1;
        return { ...prev, [player]: { ...currentSkill, usesRemaining: remaining, used: remaining <= 0 } };
      }
      if (currentSkill.usageType === 'cooldown' && currentSkill.cooldown) {
        return { ...prev, [player]: { ...currentSkill, cooldownRemaining: currentSkill.cooldown } };
      }
      return prev;
    });
  }, [activeSkills, gameState, witchCoven, jackpot, toast]);

  const reduceCooldowns = useCallback(() => {
    setActiveSkills(prev => {
      const update = (skill: Skill | null): Skill | null => {
        if (!skill || skill.usageType !== 'cooldown' || !skill.cooldownRemaining || skill.cooldownRemaining <= 0) return skill;
        return { ...skill, cooldownRemaining: Math.max(0, skill.cooldownRemaining - 1) };
      };
      return { player1: update(prev.player1), player2: update(prev.player2) };
    });
  }, []);

  const decrementDomainTurns = useCallback((playerEnding: 'player1' | 'player2') => {
    let secondChanceDefeatApplied = false;

    (['player1', 'player2'] as const).forEach(player => {
      activeDomains[player].forEach(domain => {
        if (domain.turnsRemaining - 1 <= 0) {
          const playerEffects = jackpot.state.jackpotEffects[domain.player];
          if (playerEffects.isSecondChance) {
            const opponent = domain.player === 'player1' ? 'player2' : 'player1';
            if (gameState[opponent].life > 0) {
              stopDomainMusic();
              setLife(domain.player, 0);
              toast({ title: '💀 ¡Segunda Oportunidad Fallida!', description: `${domain.player === 'player1' ? 'Jugador 1' : 'Jugador 2'}: Derrota automática.`, variant: 'destructive' });
            }
            jackpot.actions.setJackpotEffects(prev => ({ ...prev, [domain.player]: { hasEffect8: false, hasEffect9: false, overflowingLuck: false, isSecondChance: false } }));
            setSkillHistory(prev => ({ ...prev, [domain.player]: prev[domain.player].map(h => h.skillId === domain.skillId ? { ...h, isActive: false, turnsRemaining: 0 } : h) }));
            secondChanceDefeatApplied = true;
          }
        }
      });
    });

    if (secondChanceDefeatApplied) {
      setActiveDomains(prev => ({ player1: prev.player1.filter(d => d.turnsRemaining > 1), player2: prev.player2.filter(d => d.turnsRemaining > 1) }));
      return;
    }

    setActiveDomains(prev => {
      const updated: { player1: ActiveDomain[]; player2: ActiveDomain[] } = { player1: [], player2: [] };
      (['player1', 'player2'] as const).forEach(player => {
        prev[player].forEach(domain => {
          const newTurns = domain.turnsRemaining - 1;
          if (newTurns <= 0) {
            const playerEffects = jackpot.state.jackpotEffects[domain.player];
            if (playerEffects.isSecondChance) return;

            const endedOnOwnTurn = domain.player === playerEnding;
            const punishmentType = endedOnOwnTurn ? 'complete' : 'reduced';
            playSound('phase');

            let luckPercentage = 25;
            if (playerEffects.hasEffect9) {
              luckPercentage = 100;
            } else if (playerEffects.overflowingLuck) {
              luckPercentage = 100;
              jackpot.actions.setJackpotEffects(prev => ({ ...prev, [domain.player]: { ...prev[domain.player], overflowingLuck: false } }));
            }

            const punishment = {
              domainId: domain.id, domainName: domain.skillName, skillId: domain.skillId,
              player: domain.player, endedOnOwnTurn, punishmentType: punishmentType as 'complete' | 'reduced',
              hasEffect8: playerEffects.hasEffect8, hasEffect9: playerEffects.hasEffect9,
              luckPercentage, isSecondChance: playerEffects.isSecondChance,
            };

            jackpot.actions.setPendingPunishment(punishment);
            jackpot.actions.setShowPunishmentModal(true);
            setSkillHistory(prev => ({ ...prev, [domain.player]: prev[domain.player].map(h => h.skillId === domain.skillId ? { ...h, isActive: false, turnsRemaining: 0 } : h) }));
          } else {
            updated[player].push({ ...domain, turnsRemaining: newTurns });
            setSkillHistory(prev => ({ ...prev, [domain.player]: prev[domain.player].map(h => h.skillId === domain.skillId && h.isActive ? { ...h, turnsRemaining: newTurns } : h) }));
          }
        });
      });
      return updated;
    });
  }, [activeDomains, jackpot.state.jackpotEffects, jackpot.actions, gameState, stopDomainMusic, setLife, toast, playSound]);

  const handleApplyDamage = useCallback((targetPlayer: 'player1' | 'player2', damage: number, sourceSkillId?: string) => {
    const isLethal = gameState[targetPlayer].life - damage <= 0;
    const targetSkill = activeSkills[targetPlayer];
    if (isLethal && targetSkill?.id === 'last-breath' && !targetSkill.used && sourceSkillId !== 'last-breath') {
      toast({ title: '⚠️ ¡Contraataque Desesperado Activado!', description: `${targetPlayer === 'player1' ? 'Jugador 1' : 'Jugador 2'} activa su Contraataque ante el daño letal.` });
    }
    updateLife(targetPlayer, -damage);
  }, [gameState, activeSkills, toast, updateLife]);

  const updateDragonCounters = useCallback((currentPlayer: 'player1' | 'player2') => {
    const previousPlayer = currentPlayer === 'player1' ? 'player2' : 'player1';
    setActiveSummons(prev => {
      const updateSummons = (summons: ActiveSummon[], isOwner: boolean): ActiveSummon[] =>
        summons.map(s => s.type === 'dragon' && isOwner ? { ...s, deathCounter: Math.max(0, (s.deathCounter ?? 3) - 1), attackBonus: (s.attackBonus ?? 0) + 2 } : s);
      return { player1: updateSummons(prev.player1, previousPlayer === 'player1'), player2: updateSummons(prev.player2, previousPlayer === 'player2') };
    });

    setTimeout(() => {
      setActiveSummons(prev => {
        const hasDead = (['player1', 'player2'] as const).some(p => prev[p].some(s => s.type === 'dragon' && (s.deathCounter ?? 1) <= 0));
        if (hasDead) {
          (['player1', 'player2'] as const).forEach(p => {
            if (prev[p].some(s => s.type === 'dragon' && (s.deathCounter ?? 1) <= 0)) {
              playSound('defeat');
              toast({ title: "🐉 ¡El Dragón ha muerto!", description: `El Dragón de ${p === 'player1' ? 'Jugador 1' : 'Jugador 2'} ha sido destruido.`, variant: "destructive" });
            }
          });
          return { player1: prev.player1.filter(s => !(s.type === 'dragon' && (s.deathCounter ?? 1) <= 0)), player2: prev.player2.filter(s => !(s.type === 'dragon' && (s.deathCounter ?? 1) <= 0)) };
        }
        return prev;
      });
    }, 100);
  }, [playSound, toast]);

  const autoRemoveEndOfTurnEntities = useCallback((playerEnding: 'player1' | 'player2') => {
    const playerLabel = playerEnding === 'player1' ? 'Jugador 1' : 'Jugador 2';
    const summons = activeSummons[playerEnding];
    const tokens = activeTokens[playerEnding];

    const hasHero = summons.some(s => s.type === 'hero');
    if (hasHero) {
      setActiveSummons(prev => ({ ...prev, [playerEnding]: prev[playerEnding].filter(s => s.type !== 'hero') }));
      playSound('defeat');
      toast({ title: "⚔️ Héroe destruido", description: `El Héroe de ${playerLabel} ha sido destruido al final del turno.`, variant: "destructive" });
    }

    const hasInsects = tokens.some(t => t.type === 'insect');
    if (hasInsects && insectsFromQueenRef.current[playerEnding]) {
      setActiveTokens(prev => ({ ...prev, [playerEnding]: prev[playerEnding].filter(t => t.type !== 'insect') }));
      insectsFromQueenRef.current[playerEnding] = false;
      setTimeout(() => {
        playSound('defeat');
        toast({ title: "🐛 Insectos destruidos", description: `Los Insectos de ${playerLabel} (Reina Insecto) han sido destruidos al final del turno.`, variant: "destructive" });
      }, hasHero ? 500 : 0);
    }
  }, [activeSummons, activeTokens, playSound, toast]);

  const handleEndTurnWithCooldown = useCallback(() => {
    const current = gameState.currentPlayer;
    const next = current === 'player1' ? 'player2' : 'player1';
    autoRemoveEndOfTurnEntities(current);
    witchCoven.actions.reduceWitchCovenCooldowns(current);
    endTurn();
    reduceCooldowns();
    updateDragonCounters(next);
    decrementDomainTurns(current);
  }, [gameState.currentPlayer, autoRemoveEndOfTurnEntities, witchCoven.actions, endTurn, reduceCooldowns, updateDragonCounters, decrementDomainTurns]);

  const handlePassPhaseWithCooldown = useCallback(() => {
    const current = gameState.currentPlayer;
    const next = current === 'player1' ? 'player2' : 'player1';
    autoRemoveEndOfTurnEntities(current);
    witchCoven.actions.reduceWitchCovenCooldowns(current);
    passPhase();
    reduceCooldowns();
    updateDragonCounters(next);
    decrementDomainTurns(current);
  }, [gameState.currentPlayer, autoRemoveEndOfTurnEntities, witchCoven.actions, passPhase, reduceCooldowns, updateDragonCounters, decrementDomainTurns]);

  // Summon/Token/Domain management
  const handleAddSummon = useCallback((player: 'player1' | 'player2', summon: Omit<ActiveSummon, 'id'>) => {
    setActiveSummons(prev => ({ ...prev, [player]: [...prev[player], { ...summon, id: `${summon.type}-${Date.now()}` }] }));
  }, []);

  const handleUpdateSummon = useCallback((player: 'player1' | 'player2', summonId: string, updates: Partial<ActiveSummon>) => {
    setActiveSummons(prev => ({ ...prev, [player]: prev[player].map(s => s.id === summonId ? { ...s, ...updates } : s) }));
  }, []);

  const handleRemoveSummon = useCallback((player: 'player1' | 'player2', summonId: string) => {
    setActiveSummons(prev => ({ ...prev, [player]: prev[player].filter(s => s.id !== summonId) }));
  }, []);

  const handleAddToken = useCallback((player: 'player1' | 'player2', type: TokenType) => {
    setActiveTokens(prev => {
      const existing = prev[player].find(t => t.type === type);
      if (existing) return { ...prev, [player]: prev[player].map(t => t.type === type ? { ...t, count: t.count + 1 } : t) };
      return { ...prev, [player]: [...prev[player], { type, count: 1 }] };
    });
  }, []);

  const handleUpdateToken = useCallback((player: 'player1' | 'player2', type: TokenType, count: number) => {
    if (count <= 0) { handleRemoveToken(player, type); return; }
    setActiveTokens(prev => ({ ...prev, [player]: prev[player].map(t => t.type === type ? { ...t, count } : t) }));
  }, []);

  const handleRemoveToken = useCallback((player: 'player1' | 'player2', type: TokenType) => {
    if (type === 'insect') insectsFromQueenRef.current[player] = false;
    setActiveTokens(prev => ({ ...prev, [player]: prev[player].filter(t => t.type !== type) }));
  }, []);

  const handleUpdateDomain = useCallback((player: 'player1' | 'player2', domainId: string, turnsRemaining: number) => {
    setActiveDomains(prev => ({ ...prev, [player]: prev[player].map(d => d.id === domainId ? { ...d, turnsRemaining } : d) }));
  }, []);

  const handleRemoveDomain = useCallback((player: 'player1' | 'player2', domainId: string) => {
    setActiveDomains(prev => ({ ...prev, [player]: prev[player].filter(d => d.id !== domainId) }));
  }, []);

  const resetAllState = useCallback(() => {
    setActiveSkills({ player1: null, player2: null });
    setActiveSummons({ player1: [], player2: [] });
    setActiveTokens({ player1: [], player2: [] });
    setActiveDomains({ player1: [], player2: [] });
    setSkillHistory({ player1: [], player2: [] });
    jackpot.actions.resetJackpot();
    witchCoven.actions.resetWitchCoven();
    insectsFromQueenRef.current = { player1: false, player2: false };
  }, [jackpot.actions, witchCoven.actions]);

  const handleExitGame = useCallback(() => {
    stopDomainMusic();
    exitToSetup();
    resetAllState();
    setCurrentPhase('setup');
  }, [stopDomainMusic, exitToSetup, resetAllState]);

  const handleResetGame = useCallback(() => {
    stopDomainMusic();
    setPendingGame({
      life: gameState.initialLife,
      timerMinutes: gameState.timerDuration > 0 ? gameState.timerDuration / 60 : null,
      skillsMode: activeSkills.player1 !== null || activeSkills.player2 !== null || (pendingGame?.skillsMode ?? false),
    });
    resetAllState();
    setCurrentPhase('dice');
  }, [stopDomainMusic, gameState, activeSkills, pendingGame, resetAllState]);

  // Punishment canceled handler
  const handlePunishmentCanceled = useCallback((punishment: any) => {
    if (!punishment.hasEffect8 || punishment.punishmentType !== 'reduced' || punishment.skillId !== 'jackpot') return;
    const player = punishment.player;
    stopDomainMusic();
    toast({ title: '🍀 ¡Reescritura del Azar!', description: `${player === 'player1' ? 'Jugador 1' : 'Jugador 2'}: El Efecto 8 anuló el castigo. ¡Jackpot se reactiva!` });
    setActiveSkills(prev => {
      const s = prev[player];
      if (!s) return prev;
      return { ...prev, [player]: { ...s, used: false } };
    });
    jackpot.actions.setJackpotEffects(prev => ({
      ...prev,
      [player]: { hasEffect8: false, hasEffect9: false, overflowingLuck: prev[player].overflowingLuck, isSecondChance: false },
    }));
  }, [stopDomainMusic, toast, jackpot.actions]);

  // Memoize color HSLs
  const p1ColorHsl = useMemo(() => getColorHsl(playerColors.player1), [playerColors.player1]);
  const p2ColorHsl = useMemo(() => getColorHsl(playerColors.player2), [playerColors.player2]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      <AnimatePresence mode="wait">
        {currentPhase === 'setup' && <SetupScreen key="setup" onStart={handleSetupComplete} />}
        {currentPhase === 'dice' && <DiceRoll key="dice" onComplete={handleDiceComplete} />}
        {currentPhase === 'skills' && pendingGame && (
          <SkillSelection key="skills" onComplete={handleSkillsComplete} diceWinner={pendingGame.diceWinner} />
        )}
        {currentPhase === 'game' && gameState.gameStarted && (
          <GameScreen
            key="game"
            gameState={gameState}
            onUpdateLife={updateLife}
            onSetLife={setLife}
            onAdvancePhase={advancePhase}
            onPassPhase={handlePassPhaseWithCooldown}
            onEndTurn={handleEndTurnWithCooldown}
            onToggleTimer={toggleTimer}
            onResetTimer={resetTimer}
            onResetGame={handleResetGame}
            onExitGame={handleExitGame}
            player1Skill={activeSkills.player1}
            player2Skill={activeSkills.player2}
            onUseSkill={handleUseSkill}
            onApplyDamage={handleApplyDamage}
            player1Summons={activeSummons.player1}
            player2Summons={activeSummons.player2}
            onAddSummon={handleAddSummon}
            onUpdateSummon={handleUpdateSummon}
            onRemoveSummon={handleRemoveSummon}
            player1Tokens={activeTokens.player1}
            player2Tokens={activeTokens.player2}
            onAddToken={handleAddToken}
            onUpdateToken={handleUpdateToken}
            onRemoveToken={handleRemoveToken}
            player1Domains={activeDomains.player1}
            player2Domains={activeDomains.player2}
            onUpdateDomain={handleUpdateDomain}
            onRemoveDomain={handleRemoveDomain}
            player1SkillHistory={skillHistory.player1}
            player2SkillHistory={skillHistory.player2}
            player1Color={p1ColorHsl}
            player2Color={p2ColorHsl}
            player1HasOverflowingLuck={jackpot.state.jackpotEffects.player1.overflowingLuck}
            player2HasOverflowingLuck={jackpot.state.jackpotEffects.player2.overflowingLuck}
            player1IsSecondChance={jackpot.state.jackpotEffects.player1.isSecondChance}
            player2IsSecondChance={jackpot.state.jackpotEffects.player2.isSecondChance}
          />
        )}
      </AnimatePresence>

      <GameModalsContainer
        pendingDomain={jackpot.state.pendingDomain}
        showJackpotModal={jackpot.state.showJackpotModal}
        onCloseJackpot={() => { jackpot.actions.setShowJackpotModal(false); jackpot.actions.setPendingDomain(null); }}
        onJackpotComplete={jackpot.actions.handleDomainDiceComplete}
        jackpotIsSecondChance={jackpot.state.pendingDomain ? jackpot.state.jackpotEffects[jackpot.state.pendingDomain.player].isSecondChance : false}
        pendingInsectQueen={jackpot.state.pendingInsectQueen}
        showInsectQueenModal={jackpot.state.showInsectQueenModal}
        onCloseInsectQueen={() => { jackpot.actions.setShowInsectQueenModal(false); jackpot.actions.setPendingInsectQueen(null); }}
        onInsectQueenComplete={jackpot.actions.handleInsectQueenComplete}
        showPunishmentModal={jackpot.state.showPunishmentModal}
        pendingPunishment={jackpot.state.pendingPunishment}
        onClosePunishment={() => { jackpot.actions.setShowPunishmentModal(false); jackpot.actions.setPendingPunishment(null); }}
        onTryLuck={jackpot.actions.handleTryLuck}
        onPunishmentCanceled={handlePunishmentCanceled}
        showLuckPassiveModal={jackpot.state.showLuckPassiveModal}
        pendingLuckPassive={jackpot.state.pendingLuckPassive}
        onCloseLuckPassive={() => { jackpot.actions.setShowLuckPassiveModal(false); jackpot.actions.setPendingLuckPassive(null); }}
        onLuckPassiveResult={jackpot.actions.handleLuckPassiveResult}
        showWitchCovenModal={witchCoven.state.showWitchCovenModal}
        witchCovenPlayer={witchCoven.state.witchCovenPlayer}
        witchCovenState={witchCoven.state.witchCovenState}
        playerTurnCounts={{ player1: gameState.player1TurnCount, player2: gameState.player2TurnCount }}
        playerLives={{ player1: gameState.player1.life, player2: gameState.player2.life }}
        playerColors={playerColors}
        onCloseWitchCoven={() => { witchCoven.actions.setShowWitchCovenModal(false); witchCoven.actions.setWitchCovenPlayer(null); }}
        onUpdateCovenState={witchCoven.actions.handleUpdateWitchCovenState}
        onActivateCoven={witchCoven.actions.handleActivateWitchCoven}
        onUseCalderon={witchCoven.actions.handleUseCalderon}
        onUseMotherWitchSpell={witchCoven.actions.handleUseMotherWitchSpell}
        showMotherWitchResult={witchCoven.state.showMotherWitchResult}
        motherWitchPlayer={witchCoven.state.motherWitchPlayer}
        onCloseMotherWitch={() => { witchCoven.actions.setShowMotherWitchResult(false); }}
        onMotherWitchResult={witchCoven.actions.handleMotherWitchResult}
        showLastBreathFromPassive={witchCoven.state.showLastBreathFromPassive}
        pendingLastBreath={witchCoven.state.pendingLastBreath}
        onLastBreathComplete={witchCoven.actions.handleLastBreathPassiveComplete}
      />
    </div>
  );
};

export default Index;
