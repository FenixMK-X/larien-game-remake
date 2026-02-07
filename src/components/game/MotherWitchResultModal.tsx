import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Skull, X, Gift, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MotherWitchResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmResult: (success: boolean) => void;
  player: 'player1' | 'player2';
}

export const MotherWitchResultModal = ({
  isOpen,
  onClose,
  onConfirmResult,
  player,
}: MotherWitchResultModalProps) => {
  const playerLabel = player === 'player1' ? 'Jugador 1' : 'Jugador 2';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-card border-2 border-violet-500/60 rounded-2xl shadow-2xl max-w-sm w-full"
          style={{ boxShadow: '0 0 50px rgba(139, 92, 246, 0.3)' }}
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 via-violet-700 to-purple-800 p-4 rounded-t-2xl relative">
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="p-3 rounded-xl bg-white/20 backdrop-blur-sm"
              >
                <Sparkles className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h2 className="text-lg font-black text-white">Conjuro de la Bruja Madre</h2>
                <p className="text-violet-200 text-sm">{playerLabel} - Resultado del robo</p>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Has robado 3 cartas. <br />
              <strong className="text-violet-400">¿Apareció el Caldero Negro?</strong>
            </p>

            <div className="grid grid-cols-2 gap-3">
              {/* Success - Caldero appeared */}
              <motion.button
                className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-2 border-emerald-500/40 hover:border-emerald-400 transition-colors group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onConfirmResult(true)}
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="mx-auto w-12 h-12 rounded-full bg-emerald-500/30 flex items-center justify-center mb-2"
                >
                  <Gift className="w-6 h-6 text-emerald-400" />
                </motion.div>
                <span className="font-bold text-emerald-400 text-sm block">¡Sí apareció!</span>
                <span className="text-[10px] text-emerald-300/70 block mt-1">
                  Descarta las otras 2 cartas<br />
                  <strong>+2 límite de tesoros</strong>
                </span>
              </motion.button>

              {/* Failure - Caldero didn't appear */}
              <motion.button
                className="p-4 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/10 border-2 border-red-500/40 hover:border-red-400 transition-colors group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onConfirmResult(false)}
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="mx-auto w-12 h-12 rounded-full bg-red-500/30 flex items-center justify-center mb-2"
                >
                  <Skull className="w-6 h-6 text-red-400" />
                </motion.div>
                <span className="font-bold text-red-400 text-sm block">No apareció</span>
                <span className="text-[10px] text-red-300/70 block mt-1">
                  Pierdes 3 vida<br />
                  Descarta 1 tesoro
                </span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MotherWitchResultModal;
