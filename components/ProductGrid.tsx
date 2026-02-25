// components/ProductGrid.tsx
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

  return (
    <>
      <div className="flex justify-between items-end mb-5 px-1">
        <h3 className="font-bebas text-2xl text-white tracking-wide">Carta</h3>
        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{filteredProducts.length} ITEMS</span>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="py-16 text-center opacity-50">
          <p className="text-zinc-600 font-bebas text-xl tracking-wide">No se encontraron productos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredProducts.map(p => (
            <div key={p.id} onClick={() => onProductClick(p)} className="card-premium rounded-xl p-3 flex gap-3 cursor-pointer group relative overflow-hidden active:scale-[0.98] transition-transform">
              <div className="w-20 h-20 bg-[#151515] rounded-lg overflow-hidden flex-shrink-0">
                <img src={p.image_url} alt={p.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex flex-col justify-center flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bebas text-xl text-white leading-none">{p.name}</h4>
                  <span className="font-bebas text-[#FF4500] text-xl">${p.price.toFixed(2)}</span>
                </div>
                <p className="text-zinc-500 text-xs line-clamp-2 mb-2 font-medium">{p.description}</p>
               {p.is_hot && <span className="text-[9px] font-bold text-[#FF4500] uppercase tracking-widest">🔥 Promoción</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}