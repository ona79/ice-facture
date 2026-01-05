import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ArrowLeft, Download, Calendar, Search, 
  FileText, Trash2, X, Lock, Eye, FilterX, Banknote, MessageCircle, ListFilter 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generatePDF } from '../utils/generatePDF';
import { IceInput } from '../components/IceInput';
import toast from 'react-hot-toast';

// --- CONFIGURATION DE L'URL API ---
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function History() {
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyDebts, setShowOnlyDebts] = useState(false);
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

  useEffect(() => { 
    fetchInvoices(); 
    // La notification automatique de 15 secondes a été supprimée ici
  }, []);

  // --- LOGIQUE DE PAIEMENT DE DETTE ---
  const handleSettleDebt = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading("Mise à jour du paiement...");
    try {
      await axios.patch(`${API_URL}/api/invoices/${modalPay.invoice._id}/pay`, 
        { amount: Number(modalPay.amount) }, 
        config
      );
      toast.dismiss(loadingToast);
      toast.success("PAIEMENT ENREGISTRÉ");
      setModalPay({ show: false, invoice: null, amount: "" });
      fetchInvoices();
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error("Erreur lors du règlement");
    }
  };

  // --- LOGIQUE DE PARTAGE WHATSAPP ---
  const handleWhatsAppShare = (inv, displayNum) => {
    const reste = inv.totalAmount - (inv.amountPaid || 0);
    const shopName = userData?.shopName?.toUpperCase() || "MA BOUTIQUE";
    
    let text = `*${shopName}*%0A` +
               `--------------------------%0A` +
               `*FACTURE :* ${displayNum}%0A` +
               `*TOTAL :* ${inv.totalAmount.toLocaleString()} FCFA%0A`;
    
    if (reste > 0) {
      text += `*RESTE À PAYER :* ${reste.toLocaleString()} FCFA%0A` +
              `⚠️ _Ceci est un rappel de paiement._%0A`;
    } else {
      text += `*STATUT :* ✅ PAYÉ%0A`;
    }
    
    text += `--------------------------%0A` +
            `Merci de votre confiance !`;

    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleVerifyAndAction = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/auth/verify-password`, { password }, config);
      
      if (isVerifyingForDetails) {
        setIsVerifyingForDetails(false);
      } else {
        await axios.delete(`${API_URL}/api/invoices/${modalDelete.id}`, {
          headers: config.headers,
          data: { password: password }
        });
        toast.success("Vente supprimée et stock mis à jour");
        setModalDelete({ show: false, id: null, num: '' });
        fetchInvoices();
      }
      setPassword('');
    } catch (err) {
      toast.error(err.response?.data?.msg || "Mot de passe incorrect");
      setPassword('');
    }
  };

  const openDetailsProtected = (inv) => {
    setModalDetails({ show: true, invoice: inv });
    setIsVerifyingForDetails(true);
    setPassword('');
  };

  const formatInvoiceDisplay = (inv) => {
    const dateObj = new Date(inv.createdAt);
    const dateCode = dateObj.toISOString().slice(0, 10).replace(/-/g, '');
    const rawNum = inv.invoiceNumber.split('-')[1] || "0";
    const paddedNum = rawNum.replace(/\D/g, '').padStart(5, '0');
    return `FACT-${dateCode}-${paddedNum}`;
  };

  const filteredInvoices = invoices.filter(inv => {
    const term = searchTerm.toLowerCase().trim();
    const displayNum = formatInvoiceDisplay(inv).toLowerCase();
    const originalNum = inv.invoiceNumber.toLowerCase();
    const isSearchMatch = displayNum.includes(term) || originalNum.includes(term);
    
    if (showOnlyDebts) {
        return isSearchMatch && (inv.totalAmount - (inv.amountPaid || 0)) > 0;
    }
    return isSearchMatch;
  });

  const totalDettes = invoices.reduce((acc, inv) => acc + (inv.totalAmount - (inv.amountPaid || 0)), 0);
  const countDettes = invoices.filter(inv => (inv.totalAmount - (inv.amountPaid || 0)) > 0).length;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto min-h-screen text-white relative font-sans">
      
      {/* 1. MODAL DE SÉCURITÉ */}
      {(modalDelete.show || (modalDetails.show && isVerifyingForDetails)) && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-md p-8 rounded-[2.5rem] border-white/10 shadow-2xl relative">
            <button 
              onClick={() => { setModalDelete({show:false}); setModalDetails({show:false}); setIsVerifyingForDetails(false); }} 
              className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors"
            >
              <X size={20}/>
            </button>
            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-red-500/10 text-red-500 rounded-3xl mb-6 shadow-inner"><Lock size={32} /></div>
              <h3 className="text-2xl font-black italic uppercase mb-2 tracking-tighter leading-none">Confidentialité</h3>
              <p className="text-ice-100/50 text-[10px] font-black uppercase tracking-widest mb-8 leading-relaxed">
                Remplissez les infos de la facture <br/> pour continuer
              </p>
              <form onSubmit={handleVerifyAndAction} className="w-full space-y-4">
                <IceInput 
                  label="Mot de passe Admin" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  autoComplete="new-password" 
                  required
                />
                <button type="submit" className="w-full py-4 rounded-2xl font-black text-[10px] uppercase bg-ice-400 text-ice-900 shadow-lg hover:bg-white transition-all tracking-widest">
                  Déverrouiller
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 2. MODAL DÉTAILS DÉVERROUILLÉE */}
      {modalDetails.show && !isVerifyingForDetails && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in zoom-in duration-300">
          <div className="glass-card w-full max-w-2xl p-8 rounded-[3rem] border-white/10 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setModalDetails({show: false, invoice: null})} className="absolute top-6 right-6 text-white/20 hover:text-white"><X size={24}/></button>
            <h2 className="text-2xl font-black italic uppercase mb-1 text-ice-400 leading-none">Détails de la vente</h2>
            <div className="flex items-center gap-3 mb-8">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">{modalDetails.invoice.invoiceNumber}</p>
                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${modalDetails.invoice.totalAmount - modalDetails.invoice.amountPaid > 0 ? 'bg-orange-500 text-white' : 'bg-ice-400/20 text-ice-400'}`}>
                    {modalDetails.invoice.totalAmount - modalDetails.invoice.amountPaid > 0 ? 'Dette' : 'Payé'}
                </span>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-4 text-[9px] font-black uppercase tracking-widest text-ice-400/40 px-4 mb-2">
                <span className="col-span-2">Article</span>
                <span className="text-center">Qté</span>
                <span className="text-right">Sous-total</span>
              </div>
              
              {modalDetails.invoice.items.map((item, idx) => (
                <div key={idx} className="bg-white/[0.02] p-4 rounded-2xl grid grid-cols-4 items-center border border-white/5 hover:bg-white/[0.05] transition-colors">
                  <div className="col-span-2">
                    <p className="font-black text-sm uppercase tracking-tight">{item.name}</p>
                    <p className="text-[9px] font-bold text-white/20 uppercase italic">{item.price.toLocaleString()} F / unité</p>
                  </div>
                  <div className="text-center">
                    <p className="font-black text-ice-400 italic text-lg">x{item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black italic text-sm">{(item.price * item.quantity).toLocaleString()} F</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 pt-8 border-t border-white/5 flex justify-between items-end">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-[9px] font-black uppercase text-white/20 tracking-widest mb-1">Résumé Financier</p>
                    <p className="text-xs font-black uppercase italic">Versé: {modalDetails.invoice.amountPaid?.toLocaleString()} F</p>
                    <p className={`text-xs font-black uppercase italic ${modalDetails.invoice.totalAmount - modalDetails.invoice.amountPaid > 0 ? 'text-orange-500' : 'text-ice-400'}`}>
                        Reste: {(modalDetails.invoice.totalAmount - modalDetails.invoice.amountPaid).toLocaleString()} F
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-[9px] font-black uppercase text-ice-400 tracking-widest mb-1">Total Encaissé</p>
                    <p className="text-4xl font-black italic tracking-tighter leading-none">{Math.round(modalDetails.invoice.totalAmount).toLocaleString()} <span className="text-xs not-italic ml-1">F</span></p>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. MODAL ENCAISSEMENT DETTE */}
      {modalPay.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-md p-8 rounded-[2.5rem] border-orange-500/20 shadow-2xl relative">
            <button onClick={() => setModalPay({show:false, invoice:null, amount:""})} className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors"><X size={20}/></button>
            <div className="text-center">
              <div className="p-4 bg-orange-500/10 text-orange-500 rounded-3xl mb-6 inline-block shadow-inner"><Banknote size={32} /></div>
              <h3 className="text-2xl font-black italic uppercase mb-1 tracking-tighter">Régler la dette</h3>
              <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-8">Dette actuelle : <span className="text-orange-500">{(modalPay.invoice.totalAmount - modalPay.invoice.amountPaid).toLocaleString()} F</span></p>
              <form onSubmit={handleSettleDebt} className="w-full space-y-4">
                <IceInput label="Montant du versement" type="number" value={modalPay.amount} onChange={(e) => setModalPay({...modalPay, amount: e.target.value})} placeholder="Ex: 5000" required />
                <button type="submit" className="w-full py-4 rounded-2xl font-black text-[10px] uppercase bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:bg-orange-400 transition-all tracking-widest">
                  Confirmer le paiement
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-ice-100/30 mb-6 font-black uppercase text-[10px] tracking-widest hover:text-ice-400 transition-colors">
        <ArrowLeft size={14} /> Retour Dashboard
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Historique</h1>
          <p className="text-ice-400 text-[9px] font-black uppercase tracking-[0.4em] mt-2 italic opacity-50">Gestion des archives</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button 
            onClick={() => setShowOnlyDebts(!showOnlyDebts)}
            className={`flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 rounded-xl border transition-all font-black text-[10px] uppercase tracking-widest ${showOnlyDebts ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'}`}
          >
            <ListFilter size={16} />
            {showOnlyDebts ? 'Voir Tout' : 'Dettes Uniquement'}
          </button>
          <div className="relative w-full md:w-72 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ice-100/20 group-focus-within:text-ice-400 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="N° FACTURE..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:border-ice-400 outline-none text-[11px] font-black uppercase transition-all tracking-widest placeholder:text-white/10" 
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 animate-in slide-in-from-top-4 duration-700">
        <div className="glass-card p-6 rounded-[2.5rem] border-orange-500/20 bg-orange-500/[0.03] flex items-center justify-between group hover:bg-orange-500/[0.06] transition-all">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500/50 mb-2">Dettes à encaisser</p>
            <h2 className="text-4xl font-black italic tracking-tighter text-orange-500">
              {totalDettes.toLocaleString()} <span className="text-sm not-italic ml-1">F</span>
            </h2>
          </div>
          <div className="p-5 bg-orange-500/10 text-orange-500 rounded-[1.5rem] group-hover:scale-110 transition-transform shadow-inner">
            <Banknote size={32} />
          </div>
        </div>

        <div className="glass-card p-6 rounded-[2.5rem] border-white/5 bg-white/[0.01] flex items-center justify-between group hover:bg-white/[0.03] transition-all">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-2">Dossiers en attente</p>
            <h2 className="text-4xl font-black italic tracking-tighter text-white">
              {countDettes} <span className="text-sm not-italic ml-1">CLIENTS</span>
            </h2>
          </div>
          <div className="p-5 bg-white/5 text-white/10 rounded-[1.5rem] group-hover:text-ice-400 transition-colors shadow-inner">
            <FileText size={32} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {filteredInvoices.length > 0 ? (
          filteredInvoices.map(inv => {
            const displayNum = formatInvoiceDisplay(inv);
            const reste = inv.totalAmount - (inv.amountPaid || 0);
            const isDette = reste > 0;

            return (
              <div key={inv._id} className={`glass-card p-3 rounded-[1.2rem] flex flex-wrap justify-between items-center gap-3 border transition-all group shadow-sm ${isDette ? 'border-orange-500/30 bg-orange-500/[0.02]' : 'border-white/5 hover:border-ice-400/20'}`}>
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl transition-all ${isDette ? 'bg-orange-500/10 text-orange-500' : 'bg-white/5 text-ice-100/20 group-hover:text-ice-400'}`}>
                    <Calendar size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                        <p className="font-black text-base italic tracking-tighter uppercase leading-none">{displayNum}</p>
                        <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase ${isDette ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20' : 'bg-ice-400/20 text-ice-400'}`}>
                            {isDette ? 'Dette' : 'Payé'}
                        </span>
                    </div>
                    <p className="text-[8px] text-white/20 font-black uppercase tracking-widest">
                      {new Date(inv.createdAt).toLocaleDateString('fr-FR')} • {new Date(inv.createdAt).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-5 ml-auto w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-white/5 pt-2.5 sm:pt-0">
                  <div className="text-right">
                    <p className="text-[7px] font-black uppercase text-ice-400/40 tracking-widest italic">Montant Total</p>
                    <p className="text-lg font-black italic tracking-tighter">{Math.round(inv.totalAmount).toLocaleString()} F</p>
                  </div>
                  
                  <div className="flex gap-1.5">
                    <button onClick={() => handleWhatsAppShare(inv, displayNum)} className="p-2.5 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white rounded-lg transition-all active:scale-95" title="WhatsApp">
                      <MessageCircle size={16} />
                    </button>
                    {isDette && (
                      <button onClick={() => setModalPay({show: true, invoice: inv, amount: ""})} className="p-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-400 transition-all active:scale-95 shadow-lg shadow-orange-500/20" title="Encaisser la dette">
                        <Banknote size={16} />
                      </button>
                    )}
                    <button onClick={() => openDetailsProtected({...inv, invoiceNumber: displayNum})} className="p-2.5 bg-white/5 text-white/20 hover:text-ice-400 rounded-lg transition-all active:scale-95">
                      <Eye size={16} />
                    </button>
                    <button onClick={() => generatePDF({...inv, invoiceNumber: displayNum})} className="p-2.5 bg-white/5 text-ice-400 hover:bg-ice-400 hover:text-ice-900 rounded-lg transition-all active:scale-95">
                      <Download size={16} />
                    </button>
                    <button onClick={() => setModalDelete({show: true, id: inv._id, num: displayNum})} className="p-2.5 bg-red-500/5 text-red-500/20 hover:text-red-500 rounded-lg transition-all active:scale-95">
                      <Trash2 size={16} />
                    </button>
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