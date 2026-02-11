import { useState, useCallback, useRef } from 'react';
import type { Player, GameState } from '@/hooks/useGameState';

export type DecreeType = 'blood' | 'domination' | 'extermination' | null;

export interface WarGodState {
  warPoints: number;
  lastDecree: DecreeType;
  decreeUsedThisTurn: boolean;
  isActive: boolean;
  exterminationActive: boolean; // Double damage this turn
}

const initialWarGodState: WarGodState = {
  warPoints: 0,
  lastDecree: null,
  decreeUsedThisTurn: false,
  isActive: false,
  exterminationActive: false,
};

interface UseWarGodProps {
  gameState: GameState;
  updateLife: (player: Player, delta: number) => void;
  onTributeApplied?: (player: Player, damage: number) => void;
}

export const useWarGod = ({ gameState, updateLife, onTributeApplied }: UseWarGodProps) => {
  const [warGodState, setWarGodState] = useState<{
    player1: WarGodState;
    player2: WarGodState;
  }>({
    player1: { ...initialWarGodState },
    player2: { ...initialWarGodState },
  });

  // Track last processed turn to avoid double-processing
  const lastProcessedTurn = useRef<{ player1: number; player2: number }>({ player1: 0, player2: 0 });

  const activateWarGod = useCallback((player: Player) => {
    setWarGodState(prev => ({
      ...prev,
      [player]: { ...prev[player], isActive: true },
    }));
  }, []);

  // Called at the START of a player's turn - gains war points + blood tribute
  const processWarGodTurnStart = useCallback((player: Player) => {
    const state = warGodState[player];
    if (!state.isActive) return;

    const playerTurnCount = player === 'player1' ? gameState.player1TurnCount : gameState.player2TurnCount;

    // Prevent double processing
    if (lastProcessedTurn.current[player] >= playerTurnCount) return;
    lastProcessedTurn.current[player] = playerTurnCount;

    // Gain war points: 2 from turn 4+, else 1
    const pointsGained = playerTurnCount >= 4 ? 2 : 1;
    const newWarPoints = state.warPoints + pointsGained;

    // Blood tribute: ceil(1 + warPoints/2) - uses NEW war points
    const tributeDamage = Math.ceil(1 + newWarPoints / 2);

    setWarGodState(prev => ({
      ...prev,
      [player]: {
        ...prev[player],
        warPoints: newWarPoints,
        decreeUsedThisTurn: false,
        exterminationActive: false,
      },
    }));

    // Apply blood tribute damage (unreducible)
    updateLife(player, -tributeDamage);
    onTributeApplied?.(player, tributeDamage);
  }, [warGodState, gameState, updateLife, onTributeApplied]);

  // Use a decree
  const useDecree = useCallback((player: Player, decree: DecreeType) => {
    if (!decree) return;
    const state = warGodState[player];
    if (!state.isActive || state.decreeUsedThisTurn) return;
    if (state.lastDecree === decree) return; // Can't repeat consecutive

    const wp = state.warPoints;
    const opponent: Player = player === 'player1' ? 'player2' : 'player1';

    switch (decree) {
      case 'blood':
        // Deal warPoints damage to opponent
        updateLife(opponent, -wp);
        break;
      case 'domination':
        // Heal warPoints
        updateLife(player, wp);
        break;
      case 'extermination':
        // Double damage flag until end of turn
        setWarGodState(prev => ({
          ...prev,
          [player]: { ...prev[player], exterminationActive: true },
        }));
        break;
    }

    setWarGodState(prev => ({
      ...prev,
      [player]: {
        ...prev[player],
        lastDecree: decree,
        decreeUsedThisTurn: true,
      },
    }));
  }, [warGodState, updateLife]);

  // Get available decrees for a player
  const getAvailableDecrees = useCallback((player: Player): DecreeType[] => {
    const state = warGodState[player];
    if (!state.isActive || state.decreeUsedThisTurn) return [];
    const all: DecreeType[] = ['blood', 'domination', 'extermination'];
    return all.filter(d => d !== state.lastDecree);
  }, [warGodState]);

  // Get damage reduction for a player (passive 1)
  const getDamageReduction = useCallback((player: Player): number => {
    const state = warGodState[player];
    if (!state.isActive) return 0;
    return state.warPoints;
  }, [warGodState]);

  // Get minimum damage after reduction (turn 7+ = 0, else 1)
  const getMinDamage = useCallback((player: Player): number => {
    const playerTurnCount = player === 'player1' ? gameState.player1TurnCount : gameState.player2TurnCount;
    return playerTurnCount >= 7 ? 0 : 1;
  }, [gameState]);

  // Get bonus damage for a player's attacks
  const getBonusDamage = useCallback((player: Player): number => {
    const state = warGodState[player];
    if (!state.isActive) return 0;
    return state.warPoints;
  }, [warGodState]);

  const resetWarGod = useCallback(() => {
    setWarGodState({
      player1: { ...initialWarGodState },
      player2: { ...initialWarGodState },
    });
    lastProcessedTurn.current = { player1: 0, player2: 0 };
  }, []);

  return {
    state: warGodState,
    actions: {
      activateWarGod,
      processWarGodTurnStart,
      useDecree,
      getAvailableDecrees,
      getDamageReduction,
      getMinDamage,
      getBonusDamage,
      resetWarGod,
    },
  };
};
