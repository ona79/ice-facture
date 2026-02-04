import { useState } from 'react';
import axios from 'axios';
import { Lock, ShieldCheck, ArrowRight, KeyRound } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { IceInput } from '../components/IceInput';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { token } = useParams();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            return toast.error("Les mots de passe ne correspondent pas");
        }

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
        if (!passwordRegex.test(password)) {
            return toast.error("Lettres + Chiffres (min 6 car.) requis");
        }

        setLoading(true);
        const loadingToast = toast.loading("Réinitialisation...");
        try {
            await axios.post(`${API_URL}/api/auth/reset-password/${token}`, { password });
            toast.dismiss(loadingToast);
            toast.success("Mot de passe mis à jour !");
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            toast.dismiss(loadingToast);
            toast.error(err.response?.data?.msg || "Lien invalide ou expiré");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-md p-10 rounded-[3rem] border border-slate-100 shadow-3xl relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-ice-50 rounded-full blur-[100px]"></div>

                <div className="text-left animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="w-16 h-16 bg-red-50 rounded-[2rem] flex items-center justify-center text-red-600 mb-6 shadow-xl border border-red-100 shadow-inner">
                        <KeyRound size={32} />
                    </div>
                    <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-slate-900 mb-2">Nouveau Mot de Passe</h1>
                    <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-10 italic">Votre compte est presque prêt. Saisissez votre nouvelle clé d'accès sécurisée.</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <IceInput
                            label="Nouveau Mot de Passe"
                            icon={<Lock size={18} />}
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Lettres + Chiffres (min 6)..."
                            required
                        />
                        <IceInput
                            label="Confirmer le Mot de Passe"
                            icon={<ShieldCheck size={18} />}
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirmez votre secret..."
                            required
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 rounded-2xl bg-ice-600 text-white font-black uppercase text-xs flex items-center justify-center gap-3 shadow-2xl shadow-ice-900/10 active:scale-95 transition-all mt-6 hover:bg-slate-900"
                        >
                            {loading ? "Mise à jour..." : <><ShieldCheck size={18} /> Re-sécuriser mon compte</>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
