import { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Plus, CheckCircle, Calculator, Search, AlertCircle, Banknote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { IceInput } from '../components/IceInput';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function NewInvoice() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [amountPaid, setAmountPaid] = useState(""); // Montant versé par le client
  const [isProfileComplete, setIsProfileComplete] = useState(true);

  const navigate = useNavigate();
  const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

  useEffect(() => {
    // 1. Vérification du profil (Obligatoire pour vendre)
    axios.get(`${API_URL}/api/auth/profile`, config)
      .then(res => {
        if (!res.data.address || !res.data.phone) {
          setIsProfileComplete(false);
          toast.error("PROFIL INCOMPLET : Remplissez votre adresse et téléphone dans les réglages.");
        }
      });

    // 2. Chargement des produits
    axios.get(`${API_URL}/api/products`, config)
      .then(res => setProducts(res.data))
      .catch(err => console.error("Erreur produits:", err));
  }, []);

  useEffect(() => {
    const sum = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    setTotal(sum);
    // Par défaut, on considère que tout est payé si l'utilisateur ne touche pas au champ
    if (!amountPaid) setAmountPaid(""); 
  }, [items]);

  const createInvoiceID = () => {
    const d = new Date();
    const datePart = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `FACT-${datePart}-${randomPart}`;
  };

  const addItem = (productId) => {
    const product = products.find(p => p._id === productId);
    if (!product || product.stock <= 0) return toast.error("Rupture de stock");
    
    const existing = items.find(i => i.productId === productId);
    if (existing) {
      if (existing.quantity >= product.stock) return toast.error("Stock limite");
      updateQuantity(productId, existing.quantity + 1);
    } else {
      setItems([...items, { productId: product._id, name: product.name, price: product.price, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, q) => {
    if (q < 1) return setItems(items.filter(i => i.productId !== id));
    const product = products.find(p => p._id === id);
    if (q > product.stock) return toast.error("Stock insuffisant");
    setItems(items.map(i => i.productId === id ? { ...i, quantity: Number(q) } : i));
  };

  const handleCheckout = async () => {
    if (!isProfileComplete) return toast.error("Veuillez compléter votre profil d'abord");
    if (items.length === 0) return toast.error("Le panier est vide");

    const loadingToast = toast.loading("Enregistrement...");
    const invoiceNum = createInvoiceID();
    
    // Si le champ est vide, on considère que tout est payé
    const finalPaid = amountPaid === "" ? total : Number(amountPaid);

    try {
      await axios.post(`${API_URL}/api/invoices`, { 
        invoiceNumber: invoiceNum, 
        items, 
        totalAmount: total,
        amountPaid: finalPaid, // On envoie le montant versé
        status: finalPaid >= total ? 'Payé' : 'Dette'
      }, config);

      toast.dismiss(loadingToast);
      toast.success(`Vente réussie !`);
      navigate('/dashboard'); 
    } catch (err) { 
      toast.dismiss(loadingToast);
      toast.error("Erreur lors de la vente"); 
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto min-h-screen pb-32 text-white">
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-white/30 mb-6 font-bold uppercase text-[10px] hover:text-white transition-colors">
        <ArrowLeft size={14} /> Annuler
      </button>

      {!isProfileComplete && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl mb-6 flex items-center gap-3 animate-pulse">
          <AlertCircle className="text-red-500" />
          <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">Action requise : Complétez vos infos dans Paramètres avant de vendre.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* CATALOGUE (GAUCHE) */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input 
              type="text" placeholder="Rechercher..." value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-ice-400 text-sm" 
            />
          </div>
          
          <div className="grid grid-cols-1 gap-2 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
            {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
              <button 
                key={p._id} onClick={() => addItem(p._id)} 
                className={`glass-card p-4 rounded-xl flex justify-between items-center border border-white/5 hover:border-ice-400 transition-all ${p.stock <= 0 ? 'opacity-20 grayscale' : 'active:scale-95'}`}
                disabled={p.stock <= 0}
              >
                <div className="text-left">
                  <p className="font-bold text-sm uppercase">{p.name}</p>
                  <p className="text-[10px] text-ice-400 font-bold">{Math.round(p.price).toLocaleString()} F • <span className="text-white/20">{p.stock} stock</span></p>
                </div>
                <div className="bg-ice-400/10 p-2 rounded-lg text-ice-400"><Plus size={20} /></div>
              </button>
            ))}
          </div>
        </div>

        {/* PANIER & ENCAISSEMENT (DROITE) */}
        <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 shadow-2xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <h2 className="font-black mb-8 text-ice-400 text-[10px] uppercase tracking-widest flex items-center gap-2">
              <Calculator size={16} /> Panier Actuel
            </h2>
            
            <div className="space-y-4 mb-8 max-h-[30vh] overflow-y-auto pr-2">
              {items.map(item => (
                <div key={item.productId} className="flex justify-between items-center border-b border-white/5 pb-4">
                  <div className="w-2/3">
                    <p className="text-xs font-black uppercase">{item.name}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center bg-white/5 rounded-lg border border-white/10">
                        <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="px-3 py-1">-</button>
                        <span className="px-2 text-xs font-black text-ice-400">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="px-3 py-1">+</button>
                      </div>
                    </div>
                  </div>
                  <p className="font-black text-sm text-white">{(item.price * item.quantity).toLocaleString()} F</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {/* GESTION DU PAIEMENT / DETTE */}
            <div className="bg-ice-400/5 p-6 rounded-[2rem] border border-ice-400/10">
              <div className="flex items-center gap-2 mb-4 text-ice-400">
                <Banknote size={16}/>
                <span className="text-[9px] font-black uppercase tracking-widest">Règlement</span>
              </div>
              <IceInput 
                label="Montant reçu (FCFA)" 
                type="number" 
                placeholder="Laisser vide si tout est payé"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
              />
              {amountPaid !== "" && Number(amountPaid) < total && (
                <div className="mt-3 flex justify-between items-center">
                   <span className="text-[9px] font-black text-orange-500 uppercase italic">⚠️ Dette client :</span>
                   <span className="text-sm font-black text-orange-500">{(total - amountPaid).toLocaleString()} F</span>
                </div>
              )}
            </div>

            <div className="bg-black/20 p-8 rounded-[2rem] border border-white/5 text-center">
              <span className="text-[10px] text-white/30 uppercase font-black tracking-[0.4em] mb-2 block">Net à payer</span>
              <span className="text-5xl font-black text-ice-400 tracking-tighter">
                {Math.round(total).toLocaleString()} <span className="text-xl">F</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BOUTON ENCAISSER */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md">
        <button 
          onClick={handleCheckout} 
          disabled={items.length === 0 || !isProfileComplete} 
          className="w-full bg-ice-400 text-ice-900 font-black py-6 rounded-[2rem] flex items-center justify-center gap-3 shadow-2xl shadow-ice-400/40 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-10"
        >
          <CheckCircle size={22} /> 
          <span className="uppercase tracking-widest text-sm">Valider la vente</span>
        </button>
      </div>
    </div>
  );
}