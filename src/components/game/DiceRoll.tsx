import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, RotateCcw } from 'lucide-react';

interface DiceRollProps {
  onComplete: (startingPlayer: 'player1' | 'player2', diceWinner: 'player1' | 'player2') => void;
}

const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

const getDiceIcon = (value: number) => {
  const Icon = diceIcons[value - 1] || Dice1;
  return Icon;
};

type RollPhase = 'idle' | 'rolling' | 'result' | 'choosing' | 'complete';

export const DiceRoll = ({ onComplete }: DiceRollProps) => {
  const [phase, setPhase] = useState<RollPhase>('idle');
  const [player1Dice, setPlayer1Dice] = useState<number>(1);
  const [player2Dice, setPlayer2Dice] = useState<number>(1);
  const [animatingDice1, setAnimatingDice1] = useState<number>(1);
  const [animatingDice2, setAnimatingDice2] = useState<number>(1);
  const [winner, setWinner] = useState<'player1' | 'player2' | null>(null);

  // Animate dice during roll
  useEffect(() => {
    if (phase !== 'rolling') return;

    const interval = setInterval(() => {
      setAnimatingDice1(Math.floor(Math.random() * 6) + 1);
      setAnimatingDice2(Math.floor(Math.random() * 6) + 1);
    }, 100);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      
      // Generate final dice values
      const dice1 = Math.floor(Math.random() * 6) + 1;
      const dice2 = Math.floor(Math.random() * 6) + 1;
      
      setPlayer1Dice(dice1);
      setPlayer2Dice(dice2);
      setAnimatingDice1(dice1);
      setAnimatingDice2(dice2);
      
      if (dice1 === dice2) {
        // Tie - need to reroll
        setTimeout(() => setPhase('result'), 500);
      } else {
        // We have a winner
        const winnerPlayer = dice1 > dice2 ? 'player1' : 'player2';
        setWinner(winnerPlayer);
        setTimeout(() => setPhase('choosing'), 500);
      }
    }, 1500);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [phase]);

  const handleRoll = () => {
    setPhase('rolling');
  };

  const handleReroll = () => {
    setWinner(null);
    setPhase('rolling');
  };

  const handleChoosePlayer = (startingPlayer: 'player1' | 'player2') => {
    setPhase('complete');
    setTimeout(() => onComplete(startingPlayer, winner!), 500);
  };

  const Player1Dice = getDiceIcon(animatingDice1);
  const Player2Dice = getDiceIcon(animatingDice2);

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.h1
        className="text-3xl font-display font-black text-primary mb-8 text-center"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        ¿Quién Empieza?
      </motion.h1>

      <div className="flex items-center gap-8 mb-8">
        {/* Player 1 Dice */}
        <motion.div
          className="flex flex-col items-center"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <span className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            Jugador 1
          </span>
          <motion.div
            className={`p-4 rounded-xl border-2 ${
              winner === 'player1' 
                ? 'border-player1 bg-player1/20' 
                : winner === 'player2'
                ? 'border-muted bg-muted/20'
                : 'border-border bg-card'
            }`}
            animate={phase === 'rolling' ? { rotate: [0, 10, -10, 0] } : {}}
            transition={{ repeat: phase === 'rolling' ? Infinity : 0, duration: 0.2 }}
          >
            <Player1Dice className={`w-16 h-16 ${
              winner === 'player1' ? 'text-player1' : 'text-foreground'
            }`} />
          </motion.div>
          <motion.span
            className="text-2xl font-display font-bold mt-2"
            key={animatingDice1}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
          >
            {animatingDice1}
          </motion.span>
        </motion.div>

        {/* VS */}
        <motion.div
          className="text-2xl font-display font-bold text-muted-foreground"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
        >
          VS
        </motion.div>

        {/* Player 2 Dice */}
        <motion.div
          className="flex flex-col items-center"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <span className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            Jugador 2
          </span>
          <motion.div
            className={`p-4 rounded-xl border-2 ${
              winner === 'player2' 
                ? 'border-player2 bg-player2/20' 
                : winner === 'player1'
                ? 'border-muted bg-muted/20'
                : 'border-border bg-card'
            }`}
            animate={phase === 'rolling' ? { rotate: [0, -10, 10, 0] } : {}}
            transition={{ repeat: phase === 'rolling' ? Infinity : 0, duration: 0.2 }}
          >
            <Player2Dice className={`w-16 h-16 ${
              winner === 'player2' ? 'text-player2' : 'text-foreground'
            }`} />
          </motion.div>
          <motion.span
            className="text-2xl font-display font-bold mt-2"
            key={animatingDice2}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
          >
            {animatingDice2}
          </motion.span>
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        {/* Initial Roll Button */}
        {phase === 'idle' && (
          <motion.button
            key="roll"
            className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-display font-bold text-lg uppercase tracking-wider shadow-lg"
            onClick={handleRoll}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Tirar Dados
          </motion.button>
        )}

        {/* Rolling State */}
        {phase === 'rolling' && (
          <motion.p
            key="rolling"
            className="text-lg text-muted-foreground font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            Tirando dados...
          </motion.p>
        )}

        {/* Tie - Need Reroll */}
        {phase === 'result' && player1Dice === player2Dice && (
          <motion.div
            key="tie"
            className="flex flex-col items-center gap-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
          >
            <p className="text-xl font-display font-bold text-amber-500">
              ¡Empate! Tira de nuevo
            </p>
            <motion.button
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-bold uppercase tracking-wider"
              onClick={handleReroll}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RotateCcw className="w-5 h-5" />
              Desempatar
            </motion.button>
          </motion.div>
        )}

        {/* Winner Chooses */}
        {phase === 'choosing' && winner && (
          <motion.div
            key="choosing"
            className="flex flex-col items-center gap-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
          >
            <p className="text-lg text-center">
              <span className={`font-display font-bold ${
                winner === 'player1' ? 'text-player1' : 'text-player2'
              }`}>
                {winner === 'player1' ? 'Jugador 1' : 'Jugador 2'}
              </span>
              {' '}gana. ¿Quién empieza?
            </p>
            <div className="flex gap-4">
              <motion.button
                className="px-6 py-3 bg-player1 text-white rounded-lg font-bold uppercase tracking-wider"
                onClick={() => handleChoosePlayer('player1')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Jugador 1
              </motion.button>
              <motion.button
                className="px-6 py-3 bg-player2 text-white rounded-lg font-bold uppercase tracking-wider"
                onClick={() => handleChoosePlayer('player2')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Jugador 2
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Complete */}
        {phase === 'complete' && (
          <motion.p
            key="complete"
            className="text-xl font-display font-bold text-primary"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            ¡Comenzando partida!
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
