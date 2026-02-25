"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleAuth = async (type: 'login' | 'signup') => {
    setLoading(true);
    setMessage("");
    
    const { data, error } = type === 'login' 
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      if (type === 'signup') {
        setMessage("¡Cuenta creada con éxito! Ahora dale a Iniciar Sesión.");
      } else {
        setMessage("¡Acceso concedido! Preparando tu panel...");
        window.location.href = "/admin/dashboard"; 
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-5 relative z-10 overflow-hidden">
      {/* Fondo Premium (Radial Gradient) */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#D4AF37]/10 via-[#050505] to-[#050505] z-0" />
      
      {/* Contenedor Principal Flotante */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-sm bg-[#121212]/80 backdrop-blur-xl p-8 md:p-10 rounded-[32px] border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.6)] relative z-10 overflow-hidden"
      >
        {/* Línea superior dorada decorativa */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#D4AF37] to-[#F5A623]"></div>
        
        {/* Header del Login */}
        <div className="text-center mb-8">
          <h1 className="font-bebas text-5xl tracking-widest text-white drop-shadow-md">
            Webild <span className="text-[#D4AF37]">POS</span>
          </h1>
          <p className="text-zinc-400 text-sm font-light mt-1">Acceso Administrativo</p>
        </div>

        {/* Inputs */}
        <div className="space-y-5">
          <div>
            <label className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold block mb-2">Correo Electrónico</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#D4AF37] transition-colors duration-300">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              </div>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#D4AF37]/50 focus:bg-[#222] focus:ring-1 focus:ring-[#D4AF37]/20 transition-all"
                placeholder="admin@restaurante.com"
              />
            </div>
          </div>
          
          <div>
            <label className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold block mb-2">Contraseña</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#D4AF37] transition-colors duration-300">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </div>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#D4AF37]/50 focus:bg-[#222] focus:ring-1 focus:ring-[#D4AF37]/20 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>
        </div>

        {/* Mensajes de Alerta Animados */}
        <AnimatePresence>
          {message && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 20 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="overflow-hidden"
            >
              <div className={`p-3 border rounded-xl text-xs text-center font-medium ${
                message.includes('Error') 
                  ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}>
                {message}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botones de Acción */}
        <div className="mt-8 flex flex-col gap-4">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleAuth('login')}
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F5A623] disabled:from-zinc-800 disabled:to-zinc-800 text-[#121212] h-14 rounded-2xl font-bold text-sm uppercase tracking-[0.2em] shadow-[0_5px_20px_rgba(212,175,55,0.3)] transition-all flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-[#121212] border-t-transparent rounded-full animate-spin"></div>
                Procesando...
              </>
            ) : 'Iniciar Sesión'}
          </motion.button>
          
          {/* Divisor Elegante */}
          <div className="relative flex items-center justify-center my-1">
            <div className="absolute w-full h-px bg-white/5"></div>
            <span className="relative bg-[#121212] px-4 text-[10px] text-zinc-600 font-bold uppercase tracking-widest">O</span>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleAuth('signup')}
            disabled={loading}
            className="w-full bg-transparent border border-white/10 disabled:text-zinc-700 text-zinc-300 h-14 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center"
          >
            Crear Nueva Cuenta
          </motion.button>
        </div>
        
      </motion.div>
    </div>
  );
}