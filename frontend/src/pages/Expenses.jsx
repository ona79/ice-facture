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
        <div className="max-w-7xl mx-auto pt-28 md:pt-32 pb-12 px-4 md:px-8 min-h-screen text-white font-sans">
            <div className="flex justify-between items-center mb-8">
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

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 mb-8">
                <div className="text-left">
                    <h1 className="text-3xl md:text-4xl font-black italic mb-1 uppercase tracking-tighter text-white leading-none">Charges</h1>
                    <p className="text-red-500/40 text-[8px] font-black uppercase tracking-[0.2em] italic">Suivi des dépenses & frais fixes</p>
                </div>
            </div>

            {/* SUMMARY */}
            <div className="glass-card p-6 rounded-[2rem] bg-red-500/[0.03] border border-red-500/10 mb-8 flex justify-between items-center shadow-xl relative overflow-hidden group">
                <div className="relative z-10 text-left">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-red-500/50 mb-2 italic">Dépenses Totales</p>
                    <h2 className="text-3xl font-black italic text-red-500 tracking-tighter leading-none">
                        {expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()} <span className="text-xs not-italic ml-0.5 opacity-50">F</span>
                    </h2>
                </div>
                <div className="p-4 bg-red-500/10 rounded-xl group-hover:scale-110 transition-transform duration-500">
                    <Wallet size={32} className="text-red-500/40 drop-shadow-[0_0_12px_rgba(239,68,68,0.3)]" />
                </div>
                <div className="absolute inset-0 bg-red-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
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
                                className="glass-card p-5 rounded-[2.2rem] border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/20 transition-all duration-500 flex justify-between items-center group shadow-xl"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 bg-white/5 rounded-xl transition-all duration-500 group-hover:scale-110 shadow-inner ${cat.color}`}><Icon size={18} /></div>
                                    <div className="text-left">
                                        <p className="font-black text-[12px] uppercase italic tracking-tighter text-white/90 leading-none mb-1">{e.description}</p>
                                        <p className="text-[8px] text-white/20 font-black uppercase tracking-[0.2em] italic">{new Date(e.date).toLocaleDateString('fr-FR')} • {e.category}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <p className="font-black text-lg italic text-red-400 tracking-tighter leading-none">-{e.amount.toLocaleString()} <span className="text-[9px] not-italic opacity-30 ml-0.5">F</span></p>
                                    <button onClick={() => handleDeleteExpense(e)} className="p-2.5 bg-white/5 text-white/5 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all duration-300">
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
                        onClick={() => setShowAddModal(false)}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl"
                    >
                        <motion.div
                            onClick={(e) => e.stopPropagation()}
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="glass-card w-full max-w-md p-10 rounded-[3.5rem] border-white/10 relative shadow-2xl bg-[#09090b] text-center"
                        >
                            <button onClick={() => setShowAddModal(false)} className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors"><X size={24} /></button>

                            <div className="mb-10">
                                <div className="p-5 bg-red-500/10 text-red-500 rounded-[2rem] inline-block mb-4 shadow-inner border border-red-500/20"><Wallet size={40} /></div>
                                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Nouvelle Charge</h3>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500/40 italic">Enregistrement financier</p>
                            </div>

                            <form onSubmit={handleAddExpense} className="space-y-6 text-left">
                                <div className="space-y-2 group">
                                    <label className="text-[9px] font-black uppercase text-white/20 ml-4 italic tracking-widest block">Description du frais</label>
                                    <input
                                        required type="text" placeholder="EX: FACTURE SENELEC JANVIER..."
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 outline-none focus:border-red-500/50 text-xs font-black uppercase transition-all group-hover:border-white/10"
                                        value={newExpense.description}
                                        onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2 group">
                                        <label className="text-[9px] font-black uppercase text-white/20 ml-4 italic tracking-widest block">Montant (F)</label>
                                        <input
                                            required type="number" placeholder="0"
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 outline-none focus:border-red-500/50 text-xs font-black transition-all group-hover:border-white/10"
                                            value={newExpense.amount}
                                            onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2 group">
                                        <label className="text-[9px] font-black uppercase text-white/20 ml-4 italic tracking-widest block">Catégorie</label>
                                        <div className="relative">
                                            <select
                                                className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 outline-none focus:border-red-500/50 text-xs font-black transition-all appearance-none uppercase text-white group-hover:border-white/10"
                                                value={newExpense.category}
                                                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                                            >
                                                {CATEGORIES.map(c => <option key={c.id} value={c.id} className="bg-[#09090b]">{c.label}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 group">
                                    <label className="text-[9px] font-black uppercase text-white/20 ml-4 italic tracking-widest block">Date d'opération</label>
                                    <input
                                        required type="date"
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 outline-none focus:border-red-500/50 text-xs font-black transition-all group-hover:border-white/10 text-white"
                                        value={newExpense.date}
                                        onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                                    />
                                </div>

                                <button type="submit" className="w-full py-5 bg-red-500 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-red-900/40 active:scale-95 transition-all mt-4 hover:bg-white hover:text-black duration-500">
                                    Enregistrer
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
                        onClick={() => {
                            setShowDeleteModal(false);
                            setExpenseToDelete(null);
                        }}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl"
                    >
                        <motion.div
                            onClick={(e) => e.stopPropagation()}
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="glass-card w-full max-w-sm p-10 rounded-[3.5rem] border-white/10 relative shadow-2xl bg-[#09090b] text-center"
                        >
                            <div className="mb-8">
                                <div className="p-5 bg-red-500/10 text-red-500 rounded-[2rem] inline-block mb-4 shadow-inner">
                                    <Trash2 size={40} />
                                </div>
                                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2">
                                    Supprimer ?
                                </h3>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 italic">Cette action est irréversible</p>

                                {expenseToDelete && (
                                    <div className="mt-8 p-6 bg-white/[0.02] rounded-[2rem] border border-white/5 shadow-inner">
                                        <p className="font-black text-xs uppercase italic text-white/90 mb-1">{expenseToDelete.description}</p>
                                        <p className="text-[10px] font-black text-red-500">{expenseToDelete.amount.toLocaleString()} F</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setExpenseToDelete(null);
                                    }}
                                    className="flex-1 py-5 bg-white/5 border border-white/5 text-white/20 rounded-2xl font-black uppercase text-[10px] hover:bg-white/10 hover:text-white transition-all tracking-widest"
                                >
                                    Non
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 py-5 bg-red-500 text-white rounded-2xl font-black uppercase text-[10px] shadow-2xl shadow-red-900/40 active:scale-95 transition-all tracking-widest"
                                >
                                    Oui, OK
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
