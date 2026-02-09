import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayerZone } from './PlayerZone';
import { Timer } from './Timer';
import { PhaseWheel } from './PhaseWheel';
import { TurnTransition } from './TurnTransition';
import { VictoryOverlay } from './VictoryOverlay';
import { DomainTracker, ActiveDomain } from './DomainTracker';
import { TokenCounter, TokenCount, TokenType } from './TokenCounter';
import { SummonTracker, ActiveSummon } from './SummonTracker';
import { SkillHistoryPanel, SkillHistoryEntry } from './SkillHistoryPanel';
import { ActiveEffectsIndicator } from './ActiveEffectsIndicator';
import { AnimatedBackground } from './AnimatedBackground';
import { RotateCcw, X, Hash } from 'lucide-react';
import type { GameState, Player } from '@/hooks/useGameState';
import type { Skill } from './SkillSelection';
import { useGameSounds } from '@/hooks/useSound';
import { useGameColors } from '@/hooks/useGameColors';

interface GameScreenProps {
  gameState: GameState;
  onUpdateLife: (player: Player, delta: number) => void;
  onSetLife: (player: Player, value: number) => void;
  onAdvancePhase: () => void;
  onPassPhase: () => void;
  onEndTurn: () => void;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onResetGame: () => void;
  onExitGame: () => void;
  player1Skill?: Skill | null;
  player2Skill?: Skill | null;
  onUseSkill?: (player: Player, optionId?: string) => void;
  onApplyDamage?: (player: Player, damage: number) => void;
  player1Summons?: ActiveSummon[];
  player2Summons?: ActiveSummon[];
  onAddSummon?: (player: Player, summon: Omit<ActiveSummon, 'id'>) => void;
  onUpdateSummon?: (player: Player, summonId: string, updates: Partial<ActiveSummon>) => void;
  onRemoveSummon?: (player: Player, summonId: string) => void;
  player1Tokens?: TokenCount[];
  player2Tokens?: TokenCount[];
  onAddToken?: (player: Player, type: TokenType) => void;
  onUpdateToken?: (player: Player, type: TokenType, count: number) => void;
  onRemoveToken?: (player: Player, type: TokenType) => void;
  player1Domains?: ActiveDomain[];
  player2Domains?: ActiveDomain[];
  onUpdateDomain?: (player: Player, domainId: string, turnsRemaining: number) => void;
  onRemoveDomain?: (player: Player, domainId: string) => void;
  player1SkillHistory?: SkillHistoryEntry[];
  player2SkillHistory?: SkillHistoryEntry[];
  player1Color?: string;
  player2Color?: string;
  player1HasOverflowingLuck?: boolean;
  player2HasOverflowingLuck?: boolean;
  player1IsSecondChance?: boolean;
  player2IsSecondChance?: boolean;
}

export const GameScreen = ({
  gameState,
  onUpdateLife,
  onSetLife,
  onAdvancePhase,
  onPassPhase,
  onEndTurn,
  onToggleTimer,
  onResetTimer,
  onResetGame,
  onExitGame,
  player1Skill,
  player2Skill,
  onUseSkill,
  onApplyDamage,
  player1Summons = [],
  player2Summons = [],
  onAddSummon,
  onUpdateSummon,
  onRemoveSummon,
  player1Tokens = [],
  player2Tokens = [],
  onAddToken,
  onUpdateToken,
  onRemoveToken,
  player1Domains = [],
  player2Domains = [],
  onUpdateDomain,
  onRemoveDomain,
  player1SkillHistory = [],
  player2SkillHistory = [],
  player1Color,
  player2Color,
  player1HasOverflowingLuck = false,
  player2HasOverflowingLuck = false,
  player1IsSecondChance = false,
  player2IsSecondChance = false,
}: GameScreenProps) => {
  const { playSound } = useGameSounds();
  const prevState = useRef(gameState);
  const [showTurnTransition, setShowTurnTransition] = useState(false);
  const [transitionPlayer, setTransitionPlayer] = useState<Player>('player1');

  // Initialize reactive color system
  useGameColors({
    player1Color: player1Color || 'gold',
    player2Color: player2Color || 'blue',
    currentPlayer: gameState.currentPlayer,
  });

  const hasTimer = gameState.timerDuration > 0;
  
  // Check if any player has active domains for visual effects
  const player1HasDomain = player1Domains.length > 0;
  const player2HasDomain = player2Domains.length > 0;
  
  // Determine winner
  const winner: Player | null = gameState.player1.isDefeated 
    ? 'player2' 
    : gameState.player2.isDefeated 
    ? 'player1' 
    : null;

  // Sound effects
  useEffect(() => {
    const prev = prevState.current;

    // Turn change detection - show transition
    if (prev.currentPlayer !== gameState.currentPlayer && prev.gameStarted) {
      setTransitionPlayer(gameState.currentPlayer);
      setShowTurnTransition(true);
    }

    // Phase change sounds
    if (prev.currentPhase !== gameState.currentPhase || 
        prev.currentPlayer !== gameState.currentPlayer) {
      playSound('phase');
    }

    // Life change sounds
    if (prev.player1.life !== gameState.player1.life) {
      if (gameState.player1.life < prev.player1.life) {
        playSound('lifeLoss');
      } else {
        playSound('lifeGain');
      }
    }
    if (prev.player2.life !== gameState.player2.life) {
      if (gameState.player2.life < prev.player2.life) {
        playSound('lifeLoss');
      } else {
        playSound('lifeGain');
      }
    }

    // Defeat/Victory sounds
    if (!prev.player1.isDefeated && gameState.player1.isDefeated) {
      playSound('defeat');
      setTimeout(() => playSound('victory'), 500);
    }
    if (!prev.player2.isDefeated && gameState.player2.isDefeated) {
      playSound('defeat');
      setTimeout(() => playSound('victory'), 500);
    }

    // Timer end sound
    if (!prev.timerEnded && gameState.timerEnded) {
      playSound('timerEnd');
    }

    prevState.current = gameState;
  }, [gameState, playSound]);

  return (
    <motion.div 
      className="h-screen w-screen flex flex-col overflow-hidden safe-area-inset relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Animated Background */}
      <AnimatedBackground 
        currentPlayer={gameState.currentPlayer} 
        gameStarted={gameState.gameStarted} 
      />

      {/* Turn Transition Overlay */}
      <TurnTransition
        show={showTurnTransition}
        player={transitionPlayer}
        onComplete={() => setShowTurnTransition(false)}
      />

      {/* Player 2 Zone (rotated for face-to-face play) */}
      <div className="relative flex-1 min-h-0">
        {/* Domain Active Visual Effect for Player 2 */}
        <AnimatePresence>
          {player2HasDomain && (
            <motion.div
              className="absolute inset-0 z-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-b from-purple-500/20 via-transparent to-transparent"
                animate={{ opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <motion.div
                className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent"
                animate={{ opacity: [0.5, 1, 0.5], scaleX: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Player 2 Domain Tracker */}
        {player2Domains.length > 0 && onUpdateDomain && onRemoveDomain && (
          <DomainTracker
            domains={player2Domains}
            onUpdateDomain={(id, turns) => onUpdateDomain('player2', id, turns)}
            onRemoveDomain={(id) => onRemoveDomain('player2', id)}
            isRotated={true}
          />
        )}
        
        {/* Player 2 Active Effects - Only domain effects (not overflowing luck, shown in PlayerZone) */}
        {player2Domains.length > 0 && (
          <div className="absolute top-12 right-2 z-10 rotate-180">
            <ActiveEffectsIndicator domains={player2Domains} player="player2" isRotated={true} hasOverflowingLuck={false} />
          </div>
        )}
        
        <PlayerZone
          player="player2"
          life={gameState.player2.life}
          isDefeated={gameState.player2.isDefeated}
          isCurrentTurn={gameState.currentPlayer === 'player2'}
          onLifeChange={(delta) => onUpdateLife('player2', delta)}
          onLifeSet={(value) => onSetLife('player2', value)}
          isRotated={true}
          skill={player2Skill}
          onUseSkill={onUseSkill ? (optionId) => onUseSkill('player2', optionId) : undefined}
          onApplyDamage={onApplyDamage}
          summons={player2Summons}
          onAddSummon={onAddSummon ? (summon) => onAddSummon('player2', summon) : undefined}
          onUpdateSummon={onUpdateSummon ? (id, updates) => onUpdateSummon('player2', id, updates) : undefined}
          onRemoveSummon={onRemoveSummon ? (id) => onRemoveSummon('player2', id) : undefined}
          onAddToken={onAddToken ? (type) => onAddToken('player2', type) : undefined}
          customColor={player2Color}
          activeDomain={player2Domains.find(d => d.skillId === 'jackpot') || null}
          isSecondChance={player2IsSecondChance}
          hasOverflowingLuck={player2HasOverflowingLuck}
          playerTurnCount={gameState.player2TurnCount}
        />
      </div>

      {/* Center Controls - Phase Wheel & Timer */}
      <div className="relative z-10 flex flex-col items-center justify-center py-2 sm:py-3 px-2 sm:px-4 bg-card/95 backdrop-blur-md border-y border-border gap-1 sm:gap-2">
        {/* Top Row - Exit, Turn Counter, Tokens & Reset */}
        <div className="absolute top-1.5 sm:top-2 left-2 sm:left-4 right-2 sm:right-4 flex justify-between items-center">
          {/* Left side - Exit + Turn Counter + Player 1 Tokens + P1 History */}
          <div className="flex items-center gap-1 sm:gap-2">
            <motion.button
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-destructive/20 hover:text-destructive transition-colors"
              onClick={onExitGame}
              whileTap={{ scale: 0.9 }}
              aria-label="Salir"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </motion.button>

            {/* Turn Counter */}
            <motion.div 
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border border-primary/30 shadow-lg"
              animate={{ 
                boxShadow: [
                  '0 0 10px 0 rgba(var(--primary), 0.2)',
                  '0 0 20px 2px rgba(var(--primary), 0.3)',
                  '0 0 10px 0 rgba(var(--primary), 0.2)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-primary flex items-center justify-center">
                <Hash className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary-foreground" />
              </div>
              <span className="text-xs sm:text-sm font-display font-black text-primary">
                {gameState.turnCount}
              </span>
            </motion.div>
            
            {/* Player 1 Summons */}
            {player1Summons.length > 0 && onUpdateSummon && onRemoveSummon && (
              <SummonTracker
                summons={player1Summons}
                onUpdateSummon={(id, updates) => onUpdateSummon('player1', id, updates)}
                onRemoveSummon={(id) => onRemoveSummon('player1', id)}
                player="player1"
                isRotated={false}
                playerColor={player1Color}
              />
            )}
            
            {/* Player 1 Tokens - Near J1 zone */}
            {player1Tokens.length > 0 && onUpdateToken && onRemoveToken && (
              <TokenCounter
                tokens={player1Tokens}
                onUpdateToken={(type, count) => onUpdateToken('player1', type, count)}
                onRemoveToken={(type) => onRemoveToken('player1', type)}
                isRotated={false}
                compact={true}
                playerColor={player1Color}
              />
            )}
            
            {/* Player 1 History Button */}
            {player1SkillHistory.length > 0 && (
              <SkillHistoryPanel
                history={player1SkillHistory}
                player="player1"
                isRotated={false}
              />
            )}
          </div>

          {/* Right side - Player 2 Tokens + P2 History + Reset */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Player 2 History Button */}
            {player2SkillHistory.length > 0 && (
              <SkillHistoryPanel
                history={player2SkillHistory}
                player="player2"
                isRotated={true}
              />
            )}
            
            {/* Player 2 Tokens */}
            {player2Tokens.length > 0 && onUpdateToken && onRemoveToken && (
              <TokenCounter
                tokens={player2Tokens}
                onUpdateToken={(type, count) => onUpdateToken('player2', type, count)}
                onRemoveToken={(type) => onRemoveToken('player2', type)}
                isRotated={true}
                compact={true}
                playerColor={player2Color}
              />
            )}
            
            {/* Player 2 Summons */}
            {player2Summons.length > 0 && onUpdateSummon && onRemoveSummon && (
              <SummonTracker
                summons={player2Summons}
                onUpdateSummon={(id, updates) => onUpdateSummon('player2', id, updates)}
                onRemoveSummon={(id) => onRemoveSummon('player2', id)}
                player="player2"
                isRotated={true}
                playerColor={player2Color}
              />
            )}
            
            <motion.button
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors"
              onClick={onResetGame}
              whileTap={{ scale: 0.9 }}
              aria-label="Nueva partida"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </motion.button>
          </div>
        </div>

        {/* Phase Wheel */}
        <div className="mt-6 sm:mt-8">
          <PhaseWheel
            currentPhase={gameState.currentPhase}
            currentPlayer={gameState.currentPlayer}
            onAdvancePhase={onAdvancePhase}
            onPass={onPassPhase}
            onEndTurn={onEndTurn}
          />
        </div>

        {/* Timer - only show if timer is enabled */}
        {hasTimer && (
          <Timer
            remaining={gameState.timerRemaining}
            isRunning={gameState.timerRunning}
            hasEnded={gameState.timerEnded}
            onToggle={onToggleTimer}
            onReset={onResetTimer}
          />
        )}
      </div>

      {/* Player 1 Zone */}
      <div className="relative flex-1 min-h-0">
        {/* Domain Active Visual Effect for Player 1 */}
        <AnimatePresence>
          {player1HasDomain && (
            <motion.div
              className="absolute inset-0 z-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-t from-purple-500/20 via-transparent to-transparent"
                animate={{ opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent"
                animate={{ opacity: [0.5, 1, 0.5], scaleX: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Player 1 Domain Tracker */}
        {player1Domains.length > 0 && onUpdateDomain && onRemoveDomain && (
          <DomainTracker
            domains={player1Domains}
            onUpdateDomain={(id, turns) => onUpdateDomain('player1', id, turns)}
            onRemoveDomain={(id) => onRemoveDomain('player1', id)}
            isRotated={false}
          />
        )}
        
        {/* Player 1 Active Effects - Only domain effects (not overflowing luck, shown in PlayerZone) */}
        {player1Domains.length > 0 && (
          <div className="absolute bottom-12 right-2 z-10">
            <ActiveEffectsIndicator domains={player1Domains} player="player1" isRotated={false} hasOverflowingLuck={false} />
          </div>
        )}
        
        <PlayerZone
          player="player1"
          life={gameState.player1.life}
          isDefeated={gameState.player1.isDefeated}
          isCurrentTurn={gameState.currentPlayer === 'player1'}
          onLifeChange={(delta) => onUpdateLife('player1', delta)}
          onLifeSet={(value) => onSetLife('player1', value)}
          skill={player1Skill}
          onUseSkill={onUseSkill ? (optionId) => onUseSkill('player1', optionId) : undefined}
          onApplyDamage={onApplyDamage}
          summons={player1Summons}
          onAddSummon={onAddSummon ? (summon) => onAddSummon('player1', summon) : undefined}
          onUpdateSummon={onUpdateSummon ? (id, updates) => onUpdateSummon('player1', id, updates) : undefined}
          onRemoveSummon={onRemoveSummon ? (id) => onRemoveSummon('player1', id) : undefined}
          onAddToken={onAddToken ? (type) => onAddToken('player1', type) : undefined}
          customColor={player1Color}
          activeDomain={player1Domains.find(d => d.skillId === 'jackpot') || null}
          isSecondChance={player1IsSecondChance}
          hasOverflowingLuck={player1HasOverflowingLuck}
          playerTurnCount={gameState.player1TurnCount}
        />
      </div>

      {/* Victory Overlay */}
      <AnimatePresence>
        {winner && (
          <VictoryOverlay
            winner={winner}
            onNewGame={onResetGame}
            onExit={onExitGame}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
