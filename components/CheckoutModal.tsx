"use client";

import { useState } from "react";
import { useCart } from "../context/CartContext";

export default function CheckoutModal() {
  const { cart, removeFromCart, cartTotal, rateVES, isCheckoutOpen, setIsCheckoutOpen, storeSettings, storeModifiers } = useCart();
  
  const [clientName, setClientName] = useState("");
  const [orderType, setOrderType] = useState("Delivery");
  const [address, setAddress] = useState("");

  if (!isCheckoutOpen) return null;

  const totalVES = (cartTotal * rateVES).toFixed(2);

  const sendToWhatsApp = () => {
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
    <div className={`fixed inset-0 z-[60] flex flex-col justify-end transition-all duration-300 ${isCheckoutOpen ? 'visible' : 'invisible'}`}>
      <div className={`absolute inset-0 bg-black/95 backdrop-blur-md transition-opacity duration-300 ${isCheckoutOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsCheckoutOpen(false)} />
      
      <div className={`relative w-full h-[95vh] bg-[#0A0A0A] rounded-t-[24px] flex flex-col transition-transform duration-300 ease-out ${isCheckoutOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        
        <div className="px-6 py-5 flex justify-between items-center border-b border-[rgba(255,255,255,0.08)]">
          <h2 className="font-bebas text-2xl text-white tracking-wide">Tu Cuenta</h2>
          <button onClick={() => setIsCheckoutOpen(false)} className="w-8 h-8 flex items-center justify-center text-zinc-400 active:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain no-scrollbar p-5">
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="flex gap-4 border-b border-white/5 pb-4 last:border-0 group">
                <div className="w-16 h-16 bg-[#151515] rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center border border-white/5">
                  {item.product.image_url ? (
                    <img src={item.product.image_url} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest text-center px-1">Sin Foto</span>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bebas text-lg text-white leading-none">{item.product.name}</h4>
                    <span className="font-bold text-sm text-[#FF4500] leading-none">${(item.unitPrice * item.qty).toFixed(2)}</span>
                  </div>
                  
                  <div className="text-xs text-zinc-500 mb-2">
                    <span className="font-medium">{item.qty}x ${item.product.price.toFixed(2)}</span>
                    {item.mods.length > 0 && (
                      <div className="text-[10px] text-zinc-400 mt-1 uppercase tracking-wider flex flex-wrap gap-1">
                        <span className="text-[#FF4500] font-bold">+</span> 
                        {item.mods.map(mId => storeModifiers.find((m: any) => m.id === mId)?.name).join(', ')}
                      </div>
                    )}
                  </div>
                  
                  <button onClick={() => removeFromCart(item.id)} className="text-[10px] text-zinc-600 hover:text-red-500 font-bold uppercase tracking-wider transition-colors self-start">Eliminar</button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <h4 className="font-bebas text-lg text-white mb-4 tracking-wide flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF4500]"></span> Datos del Pedido
            </h4>
            <div className="space-y-3">
              <input type="text" placeholder="Tu Nombre" value={clientName} onChange={e => setClientName(e.target.value)} className="w-full bg-[#151515] border border-[rgba(255,255,255,0.05)] rounded-lg py-3 px-4 text-sm text-white focus:outline-none focus:border-[#FF4500]/50 transition-colors" />
              <select value={orderType} onChange={e => setOrderType(e.target.value)} className="w-full bg-[#151515] border border-[rgba(255,255,255,0.05)] rounded-lg py-3 px-4 text-sm text-white focus:outline-none focus:border-[#FF4500]/50 appearance-none transition-colors">
                <option value="Delivery">Delivery (Envío a domicilio)</option>
                <option value="Pick Up">Pick Up (Retiro en local)</option>
                <option value="Comer en local">Comer en el local</option>
              </select>
              {orderType === "Delivery" && (
                storeSettings?.delivery_cities?.length > 0 ? (
                  <select 
                    value={address} 
                    onChange={e => setAddress(e.target.value)} 
                    className="w-full bg-[#151515] border border-[rgba(255,255,255,0.05)] rounded-lg py-3 px-4 text-sm text-white focus:outline-none focus:border-[#FF4500]/50 appearance-none transition-colors"
                  >
                    <option value="">Selecciona tu zona de entrega...</option>
                    {storeSettings.delivery_cities.map((city: string) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                ) : (
                  <input type="text" placeholder="Dirección exacta de entrega" value={address} onChange={e => setAddress(e.target.value)} className="w-full bg-[#151515] border border-[rgba(255,255,255,0.05)] rounded-lg py-3 px-4 text-sm text-white focus:outline-none focus:border-[#FF4500]/50 transition-colors" />
                )
              )}
            </div>
          </div>
        </div>

        <div className="bg-[#0F0F0F] p-6 border-t border-[rgba(255,255,255,0.05)] pb-8 z-20 shrink-0">
          <div className="flex justify-between items-center mb-6">
            <span className="font-bebas text-2xl text-white">Total a Pagar</span>
            <div className="text-right flex flex-col items-end">
              <span className="font-bebas text-4xl text-[#FF4500] leading-none">${cartTotal.toFixed(2)}</span>
              <span className="text-xs font-bold text-zinc-500 mt-1">Bs. {totalVES}</span>
            </div>
          </div>
          <button onClick={sendToWhatsApp} className="w-full bg-[#FF4500] hover:bg-[#CC3700] text-white h-14 rounded-xl font-bold text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(255,69,0,0.15)] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            Procesar Pedido
          </button>
        </div>
      </div>
    </div>
  );
}