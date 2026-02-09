import { JackpotDiceRoll } from './JackpotDiceRoll';
import { InsectQueenModal } from './InsectQueenModal';
import { DomainPunishmentModal, DomainPunishment } from './DomainPunishmentModal';
import { LuckPassiveModal } from './LuckPassiveModal';
import { WitchCovenModal, WitchCovenState } from './WitchCovenModal';
import { MotherWitchResultModal } from './MotherWitchResultModal';
import { LastBreathModal } from './LastBreathModal';

interface GameModalsContainerProps {
  // Jackpot Modal
  pendingDomain: { player: 'player1' | 'player2'; skillId: string; skillName: string } | null;
  showJackpotModal: boolean;
  onCloseJackpot: () => void;
  onJackpotComplete: (duration: number, selectedEffectIds: string[], hasEffect8: boolean, hasEffect9: boolean) => void;
  jackpotIsSecondChance: boolean;

  // Insect Queen Modal
  pendingInsectQueen: { player: 'player1' | 'player2' } | null;
  showInsectQueenModal: boolean;
  onCloseInsectQueen: () => void;
  onInsectQueenComplete: (poisonedCount: number) => void;

  // Punishment Modal
  showPunishmentModal: boolean;
  pendingPunishment: DomainPunishment | null;
  onClosePunishment: () => void;
  onTryLuck: (punishment: DomainPunishment) => void;
  onPunishmentCanceled: (punishment: DomainPunishment) => void;

  // Luck Passive Modal
  showLuckPassiveModal: boolean;
  pendingLuckPassive: { player: 'player1' | 'player2'; skillName: string; luckPercentage: number } | null;
  onCloseLuckPassive: () => void;
  onLuckPassiveResult: (success: boolean) => void;

  // Witch Coven Modal
  showWitchCovenModal: boolean;
  witchCovenPlayer: 'player1' | 'player2' | null;
  witchCovenState: { player1: WitchCovenState; player2: WitchCovenState };
  playerTurnCounts: { player1: number; player2: number };
  playerLives: { player1: number; player2: number };
  playerColors: { player1: string; player2: string };
  onCloseWitchCoven: () => void;
  onUpdateCovenState: (player: 'player1' | 'player2', state: WitchCovenState) => void;
  onActivateCoven: (player: 'player1' | 'player2') => void;
  onUseCalderon: (player: 'player1' | 'player2', damage: number) => void;
  onUseMotherWitchSpell: (player: 'player1' | 'player2') => void;

  // Mother Witch Result Modal
  showMotherWitchResult: boolean;
  motherWitchPlayer: 'player1' | 'player2' | null;
  onCloseMotherWitch: () => void;
  onMotherWitchResult: (success: boolean) => void;

  // Last Breath Passive Modal
  showLastBreathFromPassive: boolean;
  pendingLastBreath: { targetPlayer: 'player1' | 'player2'; pendingDamage: number } | null;
  onLastBreathComplete: (result: { winner: 'player1' | 'player2'; loser: 'player1' | 'player2'; damage: number }) => void;
}

export const GameModalsContainer = ({
  pendingDomain,
  showJackpotModal,
  onCloseJackpot,
  onJackpotComplete,
  jackpotIsSecondChance,
  pendingInsectQueen,
  showInsectQueenModal,
  onCloseInsectQueen,
  onInsectQueenComplete,
  showPunishmentModal,
  pendingPunishment,
  onClosePunishment,
  onTryLuck,
  onPunishmentCanceled,
  showLuckPassiveModal,
  pendingLuckPassive,
  onCloseLuckPassive,
  onLuckPassiveResult,
  showWitchCovenModal,
  witchCovenPlayer,
  witchCovenState,
  playerTurnCounts,
  playerLives,
  playerColors,
  onCloseWitchCoven,
  onUpdateCovenState,
  onActivateCoven,
  onUseCalderon,
  onUseMotherWitchSpell,
  showMotherWitchResult,
  motherWitchPlayer,
  onCloseMotherWitch,
  onMotherWitchResult,
  showLastBreathFromPassive,
  pendingLastBreath,
  onLastBreathComplete,
}: GameModalsContainerProps) => {
  return (
    <>
      {/* Jackpot Dice Roll Modal */}
      {pendingDomain && (
        <JackpotDiceRoll
          isOpen={showJackpotModal}
          onClose={onCloseJackpot}
          onComplete={onJackpotComplete}
          player={pendingDomain.player}
          isRotated={pendingDomain.player === 'player2'}
          isSecondChance={jackpotIsSecondChance}
        />
      )}

      {/* Insect Queen Modal */}
      {pendingInsectQueen && (
        <InsectQueenModal
          isOpen={showInsectQueenModal}
          onClose={onCloseInsectQueen}
          onComplete={onInsectQueenComplete}
          player={pendingInsectQueen.player}
          isRotated={pendingInsectQueen.player === 'player2'}
        />
      )}

      {/* Domain Punishment Modal */}
      <DomainPunishmentModal
        isOpen={showPunishmentModal}
        punishment={pendingPunishment}
        onClose={onClosePunishment}
        onTryLuck={onTryLuck}
        onCanceled={onPunishmentCanceled}
        isRotated={pendingPunishment?.player === 'player2'}
      />

      {/* Luck Passive Modal */}
      {pendingLuckPassive && (
        <LuckPassiveModal
          isOpen={showLuckPassiveModal}
          onClose={onCloseLuckPassive}
          onResult={onLuckPassiveResult}
          skillName={pendingLuckPassive.skillName}
          player={pendingLuckPassive.player}
          isRotated={pendingLuckPassive.player === 'player2'}
          luckPercentage={pendingLuckPassive.luckPercentage}
        />
      )}

      {/* Witch Coven Modal */}
      {witchCovenPlayer && (
        <WitchCovenModal
          isOpen={showWitchCovenModal}
          onClose={onCloseWitchCoven}
          player={witchCovenPlayer}
          playerTurnCount={playerTurnCounts[witchCovenPlayer]}
          covenState={witchCovenState[witchCovenPlayer]}
          onUpdateCovenState={(state) => onUpdateCovenState(witchCovenPlayer, state)}
          onActivateCoven={() => onActivateCoven(witchCovenPlayer)}
          onUseCalderon={(damage) => onUseCalderon(witchCovenPlayer, damage)}
          onUseMotherWitchSpell={() => onUseMotherWitchSpell(witchCovenPlayer)}
          currentLife={playerLives[witchCovenPlayer]}
          customColor={playerColors[witchCovenPlayer]}
        />
      )}

      {/* Mother Witch Result Modal */}
      {motherWitchPlayer && (
        <MotherWitchResultModal
          isOpen={showMotherWitchResult}
          onClose={onCloseMotherWitch}
          onConfirmResult={onMotherWitchResult}
          player={motherWitchPlayer}
        />
      )}

      {/* LastBreath Passive Modal */}
      {pendingLastBreath && (
        <LastBreathModal
          isOpen={showLastBreathFromPassive}
          onClose={() => {}}
          onComplete={onLastBreathComplete}
          player={pendingLastBreath.targetPlayer}
          currentLife={playerLives[pendingLastBreath.targetPlayer]}
          initialDamage={pendingLastBreath.pendingDamage}
        />
      )}
    </>
  );
};
