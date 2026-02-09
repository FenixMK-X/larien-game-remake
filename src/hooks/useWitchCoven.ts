import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useGameSounds } from '@/hooks/useSound';
import type { WitchCovenState } from '@/components/game/WitchCovenModal';
import type { ActiveDomain } from '@/components/game/DomainTracker';
import type { Skill } from '@/components/game/SkillSelection';

interface WitchCovenHookState {
  player1: WitchCovenState;
  player2: WitchCovenState;
}

interface PendingLastBreath {
  targetPlayer: 'player1' | 'player2';
  sourcePlayer: 'player1' | 'player2';
  pendingDamage: number;
  source: 'calderon';
}

interface UseWitchCovenProps {
  gameState: {
    player1TurnCount: number;
    player2TurnCount: number;
    player1: { life: number };
    player2: { life: number };
  };
  activeSkills: { player1: Skill | null; player2: Skill | null };
  setActiveSkills: React.Dispatch<React.SetStateAction<{ player1: Skill | null; player2: Skill | null }>>;
  setActiveDomains: React.Dispatch<React.SetStateAction<{ player1: ActiveDomain[]; player2: ActiveDomain[] }>>;
  updateLife: (player: 'player1' | 'player2', amount: number) => void;
}

const initialCovenState: WitchCovenState = {
  isActive: false,
  activatedTurn: 0,
  witchCount: { field: 0, hand: 0, graveyard: 0, averno: 0 },
  treasureLimit: 7,
  motherWitchCooldown: 0,
  lastMotherWitchTurn: 0,
};

export const useWitchCoven = ({
  gameState,
  activeSkills,
  setActiveSkills,
  setActiveDomains,
  updateLife,
}: UseWitchCovenProps) => {
  const { playSound } = useGameSounds();
  const { toast } = useToast();

  const [witchCovenState, setWitchCovenState] = useState<WitchCovenHookState>({
    player1: { ...initialCovenState },
    player2: { ...initialCovenState },
  });
  const [showWitchCovenModal, setShowWitchCovenModal] = useState(false);
  const [witchCovenPlayer, setWitchCovenPlayer] = useState<'player1' | 'player2' | null>(null);
  const [showMotherWitchResult, setShowMotherWitchResult] = useState(false);
  const [motherWitchPlayer, setMotherWitchPlayer] = useState<'player1' | 'player2' | null>(null);
  const [pendingLastBreath, setPendingLastBreath] = useState<PendingLastBreath | null>(null);
  const [showLastBreathFromPassive, setShowLastBreathFromPassive] = useState(false);

  const handleOpenWitchCovenModal = useCallback((player: 'player1' | 'player2') => {
    setWitchCovenPlayer(player);
    setShowWitchCovenModal(true);
  }, []);

  const handleUpdateWitchCovenState = useCallback((player: 'player1' | 'player2', state: WitchCovenState) => {
    setWitchCovenState(prev => ({
      ...prev,
      [player]: state,
    }));
  }, []);

  const handleActivateWitchCoven = useCallback((player: 'player1' | 'player2') => {
    const playerLabel = player === 'player1' ? 'Jugador 1' : 'Jugador 2';
    const playerTurnCount = player === 'player1' ? gameState.player1TurnCount : gameState.player2TurnCount;

    const newDomain: ActiveDomain = {
      id: `witch-coven-${Date.now()}`,
      skillId: 'witch-coven',
      skillName: 'Cacería del Aquelarre Absoluto',
      turnsRemaining: 999,
      activeEffects: ['Caldero Negro (3 daño × bruja)', 'Conjuro de la Bruja Madre'],
      player,
    };

    setActiveDomains(prev => ({
      ...prev,
      [player]: [...prev[player], newDomain],
    }));

    setWitchCovenState(prev => ({
      ...prev,
      [player]: {
        ...prev[player],
        isActive: true,
        activatedTurn: playerTurnCount,
      },
    }));

    playSound('skillActivate');
    toast({
      title: '🔥 ¡Aquelarre Absoluto Activado!',
      description: `${playerLabel}: Dominio permanente. Todas las brujas cuentan para el Caldero Negro.`,
    });
  }, [gameState.player1TurnCount, gameState.player2TurnCount, setActiveDomains, playSound, toast]);

  const handleUseCalderon = useCallback((player: 'player1' | 'player2', totalDamage: number) => {
    const targetPlayer = player === 'player1' ? 'player2' : 'player1';
    const targetLabel = targetPlayer === 'player1' ? 'Jugador 1' : 'Jugador 2';
    const playerLabel = player === 'player1' ? 'Jugador 1' : 'Jugador 2';
    const covenState = witchCovenState[player];
    const totalWitches = covenState.witchCount.field + covenState.witchCount.hand +
      covenState.witchCount.graveyard + covenState.witchCount.averno;

    const targetLife = gameState[targetPlayer].life;
    const isLethal = targetLife - totalDamage <= 0;
    const targetSkill = activeSkills[targetPlayer];

    if (isLethal && targetSkill?.id === 'last-breath' && !targetSkill.used) {
      setPendingLastBreath({
        targetPlayer,
        sourcePlayer: player,
        pendingDamage: totalDamage,
        source: 'calderon',
      });
      setShowLastBreathFromPassive(true);
      setShowWitchCovenModal(false);

      toast({
        title: '⚡ ¡Pasiva Activada!',
        description: `${targetLabel} activa Contraataque Desesperado como respuesta al daño letal del Caldero Negro.`,
      });
      return;
    }

    updateLife(targetPlayer, -totalDamage);
    setShowWitchCovenModal(false);
    playSound('skillActivate');
    toast({
      title: '🔥 ¡Caldero Negro Activado!',
      description: `${playerLabel} inflige ${totalDamage} daño directo a ${targetLabel} (${totalWitches} brujas × 3).`,
    });
  }, [witchCovenState, gameState, activeSkills, updateLife, playSound, toast]);

  const handleUseMotherWitchSpell = useCallback((player: 'player1' | 'player2') => {
    setMotherWitchPlayer(player);
    setShowMotherWitchResult(true);
    setShowWitchCovenModal(false);

    toast({
      title: '🧙‍♀️ Conjuro de la Bruja Madre',
      description: `Roba 3 cartas y verifica si aparece el Caldero Negro.`,
    });
  }, [toast]);

  const handleMotherWitchResult = useCallback((success: boolean) => {
    if (!motherWitchPlayer) return;

    const player = motherWitchPlayer;
    const playerLabel = player === 'player1' ? 'Jugador 1' : 'Jugador 2';

    if (success) {
      setWitchCovenState(prev => ({
        ...prev,
        [player]: {
          ...prev[player],
          treasureLimit: prev[player].treasureLimit + 2,
          motherWitchCooldown: 1,
        },
      }));

      playSound('skillActivate');
      toast({
        title: '✨ Conjuro Realizado',
        description: `${playerLabel}: ¡Caldero Negro encontrado! Límite de tesoros +2. Conjuro disponible de nuevo.`,
      });
    } else {
      setWitchCovenState(prev => ({
        ...prev,
        [player]: {
          ...prev[player],
          motherWitchCooldown: 3,
        },
      }));

      updateLife(player, -3);

      playSound('defeat');
      toast({
        title: '❌ Conjuro Fallido',
        description: `${playerLabel}: Pierdes 3 vida y 1 tesoro. Enfriamiento: 3 turnos.`,
        variant: 'destructive',
      });
    }

    setShowMotherWitchResult(false);
    setMotherWitchPlayer(null);
  }, [motherWitchPlayer, updateLife, playSound, toast]);

  const handleLastBreathPassiveComplete = useCallback((result: { winner: 'player1' | 'player2'; loser: 'player1' | 'player2'; damage: number }) => {
    if (!pendingLastBreath) return;

    const { targetPlayer, sourcePlayer } = pendingLastBreath;
    const targetLabel = targetPlayer === 'player1' ? 'Jugador 1' : 'Jugador 2';
    const sourceLabel = sourcePlayer === 'player1' ? 'Jugador 1' : 'Jugador 2';

    setActiveSkills(prev => {
      const currentSkill = prev[targetPlayer];
      if (!currentSkill) return prev;
      return { ...prev, [targetPlayer]: { ...currentSkill, used: true } };
    });

    updateLife(result.loser, -result.damage);

    if (result.winner === targetPlayer) {
      toast({
        title: '⚔️ ¡Contraataque Exitoso!',
        description: `${targetLabel} ganó el duelo. ${sourceLabel} recibe ${result.damage} de daño reflejado.`,
      });
    } else {
      toast({
        title: '💀 Contraataque Fallido',
        description: `${targetLabel} perdió el duelo y recibe ${result.damage} de daño.`,
        variant: 'destructive',
      });
    }

    playSound('diceResult');
    setPendingLastBreath(null);
    setShowLastBreathFromPassive(false);
  }, [pendingLastBreath, setActiveSkills, updateLife, playSound, toast]);

  const reduceWitchCovenCooldowns = useCallback((playerEnding: 'player1' | 'player2') => {
    setWitchCovenState(prev => ({
      ...prev,
      [playerEnding]: {
        ...prev[playerEnding],
        motherWitchCooldown: Math.max(0, prev[playerEnding].motherWitchCooldown - 1),
      },
    }));
  }, []);

  const resetWitchCoven = useCallback(() => {
    setWitchCovenState({
      player1: { ...initialCovenState },
      player2: { ...initialCovenState },
    });
    setShowWitchCovenModal(false);
    setWitchCovenPlayer(null);
    setShowMotherWitchResult(false);
    setMotherWitchPlayer(null);
    setPendingLastBreath(null);
    setShowLastBreathFromPassive(false);
  }, []);

  return {
    state: {
      witchCovenState,
      showWitchCovenModal,
      witchCovenPlayer,
      showMotherWitchResult,
      motherWitchPlayer,
      pendingLastBreath,
      showLastBreathFromPassive,
    },
    actions: {
      handleOpenWitchCovenModal,
      handleUpdateWitchCovenState,
      handleActivateWitchCoven,
      handleUseCalderon,
      handleUseMotherWitchSpell,
      handleMotherWitchResult,
      handleLastBreathPassiveComplete,
      reduceWitchCovenCooldowns,
      resetWitchCoven,
      setShowWitchCovenModal,
      setWitchCovenPlayer,
      setShowMotherWitchResult,
      setWitchCovenState,
    },
  };
};
