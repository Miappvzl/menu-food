"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState("");
    
    // Estado para feedback visual al subir imágenes
    const [uploadingImage, setUploadingImage] = useState<string | null>(null);

    const [hasStore, setHasStore] = useState(false);

    // Onboarding
    const [newStoreName, setNewStoreName] = useState("");
    const [newStoreSlug, setNewStoreSlug] = useState("");

    const [modifiers, setModifiers] = useState<any[]>([]);
    const [newModName, setNewModName] = useState("");

    // Dashboard
    const [settings, setSettings] = useState({
        id: "", slug: "", name: "", phone: "", rate_ves: 0, schedule: "", citiesStr: "", logo_url: "", hero_url: ""
    });
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [newCategoryName, setNewCategoryName] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData?.user) {
            window.location.href = "/admin/login";
            return;
        }

        const userId = userData.user.id;

        const { data: storeData } = await supabase
            .from('stores')
            .select('*')
            .eq('owner_id', userId)
            .single();

        if (storeData) {
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
            setHasStore(false);
        }

        setLoading(false);
    };

    const handleCreateStore = async () => {
        if (!newStoreName || !newStoreSlug) {
            showToast("Llena todos los campos");
            return;
        }

        setSaving(true);
        const { data: userData } = await supabase.auth.getUser();
        const formattedSlug = newStoreSlug.toLowerCase().replace(/[^a-z0-9]/g, '');

        const { error } = await supabase.from('stores').insert([{
            owner_id: userData.user!.id,
            name: newStoreName,
            slug: formattedSlug,
            rate_ves: 50,
            delivery_cities: []
        }]);

        setSaving(false);

        if (error) {
            showToast("Error: El enlace ya está en uso por otro local.");
        } else {
            showToast("¡Restaurante creado con éxito!");
            await fetchData();
        }
    };

    const handleAddModifier = async () => {
        if (!newModName.trim()) return;
        setToast("Creando extra...");
        
        const { data, error } = await supabase.from('modifiers').insert([{
            store_id: settings.id,
            name: newModName.trim(),
            price: 0 
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

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        setToast("Creando categoría...");

        const { data, error } = await supabase.from('categories').insert([{
            store_id: settings.id,
            name: newCategoryName.trim()
        }]).select().single();

        if (!error && data) {
            setCategories(prev => [...prev, data]);
            setNewCategoryName(""); 
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

        // Activamos el estado de carga para el input específico
        const uploadKey = productId ? `product_${productId}` : field;
        setUploadingImage(uploadKey);
        setToast("Subiendo y guardando imagen...");

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `images/${fileName}`;

        const { error: uploadError } = await supabase.storage.from('menu_assets').upload(filePath, file);
        if (uploadError) {
            showToast("Error subiendo imagen");
            setUploadingImage(null);
            return;
        }

        const { data: publicUrlData } = supabase.storage.from('menu_assets').getPublicUrl(filePath);
        const imageUrl = publicUrlData.publicUrl;

        // Auto-guardado
        if (field === 'logo_url' || field === 'hero_url') {
            setSettings(prev => ({ ...prev, [field]: imageUrl }));
            await supabase.from('stores').update({ [field]: imageUrl }).eq('id', settings.id);
        } else if (field === 'product_image' && productId) {
            setProducts(prev => prev.map(p => p.id === productId ? { ...p, image_url: imageUrl } : p));
            await supabase.from('products').update({ image_url: imageUrl }).eq('id', productId);
        }

        setUploadingImage(null);
        showToast("¡Imagen actualizada!");
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
                name: p.name, description: p.description, price: p.price,
                image_url: p.image_url, is_available: p.is_available,
                is_hot: p.is_hot, category_id: p.category_id,
                allowed_modifiers: p.allowed_modifiers 
            }).eq('id', p.id);
        }
        
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

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center">
                <motion.div 
                    animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    className="w-16 h-16 rounded-full border-t-2 border-b-2 border-[#D4AF37] mb-4"
                />
                <span className="text-[#D4AF37] font-bebas text-2xl tracking-[0.2em] uppercase">Cargando Panel...</span>
            </div>
        );
    }

    // ==========================================
    // PANTALLA DE ONBOARDING
    // ==========================================
    if (!hasStore) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center p-5 relative z-10 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#D4AF37]/10 via-[#050505] to-[#050505]" />
                
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md bg-[#121212]/80 backdrop-blur-xl p-8 rounded-[32px] border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.6)] relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#D4AF37] to-[#F5A623]"></div>

                    <h1 className="font-bebas text-4xl text-white mb-2 drop-shadow-md">Configura tu Negocio</h1>
                    <p className="text-zinc-400 text-sm mb-8 font-light">Estás a un paso de tener tu menú digital premium.</p>

                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold block mb-2">Nombre Comercial</label>
                            <input
                                type="text"
                                value={newStoreName}
                                onChange={e => {
                                    setNewStoreName(e.target.value);
                                    if (!newStoreSlug) setNewStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                                }}
                                className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl py-4 px-5 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20 transition-all"
                                placeholder="Ej: Reyes Gourmet"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold block mb-2">Enlace Personalizado</label>
                            <div className="flex items-center bg-[#1A1A1A] border border-white/5 rounded-xl focus-within:border-[#D4AF37]/50 focus-within:ring-1 focus-within:ring-[#D4AF37]/20 transition-all overflow-hidden">
                                <span className="text-zinc-500 text-sm pl-5 font-light">webildpos.com/</span>
                                <input
                                    type="text"
                                    value={newStoreSlug}
                                    onChange={e => setNewStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                                    className="w-full bg-transparent py-4 px-2 text-sm text-[#D4AF37] font-bold focus:outline-none"
                                    placeholder="reyesgourmet"
                                />
                            </div>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCreateStore}
                        disabled={saving}
                        className="w-full mt-10 bg-gradient-to-r from-[#D4AF37] to-[#F5A623] disabled:from-zinc-800 disabled:to-zinc-800 text-[#121212] h-14 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all flex items-center justify-center shadow-[0_5px_20px_rgba(212,175,55,0.3)]"
                    >
                        {saving ? 'Creando...' : 'Crear mi Menú Digital'}
                    </motion.button>
                </motion.div>
            </div>
        );
    }

    // ==========================================
    // DASHBOARD NORMAL
    // ==========================================
    return (
        <div className="min-h-screen bg-[#050505] text-white pb-32 font-sans relative overflow-x-hidden">
            {/* Fondo sutil general */}
            <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#1A1500]/20 via-[#050505] to-[#050505] z-0" />
            
            <div className="relative z-10 max-w-4xl mx-auto p-5 md:p-8">
                
                {/* Header Administrativo */}
                <div className="mb-10 flex justify-between items-center">
                    <div>
                        <h1 className="font-bebas text-4xl tracking-widest text-white drop-shadow-md">
                            Webild <span className="text-[#D4AF37]">POS</span>
                        </h1>
                        <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] font-bold mt-1">Panel Administrativo</p>
                    </div>
                    <button onClick={handleLogout} className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold hover:text-white transition-colors border border-white/10 px-4 py-2 rounded-xl bg-[#1A1A1A] hover:bg-[#222]">
                        Cerrar Sesión
                    </button>
                </div>

                {/* Link Compartible Premium */}
                <div className="bg-gradient-to-r from-[#121212] to-[#1A1A1A] border border-[#D4AF37]/20 p-6 rounded-[24px] mb-8 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#D4AF37] to-[#F5A623]"></div>
                    <div>
                        <h2 className="font-bebas text-2xl text-[#D4AF37] mb-1 tracking-wide">Tu Link de Menú</h2>
                        <p className="text-zinc-400 text-sm font-light">Cópialo y pégalo en el perfil de tu Instagram.</p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto bg-[#0A0A0A] border border-white/5 rounded-xl p-1.5 pl-4">
                        <div className="text-sm text-zinc-300 font-medium flex-1 md:w-64 overflow-hidden text-ellipsis whitespace-nowrap">
                            {typeof window !== 'undefined' ? `${window.location.host}/${settings.slug}` : `.../${settings.slug}`}
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/${settings.slug}`);
                                showToast("¡Enlace copiado!");
                            }}
                            className="bg-[#D4AF37] text-[#121212] px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest shadow-md flex-shrink-0"
                        >
                            Copiar
                        </motion.button>
                    </div>
                </div>

                <div className="space-y-8">
                    
                    {/* Configuración Principal */}
                    <div className="bg-[#121212] p-6 rounded-[28px] border border-white/5 shadow-lg">
                        <h2 className="font-bebas text-2xl mb-6 text-white tracking-wide flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span> Configuración General
                        </h2>
                        <div className="space-y-5">
                            <div>
                                <label className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold block mb-2">Nombre del Local</label>
                                <input type="text" value={settings.name} onChange={e => setSettings({ ...settings, name: e.target.value })} className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl py-3 px-4 text-sm focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20 outline-none transition-all" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold block mb-2">WhatsApp Pedidos</label>
                                    <input type="text" value={settings.phone || ''} onChange={e => setSettings({ ...settings, phone: e.target.value })} className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl py-3 px-4 text-sm focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20 outline-none transition-all" placeholder="Ej: 584141234567" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold block mb-2">Tasa BCV Referencial</label>
                                    <input type="number" step="0.01" value={settings.rate_ves || ''} onChange={e => setSettings({ ...settings, rate_ves: parseFloat(e.target.value) || 0 })} className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl py-3 px-4 text-sm font-bold text-[#F5A623] focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20 outline-none transition-all" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold block mb-2">Zonas de Delivery (separadas por coma)</label>
                                <input type="text" value={settings.citiesStr} onChange={e => setSettings({ ...settings, citiesStr: e.target.value })} className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl py-3 px-4 text-sm focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20 outline-none transition-all" placeholder="Ej: Zona Norte, Centro, San Diego" />
                            </div>
                        </div>
                    </div>

                    {/* Imágenes de Marca (Mejora de UX en carga) */}
                    <div className="bg-[#121212] p-6 rounded-[28px] border border-white/5 shadow-lg">
                        <h2 className="font-bebas text-2xl mb-6 text-white tracking-wide flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span> Identidad Visual
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Subir Logo */}
                            <div className="flex flex-col gap-3">
                                <label className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold">Logo del Local</label>
                                <label className={`relative w-32 h-32 bg-[#1A1A1A] rounded-2xl border-2 border-dashed ${uploadingImage === 'logo_url' ? 'border-[#D4AF37]' : 'border-white/10 hover:border-[#D4AF37]/50'} flex flex-col items-center justify-center overflow-hidden cursor-pointer group transition-all`}>
                                    
                                    {uploadingImage === 'logo_url' ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-[9px] text-[#D4AF37] uppercase tracking-widest">Guardando...</span>
                                        </div>
                                    ) : settings.logo_url ? (
                                        <>
                                            <img src={settings.logo_url} className="w-full h-full object-contain p-3 opacity-90 group-hover:opacity-40 transition-opacity" />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="bg-[#121212]/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-white/10">Reemplazar</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-zinc-500 group-hover:text-[#D4AF37] transition-colors">
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Subir Imagen</span>
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo_url')} className="hidden" disabled={uploadingImage === 'logo_url'} />
                                </label>
                            </div>

                            {/* Subir Fondo */}
                            <div className="flex flex-col gap-3">
                                <label className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold">Fondo Principal (Hero)</label>
                                <label className={`relative w-full h-32 bg-[#1A1A1A] rounded-2xl border-2 border-dashed ${uploadingImage === 'hero_url' ? 'border-[#D4AF37]' : 'border-white/10 hover:border-[#D4AF37]/50'} flex flex-col items-center justify-center overflow-hidden cursor-pointer group transition-all`}>
                                    
                                    {uploadingImage === 'hero_url' ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-[9px] text-[#D4AF37] uppercase tracking-widest">Guardando...</span>
                                        </div>
                                    ) : settings.hero_url ? (
                                        <>
                                            <img src={settings.hero_url} className="w-full h-full object-cover opacity-60 group-hover:opacity-30 transition-opacity" />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="bg-[#121212]/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-white/10">Reemplazar Fondo</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-zinc-500 group-hover:text-[#D4AF37] transition-colors">
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Subir Fotografía</span>
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'hero_url')} className="hidden" disabled={uploadingImage === 'hero_url'} />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Categorías */}
                    <div className="bg-[#121212] p-6 rounded-[28px] border border-white/5 shadow-lg">
                        <h2 className="font-bebas text-2xl mb-6 text-white tracking-wide flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span> Secciones del Menú
                        </h2>
                        
                        <div className="flex flex-col md:flex-row gap-3 mb-6">
                            <input 
                                type="text" 
                                value={newCategoryName}
                                onChange={e => setNewCategoryName(e.target.value.toUpperCase())}
                                placeholder="Ej: PLATOS PRINCIPALES"
                                className="flex-1 bg-[#1A1A1A] border border-white/5 rounded-xl px-5 py-3 text-sm font-bold text-white outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20 uppercase placeholder-zinc-600 transition-all"
                            />
                            <button 
                                onClick={handleAddCategory}
                                className="bg-[#222] border border-white/10 text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:border-[#D4AF37]/50 hover:text-[#D4AF37] active:scale-95 transition-all whitespace-nowrap"
                            >
                                + Agregar Sección
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <AnimatePresence>
                                {categories.map(c => (
                                    <motion.div 
                                        key={c.id} 
                                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                                        className="bg-[#1A1A1A] border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3 group hover:border-[#D4AF37]/30 transition-colors"
                                    >
                                        <span className="text-xs font-bold text-white uppercase tracking-wider">{c.name}</span>
                                        <button onClick={() => handleDeleteCategory(c.id)} className="text-zinc-500 hover:text-red-400 transition-colors">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {categories.length === 0 && <span className="text-xs text-zinc-500 font-light">No has creado ninguna sección.</span>}
                        </div>
                    </div>

                    {/* Extras */}
                    <div className="bg-[#121212] p-6 rounded-[28px] border border-white/5 shadow-lg">
                        <h2 className="font-bebas text-2xl mb-6 text-white tracking-wide flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span> Banco de Extras
                        </h2>
                        
                        <div className="flex flex-col md:flex-row gap-3 mb-6">
                            <input 
                                type="text" 
                                value={newModName}
                                onChange={e => setNewModName(e.target.value)}
                                placeholder="Ej: Queso Trufado, Tocineta..."
                                className="flex-1 bg-[#1A1A1A] border border-white/5 rounded-xl px-5 py-3 text-sm text-white outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20 transition-all placeholder-zinc-600"
                            />
                            <button 
                                onClick={handleAddModifier}
                                className="bg-[#222] border border-white/10 text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:border-[#D4AF37]/50 hover:text-[#D4AF37] active:scale-95 transition-all whitespace-nowrap"
                            >
                                + Agregar Extra
                            </button>
                        </div>

                        <div className="space-y-3">
                            <AnimatePresence>
                                {modifiers.map(m => (
                                    <motion.div 
                                        key={m.id} 
                                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                                        className="bg-[#1A1A1A] border border-white/5 px-4 py-3 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                                    >
                                        <input type="text" value={m.name} onChange={e => updateModifier(m.id, 'name', e.target.value)} className="bg-transparent text-sm font-bold text-white outline-none flex-1 w-full" />
                                        
                                        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                            <div className="flex items-center gap-1 bg-[#121212] border border-white/5 rounded-lg px-3 py-1.5 focus-within:border-[#D4AF37]/50 transition-colors">
                                                <span className="text-xs text-zinc-500">$</span>
                                                <input type="number" step="0.1" value={m.price || ''} onChange={e => updateModifier(m.id, 'price', parseFloat(e.target.value) || 0)} className="w-14 bg-transparent text-sm font-bold text-[#F5A623] focus:outline-none text-right" />
                                            </div>

                                            <label className="flex items-center cursor-pointer gap-2">
                                                <input type="checkbox" checked={m.is_available} onChange={e => updateModifier(m.id, 'is_available', e.target.checked)} className="hidden" />
                                                <div className={`w-8 h-5 rounded-full relative transition-colors ${m.is_available ? 'bg-emerald-500/30' : 'bg-zinc-700'}`}>
                                                    <div className={`absolute top-0.5 bottom-0.5 w-4 rounded-full bg-white transition-transform ${m.is_available ? 'translate-x-3.5' : 'translate-x-0.5'}`}></div>
                                                </div>
                                            </label>

                                            <button onClick={() => handleDeleteModifier(m.id)} className="text-zinc-600 hover:text-red-400 transition-colors pl-2">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {modifiers.length === 0 && <span className="text-xs text-zinc-500 font-light">Sin extras configurados.</span>}
                        </div>
                    </div>

                    {/* Productos */}
                    <div className="bg-[#121212] p-6 rounded-[28px] border border-white/5 shadow-lg">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                            <h2 className="font-bebas text-2xl text-white tracking-wide flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span> Inventario de Platos
                            </h2>
                            <button onClick={handleAddProduct} className="bg-gradient-to-r from-[#D4AF37] to-[#F5A623] text-[#121212] px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] active:scale-95 transition-all">
                                + Añadir Plato
                            </button>
                        </div>

                        <div className="space-y-6">
                            <AnimatePresence>
                                {products.map(p => (
                                    <motion.div 
                                        key={p.id} 
                                        layout
                                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                                        className="bg-[#1A1A1A] border border-white/5 p-5 rounded-2xl flex flex-col lg:flex-row gap-6 relative group"
                                    >
                                        <button onClick={() => handleDeleteProduct(p.id)} className="absolute top-4 right-4 text-zinc-600 hover:text-red-500 transition-colors z-10 bg-[#121212] w-8 h-8 rounded-full flex items-center justify-center border border-white/5">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                        </button>

                                        {/* Imagen del Producto (Mejorada) */}
                                        <div className="w-full lg:w-32 shrink-0 flex flex-col gap-2">
                                            <label className={`relative w-full lg:w-32 h-32 bg-[#121212] rounded-xl border-2 border-dashed ${uploadingImage === `product_${p.id}` ? 'border-[#D4AF37]' : 'border-white/10 hover:border-[#D4AF37]/50'} overflow-hidden flex items-center justify-center cursor-pointer group transition-all`}>
                                                
                                                {uploadingImage === `product_${p.id}` ? (
                                                    <div className="w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
                                                ) : p.image_url ? (
                                                    <>
                                                        <img src={p.image_url} className="w-full h-full object-cover opacity-90 group-hover:opacity-40 transition-opacity" />
                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <span className="bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded text-[8px] font-bold uppercase tracking-widest border border-white/10">Cambiar</span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-1 text-zinc-600 group-hover:text-[#D4AF37]">
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                                        <span className="text-[9px] uppercase tracking-widest font-bold">Foto</span>
                                                    </div>
                                                )}
                                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'product_image', p.id)} className="hidden" disabled={uploadingImage === `product_${p.id}`} />
                                            </label>
                                        </div>

                                        <div className="flex-1 space-y-4 pr-0 lg:pr-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <input type="text" value={p.name} onChange={e => updateProduct(p.id, 'name', e.target.value)} className="w-full bg-[#121212] border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20 transition-all" placeholder="Nombre del plato..." />

                                                <div className="flex gap-3">
                                                    <select value={p.category_id || ''} onChange={e => updateProduct(p.id, 'category_id', e.target.value)} className="flex-1 bg-[#121212] border border-white/5 rounded-xl px-3 text-xs text-zinc-300 outline-none focus:border-[#D4AF37]/50 appearance-none cursor-pointer">
                                                        <option value="">Seleccionar Sección...</option>
                                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                    </select>
                                                    <div className="flex items-center gap-2 bg-[#121212] border border-white/5 rounded-xl px-4 py-3 focus-within:border-[#D4AF37]/50 transition-colors">
                                                        <span className="text-xs text-zinc-500">$</span>
                                                        <input type="number" step="0.1" value={p.price || ''} onChange={e => updateProduct(p.id, 'price', parseFloat(e.target.value) || 0)} className="w-16 bg-transparent text-sm font-bold text-[#F5A623] focus:outline-none" />
                                                    </div>
                                                </div>
                                            </div>

                                            <textarea value={p.description || ''} onChange={e => updateProduct(p.id, 'description', e.target.value)} className="w-full bg-[#121212] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-400 h-20 resize-none outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20 transition-all leading-relaxed" placeholder="Descripción apetitosa de los ingredientes..." />

                                            <div className="flex flex-wrap gap-4 pt-1">
                                                {/* Toggles Premium */}
                                                <label className={`flex items-center gap-2 cursor-pointer border px-3 py-2 rounded-lg transition-colors select-none ${p.is_available ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-[#121212] border-white/5'}`}>
                                                    <input type="checkbox" checked={p.is_available} onChange={e => updateProduct(p.id, 'is_available', e.target.checked)} className="hidden" />
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${p.is_available ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                                        {p.is_available ? '✔️ Disponible' : '🚫 Agotado'}
                                                    </span>
                                                </label>

                                                <label className={`flex items-center gap-2 cursor-pointer border px-3 py-2 rounded-lg transition-colors select-none ${p.is_hot ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30' : 'bg-[#121212] border-white/5'}`}>
                                                    <input type="checkbox" checked={p.is_hot} onChange={e => updateProduct(p.id, 'is_hot', e.target.checked)} className="hidden" />
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${p.is_hot ? 'text-[#D4AF37]' : 'text-zinc-500'}`}>
                                                        {p.is_hot ? '⭐ Especial' : 'Normal'}
                                                    </span>
                                                </label>
                                            </div>

                                            {/* Selector de Extras */}
                                            {modifiers.length > 0 && (
                                                <div className="pt-4 border-t border-white/5 mt-4">
                                                    <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-3 block">Personalización Permitida</span>
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
                                                                    className={`cursor-pointer px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all select-none ${isSelected ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]' : 'bg-[#121212] border-white/5 text-zinc-500 hover:border-white/20'}`}
                                                                >
                                                                    {m.name}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {products.length === 0 && (
                                <div className="py-10 flex items-center justify-center text-zinc-600 font-bebas text-xl">
                                    Aún no hay platos en tu menú.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Fijo: Guardar Todo */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-xl z-40">
                <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSaveAll} 
                    disabled={saving} 
                    className="w-full bg-[#121212]/90 backdrop-blur-xl border border-[#D4AF37]/30 text-white h-16 rounded-[24px] font-bold text-sm uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(0,0,0,0.8)] transition-all flex items-center justify-center group overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/10 to-[#F5A623]/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span className="relative z-10 flex items-center gap-3 text-[#D4AF37]">
                        {saving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
                                Sincronizando...
                            </>
                        ) : (
                            <>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                                Sincronizar Cambios
                            </>
                        )}
                    </span>
                </motion.button>
            </div>

            {/* Notificaciones (Toast) Premium */}
            <AnimatePresence>
                {toast && (
                    <motion.div 
                        initial={{ opacity: 0, y: -50 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -50 }}
                        className="fixed top-10 left-1/2 -translate-x-1/2 bg-[#121212]/90 backdrop-blur-md border border-[#D4AF37]/40 px-6 py-3 rounded-full flex items-center gap-3 z-50 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                    >
                        <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse"></span>
                        <span className="text-white text-[10px] font-bold uppercase tracking-widest">{toast}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}