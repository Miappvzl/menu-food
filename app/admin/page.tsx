"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function AdminPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const [settings, setSettings] = useState({
    id: "", name: "", slug: "",phone: "", rate_ves: 0, schedule: "", citiesStr: "", logo_url: "", hero_url: ""
  });
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // 1. Configuración general
    const { data: storeData } = await supabase.from('store_settings').select('*').single();
    if (storeData) {
      setSettings({
        ...storeData,
        citiesStr: storeData.delivery_cities ? storeData.delivery_cities.join(", ") : ""
      });
    }
    
    // 2. Categorías
    const { data: catData } = await supabase.from('categories').select('*');
    if (catData) setCategories(catData.filter(c => c.id !== 'all')); // Ocultamos 'all' del selector de creación

    // 3. Productos
    const { data: prodData } = await supabase.from('products').select('*').order('id', { ascending: true });
    if (prodData) setProducts(prodData);
    
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string, productId?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setToast("Subiendo imagen...");
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `images/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('menu_assets').upload(filePath, file);
    if (uploadError) {
      showToast("Error subiendo imagen");
      return;
    }

    const { data: publicUrlData } = supabase.storage.from('menu_assets').getPublicUrl(filePath);
    const imageUrl = publicUrlData.publicUrl;

    if (field === 'logo_url' || field === 'hero_url') {
      setSettings(prev => ({ ...prev, [field]: imageUrl }));
    } else if (field === 'product_image' && productId) {
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, image_url: imageUrl } : p));
    }
    showToast("¡Imagen lista! Recuerda Guardar.");
  };

  // --- NUEVAS FUNCIONES DE PRODUCTOS ---
  const handleAddProduct = async () => {
    setToast("Creando plato...");
    // Insertamos un borrador directo en Supabase para obtener un ID real inmediato
    const { error } = await supabase.from('products').insert([{
      name: "Nuevo Plato",
      price: 0,
      category_id: categories.length > 0 ? categories[0].id : null,
      description: "",
      is_available: true,
      is_hot: false
    }]);

    if (!error) {
      await fetchData(); // Recargamos para ver el nuevo plato
      showToast("¡Plato creado! Edita los detalles.");
    } else {
      showToast("Error al crear plato");
      console.error(error);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este plato definitivamente?")) return;
    
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) {
      setProducts(prev => prev.filter(p => p.id !== id));
      showToast("Plato eliminado");
    }
  };

  const updateProduct = (id: number, field: string, value: any) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };
  // -------------------------------------

  const handleSaveAll = async () => {
    setSaving(true);
    const citiesArray = settings.citiesStr.split(",").map(c => c.trim()).filter(c => c !== "");

    // Guardar Config
    await supabase.from('store_settings').update({
      name: settings.name, phone: settings.phone, rate_ves: settings.rate_ves,
      schedule: settings.schedule, delivery_cities: citiesArray, 
      logo_url: settings.logo_url, hero_url: settings.hero_url
    }).eq('id', settings.id);

    // Guardar todos los productos editados
    for (const p of products) {
      await supabase.from('products').update({
        name: p.name, description: p.description, price: p.price,
        image_url: p.image_url, is_available: p.is_available,
        is_hot: p.is_hot, category_id: p.category_id
      }).eq('id', p.id);
    }

    setSaving(false);
    showToast("¡Sincronizado con éxito!");
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-zinc-500 font-bebas text-xl">Cargando Webild POS...</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-5 pb-32 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-bebas text-3xl tracking-wide text-[#FF4500]">Webild POS</h1>
        <p className="text-zinc-500 text-sm">Panel Administrativo</p>
      </div>

      {/* NUEVO BLOQUE: Tarjeta del Link Público */}
        <div className="bg-[#FF4500]/10 border border-[#FF4500]/30 p-5 rounded-2xl mb-6 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#FF4500]"></div>
          <div>
            <h2 className="font-bebas text-xl text-[#FF4500] mb-1">Tu Link de Pedidos</h2>
            <p className="text-zinc-400 text-xs">Comparte este enlace en tu Instagram y WhatsApp.</p>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="bg-[#151515] border border-[#FF4500]/20 rounded-lg px-3 py-2 text-sm text-white font-medium flex-1 md:w-64 overflow-hidden text-ellipsis whitespace-nowrap">
              {typeof window !== 'undefined' ? `${window.location.origin}/${settings.slug}` : `.../${settings.slug}`}
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/${settings.slug}`);
                showToast("¡Enlace copiado!");
              }}
              className="bg-[#FF4500] text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#CC3700] active:scale-95 transition-all flex-shrink-0"
            >
              Copiar
            </button>
          </div>
        </div>

      <div className="space-y-6">
        {/* Bloque 1: Configuración Principal */}
        <div className="bg-[#0A0A0A] p-5 rounded-2xl border border-[rgba(255,255,255,0.08)]">
          <h2 className="font-bebas text-xl mb-4 text-[#FF4500]">Configuración Principal</h2>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block mb-1">Nombre del Local</label>
              <input type="text" value={settings.name} onChange={e => setSettings({...settings, name: e.target.value})} className="w-full bg-[#151515] border border-[rgba(255,255,255,0.05)] rounded-lg py-2 px-3 text-sm focus:border-[#FF4500]/50 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block mb-1">WhatsApp Pedidos</label>
                <input type="text" value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})} className="w-full bg-[#151515] border border-[rgba(255,255,255,0.05)] rounded-lg py-2 px-3 text-sm focus:border-[#FF4500]/50 outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block mb-1">Tasa BCV</label>
                <input 
  type="number" 
  step="0.01" 
  value={settings.rate_ves || ''} 
  onChange={e => setSettings({...settings, rate_ves: parseFloat(e.target.value) || 0})} 
  className="w-full bg-[#151515] border border-[rgba(255,255,255,0.05)] rounded-lg py-2 px-3 text-sm font-bold text-[#FF4500] focus:border-[#FF4500]/50 outline-none" 
/>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block mb-1">Ciudades Delivery (separadas por coma)</label>
              <input type="text" value={settings.citiesStr} onChange={e => setSettings({...settings, citiesStr: e.target.value})} className="w-full bg-[#151515] border border-[rgba(255,255,255,0.05)] rounded-lg py-2 px-3 text-sm focus:border-[#FF4500]/50 outline-none" />
            </div>
          </div>
        </div>

        {/* Bloque 2: Imágenes */}
        <div className="bg-[#0A0A0A] p-5 rounded-2xl border border-[rgba(255,255,255,0.08)]">
          <h2 className="font-bebas text-xl mb-4 text-[#FF4500]">Imágenes de Marca</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Logo</label>
              <div className="w-16 h-16 bg-[#151515] rounded-lg border border-white/10 flex items-center justify-center overflow-hidden">
                {settings.logo_url ? <img src={settings.logo_url} className="w-full h-full object-contain p-1" /> : <span className="text-xs text-zinc-600">Vacío</span>}
              </div>
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo_url')} className="text-[10px] text-zinc-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:bg-[#FF4500] file:text-white" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Fondo (Hero)</label>
              <div className="w-full h-16 bg-[#151515] rounded-lg border border-white/10 flex items-center justify-center overflow-hidden">
                {settings.hero_url ? <img src={settings.hero_url} className="w-full h-full object-cover" /> : <span className="text-xs text-zinc-600">Vacío</span>}
              </div>
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'hero_url')} className="text-[10px] text-zinc-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:bg-[#FF4500] file:text-white" />
            </div>
          </div>
        </div>

        {/* Bloque 3: Gestión de Platos Avanzada */}
        <div className="bg-[#0A0A0A] p-5 rounded-2xl border border-[rgba(255,255,255,0.08)]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bebas text-xl text-[#FF4500]">Inventario y Platos</h2>
            <button onClick={handleAddProduct} className="bg-[#FF4500]/10 text-[#FF4500] border border-[#FF4500]/30 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#FF4500]/20 transition-colors">
              + Nuevo Plato
            </button>
          </div>

          <div className="space-y-8">
            {products.map(p => (
              <div key={p.id} className="border-t border-white/5 pt-6 flex flex-col md:flex-row gap-4 relative group">
                
                {/* Botón Eliminar */}
                <button onClick={() => handleDeleteProduct(p.id)} className="absolute top-6 right-0 text-zinc-600 hover:text-red-500 transition-colors p-1" title="Eliminar plato">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>

                {/* Imagen del Plato */}
                <div className="w-24 flex-shrink-0 flex flex-col gap-2">
                  <div className="w-24 h-24 bg-[#151515] rounded-xl border border-white/10 overflow-hidden flex items-center justify-center">
                    {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover" /> : <span className="text-[10px] text-zinc-600 text-center px-1">Sin Foto</span>}
                  </div>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'product_image', p.id)} className="w-full text-[9px] text-zinc-500 file:hidden" />
                </div>
                
                {/* Datos del Plato */}
                <div className="flex-1 space-y-3 pr-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input type="text" value={p.name} onChange={e => updateProduct(p.id, 'name', e.target.value)} className="w-full bg-[#151515] border border-[rgba(255,255,255,0.05)] rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-[#FF4500]/50" placeholder="Nombre del plato..." />
                    
                    <div className="flex gap-2">
                      <select value={p.category_id || ''} onChange={e => updateProduct(p.id, 'category_id', e.target.value)} className="flex-1 bg-[#151515] border border-[rgba(255,255,255,0.05)] rounded-lg px-2 text-xs text-zinc-300 outline-none focus:border-[#FF4500]/50 appearance-none">
                        <option value="">Categoría...</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      
                      <div className="flex items-center gap-1 bg-[#151515] border border-[rgba(255,255,255,0.05)] rounded-lg px-3 py-2">
                        <span className="text-xs text-zinc-500">$</span>
                        <div className="flex items-center gap-1 bg-[#151515] border border-[rgba(255,255,255,0.05)] rounded-lg px-3 py-2">
                        <span className="text-xs text-zinc-500">$</span>
                        <input 
  type="number" 
  step="0.1" 
  value={p.price || ''} 
  onChange={e => updateProduct(p.id, 'price', parseFloat(e.target.value) || 0)} 
  className="w-12 bg-transparent text-sm font-bold text-[#FF4500] focus:outline-none" 
/>
                      </div>
                      </div>
                    </div>
                  </div>
                  
                  <textarea value={p.description || ''} onChange={e => updateProduct(p.id, 'description', e.target.value)} className="w-full bg-[#151515] border border-[rgba(255,255,255,0.05)] rounded-lg px-3 py-2 text-xs text-zinc-400 h-16 resize-none outline-none focus:border-[#FF4500]/50" placeholder="Descripción de los ingredientes..." />
                  
                  {/* Etiquetas de Ventas (Toggles) */}
                  <div className="flex flex-wrap gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer bg-[#111] px-3 py-1.5 rounded-md border border-white/5 select-none">
                      <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors ${p.is_available ? 'bg-green-500/20 border-green-500' : 'bg-red-500/20 border-red-500'}`}>
                        {p.is_available && <svg className="w-2.5 h-2.5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </div>
                      <input type="checkbox" checked={p.is_available} onChange={e => updateProduct(p.id, 'is_available', e.target.checked)} className="hidden" />
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${p.is_available ? 'text-green-500' : 'text-red-500'}`}>
                        {p.is_available ? '✔️ Disponible' : '🚫 Agotado'}
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer bg-[#111] px-3 py-1.5 rounded-md border border-white/5 select-none">
                      <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors ${p.is_hot ? 'bg-orange-500/20 border-orange-500' : 'border-zinc-700'}`}>
                        {p.is_hot && <svg className="w-2.5 h-2.5 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </div>
                      <input type="checkbox" checked={p.is_hot} onChange={e => updateProduct(p.id, 'is_hot', e.target.checked)} className="hidden" />
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${p.is_hot ? 'text-orange-500' : 'text-zinc-500'}`}>
                        🔥 Promoción
                      </span>
                    </label>
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-2xl z-40">
        <button onClick={handleSaveAll} disabled={saving} className="w-full bg-[#FF4500] hover:bg-[#CC3700] disabled:bg-zinc-800 text-white h-14 rounded-xl font-bold text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(255,69,0,0.15)] active:scale-[0.98] transition-all flex items-center justify-center">
          {saving ? 'Guardando...' : 'Sincronizar Todo'}
        </button>
      </div>

      <div className={`fixed top-10 left-1/2 -translate-x-1/2 bg-[#1A1A1A] border border-[#FF4500]/40 px-6 py-3 rounded-full flex items-center gap-3 z-50 transition-all duration-300 shadow-2xl ${toast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <span className="text-white text-xs font-bold uppercase tracking-wider">{toast}</span>
      </div>
    </div>
  );
}