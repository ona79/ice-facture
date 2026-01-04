import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  PlusCircle, 
  History as HistoryIcon, 
  LogOut,
  ChevronRight,
  FileText,
  Settings as SettingsIcon,
  Trash2,
  X,
  Lock
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import SalesChart from '../components/SalesChart';
import { IceInput } from '../components/IceInput';
import toast from 'react-hot-toast';

// --- CONFIGURATION DE L'URL API ---
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Dashboard() {
  const [allInvoices, setAllInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ totalSales: 0, count: 0 });
  const [recentInvoices, setRecentInvoices] = useState([]);
  
  const [modal, setModal] = useState({ show: false, invoiceId: null, invoiceNum: '' });
  const [password, setPassword] = useState('');

  const shopName = localStorage.getItem('shopName') || "Ma Boutique";
  const navigate = useNavigate();
  const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

  const formatFCFA = (amount) => {
    return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " F";
  };

  const fetchData = async () => {
    try {
      // Modification de l'URL pour les factures
      const resInv = await axios.get(`${API_URL}/api/invoices`, config);
      const invoices = resInv.data;
      
      const sortedInvoices = [...invoices].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      setAllInvoices(invoices);
      const total = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      setStats({ totalSales: total, count: invoices.length });
      
      setRecentInvoices(sortedInvoices.slice(0, 3));

      // Modification de l'URL pour les produits
      const resProd = await axios.get(`${API_URL}/api/products`, config);
      setProducts(resProd.data);
    } catch (err) {
      console.error("Erreur fetchData:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const hasBeenWelcomed = sessionStorage.getItem('welcomeShown');
    if (!hasBeenWelcomed) {
      const welcomeTimeout = setTimeout(() => {
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-ice-900/95 backdrop-blur-md border border-ice-400/20 shadow-2xl rounded-3xl pointer-events-auto flex p-4`}>
            <div className="flex-1 w-0 p-2">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="h-10 w-10 rounded-2xl bg-ice-400 flex items-center justify-center text-ice-900 font-black italic">
                     {shopName.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-black text-white uppercase tracking-tighter">Bienvenue, {shopName} !</p>
                  <p className="mt-1 text-[10px] font-bold text-ice-100/50 uppercase tracking-widest leading-relaxed">Prêt pour une nouvelle vente ?</p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-white/5 ml-4">
              <button onClick={() => toast.dismiss(t.id)} className="w-full border border-transparent rounded-none rounded-r-lg px-4 flex items-center justify-center text-[10px] font-black text-ice-400 hover:text-white transition-colors uppercase">Fermer</button>
            </div>
          </div>
        ), { duration: 4000, position: 'top-center' });
        sessionStorage.setItem('welcomeShown', 'true');
      }, 600);
      return () => clearTimeout(welcomeTimeout);
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    toast.success("Déconnexion réussie");
    navigate('/login');
    window.location.reload();
  };

  const openDeleteModal = (id, num) => {
    setPassword('');
    setModal({ show: true, invoiceId: id, invoiceNum: num });
  };

  const handleFinalDelete = async (e) => {
    if(e) e.preventDefault();
    const loadingToast = toast.loading("Suppression en cours...");
    try {
      // Modification de l'URL pour la suppression
      await axios.delete(`${API_URL}/api/invoices/${modal.invoiceId}`, {
        headers: config.headers,
        data: { password: password } 
      });
      
      toast.dismiss(loadingToast);
      toast.success("Vente annulée avec succès");
      setModal({ show: false, invoiceId: null, invoiceNum: '' });
      setPassword('');
      
      await fetchData(); 
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.message || "Mot de passe incorrect");
      setPassword('');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen pb-20 text-white relative">
      
      {/* MODAL SÉCURITÉ */}
      {modal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="glass-card w-full max-w-md p-8 rounded-[2.5rem] border-white/10 shadow-2xl relative">
            <button onClick={() => setModal({show: false})} className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors"><X size={20}/></button>
            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl mb-6"><Lock size={32} /></div>
              <h3 className="text-2xl font-black italic uppercase mb-2">Annuler la vente</h3>
              <p className="text-ice-100/50 text-sm mb-8 leading-relaxed">Entrez le mot de passe pour <br/><span className="text-white font-bold">{modal.invoiceNum}</span></p>
              
              <form onSubmit={handleFinalDelete} className="w-full space-y-4">
                <IceInput 
                  label="Mot de passe Admin" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button type="button" onClick={() => setModal({show: false})} className="py-4 rounded-2xl font-bold text-[10px] uppercase bg-white/5 hover:bg-white/10">Retour</button>
                  <button 
                    type="submit"
                    disabled={!password}
                    className={`py-4 rounded-2xl font-black text-[10px] uppercase transition-all ${password ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/5 text-white/20'}`}
                  >
                    Confirmer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EN-TÊTE */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-ice-50">{shopName.toUpperCase()}</h1>
          <p className="text-ice-100/40 text-xs font-bold uppercase tracking-[0.3em]">Tableau de bord</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/settings')} className="p-3 bg-white/5 border border-white/10 rounded-2xl text-ice-400 hover:bg-ice-400/10 transition-all shadow-lg"><SettingsIcon size={20} /></button>
          <button onClick={handleLogout} className="p-3 bg-white/5 border border-white/10 rounded-2xl text-red-400 hover:bg-red-400/10 transition-all shadow-lg"><LogOut size={20} /></button>
        </div>
      </div>

      {/* STATISTIQUES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6 rounded-3xl border-ice-400/20 shadow-xl">
          <p className="text-ice-100/50 text-[10px] font-black uppercase tracking-widest mb-2">Chiffre d'Affaires</p>
          <h2 className="text-4xl font-black text-ice-400">{formatFCFA(stats.totalSales)}</h2>
        </div>
        <div className="glass-card p-6 rounded-3xl border-white/5 shadow-xl">
          <p className="text-ice-100/50 text-[10px] font-black uppercase tracking-widest mb-2">Ventes effectuées</p>
          <h2 className="text-4xl font-black text-white">{stats.count}</h2>
        </div>
        <Link to="/products" className="glass-card p-6 rounded-3xl border-white/5 hover:border-ice-400 transition-all flex items-center justify-between group shadow-xl">
          <span className="font-black text-lg uppercase tracking-tighter italic">Catalogue</span>
          <div className="p-2 bg-ice-400/10 text-ice-400 rounded-xl group-hover:bg-ice-400 group-hover:text-ice-900 transition-all"><ChevronRight size={24} /></div>
        </Link>
      </div>

      {/* ACTIONS PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <button onClick={() => navigate('/new-invoice')} className="bg-ice-400 p-10 rounded-[2.5rem] flex flex-col items-center gap-4 hover:bg-white transition-all shadow-2xl shadow-ice-400/10 group">
          <div className="bg-ice-900 text-ice-400 p-4 rounded-2xl group-hover:scale-110 transition-transform"><PlusCircle size={36} /></div>
          <span className="text-ice-900 font-black text-2xl uppercase tracking-tighter italic">Nouvelle Vente</span>
        </button>
        <button onClick={() => navigate('/history')} className="glass-card p-10 rounded-[2.5rem] flex flex-col items-center gap-4 border-white/5 hover:border-ice-400 transition-all group">
          <div className="bg-white/10 text-white p-4 rounded-2xl group-hover:scale-110 transition-transform"><HistoryIcon size={36} /></div>
          <span className="font-black text-2xl uppercase tracking-tighter italic">Historique</span>
        </button>
      </div>

      {/* GRAPHIQUE */}
      <div className="glass-card p-6 rounded-[2.5rem] border-white/5 mb-12 shadow-2xl">
        <div className="mb-6 flex justify-between items-center px-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-ice-100/40 italic">Activité hebdomadaire</h3>
            <div className="h-2 w-2 rounded-full bg-ice-400 animate-pulse"></div>
        </div>
        <SalesChart invoices={allInvoices} />
      </div>

      {/* VENTES RÉCENTES */}
      <div className="space-y-4">
        <h3 className="text-sm font-black italic uppercase text-ice-100/30 ml-2 tracking-widest">Dernières Opérations</h3>
        {recentInvoices.length > 0 ? (
          recentInvoices.map(inv => {
            const dateCode = new Date(inv.createdAt).toISOString().slice(0, 10).replace(/-/g, '');
            const serial = inv.invoiceNumber.split('-')[1] || "0";
            const displayNum = `FACT-${dateCode}-${serial.padStart(5, '0')}`;

            return (
              <div key={inv._id} className="glass-card p-5 rounded-3xl flex justify-between items-center border-white/5 hover:border-white/10 transition-all group shadow-md">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-2xl text-ice-400 group-hover:bg-ice-400 group-hover:text-ice-900 transition-all"><FileText size={20} /></div>
                  <div>
                    <p className="font-black text-sm uppercase tracking-tighter">{displayNum}</p>
                    <p className="text-[10px] font-bold text-ice-100/30 uppercase">
                      {new Date(inv.createdAt).toLocaleDateString('fr-FR')} • {new Date(inv.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <p className="font-black text-xl text-ice-400 tracking-tight">{formatFCFA(inv.totalAmount)}</p>
                  <button onClick={() => openDeleteModal(inv._id, displayNum)} className="p-2 text-white/10 hover:text-red-500 transition-colors">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
              
            );
          })
        ) : (
          <div className="p-10 border border-dashed border-white/5 rounded-3xl text-center text-white/10 font-black uppercase tracking-widest text-xs">
            Aucune vente enregistrée
          </div>
        )}
      </div>
    </div>
  );
}