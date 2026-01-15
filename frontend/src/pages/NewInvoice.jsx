import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  ArrowLeft, Plus, Minus, CheckCircle, ShoppingCart,
  Search, AlertCircle, Banknote, User, Trash2, Settings as SettingsIcon, Scan, X
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PhoneInput } from '../components/PhoneInput';

// Correction de l'URL pour Render
const API_URL = import.meta.env.VITE_API_URL || "https://ta-facture.onrender.com";

export default function NewInvoice() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [amountPaid, setAmountPaid] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isProfileComplete, setIsProfileComplete] = useState(true);

  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' or 'cart'

  const nameRef = useRef(null);
  const phoneRef = useRef(null);
  const amountRef = useRef(null);
  const [showScanner, setShowScanner] = useState(false);
  const scannerRef = useRef(null);
  const submitRef = useRef(null);

  const navigate = useNavigate();
  const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

  useEffect(() => {
    // Vérification du profil
    axios.get(`${API_URL}/api/auth/profile`, config)
      .then(res => {
        if (!res.data.address || !res.data.phone) {
          setIsProfileComplete(false);
        } else {
          setIsProfileComplete(true);
        }
      })
      .catch(err => console.error("Erreur profil:", err));

    // Chargement des produits
    axios.get(`${API_URL}/api/products`, config)
      .then(res => setProducts(res.data))
      .catch(err => console.error("Erreur produits:", err));
  }, []);

  // Recalcul du total
  useEffect(() => {
    const sum = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    setTotal(sum);
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
      setItems([...items, { productId: product._id, name: product.name, price: 0, quantity: 1, isPriceSet: false }]);
    }
  };

  const updateQuantity = (id, q) => {
    if (q < 1) return setItems(items.filter(i => i.productId !== id));
    const product = products.find(p => p._id === id);
    if (q > (product?.stock || 0)) return toast.error("Stock insuffisant");
    setItems(items.map(i => i.productId === id ? { ...i, quantity: Number(q) } : i));
  };

  const updatePrice = (id, newPrice) => {
    setItems(items.map(i => i.productId === id ? { ...i, price: Number(newPrice), isPriceSet: true } : i));
  };

  const startScanning = async () => {
    setShowScanner(true);
    setTimeout(async () => {
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            handleBarcodeFound(decodedText);
            stopScanning();
          },
          () => { } // error handler
        );
      } catch (err) {
        toast.error("Erreur caméra");
        setShowScanner(false);
      }
    }, 100);
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().then(() => {
        setShowScanner(false);
      }).catch(() => setShowScanner(false));
    } else {
      setShowScanner(false);
    }
  };

  const handleBarcodeFound = (code) => {
    const found = products.find(p => p.barcode === code);
    if (found) {
      if (found.stock <= 0) {
        toast.error("Stock épuisé");
        return;
      }
      addItem(found._id); // Use existing addItem function
      toast.success(`${found.name} ajouté !`);
    } else {
      toast.error("Produit non trouvé");
    }
  };

  // --- VALIDATION DE LA VENTE (CORRIGÉ : PAS DE REDIRECTION WHATSAPP) ---
  const handleCheckout = async () => {
    if (!isProfileComplete) return toast.error("Profil incomplet : Remplissez les paramètres");
    if (items.length === 0) return toast.error("Panier vide");
    if (!customerName.trim()) return toast.error("NOM DU CLIENT OBLIGATOIRE");

    const finalPaid = amountPaid === "" ? total : parseFloat(amountPaid);

    if (finalPaid > total) {
      return toast.error("L'ENCAISSEMENT NE PEUT PAS DÉPASSER LE TOTAL");
    }

    const loadingToast = toast.loading("Enregistrement de la vente...");
    const invoiceNum = createInvoiceID();

    try {
      // On envoie les données au serveur pour enregistrement
      await axios.post(`${API_URL}/api/invoices`, {
        invoiceNumber: invoiceNum,
        items,
        totalAmount: total,
        amountPaid: finalPaid,
        customerName: customerName.trim().toUpperCase(),
        customerPhone: customerPhone, // Le numéro est juste sauvegardé ici
      }, config);

      toast.dismiss(loadingToast);
      toast.success(`Vente enregistrée : ${invoiceNum}`);

      // Retour au dashboard directement après la réussite
      navigate('/dashboard');
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error("Erreur serveur lors de la vente");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="p-4 max-w-7xl mx-auto min-h-screen text-white font-sans"
    >
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-white/30 font-black uppercase text-[10px] hover:text-white transition-colors">
          <ArrowLeft size={14} /> Annuler
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-24 lg:pb-0">
        {/* CATALOGUE */}
        <div className={`lg:col-span-7 space-y-4 ${activeTab === 'cart' ? 'hidden lg:block' : ''}`}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input
                type="text" placeholder="RECHERCHER UN PRODUIT..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-ice-400 text-[11px] font-black uppercase"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    setActiveTab('cart');
                    setTimeout(() => nameRef.current?.focus(), 100);
                  }
                }}
              />
            </div>
            <button
              onClick={startScanning}
              className="bg-ice-400 text-ice-900 p-4 rounded-2xl active:scale-90 transition-all shadow-lg"
            >
              <Scan size={20} />
            </button>
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
                  <p className="text-[10px] text-ice-400 font-black mt-1">
                    <span className={`ml-2 ${p.stock <= 5 ? 'text-red-500 animate-blink' : 'text-white/20'}`}>
                      ({p.stock} STOCK)
                    </span>
                  </p>
                </div>
                <Plus size={16} className="text-ice-400" />
              </button>
            ))}
          </div>
        </div>

        {/* PANIER */}
        <div className={`lg:col-span-5 flex flex-col h-[75vh] glass-card rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl bg-white/[0.02] backdrop-blur-md ${activeTab === 'catalog' ? 'hidden lg:flex' : 'flex'}`}>
          {/* Mobile Back Button */}
          <button
            onClick={() => setActiveTab('catalog')}
            className="lg:hidden p-4 flex items-center gap-2 text-ice-400 font-black uppercase text-[10px]"
          >
            <ArrowLeft size={14} /> Retour au catalogue
          </button>

          {!isProfileComplete && (
            <div className="bg-red-500/20 border-b border-red-500/20 py-2 px-4 flex items-center justify-between animate-pulse">
              <span className="text-[9px] font-black uppercase text-red-400 tracking-tighter">
                Profil incomplet : Configurez votre adresse et téléphone
              </span>
              <button onClick={() => navigate('/settings')} className="bg-red-500 text-white p-1 rounded-md hover:bg-red-600 transition-colors">
                <SettingsIcon size={12} />
              </button>
            </div>
          )}

          <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
            <h2 className="font-black text-ice-400 text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
              <ShoppingCart size={16} /> Panier ({items.length})
            </h2>
          </div>


          {/* CONTROL SECTION (Moved to Top) */}
          <div className="p-4 bg-white/[0.03] border-b border-white/10 space-y-3">
            {/* INFOS CLIENT */}
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)] gap-2">
              <div className="space-y-1">
                <label className="text-[7px] font-black uppercase text-white/30 px-1 italic">Client (Lettres seul.)</label>
                <input
                  type="text"
                  placeholder="NOM..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-[10px] font-black uppercase outline-none focus:border-ice-400/50"
                  ref={nameRef}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      phoneRef.current?.focus();
                    }
                  }}
                />
              </div>

              <div className="space-y-1">
                <PhoneInput
                  label="WhatsApp (Client)"
                  value={customerPhone}
                  onChange={(val) => setCustomerPhone(val)}
                  ref={phoneRef}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      amountRef.current?.focus();
                    }
                  }}
                />
              </div>
            </div>

            {/* PAIEMENT & VALIDATION (Compacté) */}
            <div className="flex items-center gap-3 bg-black/20 p-3 rounded-[1.5rem] border border-white/5">
              <div className="w-24 space-y-1">
                <label className="text-[7px] font-black uppercase text-white/30 px-1 italic leading-none block">Encaissé</label>
                <input
                  type="text"
                  placeholder="0"
                  value={amountPaid}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, '');
                    if (val === "") { setAmountPaid(""); return; }
                    if (parseInt(val, 10) > total) {
                      setAmountPaid(total.toString());
                      toast.error(`MAX: ${total} F`);
                    } else { setAmountPaid(val); }
                  }}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-[10px] font-black outline-none focus:border-ice-400/50 text-orange-500"
                  ref={amountRef}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCheckout();
                    }
                  }}
                />
              </div>

              <div className="flex-1 text-right pr-2">
                <div className="flex flex-col items-end">
                  <p className="text-[8px] font-black uppercase text-white/30 leading-none mb-1">Total</p>
                  <p className="text-xl font-black italic text-ice-400 tracking-tighter leading-none whitespace-nowrap">
                    {Math.round(total).toLocaleString()} F
                  </p>
                  {amountPaid !== "" && parseInt(amountPaid, 10) < total && (
                    <p className="text-[7px] font-black text-orange-500 uppercase mt-0.5 italic animate-pulse">
                      Restant: {(total - parseInt(amountPaid, 10)).toLocaleString()} F
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={items.length === 0 || !isProfileComplete}
                className={`px-4 py-3.5 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-lg transition-all ${(!isProfileComplete || items.length === 0) ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-ice-400 text-ice-900 shadow-ice-400/20 active:scale-95'}`}
              >
                <CheckCircle size={14} /> {isProfileComplete ? "Valider" : "Erreur"}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-white/20 italic">
                <ShoppingCart size={48} className="mb-4 opacity-50" />
                <p className="text-xs uppercase font-bold tracking-widest">Votre panier est vide</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[9px] uppercase font-black text-white/30 border-b border-white/10">
                    <th className="py-2 pl-2">Produit</th>
                    <th className="py-2 text-center">Qté</th>
                    <th className="py-2 w-32">Prix</th>
                    <th className="py-2 text-right pr-2">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {items.map(item => (
                    <tr key={item.productId} className="group hover:bg-white/5 transition-colors">
                      <td className="py-2 pl-2 max-w-[100px]">
                        <div className="font-black text-[10px] uppercase truncate">{item.name}</div>
                      </td>
                      <td className="py-2 text-center">
                        <div className="flex items-center justify-center bg-black/40 rounded-lg p-1 w-fit mx-auto">
                          <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="p-1 hover:text-white text-white/50 transition-colors"><Minus size={10} /></button>
                          <span className="text-[10px] font-black w-6 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="p-1 hover:text-white text-white/50 transition-colors"><Plus size={10} /></button>
                        </div>
                      </td>
                      <td className="py-2">
                        <input
                          type="number"
                          value={item.price === 0 && !item.isPriceSet ? "" : item.price}
                          onChange={(e) => updatePrice(item.productId, e.target.value)}
                          placeholder="0 F"
                          className={`w-full bg-black/40 border ${!item.isPriceSet ? 'border-orange-500/50 animate-pulse' : 'border-white/10'} rounded-lg px-3 py-2 text-[11px] font-bold text-white outline-none focus:border-ice-400 focus:bg-black/60 transition-all`}
                          autoFocus={!item.isPriceSet}
                        />
                      </td>
                      <td className="py-2 pr-2 text-right">
                        <div className="text-[10px] font-black text-ice-400">{(item.price * item.quantity).toLocaleString()} F</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>


        </div>
      </div>

      {/* MOBILE FLOATING FOOTER (Only in Catalog Tab) */}
      <div className={`fixed bottom-0 left-0 w-full p-4 bg-black/90 backdrop-blur-xl border-t border-white/10 lg:hidden flex justify-between items-center z-50 ${activeTab === 'cart' ? 'hidden' : ''}`}>
        <div className="flex flex-col">
          <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest">Votre Panier</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-white">{items.length} <span className="text-[10px] mobile-text">ARTICLES</span></span>
            <span className="text-[10px] text-ice-400 font-bold">~ {total.toLocaleString()} F</span>
          </div>
        </div>
        <button
          onClick={() => setActiveTab('cart')}
          disabled={items.length === 0}
          className={`px-6 py-3 rounded-xl font-black uppercase text-[10px] flex items-center gap-2 shadow-lg ${items.length === 0 ? 'bg-white/10 text-white/20' : 'bg-ice-400 text-ice-900 shadow-ice-400/20 animate-pulse'}`}
        >
          <span>Voir Panier</span>
          <ShoppingCart size={14} />
        </button>
      </div>
      {/* SCANNER OVERLAY */}
      {showScanner && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md bg-white/10 rounded-3xl p-6 border border-white/20 relative overflow-hidden">
            <button
              onClick={stopScanning}
              className="absolute top-4 right-4 text-white/50 hover:text-white bg-black/50 rounded-full p-2"
            >
              <X size={24} />
            </button>
            <h3 className="text-center font-black uppercase text-xl mb-6 text-ice-400">Scanner un produit</h3>
            <div id="reader" className="w-full rounded-2xl overflow-hidden border-2 border-ice-400/30 shadow-[0_0_30px_rgba(0,242,255,0.2)]"></div>
            <p className="text-center text-white/40 text-xs font-bold uppercase mt-6 tracking-widest">
              Placez le code-barre devant la caméra
            </p>
          </div>
        </div>
      )}

    </motion.div>
  );
}