export const IceInput = ({ label, ...props }) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label className="text-sm font-medium text-ice-100/70 ml-1">{label}</label>
    <input 
      {...props}
      className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-ice-400 focus:ring-1 focus:ring-ice-400 transition-all placeholder:text-white/20"
    />
  </div>
);