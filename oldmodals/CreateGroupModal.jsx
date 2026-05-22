import React, { useState } from 'react';
import { Users, Check } from 'lucide-react';

const CreateGroupModal = ({ setShowCreateGroup, createGroup, friendsList }) => {
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);

  const toggleMember = (friendName) => {
    setSelectedMembers(prev => 
      prev.includes(friendName) ? prev.filter(n => n !== friendName) : [...prev, friendName]
    );
  };

  return (
    <div className="absolute inset-0 z-[150] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800/60 p-8 rounded-[40px] shadow-2xl transition-all flex flex-col max-h-[80vh]">
        <div className="w-16 h-16 bg-purple-600/10 rounded-2xl flex items-center justify-center mx-auto mb-4 shrink-0">
          <Users className="w-8 h-8 text-purple-500" />
        </div>
        <h3 className="text-xl font-black mb-1 text-center tracking-tighter uppercase text-white">Grup Kur</h3>
        <p className="text-neutral-500 text-[10px] text-center mb-6 tracking-widest shrink-0">KİŞİLERİ SEÇ VE AĞI OLUŞTUR</p>
        
        <input 
          autoFocus type="text" placeholder="Grup Adı Belirleyin..."
          className="w-full bg-black border border-neutral-800 rounded-2xl px-6 py-4 mb-4 text-center font-bold text-white focus:ring-2 focus:ring-purple-500 outline-none shrink-0"
          value={groupName} onChange={e => setGroupName(e.target.value)}
        />

        <div className="flex-1 overflow-y-auto custom-scrollbar mb-6 space-y-2 pr-2">
          {friendsList.length === 0 ? (
             <p className="text-xs text-neutral-500 text-center py-4">Gruba eklenecek hiç arkadaşın yok.</p>
          ) : (
            friendsList.map(friend => (
              <div 
                key={friend.id} onClick={() => toggleMember(friend.name)}
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border transition ${selectedMembers.includes(friend.name) ? 'bg-purple-600/20 border-purple-500/50' : 'bg-black border-neutral-800 hover:border-neutral-700'}`}
              >
                <span className="text-sm font-bold text-white">{friend.name}</span>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${selectedMembers.includes(friend.name) ? 'bg-purple-500 border-purple-500 text-white' : 'border-neutral-700'}`}>
                  {selectedMembers.includes(friend.name) && <Check className="w-3 h-3" />}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-3 shrink-0">
          <button onClick={() => { setShowCreateGroup(false); setGroupName(""); setSelectedMembers([]); }} className="flex-1 py-3.5 bg-neutral-800 text-white rounded-xl font-black text-[11px] hover:bg-neutral-700 transition">İPTAL</button>
          <button 
            disabled={!groupName.trim() || selectedMembers.length === 0}
            onClick={() => createGroup(groupName, selectedMembers)} 
            className="flex-1 py-3.5 bg-purple-600 text-white rounded-xl font-black text-[11px] shadow-lg shadow-purple-600/20 hover:bg-purple-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            OLUŞTUR ({selectedMembers.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;