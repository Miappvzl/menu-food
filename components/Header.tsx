"use client";

import { useCart } from "../context/CartContext";
import { motion } from "framer-motion";

export default function Header() {
  const { storeSettings } = useCart();

  // Esqueleto de carga Premium
  if (!storeSettings) {
    return (
      <header className="relative h-[45vh] w-full bg-[#0A0A0A] overflow-hidden">
        <motion.div 
          animate={{ opacity: [0.2, 0.4, 0.2] }} 
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="absolute inset-0 bg-[#151515]" 
        />
      </header>
    );
  }

  return (
    <header className="relative h-[45vh] md:h-[50vh] w-full flex items-end overflow-hidden bg-[#0A0A0A]">
      
      {/* Fondo de Imagen con efecto "Scale-out" Cinematográfico */}
      <div className="absolute inset-0 z-0 bg-[#0A0A0A]">
        <motion.img 
          initial={{ scale: 1.15 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          src={storeSettings.hero_url} 
          alt="Fondo" 
          className="w-full h-full object-cover opacity-60" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/60 to-transparent"></div>
      </div>
      
      {/* Información del Local (Todo unificado en el mismo flujo) */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
        className="relative z-10 px-5 pb-8 w-full flex flex-col items-start"
      >
        {/* Logo integrado en la estructura (ahora usa margen inferior 'mb-4') */}
        <div className="w-16 h-16 bg-[#121212]/50 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shadow-[0_15px_30px_rgba(0,0,0,0.4)] mb-4">
          <img 
            src={storeSettings.logo_url} 
            alt="Logo del comercio" 
            className="w-10 h-10 object-contain filter drop-shadow-lg" 
          />
        </div>
        
        {/* Badge "Abierto Ahora" (ahora tiene margen inferior 'mb-3' para separarlo del título) */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-[#121212]/60 backdrop-blur-md shadow-sm mb-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-[0.2em] pt-px">
            Abierto Ahora
          </span>
        </div>
        
        {/* Título más imponente */}
        <h1 className="font-bebas text-6xl md:text-7xl text-white leading-[0.85] tracking-tight drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)]">
          {storeSettings.name}
        </h1>
        
        {/* Horario con icono dorado */}
        <div className="flex items-center gap-2 mt-4 text-zinc-400 text-sm font-light">
          <svg className="w-4 h-4 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>{storeSettings.schedule}</p>
        </div>
      </motion.div>
      
    </header>
  );
}