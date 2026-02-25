// app/admin/login/page.tsx
"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

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
        setMessage("¡Cuenta creada! Ahora dale a Iniciar Sesión.");
      } else {
        setMessage("¡Acceso concedido! Redirigiendo...");
        window.location.href = "/admin/dashboard"; // Redirige al panel
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-5 relative z-10">
      <div className="w-full max-w-sm bg-[#0A0A0A] p-8 rounded-2xl border border-[rgba(255,255,255,0.08)] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-[#FF4500]"></div>
        
        <h1 className="font-bebas text-4xl text-white mb-1">Webild POS</h1>
        <p className="text-zinc-500 text-sm mb-8">Accede a tu panel administrativo</p>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block mb-1">Correo Electrónico</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-[#151515] border border-[rgba(255,255,255,0.05)] rounded-lg py-3 px-4 text-sm text-white focus:outline-none focus:border-[#FF4500]/50 transition-all"
              placeholder="admin@titostation.com"
            />
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block mb-1">Contraseña</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-[#151515] border border-[rgba(255,255,255,0.05)] rounded-lg py-3 px-4 text-sm text-white focus:outline-none focus:border-[#FF4500]/50 transition-all"
              placeholder="••••••••"
            />
          </div>
        </div>

        {message && (
          <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-lg text-xs text-zinc-300 text-center">
            {message}
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3">
          <button 
            onClick={() => handleAuth('login')}
            disabled={loading}
            className="w-full bg-[#FF4500] hover:bg-[#CC3700] disabled:bg-zinc-800 text-white h-12 rounded-xl font-bold text-sm uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center"
          >
            {loading ? 'Cargando...' : 'Iniciar Sesión'}
          </button>
          
          <button 
            onClick={() => handleAuth('signup')}
            disabled={loading}
            className="w-full bg-transparent border border-white/10 hover:bg-white/5 disabled:text-zinc-600 text-zinc-400 h-12 rounded-xl font-bold text-xs uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center"
          >
            Crear Cuenta Nueva
          </button>
        </div>
      </div>
    </div>
  );
}