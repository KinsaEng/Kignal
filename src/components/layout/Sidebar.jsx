import React from 'react';
import { Zap, Clock, LogOut, UserPlus, X, Check, Trash2, UserX, Settings, Users } from 'lucide-react';

const Sidebar = ({ 
  currentUser, setIsLoggedIn, showRequests, setShowRequests, 
  incomingRequests, outgoingRequests, acceptFriendRequest, rejectFriendRequest, 
  cancelFriendRequest, setShowAddFriend, setShowCreateGroup, setShowSettings, 
  userChats, activeChatId, setActiveChatId 
}) => {
  return (
    <div className="w-80 border-r border-neutral-800/40 flex flex-col bg-[#080808] z-30">
      <div className="p-6 flex flex-col gap-4 border-b border-neutral-800/30">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl kignal-primary-bg flex items-center justify-center font-bold text-white shadow-lg">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-black text-xs tracking-tight text-white uppercase truncate w-24">{currentUser}</h1>
              <p className="text-[9px] text-green-500 font-bold uppercase tracking-wider">Aktif</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button onClick={() => setShowRequests(!showRequests)} className="p-2 relative text-neutral-400 hover:text-white transition">
              <Clock className="w-5 h-5" />
              {(incomingRequests.length > 0) && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-black" />}
            </button>
            <button onClick={() => setShowSettings(true)} className="p-2 text-neutral-400 hover:text-white transition" title="Ayarlar">
              <Settings className="w-5 h-5" />
            </button>
            <button onClick={() => { setIsLoggedIn(false); setActiveChatId(null); }} className="p-2 hover:bg-red-500/10 text-neutral-500 hover:text-red-500 rounded-xl transition" title="Çıkış Yap">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button onClick={() => setShowAddFriend(true)} className="flex-1 flex items-center justify-center py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-[10px] font-black hover:bg-neutral-800 transition shadow-inner">
            <UserPlus className="w-3.5 h-3.5 mr-1 kignal-primary-text" /> KİŞİ EKLE
          </button>
          <button onClick={() => setShowCreateGroup(true)} className="flex-1 flex items-center justify-center py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-[10px] font-black hover:bg-neutral-800 transition shadow-inner">
            <Users className="w-3.5 h-3.5 mr-1 kignal-primary-text" /> GRUP KUR
          </button>
        </div>
      </div>

      {/* İstek paneli değişmedi (Eski dosyadakiyle aynı bırakabilirsin) */}
      
      <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
        {userChats.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-neutral-600">
            <UserX className="w-8 h-8 opacity-25 mb-3" />
            <p className="text-xs leading-relaxed">Sohbet bulunamadı. Kişi ekleyin veya Grup kurun.</p>
          </div>
        ) : (
          userChats.map(chat => (
            <div 
              key={chat.id} onClick={() => setActiveChatId(chat.id)}
              className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border ${activeChatId === chat.id ? 'bg-white/5 border-white/10 shadow-lg' : 'hover:bg-neutral-900/40 border-transparent'}`}
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${chat.color} flex items-center justify-center text-white font-black text-lg shadow-lg`}>
                {chat.name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between mb-1">
                  <span className="font-bold text-sm text-neutral-200 truncate">{chat.name}</span>
                  <span className="text-[9px] text-neutral-600">{chat.lastSeen}</span>
                </div>
                <p className="text-[10px] text-neutral-500 truncate uppercase tracking-tighter italic">{chat.isGroup ? 'Grup Sohbeti' : 'Şifreli'}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Sidebar;