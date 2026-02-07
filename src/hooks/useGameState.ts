import { useState, useCallback, useEffect, useRef } from 'react';

export type Phase = 'robo' | 'juego' | 'ataque';
export type Player = 'player1' | 'player2';

export interface PlayerState {
  life: number;
  isDefeated: boolean;
}

export interface GameState {
  player1: PlayerState;
  player2: PlayerState;
  currentPlayer: Player;
  currentPhase: Phase;
  initialLife: number;
  timerDuration: number;
  timerRemaining: number;
  timerRunning: boolean;
  timerEnded: boolean;
  gameStarted: boolean;
  turnCount: number;
  player1TurnCount: number; // Turnos específicos del jugador 1
  player2TurnCount: number; // Turnos específicos del jugador 2
}

const PHASES: Phase[] = ['robo', 'juego', 'ataque'];

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>({
    player1: { life: 20, isDefeated: false },
    player2: { life: 20, isDefeated: false },
    currentPlayer: 'player1',
    currentPhase: 'robo',
    initialLife: 20,
    timerDuration: 30 * 60,
    timerRemaining: 30 * 60,
    timerRunning: false,
    timerEnded: false,
    gameStarted: false,
    turnCount: 1,
    player1TurnCount: 0,
    player2TurnCount: 0,
  });

  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  // Timer logic
  useEffect(() => {
    if (gameState.timerRunning && gameState.timerRemaining > 0) {
      timerInterval.current = setInterval(() => {
        setGameState(prev => {
          const newRemaining = prev.timerRemaining - 1;
          if (newRemaining <= 0) {
            return {
              ...prev,
              timerRemaining: 0,
              timerRunning: false,
              timerEnded: true,
            };
          }
          return { ...prev, timerRemaining: newRemaining };
        });
      }, 1000);
    }

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [gameState.timerRunning, gameState.timerRemaining]);

  const startGame = useCallback((life: number, timerMinutes: number | null, startingPlayer: Player = 'player1') => {
    const timerSeconds = timerMinutes ? timerMinutes * 60 : 0;
    setGameState({
      player1: { life, isDefeated: false },
      player2: { life, isDefeated: false },
      currentPlayer: startingPlayer,
      currentPhase: 'robo',
      initialLife: life,
      timerDuration: timerSeconds,
      timerRemaining: timerSeconds,
      timerRunning: timerMinutes !== null,
      timerEnded: false,
      gameStarted: true,
      turnCount: 1,
      player1TurnCount: startingPlayer === 'player1' ? 1 : 0,
      player2TurnCount: startingPlayer === 'player2' ? 1 : 0,
    });
  }, []);

  const updateLife = useCallback((player: Player, delta: number) => {
    setGameState(prev => {
      const currentLife = prev[player].life;
      const newLife = Math.max(0, currentLife + delta);
      const isDefeated = newLife === 0;
      
      return {
        ...prev,
        [player]: {
          ...prev[player],
          life: newLife,
          isDefeated,
        },
      };
    });
  }, []);

  const setLife = useCallback((player: Player, value: number) => {
    const newLife = Math.max(0, value);
    setGameState(prev => ({
      ...prev,
      [player]: {
        ...prev[player],
        life: newLife,
        isDefeated: newLife === 0,
      },
    }));
  }, []);

  const advancePhase = useCallback(() => {
    setGameState(prev => {
      const currentIndex = PHASES.indexOf(prev.currentPhase);
      const nextIndex = currentIndex + 1;
      
      if (nextIndex >= PHASES.length) {
        // End of turn, switch to other player
        const nextPlayer: Player = prev.currentPlayer === 'player1' ? 'player2' : 'player1';
        return {
          ...prev,
          currentPhase: 'robo',
          currentPlayer: nextPlayer,
        };
      }
      
      return {
        ...prev,
        currentPhase: PHASES[nextIndex],
      };
    });
  }, []);

  const passPhase = useCallback(() => {
    // Skip attack phase and end turn
    setGameState(prev => {
      const nextPlayer: Player = prev.currentPlayer === 'player1' ? 'player2' : 'player1';
      return {
        ...prev,
        currentPhase: 'robo',
        currentPlayer: nextPlayer,
        turnCount: prev.turnCount + 1,
        player1TurnCount: nextPlayer === 'player1' ? prev.player1TurnCount + 1 : prev.player1TurnCount,
        player2TurnCount: nextPlayer === 'player2' ? prev.player2TurnCount + 1 : prev.player2TurnCount,
      };
    });
  }, []);

  const endTurn = useCallback(() => {
    setGameState(prev => {
      const nextPlayer: Player = prev.currentPlayer === 'player1' ? 'player2' : 'player1';
      return {
        ...prev,
        currentPhase: 'robo',
        currentPlayer: nextPlayer,
        turnCount: prev.turnCount + 1,
        player1TurnCount: nextPlayer === 'player1' ? prev.player1TurnCount + 1 : prev.player1TurnCount,
        player2TurnCount: nextPlayer === 'player2' ? prev.player2TurnCount + 1 : prev.player2TurnCount,
      };
    });
  }, []);

  const toggleTimer = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      timerRunning: !prev.timerRunning,
    }));
  }, []);

  const resetTimer = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      timerRemaining: prev.timerDuration,
      timerRunning: false,
      timerEnded: false,
    }));
  }, []);

  const resetGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      player1: { life: prev.initialLife, isDefeated: false },
      player2: { life: prev.initialLife, isDefeated: false },
      currentPlayer: 'player1',
      currentPhase: 'robo',
      timerRemaining: prev.timerDuration,
      timerRunning: prev.timerDuration > 0,
      timerEnded: false,
      turnCount: 1,
      player1TurnCount: 1,
      player2TurnCount: 0,
    }));
  }, []);

  const exitToSetup = useCallback(() => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }
    setGameState({
      player1: { life: 20, isDefeated: false },
      player2: { life: 20, isDefeated: false },
      currentPlayer: 'player1',
      currentPhase: 'robo',
      initialLife: 20,
      timerDuration: 30 * 60,
      timerRemaining: 30 * 60,
      timerRunning: false,
      timerEnded: false,
      gameStarted: false,
      turnCount: 1,
      player1TurnCount: 0,
      player2TurnCount: 0,
    });
  }, []);

  return {
    gameState,
    startGame,
    updateLife,
    setLife,
    advancePhase,
    passPhase,
    endTurn,
    toggleTimer,
    resetTimer,
    resetGame,
    exitToSetup,
  };
};
