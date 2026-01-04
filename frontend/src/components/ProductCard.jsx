import { Package } from 'lucide-react';

export const ProductCard = ({ name, price, description }) => (
  <div className="glass-card p-4 rounded-2xl flex justify-between items-center hover:bg-white/10 transition-all">
    <div className="flex items-center gap-4">
      <div className="bg-ice-400/10 p-3 rounded-xl text-ice-400">
        <Package size={20} />
      </div>
      <div>
        <h3 className="font-bold text-ice-50">{name}</h3>
        <p className="text-xs text-ice-100/40 line-clamp-1">{description || "Aucune description"}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-lg font-bold text-ice-400">{price} €</p>
      <p className="text-[10px] uppercase text-ice-100/30 tracking-widest">Unité</p>
    </div>
  </div>
);