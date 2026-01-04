import { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Plus, Trash2, Package, Lock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '' });
  
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, name: '', password: '' });
  const [addModal, setAddModal] = useState({ show: false, password: '' });
  
  const navigate = useNavigate();
  const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

  // --- VÉRIFICATIONS STRICTES (Empêche lettres et chiffres invalides) ---
  const isNameInvalid = newProduct.name !== "" && /^\d+$/.test(newProduct.name);
  
  // Vérifie si c'est un nombre valide, supérieur à 0 et sans lettres
  const isPriceInvalid = newProduct.price !== "" && (isNaN(newProduct.price) || Number(newProduct.price) <= 0);
  
  // Vérifie si c'est un nombre valide, positif ou nul, sans lettres
  const isStockInvalid = newProduct.stock !== "" && (isNaN(newProduct.stock) || Number(newProduct.stock) < 0);

  // Le bouton est activé uniquement si tout est rempli correctement
  const isFormValid = newProduct.name && newProduct.price && newProduct.stock && !isNameInvalid && !isPriceInvalid && !isStockInvalid;

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/products', config);
      setProducts(res.data);
    } catch (err) {
      toast.error("Erreur de chargement");
    }
  };

  const preAddProduct = (e) => {
    e.preventDefault();
    if (!isFormValid) {
      toast.error("Veuillez remplir correctement tous les champs");
      return;
    }
    setAddModal({ show: true, password: '' });
  };

  const confirmAdd = async () => {
    const loading = toast.loading("Ajout en cours...");
    try {
      await axios.post('http://localhost:5000/api/products', { ...newProduct, adminPassword: addModal.password }, config);
      toast.dismiss(loading);
      toast.success("Produit ajouté !");
      setNewProduct({ name: '', price: '', stock: '' });
      setAddModal({ show: false, password: '' });
      fetchProducts();
    } catch (err) {
      toast.dismiss(loading);
      toast.error(err.response?.data?.msg || "Mot de passe incorrect");
    }
  };

  const confirmDelete = async () => {
    const loading = toast.loading("Suppression...");
    try {
      await axios.delete(`http://localhost:5000/api/products/${deleteModal.id}`, {
        headers: config.headers,
        data: { adminPassword: deleteModal.password }
      });
      toast.dismiss(loading);
      toast.success("Produit supprimé");
      setDeleteModal({ show: false, id: null, name: '', password: '' });
      fetchProducts();
    } catch (err) {
      toast.dismiss(loading);
      toast.error("Mot de passe incorrect");
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto min-h-screen text-white">
      
      {/* MODAL AJOUT */}
      {addModal.show && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-sm p-8 rounded-[2rem] border-white/10 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <Lock className="text-ice-400 mb-4" size={40} />
              <h3 className="font-black uppercase mb-2">Validation Admin</h3>
              <p className="text-xs text-white/50 mb-6">Saisie manuelle du mot de passe</p>
              <input 
                autoFocus
                type="password" 
                autoComplete="new-password"
                placeholder="Mot de passe..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 mb-4 outline-none focus:border-ice-400"
                value={addModal.password}
                onChange={(e) => setAddModal({...addModal, password: e.target.value})}
              />
              <div className="flex gap-2 w-full">
                <button onClick={() => setAddModal({show:false})} className="flex-1 py-3 bg-white/5 rounded-xl font-bold text-xs uppercase">Annuler</button>
                <button onClick={confirmAdd} className="flex-1 py-3 bg-ice-400 text-ice-900 rounded-xl font-bold text-xs uppercase">Confirmer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUPPRESSION */}
      {deleteModal.show && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-sm p-8 rounded-[2rem] border-white/10 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <Lock className="text-red-500 mb-4" size={40} />
              <h3 className="font-black uppercase mb-2">Sécurité Admin</h3>
              <p className="text-xs text-white/50 mb-6">Supprimer <span className="text-white font-bold">{deleteModal.name}</span> ?</p>
              <input 
                autoFocus
                type="password" 
                autoComplete="new-password"
                placeholder="Mot de passe..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 mb-4 outline-none focus:border-red-500"
                value={deleteModal.password}
                onChange={(e) => setDeleteModal({...deleteModal, password: e.target.value})}
              />
              <div className="flex gap-2 w-full">
                <button onClick={() => setDeleteModal({show:false})} className="flex-1 py-3 bg-white/5 rounded-xl font-bold text-xs uppercase">Annuler</button>
                <button onClick={confirmDelete} className="flex-1 py-3 bg-red-500 rounded-xl font-bold text-xs uppercase">Supprimer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-ice-100/50 mb-8 font-bold uppercase text-[10px]">
        <ArrowLeft size={14} /> Retour Dashboard
      </button>

      <h1 className="text-2xl font-black italic mb-8 uppercase tracking-widest">Inventaire</h1>

      {/* FORMULAIRE */}
      <div className="glass-card p-6 rounded-[2rem] border-white/5 mb-8 shadow-xl">
        <form onSubmit={preAddProduct} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
          
          {/* NOM */}
          <div className="relative">
            <label className="text-[10px] uppercase font-black text-white/20 ml-2">Nom</label>
            <input 
              required
              type="text" 
              value={newProduct.name}
              onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
              className={`w-full bg-white/5 border ${isNameInvalid ? 'border-red-500' : 'border-white/10'} rounded-2xl py-3 px-4 outline-none focus:border-ice-400`}
              placeholder="Ex: Pomme"
            />
            {isNameInvalid && (
              <p className="text-[9px] text-red-500 font-bold uppercase mt-1 ml-2 flex items-center gap-1">
                <AlertCircle size={10} /> Nom invalide
              </p>
            )}
          </div>

          {/* PRIX */}
          <div className="relative">
            <label className="text-[10px] uppercase font-black text-white/20 ml-2">Prix</label>
            <input 
              required 
              type="text" // Changé en text pour mieux contrôler la validation des lettres
              value={newProduct.price} 
              onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} 
              className={`w-full bg-white/5 border ${isPriceInvalid ? 'border-red-500' : 'border-white/10'} rounded-2xl py-3 px-4 outline-none focus:border-ice-400`}
              placeholder="0"
            />
            {isPriceInvalid && (
              <p className="text-[9px] text-red-500 font-bold uppercase mt-1 ml-2 flex items-center gap-1">
                <AlertCircle size={10} /> Chiffre &gt; 0 requis
              </p>
            )}
          </div>

          {/* STOCK */}
          <div className="relative">
            <label className="text-[10px] uppercase font-black text-white/20 ml-2">Stock</label>
            <input 
              required 
              type="text" 
              value={newProduct.stock} 
              onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})} 
              className={`w-full bg-white/5 border ${isStockInvalid ? 'border-red-500' : 'border-white/10'} rounded-2xl py-3 px-4 outline-none focus:border-ice-400`}
              placeholder="0"
            />
            {isStockInvalid && (
              <p className="text-[9px] text-red-500 font-bold uppercase mt-1 ml-2 flex items-center gap-1">
                <AlertCircle size={10} /> Nombre positif requis
              </p>
            )}
          </div>

          <button 
            type="submit" 
            disabled={!isFormValid}
            className={`h-[48px] mt-[18px] rounded-2xl font-black uppercase text-[10px] shadow-lg transition-all 
            ${isFormValid ? 'bg-ice-400 text-ice-900 shadow-ice-400/20 active:scale-95' : 'bg-white/5 text-white/20 cursor-not-allowed opacity-50'}`}
          >
            + Ajouter
          </button>
        </form>
      </div>

      {/* LISTE DES PRODUITS */}
      <div className="space-y-2">
        {products.map((p) => (
          <div key={p._id} className="glass-card p-4 rounded-2xl flex justify-between items-center border-white/5">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-ice-400/10 text-ice-400 rounded-lg"><Package size={18} /></div>
              <div>
                <p className="font-bold text-sm uppercase">{p.name}</p>
                <p className="text-[10px] text-ice-400">{p.price} F</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[8px] uppercase text-white/20">Stock</p>
                <p className={`font-black ${p.stock <= 5 ? 'text-red-500 font-bold' : 'text-white'}`}>{p.stock}</p>
              </div>
              <button 
                onClick={() => setDeleteModal({show: true, id: p._id, name: p.name, password: ''})}
                className="p-2 text-white/10 hover:text-red-500 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}