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
import { motion } from "framer-motion"; // <-- Importamos Framer Motion

export default function StoreMenuPage({ params }: { params: Promise<{ storeSlug: string }> }) {
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
      // Lógica intacta
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

      setStoreData(storeData);

      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', storeData.id);

      if (catData) {
        const sortedCats = [{ id: 'all', name: 'Todos' }, ...catData];
        setCategories(sortedCats);
      }

      const { data: prodData } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeData.id)
        .eq('is_available', true)
        .order('created_at', { ascending: true });

      if (prodData) setProducts(prodData);

      const { data: modData } = await supabase
        .from('modifiers')
        .select('*')
        .eq('store_id', storeData.id)
        .eq('is_available', true); 

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
    // UI: Pantalla de carga Premium
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center">
        <motion.div 
          animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="w-16 h-16 rounded-full border-t-2 border-b-2 border-[#D4AF37] mb-4"
        />
        <span className="text-[#D4AF37] font-bebas text-2xl tracking-[0.2em] uppercase">Preparando el Menú...</span>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-center p-5">
        <h1 className="font-bebas text-6xl text-[#D4AF37] mb-2 tracking-wider">404</h1>
        <p className="text-zinc-400 text-lg font-light">Este comercio no se encuentra en nuestra guía.</p>
      </div>
    );
  }

  return (
    // UI: Fondo premium con gradiente radial sutil para dar profundidad
    <main className="relative z-10 pb-32 min-h-screen bg-[#0A0A0A] overflow-hidden">
      {/* Efecto de luz de fondo */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1A1500]/20 via-[#0A0A0A]/80 to-[#0A0A0A] z-0" />
      
      <div className="relative z-10">
        <Header />
        
        {/* UI: Header flotante con blur (Glassmorphism más elegante) */}
        <div className="sticky top-0 z-40 bg-[#0A0A0A]/70 backdrop-blur-md border-b border-white/5">
          <CategoryNav 
            categories={categories} activeCat={activeCat} setActiveCat={setActiveCat} searchTerm={searchTerm} setSearchTerm={setSearchTerm}
          />
        </div>
        
        <div className="px-4 py-8 min-h-[60vh]">
          <ProductGrid 
            products={products} activeCat={activeCat} searchTerm={searchTerm} onProductClick={handleOpenProduct}
          />
        </div>
        
        <ProductModal 
          product={selectedProduct} 
          isOpen={isModalOpen} 
          onClose={handleCloseProduct} 
        />
        <CartDock />
        <CheckoutModal />
      </div>
    </main>
  );
}