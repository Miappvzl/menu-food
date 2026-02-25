"use client";

import { motion } from "framer-motion";

interface Props {
  categories: any[];
  activeCat: string;
  setActiveCat: (id: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export default function CategoryNav({ categories, activeCat, setActiveCat, searchTerm, setSearchTerm }: Props) {
  return (
    <div className="w-full">
      {/* Buscador Premium */}
      <div className="px-5 pt-4 pb-2">
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#D4AF37] transition-colors duration-300">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.3-4.3"/>
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="Buscar especialidades..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full bg-[#121212]/80 backdrop-blur-md border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37]/50 focus:bg-[#1A1A1A] focus:ring-1 focus:ring-[#D4AF37]/30 transition-all duration-300 font-medium shadow-inner" 
          />
        </div>
      </div>

      {/* Navegación de Categorías (Magic Pill) */}
      <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 py-3 snap-x items-center">
        {categories.map((c) => {
          const isActive = activeCat === c.id;

          return (
            <button 
              key={c.id} 
              onClick={() => setActiveCat(c.id)} 
              className="relative h-10 px-5 rounded-xl flex items-center justify-center min-w-max select-none group snap-start"
            >
              {/* Fondo animado que se desliza (La magia de Framer Motion) */}
              {isActive && (
                <motion.div
                  layoutId="activeCategoryPill"
                  className="absolute inset-0 bg-gradient-to-r from-[#D4AF37] to-[#F5A623] rounded-xl shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              {/* Borde sutil para los inactivos */}
              {!isActive && (
                <div className="absolute inset-0 border border-white/10 rounded-xl group-hover:border-white/20 transition-colors" />
              )}

              {/* Texto de la categoría */}
              <span 
                className={`relative z-10 text-xs font-bold uppercase tracking-[0.15em] transition-colors duration-300 pt-0.5 ${
                  isActive ? 'text-[#121212]' : 'text-zinc-400 group-hover:text-zinc-200'
                }`}
              >
                {c.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}