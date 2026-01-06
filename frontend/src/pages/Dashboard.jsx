import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  PlusCircle,
  History as HistoryIcon,
  LogOut,
  ChevronRight,
  FileText,
  Settings as SettingsIcon,
  X,
  Lock,
  AlertTriangle,
  Package,
  TrendingUp,
  Target,
  Crown,
  Eye,
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import SalesChart from '../components/SalesChart';
import { generatePDF } from '../utils/generatePDF';
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
  const [modalDetail, setModalDetail] = useState({ show: false, invoice: null });

  const shopName = localStorage.getItem('shopName') || "Ma Boutique";
  const navigate = useNavigate();
  const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

  const formatFCFA = (amount) => {
    return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " F";
  };

  const formatInvoiceDisplay = (inv) => {
    if (!inv.createdAt || !inv.invoiceNumber) return "FACT-0000";
    const dateObj = new Date(inv.createdAt);
    const dateCode = dateObj.toISOString().slice(0, 10).replace(/-/g, '');
    const parts = inv.invoiceNumber.split('-');
    const rawNum = parts[parts.length - 1];
    const cleanNum = rawNum.replace(/\D/g, '').padStart(4, '0');
    return `FACT - ${dateCode} - ${cleanNum}`;
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
      // 3. Analyse des Top Clients (VIP) - Logique Avancée
      const clientMap = {};
      invoices.forEach(inv => {
        const name = inv.customerName || "Passager";
        if (name.toUpperCase() !== "PASSAGER") {
          if (!clientMap[name]) clientMap[name] = { spent: 0, debt: 0 };
          clientMap[name].spent += inv.totalAmount;
          clientMap[name].debt += (inv.totalAmount - (inv.amountPaid || 0));
        }
      });

      const topClients = Object.entries(clientMap)
        .sort(([, a], [, b]) => {
          const aHasDebt = a.debt > 0;
          const bHasDebt = b.debt > 0;

          // 1. Priorité absolue : Pas de dette
          if (aHasDebt !== bHasDebt) return aHasDebt ? 1 : -1;

          // 2. Si les deux ont des dettes : Celui qui en a le moins gagne
          if (aHasDebt && bHasDebt) return a.debt - b.debt;

          // 3. Si aucun n'a de dette : Celui qui a le plus dépensé gagne
          return b.spent - a.spent;
        })
        .map(([name, data]) => [name, data.spent]) // On garde le format [Nom, MontantAffiche]
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



  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen pb-20 text-white relative"
    >

      {/* MODAL DÉTAILS */}
      {modalDetail.show && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-5 rounded-[1.5rem] border-white/10 relative shadow-2xl animate-in zoom-in duration-150 text-white">
            <button onClick={() => setModalDetail({ show: false })} className="absolute top-4 right-4 text-white/20 hover:text-white transition-colors"><X size={18} /></button>
            <div className="mb-4">
              <h3 className="text-lg font-black italic uppercase tracking-tighter text-ice-400">{formatInvoiceDisplay(modalDetail.invoice)}</h3>
              <p className="text-[8px] font-black uppercase text-white/30 tracking-[0.2em]">{modalDetail.invoice.customerName || "Client Passager"}</p>
            </div>
            <div className="overflow-hidden rounded-xl border border-white/5 bg-white/[0.02]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white/5 text-[8px] font-black uppercase text-ice-400/50">
                  <tr>
                    <th className="p-2 pl-3">Article</th>
                    <th className="p-2 text-center">Qté</th>
                    <th className="p-2 pr-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="text-[10px] font-bold uppercase tracking-tight">
                  {modalDetail.invoice.items.map((item, idx) => (
                    <tr key={idx} className="border-t border-white/5 hover:bg-white/[0.02]">
                      <td className="p-2 pl-3 max-w-[120px] truncate">{item.name}</td>
                      <td className="p-2 text-center">{item.quantity}</td>
                      <td className="p-2 pr-3 text-right">{(item.price * item.quantity).toLocaleString()} F</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-end">
              <div>
                <p className="text-[7px] font-black uppercase text-white/20 mb-1">Total Facture</p>
                <p className="text-2xl font-black italic text-ice-400 leading-none">{modalDetail.invoice.totalAmount.toLocaleString()} F</p>
              </div>
              <button
                onClick={() => generatePDF({ ...modalDetail.invoice, invoiceNumber: formatInvoiceDisplay(modalDetail.invoice) })}
                className="flex items-center gap-2 bg-ice-400 text-ice-900 px-4 py-2 rounded-lg font-black uppercase text-[9px] hover:scale-105 transition-all shadow-lg shadow-ice-400/20"
              >
                <Printer size={14} /> Imprimer
              </button>
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

      {/* LIGNE 1 : METRIQUES CLÉS (3 Colonnes) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* VENTES DU JOUR */}
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

        {/* TOTAL OPÉRATIONS */}
        <div className="glass-card p-5 rounded-3xl border-white/5">
          <p className="text-ice-100/40 text-[9px] font-black uppercase tracking-widest mb-1 flex items-center gap-2">
            <Target size={12} /> Opérations
          </p>
          <h2 className="text-2xl font-black text-white">{stats.count}</h2>
        </div>
      </div>

      {/* LIGNE 2 : ANALYSES (2 Colonnes) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* CLIENTS VIP */}
        <div className="glass-card p-5 rounded-3xl border-yellow-500/20 bg-yellow-500/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-all text-yellow-500"><Crown size={40} /></div>
          <p className="text-yellow-500 text-[9px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
            <Crown size={12} /> Clients VIP
          </p>
          <div className="space-y-1">
            {stats.topClients.map(([name, amount], i) => (
              <div key={i} className="flex justify-between items-center text-[9px] font-bold uppercase border-b border-yellow-500/10 pb-1 last:border-0">
                <span className="text-white/80">{i + 1}. {name.slice(0, 15)}</span>
                <span className="text-yellow-500">{formatFCFA(amount)}</span>
              </div>
            ))}
            {stats.topClients.length === 0 && <span className="text-[9px] text-white/20">Aucune donnée</span>}
          </div>
        </div>

        {/* TOP PRODUITS */}
        <div className="glass-card p-5 rounded-3xl border-white/5">
          <p className="text-ice-100/40 text-[9px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
            <Package size={12} /> Top Produits
          </p>
          <div className="flex flex-wrap gap-2">
            {stats.topProducts.map(([name, qty], i) => (
              <span key={i} className="text-[10px] font-black bg-white/5 px-3 py-1 rounded-full border border-white/10 uppercase">
                {name} <span className="text-ice-400 ml-1">{qty}</span>
              </span>
            ))}
            {stats.topProducts.length === 0 && <span className="text-[10px] text-white/20 uppercase">Aucune donnée</span>}
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
            <div className="flex items-center gap-4">
              <p className="font-black text-lg text-ice-400 mr-2">{formatFCFA(inv.totalAmount)}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setModalDetail({ show: true, invoice: inv })}
                  className="p-2 bg-white/5 text-white/40 rounded-xl hover:text-ice-400 transition-all border border-white/5"
                >
                  <Eye size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}