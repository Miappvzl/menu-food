"use client";

import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { motion, AnimatePresence } from "framer-motion"; // <-- Framer Motion

interface Props {
  product: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductModal({ product, isOpen, onClose }: Props) {
  const { addToCart, storeModifiers } = useCart();
  const [qty, setQty] = useState(1);
  const [selectedMods, setSelectedMods] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setQty(1);
      setSelectedMods([]);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isOpen]);

  const allowedModIds = product?.allowed_modifiers || [];
  const productMods = storeModifiers.filter(m => allowedModIds.includes(m.id));

  const modsPrice = selectedMods.reduce((total, modId) => {
    const mod = storeModifiers.find(m => m.id === modId);
    return total + (mod?.price || 0);
  }, 0);
  
  const unitPrice = (product?.price || 0) + modsPrice;
  const totalPrice = unitPrice * qty;

  const handleToggleMod = (modId: string) => {
    setSelectedMods(prev => prev.includes(modId) ? prev.filter(id => id !== modId) : [...prev, modId]);
  };

  return (
    <AnimatePresence>
      {isOpen && product && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Overlay oscuro */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md" 
          />
          
          {/* Contenedor del Modal con físicas Spring */}
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full bg-[#121212] rounded-t-[32px] border-t border-[#D4AF37]/20 flex flex-col max-h-[92vh] overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
          >
            {/* Botón Cerrar Premium */}
            <button type="button" onClick={onClose} className="absolute top-5 right-5 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md text-white/80 flex items-center justify-center border border-white/10 hover:bg-black hover:text-white transition-all">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <div className="flex-1 overflow-y-auto overscroll-contain no-scrollbar relative">
              
              {/* Imagen con Parallax/Scale */}
              <div className="relative w-full h-[40vh] min-h-[280px] shrink-0 overflow-hidden bg-[#0A0A0A]">
                {product.image_url ? (
                  <motion.img 
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    src={product.image_url} 
                    alt={product.name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-zinc-700 font-bebas text-3xl tracking-widest">Gourmet</span>
                  </div>
                )}
                {/* Gradiente más suave para integrar la imagen con el fondo */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/40 to-transparent"></div>
              </div>
              
              <div className="px-6 -mt-16 relative z-10 pb-8">
                {/* Título y Descripción */}
                <motion.h2 
                  initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                  className="font-bebas text-5xl text-white leading-none mb-3 drop-shadow-lg"
                >
                  {product.name}
                </motion.h2>
                <motion.p 
                  initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                  className="text-zinc-400 text-base font-light leading-relaxed mb-8"
                >
                  {product.description}
                </motion.p>
                
                {productMods.length > 0 && (
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                    <h4 className="font-bebas text-2xl text-[#D4AF37] mb-4 tracking-widest uppercase">Personaliza tu pedido</h4>
                    
                    <div className="space-y-3">
                      {productMods.map((m: any) => {
                        const isSelected = selectedMods.includes(m.id);
                        return (
                          <motion.div 
                            whileTap={{ scale: 0.98 }}
                            key={m.id} 
                            onClick={() => handleToggleMod(m.id)} 
                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                              isSelected 
                                ? 'bg-[#D4AF37]/10 border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.1)]' 
                                : 'bg-[#1A1A1A] border-white/5 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                isSelected ? 'border-[#D4AF37] bg-[#D4AF37]' : 'border-zinc-600'
                              }`}>
                                {isSelected && <svg className="w-4 h-4 text-[#121212]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                              </div>
                              <span className={`text-sm font-medium tracking-wide ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                                {m.name}
                              </span>
                            </div>
                            <span className={`text-sm font-bold ${isSelected ? 'text-[#D4AF37]' : 'text-zinc-400'}`}>
                              +${Number(m.price).toFixed(2)}
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Footer de Acción Flotante */}
            <div className="p-5 border-t border-white/5 bg-[#0A0A0A] shrink-0 z-20 pb-safe">
              <div className="flex items-center gap-4">
                
                {/* Selector de Cantidad Premium */}
                <div className="flex items-center bg-[#1A1A1A] rounded-2xl h-14 px-1 border border-white/5">
                  <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="w-12 h-full flex items-center justify-center text-zinc-400 hover:text-[#D4AF37] transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14"/></svg>
                  </button>
                  <span className="font-bebas text-2xl w-10 text-center pt-1 text-white">{qty}</span>
                  <button type="button" onClick={() => setQty(qty + 1)} className="w-12 h-full flex items-center justify-center text-zinc-400 hover:text-[#D4AF37] transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                  </button>
                </div>

                {/* Botón Agregar Animado */}
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => {
                    addToCart({ product, qty, mods: selectedMods, unitPrice });
                    onClose();
                  }} 
                  className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#F5A623] text-[#121212] h-14 rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_5px_20px_rgba(212,175,55,0.3)] border border-[#F5A623]/50"
                >
                  <span>Agregar al pedido</span>
                  <div className="bg-[#121212]/20 px-3 py-1.5 rounded-lg text-sm border border-[#121212]/10 backdrop-blur-sm">
                    ${totalPrice.toFixed(2)}
                  </div>
                </motion.button>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}