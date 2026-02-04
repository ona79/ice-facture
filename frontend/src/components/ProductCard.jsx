import { Package } from 'lucide-react';

export const ProductCard = ({ name, price, description }) => (
  <div className="bg-white border border-slate-100 p-4 rounded-2xl flex justify-between items-center hover:bg-slate-50 transition-all shadow-sm">
    <div className="flex items-center gap-4">
      <div className="bg-ice-50 p-3 rounded-xl text-ice-600">
        <Package size={20} />
      </div>
      <div className="text-left">
        <h3 className="font-bold text-slate-900 uppercase text-xs tracking-tight leading-none mb-1">{name}</h3>
        <p className="text-[10px] text-slate-400 font-bold line-clamp-1 uppercase tracking-tighter opacity-70">{description || "Aucune description"}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-lg font-black italic text-ice-600 leading-none">{price} <span className="text-[10px] not-italic font-black opacity-30">F</span></p>
      <p className="text-[8px] uppercase text-slate-300 font-black tracking-widest mt-0.5">Unité</p>
    </div>
  </div>
);