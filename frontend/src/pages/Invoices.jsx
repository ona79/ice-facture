import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, FileText, ArrowLeft, X, Lock, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { IceInput } from '../components/IceInput';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [modal, setModal] = useState({ show: false, invoiceId: null, invoiceNum: '' });
  const [password, setPassword] = useState('');
  
  const navigate = useNavigate();
  // On récupère le token pour les requêtes authentifiées
  const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

  useEffect(() => { fetchInvoices(); }, []);

  const fetchInvoices = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/invoices', config);
      setInvoices(res.data);
    } catch (err) { console.error(err); }
  };

  const openDeleteModal = (id, num) => {
    setPassword('');
    setModal({ show: true, invoiceId: id, invoiceNum: num });
  };

  const handleFinalDelete = async () => {
    try {
      // On envoie le mot de passe dans le corps (body) de la requête DELETE
      // Note: axios.delete prend les données dans une propriété 'data'
      await axios.delete(`http://localhost:5000/api/invoices/${modal.invoiceId}`, {
        headers: config.headers,
        data: { password: password } 
      });

      // Si le code arrive ici, la suppression a réussi
      setInvoices(invoices.filter(i => i._id !== modal.invoiceId));
      setModal({ show: false, invoiceId: null, invoiceNum: '' });
      setPassword('');
      alert("Facture supprimée et stock mis à jour.");
      
    } catch (err) {
      // On affiche le message d'erreur envoyé par le backend (ex: Mot de passe incorrect)
      const errorMsg = err.response?.data?.msg || "Erreur lors de la suppression";
      alert(errorMsg);
      setPassword('');
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto min-h-screen text-white pb-20 relative">
      
      {/* MODAL DE SÉCURITÉ */}
      {modal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-md p-8 rounded-[2.5rem] border-white/10 shadow-2xl relative">
            <button onClick={() => setModal({show: false})} className="absolute top-6 right-6 text-white/20 hover:text-white"><X size={20}/></button>
            
            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl mb-6">
                <Lock size={32} />
              </div>
              
              <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-2">Sécurité Facture</h3>
              <p className="text-ice-100/50 text-sm mb-8">
                Supprimer la facture <span className="text-white font-bold">{modal.invoiceNum}</span> ? <br/>
                Cette action remettra les articles en stock.
              </p>

              <div className="w-full space-y-4">
                <IceInput 
                  label="Mot de passe admin" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                
                <div className="grid grid-cols-2 gap-3 mt-8">
                  <button onClick={() => setModal({show: false})} className="py-4 rounded-2xl font-bold text-[10px] uppercase bg-white/5 hover:bg-white/10 transition-all">Annuler</button>
                  <button 
                    onClick={handleFinalDelete}
                    disabled={!password}
                    className={`py-4 rounded-2xl font-black text-[10px] uppercase transition-all ${
                      password ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20' : 'bg-white/5 text-white/20 cursor-not-allowed'
                    }`}
                  >
                    Confirmer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-ice-100/50 mb-8 font-bold uppercase text-xs hover:text-ice-400">
        <ArrowLeft size={16} /> Retour Dashboard
      </button>

      <h1 className="text-4xl font-black italic mb-8 uppercase tracking-tighter">Historique des Ventes</h1>

      {/* LISTE DES FACTURES */}
      <div className="grid gap-4">
        {invoices.length === 0 ? (
          <p className="text-center text-ice-100/20 py-10 font-bold uppercase tracking-widest italic">Aucune vente enregistrée</p>
        ) : (
          invoices.map(inv => (
            <div key={inv._id} className="glass-card p-6 rounded-3xl flex justify-between items-center border-white/5 hover:border-ice-400/20 transition-all">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-ice-400/10 text-ice-400 rounded-2xl">
                  <FileText size={24} />
                </div>
                <div>
                  <p className="font-black text-lg uppercase tracking-tight">{inv.invoiceNumber}</p>
                  <div className="flex items-center gap-3 text-ice-100/40 text-xs font-bold">
                    <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(inv.createdAt).toLocaleDateString()}</span>
                    <span className="text-ice-400">●</span>
                    <span>{inv.items.length} produits</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase text-ice-100/30">Total encaissé</p>
                  <p className="text-2xl font-black text-white">{Number(inv.totalAmount).toLocaleString()} F</p>
                </div>
                <button 
                  onClick={() => openDeleteModal(inv._id, inv.invoiceNumber)} 
                  className="p-3 bg-red-500/5 text-red-500/30 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                >
                  <Trash2 size={22} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}