"use client";

import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";

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

  if (!product) return null;

  const allowedModIds = product.allowed_modifiers || [];
  const productMods = storeModifiers.filter(m => allowedModIds.includes(m.id));

  const modsPrice = selectedMods.reduce((total, modId) => {
    const mod = storeModifiers.find(m => m.id === modId);
    return total + (mod?.price || 0);
  }, 0);
  
  const unitPrice = product.price + modsPrice;
  const totalPrice = unitPrice * qty;

  const handleToggleMod = (modId: string) => {
    setSelectedMods(prev => prev.includes(modId) ? prev.filter(id => id !== modId) : [...prev, modId]);
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col justify-end transition-all duration-300 ${isOpen ? 'visible' : 'invisible'}`}>
      <div className={`absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      
      <div className={`relative w-full bg-[#0F0F0F] rounded-t-[24px] border-t border-[rgba(255,255,255,0.08)] flex flex-col max-h-[90vh] overflow-hidden transition-transform duration-300 ease-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        
        <button type="button" onClick={onClose} className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center border border-white/10 hover:bg-black/60 active:scale-95 transition-all">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <div className="flex-1 overflow-y-auto overscroll-contain no-scrollbar relative">
          
          <div className="relative w-full h-[35vh] min-h-[250px] shrink-0">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#151515] flex items-center justify-center">
                <span className="text-zinc-600 font-bebas text-2xl tracking-widest">SIN FOTO</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-[#0F0F0F]/80 to-transparent"></div>
          </div>
          
          <div className="px-6 -mt-20 relative z-10 pb-8">
            <h2 className="font-bebas text-4xl text-white leading-none mb-2">{product.name}</h2>
            <p className="text-zinc-400 text-sm font-light leading-relaxed mb-6">{product.description}</p>
            
            {productMods.length > 0 && (
              <>
                <div className="w-full h-px bg-white/5 mb-6"></div>
                <h4 className="font-bebas text-xl text-white mb-3 tracking-wide">Extras Disponibles</h4>
                
                <div className="space-y-2">
                  {productMods.map((m: any) => (
                    <div key={m.id} onClick={() => handleToggleMod(m.id)} className="flex items-center justify-between bg-[#151515] p-3 rounded-xl border border-[rgba(255,255,255,0.05)] cursor-pointer active:scale-[0.98] transition-all group select-none">
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-[4px] border flex items-center justify-center transition-colors ${selectedMods.includes(m.id) ? 'bg-[#FF4500] border-[#FF4500]' : 'border-zinc-600 group-hover:border-zinc-400'}`}>
                          {selectedMods.includes(m.id) && <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                        </div>
                        <span className="text-zinc-300 text-sm font-bold uppercase tracking-wider">{m.name}</span>
                      </div>
                      <span className="text-[#FF4500] text-sm font-bold">+${Number(m.price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="p-5 border-t border-[rgba(255,255,255,0.05)] bg-[#0A0A0A] shrink-0 z-20">
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#151515] rounded-xl h-14 px-1 border border-[rgba(255,255,255,0.05)]">
              <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="w-12 h-full flex items-center justify-center text-zinc-500 hover:text-white active:scale-95 transition-all">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14"/></svg>
              </button>
              <span className="font-bebas text-2xl w-8 text-center pt-1 text-white">{qty}</span>
              <button type="button" onClick={() => setQty(qty + 1)} className="w-12 h-full flex items-center justify-center text-zinc-500 hover:text-white active:scale-95 transition-all">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              </button>
            </div>
            <button 
              type="button"
              onClick={() => {
                addToCart({ product, qty, mods: selectedMods, unitPrice });
                onClose();
              }} 
              className="flex-1 bg-[#FF4500] hover:bg-[#CC3700] text-white h-14 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,69,0,0.15)]"
            >
              <span>Agregar</span>
              <span className="bg-black/20 px-2.5 py-1 rounded-md text-xs border border-white/10">${totalPrice.toFixed(2)}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}