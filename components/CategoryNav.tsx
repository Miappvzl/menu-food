// components/CategoryNav.tsx
interface Props {
  categories: any[];
  activeCat: string;
  setActiveCat: (id: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export default function CategoryNav({ categories, activeCat, setActiveCat, searchTerm, setSearchTerm }: Props) {
  return (
    <div className="w-full">
      <div className="px-5 py-3">
        <div className="relative group">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#FF4500] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
          <input type="text" placeholder="Buscar en el menú..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#1A1A1A] border border-[rgba(255,255,255,0.08)] rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#FF4500]/50 focus:bg-[#202020] transition-all font-medium" />
        </div>
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-3 snap-x">
        {categories.map((c) => (
          <button key={c.id} onClick={() => setActiveCat(c.id)} className={`transition-all duration-300 h-9 px-4 rounded-lg flex items-center gap-2 border text-xs font-bold uppercase tracking-wider min-w-max select-none ${activeCat === c.id ? 'bg-[#FF4500] text-white border-[#FF4500]' : 'bg-transparent text-zinc-400 border-[rgba(255,255,255,0.05)] hover:text-white hover:border-white/20'}`}>
            <span className="pt-0.5">{c.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}