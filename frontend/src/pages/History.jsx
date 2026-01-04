import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ArrowLeft, Download, Calendar, Search, 
  FileText, Trash2, X, Lock, Eye, FilterX
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generatePDF } from '../utils/generatePDF';
import { IceInput } from '../components/IceInput';
import toast from 'react-hot-toast';

export default function History() {
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalDelete, setModalDelete] = useState({ show: false, id: null, num: '' });
  const [modalDetails, setModalDetails] = useState({ show: false, invoice: null });
  const [password, setPassword] = useState('');
  const [isVerifyingForDetails, setIsVerifyingForDetails] = useState(false);

  const navigate = useNavigate();
  const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

  const fetchInvoices = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/invoices', config);
      const sortedData = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setInvoices(sortedData);
    } catch (err) {
      console.error("Erreur chargement historique:", err);
    }
  };

  useEffect(() => { fetchInvoices(); }, []);

  const handleVerifyAndAction = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/auth/verify-password', { password }, config);
      if (isVerifyingForDetails) {
        setIsVerifyingForDetails(false);
      } else {
        await axios.delete(`http://localhost:5000/api/invoices/${modalDelete.id}`, {
          headers: config.headers,
          data: { password: password }
        });
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

  const openDetailsProtected = (inv) => {
    setModalDetails({ show: true, invoice: inv });
    setIsVerifyingForDetails(true);
    setPassword('');
  };

  // --- FONCTION DE FORMATAGE POUR LE NUMÉRO À 5 CHIFFRES ---
  const formatInvoiceDisplay = (inv) => {
    const dateObj = new Date(inv.createdAt);
    const dateCode = dateObj.toISOString().slice(0, 10).replace(/-/g, '');
    // Extrait le chiffre de FAC-001 et le met sur 5 positions (00001)
    const rawNum = inv.invoiceNumber.split('-')[1] || "0";
    const paddedNum = rawNum.padStart(5, '0');
    return `FACT-${dateCode}-${paddedNum}`;
  };

  const filteredInvoices = invoices.filter(inv => {
    const term = searchTerm.toLowerCase().trim();
    const displayNum = formatInvoiceDisplay(inv).toLowerCase();
    const originalNum = inv.invoiceNumber.toLowerCase();
    // Recherche insensible à la casse dans le nouveau et l'ancien numéro
    return displayNum.includes(term) || originalNum.includes(term);
  });

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto min-h-screen text-white relative">
      
      {/* 1. MODAL DE SÉCURITÉ */}
      {(modalDelete.show || (modalDetails.show && isVerifyingForDetails)) && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="glass-card w-full max-w-md p-8 rounded-[2.5rem] border-white/10 shadow-2xl relative">
            <button onClick={() => { setModalDelete({show:false}); setModalDetails({show:false}); setIsVerifyingForDetails(false); }} className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors"><X size={20}/></button>
            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl mb-6"><Lock size={32} /></div>
              <h3 className="text-2xl font-black italic uppercase mb-2">Accès Restreint</h3>
              <p className="text-ice-100/50 text-sm mb-8 leading-relaxed">Saisissez votre mot de passe pour continuer</p>
              <form onSubmit={handleVerifyAndAction} className="w-full space-y-4">
                <IceInput 
                  label="Mot de passe Admin" 
                  type="password" value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  autoComplete="new-password"
                  onFocus={(e) => e.target.removeAttribute('readonly')}
                  readOnly
                />
                <button type="submit" className="w-full py-4 rounded-2xl font-black text-[10px] uppercase bg-ice-400 text-ice-900 shadow-lg hover:bg-white transition-all">Confirmer</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 2. MODAL DÉTAILS DÉVERROUILLÉE */}
      {modalDetails.show && !isVerifyingForDetails && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-2xl p-8 rounded-[3rem] border-white/10 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setModalDetails({show: false, invoice: null})} className="absolute top-6 right-6 text-white/20 hover:text-white"><X size={24}/></button>
            <h2 className="text-2xl font-black italic uppercase mb-1 text-ice-400">Détails de la vente</h2>
            <p className="text-xs font-bold text-white/40 mb-8 uppercase tracking-widest">{formatInvoiceDisplay(modalDetails.invoice)}</p>
            <div className="space-y-4">
              <div className="grid grid-cols-4 text-[10px] font-black uppercase tracking-widest text-white/20 px-4">
                <span className="col-span-2">Produit</span>
                <span className="text-center">Qté</span>
                <span className="text-right">Total</span>
              </div>
              {modalDetails.invoice.items.map((item, idx) => (
                <div key={idx} className="bg-white/5 p-4 rounded-2xl flex justify-between items-center border border-white/5">
                  <div className="col-span-2">
                    <p className="font-bold text-sm">{item.name}</p>
                    <p className="text-[10px] text-white/30">{item.price.toLocaleString()} F / unité</p>
                  </div>
                  <p className="font-black text-ice-400">x{item.quantity}</p>
                  <p className="font-black">{(item.price * item.quantity).toLocaleString()} F</p>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-end">
                <div>
                    <p className="text-[10px] font-black uppercase text-white/20">Date de transaction</p>
                    <p className="text-sm font-bold">{new Date(modalDetails.invoice.createdAt).toLocaleString('fr-FR')}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-ice-400">Montant Total</p>
                    <p className="text-3xl font-black">{Math.round(modalDetails.invoice.totalAmount).toLocaleString()} F</p>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* --- INTERFACE PRINCIPALE --- */}
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-ice-100/50 mb-6 font-black uppercase text-[9px] tracking-widest hover:text-ice-400 transition-colors">
        <ArrowLeft size={14} /> Retour Dashboard
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter uppercase">Historique</h1>
          <p className="text-ice-100/30 text-[9px] font-bold uppercase tracking-[0.3em]">Archives des transactions</p>
        </div>
        <div className="relative w-full md:w-72 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ice-100/30 group-focus-within:text-ice-400 transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Rechercher..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:border-ice-400/50 outline-none text-xs font-bold transition-all" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filteredInvoices.length > 0 ? (
          filteredInvoices.map(inv => {
            const displayNum = formatInvoiceDisplay(inv);
            const dateObj = new Date(inv.createdAt);

            return (
              <div key={inv._id} className="glass-card p-4 rounded-2xl flex flex-wrap justify-between items-center gap-4 border border-white/5 hover:border-white/10 transition-all group shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="bg-ice-400/10 p-3 rounded-xl text-ice-400 group-hover:bg-ice-400 group-hover:text-ice-900 transition-all">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="font-black text-lg tracking-tighter uppercase">{displayNum}</p>
                    <p className="text-[9px] text-white/30 font-black uppercase tracking-widest">
                      {dateObj.toLocaleDateString('fr-FR')} • {dateObj.toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 ml-auto">
                  <div className="text-right mr-4">
                    <p className="text-[8px] font-black uppercase text-white/20 tracking-widest mb-0.5">Total Encaissé</p>
                    <p className="text-xl font-black text-ice-400 tracking-tight">{Math.round(inv.totalAmount).toLocaleString()} F</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button onClick={() => openDetailsProtected({...inv, invoiceNumber: displayNum})} className="p-2.5 bg-white/5 text-white/40 hover:text-ice-400 hover:bg-white/10 rounded-xl transition-all">
                      <Eye size={18} />
                    </button>
                    <button onClick={() => generatePDF({...inv, invoiceNumber: displayNum})} className="p-2.5 bg-white/5 text-ice-400 hover:bg-ice-400 hover:text-ice-900 rounded-xl transition-all">
                      <Download size={18} />
                    </button>
                    <button onClick={() => setModalDelete({show: true, id: inv._id, num: displayNum})} className="p-2.5 bg-white/5 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-[3rem] border border-dashed border-white/10 opacity-50">
            <FilterX size={48} className="text-white/10 mb-4" />
            <p className="font-black text-ice-100/20 uppercase tracking-widest text-xs">Aucune facture trouvée</p>
          </div>
        )}
      </div>
    </div>
  );
}