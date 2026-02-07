import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Palette, Check } from 'lucide-react';

export interface PlayerColors {
  player1: string;
  player2: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerColors: PlayerColors;
  onColorsChange: (colors: PlayerColors) => void;
}

export const COLOR_OPTIONS = [
  { id: 'gold', name: 'Dorado', hsl: '40 90% 50%', class: 'bg-amber-500' },
  { id: 'blue', name: 'Azul', hsl: '210 80% 55%', class: 'bg-blue-500' },
  { id: 'red', name: 'Rojo', hsl: '0 75% 55%', class: 'bg-red-500' },
  { id: 'green', name: 'Verde', hsl: '150 70% 45%', class: 'bg-emerald-500' },
  { id: 'purple', name: 'Púrpura', hsl: '280 60% 55%', class: 'bg-purple-500' },
  { id: 'cyan', name: 'Cian', hsl: '180 70% 50%', class: 'bg-cyan-500' },
  { id: 'orange', name: 'Naranja', hsl: '30 90% 55%', class: 'bg-orange-500' },
  { id: 'pink', name: 'Rosa', hsl: '330 70% 60%', class: 'bg-pink-500' },
];

export const SettingsModal = ({
  isOpen,
  onClose,
  playerColors,
  onColorsChange,
}: SettingsModalProps) => {
  const [tempColors, setTempColors] = useState(playerColors);

  useEffect(() => {
    if (isOpen) {
      setTempColors(playerColors);
    }
  }, [isOpen, playerColors]);

  const handleColorSelect = (player: 'player1' | 'player2', colorId: string) => {
    setTempColors(prev => ({ ...prev, [player]: colorId }));
  };

  const handleSave = () => {
    onColorsChange(tempColors);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative w-full max-w-lg bg-card border-2 border-border rounded-2xl shadow-2xl overflow-hidden"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 bg-muted/50 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold text-lg">Configuración</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-5">
            {/* Player 1 Color - Horizontal */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                Color Jugador 1
              </label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => handleColorSelect('player1', color.id)}
                    className={`relative flex-shrink-0 w-12 h-12 rounded-xl border-2 transition-all ${
                      tempColors.player1 === color.id
                        ? 'border-white ring-2 ring-white/50 scale-110'
                        : 'border-transparent hover:border-white/30'
                    }`}
                    title={color.name}
                  >
                    <div 
                      className="w-full h-full rounded-lg"
                      style={{ backgroundColor: `hsl(${color.hsl})` }}
                    />
                    {tempColors.player1 === color.id && (
                      <motion.div
                        layoutId="player1-check"
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <Check className="w-5 h-5 text-white drop-shadow-lg" />
                      </motion.div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Seleccionado: <span className="font-medium">{COLOR_OPTIONS.find(c => c.id === tempColors.player1)?.name}</span>
              </p>
            </div>

            {/* Player 2 Color - Horizontal */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                Color Jugador 2
              </label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => handleColorSelect('player2', color.id)}
                    className={`relative flex-shrink-0 w-12 h-12 rounded-xl border-2 transition-all ${
                      tempColors.player2 === color.id
                        ? 'border-white ring-2 ring-white/50 scale-110'
                        : 'border-transparent hover:border-white/30'
                    }`}
                    title={color.name}
                  >
                    <div 
                      className="w-full h-full rounded-lg"
                      style={{ backgroundColor: `hsl(${color.hsl})` }}
                    />
                    {tempColors.player2 === color.id && (
                      <motion.div
                        layoutId="player2-check"
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <Check className="w-5 h-5 text-white drop-shadow-lg" />
                      </motion.div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Seleccionado: <span className="font-medium">{COLOR_OPTIONS.find(c => c.id === tempColors.player2)?.name}</span>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-muted/30 border-t border-border flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-border bg-card hover:bg-muted transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity"
            >
              Guardar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export const getColorHsl = (colorId: string): string => {
  const color = COLOR_OPTIONS.find(c => c.id === colorId);
  return color?.hsl || '40 90% 50%';
};