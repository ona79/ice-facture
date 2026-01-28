import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';
import { ArrowLeft, Plus, Trash2, Package, Lock, Unlock, AlertCircle, X, Scan } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// Correction : Remplace bien par ton URL réelle si le .env ne charge pas
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', stock: '', barcode: '' });
  const [isUnlocked, setIsUnlocked] = useState(false);

  const [accessPassword, setAccessPassword] = useState('');
  // State pour la suppression sécurisée
  const [modalDelete, setModalDelete] = useState({ show: false, id: null, name: '' });
  const [deletePassword, setDeletePassword] = useState('');

  const navigate = useNavigate();
  const nameRef = useRef(null);
  const stockRef = useRef(null);
  const [showScanner, setShowScanner] = useState(false);
  const scannerRef = useRef(null);

  // Helper pour le son
  const beep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.value = 1000;
      gainNode.gain.value = 0.1;
      oscillator.start();
      setTimeout(() => oscillator.stop(), 150);
    } catch (e) {
      console.error("Audio error", e);
    }
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
            beep();
            setNewProduct(prev => ({ ...prev, barcode: decodedText.trim() }));
            stopScanning();
            toast.success("Code scanné !", { icon: '✅', style: { border: '1px solid #00f2ff', background: '#000', color: '#00f2ff' } });
          },
          () => { }
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

  // Header de sécurité avec Token
  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  // Validations du formulaire
  // Validations du formulaire
  const isNameInvalid = newProduct.name !== "" && /^\d+$/.test(newProduct.name);
  const isStockInvalid = newProduct.stock !== "" && (isNaN(newProduct.stock) || Number(newProduct.stock) < 0);
  // Prix n'est plus requis
  const isFormValid = newProduct.name && newProduct.stock && !isNameInvalid && !isStockInvalid;

  useEffect(() => {
    if (isUnlocked) fetchProducts();
  }, [isUnlocked]);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/products`, getAuthHeader());
      setProducts(res.data);
    } catch (err) {
      toast.error("Erreur de chargement des produits");
    }
  };

  // --- GESTION DU DÉVERROUILLAGE (CORRIGÉ) ---
  const handleUnlock = async (e) => {
    e.preventDefault();
    if (!accessPassword) return toast.error("Entrez un mot de passe");

    const loading = toast.loading("Vérification...");
    try {
      // On envoie le password nettoyé (.trim())
      const res = await axios.post(
        `${API_URL}/api/auth/verify-password`,
        { password: accessPassword.trim() },
        getAuthHeader()
      );

      // Si le serveur répond 200 ou success:true
      setIsUnlocked(true);
      toast.dismiss(loading);
      toast.success("Catalogue déverrouillé");
    } catch (err) {
      toast.dismiss(loading);
      // On affiche l'erreur 400 ou 401 renvoyée par ton backend
      toast.error(err.response?.data?.msg || "Mot de passe incorrect");
      setAccessPassword('');
    }
  };

  // --- AJOUT DE PRODUIT ---
  const addProduct = async (e) => {
    e.preventDefault();
    const loading = toast.loading("Ajout en cours...");

    // Nettoyage des données (trim code-barres)
    const productToSend = { ...newProduct, barcode: newProduct.barcode.trim() };

    try {
      await axios.post(`${API_URL}/api/products`, productToSend, getAuthHeader());
      toast.dismiss(loading);
      toast.success("Produit ajouté !");
      setNewProduct({ name: '', stock: '', barcode: '' });
      fetchProducts();
    } catch (err) {
      toast.dismiss(loading);
      toast.error(err.response?.data?.error || "Erreur lors de l'ajout");
    }
  };

  const confirmDeleteProduct = (id, name) => {
    setModalDelete({ show: true, id, name });
    setDeletePassword('');
  };

  const handleFinalDelete = async (e) => {
    e.preventDefault();
    const loading = toast.loading("Suppression...");
    try {
      await axios.delete(`${API_URL}/api/products/${modalDelete.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        data: { password: deletePassword }
      });
      toast.dismiss(loading);
      toast.success("Produit supprimé");
      setModalDelete({ show: false, id: null, name: '' });
      fetchProducts();
    } catch (err) {
      toast.dismiss(loading);
      toast.error(err.response?.data?.msg || "Mot de passe incorrect");
    }
  };

  // --- ECRAN DE VERROUILLAGE ---
  if (!isUnlocked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black p-4 font-sans">
        <div className="glass-card w-full max-w-sm p-10 rounded-[2.5rem] border-white/10 text-center shadow-2xl bg-white/5 backdrop-blur-md">
          <div className="p-4 bg-ice-400/10 text-ice-400 rounded-2xl w-fit mx-auto mb-6 shadow-inner"><Lock size={40} /></div>
          <h2 className="text-xl font-black uppercase italic mb-2 text-white tracking-tighter">Catalogue Protégé</h2>
          <p className="text-[10px] text-white/40 uppercase tracking-widest mb-8 leading-relaxed">Saisir votre mot de passe</p>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="relative">
              <input
                autoFocus
                type="password"
                placeholder="Mot de passe..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-ice-400 text-center transition-all placeholder:text-white/20 font-bold tracking-widest"
                style={{ colorScheme: 'dark' }}
                value={accessPassword}
                onChange={(e) => setAccessPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <button type="submit" className="w-full py-4 bg-ice-400 text-ice-900 rounded-2xl font-black uppercase text-xs shadow-lg shadow-ice-400/20 active:scale-95 transition-all">
              Déverrouiller
            </button>
            <button type="button" onClick={() => navigate('/dashboard')} className="text-[10px] font-bold text-white/20 uppercase hover:text-white transition-colors block mx-auto mt-4">Retour</button>
          </form>
        </div>
      </div>
    );
  }

  // --- INVENTAIRE ---
  return (
    <div className="p-4 max-w-5xl mx-auto min-h-screen text-white font-sans">
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-ice-100/50 font-bold uppercase text-[10px] tracking-widest">
          <ArrowLeft size={14} /> Retour Dashboard
        </button>
        <div className="flex items-center gap-2 text-green-500 font-black text-[10px] uppercase italic">
          <Unlock size={12} /> Accès Autorisé
        </div>
      </div>

      <h1 className="text-2xl font-black italic mb-8 uppercase tracking-widest text-white">Inventaire</h1>

      {/* MODAL SUPPRESSION SÉCURISÉE */}
      {modalDelete.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="glass-card w-full max-w-sm p-8 rounded-[2.5rem] border-white/10 shadow-2xl relative">
            <button onClick={() => setModalDelete({ show: false })} className="absolute top-6 right-6 text-white/20"><X size={20} /></button>
            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl mb-6"><Trash2 size={32} /></div>
              <h3 className="text-xl font-black italic uppercase mb-2">Supprimer ?</h3>
              <p className="text-ice-100/50 text-xs mb-6 uppercase">{modalDelete.name}</p>

              <form onSubmit={handleFinalDelete} className="w-full space-y-4">
                <div className="relative">
                  <input
                    autoFocus
                    type="password"
                    placeholder="Mot de passe..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white outline-none focus:border-red-500 text-center transition-all placeholder:text-white/20 font-bold tracking-widest"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                  />
                </div>
                <button type="submit" className="w-full py-4 rounded-2xl font-black text-[10px] uppercase bg-red-500 shadow-lg shadow-red-500/20 active:scale-95 transition-all">
                  Confirmer la suppression
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {localStorage.getItem('role') === 'admin' && (
        <div className="glass-card p-6 rounded-[2rem] border-white/5 mb-8 shadow-xl bg-white/5">
          <form onSubmit={addProduct} className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1.5fr_auto] gap-4 items-end">
            <div className="relative">
              <label className="text-[10px] uppercase font-black text-white/20 ml-2 italic">Désignation</label>
              <input
                list="product-suggestions"
                required
                type="text"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                className={`w-full bg-white/5 border ${isNameInvalid ? 'border-red-500' : 'border-white/10'} rounded-2xl py-3 px-4 outline-none focus:border-ice-400 text-white uppercase placeholder:normal-case`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    stockRef.current?.focus();
                  }
                }}
                ref={nameRef}
                placeholder="Nom du produit..."
              />
              <datalist id="product-suggestions">
                {products.map((p) => (
                  <option key={p._id} value={p.name} />
                ))}
              </datalist>
            </div>

            <div className="relative">
              <label className="text-[10px] uppercase font-black text-white/20 ml-2 italic">Quantité</label>
              <input
                required
                type="text"
                value={newProduct.stock}
                onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                className={`w-full bg-white/5 border ${isStockInvalid ? 'border-red-500' : 'border-white/10'} rounded-2xl py-3 px-4 outline-none focus:border-ice-400 text-white`}
                placeholder="0"
                ref={stockRef}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addProduct(e);
                  }
                }}
              />
            </div>

            {/* CODE BARRES */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-white/30 ml-2 italic">Code-barres (Optionnel)</label>
              <div className="relative">
                <input
                  type="text" placeholder="Scanner ou saisir..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 focus:border-ice-400 outline-none transition-all text-sm font-bold"
                  value={newProduct.barcode}
                  onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                />
                <button
                  type="button"
                  onClick={startScanning}
                  className="absolute left-1 top-1/2 -translate-y-1/2 p-2 text-white/20 hover:text-ice-400 transition-colors"
                >
                  <Scan size={18} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={!isFormValid}
              className={`px-8 py-3.5 rounded-2xl font-black uppercase text-[11px] shadow-lg transition-all active:scale-95 whitespace-nowrap ${isFormValid ? 'bg-ice-400 text-ice-900 shadow-ice-400/20' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
            >
              Enregistrer
            </button>
          </form>
        </div>
      )}

      <div className="space-y-2 pb-10">
        {products.length === 0 ? (
          <p className="text-center text-white/20 py-10 uppercase text-xs font-bold italic tracking-widest italic">Aucun produit en stock</p>
        ) : (
          products.map((p) => (
            <div key={p._id} className="glass-card p-4 rounded-2xl flex justify-between items-center border-white/5 hover:bg-white/5 transition-all bg-white/5">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-ice-400/10 text-ice-400 rounded-lg"><Package size={18} /></div>
                <div>
                  <p className="font-bold text-sm uppercase">{p.name}</p>
                  <p className="text-[10px] text-ice-400 opacity-50">Produit variable</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-[8px] uppercase text-white/20 italic">Quantité</p>
                  <div className="flex items-center gap-6">
                    <p className="font-black text-sm text-ice-400">{p.stock} Unités</p>
                    {localStorage.getItem('role') === 'admin' && (
                      <button
                        onClick={() => confirmDeleteProduct(p._id, p.name)}
                        className="p-2 text-white/10 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
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
    </div>
  );
}