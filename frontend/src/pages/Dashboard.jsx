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
  Lock,
  AlertTriangle,
  Package,
  TrendingUp,
  TrendingUp,
  Target,
  Crown
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import SalesChart from '../components/SalesChart';
import { IceInput } from '../components/IceInput';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Dashboard() {
  const [allInvoices, setAllInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [stats, setStats] = useState({
    totalSales: 0,
    count: 0,
    todaySales: 0,
    topProducts: [],
    topClients: []
  });
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
      const resInv = await axios.get(`${API_URL}/api/invoices`, config);
      const invoices = resInv.data;

      // --- LOGIQUE STATISTIQUES AVANCÉES ---
      const today = new Date().toISOString().split('T')[0];

      // 1. Calcul des ventes du jour
      const todaySales = invoices
        .filter(inv => inv.createdAt.startsWith(today))
        .reduce((sum, inv) => sum + inv.totalAmount, 0);

      // 2. Analyse des Top Produits (Best-sellers)
      const productMap = {};
      invoices.forEach(inv => {
        inv.items.forEach(item => {
          productMap[item.name] = (productMap[item.name] || 0) + item.quantity;
        });
      });
      const topProducts = Object.entries(productMap)
        .sort((a, b) => b[1] - a[1])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3); // Top 3

      // 3. Analyse des Top Clients (VIP)
      const clientMap = {};
      invoices.forEach(inv => {
        const name = inv.customerName || "Passager";
        if (name.toUpperCase() !== "PASSAGER") {
          clientMap[name] = (clientMap[name] || 0) + inv.totalAmount;
        }
      });
      const topClients = Object.entries(clientMap)
        .sort((a, b) => b[1] - a[1]) // Tri par montant dépensé
        .slice(0, 3);

      const sortedInvoices = [...invoices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setAllInvoices(invoices);
      setStats({
        totalSales: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
        count: invoices.length,
        todaySales,
        topProducts,
        topClients
      });
      setRecentInvoices(sortedInvoices.slice(0, 3));

      const resProd = await axios.get(`${API_URL}/api/products`, config);
      setProducts(resProd.data);
      setLowStockProducts(resProd.data.filter(p => p.stock <= 5));

    } catch (err) {
      console.error("Erreur fetchData:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    toast.success("Déconnexion réussie");
    navigate('/login');
    window.location.reload();
  };

  const handleFinalDelete = async (e) => {
    if (e) e.preventDefault();
    const loadingToast = toast.loading("Suppression...");
    try {
      await axios.delete(`${API_URL}/api/invoices/${modal.invoiceId}`, {
        headers: config.headers,
        data: { password }
      });
      toast.dismiss(loadingToast);
      toast.success("Vente annulée");
      setModal({ show: false, invoiceId: null, invoiceNum: '' });
      await fetchData();
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.message || "Erreur");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen pb-20 text-white relative"
    >

      {/* MODAL SÉCURITÉ */}
      {modal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="glass-card w-full max-w-md p-8 rounded-[2.5rem] border-white/10 shadow-2xl relative">
            <button onClick={() => setModal({ show: false })} className="absolute top-6 right-6 text-white/20"><X size={20} /></button>
            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl mb-6"><Lock size={32} /></div>
              <h3 className="text-2xl font-black italic uppercase mb-2">Annuler la vente</h3>
              <p className="text-ice-100/50 text-sm mb-8">{modal.invoiceNum}</p>
              <form onSubmit={handleFinalDelete} className="w-full space-y-4">
                <IceInput label="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="submit" className="w-full py-4 rounded-2xl font-black text-[10px] uppercase bg-red-500 shadow-lg shadow-red-500/20">Confirmer</button>
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
          <button onClick={() => navigate('/settings')} className="p-3 bg-white/5 border border-white/10 rounded-2xl text-ice-400"><SettingsIcon size={20} /></button>
          <button onClick={handleLogout} className="p-3 bg-white/5 border border-white/10 rounded-2xl text-red-400"><LogOut size={20} /></button>
        </div>
      </div>

      {/* STATISTIQUES EN 4 COLONNES (Layout PC) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* BLOC VENTES DU JOUR */}
        <div className="glass-card p-5 rounded-3xl border-ice-400/20 bg-ice-400/5">
          <p className="text-ice-400 text-[9px] font-black uppercase tracking-widest mb-1 flex items-center gap-2">
            <TrendingUp size={12} /> Ventes du jour
          </p>
          <h2 className="text-2xl font-black text-white">{formatFCFA(stats.todaySales)}</h2>
        </div>

        {/* CHIFFRE GLOBAL */}
        <div className="glass-card p-5 rounded-3xl border-white/5">
          <p className="text-ice-100/40 text-[9px] font-black uppercase tracking-widest mb-1">Chiffre Global</p>
          <h2 className="text-2xl font-black text-ice-400">{formatFCFA(stats.totalSales)}</h2>
        </div>

        {/* TOP CLIENTS (NOUVEAU) */}
        <div className="glass-card p-5 rounded-3xl border-yellow-500/20 bg-yellow-500/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-all text-yellow-500"><Crown size={40} /></div>
          <p className="text-yellow-500 text-[9px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
            <Crown size={12} /> Clients VIP
          </p>
          <div className="space-y-1">
            {stats.topClients.map(([name, amount], i) => (
              <div key={i} className="flex justify-between items-center text-[9px] font-bold uppercase border-b border-yellow-500/10 pb-1 last:border-0">
                <span className="text-white/80">{i + 1}. {name.slice(0, 10)}</span>
                <span className="text-yellow-500">{formatFCFA(amount)}</span>
              </div>
            ))}
            {stats.topClients.length === 0 && <span className="text-[9px] text-white/20">Aucune donnée</span>}
          </div>
        </div>

        {/* TOP PRODUITS ET TOTAL OPÉRATIONS */}
        <div className="md:col-span-2 glass-card p-5 rounded-3xl border-white/5 flex items-center justify-between">
          <div>
            <p className="text-ice-100/40 text-[9px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
              <Target size={12} /> Top Produits
            </p>
            <div className="flex gap-2">
              {stats.topProducts.map(([name, qty], i) => (
                <span key={i} className="text-[10px] font-black bg-white/5 px-3 py-1 rounded-full border border-white/10 uppercase">
                  {name} <span className="text-ice-400 ml-1">{qty}</span>
                </span>
              ))}
              {stats.topProducts.length === 0 && <span className="text-[10px] text-white/20 uppercase">Aucune donnée</span>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-ice-100/40 text-[9px] font-black uppercase tracking-widest mb-1">Opérations</p>
            <h2 className="text-2xl font-black text-white">{stats.count}</h2>
          </div>
        </div>
      </div>

      {/* ACTIONS ET ALERTES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <button onClick={() => navigate('/new-invoice')} className="bg-ice-400 p-10 rounded-[2.5rem] flex flex-col items-center gap-4 hover:scale-[1.02] transition-all group">
          <div className="bg-ice-900 text-ice-400 p-4 rounded-2xl"><PlusCircle size={36} /></div>
          <span className="text-ice-900 font-black text-xl uppercase italic">Vendre</span>
        </button>

        <Link to="/products" className="glass-card p-10 rounded-[2.5rem] flex flex-col items-center gap-4 border-white/5 hover:border-ice-400 transition-all group relative">
          <div className="bg-white/10 text-ice-400 p-4 rounded-2xl group-hover:bg-ice-400 group-hover:text-ice-900 transition-all"><Package size={36} /></div>
          <span className="font-black text-xl uppercase italic">Stock</span>
          {lowStockProducts.length > 0 && <span className="absolute top-6 right-6 h-3 w-3 bg-red-500 rounded-full animate-ping"></span>}
        </Link>

        <button onClick={() => navigate('/history')} className="glass-card p-10 rounded-[2.5rem] flex flex-col items-center gap-4 border-white/5 hover:border-white/20 transition-all group">
          <div className="bg-white/10 text-white p-4 rounded-2xl"><HistoryIcon size={36} /></div>
          <span className="font-black text-xl uppercase italic">FACTURES</span>
        </button>
      </div>

      {/* ALERTES STOCK FAIBLE */}
      {lowStockProducts.length > 0 && (
        <div className="mb-8 p-4 bg-red-500/5 border border-red-500/20 rounded-3xl">
          <div className="flex items-center gap-2 mb-3 text-red-500 text-[10px] font-black uppercase tracking-widest">
            <AlertTriangle size={14} /> Stock critique ({lowStockProducts.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockProducts.map(p => (
              <span key={p._id} className="text-[9px] font-black bg-red-500/20 text-red-500 px-3 py-1 rounded-full uppercase border border-red-500/10">
                {p.name}: {p.stock}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* GRAPHIQUE */}
      <div className="glass-card p-6 rounded-[2.5rem] border-white/5 mb-12 shadow-2xl">
        <SalesChart invoices={allInvoices} />
      </div>

      {/* VENTES RÉCENTES */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black italic uppercase text-ice-100/30 ml-2 tracking-widest">Dernières Opérations</h3>
        {recentInvoices.map(inv => (
          <div key={inv._id} className="glass-card p-5 rounded-3xl flex justify-between items-center border-white/5 group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/5 rounded-2xl text-ice-400"><FileText size={20} /></div>
              <div>
                <p className="font-black text-sm uppercase truncate max-w-[150px]">{inv.invoiceNumber}</p>
                <p className="text-[10px] font-bold text-ice-100/30 uppercase">{new Date(inv.createdAt).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <p className="font-black text-xl text-ice-400">{formatFCFA(inv.totalAmount)}</p>
              <button onClick={() => { setModal({ show: true, invoiceId: inv._id, invoiceNum: inv.invoiceNumber }); setPassword(''); }} className="p-2 text-white/10 hover:text-red-500 transition-colors">
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}