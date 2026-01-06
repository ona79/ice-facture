```javascript
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ArrowLeft, Download, Calendar, Search,
  FileText, Trash2, X, Lock, Eye, FilterX, Banknote, MessageCircle, ListFilter, Clock, User, Printer 
} from 'lucide-react';
import { motion } from 'framer-motion';
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
  const [modalDelete, setModalDelete] = useState({ show: false, id: null, num: '' });
  const [modalPay, setModalPay] = useState({ show: false, invoice: null, amount: "" });
  const [modalDetail, setModalDetail] = useState({ show: false, invoice: null });
  const [password, setPassword] = useState('');

  const navigate = useNavigate();
  const config = { headers: { Authorization: `Bearer ${ localStorage.getItem('token') } ` } };

  const fetchInvoices = async () => {
    try {
      const res = await axios.get(`${ API_URL } /api/invoices`, config);
      const sortedData = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setInvoices(sortedData);
    } catch (err) {
      console.error("Erreur chargement historique:", err);
    }
  };

  useEffect(() => { fetchInvoices(); }, []);

  const formatInvoiceDisplay = (inv) => {
    if (!inv.createdAt || !inv.invoiceNumber) return "FACT-0000";
    const dateObj = new Date(inv.createdAt);
    const dateCode = dateObj.toISOString().slice(0, 10).replace(/-/g, '');
    const parts = inv.invoiceNumber.split('-');
    const rawNum = parts[parts.length - 1];
    const cleanNum = rawNum.replace(/\D/g, '').padStart(4, '0');
    return `FACT - ${ dateCode } -${ cleanNum } `;
  };

  // --- LOGIQUE DE PAIEMENT SÉCURISÉE ---
  const handleSettleDebt = async (e) => {
    e.preventDefault();
    const resteAPayer = modalPay.invoice.totalAmount - (modalPay.invoice.amountPaid || 0);
    const montantSaisi = parseFloat(modalPay.amount);

    if (montantSaisi > resteAPayer) {
      toast.error(`MONTANT TROP ÉLEVÉ! LA DETTE EST DE ${ resteAPayer } F`);
      return;
    }

    const loadingToast = toast.loading("Mise à jour...");
    try {
      await axios.patch(`${ API_URL } /api/invoices / ${ modalPay.invoice._id }/pay`,
{ amount: montantSaisi }, config
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

// --- FONCTION WHATSAPP CORRIGÉE (Fidèle & Directe) ---
const handleWhatsApp = (inv) => {
  const displayNum = formatInvoiceDisplay(inv);
  const shopName = localStorage.getItem('shopName') || "votre boutique";

  // Message optimisé et engageant
  const message = `Bonjour ${inv.customerName || 'Client'} 👋,\n\nMerci pour votre visite chez *${shopName}* !\nVoici votre facture *${displayNum}* d'un montant de *${inv.totalAmount.toLocaleString()} F*.\n\nVous trouverez le détail ci-dessous. À bientôt ! 🚀`;

  // Si un numéro est enregistré, on l'utilise directement
  if (inv.customerPhone && inv.customerPhone.trim() !== "") {
    const cleanPhone = inv.customerPhone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('221') ? cleanPhone : `221${cleanPhone}`;
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
  } else {
    // Sinon, comportement par défaut (choix du contact manuel)
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }
};

const filteredInvoices = invoices.filter(inv => {
  const term = searchTerm.toLowerCase().trim();
  const displayNum = formatInvoiceDisplay(inv).toLowerCase();
  const clientName = (inv.customerName || "client passager").toLowerCase();
  const isSearchMatch = displayNum.includes(term) || clientName.includes(term);
  const isToday = new Date(inv.createdAt).toDateString() === new Date().toDateString();
  const isDette = (inv.totalAmount - (inv.amountPaid || 0)) > 0;

  let match = isSearchMatch;
  if (showOnlyDebts) match = match && isDette;
  if (showOnlyToday) match = match && isToday;
  return match;
});

const totalDettes = invoices.reduce((acc, inv) => {
  const reste = inv.totalAmount - (inv.amountPaid || 0);
  return reste > 0 ? acc + reste : acc;
}, 0);

return (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3 }}
    className="p-3 md:p-5 max-w-5xl mx-auto min-h-screen text-white font-sans"
  >

    {/* MODAL PAIEMENT */}
    {modalPay.show && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm">
        <div className="glass-card w-full max-w-sm p-6 rounded-[2rem] border-orange-500/20 relative shadow-2xl">
          <button onClick={() => setModalPay({ show: false })} className="absolute top-5 right-5 text-white/20"><X size={18} /></button>
          <div className="text-center">
            <div className="p-3 bg-orange-500/10 text-orange-500 rounded-2xl mb-3 inline-block"><Banknote size={24} /></div>
            <h3 className="text-xl font-black italic uppercase tracking-tighter">{modalPay.invoice.customerName || 'Client'}</h3>
            <p className="text-white/30 text-[9px] uppercase mb-6 italic">Reste à payer : <span className="text-orange-500">{(modalPay.invoice.totalAmount - (modalPay.invoice.amountPaid || 0)).toLocaleString()} F</span></p>

            <form onSubmit={handleSettleDebt} className="space-y-3">
              <IceInput
                type="number"
                value={modalPay.amount}
                onChange={(e) => setModalPay({ ...modalPay, amount: e.target.value })}
                placeholder="MONTANT VERSÉ"
                required
              />
              <button type="submit" className="w-full py-3 rounded-xl font-black bg-orange-500 text-white uppercase text-xs active:scale-95 transition-all shadow-lg shadow-orange-500/20">Valider le paiement</button>
            </form>
          </div>
        </div>
      </div>
    )}

    {/* MODAL DÉTAILS */}
    {modalDetail.show && (
      <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
        <div className="glass-card w-full max-w-md p-5 rounded-[1.5rem] border-white/10 relative shadow-2xl animate-in zoom-in duration-150">
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
                    <td className="p-2 pr-3 text-right">{(item.price * item.quantity).toLocaleString()}</td>
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
            <button onClick={() => generatePDF({ ...modalDetail.invoice, invoiceNumber: formatInvoiceDisplay(modalDetail.invoice) })} className="flex items-center gap-2 bg-ice-400 text-ice-900 px-4 py-2 rounded-lg font-black uppercase text-[9px] hover:scale-105 transition-all shadow-lg shadow-ice-400/20">
              <Printer size={14} /> Imprimer
            </button>
          </div>
        </div>
      </div>
    )}

    {/* MODAL SUPPRESSION */}
    {modalDelete.show && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
        <div className="glass-card w-full max-w-sm p-6 rounded-[2rem] border-white/10 relative shadow-2xl text-center">
          <button onClick={() => setModalDelete({ show: false })} className="absolute top-5 right-5 text-white/20"><X size={18} /></button>
          <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl mb-4 inline-block"><Lock size={24} /></div>
          <h3 className="text-xl font-black italic uppercase mb-1">votre mot de pass</h3>
          <p className="text-[8px] font-black uppercase text-white/20 mb-6">{modalDelete.num}</p>
          <form onSubmit={handleDeleteInvoice} className="w-full space-y-3">
            <IceInput label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit" className="w-full py-3 rounded-xl font-black bg-red-500 text-white uppercase text-xs active:scale-95 transition-all shadow-lg">Supprimer</button>
          </form>
        </div>
      </div>
    )}

    {/* DASHBOARD HEADER */}
    <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-white/20 mb-4 font-black uppercase text-[8px] tracking-[0.2em] hover:text-ice-400"><ArrowLeft size={12} /> Dashboard</button>

    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6">
      <h1 className="text-3xl font-black italic tracking-tighter uppercase">FACTURES</h1>
      <div className="flex flex-wrap gap-2 w-full md:w-auto">
        <button onClick={() => setShowOnlyToday(!showOnlyToday)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all font-black text-[8px] uppercase ${showOnlyToday ? 'bg-ice-400 text-ice-900 border-ice-400' : 'bg-white/5 border-white/10 text-white/30'}`}><Clock size={12} /> Aujourd'hui</button>
        <button onClick={() => setShowOnlyDebts(!showOnlyDebts)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all font-black text-[8px] uppercase ${showOnlyDebts ? 'bg-orange-500 text-white border-orange-500' : 'bg-white/5 border-white/10 text-white/30'}`}><ListFilter size={12} /> Dettes</button>
        <div className="relative flex-1 md:w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={12} />
          <input type="text" placeholder="RECHERCHER..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 pl-8 text-[9px] font-black uppercase outline-none focus:border-ice-400" />
        </div>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3 mb-6">
      <div className="glass-card p-4 rounded-[1.5rem] border-orange-500/20 bg-orange-500/[0.03] flex items-center justify-between shadow-lg">
        <div><p className="text-[8px] font-black uppercase text-orange-500/50 mb-1">Dettes Totales</p><h2 className="text-xl font-black italic text-orange-500 leading-none">{totalDettes.toLocaleString()} F</h2></div>
        <Banknote size={20} className="text-orange-500/20" />
      </div>
      <div className="glass-card p-4 rounded-[1.5rem] border-white/5 bg-white/[0.01] flex items-center justify-between shadow-lg">
        <div><p className="text-[8px] font-black uppercase text-white/20 mb-1">Ventes</p><h2 className="text-xl font-black italic text-white leading-none">{filteredInvoices.length}</h2></div>
        <FileText size={20} className="text-white/10" />
      </div>
    </div>

    {/* LISTE DES FACTURES */}
    <div className="space-y-2 pb-10">
      {filteredInvoices.map(inv => {
        const displayNum = formatInvoiceDisplay(inv);
        const reste = inv.totalAmount - (inv.amountPaid || 0);
        return (
          <div key={inv._id} className={`p-2.5 rounded-[1rem] border flex items-center justify-between gap-3 transition-all ${reste > 0 ? 'border-orange-500/20 bg-orange-500/[0.02]' : 'border-white/5 bg-white/[0.01]'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${reste > 0 ? 'bg-orange-500/10 text-orange-500' : 'bg-ice-400/10 text-ice-400'}`}><Calendar size={16} /></div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-black text-xs italic uppercase tracking-tighter leading-none">{displayNum}</p>
                  {reste > 0 && <span className="text-[5px] font-black bg-orange-500 text-white px-1 py-0.5 rounded uppercase leading-none shadow-sm shadow-orange-500/20">Dette</span>}
                </div>
                <p className="text-[7px] text-ice-400 font-black uppercase mt-1 flex items-center gap-1.5 opacity-60"><User size={9} /> {inv.customerName || "Client Passager"}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 ml-auto">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black italic">{Math.round(inv.totalAmount).toLocaleString()} F</p>
                <p className="text-[6px] text-white/20 font-black uppercase">{new Date(inv.createdAt).toLocaleDateString()}</p>
              </div>

              <div className="flex gap-1">
                {/* BOUTON WHATSAPP RELIÉ AU NUMÉRO */}
                <button
                  onClick={() => handleWhatsApp(inv)}
                  className={`p-2 rounded-lg transition-all ${inv.customerPhone ? 'bg-green-500/10 text-green-500' : 'bg-white/5 text-white/20'}`}
                >
                  <MessageCircle size={14} />
                </button>

                <button onClick={() => setModalDetail({ show: true, invoice: inv })} className="p-2 bg-white/5 text-white/40 rounded-lg hover:text-ice-400 transition-all"><Eye size={14} /></button>
                {reste > 0 && <button onClick={() => setModalPay({ show: true, invoice: inv, amount: "" })} className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all shadow-md shadow-orange-500/10"><Banknote size={14} /></button>}
                <button onClick={() => generatePDF({ ...inv, invoiceNumber: displayNum })} className="p-2 bg-ice-400 text-ice-900 rounded-lg hover:bg-ice-300 transition-all shadow-md shadow-ice-400/10"><Download size={14} /></button>
                <button onClick={() => setModalDelete({ show: true, id: inv._id, num: displayNum })} className="p-2 bg-white/5 text-red-500/30 hover:text-red-500 rounded-lg transition-all"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </motion.div>
);
}
// --- FIN DU COMPOSANT HISTORY ---