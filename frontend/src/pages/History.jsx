import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ArrowLeft, Download, Calendar, Search, 
  FileText, Trash2, X, Lock, Eye, FilterX, Banknote, MessageCircle, ListFilter, Clock, User 
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
  const [showOnlyToday, setShowOnlyToday] = useState(false);
  const [userData, setUserData] = useState(null);
  const [modalDelete, setModalDelete] = useState({ show: false, id: null, num: '' });
  const [modalPay, setModalPay] = useState({ show: false, invoice: null, amount: "" });
  const [password, setPassword] = useState('');

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
      toast.error("Erreur de règlement");
    }
  };

  const handleDeleteInvoice = async (e) => {
    e.preventDefault();
    try {
      await axios.delete(`${API_URL}/api/invoices/${modalDelete.id}`, { 
        headers: config.headers, 
        data: { password } 
      });
      toast.success("Vente supprimée");
      setModalDelete({ show: false, id: null, num: '' });
      setPassword('');
      fetchInvoices();
    } catch (err) {
      toast.error("Mot de passe incorrect");
    }
  };

  const formatInvoiceDisplay = (inv) => {
    if (!inv.createdAt || !inv.invoiceNumber) return "FACT-0000";
    const dateObj = new Date(inv.createdAt);
    const dateCode = dateObj.toISOString().slice(0, 10).replace(/-/g, '');
    const rawNum = inv.invoiceNumber.split('-')[1] || "0";
    return `FACT-${dateCode}-${rawNum.replace(/\D/g, '').padStart(5, '0')}`;
  };

  // --- FONCTION WHATSAPP ---
  const handleWhatsApp = (inv) => {
    const displayNum = formatInvoiceDisplay(inv);
    const message = `Bonjour ${inv.customerName || 'Client'}, voici votre facture ${displayNum} d'un montant de ${inv.totalAmount.toLocaleString()} F. Merci de votre confiance !`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const filteredInvoices = invoices.filter(inv => {
    const term = searchTerm.toLowerCase().trim();
    const displayNum = formatInvoiceDisplay(inv).toLowerCase();
    const clientName = (inv.customerName || "client passager").toLowerCase();
    
    const isSearchMatch = displayNum.includes(term) || clientName.includes(term);
    const isToday = new Date(inv.createdAt).toDateString() === new Date().toDateString();
    const resteAPayer = inv.totalAmount - (inv.amountPaid || 0);
    const isDette = resteAPayer > 0;

    let match = isSearchMatch;
    if (showOnlyDebts) match = match && isDette;
    if (showOnlyToday) match = match && isToday;
    
    return match;
  });

  const totalDettes = invoices.reduce((acc, inv) => acc + (inv.totalAmount - (inv.amountPaid || 0)), 0);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto min-h-screen text-white font-sans">
      
      {/* MODAL SÉCURITÉ */}
      {modalDelete.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="glass-card w-full max-w-md p-8 rounded-[2.5rem] border-white/10 relative">
            <button onClick={() => setModalDelete({show:false})} className="absolute top-6 right-6 text-white/20"><X size={20}/></button>
            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-red-500/10 text-red-500 rounded-3xl mb-6"><Lock size={32} /></div>
              <h3 className="text-2xl font-black italic uppercase mb-2">Sécurité Admin</h3>
              <p className="text-white/30 text-[10px] uppercase mb-8 tracking-widest">Code requis pour {modalDelete.num}</p>
              <form onSubmit={handleDeleteInvoice} className="w-full space-y-4 text-left">
                <IceInput label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit" className="w-full py-4 rounded-2xl font-black bg-red-500 text-white uppercase">Supprimer</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RÈGLEMENT */}
      {modalPay.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95">
          <div className="glass-card w-full max-w-md p-8 rounded-[2.5rem] border-orange-500/20 relative">
            <button onClick={() => setModalPay({show:false})} className="absolute top-6 right-6 text-white/20"><X size={20}/></button>
            <div className="text-center">
              <div className="p-4 bg-orange-500/10 text-orange-500 rounded-3xl mb-4 inline-block"><Banknote size={32} /></div>
              <h3 className="text-2xl font-black italic uppercase">{modalPay.invoice.customerName || 'Client'}</h3>
              <p className="text-white/30 text-[10px] uppercase mb-8 italic">Reste dû : <span className="text-orange-500">{(modalPay.invoice.totalAmount - modalPay.invoice.amountPaid).toLocaleString()} F</span></p>
              <form onSubmit={handleSettleDebt} className="space-y-4 text-left">
                <IceInput type="number" value={modalPay.amount} onChange={(e) => setModalPay({...modalPay, amount: e.target.value})} placeholder="Montant" required />
                <button type="submit" className="w-full py-4 rounded-2xl font-black bg-orange-500 text-white uppercase">Confirmer</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-white/20 mb-6 font-black uppercase text-[10px] tracking-widest hover:text-ice-400 transition-colors"><ArrowLeft size={14} /> Dashboard</button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase">Historique</h1>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button onClick={() => setShowOnlyToday(!showOnlyToday)} className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl border transition-all font-black text-[10px] uppercase ${showOnlyToday ? 'bg-ice-400 text-ice-900 border-ice-400' : 'bg-white/5 border-white/10 text-white/40'}`}>
            <Clock size={16} /> Aujourd'hui
          </button>
          <button onClick={() => setShowOnlyDebts(!showOnlyDebts)} className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl border transition-all font-black text-[10px] uppercase ${showOnlyDebts ? 'bg-orange-500 text-white border-orange-500' : 'bg-white/5 border-white/10 text-white/40'}`}>
            <ListFilter size={16} /> Dettes
          </button>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
            <input 
              type="text" 
              placeholder="CLIENT OU FACTURE..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 text-[11px] font-black uppercase outline-none focus:border-ice-400" 
            />
          </div>
        </div>
      </div>

      {/* RÉSUMÉ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <div className="glass-card p-6 rounded-[2.5rem] border-orange-500/20 bg-orange-500/[0.03] flex items-center justify-between shadow-xl">
          <div><p className="text-[10px] font-black uppercase text-orange-500/50 mb-2">Total Dettes</p><h2 className="text-4xl font-black italic text-orange-500">{totalDettes.toLocaleString()} F</h2></div>
          <Banknote size={32} className="text-orange-500/20" />
        </div>
        <div className="glass-card p-6 rounded-[2.5rem] border-white/5 bg-white/[0.01] flex items-center justify-between">
          <div><p className="text-[10px] font-black uppercase text-white/20 mb-2">Ventes</p><h2 className="text-4xl font-black italic text-white">{filteredInvoices.length}</h2></div>
          <FileText size={32} className="text-white/10" />
        </div>
      </div>

      {/* LISTE DES FACTURES */}
      <div className="grid grid-cols-1 gap-3">
        {filteredInvoices.length > 0 ? (
          filteredInvoices.map(inv => {
            const displayNum = formatInvoiceDisplay(inv);
            const reste = inv.totalAmount - (inv.amountPaid || 0);
            return (
              <div key={inv._id} className={`p-4 rounded-[1.5rem] border flex flex-wrap justify-between items-center gap-4 transition-all ${reste > 0 ? 'border-orange-500/30 bg-orange-500/[0.03]' : 'border-white/5 bg-white/[0.02]'}`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${reste > 0 ? 'bg-orange-500/10 text-orange-500' : 'bg-ice-400/10 text-ice-400'}`}><Calendar size={20} /></div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                        <p className="font-black text-base italic uppercase tracking-tighter leading-none">{displayNum}</p>
                        {reste > 0 && <span className="text-[7px] font-black bg-orange-500 text-white px-1.5 py-0.5 rounded-md uppercase">Dette</span>}
                    </div>
                    <p className="text-[9px] text-ice-400 font-black uppercase flex items-center gap-1.5">
                      <User size={11} className="opacity-50" /> {inv.customerName || "Client Passager"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 ml-auto">
                  <div className="text-right">
                    <p className="text-xl font-black italic">{Math.round(inv.totalAmount).toLocaleString()} F</p>
                    <p className="text-[8px] text-white/20 font-black uppercase">{new Date(inv.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                  
                  {/* ACTIONS : WHATSAPP ET DÉTAILS RÉINTÉGRÉS */}
                  <div className="flex gap-1.5">
                    <button onClick={() => handleWhatsApp(inv)} className="p-3 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all">
                      <MessageCircle size={18} />
                    </button>
                    <button onClick={() => navigate(`/invoice/${inv._id}`)} className="p-3 bg-white/5 text-white/40 rounded-xl hover:text-ice-400 transition-all">
                      <Eye size={18} />
                    </button>
                    
                    {reste > 0 && <button onClick={() => setModalPay({show: true, invoice: inv, amount: ""})} className="p-3 bg-orange-500 text-white rounded-xl active:scale-90 transition-transform"><Banknote size={18} /></button>}
                    <button onClick={() => generatePDF({...inv, invoiceNumber: displayNum})} className="p-3 bg-ice-400 text-ice-900 rounded-xl active:scale-90 transition-transform"><Download size={18} /></button>
                    <button onClick={() => setModalDelete({show: true, id: inv._id, num: displayNum})} className="p-3 bg-white/5 text-red-500/30 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={18} /></button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-20"><FilterX size={48} className="mx-auto mb-4" /><p className="font-black uppercase text-[10px] tracking-widest">Aucune facture trouvée</p></div>
        )}
      </div>
    </div>
  );
}