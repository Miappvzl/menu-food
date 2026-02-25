"use client";

import { useState } from "react";
import { useCart } from "../context/CartContext";
import { motion, AnimatePresence } from "framer-motion";

export default function CheckoutModal() {
  const { cart, removeFromCart, cartTotal, rateVES, isCheckoutOpen, setIsCheckoutOpen, storeSettings, storeModifiers } = useCart();
  
  const [clientName, setClientName] = useState("");
  const [orderType, setOrderType] = useState("Delivery");
  const [address, setAddress] = useState("");

  const totalVES = (cartTotal * rateVES).toFixed(2);

  const sendToWhatsApp = () => {
    // Lógica de WhatsApp intacta...
    let msg = `*NUEVO PEDIDO - ${storeSettings?.name ? storeSettings.name.toUpperCase() : 'NUESTRO LOCAL'}* 🍔\n`;
    msg += `👤 *Cliente:* ${clientName || "Cliente"}\n`;
    msg += `🛵 *Modalidad:* ${orderType}\n`;
    if (orderType === "Delivery" && address) {
      msg += `📍 *Dirección:* ${address}\n`;
    }
    msg += `--------------------------------\n\n`;
    
    cart.forEach(item => {
      const sub = item.unitPrice * item.qty;
      msg += `▪️ *${item.qty}x ${item.product.name}* ($${sub.toFixed(2)})\n`;

      if (item.mods.length) {
        const modNames = item.mods.map(mId => storeModifiers.find((m: any) => m.id === mId)?.name).join(', ');
        msg += `   _Extras: ${modNames}_\n`;
      }
    });

    msg += `\n--------------------------------\n`;
    msg += `*TOTAL USD: $${cartTotal.toFixed(2)}*\n`;
    msg += `*TOTAL VES: Bs. ${totalVES}*\n`;
    msg += `_(Tasa BCV: ${rateVES})_\n`;
    msg += `--------------------------------\n`;
    msg += `\n💳 _Por favor, indíquenme los métodos de pago._`;

    const phone = storeSettings?.phone ? storeSettings.phone.replace(/\D/g, '') : ""; 
    
    if (!phone) {
      alert("El local aún no ha configurado su número de WhatsApp.");
      return;
    }

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <AnimatePresence>
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          {/* Overlay oscuro con blur */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            onClick={() => setIsCheckoutOpen(false)} 
          />
          
          {/* Modal Principal */}
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full h-[92vh] max-h-[850px] bg-[#121212] rounded-t-[32px] flex flex-col border-t border-[#D4AF37]/20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            {/* Header del Modal */}
            <div className="px-6 py-5 flex justify-between items-center border-b border-white/5 bg-[#121212]/80 backdrop-blur-sm sticky top-0 z-20">
              <h2 className="font-bebas text-3xl text-white tracking-widest drop-shadow-md">Tu Cuenta</h2>
              <button 
                onClick={() => setIsCheckoutOpen(false)} 
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            {/* Contenido (Scrollable) */}
            <div className="flex-1 overflow-y-auto overscroll-contain no-scrollbar p-6">
              
              {/* Lista de Productos */}
              <div className="space-y-4 mb-8">
                <AnimatePresence>
                  {cart.map((item) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, x: -20 }} // Animación suave al eliminar
                      layout // Permite que los elementos restantes se reacomoden fluidamente
                      className="flex gap-4 p-4 bg-[#1A1A1A] rounded-2xl border border-white/5 group relative overflow-hidden"
                    >
                      <div className="w-20 h-20 bg-gradient-to-br from-[#1A1A1A] to-[#050505] rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center border border-white/5">
                        {item.product.image_url ? (
                          <img src={item.product.image_url} className="w-full h-full object-cover opacity-90" />
                        ) : (
                          <span className="text-[10px] text-zinc-600 font-bebas tracking-widest">Gourmet</span>
                        )}
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="flex justify-between items-start mb-1 gap-2">
                          <h4 className="font-bebas text-xl text-white leading-tight line-clamp-2">{item.product.name}</h4>
                          <span className="font-bebas text-xl text-[#F5A623] drop-shadow-sm shrink-0">
                            ${(item.unitPrice * item.qty).toFixed(2)}
                          </span>
                        </div>
                        
                        <div className="text-xs text-zinc-400 mb-3 font-light">
                          <span className="font-medium text-white/80">{item.qty}x</span> ${item.product.price.toFixed(2)}
                          {item.mods.length > 0 && (
                            <div className="text-[11px] text-zinc-500 mt-1.5 flex flex-wrap gap-1.5 leading-tight">
                              <span className="text-[#D4AF37]">✦</span> 
                              {item.mods.map(mId => storeModifiers.find((m: any) => m.id === mId)?.name).join(', ')}
                            </div>
                          )}
                        </div>
                        
                        <button 
                          onClick={() => removeFromCart(item.id)} 
                          className="text-[10px] text-zinc-500 hover:text-red-400 font-bold uppercase tracking-widest transition-colors self-start flex items-center gap-1"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/></svg>
                          Quitar
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Formulario de Datos */}
              <div className="mt-2">
                <h4 className="font-bebas text-2xl text-white mb-5 tracking-widest flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.8)]"></span> 
                  Datos de Entrega
                </h4>
                
                <div className="space-y-4">
                  {/* Input Nombre */}
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="¿Quién recibe el pedido?" 
                      value={clientName} 
                      onChange={e => setClientName(e.target.value)} 
                      className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl py-4 px-5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37]/50 focus:bg-[#222] focus:ring-1 focus:ring-[#D4AF37]/20 transition-all" 
                    />
                  </div>
                  
                  {/* Select Tipo de Orden */}
                  <div className="relative">
                    <select 
                      value={orderType} 
                      onChange={e => setOrderType(e.target.value)} 
                      className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl py-4 px-5 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50 focus:bg-[#222] focus:ring-1 focus:ring-[#D4AF37]/20 appearance-none transition-all cursor-pointer"
                    >
                      <option value="Delivery">🛵 Enviar a Domicilio (Delivery)</option>
                      <option value="Pick Up">🛍️ Pasaré a retirarlo (Pick Up)</option>
                      <option value="Comer en local">🍽️ Comeré en el local</option>
                    </select>
                    {/* Flecha personalizada para el select */}
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-zinc-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>

                  {/* Dirección Dinámica */}
                  <AnimatePresence>
                    {orderType === "Delivery" && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="relative overflow-hidden"
                      >
                        {storeSettings?.delivery_cities?.length > 0 ? (
                          <div className="relative mt-4">
                            <select 
                              value={address} 
                              onChange={e => setAddress(e.target.value)} 
                              className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl py-4 px-5 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50 focus:bg-[#222] focus:ring-1 focus:ring-[#D4AF37]/20 appearance-none transition-all cursor-pointer"
                            >
                              <option value="">📍 Selecciona tu zona de entrega...</option>
                              {storeSettings.delivery_cities.map((city: string) => (
                                <option key={city} value={city}>{city}</option>
                              ))}
                            </select>
                             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-zinc-400">
                               <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                             </div>
                          </div>
                        ) : (
                          <input 
                            type="text" 
                            placeholder="📍 Dirección exacta (Ej: Av. Principal, Edif. X, Apto 4)" 
                            value={address} 
                            onChange={e => setAddress(e.target.value)} 
                            className="w-full mt-4 bg-[#1A1A1A] border border-white/5 rounded-xl py-4 px-5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37]/50 focus:bg-[#222] focus:ring-1 focus:ring-[#D4AF37]/20 transition-all" 
                          />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              </div>
            </div>

            {/* Footer Fijo: Totales y Botón de Pago */}
            <div className="bg-[#0A0A0A] p-6 pt-5 border-t border-white/5 pb-safe z-20 shrink-0">
              <div className="flex justify-between items-end mb-6">
                <span className="font-bebas text-3xl text-zinc-400 tracking-wide">Total a Pagar</span>
                <div className="text-right flex flex-col items-end">
                  <span className="font-bebas text-5xl text-white leading-none drop-shadow-md">
                    ${cartTotal.toFixed(2)}
                  </span>
                  <span className="text-sm font-medium text-zinc-400 mt-1.5 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                    Bs. {totalVES}
                  </span>
                </div>
              </div>
              
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={sendToWhatsApp} 
                className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F5A623] text-[#121212] h-14 rounded-2xl font-bold text-sm uppercase tracking-[0.2em] shadow-[0_5px_20px_rgba(212,175,55,0.3)] border border-[#F5A623]/50 flex items-center justify-center gap-3"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                Confirmar por WhatsApp
              </motion.button>
            </div>
            
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}