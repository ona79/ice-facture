import { useState, forwardRef, useRef, useEffect } from 'react';
import { ChevronDown, MapPin } from 'lucide-react';
import { COUNTRY_CODES } from '../utils/countryCodes';

export const PhoneInput = forwardRef(({ value, onChange, label, error, onCountryChange, compact, hideLabel, ...props }, ref) => {
    // État local pour le code pays (par défaut Sénégal +221)
    const [selectedCode, setSelectedCode] = useState(COUNTRY_CODES[0]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleSelect = (country) => {
        setSelectedCode(country);
        setIsOpen(false);
        if (onCountryChange) onCountryChange(country);
    };

    const handleTextChange = (e) => {
        const val = e.target.value.replace(/\D/g, "");
        onChange(val);
    };

    return (
        <div className={`flex flex-col ${compact ? 'gap-0.5' : 'gap-1'} w-full relative`}>
            {label && !hideLabel && <label className="text-sm font-medium text-ice-100/70 ml-1 italic uppercase text-[9px] tracking-widest leading-none mb-0.5">{label}</label>}

            <div className={`flex ${compact ? 'gap-1' : 'gap-2'}`}>
                {/* SÉLECTEUR DE PAYS */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className={`h-full bg-white/5 border border-white/10 rounded-xl ${compact ? 'px-1.5' : 'px-2'} flex items-center gap-1 hover:bg-white/10 transition-colors ${compact ? 'min-w-[70px]' : 'min-w-[80px]'}`}
                    >
                        <span className={`${compact ? 'text-base' : 'text-lg'}`}>{selectedCode.flag}</span>
                        <span className={`${compact ? 'text-[11px]' : 'text-sm'} font-bold text-white`}>{selectedCode.code}</span>
                        <ChevronDown size={compact ? 12 : 14} className="text-white/50" />
                    </button>

                    {/* DROPDOWN */}
                    {isOpen && (
                        <div className="absolute top-14 left-0 w-[160px] max-h-60 overflow-y-auto bg-[#09090b]/95 backdrop-blur-xl border border-white/10 rounded-[1.5rem] shadow-2xl z-50 p-1">
                            {COUNTRY_CODES.map((c) => (
                                <button
                                    key={c.country}
                                    type="button"
                                    onClick={() => handleSelect(c)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${selectedCode.code === c.code ? 'bg-ice-400/10 text-white' : 'hover:bg-white/5 text-white/50'
                                        }`}
                                >
                                    <span className="text-xl">{c.flag}</span>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black">{c.code}</span>
                                        <span className="text-[8px] uppercase tracking-tighter opacity-50">{c.country}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* INPUT NUMÉRO */}
                <div className="relative flex-1">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/10">
                        <MapPin size={14} />
                    </div>
                    <input
                        {...props}
                        ref={ref}
                        type="text"
                        maxLength={selectedCode.digitLength}
                        placeholder={props.placeholder || "X".repeat(selectedCode.digitLength).replace(/(.{3})/g, "$1 ").trim()}
                        value={value}
                        onChange={handleTextChange}
                        className={`w-full bg-white/5 border border-white/10 rounded-xl ${compact ? 'pl-8 pr-2 py-2 lg:py-2' : 'pl-10 pr-3 py-3 md:py-4'} focus:outline-none focus:border-ice-400 focus:ring-4 focus:ring-ice-400/5 transition-all placeholder:text-white/5 text-white font-black tracking-[0.1em] ${compact ? 'text-[11px]' : 'text-sm'}`}
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
});

PhoneInput.displayName = 'PhoneInput';
