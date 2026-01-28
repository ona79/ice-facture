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
  Printer,
  Wallet,
  MessageSquare
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
    totalExpenses: 0,
    netProfit: 0,
    count: 0,
    todaySales: 0,
    topProducts: [],
    topClients: []
  });
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [modalDetail, setModalDetail] = useState({ show: false, invoice: null });

  const [currentShopName, setCurrentShopName] = useState(localStorage.getItem('shopName') || "Ma Boutique");
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
    // --- 1. RÉCUPÉRATION DES FACTURES (CRITIQUE) ---
    let invoices = [];
    try {
      const resInv = await axios.get(`${API_URL}/api/invoices`, config);
      invoices = resInv.data;
      setAllInvoices(invoices);
      const sortedInvoices = [...invoices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRecentInvoices(sortedInvoices.slice(0, 3));
    } catch (err) {
      console.error("Erreur Invoices:", err);
      toast.error("Erreur de chargement des ventes");
    }

    // --- 2. LOGIQUE STATISTIQUES AVANCÉES (DÉPEND DES FACTURES) ---
    const today = new Date().toISOString().split('T')[0];
    const todaySales = invoices
      .filter(inv => inv.createdAt.startsWith(today))
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    const productMap = {};
    invoices.forEach(inv => {
      inv.items.forEach(item => {
        productMap[item.name] = (productMap[item.name] || 0) + item.quantity;
      });
    });
    const topProducts = Object.entries(productMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

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
        if (aHasDebt !== bHasDebt) return aHasDebt ? 1 : -1;
        if (aHasDebt && bHasDebt) return a.debt - b.debt;
        return b.spent - a.spent;
      })
      .map(([name, data]) => [name, data.spent])
      .slice(0, 3);

    const totalSales = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    // --- 3. RÉCUPÉRATION DES DÉPENSES (OPTIONNEL) ---
    let totalExpenses = 0;
    try {
      const resExp = await axios.get(`${API_URL}/api/expenses`, config);
      const expenses = resExp.data;
      totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    } catch (err) {
      console.warn("Expenses non disponibles (probable déploiement en cours)");
    }

    setStats({
      totalSales,
      totalExpenses,
      netProfit: totalSales - totalExpenses,
      count: invoices.length,
      todaySales,
      topProducts,
      topClients
    });

    // --- 4. RÉCUPÉRATION DU PROFIL ---
    try {
      const resProfile = await axios.get(`${API_URL}/api/auth/profile`, config);
      if (resProfile.data) {
        if (resProfile.data.shopName) {
          setCurrentShopName(resProfile.data.shopName);
          localStorage.setItem('shopName', resProfile.data.shopName);
        }
        if (resProfile.data.role) {
          localStorage.setItem('role', resProfile.data.role);
        }
      }
    } catch (err) {
      console.error("Erreur Profile:", err);
    }

    // --- 5. RÉCUPÉRATION DES PRODUITS (ALERTES STOCK) ---
    try {
      const resProducts = await axios.get(`${API_URL}/api/products`, config);
      const allProducts = resProducts.data;
      setProducts(allProducts);
      setLowStockProducts(allProducts.filter(p => p.stock <= 5));
    } catch (err) {
      console.error("Erreur Products:", err);
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-28 md:pt-32 pb-12 px-4 md:px-8 max-w-7xl mx-auto min-h-screen text-white font-sans overflow-x-hidden relative"
    >
      {/* SHOP NAME AT TOP-LEFT WITH ANIMATION */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed top-4 left-6 md:left-10 z-[110] flex items-center gap-2 md:gap-3 whitespace-nowrap pointer-events-none"
      >
        <div className="w-1 h-5 md:h-6 bg-ice-400 rounded-full shadow-[0_0_15px_rgba(0,242,255,0.6)]" />
        <h2 className="text-sm md:text-lg font-black italic uppercase tracking-tighter text-white/90 drop-shadow-2xl">
          {currentShopName}
        </h2>
      </motion.div>

      {/* MODAL DÉTAILS */}
      <AnimatePresence>
        {modalDetail.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card w-full max-w-md p-6 rounded-[2rem] border-white/10 relative shadow-2xl"
            >
              <button
                onClick={() => setModalDetail({ show: false })}
                className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <div className="mb-6">
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-ice-400">{formatInvoiceDisplay(modalDetail.invoice)}</h3>
                <div className="flex flex-col gap-1 mt-1">
                  <p className="text-[10px] font-black uppercase text-white/70 tracking-[0.1em]">{modalDetail.invoice.customerName || "Client Passager"}</p>
                  {modalDetail.invoice.customerPhone && (
                    <p className="text-[9px] font-bold text-ice-400/60 uppercase">Tél: {modalDetail.invoice.customerPhone}</p>
                  )}
                  <p className="text-[8px] font-medium text-white/30 uppercase tracking-widest">
                    {new Date(modalDetail.invoice.createdAt).toLocaleString('fr-FR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white/5 text-[9px] font-black uppercase text-ice-400/50">
                    <tr>
                      <th className="p-3 text-left">Article</th>
                      <th className="p-3 text-center">Qté</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-bold uppercase tracking-tight">
                    {modalDetail.invoice.items.map((item, idx) => (
                      <tr key={idx} className="border-t border-white/5 hover:bg-white/[0.02]">
                        <td className="p-3 max-w-[120px] truncate">{item.name}</td>
                        <td className="p-3 text-center">{item.quantity}</td>
                        <td className="p-3 text-right">{(item.price * item.quantity).toLocaleString()} F</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-end">
                <div className="text-left">
                  <p className="text-[8px] font-black uppercase text-white/20 mb-1">Total Facture</p>
                  <p className="text-3xl font-black italic text-ice-400 leading-none">{modalDetail.invoice.totalAmount.toLocaleString()} F</p>
                </div>
                <button
                  onClick={() => generatePDF({ ...modalDetail.invoice, invoiceNumber: formatInvoiceDisplay(modalDetail.invoice) })}
                  className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-black uppercase text-[10px] hover:scale-105 transition-all shadow-xl"
                >
                  <Printer size={16} /> Imprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO SECTION - Sales Chart */}
      <div className="relative mb-8 rounded-[2.5rem] overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1120] to-[#1a2a47] opacity-90" />

        <div className="relative z-10 pt-6 pb-8 md:pt-10 md:pb-12 px-4 sm:px-8 md:px-12 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8">
          <div className="max-w-md text-left w-full md:w-auto">
            <div className="flex justify-between items-start mb-2 gap-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-tight">
                Ventes <span className="text-ice-400">{new Date().getFullYear()}</span>
              </h1>
              <button
                onClick={() => navigate('/settings', { state: { tab: 'support' } })}
                className="flex items-center gap-1 sm:gap-2 bg-white/10 hover:bg-ice-400 hover:text-ice-900 px-2 sm:px-4 py-2 rounded-2xl border border-white/10 transition-all active:scale-95 group flex-shrink-0"
              >
                <MessageSquare size={14} className="group-hover:animate-bounce" />
                <span className="text-[8px] font-black uppercase tracking-widest hidden sm:inline">Aide ?</span>
              </button>
            </div>
            <p className="text-white/60 text-sm font-bold uppercase tracking-widest mb-6">
              Aujourd'hui : <span className="text-white">{formatFCFA(stats.todaySales)}</span>
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 min-w-[120px]">
                <p className="text-[8px] font-black text-white/40 uppercase">Ventes Globales</p>
                <p className="text-lg font-black text-ice-400">{formatFCFA(stats.totalSales)}</p>
              </div>
              {localStorage.getItem('role') === 'admin' && (
                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 min-w-[120px]">
                  <p className="text-[8px] font-black text-white/40 uppercase">Bénéfice Net</p>
                  <p className={`text-lg font-black ${stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatFCFA(stats.netProfit)}</p>
                </div>
              )}
              <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 min-w-[80px]">
                <p className="text-[8px] font-black text-white/40 uppercase">Opérations</p>
                <p className="text-lg font-black">{stats.count}</p>
              </div>
            </div>
          </div>

          <div className="w-full md:w-3/5 h-[200px] md:h-[250px]">
            <SalesChart invoices={allInvoices} />
          </div>
        </div>
      </div>

      {/* ACTION GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
        <button onClick={() => navigate('/new-invoice')} className="action-btn bg-cyan-600/90 text-white shadow-lg shadow-cyan-900/40">
          <div className="p-3 bg-white/20 rounded-2xl"><PlusCircle size={24} /></div>
          <span className="text-[10px] font-black uppercase tracking-widest">Vendre</span>
        </button>

        <button onClick={() => navigate('/products')} className="action-btn bg-pink-600/90 text-white shadow-lg shadow-pink-900/40">
          <div className="p-3 bg-white/20 rounded-2xl relative">
            <Package size={24} />
            {lowStockProducts.length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-pink-600 animate-blink" />}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Stock</span>
        </button>

        <button onClick={() => navigate('/history')} className="action-btn bg-purple-600/90 text-white shadow-lg shadow-purple-900/40">
          <div className="p-3 bg-white/20 rounded-2xl"><FileText size={24} /></div>
          <span className="text-[10px] font-black uppercase tracking-widest">Factures</span>
        </button>

        {localStorage.getItem('role') === 'admin' && (
          <button onClick={() => navigate('/expenses')} className="action-btn bg-red-600/90 text-white shadow-lg shadow-red-900/40">
            <div className="p-3 bg-white/20 rounded-2xl"><Wallet size={24} /></div>
            <span className="text-[10px] font-black uppercase tracking-widest">Charges</span>
          </button>
        )}

        <button onClick={() => navigate('/settings')} className="action-btn bg-lime-500/90 text-black shadow-lg shadow-lime-900/40">
          <div className="p-3 bg-black/10 rounded-2xl"><SettingsIcon size={24} /></div>
          <span className="text-[10px] font-black uppercase tracking-widest">{localStorage.getItem('role') === 'admin' ? 'Réglages' : 'Compte'}</span>
        </button>

        <button onClick={handleLogout} className="action-btn bg-orange-500/90 text-white shadow-lg shadow-orange-900/40 col-span-2 md:col-span-1">
          <div className="p-3 bg-white/20 rounded-2xl"><LogOut size={24} /></div>
          <span className="text-[10px] font-black uppercase tracking-widest">Quitter</span>
        </button>
      </div>

      {/* STOCK ALERTS */}
      {lowStockProducts.length > 0 && (
        <div className="mb-10 space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-700">
          <div className="flex items-center gap-2 px-2">
            <div className="w-1 h-3 bg-red-500 rounded-full animate-pulse" />
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-red-500 italic">Produits en Alerte Stock</h3>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
            {lowStockProducts.map(p => (
              <div key={p._id} className="min-w-[220px] glass-card p-5 rounded-3xl border-red-500/10 bg-red-500/[0.03] flex justify-between items-center group snap-start">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl group-hover:bg-red-500 group-hover:text-white transition-all duration-500">
                    <Package size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-xs uppercase truncate max-w-[100px]">{p.name}</p>
                    <p className="text-[9px] font-bold text-red-500/60 uppercase italic animate-blink">Reste {p.stock} unités</p>
                  </div>
                </div>
                <div className="bg-red-500/20 w-8 h-8 rounded-full flex items-center justify-center border border-red-500/30">
                  <p className="font-black text-xs text-red-500">{p.stock}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BOTTOM SECTION */}
      <div className="space-y-6">
        <div className="flex justify-between items-end px-2">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/40 italic">Dernières Opérations</h3>
          <button onClick={() => navigate('/history')} className="text-[9px] font-black uppercase tracking-widest text-ice-400 hover:underline">Voir tout</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentInvoices.map(inv => (
            <div key={inv._id} className="glass-card p-5 rounded-3xl flex justify-between items-center group">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/5 rounded-2xl text-ice-400 group-hover:bg-ice-400 group-hover:text-black transition-all">
                  <FileText size={18} />
                </div>
                <div className="text-left">
                  <p className="font-black text-xs uppercase truncate max-w-[120px]">{inv.invoiceNumber}</p>
                  <p className="text-[9px] font-bold text-white/30 uppercase">{new Date(inv.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-black text-sm text-ice-400">{formatFCFA(inv.totalAmount)}</p>
                <button
                  onClick={() => setModalDetail({ show: true, invoice: inv })}
                  className="p-2 bg-white/5 text-white/20 rounded-xl hover:text-white transition-all"
                >
                  <Eye size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}