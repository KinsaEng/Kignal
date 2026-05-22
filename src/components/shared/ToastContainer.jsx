import React from 'react';
import { ShieldAlert, Info as InfoIcon, X } from 'lucide-react';

const ToastContainer = ({ notifications, removeNotification }) => (
  <div className="fixed bottom-8 right-8 z-[999] flex flex-col gap-4 pointer-events-none">
    {notifications.map(n => (
      <div key={n.id} className={`pointer-events-auto min-w-[320px] p-5 rounded-[24px] border backdrop-blur-2xl flex items-center justify-between gap-4 shadow-2xl transition-all duration-300 animate-in slide-in-from-right ${n.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-blue-500/10 border-blue-500/30 text-blue-400'}`}>
        
        <div className="flex items-center gap-4">
          <div className="p-2 bg-black/20 rounded-xl">
            {n.type === 'error' ? <ShieldAlert className="w-5 h-5" /> : <InfoIcon className="w-5 h-5" />}
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider">{n.message}</span>
        </div>

        {removeNotification && (
          <button 
            onClick={() => removeNotification(n.id)} 
            className="p-1.5 hover:bg-black/20 rounded-lg transition-all active:scale-90 opacity-60 hover:opacity-100 text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        
      </div>
    ))}
  </div>
);

export default ToastContainer;