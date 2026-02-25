"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "../lib/supabase";
import Header from "../../components/Header";
import CategoryNav from "../../components/CategoryNav";
import ProductGrid from "../../components/ProductGrid";
import ProductModal from "../../components/ProductModal";
import CartDock from "../../components/CartDock";
import CheckoutModal from "../../components/CheckoutModal";
import { useCart } from "../../context/CartContext";

export default function StoreMenuPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  // En Next.js 15, params es una promesa que debemos desenvolver
  const { storeSlug } = use(params);
  
  const { setStoreData, setStoreModifiers } = useCart();
  const [activeCat, setActiveCat] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [categories, setCategories] = useState<any[]>([{ id: 'all', name: 'Todos' }]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const loadMenu = async () => {
      // 1. Buscar el negocio específico por el "slug" en la URL (ej: titostation)
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', storeSlug)
        .single();

      if (storeError || !storeData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Inyectamos la info del local al Carrito Global
      setStoreData(storeData);

      // 2. Traer las categorías que le pertenecen SOLO a este negocio
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', storeData.id);

      if (catData) {
        const sortedCats = [{ id: 'all', name: 'Todos' }, ...catData];
        setCategories(sortedCats);
      }

      // 3. Traer los productos SOLO de este negocio (y que estén Disponibles)
      const { data: prodData } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeData.id)
        .eq('is_available', true)
        .order('created_at', { ascending: true });

      if (prodData) setProducts(prodData);

     // 4. NUEVO: Traer los EXTRAS (Modifiers) de este negocio
      const { data: modData } = await supabase
        .from('modifiers')
        .select('*')
        .eq('store_id', storeData.id)
        .eq('is_available', true); 

      // Como setStoreModifiers ya está extraído arriba, lo podemos usar aquí sin problemas
      if (modData) setStoreModifiers(modData);

      setLoading(false);
     
    };
    
    loadMenu();
  }, [storeSlug]);

  const handleOpenProduct = (product: any) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseProduct = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedProduct(null), 300); 
  };

  if (loading) {
    return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-[#FF4500] font-bebas text-2xl animate-pulse">Cargando Menú...</div>;
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-center p-5">
        <h1 className="font-bebas text-5xl text-white mb-2">404</h1>
        <p className="text-zinc-400">Este comercio no existe o no está disponible en Webild POS.</p>
      </div>
    );
  }

  return (
    <main className="relative z-10 pb-32">
      <Header />
      <div className="sticky top-0 z-40 glass-header shadow-2xl">
        <CategoryNav 
          categories={categories} activeCat={activeCat} setActiveCat={setActiveCat} searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        />
      </div>
      <div className="px-4 py-6 min-h-[60vh]">
        <ProductGrid 
          products={products} activeCat={activeCat} searchTerm={searchTerm} onProductClick={handleOpenProduct}
        />
      </div>
      <ProductModal product={selectedProduct} isOpen={isModalOpen} onClose={handleCloseProduct} />
      <CartDock />
      <CheckoutModal />
    </main>
  );
}