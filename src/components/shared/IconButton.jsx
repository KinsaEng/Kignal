import React from 'react';

const IconButton = ({ icon: Icon, onClick, active, color = "neutral", className = "" }) => (
  <button 
    onClick={onClick}
    className={`p-3 rounded-2xl transition-all duration-200 active:scale-90 flex items-center justify-center ${className}
      ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 
        color === 'danger' ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' : 
        'bg-neutral-900/50 text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
  >
    <Icon className="w-5 h-5" />
  </button>
);

export default IconButton;