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
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
            <div className="glass-card w-full max-w-md p-10 rounded-[3rem] border border-white/10 shadow-3xl relative overflow-hidden bg-white/5 backdrop-blur-3xl">
                {/* Décoration */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-ice-500/10 rounded-full blur-[100px]"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-ice-500/10 rounded-full blur-[100px]"></div>

                <button
                    onClick={() => navigate('/login')}
                    className="flex items-center gap-2 text-white/30 hover:text-ice-400 transition-colors uppercase text-[10px] font-black tracking-widest mb-8"
                >
                    <ArrowLeft size={14} /> Retour à la connexion
                </button>

                {!isSent ? (
                    <div className="text-left animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="w-16 h-16 bg-ice-500/10 rounded-[2rem] flex items-center justify-center text-ice-400 mb-6 shadow-xl border border-ice-500/20">
                            <Mail size={32} />
                        </div>
                        <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none text-white mb-2">Mot de passe oublié ?</h1>
                        <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-10">Entrez votre email de compte pour recevoir votre lien de réinitialisation sécurisé.</p>

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
                                className="w-full py-5 rounded-2xl bg-ice-400 text-ice-900 font-black uppercase text-xs flex items-center justify-center gap-3 shadow-2xl shadow-ice-400/20 active:scale-95 transition-all hover:bg-white"
                            >
                                {loading ? "Traitement..." : <><Send size={18} /> Envoyer le lien</>}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="text-center animate-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-green-500/10 rounded-[2.5rem] flex items-center justify-center text-green-400 mb-8 mx-auto shadow-xl border border-green-500/20">
                            <MailCheck size={40} />
                        </div>
                        <h1 className="text-3xl font-black italic uppercase text-white mb-4">Lien Envoyé !</h1>
                        <p className="text-white/50 text-[12px] font-medium leading-relaxed mb-10 px-4">
                            Un lien a été généré avec succès. Dans cette version, veuillez vérifier la <span className="text-ice-400 font-bold uppercase italic tracking-widest">console du serveur</span> pour récupérer le lien.
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-8 py-4 rounded-xl border border-white/10 text-white/50 font-black uppercase text-[10px] hover:bg-white/5 transition-all"
                        >
                            Retour au login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
