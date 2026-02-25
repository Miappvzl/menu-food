"use client";

import { useCart } from "../context/CartContext";

export default function Header() {
  const { storeSettings } = useCart();

  // Mientras carga la info de Supabase, mostramos un fondo gris elegante
  if (!storeSettings) {
    return <header className="relative h-[45vh] w-full bg-[#0A0A0A] animate-pulse"></header>;
  }

  return (
    <header className="relative h-[45vh] w-full flex items-end overflow-hidden bg-[#0A0A0A]">
      <div className="absolute top-6 left-5 z-20 w-10 h-10 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 shadow-lg">
        <img 
          src={storeSettings.logo_url} 
          alt="Logo del comercio" 
          className="w-6 h-6 object-contain filter drop-shadow-md" 
        />
      </div>
      
      <div className="absolute inset-0 z-0">
        <img 
          src={storeSettings.hero_url} 
          alt="Fondo" 
          className="w-full h-full object-cover opacity-60" 
        />
        <div className="absolute inset-0 bg-linear-to-t from-[#050505] via-[#050505]/50 to-transparent"></div>
      </div>
      
      <div className="relative z-10 px-5 pb-8 w-full">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 rounded border border-[#FF4500]/30 bg-[#FF4500]/10 text-[#FF4500] text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
            Abierto Ahora
          </span>
        </div>
        {/* Aquí mostramos el nombre dinámico del negocio */}
        <h1 className="font-bebas text-5xl text-white leading-[0.9] tracking-tight">
          {storeSettings.name}
        </h1>
        <p className="text-zinc-400 text-sm mt-2">{storeSettings.schedule}</p>
      </div>
    </header>
  );
}