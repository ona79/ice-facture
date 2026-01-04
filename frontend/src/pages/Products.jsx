import { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Plus, Trash2, Package, Lock, Unlock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '' });
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [accessPassword, setAccessPassword] = useState('');
  
  const navigate = useNavigate();
  const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

  const isNameInvalid = newProduct.name !== "" && /^\d+$/.test(newProduct.name);
  const isPriceInvalid = newProduct.price !== "" && (isNaN(newProduct.price) || Number(newProduct.price) <= 0);
  const isStockInvalid = newProduct.stock !== "" && (isNaN(newProduct.stock) || Number(newProduct.stock) < 0);
  const isFormValid = newProduct.name && newProduct.price && newProduct.stock && !isNameInvalid && !isPriceInvalid && !isStockInvalid;

  useEffect(() => {
    if (isUnlocked) fetchProducts();
  }, [isUnlocked]);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/products`, config);
      setProducts(res.data);
    } catch (err) {
      toast.error("Erreur de chargement");
    }
  };

  const handleUnlock = async (e) => {
    e.preventDefault();
    const loading = toast.loading("Vérification...");
    try {
      await axios.post(`${API_URL}/api/auth/verify-password`, { password: accessPassword }, config);
      setIsUnlocked(true);
      toast.dismiss(loading);
      toast.success("Catalogue déverrouillé");
    } catch (err) {
      toast.dismiss(loading);
      toast.error("Mot de passe incorrect");
      setAccessPassword(''); // Vide le champ en cas d'erreur
    }
  };

  const addProduct = async (e) => {
    e.preventDefault();
    const loading = toast.loading("Ajout en cours...");
    try {
      await axios.post(`${API_URL}/api/products`, newProduct, config);
      toast.dismiss(loading);
      toast.success("Produit ajouté !");
      setNewProduct({ name: '', price: '', stock: '' });
      fetchProducts();
    } catch (err) {
      toast.dismiss(loading);
      toast.error("Erreur lors de l'ajout");
    }
  };

  const deleteProduct = async (id, name) => {
    if (!window.confirm(`Supprimer définitivement ${name} ?`)) return;
    try {
      await axios.delete(`${API_URL}/api/products/${id}`, config);
      toast.success("Produit supprimé");
      fetchProducts();
    } catch (err) {
      toast.error("Erreur lors de la suppression");
    }
  };

  if (!isUnlocked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black p-4">
        <div className="glass-card w-full max-w-sm p-10 rounded-[2.5rem] border-white/10 text-center shadow-2xl">
          <div className="p-4 bg-ice-400/10 text-ice-400 rounded-2xl w-fit mx-auto mb-6"><Lock size={40}/></div>
          <h2 className="text-xl font-black uppercase italic mb-2 text-white tracking-tighter">Catalogue Protégé</h2>
          <p className="text-[10px] text-white/40 uppercase tracking-widest mb-8 leading-relaxed">Saisie manuelle du mot de passe admin</p>
          
          <form onSubmit={handleUnlock} className="space-y-4" autoComplete="off">
            {/* Champ invisible pour tromper l'autofill du navigateur */}
            <input type="text" style={{display:'none'}} aria-hidden="true"></input>
            <input type="password" style={{display:'none'}} aria-hidden="true"></input>

            <input 
              autoFocus
              type="password" 
              name="admin-password-unique" // Nom unique pour éviter la détection
              autoComplete="new-password" // Force le navigateur à ne pas suggérer
              placeholder="Mot de passe..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-ice-400 text-center"
              value={accessPassword}
              onChange={(e) => setAccessPassword(e.target.value)}
            />
            <button type="submit" className="w-full py-4 bg-ice-400 text-ice-900 rounded-2xl font-black uppercase text-xs shadow-lg shadow-ice-400/20 active:scale-95 transition-all">
              Déverrouiller
            </button>
            <button type="button" onClick={() => navigate('/dashboard')} className="text-[10px] font-bold text-white/20 uppercase hover:text-white transition-colors block mx-auto mt-4">Retour</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-5xl mx-auto min-h-screen text-white">
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-ice-100/50 font-bold uppercase text-[10px]">
          <ArrowLeft size={14} /> Retour Dashboard
        </button>
        <div className="flex items-center gap-2 text-green-500 font-black text-[10px] uppercase italic">
          <Unlock size={12} /> Accès Autorisé
        </div>
      </div>

      <h1 className="text-2xl font-black italic mb-8 uppercase tracking-widest text-white">Inventaire</h1>

      <div className="glass-card p-6 rounded-[2rem] border-white/5 mb-8 shadow-xl">
        <form onSubmit={addProduct} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
          <div className="relative">
            <label className="text-[10px] uppercase font-black text-white/20 ml-2 italic">Désignation</label>
            <input required type="text" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className={`w-full bg-white/5 border ${isNameInvalid ? 'border-red-500' : 'border-white/10'} rounded-2xl py-3 px-4 outline-none focus:border-ice-400`} placeholder="Nom..." />
          </div>

          <div className="relative">
            <label className="text-[10px] uppercase font-black text-white/20 ml-2 italic">Prix</label>
            <input required type="text" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} className={`w-full bg-white/5 border ${isPriceInvalid ? 'border-red-500' : 'border-white/10'} rounded-2xl py-3 px-4 outline-none focus:border-ice-400`} placeholder="0" />
          </div>

          <div className="relative">
            <label className="text-[10px] uppercase font-black text-white/20 ml-2 italic">Stock</label>
            <input required type="text" value={newProduct.stock} onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})} className={`w-full bg-white/5 border ${isStockInvalid ? 'border-red-500' : 'border-white/10'} rounded-2xl py-3 px-4 outline-none focus:border-ice-400`} placeholder="0" />
          </div>

          <button type="submit" disabled={!isFormValid} className={`h-[48px] mt-[18px] rounded-2xl font-black uppercase text-[10px] shadow-lg transition-all ${isFormValid ? 'bg-ice-400 text-ice-900 shadow-ice-400/20 active:scale-95' : 'bg-white/5 text-white/20 cursor-not-allowed opacity-50'}`}>
            + Ajouter
          </button>
        </form>
      </div>

      <div className="space-y-2">
        {products.map((p) => (
          <div key={p._id} className="glass-card p-4 rounded-2xl flex justify-between items-center border-white/5 hover:bg-white/5 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-ice-400/10 text-ice-400 rounded-lg"><Package size={18} /></div>
              <div>
                <p className="font-bold text-sm uppercase">{p.name}</p>
                <p className="text-[10px] text-ice-400">{p.price} F</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[8px] uppercase text-white/20 italic">Quantité</p>
                <p className={`font-black ${p.stock <= 5 ? 'text-red-500 font-bold' : 'text-white'}`}>{p.stock}</p>
              </div>
              <button onClick={() => deleteProduct(p._id, p.name)} className="p-2 text-white/10 hover:text-red-500 transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}