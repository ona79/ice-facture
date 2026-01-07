import { useState, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const IceInput = forwardRef(({ label, icon, type, ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-sm font-medium text-ice-100/70 ml-1 italic uppercase text-[9px] tracking-widest">{label}</label>
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ice-100/30 group-focus-within:text-ice-400 transition-colors">
            {icon}
          </div>
        )}
        <input
          {...props}
          ref={ref}
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          className={`w-full bg-white/5 border border-white/10 rounded-2xl py-4 focus:outline-none focus:border-ice-400 focus:ring-4 focus:ring-ice-400/5 transition-all placeholder:text-white/10 text-sm ${icon ? 'pl-11' : 'pl-5'
            } ${isPassword ? 'pr-12' : 'pr-5'}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-ice-400 transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
});

IceInput.displayName = 'IceInput';