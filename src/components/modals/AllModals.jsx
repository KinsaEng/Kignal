import React, { useState, useRef, useEffect } from 'react';
import { UserPlus, Users, X, Check, XCircle, Settings, User, Palette, Moon, Sun, Monitor, Phone, Trash2, Video, MicOff, Search, Timer, Edit2, Image as ImageIcon, ShieldCheck, Plus, Ban, AlertOctagon, Camera, MonitorUp, Volume2, Maximize, Minimize } from 'lucide-react';

// --- 1. ADD FRIEND MODAL ---
export const AddFriendModal = ({ setShowAddFriend, newFriendName, setNewFriendName, sendFriendRequest }) => (
  <div className="absolute inset-0 z-[150] bg-black/80 dark:bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-200">
    <div className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800/60 p-10 rounded-[48px] shadow-2xl transition-all">
      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6"><UserPlus className="w-8 h-8 text-blue-600 dark:text-blue-500" /></div>
      <h3 className="text-2xl font-black mb-2 text-center tracking-tighter uppercase text-neutral-900 dark:text-white">İstek Gönder</h3>
      <input autoFocus type="text" placeholder="Kullanıcı adı girin..." className="w-full bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl px-6 py-4 mb-6 text-center font-bold text-neutral-900 dark:text-white outline-none" value={newFriendName} onChange={e => setNewFriendName(e.target.value)} />
      <div className="flex gap-4">
        <button onClick={() => setShowAddFriend(false)} className="flex-1 py-4 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-white rounded-2xl font-black text-xs transition">İPTAL</button>
        <button onClick={sendFriendRequest} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs shadow-lg transition">GÖNDER</button>
      </div>
    </div>
  </div>
);

// --- 2. CREATE GROUP MODAL ---
export const CreateGroupModal = ({ setShowCreateGroup, createGroup, friendsList }) => {
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const toggleMember = (name) => setSelectedMembers(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);

  return (
    <div className="absolute inset-0 z-[150] bg-black/80 dark:bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800/60 p-8 rounded-[40px] shadow-2xl flex flex-col max-h-[80vh]">
        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-600/10 rounded-2xl flex items-center justify-center mx-auto mb-4 shrink-0"><Users className="w-8 h-8 text-purple-600 dark:text-purple-500" /></div>
        <h3 className="text-xl font-black mb-1 text-center tracking-tighter uppercase text-neutral-900 dark:text-white">Grup Kur</h3>
        <input autoFocus type="text" placeholder="Grup Adı Belirleyin..." className="w-full bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl px-6 py-4 mb-4 text-center font-bold text-neutral-900 dark:text-white outline-none shrink-0" value={groupName} onChange={e => setGroupName(e.target.value)} />
        <div className="flex-1 overflow-y-auto custom-scrollbar mb-6 space-y-2 pr-2">
          {friendsList.length === 0 ? <p className="text-xs text-neutral-500 text-center py-4">Gruba eklenecek arkadaşınız yok.</p> : friendsList.map(friend => (
            <div key={friend.id} onClick={() => toggleMember(friend.name)} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border transition ${selectedMembers.includes(friend.name) ? 'bg-purple-100 dark:bg-purple-600/20 border-purple-500' : 'bg-neutral-50 dark:bg-black border-neutral-200 dark:border-neutral-800'}`}>
              <span className="text-sm font-bold text-neutral-900 dark:text-white">{friend.name}</span>
              <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${selectedMembers.includes(friend.name) ? 'bg-purple-500 border-purple-500 text-white' : 'border-neutral-300 dark:border-neutral-700'}`}>{selectedMembers.includes(friend.name) && <Check className="w-3 h-3" />}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-3 shrink-0">
          <button onClick={() => setShowCreateGroup(false)} className="flex-1 py-3.5 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-white rounded-xl font-black text-[11px] transition">İPTAL</button>
          <button disabled={!groupName.trim() || selectedMembers.length === 0} onClick={() => createGroup(groupName, selectedMembers)} className="flex-1 py-3.5 bg-purple-600 text-white rounded-xl font-black text-[11px] shadow-lg disabled:opacity-50 transition">OLUŞTUR ({selectedMembers.length})</button>
        </div>
      </div>
    </div>
  );
};

// --- 3. REQUESTS MODAL ---
export const RequestsModal = ({ setShowRequests, incomingRequests, outgoingRequests, handleAction }) => {
  const [tab, setTab] = useState('incoming');
  return (
    <div className="absolute inset-0 z-[150] bg-black/80 dark:bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800/60 p-8 rounded-[40px] shadow-2xl relative max-h-[80vh] flex flex-col">
        <button onClick={() => setShowRequests(false)} className="absolute top-6 right-6 p-2 text-neutral-400 hover:text-black dark:hover:text-white transition"><X className="w-6 h-6" /></button>
        <div className="flex items-center gap-3 mb-6"><UserPlus className="w-6 h-6 text-blue-500" /><h2 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">İstek Yönetimi</h2></div>
        <div className="flex bg-neutral-100 dark:bg-black p-1.5 rounded-2xl mb-6 border border-neutral-200 dark:border-neutral-800 shrink-0">
          <button onClick={() => setTab('incoming')} className={`flex-1 py-2.5 rounded-xl text-[11px] font-black transition relative ${tab === 'incoming' ? 'bg-white dark:bg-neutral-800 text-black dark:text-white shadow' : 'text-neutral-500'}`}>GELEN İSTEKLER {incomingRequests.length > 0 && <span className="ml-2 bg-red-500 text-white px-1.5 py-0.5 rounded-md text-[9px]">{incomingRequests.length}</span>}</button>
          <button onClick={() => setTab('outgoing')} className={`flex-1 py-2.5 rounded-xl text-[11px] font-black transition ${tab === 'outgoing' ? 'bg-white dark:bg-neutral-800 text-black dark:text-white shadow' : 'text-neutral-500'}`}>GÖNDERİLENLER</button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
          {tab === 'incoming' && (incomingRequests.length === 0 ? <p className="text-xs text-neutral-500 text-center py-6">Bekleyen istek yok.</p> : incomingRequests.map(req => (
            <div key={req.id} className="flex items-center justify-between bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl">
              <span className="text-sm font-bold text-neutral-900 dark:text-white">{req.sender_username}</span>
              <div className="flex gap-2">
                <button onClick={() => handleAction('request', req.id, 'accept')} className="p-2 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-500 hover:bg-green-500 hover:text-white rounded-lg transition"><Check className="w-4 h-4" /></button>
                <button onClick={() => handleAction('request', req.id, 'reject')} className="p-2 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition"><X className="w-4 h-4" /></button>
              </div>
            </div>
          )))}
          {tab === 'outgoing' && (outgoingRequests.length === 0 ? <p className="text-xs text-neutral-500 text-center py-6">Gönderilmiş istek yok.</p> : outgoingRequests.map(req => (
            <div key={req.id} className="flex items-center justify-between bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl">
              <span className="text-sm font-bold text-neutral-900 dark:text-white">{req.receiver_username}</span>
              <button onClick={() => handleAction('request', req.id, 'cancel')} className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition text-xs font-bold"><XCircle className="w-4 h-4" /> İPTAL ET</button>
            </div>
          )))}
        </div>
      </div>
    </div>
  );
};

// --- 4. CHAT DETAILS MODAL ---
export const ChatDetailsModal = ({ activeChat, setShowChatDetails, handleStartCall, handleAction }) => {
  if (!activeChat) return null;
  return (
    <div className="absolute right-0 top-0 bottom-0 w-[420px] bg-white dark:bg-[#121212] border-l border-neutral-200 dark:border-neutral-800/60 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
      <div className="flex justify-start p-6"><button onClick={() => setShowChatDetails(false)} className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition"><X className="w-6 h-6" /></button></div>
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-8">
        <div className="flex flex-col items-center mb-8">
          {activeChat.avatar ? <img src={activeChat.avatar} className="w-24 h-24 rounded-full object-cover shadow-xl mb-4" alt="avatar"/> : <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white font-black text-4xl shadow-xl mb-4" style={{ backgroundColor: activeChat.color || '#2563eb' }}>{activeChat.name[0]?.toUpperCase()}</div>}
          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">{activeChat.name}</h2>
          {activeChat.isGroup && <p className="text-xs text-neutral-500 mt-1">{activeChat.members?.length || 1} Üye</p>}
        </div>
        <div className="flex justify-center gap-4 mb-8">
          <button onClick={() => handleStartCall('video')} className="flex flex-col items-center gap-2 p-3 bg-neutral-100 dark:bg-[#2a2a2a] hover:bg-neutral-200 dark:hover:bg-[#333] rounded-2xl w-[72px] transition"><Video className="w-5 h-5 text-neutral-600 dark:text-neutral-300" /><span className="text-[10px] text-neutral-600 dark:text-neutral-400">Video</span></button>
          <button onClick={() => handleStartCall('voice')} className="flex flex-col items-center gap-2 p-3 bg-neutral-100 dark:bg-[#2a2a2a] hover:bg-neutral-200 dark:hover:bg-[#333] rounded-2xl w-[72px] transition"><Phone className="w-5 h-5 text-neutral-600 dark:text-neutral-300" /><span className="text-[10px] text-neutral-600 dark:text-neutral-400">Audio</span></button>
        </div>
        <div className="border-t border-neutral-200 dark:border-neutral-800/80 pt-4 mb-4 space-y-1">
          <div className="flex items-center gap-4 p-3 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-xl cursor-pointer transition"><Edit2 className="w-5 h-5 text-neutral-400" /><span className="text-sm text-neutral-700 dark:text-neutral-200">Kullanıcı Adı / Lakap</span></div>
          <div className="flex items-center justify-between p-3 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-xl cursor-pointer transition">
            <div className="flex gap-4 items-center"><Palette className="w-5 h-5 text-neutral-400" /><span className="text-sm text-neutral-700 dark:text-neutral-200">Sohbet Rengi</span></div>
            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: activeChat.color || '#2563eb' }}></div>
          </div>
          <div className="flex items-center gap-4 p-3 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-xl cursor-pointer transition"><ImageIcon className="w-5 h-5 text-neutral-400" /><span className="text-sm text-neutral-700 dark:text-neutral-200">Medya, Linkler, Dosyalar</span></div>
        </div>
        <div className="border-t border-neutral-200 dark:border-neutral-800/80 pt-4 space-y-1">
          {!activeChat.isGroup && (
            <>
              <button onClick={() => handleAction('chat', activeChat.name, 'unfriend')} className="w-full flex items-center gap-4 p-3 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl cursor-pointer transition text-red-500"><XCircle className="w-5 h-5" /><span className="text-sm font-medium">Arkadaşlıktan Çıkar</span></button>
              <button onClick={() => handleAction('chat', activeChat.name, 'block')} className="w-full flex items-center gap-4 p-3 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl cursor-pointer transition text-red-500"><Ban className="w-5 h-5" /><span className="text-sm font-medium">Kullanıcıyı Engelle</span></button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// --- 5. SETTINGS MODAL ---
export const SettingsModal = ({ setShowSettings, currentUser, setCurrentUser, supabase, notify, theme, setTheme, primaryColor, setPrimaryColor }) => {
  const [newUsername, setNewUsername] = useState(currentUser);
  const [avatar, setAvatar] = useState(null);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const colors = ['#2563eb', '#059669', '#e11d48', '#7c3aed', '#d97706'];

  useEffect(() => {
    const fetchBlocked = async () => {
      const { data } = await supabase.from('blocked_users').select('blocked_username').eq('blocker_username', currentUser);
      if(data) setBlockedUsers(data.map(d => d.blocked_username));
    };
    fetchBlocked();
  }, [currentUser, supabase]);

  const handleUpdate = async () => {
    const { error } = await supabase.auth.updateUser({ data: { username: newUsername } });
    if (!error) { setCurrentUser(newUsername); setPrimaryColor(primaryColor); notify("Ayarlar güncellendi!", "success"); setShowSettings(false); }
  };

  const unblockUser = async (username) => {
    await supabase.from('blocked_users').delete().match({ blocker_username: currentUser, blocked_username: username });
    setBlockedUsers(blockedUsers.filter(u => u !== username));
    notify("Kullanıcı engeli kaldırıldı.", "success");
  };

  return (
    <div className="absolute inset-0 z-[150] bg-black/80 dark:bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8 rounded-[40px] shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        <button onClick={() => setShowSettings(false)} className="absolute top-6 right-6 p-2 text-neutral-400 hover:text-black dark:hover:text-white transition"><X className="w-6 h-6" /></button>
        <div className="flex items-center gap-3 mb-6"><Settings className="w-8 h-8 text-blue-500" /><h2 className="text-2xl font-black text-neutral-900 dark:text-white uppercase">Ayarlar</h2></div>
        
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center relative overflow-hidden group">
            {avatar ? <img src={avatar} className="w-full h-full object-cover" alt="profile"/> : <User className="w-8 h-8 text-neutral-400" />}
            <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center cursor-pointer transition"><Camera className="w-6 h-6 text-white"/></div>
          </div>
          <button className="text-[10px] text-red-500 mt-2 font-bold uppercase" onClick={() => setAvatar(null)}>Fotoğrafı Sıfırla</button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Görünüm Modu</label>
            <div className="flex gap-2 p-1 bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl">
              {[{ id: 'light', icon: Sun }, { id: 'dark', icon: Moon }, { id: 'system', icon: Monitor }].map(t => (
                <button key={t.id} onClick={() => setTheme(t.id)} className={`flex-1 flex justify-center py-2 rounded-lg transition ${theme === t.id ? 'bg-white dark:bg-neutral-800 text-black dark:text-white shadow' : 'text-neutral-500'}`}><t.icon className="w-4 h-4" /></button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Tema Rengi</label>
            <div className="flex items-center gap-3">
              {colors.map(c => <button key={c} onClick={() => setPrimaryColor(c)} style={{backgroundColor: c}} className={`w-8 h-8 rounded-full ${primaryColor === c ? 'ring-4 ring-neutral-300 dark:ring-neutral-700' : ''}`}/>)}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Engellenen Kullanıcılar</label>
            <div className="bg-neutral-100 dark:bg-black p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 max-h-32 overflow-y-auto">
              {blockedUsers.length === 0 ? <p className="text-xs text-neutral-500">Engellenen kimse yok.</p> : blockedUsers.map(u => (
                <div key={u} className="flex justify-between items-center mb-2 last:mb-0">
                  <span className="text-sm font-bold text-neutral-900 dark:text-white">{u}</span>
                  <button onClick={() => unblockUser(u)} className="text-xs bg-neutral-200 dark:bg-neutral-800 px-2 py-1 rounded text-neutral-700 dark:text-neutral-300">Kaldır</button>
                </div>
              ))}
            </div>
          </div>
          <button onClick={handleUpdate} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm transition">KAYDET</button>
        </div>
      </div>
    </div>
  );
};

// --- 6. CALL OVERLAY (P2P Gelişmiş Arama, Ekran Paylaşımı, Ses, Fullscreen) ---
export const CallOverlay = ({ activeChat, handleEndCall }) => {
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [fullScreenUser, setFullScreenUser] = useState(null);
  
  // Mock Katılımcılar (Grup ise çoklu, değilse tek)
  const participants = activeChat?.isGroup ? activeChat.members.map((m, i) => ({ id: i, name: m, volume: 100 })) : [{ id: 1, name: activeChat?.name, volume: 100 }];
  const [vols, setVols] = useState({});

  const toggleFullScreen = (id) => setFullScreenUser(fullScreenUser === id ? null : id);
  const handleVolume = (id, val) => setVols(prev => ({...prev, [id]: val}));

  return (
    <div className="absolute inset-0 z-[200] bg-neutral-950/95 backdrop-blur-xl flex flex-col p-6 text-white animate-in zoom-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-blue-500 animate-pulse" />
          <span className="text-xs uppercase tracking-widest font-mono text-neutral-400">Kignal HD P2P Link • {activeChat?.name}</span>
        </div>
        <div className="px-4 py-2 bg-red-600/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-black uppercase">CANLI • 4K 120FPS</div>
      </div>

      <div className={`flex-1 grid gap-4 transition-all ${fullScreenUser !== null ? 'grid-cols-1' : (participants.length > 1 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2')} items-center justify-center`}>
        {/* Kendi Ekranımız */}
        {fullScreenUser === null && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl h-full relative overflow-hidden flex flex-col items-center justify-center shadow-2xl">
             {isVideoOff && !isScreenSharing ? <div className="flex flex-col items-center"><Video className="w-12 h-12 text-neutral-600 mb-2"/><span>Kamera Kapalı</span></div> : <div className="absolute inset-0 bg-neutral-800 flex items-center justify-center"><Camera className="w-10 h-10 text-neutral-600 animate-pulse"/></div>}
             <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-lg text-xs backdrop-blur-md">Siz {isScreenSharing && "(Ekran Paylaşımı)"}</div>
          </div>
        )}

        {/* Karşı Taraf(lar) */}
        {participants.filter(p => fullScreenUser === null || fullScreenUser === p.id).map(p => (
          <div key={p.id} onClick={() => toggleFullScreen(p.id)} className="bg-neutral-900 border border-neutral-800 rounded-3xl h-full relative overflow-hidden flex flex-col items-center justify-center shadow-2xl cursor-pointer group">
            <div className={`w-24 h-24 rounded-full bg-blue-600/20 border border-blue-500/50 flex items-center justify-center text-4xl font-black shadow-2xl group-hover:scale-110 transition-transform`} style={{backgroundColor: activeChat?.color}}>{p.name[0]?.toUpperCase()}</div>
            
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center bg-black/60 px-4 py-2 rounded-xl backdrop-blur-md" onClick={e => e.stopPropagation()}>
              <span className="text-xs font-bold">{p.name}</span>
              <div className="flex items-center gap-2">
                <Volume2 className="w-3 h-3 text-neutral-400" />
                <input type="range" min="0" max="200" value={vols[p.id] ?? 100} onChange={(e) => handleVolume(p.id, e.target.value)} className="w-20 accent-blue-500" title={`Ses: %${vols[p.id] ?? 100}`} />
              </div>
            </div>
            {fullScreenUser === p.id && <button className="absolute top-4 right-4 p-2 bg-black/50 rounded-lg hover:bg-white/20 transition"><Minimize className="w-5 h-5"/></button>}
          </div>
        ))}
      </div>

      <div className="flex justify-center items-center gap-4 mt-6">
        <button onClick={() => setIsMuted(!isMuted)} className={`p-5 rounded-2xl transition border ${isMuted ? 'bg-red-500 border-red-500' : 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800'}`}>{isMuted ? <MicOff className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}</button>
        <button onClick={() => setIsVideoOff(!isVideoOff)} className={`p-5 rounded-2xl transition border ${isVideoOff ? 'bg-red-500 border-red-500' : 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800'}`}><Video className="w-6 h-6" /></button>
        <button onClick={() => setIsScreenSharing(!isScreenSharing)} className={`p-5 rounded-2xl transition border ${isScreenSharing ? 'bg-blue-500 border-blue-500 text-white' : 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-400'}`} title="Ekran Paylaş"><MonitorUp className="w-6 h-6" /></button>
        <button onClick={handleEndCall} className="p-5 bg-red-600 hover:bg-red-500 text-white rounded-[24px] transition font-black text-xs uppercase px-10">Aramayı Bitir</button>
      </div>
    </div>
  );
};

// AllModals.jsx dosyasının en altına ekle:
export default {
  AddFriendModal,
  CreateGroupModal,
  RequestsModal,
  ChatDetailsModal,
  SettingsModal,
  CallOverlay
};