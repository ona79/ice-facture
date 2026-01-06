import { useState } from 'react';
import { ChevronDown, MapPin } from 'lucide-react';
import { COUNTRY_CODES } from '../utils/countryCodes';

export const PhoneInput = ({ value, onChange, label, error }) => {
    // État local pour le code pays (par défaut Sénégal +221)
    const [selectedCode, setSelectedCode] = useState(COUNTRY_CODES[0]);
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (country) => {
        setSelectedCode(country);
        setIsOpen(false);
    };

    return (
        <div className="flex flex-col gap-1.5 w-full relative">
            {label && <label className="text-sm font-medium text-ice-100/70 ml-1">{label}</label>}

            <div className="flex gap-2">
                {/* SÉLECTEUR DE PAYS */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className="h-full bg-white/5 border border-white/10 rounded-xl px-3 flex items-center gap-2 hover:bg-white/10 transition-colors min-w-[90px]"
                    >
                        <span className="text-lg">{selectedCode.flag}</span>
                        <span className="text-sm font-bold text-white">{selectedCode.code}</span>
                        <ChevronDown size={14} className="text-white/50" />
                    </button>

                    {/* DROPDOWN */}
                    {isOpen && (
                        <div className="absolute top-12 left-0 w-[140px] max-h-60 overflow-y-auto bg-[#09090b] border border-white/10 rounded-xl shadow-2xl z-50">
                            {COUNTRY_CODES.map((c) => (
                                <button
                                    key={c.country}
                                    type="button"
                                    onClick={() => handleSelect(c)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
                                >
                                    <span className="text-lg">{c.flag}</span>
                                    <span className="text-sm font-bold text-white/70">{c.code}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* INPUT NUMÉRO (9 chiffres) */}
                <div className="relative flex-1">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
                        <MapPin size={16} />
                    </div>
                    <input
                        type="text"
                        maxLength={9}
                        placeholder="7X XXX XX XX"
                        value={value}
                        onChange={onChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-ice-400 focus:ring-1 focus:ring-ice-400 transition-all placeholder:text-white/20 text-white font-bold tracking-widest"
                    />
                </div>
            </div>

            {/* ERROR DISPLAY */}
            {error && (
                <p className="text-red-500 text-[8px] font-black mt-1 uppercase italic animate-pulse ml-1">
                    {error}
                </p>
            )}
        </div>
    );
};
