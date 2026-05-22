import React from 'react';
import { UserPlus } from 'lucide-react';

const AddFriendModal = ({ setShowAddFriend, newFriendName, setNewFriendName, sendFriendRequest }) => {
  return (
    <div className="absolute inset-0 z-[150] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800/60 p-10 rounded-[48px] shadow-2xl transition-all">
        <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <UserPlus className="w-8 h-8 text-blue-500" />
        </div>
        <h3 className="text-2xl font-black mb-2 text-center tracking-tighter uppercase text-white">İstek Gönder</h3>
        <p className="text-neutral-500 text-[10px] text-center mb-8 tracking-widest">KIGNAL AĞINDA BİR KULLANICI ARAT</p>
        
        <input 
          autoFocus type="text" placeholder="Kullanıcı adı girin..."
          className="w-full bg-black border border-neutral-800 rounded-2xl px-6 py-4 mb-6 text-center font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
          value={newFriendName} onChange={e => setNewFriendName(e.target.value)}
        />
        <div className="flex gap-4">
          <button onClick={() => { setShowAddFriend(false); setNewFriendName(""); }} className="flex-1 py-4 bg-neutral-800 text-white rounded-2xl font-black text-xs hover:bg-neutral-700 transition">İPTAL</button>
          <button onClick={sendFriendRequest} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition">GÖNDER</button>
        </div>
      </div>
    </div>
  );
};

export default AddFriendModal;