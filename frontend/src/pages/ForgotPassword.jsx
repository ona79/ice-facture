import { useState } from 'react';
import axios from 'axios';
import { Mail, ArrowLeft, Send, MailCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { IceInput } from '../components/IceInput';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [isSent, setIsSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return toast.error("Email requis");

        setLoading(true);
        try {
            await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
            setIsSent(true);
            toast.success("Vérifiez vos emails (simulation console)");
        } catch (err) {
            toast.error(err.response?.data?.msg || "Erreur lors de l'envoi");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-md p-10 rounded-[3rem] border border-slate-100 shadow-3xl relative overflow-hidden">
                {/* Décoration */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-ice-50 rounded-full blur-[100px]"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-ice-50 rounded-full blur-[100px]"></div>

                <button
                    onClick={() => navigate('/login')}
                    className="flex items-center gap-2 text-slate-300 hover:text-ice-600 transition-colors uppercase text-[10px] font-black tracking-widest mb-8 italic"
                >
                    <ArrowLeft size={14} /> Retour à la connexion
                </button>

                {!isSent ? (
                    <div className="text-left animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="w-16 h-16 bg-ice-50 rounded-[2rem] flex items-center justify-center text-ice-600 mb-6 shadow-xl border border-ice-100 shadow-inner">
                            <Mail size={32} />
                        </div>
                        <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none text-slate-900 mb-2">Mot de passe oublié ?</h1>
                        <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-10 italic">Entrez votre email de compte pour recevoir votre lien de réinitialisation sécurisé.</p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <IceInput
                                label="Adresse Email"
                                icon={<Mail size={18} />}
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Votre adresse Gmail..."
                                required
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 rounded-2xl bg-ice-600 text-white font-black uppercase text-xs flex items-center justify-center gap-3 shadow-2xl shadow-ice-900/10 active:scale-95 transition-all hover:bg-slate-900"
                            >
                                {loading ? "Traitement..." : <><Send size={18} /> Envoyer le lien</>}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="text-center animate-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-green-50 rounded-[2.5rem] flex items-center justify-center text-green-600 mb-8 mx-auto shadow-xl border border-green-100 shadow-inner">
                            <MailCheck size={40} />
                        </div>
                        <h1 className="text-3xl font-black italic uppercase text-slate-900 mb-4">Lien Envoyé !</h1>
                        <p className="text-slate-400 text-[12px] font-bold uppercase tracking-widest leading-relaxed mb-10 px-4 italic">
                            Un lien a été généré avec succès. Dans cette version, veuillez vérifier la <span className="text-ice-600 font-black uppercase italic tracking-widest">console du serveur</span> pour récupérer le lien.
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-8 py-4 rounded-xl border border-slate-100 text-slate-300 font-black uppercase text-[10px] hover:bg-slate-50 transition-all italic"
                        >
                            Retour au login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
