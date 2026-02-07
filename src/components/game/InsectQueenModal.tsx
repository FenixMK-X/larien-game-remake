import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, Minus, Plus, Check, X, ChevronDown } from 'lucide-react';

interface InsectQueenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (poisonedCount: number) => void;
  player: 'player1' | 'player2';
  isRotated?: boolean;
}

export const InsectQueenModal = ({
  isOpen,
  onClose,
  onComplete,
  player,
  isRotated = false,
}: InsectQueenModalProps) => {
  const [poisonedCount, setPoisonedCount] = useState(1);
  const [showInfo, setShowInfo] = useState(false);
  
  const playerBgClass = player === 'player1' ? 'bg-player1' : 'bg-player2';
  const playerBorderClass = player === 'player1' ? 'border-player1' : 'border-player2';
  const playerBgLight = player === 'player1' ? 'bg-player1/20' : 'bg-player2/20';

  const handleConfirm = () => {
    onComplete(poisonedCount);
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence mode="wait">
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        style={{ transform: isRotated ? 'rotate(180deg)' : 'none' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className={`relative w-full max-w-[600px] bg-card ${playerBorderClass} border-2 rounded-xl shadow-2xl overflow-hidden`}
          initial={{ scale: 0.9, opacity: 0, x: -20 }}
          animate={{ scale: 1, opacity: 1, x: 0 }}
          exit={{ scale: 0.9, opacity: 0, x: -20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Horizontal Layout */}
          <div className="flex flex-col sm:flex-row">
            {/* Left Column - Header */}
            <div className={`${playerBgLight} p-4 sm:w-[180px] shrink-0`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-green-500">
                  <Bug className="w-5 h-5 text-white" />
                </div>
                <button
                  onClick={onClose}
                  className="ml-auto p-1 rounded-full bg-muted/50 hover:bg-muted transition-colors sm:hidden"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <h3 className="font-display font-bold text-base mb-1">Reina Insecto</h3>
              <span className="text-xs text-green-400">Invocar Fichas</span>
              
              {/* Collapsible info */}
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="mt-3 w-full flex items-center justify-between p-2 rounded-lg bg-green-500/10 border border-green-500/30 text-xs"
              >
                <span className="text-green-400">Info</span>
                <motion.div animate={{ rotate: showInfo ? 180 : 0 }}>
                  <ChevronDown className="w-3.5 h-3.5 text-green-400" />
                </motion.div>
              </button>
              
              <AnimatePresence>
                {showInfo && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="pt-2 text-[10px] text-muted-foreground">
                      Crea fichas insecto basadas en las unidades envenenadas del rival.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Right Column - Content */}
            <div className="flex-1 p-4">
              {/* Desktop close button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-1 rounded-full bg-muted/50 hover:bg-muted transition-colors hidden sm:block"
              >
                <X className="w-4 h-4" />
              </button>
              
              <p className="text-xs text-muted-foreground text-center mb-4">
                ¿Cuántas unidades envenenadas tiene el rival?
              </p>
              
              {/* Counter - Horizontal */}
              <div className="flex items-center justify-center gap-4 mb-4">
                <motion.button
                  className="p-2.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                  onClick={() => setPoisonedCount(Math.max(1, poisonedCount - 1))}
                  whileTap={{ scale: 0.95 }}
                >
                  <Minus className="w-5 h-5" />
                </motion.button>
                
                <motion.div
                  className="w-20 h-20 rounded-xl bg-green-500/20 border-2 border-green-500 flex items-center justify-center"
                  key={poisonedCount}
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                >
                  <span className="text-4xl font-display font-black text-green-400">
                    {poisonedCount}
                  </span>
                </motion.div>
                
                <motion.button
                  className="p-2.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                  onClick={() => setPoisonedCount(Math.min(10, poisonedCount + 1))}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="w-5 h-5" />
                </motion.button>
              </div>
              
              <p className="text-xs text-center text-green-400/80 italic mb-4">
                Se crearán {poisonedCount} ficha{poisonedCount > 1 ? 's' : ''} insecto con +{poisonedCount} de ataque
              </p>

              {/* Action */}
              <motion.button
                className={`w-full py-2.5 rounded-lg ${playerBgClass} text-white font-display font-bold uppercase text-sm tracking-wider flex items-center justify-center gap-2 shadow-lg`}
                onClick={handleConfirm}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Check className="w-4 h-4" />
                Invocar {poisonedCount} Insecto{poisonedCount > 1 ? 's' : ''}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};