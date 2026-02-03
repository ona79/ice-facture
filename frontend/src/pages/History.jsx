import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ArrowLeft, Download, Calendar, Search,
  FileText, Trash2, X, Lock, Eye, Banknote, MessageCircle, ListFilter, Clock, User, Printer, FileDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { generatePDF } from '../utils/generatePDF';
import { IceInput } from '../components/IceInput';
import toast from 'react-hot-toast';
import { CardSkeleton, Skeleton } from '../components/Skeleton';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function History() {
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyDebts, setShowOnlyDebts] = useState(false);
  const [showOnlyToday, setShowOnlyToday] = useState(false);
  const [modalDelete, setModalDelete] = useState({ show: false, id: null, num: '' });
  const [modalPay, setModalPay] = useState({ show: false, invoice: null, amount: "" });
  const [modalDetail, setModalDetail] = useState({ show: false, invoice: null });
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/invoices`, config);
      // On s'assure que res.data est bien un tableau
      const data = Array.isArray(res.data) ? res.data : [];
      const sortedData = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setInvoices(sortedData);
    } catch (err) {
      console.error("Erreur chargement historique:", err);
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, []);

  const formatInvoiceDisplay = (inv) => {
    if (!inv.createdAt || !inv.invoiceNumber) return "FAIT-0000";
    const dateObj = new Date(inv.createdAt);
    const dateCode = dateObj.toISOString().slice(0, 10).replace(/-/g, '');
    const parts = inv.invoiceNumber.split('-');
    const rawNum = parts[parts.length - 1];
    const cleanNum = rawNum.replace(/\D/g, '').padStart(4, '0');
    return `FAIT - ${dateCode} - ${cleanNum}`;
  };

  // --- FILTRAGE DIRECT (Sans useMemo pour éviter tout bug de stale state) ---
  const term = searchTerm.toLowerCase().trim();
  const filteredInvoices = invoices.filter(inv => {
    const clientName = (inv.customerName || "client passager").toLowerCase();
    const clientPhone = (inv.customerPhone || "").toString().toLowerCase();
    const displayNum = formatInvoiceDisplay(inv).toLowerCase();

    const isSearchMatch = clientName.includes(term) || clientPhone.includes(term) || displayNum.includes(term);
    const isToday = new Date(inv.createdAt).toDateString() === new Date().toDateString();
    const isDette = (inv.totalAmount - (inv.amountPaid || 0)) > 0;

    let match = isSearchMatch;
    if (showOnlyDebts) match = match && isDette;
    if (showOnlyToday) match = match && isToday;
    return match;
  });

  const totalDettes = filteredInvoices.reduce((acc, inv) => {
    const reste = inv.totalAmount - (inv.amountPaid || 0);
    return reste > 0 ? acc + reste : acc;
  }, 0);

  // --- ACTIONS ---
  const handleWhatsApp = (inv) => {
    const displayNum = formatInvoiceDisplay(inv);
    const shopName = localStorage.getItem('shopName') || "votre boutique";
    const message = `Bonjour ${inv.customerName || 'Client'} 👋,\n\nMerci pour votre visite chez *${shopName}* !\nVoici votre facture *${displayNum}* d'un montant de *${inv.totalAmount.toLocaleString()} F*.\n\nÀ bientôt ! 🚀`;

    if (inv.customerPhone) {
      const cleanPhone = inv.customerPhone.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('221') ? cleanPhone : `221${cleanPhone}`;
      window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const exportToExcel = () => {
    const dataToExport = filteredInvoices.map(inv => ({
      'N° FACTURE': formatInvoiceDisplay(inv),
      'DATE': new Date(inv.createdAt).toLocaleDateString('fr-FR'),
      'CLIENT': inv.customerName,
      'TOTAL (F)': inv.totalAmount,
      'PAYÉ (F)': inv.amountPaid || 0,
      'RESTE (F)': inv.totalAmount - (inv.amountPaid || 0)
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Factures");
    XLSX.writeFile(workbook, `Factures_Ice_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Excel généré !");
  };

  const handleDeleteInvoice = async (e) => {
    e.preventDefault();
    const loading = toast.loading("Suppression...");
    try {
      await axios.delete(`${API_URL}/api/invoices/${modalDelete.id}`, {
        headers: config.headers,
        data: { password }
      });
      toast.dismiss(loading);
      toast.success("Vente supprimée");
      setModalDelete({ show: false, id: null, num: '' });
      setPassword('');
      fetchInvoices();
    } catch (err) {
      toast.dismiss(loading);
      toast.error(err.response?.data?.msg || "Erreur / Mot de passe incorrect");
    }
  };

  const handleSettleDebt = async (e) => {
    e.preventDefault();
    const loading = toast.loading("Mise à jour...");
    try {
      await axios.patch(`${API_URL}/api/invoices/${modalPay.invoice._id}/pay`, { amount: Number(modalPay.amount) }, config);
      toast.dismiss(loading);
      toast.success("Paiement enregistré");
      setModalPay({ show: false, invoice: null, amount: "" });
      fetchInvoices();
    } catch (err) {
      toast.dismiss(loading);
      toast.error("Erreur de règlement");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto pt-28 md:pt-32 pb-12 px-4 md:px-8 min-h-screen text-white font-sans"
    >


      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div className="text-left">
          <h1 className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase leading-none">
            Historique <span className="text-ice-400">/ Ventes</span>
          </h1>
          <p className="text-ice-400/40 text-[9px] font-black uppercase tracking-[0.2em] mt-1 italic">Journal des transactions passées</p>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={exportToExcel}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 active:bg-white/20 px-4 py-2.5 rounded-2xl border border-white/5 transition-all text-[9px] font-black uppercase tracking-widest text-white/70"
          >
            <Download size={14} className="text-ice-400" /> Excel
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/dashboard')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white/10 hover:bg-ice-400 hover:text-ice-900 active:scale-95 px-4 py-2.5 rounded-2xl border border-white/10 transition-all text-[9px] font-black uppercase tracking-widest"
          >
            <ArrowLeft size={14} /> Retour
          </motion.button>
        </div>
      </div>

      {/* QUICK STATS (Ultra-Compact) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
        <div className="glass-card p-3 rounded-2xl bg-white/5 border-white/5">
          <p className="text-[7px] font-black text-white/20 uppercase tracking-widest mb-1">Total Filtré</p>
          {loading ? <Skeleton width="60px" height="15px" /> : <p className="text-lg font-black text-ice-400 italic leading-none">{filteredInvoices.length}</p>}
        </div>
        <div className="glass-card p-3 rounded-2xl bg-white/5 border-white/5">
          <p className="text-[7px] font-black text-white/20 uppercase tracking-widest mb-1">Valeur Totale</p>
          {loading ? <Skeleton width="80px" height="15px" /> : <p className="text-lg font-black text-white leading-none">{filteredInvoices.reduce((a, b) => a + b.totalAmount, 0).toLocaleString()} <span className="text-[10px] opacity-30">F</span></p>}
        </div>
        <div className="glass-card p-3 rounded-2xl bg-white/5 border-white/5">
          <p className="text-[7px] font-black text-white/20 uppercase tracking-widest mb-1">Total Encaissé</p>
          {loading ? <Skeleton width="80px" height="15px" /> : <p className="text-lg font-black text-green-400 leading-none">{filteredInvoices.reduce((a, b) => a + (b.amountPaid || 0), 0).toLocaleString()} <span className="text-[10px] opacity-30">F</span></p>}
        </div>
        <div className="glass-card p-3 rounded-2xl bg-red-500/5 border-red-500/10">
          <p className="text-[7px] font-black text-red-500/40 uppercase tracking-widest mb-1">Dettes Clients</p>
          {loading ? <Skeleton width="80px" height="15px" /> : <p className="text-lg font-black text-red-400 leading-none">{totalDettes.toLocaleString()} <span className="text-[10px] opacity-30">F</span></p>}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 w-full md:w-auto mb-8">
        <button
          onClick={() => setShowOnlyToday(!showOnlyToday)}
          className={`action-btn-p px-4 py-2 rounded-xl border text-[8px] font-black uppercase tracking-widest transition-all duration-500 flex items-center gap-1.5 ${showOnlyToday ? 'bg-ice-400 text-black border-ice-400 shadow-[0_0_15px_rgba(0,242,255,0.2)]' : 'bg-white/[0.03] border-white/10 text-white/40 hover:border-ice-400/40'}`}
        >
          <Clock size={12} className={showOnlyToday ? 'text-black' : 'text-ice-400'} /> Aujourd'hui
        </button>
        <button
          onClick={() => setShowOnlyDebts(!showOnlyDebts)}
          className={`action-btn-p px-4 py-2 rounded-xl border text-[8px] font-black uppercase tracking-widest transition-all duration-500 flex items-center gap-1.5 ${showOnlyDebts ? 'bg-orange-500 text-white border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'bg-white/[0.03] border-white/10 text-white/40 hover:border-orange-500/40'}`}
        >
          <ListFilter size={12} className={showOnlyDebts ? 'text-white' : 'text-orange-400'} /> Dettes
        </button>
        <div className="relative flex-1 md:w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={12} />
          <input
            type="text"
            placeholder="RECHERCHE..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-2 pl-9 text-[9px] font-black uppercase tracking-widest outline-none focus:border-ice-400 transition-all placeholder:text-white/10"
          />
        </div>
      </div>

      {/* LIST */}
      <div className="space-y-3 pb-12">
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          filteredInvoices.length > 0 ? (
            filteredInvoices.map(inv => {
              const displayNum = formatInvoiceDisplay(inv);
              const isDette = (inv.totalAmount - (inv.amountPaid || 0)) > 0;

              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={inv._id}
                  className="glass-card p-4 rounded-3xl border border-white/5 bg-white/[0.02] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group"
                >
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="p-3 bg-white/5 rounded-2xl text-ice-400 group-hover:bg-ice-400 group-hover:text-black transition-all">
                      <FileText size={18} />
                    </div>
                    <div className="text-left flex-1">
                      <h4 className="font-black text-xs uppercase tracking-tight text-white/90 truncate max-w-[150px]">{displayNum}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[8px] font-black uppercase text-white/30 tracking-widest flex items-center gap-1">
                          <User size={8} /> {inv.customerName || "Passager"}
                        </span>
                        <span className="text-[8px] font-black uppercase text-white/20 tracking-widest flex items-center gap-1">
                          <Clock size={8} /> {new Date(inv.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full md:w-auto md:gap-8 bg-black/20 p-2 md:p-0 rounded-2xl md:bg-transparent">
                    <div className="text-right flex flex-col items-end">
                      <p className="text-lg font-black text-ice-400 italic leading-none">{inv.totalAmount.toLocaleString()} <span className="text-[10px] not-italic opacity-30">F</span></p>
                      {isDette ? (
                        <span className="text-[8px] font-black uppercase text-red-500 animate-pulse mt-1">Dette: {(inv.totalAmount - (inv.amountPaid || 0)).toLocaleString()} F</span>
                      ) : (
                        <span className="text-[8px] font-black uppercase text-green-500 mt-1">Soldé</span>
                      )}
                    </div>

                    <div className="flex gap-1.5 ml-4">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setModalDetail({ show: true, invoice: inv })}
                        className="p-2.5 bg-white/5 text-white/40 hover:text-ice-400 hover:bg-white/10 rounded-xl transition-all border border-white/5"
                      >
                        <Eye size={16} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleWhatsApp(inv)}
                        className="p-2.5 bg-green-500/10 text-green-500/50 hover:text-green-500 hover:bg-green-500/20 rounded-xl transition-all border border-green-500/10"
                      >
                        <MessageCircle size={16} />
                      </motion.button>
                      {isDette && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setModalPay({ show: true, invoice: inv })}
                          className="p-2.5 bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white rounded-xl transition-all border border-orange-500/20"
                        >
                          <Banknote size={16} />
                        </motion.button>
                      )}
                      {localStorage.getItem('role') === 'admin' && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setModalDelete({ show: true, id: inv._id, num: displayNum })}
                          className="p-2.5 bg-red-500/5 text-red-500/30 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all border border-red-500/5"
                        >
                          <Trash2 size={16} />
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-20 bg-white/[0.01] rounded-[3rem] border border-dashed border-white/5">
              <FileText size={40} className="mx-auto text-white/5 mb-4" />
              <p className="text-white/20 text-xs font-black uppercase tracking-widest">Aucune facture trouvée</p>
            </div>
          )
        )}
      </div>

      {modalDelete.show && (
        <div onClick={() => setModalDelete({ show: false })} className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div onClick={(e) => e.stopPropagation()} className="glass-card w-full max-w-sm p-8 rounded-[3rem] border-red-500/20 relative shadow-2xl text-center">
            <button onClick={() => setModalDelete({ show: false })} className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors"><X size={20} /></button>
            <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl mb-4 inline-block"><Lock size={32} /></div>
            <h3 className="text-xl font-black italic uppercase mb-2">Confirmer Suppression</h3>
            <p className="text-[10px] font-black uppercase text-white/20 mb-8">{modalDelete.num}</p>
            <form onSubmit={handleDeleteInvoice} className="space-y-4">
              <IceInput
                label="Mot de passe admin requis"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="submit"
                className="w-full py-5 rounded-2xl font-black bg-red-500 text-white uppercase text-xs active:scale-95 transition-all shadow-lg shadow-red-500/20"
              >
                Supprimer Définitivement
              </button>
            </form>
          </div>
        </div>
      )}

      {modalDetail.show && (
        <div onClick={() => setModalDetail({ show: false })} className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div onClick={(e) => e.stopPropagation()} className="glass-card w-full max-w-md p-8 rounded-[3rem] border-white/10 relative shadow-2xl">
            <button onClick={() => setModalDetail({ show: false })} className="absolute top-6 right-6 text-white/20"><X size={20} /></button>
            <h3 className="text-xl font-black italic uppercase text-ice-400 mb-6">{formatInvoiceDisplay(modalDetail.invoice)}</h3>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
              {modalDetail.invoice.items.map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-white/5">
                  <div>
                    <p className="text-xs font-black uppercase text-white">{item.name}</p>
                    <p className="text-[10px] text-white/40">{item.quantity} x {item.price.toLocaleString()} F</p>
                  </div>
                  <p className="text-sm font-black text-ice-400">{(item.price * item.quantity).toLocaleString()} F</p>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
              <p className="text-2xl font-black italic text-ice-400">{modalDetail.invoice.totalAmount.toLocaleString()} F</p>
              <button onClick={() => generatePDF({ ...modalDetail.invoice, invoiceNumber: formatInvoiceDisplay(modalDetail.invoice) })} className="px-6 py-3 bg-ice-400 text-black rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 shdow-lg shadow-ice-400/20">
                <Printer size={16} /> Imprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {modalPay.show && (
        <div onClick={() => setModalPay({ show: false })} className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
          <div onClick={(e) => e.stopPropagation()} className="glass-card w-full max-w-sm p-8 rounded-[3rem] border-orange-500/20 relative shadow-2xl bg-black">
            <button onClick={() => setModalPay({ show: false })} className="absolute top-6 right-6 text-white/20"><X size={20} /></button>
            <div className="text-center mb-6">
              <div className="p-4 bg-orange-500/10 text-orange-500 rounded-2xl inline-block mb-3"><Banknote size={32} /></div>
              <h3 className="text-xl font-black italic uppercase">{modalPay.invoice.customerName || 'Client'}</h3>
              <p className="text-white/40 text-[10px] uppercase font-black tracking-widest mt-2 italic">Reste : <span className="text-orange-500">{(modalPay.invoice.totalAmount - (modalPay.invoice.amountPaid || 0)).toLocaleString()} F</span></p>
            </div>
            <form onSubmit={handleSettleDebt} className="space-y-4">
              <IceInput type="number" value={modalPay.amount} onChange={(e) => setModalPay({ ...modalPay, amount: e.target.value })} placeholder="MONTANT À PAYER..." required />
              <button type="submit" className="w-full py-5 bg-orange-500 text-white rounded-2xl font-black uppercase text-[12px] shadow-lg shadow-orange-500/30 active:scale-95 transition-all">Enregistrer le paiement</button>
            </form>
          </div>
        </div>
      )}

    </motion.div>
  );
}