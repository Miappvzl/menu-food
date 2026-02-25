"use client";

import { useCart } from "../context/CartContext";
import { motion, AnimatePresence } from "framer-motion";

export default function CartDock() {
  const { cartCount, cartTotal, rateVES, setIsCheckoutOpen } = useCart();
  
  const totalVES = (cartTotal * rateVES).toFixed(2);

  return (
    <AnimatePresence>
      {cartCount > 0 && (
        <motion.div 
          initial={{ y: 150, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 150, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 25 }}
          className="fixed bottom-6 left-0 right-0 z-50 px-4 flex justify-center pointer-events-none"
        >
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setIsCheckoutOpen(true)} 
            className="w-full max-w-md bg-[#121212]/90 backdrop-blur-xl text-white rounded-[28px] p-3 shadow-[0_20px_40px_rgba(0,0,0,0.6)] border border-white/10 pointer-events-auto overflow-hidden relative group flex items-center"
          >
            {/* Brillo dinámico de fondo al pasar el cursor */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/0 via-[#D4AF37]/10 to-[#D4AF37]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10 flex w-full items-center justify-between px-2 py-1">
              
              {/* Bloque Izquierdo: Contador y Totales */}
              <div className="flex items-center gap-5">
                
                {/* Badge del Contador */}
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1A1A1A] to-[#050505] border border-[#D4AF37]/30 shadow-inner">
                  <span className="font-bebas text-2xl text-[#D4AF37] pt-1">{cartCount}</span>
                  <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#F5A623] border-2 border-[#121212]"></span>
                  </span>
                </div>
                
                {/* Precios Apilados (Modificado) */}
                <div className="flex flex-col items-start justify-center">
                  <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-[0.2em] mb-1.5 leading-none">
                    Tu Pedido
                  </span>
                  
                  {/* Dólares como protagonista */}
                  <span className="font-bebas text-3xl text-white leading-none tracking-wide drop-shadow-sm">
                    ${cartTotal.toFixed(2)}
                  </span>
                  
                  {/* Bolívares justo debajo con espacio para respirar */}
                  <span className="mt-1.5 text-[11px] font-medium text-zinc-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5 leading-none">
                    Bs. {totalVES}
                  </span>
                </div>
              </div>

              {/* Bloque Derecho: Botón de Acción Principal */}
              <div className="shrink-0 bg-gradient-to-r from-[#D4AF37] to-[#F5A623] text-[#121212] h-12 px-6 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.25)] border border-[#F5A623]/50">
                Pagar
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>

            </div>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}