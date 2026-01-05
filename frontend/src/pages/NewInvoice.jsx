import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ArrowLeft, Plus, Minus, CheckCircle, ShoppingCart, 
  Search, AlertCircle, Banknote, User, Trash2, Settings as SettingsIcon 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function NewInvoice() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [amountPaid, setAmountPaid] = useState(""); 
  const [customerName, setCustomerName] = useState("");
  const [isProfileComplete, setIsProfileComplete] = useState(true);

  const navigate = useNavigate();
  const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

  useEffect(() => {
    axios.get(`${API_URL}/api/auth/profile`, config)
      .then(res => {
        if (!res.data.address || !res.data.phone) {
          setIsProfileComplete(false);
        } else {
          setIsProfileComplete(true);
        }
      })
      .catch(err => console.error("Erreur profil:", err));

    axios.get(`${API_URL}/api/products`, config)
      .then(res => setProducts(res.data))
      .catch(err => console.error("Erreur produits:", err));
  }, []);

  useEffect(() => {
    const sum = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    setTotal(sum);
    setAmountPaid("");
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
    if (q > (product?.stock || 0)) return toast.error("Stock insuffisant");
    setItems(items.map(i => i.productId === id ? { ...i, quantity: Number(q) } : i));
  };

  const handleCheckout = async () => {
    if (!isProfileComplete) return toast.error("Profil incomplet : Remplissez les paramètres");
    if (items.length === 0) return toast.error("Panier vide");
    if (!customerName.trim()) return toast.error("NOM DU CLIENT OBLIGATOIRE");

    const finalPaid = amountPaid === "" ? total : parseFloat(amountPaid);

    if (finalPaid > total) {
      return toast.error("L'ENCAISSEMENT NE PEUT PAS DÉPASSER LE TOTAL");
    }

    const loadingToast = toast.loading("Enregistrement...");
    const invoiceNum = createInvoiceID();

    try {
      await axios.post(`${API_URL}/api/invoices`, { 
        invoiceNumber: invoiceNum, 
        items, 
        totalAmount: total,
        amountPaid: finalPaid,
        customerName: customerName.trim().toUpperCase(),
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
    <div className="p-4 max-w-7xl mx-auto min-h-screen text-white font-sans">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-white/30 font-black uppercase text-[10px] hover:text-white transition-colors">
          <ArrowLeft size={14} /> Annuler
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CATALOGUE */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input 
              type="text" placeholder="RECHERCHER..." value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-ice-400 text-[11px] font-black uppercase" 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
              <button 
                key={p._id} onClick={() => addItem(p._id)} 
                className={`p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex justify-between items-center hover:border-ice-400/50 transition-all ${p.stock <= 0 ? 'opacity-20 grayscale cursor-not-allowed' : 'active:scale-95'}`}
                disabled={p.stock <= 0}
              >
                <div className="text-left">
                  <p className="font-black text-[11px] uppercase tracking-tight">{p.name}</p>
                  <p className="text-[10px] text-ice-400 font-black mt-1">{Math.round(p.price).toLocaleString()} F <span className="text-white/20 ml-2">({p.stock} STOCK)</span></p>
                </div>
                <Plus size={16} className="text-ice-400" />
              </button>
            ))}
          </div>
        </div>

        {/* PANIER */}
        <div className="lg:col-span-5 flex flex-col h-[75vh] glass-card rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl relative">
          
          {/* BANDEAU ALERTE PULSE */}
          {!isProfileComplete && (
            <div className="bg-red-500/20 border-b border-red-500/20 py-2 px-4 flex items-center justify-between animate-pulse">
              <span className="text-[9px] font-black uppercase text-red-400 tracking-tighter">
                Veuillez remplir le paramètre
              </span>
              <button 
                onClick={() => navigate('/settings')}
                className="bg-red-500 text-white p-1 rounded-md hover:bg-red-600 transition-colors"
                title="Aller aux paramètres"
              >
                <SettingsIcon size={12} />
              </button>
            </div>
          )}

          <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
            <h2 className="font-black text-ice-400 text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
              <ShoppingCart size={16} /> Panier ({items.length})
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {items.map(item => (
              <div key={item.productId} className="flex justify-between items-center bg-white/[0.02] p-3 rounded-xl border border-white/5">
                <p className="text-[11px] font-black uppercase truncate flex-1">{item.name}</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-black/40 rounded-lg p-1">
                    <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}><Minus size={12}/></button>
                    <span className="text-[10px] font-black w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}><Plus size={12}/></button>
                  </div>
                  <p className="text-[11px] font-black w-20 text-right">{(item.price * item.quantity).toLocaleString()} F</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-white/[0.03] border-t border-white/10 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[7px] font-black uppercase text-white/30 px-1 italic">Client (Lettres seul.)</label>
                <input 
                  type="text" 
                  placeholder="NOM..." 
                  value={customerName}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                    setCustomerName(val);
                  }}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-[10px] font-black uppercase outline-none focus:border-ice-400/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[7px] font-black uppercase text-white/30 px-1 italic">Encaissé (Max: {total})</label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  placeholder="0" 
                  value={amountPaid}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, ''); 
                    if (val === "") {
                      setAmountPaid("");
                      return;
                    }
                    if (parseInt(val, 10) > total) {
                      setAmountPaid(total.toString());
                      toast.error(`MAXIMUM: ${total} F`);
                    } else {
                      setAmountPaid(val);
                    }
                  }}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-[10px] font-black outline-none focus:border-ice-400/50 text-orange-500"
                />
              </div>
            </div>

            <div className="flex justify-between items-end py-2">
              <div>
                <p className="text-[9px] font-black uppercase text-white/30">Net à payer</p>
                {amountPaid !== "" && parseInt(amountPaid, 10) < total && (
                  <p className="text-[9px] font-black text-orange-500 uppercase mt-1 italic animate-pulse">
                    Dette: {(total - parseInt(amountPaid, 10)).toLocaleString()} F
                  </p>
                )}
              </div>
              <p className="text-4xl font-black italic text-ice-400 tracking-tighter">
                {Math.round(total).toLocaleString()}<span className="text-lg ml-1">F</span>
              </p>
            </div>

            <button 
              onClick={handleCheckout} 
              disabled={items.length === 0 || !isProfileComplete} 
              className={`w-full font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-lg transition-all ${!isProfileComplete ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-ice-400 text-ice-900 shadow-ice-400/20 hover:scale-[1.02] active:scale-95'}`}
            >
              <CheckCircle size={20} /> 
              <span className="uppercase tracking-widest text-[11px]">
                {isProfileComplete ? "Valider la vente" : "Profil Incomplet"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}