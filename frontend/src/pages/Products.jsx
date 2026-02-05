import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';
import { ArrowLeft, Plus, Trash2, Package, Lock, Unlock, AlertCircle, X, Scan } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ProductSkeleton, Skeleton } from '../components/Skeleton';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', stock: '', barcode: '' });
  const [isUnlocked, setIsUnlocked] = useState(false);

  const [accessPassword, setAccessPassword] = useState('');
  const [modalDelete, setModalDelete] = useState({ show: false, id: null, name: '' });
  const [deletePassword, setDeletePassword] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);

  const navigate = useNavigate();
  const nameRef = useRef(null);
  const stockRef = useRef(null);
  const [showScanner, setShowScanner] = useState(false);
  const scannerRef = useRef(null);
  const [loading, setLoading] = useState(true);

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

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/products`, getAuthHeader());
      setProducts(res.data);
    } catch (err) {
      console.error("Erreur fetch products:", err);
      toast.error("Erreur de chargement des produits");
    } finally {
      setLoading(false);
    }
  };

  const isNameInvalid = newProduct.name !== "" && /^\d+$/.test(newProduct.name);
  const isStockInvalid = newProduct.stock !== "" && (isNaN(newProduct.stock) || Number(newProduct.stock) < 0);
  const isFormValid = newProduct.name && newProduct.stock && parseInt(newProduct.stock) > 0 && !isNameInvalid && !isStockInvalid;

  useEffect(() => {
    if (isUnlocked) fetchProducts();
  }, [isUnlocked]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (!accessPassword) return toast.error("Entrez un mot de passe");

    const loadingToast = toast.loading("Vérification...");
    try {
      await axios.post(
        `${API_URL}/api/auth/verify-password`,
        { password: accessPassword.trim() },
        getAuthHeader()
      );

      setIsUnlocked(true);
      toast.dismiss(loadingToast);
      toast.success("Catalogue déverrouillé");
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.msg || "Mot de passe incorrect");
      setAccessPassword('');
    }
  };

  const addProduct = async (e) => {
    if (e) e.preventDefault();

    if (!newProduct.name.trim()) return toast.error("Le nom est obligatoire !");
    if (newProduct.stock === "" || newProduct.stock === null) return toast.error("La quantité est obligatoire !");
    if (isNaN(newProduct.stock)) return toast.error("Quantité invalide !");
    if (Number(newProduct.stock) < 0) return toast.error("La quantité ne peut pas être négative !");

    const loadingToast = toast.loading("Ajout en cours...");
    const productToSend = { ...newProduct, barcode: newProduct.barcode.trim() };

    try {
      await axios.post(`${API_URL}/api/products`, productToSend, getAuthHeader());
      toast.dismiss(loadingToast);
      toast.success("Produit ajouté !");
      setNewProduct({ name: '', stock: '', barcode: '' });
      fetchProducts();
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.error || "Erreur lors de l'ajout");
    }
  };

  const confirmDeleteProduct = (id, name) => {
    setModalDelete({ show: true, id, name });
    setDeletePassword('');
  };

  const handleFinalDelete = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading("Suppression...");
    try {
      await axios.delete(`${API_URL}/api/products/${modalDelete.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        data: { password: deletePassword }
      });
      toast.dismiss(loadingToast);
      toast.success("Produit supprimé");
      setModalDelete({ show: false, id: null, name: '' });
      fetchProducts();
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.msg || "Mot de passe incorrect");
    }
  };

  if (!isUnlocked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4 font-sans relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-ice-100/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="glass-card w-full max-w-sm p-8 rounded-[3rem] border-slate-100 text-center shadow-2xl bg-white backdrop-blur-2xl relative z-10 border">
          <div className="p-4 bg-ice-50 text-ice-600 rounded-2xl w-fit mx-auto mb-6 shadow-inner border border-ice-100">
            <Lock size={36} className="drop-shadow-[0_0_12px_rgba(2,132,199,0.2)]" />
          </div>
          <h2 className="text-2xl font-black uppercase italic mb-1 text-slate-900 tracking-tighter leading-none">Catalogue</h2>
          <p className="text-[8px] text-ice-600/60 font-black uppercase tracking-[0.2em] mb-8 italic">Accès hautement sécurisé</p>

          <form onSubmit={handleUnlock} className="space-y-3">
            <div className="relative group">
              <input
                autoFocus
                type="password"
                placeholder="PASSWORD..."
                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-6 text-slate-900 outline-none focus:border-ice-400/50 text-center transition-all placeholder:text-slate-200 font-black tracking-[0.4em] group-hover:border-slate-200 text-xs shadow-inner"
                value={accessPassword}
                onChange={(e) => setAccessPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] shadow-lg shadow-slate-900/10 active:scale-95 transition-all hover:bg-ice-600 duration-500">
              Déverrouiller
            </button>
            <button type="button" onClick={() => navigate('/dashboard')} className="text-[8px] font-black text-slate-300 uppercase hover:text-slate-900 tracking-[0.15em] transition-colors block mx-auto mt-4 italic">Retour Dashboard</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pt-28 md:pt-32 pb-12 px-4 md:px-8 min-h-screen text-slate-900 font-sans">
      <div className="flex justify-end items-center mb-8">
        <div className="flex items-center gap-2 text-green-600 font-black text-[10px] uppercase italic">
          <Unlock size={12} /> Accès Autorisé
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pt-4">
        <div className="text-left">
          <h1 className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase leading-none text-slate-900">
            Stock <span className="text-pink-600">/ Produits</span>
          </h1>
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mt-1 italic">Gestion et inventaire des articles</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/dashboard')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white hover:bg-pink-600 hover:text-white px-6 py-4 rounded-2xl border border-slate-100 transition-all text-xs font-black uppercase tracking-widest shadow-sm shadow-blue-900/5"
          >
            <ArrowLeft size={16} /> Retour
          </motion.button>
        </div>
      </div>

      {modalDelete.show && (
        <div onClick={() => setModalDelete({ show: false })} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-sm p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl relative">
            <button onClick={() => setModalDelete({ show: false })} className="absolute top-6 right-6 text-slate-300"><X size={20} /></button>
            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl mb-6"><Trash2 size={32} /></div>
              <h3 className="text-xl font-black italic uppercase mb-2 text-slate-900">Supprimer ?</h3>
              <p className="text-slate-400 text-xs mb-6 uppercase">{modalDelete.name}</p>

              <form onSubmit={handleFinalDelete} className="w-full space-y-4">
                <div className="relative">
                  <input
                    autoFocus
                    type="password"
                    placeholder="Mot de passe..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 text-slate-900 outline-none focus:border-red-500 text-center transition-all placeholder:text-slate-300 font-bold tracking-widest text-sm"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                  />
                </div>
                <button type="submit" className="w-full py-4 rounded-2xl font-black text-[10px] uppercase bg-red-600 text-white shadow-lg shadow-red-900/10 active:scale-95 transition-all">
                  Confirmer la suppression
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {localStorage.getItem('role') === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="md:col-span-2 bg-white p-4 rounded-[2.5rem] border border-slate-100 shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-2 mb-6 px-2">
              <Plus size={16} className="text-pink-600" />
              <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-pink-600 italic">Ajouter un Article</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <p className="text-[8px] font-black uppercase text-slate-400 ml-2 tracking-widest">Désignation</p>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-slate-50 rounded-lg text-pink-500/50 group-focus-within:text-pink-600 transition-colors">
                    <Package size={14} />
                  </div>
                  <input
                    ref={nameRef}
                    type="text"
                    placeholder="EX: GLACE VANILLE"
                    value={newProduct.name}
                    onChange={(e) => {
                      setNewProduct(prev => ({ ...prev, name: e.target.value.toUpperCase() }));
                      if (e.target.value.length > 1) setShowSuggestions(true);
                    }}
                    className={`w-full bg-slate-50 border ${isNameInvalid ? 'border-red-500/50' : 'border-slate-100'} rounded-2xl py-4 pl-14 pr-4 text-sm font-black uppercase tracking-widest outline-none focus:border-pink-500/50 transition-all placeholder:text-slate-300 text-slate-700 shadow-inner`}
                  />
                  {showSuggestions && newProduct.name.length > 0 && products.some(p => p.name.includes(newProduct.name)) && (
                    <div ref={suggestionsRef} className="absolute z-[150] left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl max-h-48 overflow-y-auto backdrop-blur-xl">
                      {products
                        .filter(p => p.name.includes(newProduct.name))
                        .slice(0, 5)
                        .map((p) => (
                          <div
                            key={p._id}
                            className="p-3 text-[9px] font-black uppercase cursor-pointer hover:bg-pink-600 hover:text-white transition-colors text-slate-600 border-b border-slate-50 last:border-0"
                            onMouseDown={() => {
                              setNewProduct({ ...newProduct, name: p.name });
                              setShowSuggestions(false);
                            }}
                          >
                            {p.name}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[8px] font-black uppercase text-slate-400 ml-2 tracking-widest">Quantité Initiale</p>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-slate-50 rounded-lg text-pink-500/50 group-focus-within:text-pink-600 transition-colors">
                    <Plus size={14} />
                  </div>
                  <input
                    ref={stockRef}
                    type="number"
                    placeholder="QUANTITÉ"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, stock: e.target.value }))}
                    className={`w-full bg-slate-50 border ${isStockInvalid ? 'border-red-500/50' : 'border-slate-100'} rounded-2xl py-4 pl-14 pr-4 text-sm font-black uppercase tracking-widest outline-none focus:border-pink-500/50 transition-all placeholder:text-slate-300 text-slate-700 shadow-inner`}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={addProduct}
                disabled={!isFormValid}
                className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.5rem] font-black uppercase text-xs tracking-widest transition-all duration-500 shadow-lg ${isFormValid ? 'bg-pink-600 text-white hover:bg-slate-900 shadow-pink-900/10' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
              >
                <Plus size={18} /> Enregistrer
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={startScanning}
                className="flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-[1.5rem] px-4 py-3 text-pink-600 transition-all shadow-sm shadow-blue-900/5"
              >
                <Scan size={18} />
                <span className="text-[9px] font-black uppercase tracking-wider">Scanner le code barre</span>
              </motion.button>
            </div>
          </div>

          <div className="bg-white p-3 rounded-3xl border border-pink-100 bg-pink-50/10 flex flex-col justify-center items-center text-center shadow-lg shadow-pink-900/5">
            <div className="w-10 h-10 bg-pink-50 rounded-2xl flex items-center justify-center mb-1.5 text-pink-600">
              <Package size={20} />
            </div>
            <p className="text-[7px] font-black uppercase tracking-widest text-pink-400">Total Articles</p>
            {loading ? <Skeleton width="30px" height="18px" className="mt-1" /> : <p className="text-xl font-black italic text-pink-600">{products.length}</p>}
          </div>
        </div>
      )}

      {/* PRODUCTS GRID */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <div className="w-1.5 h-4 bg-pink-600 rounded-full" />
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 italic">Liste du Stock</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4 pb-10">
          {loading ? (
            <>
              <ProductSkeleton />
              <ProductSkeleton />
              <ProductSkeleton />
              <ProductSkeleton />
              <ProductSkeleton />
              <ProductSkeleton />
              <ProductSkeleton />
              <ProductSkeleton />
            </>
          ) : (
            products.length > 0 ? (
              products.map(p => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -5 }}
                  key={p._id}
                  className="p-3 lg:p-5 rounded-[1.2rem] lg:rounded-[2rem] bg-white border border-blue-50 flex flex-col justify-between items-start group relative overflow-hidden transition-all duration-500 hover:border-pink-500/30 hover:shadow-xl lg:min-h-[120px] shadow-sm shadow-blue-900/5"
                >
                  <div className="flex justify-between w-full mb-2 lg:mb-3">
                    <div className="p-2 lg:p-2.5 bg-slate-50 rounded-xl lg:rounded-2xl text-pink-600 group-hover:bg-pink-600 group-hover:text-white transition-all duration-500">
                      <Package size={14} className="lg:w-[18px] lg:h-[18px]" />
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2 lg:px-2.5 py-1 rounded-full border border-slate-100">
                      <div className={`w-1 h-1 rounded-full ${p.stock <= 5 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                      <span className={`text-[9px] lg:text-[10px] font-black ${p.stock <= 5 ? 'text-red-500' : 'text-slate-400'}`}>{p.stock}</span>
                    </div>
                  </div>

                  <div className="w-full">
                    <p className="font-black text-[10px] lg:text-[11px] uppercase tracking-tight text-slate-700 mb-0.5 lg:mb-1 truncate group-hover:text-pink-600 transition-colors leading-tight">{p.name}</p>
                    {p.barcode && <p className="text-[7.5px] lg:text-[8px] font-bold text-slate-300 uppercase tracking-[0.1em]">{p.barcode}</p>}
                  </div>

                  {localStorage.getItem('role') === 'admin' && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => confirmDeleteProduct(p._id, p.name)}
                      className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 transition-all bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg"
                    >
                      <Trash2 size={12} />
                    </motion.button>
                  )}
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200 text-center">
                <Package size={40} className="mx-auto text-slate-100 mb-4" />
                <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.2em]">Votre stock est vide</p>
              </div>
            )
          )}
        </div>
      </div>

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
            <div id="reader" className="w-full rounded-2xl overflow-hidden border-2 border-ice-600/30 shadow-[0_0_30px_rgba(2,132,199,0.1)]"></div>
            <p className="text-center text-slate-400 text-xs font-bold uppercase mt-6 tracking-widest">
              Placez le code-barre devant la caméra
            </p>
          </div>
        </div>
      )}
    </div>
  );
}