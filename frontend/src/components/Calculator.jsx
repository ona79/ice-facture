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
                        className="fixed bottom-6 left-6 z-[200] p-4 bg-ice-400 text-ice-900 rounded-full shadow-[0_0_20px_rgba(0,242,255,0.4)] hover:shadow-[0_0_30px_rgba(0,242,255,0.6)] transition-all flex items-center justify-center border-2 border-white/20"
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
                        className="fixed bottom-24 left-6 z-[250] w-72 glass-card rounded-[2.5rem] border-white/10 shadow-2xl overflow-hidden cursor-default pointer-events-auto"
                        style={{ backdropFilter: 'blur(20px)', background: 'rgba(9, 9, 11, 0.85)' }}
                    >
                        {/* ENTETE */}
                        <div className="p-4 flex justify-between items-center border-b border-white/5 bg-white/5">
                            <div className="flex items-center gap-2">
                                <CalcIcon size={14} className="text-ice-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Calculatrice</span>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-white/20 hover:text-white transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        {/* ECRAN */}
                        <div className="p-6 bg-black/40 text-right overflow-hidden">
                            <p className="text-[10px] font-bold text-ice-400/40 h-4 uppercase tracking-tighter truncate">{equation}</p>
                            <h4 className="text-4xl font-black italic tracking-tighter text-white truncate my-2">{input}</h4>
                        </div>

                        {/* TOUCHES */}
                        <div className="p-4 grid grid-cols-4 gap-2 bg-white/[0.02]">
                            <button onClick={clear} className="col-span-2 p-4 rounded-2xl bg-red-500/10 text-red-500 font-black text-xs uppercase hover:bg-red-500 hover:text-white transition-all">AC</button>
                            <button onClick={deleteLast} className="p-4 rounded-2xl bg-white/5 text-white/40 hover:bg-white/10 flex items-center justify-center"><Delete size={16} /></button>
                            <button onClick={() => handleOperator('/')} className="p-4 rounded-2xl bg-ice-400/10 text-ice-400 hover:bg-ice-400 hover:text-black flex items-center justify-center"><Divide size={16} /></button>

                            {[7, 8, 9].map(n => (
                                <button key={n} onClick={() => handleDigit(n.toString())} className="p-4 rounded-2xl bg-white/5 text-white font-black text-lg hover:bg-white/10 transition-all">{n}</button>
                            ))}
                            <button onClick={() => handleOperator('*')} className="p-4 rounded-2xl bg-ice-400/10 text-ice-400 hover:bg-ice-400 hover:text-black flex items-center justify-center"><MultiIcon size={16} /></button>

                            {[4, 5, 6].map(n => (
                                <button key={n} onClick={() => handleDigit(n.toString())} className="p-4 rounded-2xl bg-white/5 text-white font-black text-lg hover:bg-white/10 transition-all">{n}</button>
                            ))}
                            <button onClick={() => handleOperator('-')} className="p-4 rounded-2xl bg-ice-400/10 text-ice-400 hover:bg-ice-400 hover:text-black flex items-center justify-center"><Minus size={16} /></button>

                            {[1, 2, 3].map(n => (
                                <button key={n} onClick={() => handleDigit(n.toString())} className="p-4 rounded-2xl bg-white/5 text-white font-black text-lg hover:bg-white/10 transition-all">{n}</button>
                            ))}
                            <button onClick={() => handleOperator('+')} className="p-4 rounded-2xl bg-ice-400/10 text-ice-400 hover:bg-ice-400 hover:text-black flex items-center justify-center"><Plus size={16} /></button>

                            <button onClick={() => handleDigit('0')} className="p-4 rounded-2xl bg-white/5 text-white font-black text-lg hover:bg-white/10 transition-all">0</button>
                            <button onClick={() => handleDigit('00')} className="p-4 rounded-2xl bg-white/5 text-white font-black text-lg hover:bg-white/10 transition-all">00</button>
                            <button onClick={() => handleDigit('.')} className="p-4 rounded-2xl bg-white/5 text-white font-black text-lg hover:bg-white/10 transition-all">.</button>
                            <button onClick={calculate} className="p-4 rounded-2xl bg-ice-400 text-black font-black flex items-center justify-center hover:scale-105 transition-all shadow-[0_0_15px_rgba(0,242,255,0.4)]"><ArrowRight size={20} /></button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Calculator;
