import React from 'react';
import { Zap, Clock, LogOut, UserPlus, X, Check, Trash2, UserX } from 'lucide-react';

const Sidebar = ({ 
  currentUser, setIsLoggedIn, showRequests, setShowRequests, 
  incomingRequests, outgoingRequests, acceptFriendRequest, rejectFriendRequest, 
  cancelFriendRequest, setShowAddFriend, userChats, activeChatId, setActiveChatId 
}) => {
  return (
    <div className="w-80 border-r border-neutral-800/40 flex flex-col bg-[#080808] z-30">
      <div className="p-6 flex flex-col gap-4 border-b border-neutral-800/30">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-600/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-black text-xs tracking-tight text-white uppercase truncate w-24">{currentUser}</h1>
              <p className="text-[9px] text-green-500 font-bold uppercase tracking-wider">Aktif</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setShowRequests(!showRequests)} 
              className={`p-2.5 rounded-xl transition-all relative ${showRequests ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'hover:bg-neutral-900 text-neutral-400'}`}
            >
              <Clock className="w-5 h-5" />
              {(incomingRequests.length > 0) && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-black" />
              )}
            </button>
            <button onClick={() => { setIsLoggedIn(false); setActiveChatId(null); }} className="p-2.5 hover:bg-red-500/10 text-neutral-500 hover:text-red-500 rounded-xl transition">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <button onClick={() => setShowAddFriend(true)} className="w-full flex items-center justify-center gap-2 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-xs font-black hover:bg-neutral-800 transition shadow-inner">
          <UserPlus className="w-4 h-4 text-blue-500" /> KİŞİ EKLE / İSTEK GÖNDER
        </button>
      </div>

      {showRequests && (
        <div className="p-4 bg-indigo-950/20 border-b border-indigo-800/30 space-y-3 animate-in slide-in-from-top duration-300">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> İstek Paneli
            </h3>
            <button onClick={() => setShowRequests(false)} className="text-neutral-500 hover:text-white"><X className="w-4 h-4" /></button>
          </div>

          <div className="space-y-2">
            <h4 className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Gelen İstekler ({incomingRequests.length})</h4>
            {incomingRequests.length === 0 ? (
              <p className="text-[10px] text-neutral-600 italic">Gelen beklemede istek yok.</p>
            ) : (
              incomingRequests.map(req => (
                <div key={req.id} className="flex items-center justify-between p-2 bg-black/40 rounded-lg border border-neutral-800/40">
                  <span className="text-xs font-bold text-white truncate w-24">{req.from}</span>
                  <div className="flex gap-1">
                    <button onClick={() => acceptFriendRequest(req)} className="p-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500 hover:text-white transition"><Check className="w-3.5 h-3.5" /></button>
                    <button onClick={() => rejectFriendRequest(req)} className="p-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500 hover:text-white transition"><X className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-neutral-800/20">
            <h4 className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Giden İstekler ({outgoingRequests.length})</h4>
            {outgoingRequests.length === 0 ? (
              <p className="text-[10px] text-neutral-600 italic">Gönderilmiş istek yok.</p>
            ) : (
              outgoingRequests.map(req => (
                <div key={req.id} className="flex items-center justify-between p-2 bg-black/40 rounded-lg border border-neutral-800/40">
                  <span className="text-xs font-bold text-white truncate w-24">{req.to}</span>
                  <button onClick={() => cancelFriendRequest(req)} className="p-1.5 bg-neutral-800 text-neutral-400 hover:text-red-500 hover:bg-red-500/10 rounded transition" title="İsteği İptal Et">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
        {userChats.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-neutral-600">
            <UserX className="w-8 h-8 opacity-25 mb-3" />
            <p className="text-xs leading-relaxed">Henüz arkadaş listenizde kimse yok. Yukarıdaki butonla istek göndererek başlayın.</p>
          </div>
        ) : (
          userChats.map(chat => (
            <div 
              key={chat.id} onClick={() => setActiveChatId(chat.id)}
              className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border ${activeChatId === chat.id ? 'bg-blue-600/20 border-blue-500/30 shadow-lg shadow-blue-900/10' : 'hover:bg-neutral-900/40 border-transparent'}`}
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${chat.color} flex items-center justify-center text-white font-black text-lg shadow-lg`}>
                {chat.name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between mb-1">
                  <span className="font-bold text-sm text-neutral-200 truncate">{chat.name}</span>
                  <span className="text-[9px] text-neutral-600">{chat.lastSeen}</span>
                </div>
                <p className="text-[10px] text-neutral-500 truncate uppercase tracking-tighter italic">End-to-End Encrypted</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Sidebar;