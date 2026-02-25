"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState("");

    // Estado para saber si es un usuario nuevo sin local
    const [hasStore, setHasStore] = useState(false);

    // Estados para el Onboarding (Usuario Nuevo)
    const [newStoreName, setNewStoreName] = useState("");
    const [newStoreSlug, setNewStoreSlug] = useState("");

    const [modifiers, setModifiers] = useState<any[]>([]);
  const [newModName, setNewModName] = useState("");

    // Estados del Dashboard Normal
    const [settings, setSettings] = useState({
        id: "", slug: "", name: "", phone: "", rate_ves: 0, schedule: "", citiesStr: "", logo_url: "", hero_url: ""
    });
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    // Estado para la nueva categoría
    const [newCategoryName, setNewCategoryName] = useState("");

    

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        // 1. Verificar quién es el usuario que inició sesión
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData?.user) {
            // Si no hay sesión, lo pateamos al login
            window.location.href = "/admin/login";
            return;
        }

        const userId = userData.user.id;

        // 2. Buscar si este usuario ya tiene un restaurante creado
        const { data: storeData } = await supabase
            .from('stores')
            .select('*')
            .eq('owner_id', userId)
            .single(); // Trae su único restaurante

        if (storeData) {
            // SI TIENE RESTAURANTE: Cargamos todo el dashboard
            setHasStore(true);
            setSettings({
                ...storeData,
                citiesStr: storeData.delivery_cities ? storeData.delivery_cities.join(", ") : ""
            });
            const { data: modData } = await supabase.from('modifiers').select('*').eq('store_id', storeData.id);
      if (modData) setModifiers(modData);

            const { data: catData } = await supabase.from('categories').select('*').eq('store_id', storeData.id);
            if (catData) setCategories(catData);

            const { data: prodData } = await supabase.from('products').select('*').eq('store_id', storeData.id).order('created_at', { ascending: true });
            if (prodData) setProducts(prodData);
        } else {
            // NO TIENE RESTAURANTE: Le mostramos el Onboarding
            setHasStore(false);
        }

        setLoading(false);
    };

    // --- FUNCIÓN AUTOMÁTICA DE CREACIÓN DE NEGOCIO ---
    const handleCreateStore = async () => {
        if (!newStoreName || !newStoreSlug) {
            showToast("Llena todos los campos");
            return;
        }

        setSaving(true);
        const { data: userData } = await supabase.auth.getUser();

        // Formateamos el slug para que sea válido para URLs (sin espacios, minúsculas)
        const formattedSlug = newStoreSlug.toLowerCase().replace(/[^a-z0-9]/g, '');

        const { error } = await supabase.from('stores').insert([{
            owner_id: userData.user!.id, // <- AQUÍ ES DONDE SE HACE LA MAGIA AUTOMÁTICA
            name: newStoreName,
            slug: formattedSlug,
            rate_ves: 50, // Tasa por defecto para que no inicie en 0
            delivery_cities: []
        }]);

        setSaving(false);

        if (error) {
            showToast("Error: El enlace ya está en uso por otro local.");
        } else {
            showToast("¡Restaurante creado con éxito!");
            await fetchData(); // Recargamos para que entre al Dashboard normal
        }
    };

    // --- GESTIÓN DE EXTRAS ---
  const handleAddModifier = async () => {
    if (!newModName.trim()) return;
    setToast("Creando extra...");
    
    const { data, error } = await supabase.from('modifiers').insert([{
      store_id: settings.id,
      name: newModName.trim(),
      price: 0 // Por defecto en 0, lo edita en la lista
    }]).select().single();

    if (!error && data) {
      setModifiers(prev => [...prev, data]);
      setNewModName(""); 
      showToast("¡Extra agregado!");
    }
  };

  const handleDeleteModifier = async (id: string) => {
    if (!confirm("¿Eliminar este extra de la base de datos?")) return;
    await supabase.from('modifiers').delete().eq('id', id);
    setModifiers(prev => prev.filter(m => m.id !== id));
  };

  const updateModifier = (id: string, field: string, value: any) => {
    setModifiers(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

    // --- GESTIÓN DE CATEGORÍAS ---
    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        setToast("Creando categoría...");

        const { data, error } = await supabase.from('categories').insert([{
            store_id: settings.id,
            name: newCategoryName.trim()
        }]).select().single();

        if (!error && data) {
            setCategories(prev => [...prev, data]);
            setNewCategoryName(""); // Limpiamos el input
            showToast("¡Categoría agregada!");
        } else {
            showToast("Error al crear categoría");
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm("¿Eliminar esta categoría? Los platos que la usen quedarán sin categoría.")) return;
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (!error) {
            setCategories(prev => prev.filter(c => c.id !== id));
            showToast("Categoría eliminada");
        }
    };


    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string, productId?: string) => {
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

        // MAGIA: Auto-guardamos la URL directo en la base de datos al instante
        if (field === 'logo_url' || field === 'hero_url') {
            setSettings(prev => ({ ...prev, [field]: imageUrl }));
            await supabase.from('stores').update({ [field]: imageUrl }).eq('id', settings.id);
        } else if (field === 'product_image' && productId) {
            setProducts(prev => prev.map(p => p.id === productId ? { ...p, image_url: imageUrl } : p));
            await supabase.from('products').update({ image_url: imageUrl }).eq('id', productId);
        }

        showToast("¡Imagen guardada exitosamente!");
    };

    const handleAddProduct = async () => {
        setToast("Creando plato...");
        const { error } = await supabase.from('products').insert([{
            store_id: settings.id,
            name: "Nuevo Plato",
            price: 0,
            category_id: categories.length > 0 ? categories[0].id : null,
            description: "",
            is_available: true,
            is_hot: false
        }]);

        if (!error) {
            await fetchData();
            showToast("¡Plato creado!");
        } else {
            showToast("Error al crear plato");
        }
    };

    const handleDeleteProduct = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este plato definitivamente?")) return;
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (!error) {
            setProducts(prev => prev.filter(p => p.id !== id));
            showToast("Plato eliminado");
        }
    };

    const updateProduct = (id: string, field: string, value: any) => {
        setProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const handleSaveAll = async () => {
        setSaving(true);
        const citiesArray = settings.citiesStr.split(",").map(c => c.trim()).filter(c => c !== "");

        await supabase.from('stores').update({
            name: settings.name, phone: settings.phone, rate_ves: settings.rate_ves,
            schedule: settings.schedule, delivery_cities: citiesArray,
            logo_url: settings.logo_url, hero_url: settings.hero_url
        }).eq('id', settings.id);

        for (const p of products) {
      await supabase.from('products').update({
        name: p.name, 
        description: p.description, 
        price: p.price,
        image_url: p.image_url, 
        is_available: p.is_available,
        is_hot: p.is_hot, 
        category_id: p.category_id,
        allowed_modifiers: p.allowed_modifiers // <-- ¡ESTO ERA LO QUE FALTABA!
      }).eq('id', p.id);
    }
        // (Dentro de handleSaveAll, justo antes de setSaving(false))
    for (const m of modifiers) {
      await supabase.from('modifiers').update({
        name: m.name, price: m.price, is_available: m.is_available
      }).eq('id', m.id);
    }

        setSaving(false);
        showToast("¡Sincronizado con éxito!");
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = "/admin/login";
    };

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(""), 3000);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-[#FF4500] font-bebas text-2xl bg-[#050505] animate-pulse">Cargando Webild POS...</div>;

    // ==========================================
    // PANTALLA DE ONBOARDING (Usuario Nuevo sin Local)
    // ==========================================
    if (!hasStore) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center p-5 relative z-10">
                <div className="w-full max-w-md bg-[#0A0A0A] p-8 rounded-2xl border border-[rgba(255,255,255,0.08)] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-[#FF4500]"></div>

                    <h1 className="font-bebas text-4xl text-white mb-2">Configura tu Negocio</h1>
                    <p className="text-zinc-500 text-sm mb-8">Estás a un paso de tener tu menú digital optimizado.</p>

                    <div className="space-y-5">
                        <div>
                            <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block mb-1">Nombre Comercial</label>
                            <input
                                type="text"
                                value={newStoreName}
                                onChange={e => {
                                    setNewStoreName(e.target.value);
                                    // Autocompletamos el slug sugerido
                                    if (!newStoreSlug) setNewStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                                }}
                                className="w-full bg-[#151515] border border-[rgba(255,255,255,0.05)] rounded-lg py-3 px-4 text-sm text-white focus:outline-none focus:border-[#FF4500]/50"
                                placeholder="Ej: Reyes Burger"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block mb-1">Tu Enlace Personalizado</label>
                            <div className="flex items-center bg-[#151515] border border-[rgba(255,255,255,0.05)] rounded-lg focus-within:border-[#FF4500]/50 transition-all overflow-hidden">
                                <span className="text-zinc-500 text-sm pl-4">webildpos.com/</span>
                                <input
                                    type="text"
                                    value={newStoreSlug}
                                    onChange={e => setNewStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                                    className="w-full bg-transparent py-3 px-2 text-sm text-[#FF4500] font-bold focus:outline-none"
                                    placeholder="reyesburger"
                                />
                            </div>
                            <p className="text-[10px] text-zinc-600 mt-2">Este será el link que compartirás en tu Instagram.</p>
                        </div>
                    </div>

                    <button
                        onClick={handleCreateStore}
                        disabled={saving}
                        className="w-full mt-8 bg-[#FF4500] hover:bg-[#CC3700] disabled:bg-zinc-800 text-white h-14 rounded-xl font-bold text-sm uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center shadow-[0_0_20px_rgba(255,69,0,0.15)]"
                    >
                        {saving ? 'Creando...' : 'Crear mi Menú Digital'}
                    </button>

                    {/* Toast Notification para errores de Onboarding */}
                    <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#1A1A1A] border border-[#FF4500]/40 px-6 py-3 rounded-full flex items-center gap-3 transition-all duration-300 shadow-2xl ${toast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                        <span className="text-white text-xs font-bold uppercase tracking-wider whitespace-nowrap">{toast}</span>
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // DASHBOARD NORMAL (Usuario con Local)
    // ==========================================
    return (
        <div className="min-h-screen bg-[#050505] text-white p-5 pb-32 max-w-2xl mx-auto">
            <div className="mb-8 flex justify-between items-start">
                <div>
                    <h1 className="font-bebas text-3xl tracking-wide text-[#FF4500]">Webild POS</h1>
                    <p className="text-zinc-500 text-sm">Panel Administrativo</p>
                </div>
                <button onClick={handleLogout} className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold hover:text-white transition-colors border border-white/10 px-3 py-1.5 rounded-md bg-white/5">
                    Cerrar Sesión
                </button>
            </div>

            {/* BLOQUE DE ENLACE PERSONALIZADO */}
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
                {/* Configuración */}
                <div className="bg-[#0A0A0A] p-5 rounded-2xl border border-[rgba(255,255,255,0.08)]">
                    <h2 className="font-bebas text-xl mb-4 text-[#FF4500]">Configuración Principal</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block mb-1">Nombre del Local</label>
                            <input type="text" value={settings.name} onChange={e => setSettings({ ...settings, name: e.target.value })} className="w-full bg-[#151515] border border-[rgba(255,255,255,0.05)] rounded-lg py-2 px-3 text-sm focus:border-[#FF4500]/50 outline-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block mb-1">WhatsApp Pedidos</label>
                                <input type="text" value={settings.phone || ''} onChange={e => setSettings({ ...settings, phone: e.target.value })} className="w-full bg-[#151515] border border-[rgba(255,255,255,0.05)] rounded-lg py-2 px-3 text-sm focus:border-[#FF4500]/50 outline-none" placeholder="Ej: 584141234567" />
                            </div>
                            <div>
                                <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block mb-1">Tasa BCV</label>
                                <input type="number" step="0.01" value={settings.rate_ves || ''} onChange={e => setSettings({ ...settings, rate_ves: parseFloat(e.target.value) || 0 })} className="w-full bg-[#151515] border border-[rgba(255,255,255,0.05)] rounded-lg py-2 px-3 text-sm font-bold text-[#FF4500] focus:border-[#FF4500]/50 outline-none" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block mb-1">Ciudades Delivery (separadas por coma)</label>
                            <input type="text" value={settings.citiesStr} onChange={e => setSettings({ ...settings, citiesStr: e.target.value })} className="w-full bg-[#151515] border border-[rgba(255,255,255,0.05)] rounded-lg py-2 px-3 text-sm focus:border-[#FF4500]/50 outline-none" placeholder="Ej: Zona Norte, Centro, San Diego" />
                        </div>
                    </div>
                </div>

                {/* Imágenes */}
                <div className="bg-[#0A0A0A] p-5 rounded-2xl border border-[rgba(255,255,255,0.08)]">
                    <h2 className="font-bebas text-xl mb-4 text-[#FF4500]">Imágenes de Marca</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Logo Clickable */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Logo del Local</label>
                            <label className="relative w-24 h-24 bg-[#151515] rounded-xl border border-white/10 flex items-center justify-center overflow-hidden cursor-pointer group hover:border-[#FF4500]/50 transition-colors">
                                {settings.logo_url ? <img src={settings.logo_url} className="w-full h-full object-contain p-2" /> : <span className="text-xs text-zinc-600">Subir Logo</span>}
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[10px] text-white font-bold uppercase tracking-widest">+ Cambiar</span>
                                </div>
                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo_url')} className="hidden" />
                            </label>
                        </div>

                        {/* Fondo Clickable */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Fondo Principal (Hero)</label>
                            <label className="relative w-full h-24 bg-[#151515] rounded-xl border border-white/10 flex items-center justify-center overflow-hidden cursor-pointer group hover:border-[#FF4500]/50 transition-colors">
                                {settings.hero_url ? <img src={settings.hero_url} className="w-full h-full object-cover" /> : <span className="text-xs text-zinc-600">Subir Fondo</span>}
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[10px] text-white font-bold uppercase tracking-widest">+ Cambiar</span>
                                </div>
                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'hero_url')} className="hidden" />
                            </label>
                        </div>

                    </div>
                </div>

                {/* Gestión de Categorías */}
        <div className="bg-[#0A0A0A] p-5 rounded-2xl border border-[rgba(255,255,255,0.08)]">
          <h2 className="font-bebas text-xl mb-4 text-[#FF4500]">Categorías del Menú</h2>
          
          <div className="flex gap-2 mb-5">
            <input 
              type="text" 
              value={newCategoryName}
              // AQUÍ ESTÁ LA MAGIA: Forzamos mayúsculas al instante
              onChange={e => setNewCategoryName(e.target.value.toUpperCase())}
              placeholder="EJ: HAMBURGUESAS"
              className="flex-1 bg-[#151515] border border-[rgba(255,255,255,0.05)] rounded-lg px-4 py-2 text-sm font-bold text-white outline-none focus:border-[#FF4500]/50 uppercase placeholder-zinc-700"
            />
            <button 
              onClick={handleAddCategory}
              className="bg-[#FF4500] text-white px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#CC3700] active:scale-95 transition-all"
            >
              + Agregar
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <div key={c.id} className="bg-[#111] border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2 group">
                <span className="text-xs font-bold text-white uppercase">{c.name}</span>
                <button 
                  onClick={() => handleDeleteCategory(c.id)} 
                  className="text-zinc-600 hover:text-red-500 transition-colors opacity-50 group-hover:opacity-100"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            ))}
            {categories.length === 0 && <span className="text-xs text-zinc-600 font-medium">No has creado ninguna categoría.</span>}
          </div>
        </div>


        {/* Banco de Extras Globales */}
        <div className="bg-[#0A0A0A] p-5 rounded-2xl border border-[rgba(255,255,255,0.08)]">
          <h2 className="font-bebas text-xl mb-4 text-[#FF4500]">Banco de Extras</h2>
          
          <div className="flex gap-2 mb-5">
            <input 
              type="text" 
              value={newModName}
              onChange={e => setNewModName(e.target.value)}
              placeholder="Ej: Extra Tocineta, Salsa Trufada..."
              className="flex-1 bg-[#151515] border border-[rgba(255,255,255,0.05)] rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-[#FF4500]/50"
            />
            <button 
              onClick={handleAddModifier}
              className="bg-[#FF4500] text-white px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#CC3700] active:scale-95 transition-all"
            >
              + Agregar
            </button>
          </div>

          <div className="space-y-3">
            {modifiers.map(m => (
              <div key={m.id} className="bg-[#111] border border-white/10 px-3 py-2 rounded-lg flex items-center justify-between gap-4">
                <input type="text" value={m.name} onChange={e => updateModifier(m.id, 'name', e.target.value)} className="bg-transparent text-sm font-bold text-white outline-none flex-1" />
                
                <div className="flex items-center gap-1 bg-[#151515] border border-[rgba(255,255,255,0.05)] rounded-lg px-2 py-1">
                  <span className="text-xs text-zinc-500">$</span>
                  <input type="number" step="0.1" value={m.price || ''} onChange={e => updateModifier(m.id, 'price', parseFloat(e.target.value) || 0)} className="w-12 bg-transparent text-sm font-bold text-[#FF4500] focus:outline-none text-right" />
                </div>

                <label className="flex items-center cursor-pointer">
                  <input type="checkbox" checked={m.is_available} onChange={e => updateModifier(m.id, 'is_available', e.target.checked)} className="hidden" />
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${m.is_available ? 'bg-green-500/20 border-green-500' : 'bg-red-500/20 border-red-500'}`}>
                    {m.is_available && <svg className="w-3 h-3 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                  </div>
                </label>

                <button onClick={() => handleDeleteModifier(m.id)} className="text-zinc-600 hover:text-red-500 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            ))}
            {modifiers.length === 0 && <span className="text-xs text-zinc-600 font-medium">Crea los extras que ofrecerás en tus platos.</span>}
          </div>
        </div>

                {/* Productos */}
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
                                <button onClick={() => handleDeleteProduct(p.id)} className="absolute top-6 right-0 text-zinc-600 hover:text-red-500 transition-colors p-1" title="Eliminar plato">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>

                                {/* Imagen del Plato Clickable */}
                                <div className="w-24 shrink-0 flex flex-col gap-2">
                                    <label className="relative w-24 h-24 bg-[#151515] rounded-xl border border-white/10 overflow-hidden flex items-center justify-center cursor-pointer group hover:border-[#FF4500]/50 transition-colors">
                                        {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover" /> : <span className="text-[10px] text-zinc-600 text-center px-1">Subir Foto</span>}
                                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <svg className="w-5 h-5 text-white mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            <span className="text-[9px] text-white font-bold uppercase tracking-widest">Cambiar</span>
                                        </div>
                                        {/* Input oculto que se activa al hacer clic en el label */}
                                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'product_image', p.id)} className="hidden" />
                                    </label>
                                </div>

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
                                                <input type="number" step="0.1" value={p.price || ''} onChange={e => updateProduct(p.id, 'price', parseFloat(e.target.value) || 0)} className="w-12 bg-transparent text-sm font-bold text-[#FF4500] focus:outline-none" />
                                            </div>
                                        </div>
                                    </div>

                                    <textarea value={p.description || ''} onChange={e => updateProduct(p.id, 'description', e.target.value)} className="w-full bg-[#151515] border border-[rgba(255,255,255,0.05)] rounded-lg px-3 py-2 text-xs text-zinc-400 h-16 resize-none outline-none focus:border-[#FF4500]/50" placeholder="Descripción de los ingredientes..." />

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

                                    {/* Selector de Extras para este Plato */}
                  {modifiers.length > 0 && (
                    <div className="pt-3 border-t border-white/5 mt-3">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2 block">Extras Permitidos</span>
                      <div className="flex flex-wrap gap-2">
                        {modifiers.map(m => {
                          const allowed = p.allowed_modifiers || [];
                          const isSelected = allowed.includes(m.id);
                          return (
                            <div 
                              key={m.id}
                              onClick={() => {
                                const newAllowed = isSelected ? allowed.filter((id: string) => id !== m.id) : [...allowed, m.id];
                                updateProduct(p.id, 'allowed_modifiers', newAllowed);
                              }}
                              className={`cursor-pointer px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-colors select-none ${isSelected ? 'bg-[#FF4500]/20 border-[#FF4500] text-[#FF4500]' : 'bg-[#111] border-white/10 text-zinc-500 hover:border-white/30'}`}
                            >
                              {m.name}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
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