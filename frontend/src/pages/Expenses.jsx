import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    ArrowLeft, Plus, Trash2, Wallet,
    Calendar, ShoppingBag, Truck, Zap,
    Users, MoreHorizontal, X, FileDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const CATEGORIES = [
    { id: 'Loyer', label: 'Loyer', icon: Wallet, color: 'text-blue-400' },
    { id: 'Électricité', label: 'Électricité', icon: Zap, color: 'text-yellow-400' },
    { id: 'Transport', label: 'Transport', icon: Truck, color: 'text-purple-400' },
    { id: 'Marchandise', label: 'Marchandise', icon: ShoppingBag, color: 'text-green-400' },
    { id: 'Salaire', label: 'Salaire', icon: Users, color: 'text-pink-400' },
    { id: 'Autre', label: 'Autre', icon: MoreHorizontal, color: 'text-white/40' },
];

export default function Expenses() {
    const [expenses, setExpenses] = useState([]);
    const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: 'Autre', date: new Date().toISOString().split('T')[0] });
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState(null);
    const navigate = useNavigate();
    const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

    const fetchExpenses = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/expenses`, config);
            setExpenses(res.data);
        } catch (err) {
            toast.error("Erreur de chargement des dépenses");
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const handleAddExpense = async (e) => {
        e.preventDefault();
        const loading = toast.loading("Ajout...");
        try {
            await axios.post(`${API_URL}/api/expenses`, newExpense, config);
            toast.dismiss(loading);
            toast.success("Dépense enregistrée");
            setNewExpense({ description: '', amount: '', category: 'Autre', date: new Date().toISOString().split('T')[0] });
            setShowAddModal(false);
            fetchExpenses();
        } catch (err) {
            toast.dismiss(loading);
            toast.error("Erreur lors de l'ajout");
        }
    };

    const handleDeleteExpense = (expense) => {
        setExpenseToDelete(expense);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!expenseToDelete) return;
        try {
            await axios.delete(`${API_URL}/api/expenses/${expenseToDelete._id}`, config);
            toast.success("Supprimé");
            setShowDeleteModal(false);
            setExpenseToDelete(null);
            fetchExpenses();
        } catch (err) {
            toast.error("Erreur suppression");
        }
    };

    const exportToExcel = () => {
        const dataToExport = expenses.map(e => ({
            'DATE': new Date(e.date).toLocaleDateString('fr-FR'),
            'DESCRIPTION': e.description,
            'CATÉGORIE': e.category,
            'MONTANT (F)': e.amount
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Dépenses");
        XLSX.writeFile(workbook, `Depenses_Ice_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success("Excel généré !");
    };

    return (
        <div className="p-4 max-w-5xl mx-auto min-h-screen text-white font-sans pt-24">
            <div className="flex justify-between items-center mb-8">
                <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-white/20 font-black uppercase text-[10px] tracking-widest hover:text-white transition-all">
                    <ArrowLeft size={14} /> Retour Dashboard
                </button>
                <div className="flex gap-2">
                    <button
                        onClick={exportToExcel}
                        className="bg-green-500/10 text-green-500 border border-green-500/20 px-4 py-2 rounded-full font-black uppercase text-[10px] active:scale-95 transition-all flex items-center gap-2"
                    >
                        <FileDown size={14} /> Excel
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-red-500 text-white px-6 py-2 rounded-full font-black uppercase text-[10px] shadow-lg shadow-red-500/20 active:scale-95 transition-all flex items-center gap-2"
                    >
                        <Plus size={16} /> Ajouter une charge
                    </button>
                </div>
            </div>

            <h1 className="text-3xl font-black italic mb-8 uppercase tracking-tighter">Dépenses & Charges</h1>

            {/* SUMMARY */}
            <div className="glass-card p-6 rounded-[2.5rem] bg-red-500/[0.03] border-red-500/10 mb-8 flex justify-between items-center">
                <div>
                    <p className="text-[10px] font-black uppercase text-red-500/50 mb-1">Dépenses Totales</p>
                    <h2 className="text-3xl font-black italic text-red-500">
                        {expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()} F
                    </h2>
                </div>
                <Wallet size={40} className="text-red-500/20" />
            </div>

            {/* LIST */}
            <div className="space-y-3 pb-10">
                {expenses.length === 0 ? (
                    <p className="text-center text-white/20 py-20 uppercase text-xs font-bold italic tracking-widest">Aucune dépense enregistrée</p>
                ) : (
                    expenses.map((e) => {
                        const cat = CATEGORIES.find(c => c.id === e.category) || CATEGORIES[5];
                        const Icon = cat.icon;
                        return (
                            <motion.div
                                layout
                                key={e._id}
                                className="glass-card p-4 rounded-2xl flex justify-between items-center border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 bg-white/5 rounded-xl ${cat.color}`}><Icon size={20} /></div>
                                    <div>
                                        <p className="font-black text-xs uppercase">{e.description}</p>
                                        <p className="text-[10px] text-white/20 font-bold">{new Date(e.date).toLocaleDateString('fr-FR')} • {e.category}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <p className="font-black text-sm text-red-400">-{e.amount.toLocaleString()} F</p>
                                    <button onClick={() => handleDeleteExpense(e)} className="p-2 text-white/10 hover:text-red-500 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* MODAL AJOUT */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="glass-card w-full max-w-md p-8 rounded-[3rem] border-white/10 relative shadow-2xl bg-[#09090b]"
                        >
                            <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 text-white/20"><X size={20} /></button>
                            <div className="text-center mb-8">
                                <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl inline-block mb-4"><Wallet size={32} /></div>
                                <h3 className="text-xl font-black italic uppercase tracking-tighter">Nouvelle Charge</h3>
                            </div>

                            <form onSubmit={handleAddExpense} className="space-y-5 text-left">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-white/30 ml-2 italic">Description</label>
                                    <input
                                        required type="text" placeholder="EX: LOYER JANVIER..."
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-red-500 text-sm font-bold uppercase transition-all"
                                        value={newExpense.description}
                                        onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-white/30 ml-2 italic">Montant (F)</label>
                                        <input
                                            required type="number" placeholder="50000"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-red-500 text-sm font-bold transition-all"
                                            value={newExpense.amount}
                                            onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-white/30 ml-2 italic">Catégorie</label>
                                        <select
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-red-500 text-sm font-bold transition-all appearance-none uppercase text-white"
                                            value={newExpense.category}
                                            onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                                        >
                                            {CATEGORIES.map(c => <option key={c.id} value={c.id} className="bg-[#09090b]">{c.label}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-white/30 ml-2 italic">Date</label>
                                    <input
                                        required type="date"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-red-500 text-sm font-bold transition-all"
                                        value={newExpense.date}
                                        onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                                    />
                                </div>

                                <button type="submit" className="w-full py-5 bg-red-500 text-white rounded-2xl font-black uppercase text-[11px] shadow-lg shadow-red-500/20 active:scale-95 transition-all mt-4">
                                    Enregistrer la dépense
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MODAL SUPPRESSION */}
            <AnimatePresence>
                {showDeleteModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="glass-card w-full max-w-md p-8 rounded-[3rem] border-white/10 relative shadow-2xl bg-[#09090b]"
                        >
                            <div className="text-center mb-6">
                                <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl inline-block mb-4">
                                    <Trash2 size={32} />
                                </div>
                                <h3 className="text-xl font-black italic uppercase tracking-tighter mb-2">
                                    Supprimer cette dépense ?
                                </h3>
                                {expenseToDelete && (
                                    <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                                        <p className="font-black text-sm uppercase">{expenseToDelete.description}</p>
                                        <p className="text-xs text-white/40 mt-1">
                                            {new Date(expenseToDelete.date).toLocaleDateString('fr-FR')} • {expenseToDelete.category}
                                        </p>
                                        <p className="font-black text-red-400 mt-2">-{expenseToDelete.amount.toLocaleString()} F</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setExpenseToDelete(null);
                                    }}
                                    className="flex-1 py-4 bg-white/5 border border-white/10 text-white/60 rounded-2xl font-black uppercase text-[11px] hover:bg-white/10 active:scale-95 transition-all"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black uppercase text-[11px] shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                                >
                                    OK
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
