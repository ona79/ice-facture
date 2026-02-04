import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator as CalcIcon, X, Delete, Minus, Plus, X as MultiIcon, Divide, ArrowRight } from 'lucide-react';

const Calculator = ({ isNavOpen }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('0');
    const [equation, setEquation] = useState('');

    const handleDigit = (digit) => {
        if (input === '0') {
            setInput(digit);
        } else {
            setInput(input + digit);
        }
    };

    const handleOperator = (op) => {
        setEquation(input + ' ' + op + ' ');
        setInput('0');
    };

    const calculate = () => {
        try {
            const parts = equation.trim().split(' ');
            if (parts.length < 2) return;

            const num1 = parseFloat(parts[0]);
            const op = parts[1];
            const num2 = parseFloat(input);
            let result = 0;

            switch (op) {
                case '+': result = num1 + num2; break;
                case '-': result = num1 - num2; break;
                case '*': result = num1 * num2; break;
                case '/': result = num2 !== 0 ? num1 / num2 : 'Div/0'; break;
                default: result = num2;
            }

            setInput(result.toString());
            setEquation('');
        } catch (e) {
            setInput('Erreur');
        }
    };

    const clear = () => {
        setInput('0');
        setEquation('');
    };

    const deleteLast = () => {
        if (input.length > 1) {
            setInput(input.slice(0, -1));
        } else {
            setInput('0');
        }
    };

    return (
        <>
            {/* BOUTON FLOTTANT */}
            <AnimatePresence>
                {!isNavOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsOpen(!isOpen)}
                        className="fixed bottom-6 left-6 z-[200] p-4 bg-ice-600 text-white rounded-full shadow-2xl shadow-ice-900/20 hover:scale-110 transition-all flex items-center justify-center border-2 border-slate-200"
                    >
                        <CalcIcon size={24} />
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        drag
                        dragConstraints={{ left: 0, right: window.innerWidth - 300, top: 0, bottom: window.innerHeight - 450 }}
                        initial={{ opacity: 0, scale: 0.9, y: 100 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 100 }}
                        className="fixed bottom-24 left-6 z-[250] w-72 bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden cursor-default pointer-events-auto"
                        style={{ backdropFilter: 'blur(20px)' }}
                    >
                        {/* ENTETE */}
                        <div className="p-4 flex justify-between items-center border-b border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <CalcIcon size={14} className="text-ice-600" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Calculatrice</span>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-slate-300 hover:text-slate-900 transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        {/* ECRAN */}
                        <div className="p-6 bg-slate-50 text-right overflow-hidden shadow-inner">
                            <p className="text-[10px] font-bold text-ice-600/40 h-4 uppercase tracking-tighter truncate leading-none">{equation}</p>
                            <h4 className="text-4xl font-black italic tracking-tighter text-slate-900 truncate my-2 leading-none">{input}</h4>
                        </div>

                        {/* TOUCHES */}
                        <div className="p-4 grid grid-cols-4 gap-2 bg-slate-50/30">
                            <button onClick={clear} className="col-span-2 p-4 rounded-2xl bg-red-50 text-red-600 border border-red-100 font-black text-xs uppercase hover:bg-red-600 hover:text-white transition-all">AC</button>
                            <button onClick={deleteLast} className="p-4 rounded-2xl bg-white border border-slate-100 text-slate-300 hover:text-slate-600 hover:bg-slate-50 shadow-sm flex items-center justify-center"><Delete size={16} /></button>
                            <button onClick={() => handleOperator('/')} className="p-4 rounded-2xl bg-ice-50 text-ice-600 border border-ice-100 hover:bg-ice-600 hover:text-white transition-colors flex items-center justify-center"><Divide size={16} /></button>

                            {[7, 8, 9].map(n => (
                                <button key={n} onClick={() => handleDigit(n.toString())} className="p-4 rounded-2xl bg-white border border-slate-100 text-slate-700 font-black text-lg hover:bg-slate-50 transition-all shadow-sm">{n}</button>
                            ))}
                            <button onClick={() => handleOperator('*')} className="p-4 rounded-2xl bg-ice-50 text-ice-600 border border-ice-100 hover:bg-ice-600 hover:text-white transition-colors flex items-center justify-center"><MultiIcon size={16} /></button>

                            {[4, 5, 6].map(n => (
                                <button key={n} onClick={() => handleDigit(n.toString())} className="p-4 rounded-2xl bg-white border border-slate-100 text-slate-700 font-black text-lg hover:bg-slate-50 transition-all shadow-sm">{n}</button>
                            ))}
                            <button onClick={() => handleOperator('-')} className="p-4 rounded-2xl bg-ice-50 text-ice-600 border border-ice-100 hover:bg-ice-600 hover:text-white transition-colors flex items-center justify-center"><Minus size={16} /></button>

                            {[1, 2, 3].map(n => (
                                <button key={n} onClick={() => handleDigit(n.toString())} className="p-4 rounded-2xl bg-white border border-slate-100 text-slate-700 font-black text-lg hover:bg-slate-50 transition-all shadow-sm">{n}</button>
                            ))}
                            <button onClick={() => handleOperator('+')} className="p-4 rounded-2xl bg-ice-50 text-ice-600 border border-ice-100 hover:bg-ice-600 hover:text-white transition-colors flex items-center justify-center"><Plus size={16} /></button>

                            <button onClick={() => handleDigit('0')} className="p-4 rounded-2xl bg-white border border-slate-100 text-slate-700 font-black text-lg hover:bg-slate-50 transition-all shadow-sm">0</button>
                            <button onClick={() => handleDigit('00')} className="p-4 rounded-2xl bg-white border border-slate-100 text-slate-700 font-black text-lg hover:bg-slate-50 transition-all shadow-sm">00</button>
                            <button onClick={() => handleDigit('.')} className="p-4 rounded-2xl bg-white border border-slate-100 text-slate-700 font-black text-lg hover:bg-slate-50 transition-all shadow-sm">.</button>
                            <button onClick={calculate} className="p-4 rounded-2xl bg-ice-600 text-white font-black flex items-center justify-center hover:scale-105 transition-all shadow-lg shadow-ice-900/20"><ArrowRight size={20} /></button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Calculator;
