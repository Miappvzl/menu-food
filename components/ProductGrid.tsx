"use client";

// 1. Añadimos la importación de "Variants"
import { motion, Variants } from "framer-motion"; 

interface Props {
  products: any[];
  activeCat: string;
  searchTerm: string;
  onProductClick: (product: any) => void;
}

export default function ProductGrid({ products, activeCat, searchTerm, onProductClick }: Props) {
  const filteredProducts = products.filter(p => {
    const matchCat = activeCat === "all" || p.category_id === activeCat;
    const matchTerm = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchTerm;
  });

  // 2. Le decimos a TypeScript que esto es de tipo Variants
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1 
      }
    }
  };

  // 3. Hacemos lo mismo aquí
  const item: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring", stiffness: 300, damping: 24 } 
    }
  };

  // ... (el resto del return sigue exactamente igual)

  return (
    <>
      <div className="flex justify-between items-end mb-8 px-2">
        <h3 className="font-bebas text-4xl text-white tracking-widest drop-shadow-md">Carta</h3>
        <span className="text-xs text-[#D4AF37] font-bold uppercase tracking-[0.2em] bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/20">
          {filteredProducts.length} ITEMS
        </span>
      </div>

      {filteredProducts.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-20 flex flex-col items-center justify-center text-center opacity-70"
        >
          <div className="w-16 h-16 mb-4 rounded-full bg-[#1A1A1A] border border-white/5 flex items-center justify-center">
            <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-zinc-500 font-bebas text-2xl tracking-widest">Plato no encontrado</p>
          <p className="text-zinc-600 text-sm mt-1">Intenta con otra búsqueda o categoría.</p>
        </motion.div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4"
        >
          {filteredProducts.map(p => (
            <motion.div 
              key={p.id} 
              variants={item}
              whileHover={{ scale: 1.02, y: -5 }} // Efecto de levitar al pasar el mouse
              whileTap={{ scale: 0.96 }} // Efecto de hundirse al tocar
              onClick={() => onProductClick(p)} 
              className="relative bg-[#121212] rounded-[28px] p-4 flex items-center gap-5 border border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.4)] cursor-pointer group overflow-hidden"
            >
              {/* Resplandor de fondo al hacer hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/0 via-[#D4AF37]/0 to-[#D4AF37]/0 group-hover:from-[#D4AF37]/5 transition-all duration-500 pointer-events-none" />

              {/* Contenedor de la Imagen */}
              <div className="w-28 h-28 bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] rounded-[20px] overflow-visible flex-shrink-0 relative flex items-center justify-center border border-white/5 group-hover:border-[#D4AF37]/30 transition-colors shadow-inner">
                {/* Nota: Si usas PNGs transparentes, quita 'overflow-hidden' del div padre 
                  y deja que la imagen sea un poco más grande (ej: w-[120%] h-[120%]) 
                  para que se "salga" del recuadro. 
                */}
                <motion.img 
                  layoutId={`product-image-${p.id}`} // Útil si en el futuro quieres animar la imagen directo al modal
                  src={p.image_url} 
                  alt={p.name} 
                  className="w-full h-full object-cover rounded-[18px] opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 ease-out" 
                />
              </div>

              {/* Información del Producto */}
              <div className="flex flex-col justify-center flex-1 relative z-10 py-2">
                
                {/* Etiqueta de Promoción Premium */}
                {p.is_hot && (
                  <div className="flex items-center gap-1 mb-1.5">
                    <span className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-widest bg-[#D4AF37]/10 px-2 py-0.5 rounded-md border border-[#D4AF37]/20 shadow-[0_0_10px_rgba(212,175,55,0.2)]">
                      ⭐ Especial del Chef
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-start mb-1 gap-2">
                  <h4 className="font-bebas text-2xl text-white leading-tight group-hover:text-[#D4AF37] transition-colors line-clamp-2">
                    {p.name}
                  </h4>
                </div>
                
                <p className="text-zinc-500 text-xs line-clamp-2 mb-3 font-light leading-relaxed">
                  {p.description}
                </p>
                
                {/* Precio con diseño tipo "Tag" */}
                <div className="mt-auto">
                  <span className="font-bebas text-[#F5A623] text-2xl tracking-wide drop-shadow-sm">
                    ${p.price.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Icono de Acción (Flecha) sutil */}
              <div className="absolute right-4 bottom-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
                 <svg className="w-4 h-4 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                 </svg>
              </div>

            </motion.div>
          ))}
        </motion.div>
      )}
    </>
  );
}