import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  ArrowLeft, Plus, Minus, CheckCircle, ShoppingCart,
  Search, AlertCircle, Banknote, User, Trash2, Settings as SettingsIcon, Scan, X, Printer
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PhoneInput } from '../components/PhoneInput';

// Correction de l'URL pour Render
// Correction de l'URL pour Render / Local
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ... imports
import { useOfflineSync } from '../hooks/useOfflineSync';
import confetti from 'canvas-confetti';
import { playSuccessSound, playClickSound } from '../utils/audio';
import { useReactToPrint } from 'react-to-print';
import Receipt from '../components/Receipt';

export default function NewInvoice() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [amountPaid, setAmountPaid] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customers, setCustomers] = useState([]); // All unique customers from backend
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [isProfileComplete, setIsProfileComplete] = useState(true);
  const [shopName, setShopName] = useState(localStorage.getItem('shopName') || "MA BOUTIQUE");
  const [shopPhone, setShopPhone] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [footerMessage, setFooterMessage] = useState("");
  const customerSuggestionsRef = useRef(null);

  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' or 'cart'

  const nameRef = useRef(null);
  const phoneRef = useRef(null);
  const amountRef = useRef(null);
  const [showScanner, setShowScanner] = useState(false);
  const scannerRef = useRef(null);
  const submitRef = useRef(null);

  // Printing Logic
  const receiptRef = useRef();
  const [lastInvoice, setLastInvoice] = useState(null); // To store data for printing
  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
  });

  const navigate = useNavigate();
  const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

  // Hook Offline
  const { isOnline, addToOfflineQueue } = useOfflineSync();

  useEffect(() => {
    // Vérification du profil
    axios.get(`${API_URL}/api/auth/profile`, config)
      .then(res => {
        if (res.data.shopName) setShopName(res.data.shopName);
        if (res.data.phone) setShopPhone(res.data.phone);
        if (res.data.address) setShopAddress(res.data.address);
        if (res.data.footerMessage) setFooterMessage(res.data.footerMessage);

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

    // Chargement des clients pour suggestions
    axios.get(`${API_URL}/api/invoices/customers`, config)
      .then(res => setCustomers(res.data))
      .catch(err => console.error("Erreur clients:", err));

    const handleClickOutside = (event) => {
      if (customerSuggestionsRef.current && !customerSuggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
    if (!product || product.stock <= 0) {
      toast.error(`STOCK ÉPUISÉ : ${product?.name || 'Produit'}`);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]); // Vibration d'erreur
      return;
    }

    const existing = items.find(i => i.productId === productId);
    if (existing) {
      if (existing.quantity >= product.stock) return toast.error("Stock limite");
      updateQuantity(productId, existing.quantity + 1);
    } else {
      setItems([...items, { productId: product._id, name: product.name, price: 0, quantity: 1, isPriceSet: false }]);
    }

    // Feedback
    playClickSound();
    if (navigator.vibrate) navigator.vibrate(50);
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
            // FAST SCAN MODE enabled: We don't stop scanning anymore
            handleBarcodeFound(decodedText);
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

  // Helper pour le son
  const beep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.value = 1000; // 1000Hz beep
      gainNode.gain.value = 0.1;
      oscillator.start();
      setTimeout(() => oscillator.stop(), 150);
    } catch (e) {
      console.error("Audio error", e);
    }
  };

  // State for camera flash effect
  const [scanFlash, setScanFlash] = useState(false);

  const handleBarcodeFound = (code) => {
    // Debounce: ignore scan if flash is active to prevent double adds too fast
    if (scanFlash) return;

    beep(); // Son de confirmation

    // Visual Flash Effect
    setScanFlash(true);
    setTimeout(() => setScanFlash(false), 500);

    // Nettoyage du code scanné (espaces invisibles)
    const cleanCode = code ? code.toString().trim() : "";
    console.log("Scanned:", cleanCode);

    // Fonction de recherche intelligente (essaie plusieurs variantes)
    const findProduct = (searchCode) => {
      return products.find(p => {
        const pCode = p.barcode ? p.barcode.toString().trim() : "";
        if (pCode === searchCode) return true;

        // Essai avec un "0" au début (UPC -> EAN)
        if (pCode === "0" + searchCode) return true;

        // Essai sans le "0" du début (EAN -> UPC)
        if (searchCode.startsWith("0") && pCode === searchCode.substring(1)) return true;

        return false;
      });
    };

    const found = findProduct(cleanCode);

    if (found) {
      if (found.stock <= 0) {
        toast.error(`RUPTURE: ${found.name}`, { duration: 3000 });
        return;
      }
      addItem(found._id);
      toast.success(`${found.name} AJOUTÉ !`, {
        style: { border: '2px solid #00f2ff', background: 'rgba(0,0,0,0.9)', color: '#00f2ff', fontWeight: '900' },
        icon: '✅'
      });
    } else {
      console.log("Not found in:", products.map(p => p.barcode));
      toast.error(`Code Inconnu: ${cleanCode}`, {
        duration: 5000,
        style: { border: '2px solid #ff4b4b', background: 'rgba(0,0,0,0.9)', color: '#ff4b4b', fontWeight: 'bold' }
      });
    }
  };

  // --- VALIDATION DE LA VENTE ---
  const handleCheckout = async () => {
    if (!isProfileComplete) return toast.error("Profil incomplet : Remplissez les paramètres");
    if (items.length === 0) return toast.error("Panier vide");
    if (!customerName.trim()) return toast.error("NOM DU CLIENT OBLIGATOIRE");

    // Validation des prix
    const hasInvalidPrice = items.some(i => i.price <= 0);
    if (hasInvalidPrice) {
      toast.error("VEUILLEZ RENSEIGNER TOUS LES PRIX DANS LE PANIER");
      return;
    }

    const finalPaid = amountPaid === "" ? total : parseFloat(amountPaid);

    if (finalPaid > total) {
      return toast.error("L'ENCAISSEMENT NE PEUT PAS DÉPASSER LE TOTAL");
    }

    const invoiceNum = createInvoiceID();
    const invoiceData = {
      invoiceNumber: invoiceNum,
      items,
      totalAmount: total,
      amountPaid: finalPaid,
      customerName: customerName.trim().toUpperCase(),
      customerPhone: customerPhone,
    };

    // PREMIUM EFFECTS
    playSuccessSound();
    if (navigator.vibrate) navigator.vibrate([100]); // Vibration simple court

    // LOGIQUE OFF / ON LINE
    if (!isOnline) {
      setTimeout(() => {
        addToOfflineQueue(invoiceData);
        setLastInvoice(invoiceData); // Store for printing
        setShowSuccessModal(true);   // Show modal instead of nav

        // Reset form data in background
        setItems([]);
        setAmountPaid("");
        setCustomerName("");
        setCustomerPhone("");
        setTotal(0);
      }, 500);
      return;
    }

    const loadingToast = toast.loading("Enregistrement de la vente...");

    try {
      await axios.post(`${API_URL}/api/invoices`, invoiceData, config);

      toast.dismiss(loadingToast);
      toast.success(`Vente enregistrée : ${invoiceNum}`);

      setLastInvoice(invoiceData); // Store for printing
      setShowSuccessModal(true);   // Show modal instead of nav

      // Cleanup for next sale
      setItems([]);
      setAmountPaid("");
      setCustomerName("");
      setCustomerPhone("");
      setTotal(0);

    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error("Erreur serveur. Vérifiez votre connexion.");
    }
  };

  // State for Success Modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto pt-28 md:pt-32 pb-12 px-4 md:px-8 min-h-screen text-slate-900 font-sans overflow-x-hidden relative"
    >
      {/* HIDDEN RECEIPT COMPONENT */}
      <Receipt ref={receiptRef} invoice={lastInvoice} shopName={shopName} shopAddress={shopAddress} shopPhone={shopPhone} footerMessage={footerMessage} />

      {showSuccessModal && (
        <div onClick={() => setShowSuccessModal(false)} className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
          <div onClick={(e) => e.stopPropagation()} className="bg-white border border-slate-100 p-8 rounded-[2.5rem] max-w-md w-full text-center relative shadow-2xl">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-bounce">
              <CheckCircle size={40} className="text-white" />
            </div>

            <h2 className="text-2xl font-black uppercase text-slate-900 mb-2 tracking-tighter">Vente Réussie !</h2>
            <p className="text-ice-600 font-bold text-lg mb-8">{lastInvoice?.invoiceNumber}</p>

            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={handlePrint}
                className="py-4 rounded-xl bg-slate-900 text-white font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-xl"
              >
                <div className="bg-white text-black p-1 rounded"><Printer size={16} /></div>
                Imprimer Ticket
              </button>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => { setShowSuccessModal(false); /* Stay for next sale */ }}
                  className="py-4 rounded-xl bg-ice-50 text-ice-600 border border-ice-100 font-bold uppercase text-xs hover:bg-ice-100"
                >
                  <Plus size={16} className="inline mr-1" /> Nouvelle Vente
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="py-4 rounded-xl bg-slate-50 text-slate-400 border border-slate-100 font-bold uppercase text-xs hover:bg-slate-100"
                >
                  Quitter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-24 lg:pb-0">
        {/* CATALOGUE */}
        <div className={`lg:col-span-7 space-y-4 ${activeTab === 'cart' ? 'hidden lg:block' : ''}`}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                type="text" placeholder="RECHERCHER UN PRODUIT..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-ice-400 text-xs font-black uppercase tracking-widest transition-all placeholder:text-slate-300 shadow-sm"
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
              className="bg-ice-600 text-white p-3 rounded-2xl active:scale-90 transition-all shadow-lg shadow-blue-900/10"
            >
              <Scan size={20} />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 lg:gap-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
              <button
                key={p._id}
                onClick={() => addItem(p._id)}
                onMouseDown={(e) => e.preventDefault()}
                className={`p-3 lg:p-5 rounded-[1.2rem] lg:rounded-[2rem] bg-white border border-blue-50 flex flex-col justify-between items-start hover:border-ice-400/40 hover:bg-slate-50 transition-all duration-500 overflow-hidden relative group lg:min-h-[120px] shadow-sm ${p.stock <= 0 ? 'opacity-20 grayscale cursor-not-allowed' : 'active:scale-95 hover:shadow-xl'}`}
                disabled={p.stock <= 0}
              >
                <div className="flex justify-between w-full mb-2 lg:mb-3">
                  <div className={`p-2 lg:p-3 rounded-xl transition-all duration-500 group-hover:scale-110 ${p.stock <= 5 ? 'bg-red-50 text-red-600' : 'bg-ice-50 text-ice-600'}`}>
                    <ShoppingCart size={16} className="lg:w-[18px] lg:h-[18px]" />
                  </div>
                  <span className={`text-[7px] lg:text-[8px] font-black uppercase px-1.5 py-0.5 lg:px-2 lg:py-1 rounded-md tracking-tighter ${p.stock <= 5 ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                    {p.stock} EN STOCK
                  </span>
                </div>
                <p className="font-black text-[11px] lg:text-[13px] uppercase italic tracking-tighter text-left leading-none group-hover:text-ice-600 transition-colors uppercase text-slate-700">{p.name}</p>
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity text-slate-900">
                  <Plus size={40} className="text-slate-900 lg:w-[48px] lg:h-[48px]" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* PANIER */}
        <div className={`lg:col-span-5 flex flex-col h-[75vh] glass-card rounded-[2.5rem] border border-blue-50 overflow-hidden shadow-2xl bg-white/90 backdrop-blur-md ${activeTab === 'catalog' ? 'hidden lg:flex' : 'flex'}`}>
          {/* Mobile Back Button */}
          <button
            onClick={() => setActiveTab('catalog')}
            className="lg:hidden p-4 flex items-center gap-2 text-ice-600 font-black uppercase text-[10px] border-b border-slate-100 bg-slate-50"
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

          <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
            <h2 className="font-black text-ice-600 text-[10px] uppercase tracking-[0.2em] flex items-center gap-1.5 italic">
              <ShoppingCart size={14} className="drop-shadow-[0_0_10px_rgba(2,132,199,0.3)]" /> Panier
            </h2>
            <span className="bg-slate-100 px-1.5 py-0.5 rounded-full text-[7px] font-black text-slate-400 uppercase tracking-widest">{items.length} ART.</span>
          </div>


          {/* CONTROL SECTION (Ultra-Compact) */}
          <div className="p-2 lg:p-3 bg-white border-b border-slate-100 space-y-1.5">
            {/* INFOS CLIENT */}
            <div className="grid grid-cols-[1fr_1.5fr] gap-1.5 px-0.5">
              <div className="relative">
                <input
                  type="text"
                  placeholder="NOM CLIENT..."
                  value={customerName}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setCustomerName(val.replace(/[^a-zA-Z\sÀ-ÿ]/g, ''));
                    if (val.trim().length > 0) {
                      const filtered = customers.filter(c => c.name && c.name.toString().toUpperCase().includes(val.toUpperCase()));
                      setFilteredCustomers(filtered);
                      setShowSuggestions(filtered.length > 0);
                      setActiveSuggestionIndex(-1);
                    } else { setShowSuggestions(false); }
                  }}
                  className="w-full bg-slate-50 border border-slate-100 rounded-lg p-1.5 lg:p-2 text-[9px] lg:text-[10px] font-black uppercase outline-none focus:border-ice-400/50 placeholder:text-slate-300 text-slate-700"
                  ref={nameRef}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      if (activeSuggestionIndex < filteredCustomers.length - 1) setActiveSuggestionIndex(activeSuggestionIndex + 1);
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      if (activeSuggestionIndex > 0) setActiveSuggestionIndex(activeSuggestionIndex - 1);
                    } else if (e.key === 'Enter') {
                      if (showSuggestions && activeSuggestionIndex !== -1) {
                        e.preventDefault();
                        const selected = filteredCustomers[activeSuggestionIndex];
                        setCustomerName(selected.name);
                        setCustomerPhone(selected.phone || "");
                        setShowSuggestions(false);
                        phoneRef.current?.focus();
                      } else if (customerName.trim()) {
                        e.preventDefault();
                        setShowSuggestions(false);
                        phoneRef.current?.focus();
                      }
                    } else if (e.key === 'Escape') { setShowSuggestions(false); }
                  }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                {showSuggestions && filteredCustomers.length > 0 && (
                  <div ref={customerSuggestionsRef} className="absolute z-[400] top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xl max-h-40 overflow-y-auto">
                    {filteredCustomers.map((c, index) => (
                      <div
                        key={index}
                        className={`p-2 text-[9px] font-black uppercase cursor-pointer transition-colors ${index === activeSuggestionIndex ? 'bg-ice-600 text-white' : 'hover:bg-slate-50 text-slate-700'}`}
                        onMouseDown={(e) => {
                          e.preventDefault(); setCustomerName(c.name); setCustomerPhone(c.phone || ""); setShowSuggestions(false); phoneRef.current?.focus();
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <span>{c.name}</span>
                          <span className="text-[7.5px] opacity-40">{c.phone}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <PhoneInput
                compact
                hideLabel
                placeholder="WHATSAPP..."
                value={customerPhone}
                onChange={(val) => setCustomerPhone(val)}
                ref={phoneRef}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); amountRef.current?.focus(); }
                }}
              />
            </div>

            {/* PAIEMENT & VALIDATION (Ultra-Compact) */}
            <div className="flex items-center gap-1.5 lg:gap-3 bg-slate-50 p-1.5 lg:p-2.5 rounded-xl lg:rounded-2xl border border-slate-100 shadow-inner">
              <div className="flex-1 flex items-center gap-1.5 lg:gap-3 px-1">
                <div className="flex flex-col">
                  <span className="kpi-tertiary text-[6.5px] lg:text-[8px] leading-none">A Payer</span>
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-2xl lg:text-3xl font-black text-ice-600 tracking-tighter leading-none whitespace-nowrap">
                      {Math.round(total).toLocaleString()} <span className="text-[9px] lg:text-[11px] not-italic opacity-40">F</span>
                    </p>
                  </div>
                </div>
                <div className="w-px h-5 lg:h-8 bg-slate-200 mx-0.5" />
                <div className="flex-1 group">
                  <input
                    type="text"
                    placeholder="ENCAISSÉ..."
                    value={amountPaid}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, '');
                      if (val === "") { setAmountPaid(""); return; }
                      if (parseInt(val, 10) > total) {
                        setAmountPaid(total.toString());
                        toast.error(`MAX: ${total} F`);
                      } else { setAmountPaid(val); }
                    }}
                    className="w-full bg-transparent border-none p-0 text-[13px] lg:text-[16px] font-black outline-none focus:ring-0 text-orange-600 placeholder:text-slate-300 tracking-wider"
                    ref={amountRef}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); handleCheckout(); }
                    }}
                  />
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={items.length === 0 || !isProfileComplete}
                className={`h-10 lg:h-12 px-4 lg:px-6 rounded-lg lg:rounded-xl font-black uppercase text-[9px] lg:text-[11px] flex items-center justify-center gap-1.5 shadow-lg transition-all duration-500 ${(!isProfileComplete || items.length === 0) ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-slate-900 text-white active:scale-95 hover:bg-ice-600 shadow-xl'}`}
              >
                <CheckCircle size={14} className="lg:w-[16px] lg:h-[16px]" /> {isProfileComplete ? "Confirmer" : "Erreur"}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-200 italic">
                <ShoppingCart size={40} className="mb-3 opacity-30" />
                <p className="text-xs uppercase font-bold tracking-widest text-slate-300">Votre panier est vide</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[8px] uppercase font-black text-slate-400 border-b border-slate-100">
                    <th className="py-1.5 pl-1">Produit</th>
                    <th className="py-1.5 text-center">Qté</th>
                    <th className="py-1.5 w-28">Prix</th>
                    <th className="py-1.5 text-right pr-1">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {items.map(item => (
                    <tr key={item.productId} className="group hover:bg-slate-50 transition-all duration-300">
                      <td className="py-1 lg:py-4 pl-1 lg:pl-4 max-w-[100px] lg:max-w-none">
                        <div className="font-black text-[10px] lg:text-[13px] uppercase italic tracking-tighter leading-none text-slate-700 truncate">{item.name}</div>
                      </td>
                      <td className="py-1 lg:py-4 text-center">
                        <div className="flex items-center justify-center bg-slate-100 rounded-lg lg:rounded-xl p-0.5 lg:p-1.5 w-fit mx-auto border border-slate-200 overflow-hidden group-hover:border-ice-400/30 transition-all">
                          <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="p-0.5 lg:p-1 hover:text-slate-900 text-slate-300 transition-colors"><Minus size={10} className="lg:w-3.5 lg:h-3.5" /></button>
                          <span className="text-[10px] lg:text-[13px] font-black w-6 lg:w-10 text-center text-ice-600">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="p-0.5 lg:p-1 hover:text-slate-900 text-slate-300 transition-colors"><Plus size={10} className="lg:w-3.5 lg:h-3.5" /></button>
                        </div>
                      </td>
                      <td className="py-1 lg:py-4">
                        <div className="relative group/price">
                          <input
                            type="number"
                            value={item.price === 0 && !item.isPriceSet ? "" : item.price}
                            onChange={(e) => updatePrice(item.productId, e.target.value)}
                            placeholder="PRIX UNIT."
                            className={`w-full bg-slate-100 border ${item.price <= 0 ? 'border-red-300 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'border-slate-100'} rounded-lg lg:rounded-xl px-2 py-1.5 lg:px-4 lg:py-2.5 text-[11px] lg:text-[13px] font-black italic text-slate-700 outline-none focus:border-ice-400 transition-all text-center placeholder:text-[8px] lg:placeholder:text-[10px] placeholder:font-black group-hover/price:border-slate-300`}
                            autoFocus={!item.isPriceSet}
                          />
                        </div>
                      </td>
                      <td className="py-1 lg:py-4 pr-2 lg:pr-6 text-right">
                        <div className="text-[11px] lg:text-[16px] font-black italic text-ice-600 leading-none">{(item.price * item.quantity).toLocaleString()} <span className="text-[9px] not-italic opacity-30 ml-0.5">F</span></div>
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
      <div className={`fixed bottom-0 left-0 w-full p-4 bg-white/90 backdrop-blur-xl border-t border-slate-100 lg:hidden flex justify-between items-center z-50 ${activeTab === 'cart' ? 'hidden' : ''}`}>
        <div className="flex flex-col">
          <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Votre Panier</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900">{items.length} <span className="text-[10px] mobile-text">ARTICLES</span></span>
            <span className="text-[10px] text-ice-600 font-bold">~ {total.toLocaleString()} F</span>
          </div>
        </div>
        <button
          onClick={() => setActiveTab('cart')}
          disabled={items.length === 0}
          className={`px-8 py-4 rounded-xl font-black uppercase text-xs flex items-center gap-2 shadow-lg ${items.length === 0 ? 'bg-slate-100 text-slate-400' : 'bg-ice-600 text-white shadow-blue-900/10 animate-pulse'}`}
        >
          <span>Voir Panier</span>
          <ShoppingCart size={14} />
        </button>
      </div>
      {/* SCANNER OVERLAY */}
      {showScanner && (
        <div onClick={stopScanning} className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white rounded-3xl p-6 border border-slate-100 relative overflow-hidden shadow-2xl">
            <button
              onClick={stopScanning}
              className="absolute top-4 right-4 text-slate-300 hover:text-slate-900 bg-slate-100 rounded-full p-2"
            >
              <X size={24} />
            </button>
            <h3 className="text-center font-black uppercase text-xl mb-6 text-ice-600">Scanner un produit</h3>
            <div id="reader" className="w-full rounded-2xl overflow-hidden border-2 border-ice-600/30 shadow-[0_0_30px_rgba(2,132,199,0.1)] relative">
              {/* Flash Overlay */}
              <div className={`absolute inset-0 bg-white/30 z-10 transition-opacity duration-200 pointer-events-none ${scanFlash ? 'opacity-100' : 'opacity-0'}`} />
            </div>
            <p className="text-center text-slate-400 text-xs font-bold uppercase mt-6 tracking-widest">
              Mode Rafale Actif ⚡
            </p>
          </div>
        </div>
      )}

    </motion.div>
  );
}