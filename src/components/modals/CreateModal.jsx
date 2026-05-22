import React, { useState } from 'react';
import { Users } from 'lucide-react';

const CreateGroupModal = ({ setShowCreateGroup, createGroup }) => {
  const [groupName, setGroupName] = useState("");

  return (
    <div className="absolute inset-0 z-[150] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800/60 p-10 rounded-[48px] shadow-2xl transition-all">
        <div className="w-16 h-16 bg-purple-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Users className="w-8 h-8 text-purple-500" />
        </div>
        <h3 className="text-2xl font-black mb-2 text-center tracking-tighter uppercase text-white">Grup Kur</h3>
        <p className="text-neutral-500 text-[10px] text-center mb-8 tracking-widest">KIGNAL ÜZERİNDE YENİ BİR AĞ OLUŞTUR</p>
        
        <input 
          autoFocus type="text" placeholder="Grup Adı Belirleyin..."
          className="w-full bg-black border border-neutral-800 rounded-2xl px-6 py-4 mb-6 text-center font-bold text-white focus:ring-2 focus:ring-purple-500 outline-none"
          value={groupName} onChange={e => setGroupName(e.target.value)}
        />
        <div className="flex gap-4">
          <button onClick={() => { setShowCreateGroup(false); setGroupName(""); }} className="flex-1 py-4 bg-neutral-800 text-white rounded-2xl font-black text-xs hover:bg-neutral-700 transition">İPTAL</button>
          <button onClick={() => createGroup(groupName)} className="flex-1 py-4 bg-purple-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-purple-600/20 hover:bg-purple-500 transition">OLUŞTUR</button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;