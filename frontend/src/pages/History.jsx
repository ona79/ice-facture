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
    const paddedNum = rawNum.padStart(5, '0');
    return `FACT-${dateCode}-${paddedNum}`;
  };

  const filteredInvoices = invoices.filter(inv => {
    const term = searchTerm.toLowerCase().trim();
    const displayNum = formatInvoiceDisplay(inv).toLowerCase();
    const originalNum = inv.invoiceNumber.toLowerCase();
    return displayNum.includes(term) || originalNum.includes(term);
  });

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
              <h3 className="text-2xl font-black italic uppercase mb-2 tracking-tighter leading-none">Accès Restreint</h3>
              <p className="text-ice-100/50 text-[10px] font-black uppercase tracking-widest mb-8 leading-relaxed">
                Confirmez votre identité pour <br/> {modalDelete.show ? 'supprimer' : 'voir les détails'}
              </p>
              <form onSubmit={handleVerifyAndAction} className="w-full space-y-4">
                <IceInput 
                  label="Mot de passe Admin" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  autoComplete="new-password" // Bloque le remplissage automatique
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

      {/* 2. MODAL DÉTAILS DÉVERROUILLÉE (Correction décalage Quantité) */}
      {modalDetails.show && !isVerifyingForDetails && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in zoom-in duration-300">
          <div className="glass-card w-full max-w-2xl p-8 rounded-[3rem] border-white/10 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setModalDetails({show: false, invoice: null})} className="absolute top-6 right-6 text-white/20 hover:text-white"><X size={24}/></button>
            <h2 className="text-2xl font-black italic uppercase mb-1 text-ice-400 leading-none">Détails de la vente</h2>
            <p className="text-[10px] font-black text-white/20 mb-8 uppercase tracking-[0.3em]">{modalDetails.invoice.invoiceNumber}</p>
            
            <div className="space-y-3">
              {/* En-tête de colonnes avec grille alignée */}
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
                  {/* Quantité centrée proprement */}
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
                <div>
                    <p className="text-[9px] font-black uppercase text-white/20 tracking-widest mb-1">Date & Heure</p>
                    <p className="text-xs font-black uppercase italic">{new Date(modalDetails.invoice.createdAt).toLocaleString('fr-FR')}</p>
                </div>
                <div className="text-right">
                    <p className="text-[9px] font-black uppercase text-ice-400 tracking-widest mb-1">Total Encaissé</p>
                    <p className="text-4xl font-black italic tracking-tighter leading-none">{Math.round(modalDetails.invoice.totalAmount).toLocaleString()} <span className="text-xs not-italic ml-1">F</span></p>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* --- INTERFACE PRINCIPALE (Cartes réduites en taille) --- */}
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-ice-100/30 mb-8 font-black uppercase text-[10px] tracking-widest hover:text-ice-400 transition-colors">
        <ArrowLeft size={14} /> Retour Dashboard
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">Historique</h1>
          <p className="text-ice-400 text-[10px] font-black uppercase tracking-[0.4em] mt-2 italic opacity-50">Gestion des archives</p>
        </div>
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ice-100/20 group-focus-within:text-ice-400 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="N° FACTURE OU DATE..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:border-ice-400 focus:bg-white/10 outline-none text-xs font-black uppercase transition-all tracking-widest placeholder:text-white/10" 
          />
        </div>
      </div>

      {/* Cartes plus compactes : passage de p-5 à p-4 */}
      <div className="grid grid-cols-1 gap-3">
        {filteredInvoices.length > 0 ? (
          filteredInvoices.map(inv => {
            const displayNum = formatInvoiceDisplay(inv);
            const dateObj = new Date(inv.createdAt);

            return (
              <div key={inv._id} className="glass-card p-4 rounded-[1.5rem] flex flex-wrap justify-between items-center gap-4 border border-white/5 hover:border-ice-400/30 transition-all group hover:translate-x-1 shadow-md">
                <div className="flex items-center gap-4">
                  <div className="bg-white/5 p-3 rounded-xl text-ice-100/20 group-hover:text-ice-400 group-hover:bg-ice-400/10 transition-all">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="font-black text-lg italic tracking-tighter uppercase leading-none mb-1.5">{displayNum}</p>
                    <p className="text-[9px] text-white/20 font-black uppercase tracking-widest">
                      {dateObj.toLocaleDateString('fr-FR')} • {dateObj.toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 ml-auto w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
                  <div className="text-right">
                    <p className="text-[8px] font-black uppercase text-ice-400/40 tracking-widest mb-0.5 italic">Montant</p>
                    <p className="text-xl font-black italic tracking-tighter">{Math.round(inv.totalAmount).toLocaleString()} F</p>
                  </div>
                  
                  <div className="flex gap-1.5">
                    <button onClick={() => openDetailsProtected({...inv, invoiceNumber: displayNum})} className="p-3 bg-white/5 text-white/20 hover:text-ice-400 hover:bg-ice-400/10 rounded-xl transition-all active:scale-90 shadow-lg">
                      <Eye size={18} />
                    </button>
                    <button onClick={() => generatePDF({...inv, invoiceNumber: displayNum})} className="p-3 bg-white/5 text-ice-400 hover:bg-ice-400 hover:text-ice-900 rounded-xl transition-all active:scale-90 shadow-lg">
                      <Download size={18} />
                    </button>
                    <button onClick={() => setModalDelete({show: true, id: inv._id, num: displayNum})} className="p-3 bg-red-500/5 text-red-500/20 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all active:scale-90 shadow-lg">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white/[0.01] rounded-[3.5rem] border border-dashed border-white/5">
            <FilterX size={64} className="text-white/[0.02] mb-6" />
            <p className="font-black text-white/10 uppercase tracking-[0.5em] text-xs italic">Aucune archive correspondante</p>
          </div>
        )}
      </div>
    </div>
  );
}