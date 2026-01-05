import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ArrowLeft, Download, Calendar, Search, 
  FileText, Trash2, X, Lock, Eye, FilterX, Banknote, MessageCircle, ListFilter, Clock 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generatePDF } from '../utils/generatePDF';
import { IceInput } from '../components/IceInput';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function History() {
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyDebts, setShowOnlyDebts] = useState(false);
  const [showOnlyToday, setShowOnlyToday] = useState(false); // Filtre Aujourd'hui
  const [userData, setUserData] = useState(null);
  const [modalDelete, setModalDelete] = useState({ show: false, id: null, num: '' });
  const [modalDetails, setModalDetails] = useState({ show: false, invoice: null });
  const [modalPay, setModalPay] = useState({ show: false, invoice: null, amount: "" });
  const [password, setPassword] = useState('');
  const [isVerifyingForDetails, setIsVerifyingForDetails] = useState(false);

  const navigate = useNavigate();
  const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

  const fetchInvoices = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/invoices`, config);
      const sortedData = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setInvoices(sortedData);
      const profile = await axios.get(`${API_URL}/api/auth/profile`, config);
      setUserData(profile.data);
    } catch (err) {
      console.error("Erreur chargement historique:", err);
    }
  };

  useEffect(() => { fetchInvoices(); }, []);

  const handleSettleDebt = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading("Mise à jour...");
    try {
      await axios.patch(`${API_URL}/api/invoices/${modalPay.invoice._id}/pay`, 
        { amount: Number(modalPay.amount) }, config
      );
      toast.dismiss(loadingToast);
      toast.success("PAIEMENT ENREGISTRÉ");
      setModalPay({ show: false, invoice: null, amount: "" });
      fetchInvoices();
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error("Erreur : Montant invalide ou trop élevé");
    }
  };

  const handleWhatsAppShare = (inv, displayNum) => {
    const reste = inv.totalAmount - (inv.amountPaid || 0);
    const shopName = userData?.shopName?.toUpperCase() || "MA BOUTIQUE";
    let text = `*${shopName}*%0A--------------------------%0A*FACTURE :* ${displayNum}%0A*TOTAL :* ${inv.totalAmount.toLocaleString()} FCFA%0A`;
    if (reste > 0) { text += `*RESTE À PAYER :* ${reste.toLocaleString()} FCFA%0A⚠️ _Rappel de paiement._%0A`; }
    else { text += `*STATUT :* ✅ PAYÉ%0A`; }
    text += `--------------------------%0AMerci de votre confiance !`;
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleVerifyAndAction = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/auth/verify-password`, { password }, config);
      if (isVerifyingForDetails) { setIsVerifyingForDetails(false); } 
      else {
        await axios.delete(`${API_URL}/api/invoices/${modalDelete.id}`, { headers: config.headers, data: { password } });
        toast.success("Vente supprimée");
        setModalDelete({ show: false, id: null, num: '' });
        fetchInvoices();
      }
      setPassword('');
    } catch (err) {
      toast.error("Mot de passe incorrect");
      setPassword('');
    }
  };

  const formatInvoiceDisplay = (inv) => {
    const dateObj = new Date(inv.createdAt);
    const dateCode = dateObj.toISOString().slice(0, 10).replace(/-/g, '');
    const rawNum = inv.invoiceNumber.split('-')[1] || "0";
    return `FACT-${dateCode}-${rawNum.replace(/\D/g, '').padStart(5, '0')}`;
  };

  const filteredInvoices = invoices.filter(inv => {
    const term = searchTerm.toLowerCase().trim();
    const displayNum = formatInvoiceDisplay(inv).toLowerCase();
    const isSearchMatch = displayNum.includes(term) || inv.invoiceNumber.toLowerCase().includes(term);
    const isToday = new Date(inv.createdAt).toDateString() === new Date().toDateString();
    const isDette = (inv.totalAmount - (inv.amountPaid || 0)) > 0;

    let match = isSearchMatch;
    if (showOnlyDebts) match = match && isDette;
    if (showOnlyToday) match = match && isToday;
    return match;
  });

  const totalDettes = invoices.reduce((acc, inv) => acc + (inv.totalAmount - (inv.amountPaid || 0)), 0);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto min-h-screen text-white font-sans">
      
      {/* 1. MODAL SÉCURITÉ */}
      {(modalDelete.show || (modalDetails.show && isVerifyingForDetails)) && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="glass-card w-full max-w-md p-8 rounded-[2.5rem] border-white/10 relative">
            <button onClick={() => { setModalDelete({show:false}); setModalDetails({show:false}); setIsVerifyingForDetails(false); }} className="absolute top-6 right-6 text-white/20"><X size={20}/></button>
            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-red-500/10 text-red-500 rounded-3xl mb-6"><Lock size={32} /></div>
              <h3 className="text-2xl font-black italic uppercase mb-2">Confidentialité</h3>
              <p className="text-ice-100/50 text-[10px] font-black uppercase mb-8">Remplissez les infos de la facture pour continuer</p>
              <form onSubmit={handleVerifyAndAction} className="w-full space-y-4">
                <IceInput label="Mot de passe Admin" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit" className="w-full py-4 rounded-2xl font-black bg-ice-400 text-ice-900 uppercase">Déverrouiller</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 2. MODAL ENCAISSEMENT (AVEC BOUTON TOUT RÉGLER) */}
      {modalPay.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95">
          <div className="glass-card w-full max-w-md p-8 rounded-[2.5rem] border-orange-500/20 relative">
            <button onClick={() => setModalPay({show:false})} className="absolute top-6 right-6 text-white/20"><X size={20}/></button>
            <div className="text-center">
              <div className="p-4 bg-orange-500/10 text-orange-500 rounded-3xl mb-4 inline-block"><Banknote size={32} /></div>
              <h3 className="text-2xl font-black italic uppercase">Régler la dette</h3>
              <p className="text-white/30 text-[10px] uppercase mb-8">Reste : <span className="text-orange-500">{(modalPay.invoice.totalAmount - modalPay.invoice.amountPaid).toLocaleString()} F</span></p>
              <form onSubmit={handleSettleDebt} className="space-y-4 text-left">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[9px] font-black uppercase text-white/40">Montant</label>
                  <button type="button" onClick={() => setModalPay({...modalPay, amount: (modalPay.invoice.totalAmount - modalPay.invoice.amountPaid).toString()})} className="text-[8px] font-black bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded hover:bg-orange-500 hover:text-white transition-all">[ TOUT RÉGLER ]</button>
                </div>
                <IceInput type="number" value={modalPay.amount} onChange={(e) => setModalPay({...modalPay, amount: e.target.value})} placeholder="0" required />
                <button type="submit" className="w-full py-4 rounded-2xl font-black bg-orange-500 text-white uppercase tracking-widest">Confirmer le paiement</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* HEADER & BOUTONS FILTRES OPTIMISÉS */}
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-ice-100/30 mb-6 font-black uppercase text-[10px] tracking-widest"><ArrowLeft size={14} /> Retour Dashboard</button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Historique</h1>
          <p className="text-ice-400 text-[9px] font-black uppercase tracking-[0.4em] mt-2 italic opacity-50">Gestion des archives</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button onClick={() => setShowOnlyToday(!showOnlyToday)} className={`flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 rounded-xl border transition-all font-black text-[10px] uppercase tracking-widest ${showOnlyToday ? 'bg-ice-400 text-ice-900 border-ice-400' : 'bg-white/5 border-white/10 text-white/40'}`}>
            <Clock size={16} /> Aujourd'hui
          </button>
          <button onClick={() => setShowOnlyDebts(!showOnlyDebts)} className={`flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 rounded-xl border transition-all font-black text-[10px] uppercase tracking-widest ${showOnlyDebts ? 'bg-orange-500 text-white border-orange-500' : 'bg-white/5 border-white/10 text-white/40'}`}>
            <ListFilter size={16} /> Dettes
          </button>
          <div className="relative w-full md:w-72 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ice-100/20 group-focus-within:text-ice-400 transition-colors" size={16} />
            <input type="text" placeholder="N° FACTURE..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 text-[11px] font-black uppercase outline-none focus:border-ice-400" />
          </div>
        </div>
      </div>

      {/* RÉSUMÉ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <div className="glass-card p-6 rounded-[2.5rem] border-orange-500/20 bg-orange-500/[0.03] flex items-center justify-between">
          <div><p className="text-[10px] font-black uppercase tracking-widest text-orange-500/50 mb-2">Dettes à encaisser</p><h2 className="text-4xl font-black italic text-orange-500">{totalDettes.toLocaleString()} F</h2></div>
          <div className="p-5 bg-orange-500/10 text-orange-500 rounded-[1.5rem] shadow-inner"><Banknote size={32} /></div>
        </div>
        <div className="glass-card p-6 rounded-[2.5rem] border-white/5 bg-white/[0.01] flex items-center justify-between">
          <div><p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2">Nombre de ventes</p><h2 className="text-4xl font-black italic text-white">{filteredInvoices.length} <span className="text-sm not-italic ml-1">FACTS</span></h2></div>
          <div className="p-5 bg-white/5 text-white/10 rounded-[1.5rem] shadow-inner"><FileText size={32} /></div>
        </div>
      </div>

      {/* LISTE DES FACTURES */}
      <div className="grid grid-cols-1 gap-2.5">
        {filteredInvoices.length > 0 ? (
          filteredInvoices.map(inv => {
            const displayNum = formatInvoiceDisplay(inv);
            const reste = inv.totalAmount - (inv.amountPaid || 0);
            return (
              <div key={inv._id} className={`glass-card p-3 rounded-[1.2rem] flex flex-wrap justify-between items-center gap-3 border transition-all ${reste > 0 ? 'border-orange-500/30 bg-orange-500/[0.02]' : 'border-white/5 hover:border-ice-400/20'}`}>
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${reste > 0 ? 'bg-orange-500/10 text-orange-500' : 'bg-white/5 text-ice-100/20'}`}><Calendar size={18} /></div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                        <p className="font-black text-base italic uppercase tracking-tighter leading-none">{displayNum}</p>
                        {reste > 0 && <span className="text-[7px] font-black bg-orange-500 text-white px-1.5 py-0.5 rounded-md uppercase">Dette</span>}
                    </div>
                    <p className="text-[8px] text-white/20 font-black uppercase">{new Date(inv.createdAt).toLocaleDateString('fr-FR')} à {new Date(inv.createdAt).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}</p>
                  </div>
                </div>

                <div className="flex items-center gap-5 ml-auto">
                  <div className="text-right">
                    <p className="text-[7px] font-black uppercase text-ice-400/40 italic">Total</p>
                    <p className="text-lg font-black italic">{Math.round(inv.totalAmount).toLocaleString()} F</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => handleWhatsAppShare(inv, displayNum)} className="p-2.5 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white rounded-lg transition-all"><MessageCircle size={16} /></button>
                    {reste > 0 && <button onClick={() => setModalPay({show: true, invoice: inv, amount: ""})} className="p-2.5 bg-orange-500 text-white rounded-lg shadow-lg shadow-orange-500/20"><Banknote size={16} /></button>}
                    <button onClick={() => generatePDF({...inv, invoiceNumber: displayNum})} className="p-2.5 bg-white/5 text-ice-400 hover:bg-ice-400 hover:text-ice-900 rounded-lg transition-all active:scale-95"><Download size={16} /></button>
                    <button onClick={() => setModalDelete({show: true, id: inv._id, num: displayNum})} className="p-2.5 bg-red-500/5 text-red-500/20 hover:text-red-500 rounded-lg transition-all active:scale-95"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white/[0.01] rounded-[2rem] border border-dashed border-white/5 opacity-30">
            <FilterX size={48} className="mb-4" />
            <p className="font-black text-white uppercase tracking-widest text-[10px]">Aucune archive</p>
          </div>
        )}
      </div>
    </div>
  );
}