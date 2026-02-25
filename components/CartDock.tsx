// components/CartDock.tsx
"use client";

import { useCart } from "../context/CartContext";

export default function CartDock() {
  const { cartCount, cartTotal, rateVES, setIsCheckoutOpen } = useCart();
  
  const isVisible = cartCount > 0;
  const totalVES = (cartTotal * rateVES).toFixed(2);

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-40 transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1) ${isVisible ? 'translate-y-0' : 'translate-y-[150%]'}`}>
      <button 
        onClick={() => setIsCheckoutOpen(true)} 
        className="w-full bg-[#111] text-white rounded-xl p-1 shadow-2xl border border-[rgba(255,255,255,0.08)] active:scale-[0.98] transition-transform overflow-hidden relative group"
      >
        <div className="bg-[#FF4500] rounded-lg px-4 py-3.5 flex justify-between items-center relative z-10 shadow-[0_0_20px_rgba(255,69,0,0.15)]">
          <div className="flex items-center gap-3">
            <div className="bg-black/20 font-bebas text-lg h-7 w-7 rounded flex items-center justify-center pt-0.5">
              {cartCount}
            </div>
            <div className="flex flex-col items-start leading-none">
              <span className="text-[9px] font-bold uppercase text-white/70 tracking-widest mb-0.5">Total</span>
              <div className="flex items-end gap-1.5">
                <span className="font-bebas text-xl tracking-wide">${cartTotal.toFixed(2)}</span>
                <span className="text-[11px] font-bold text-white/60 mb-[3px]">Bs. {totalVES}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-black/15 px-3 py-1.5 rounded-md backdrop-blur-sm transition-colors hover:bg-black/25">
            Ver Pedido <span className="text-xs">→</span>
          </div>
        </div>
      </button>
    </div>
  );
}