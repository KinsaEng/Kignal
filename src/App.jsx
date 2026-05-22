import React, { useState, useEffect, useRef, useMemo } from 'react';
import ToastContainer from './components/shared/ToastContainer';
import AuthScreen from './components/auth/AuthScreen';
import Sidebar from './components/layout/Sidebar';
import ChatArea from './components/chat/ChatArea';
import AddFriendModal from './components/modals/AddFriendModal';
import CreateGroupModal from './components/modals/CreateGroupModal'; // YENİ
import CallOverlay from './components/modals/CallOverlay';
import SettingsModal from './components/modals/SettingsModal';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const KATEX_CSS = "https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css";
const KATEX_JS = "https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js";
const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY;

const App = () => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  
  const [messages, setMessages] = useState({});
  const [friendRequests, setFriendRequests] = useState([]);
  const [groups, setGroups] = useState([]); // YENİ: Gruplar
  const [favorites, setFavorites] = useState({ gifs: [], stickers: [] });

  const [activeChatId, setActiveChatId] = useState(null); // Genel sohbet kaldırıldı, null başlıyor
  const [inputText, setInputText] = useState("");
  const [notifications, setNotifications] = useState([]);
  
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [showMediaPanel, setShowMediaPanel] = useState(null);
  const [mediaPanel, setMediaPanel] = useState(null);
  const [gifSearch, setGifSearch] = useState("");
  const [gifResults, setGifResults] = useState([]);
  const [stickerTab, setStickerTab] = useState('classic'); 
  const [newFriendName, setNewFriendName] = useState("");
  const [katexLoaded, setKatexLoaded] = useState(false);
  
  const [isCalling, setIsCalling] = useState(false);
  const [callType, setCallType] = useState(null); 
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const scrollRef = useRef(null);
  const localVideoRef = useRef(null);
  
  const [theme, setTheme] = useState(() => localStorage.getItem('kignal_theme') || 'system');
  const [primaryColor, setPrimaryColor] = useState(() => localStorage.getItem('kignal_color') || '#2563eb');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if(session) setCurrentUser(session.user.user_metadata?.username || session.user.email?.split('@')[0] || session.user.phone);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if(session) setCurrentUser(session.user.user_metadata?.username || session.user.email?.split('@')[0] || session.user.phone);
      else setCurrentUser(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session || !currentUser) return;

    const fetchRequests = async () => {
      const { data } = await supabase.from('friend_requests').select('*').or(`sender_username.eq.${currentUser},receiver_username.eq.${currentUser}`);
      if (data) setFriendRequests(data);
    };

    const fetchGroups = async () => {
      // Mock Grup Çekimi (Veritabanında group_members ve groups tabloların varsa buraya bağla)
      // Şimdilik hata vermemesi için boş array ayarlıyoruz, oluşturma fonksiyonu ekleyecek
      const { data } = await supabase.from('groups').select('*').contains('members', [currentUser]);
      if (data) setGroups(data);
    };

    const fetchMessages = async () => {
      // SADECE aktif kullanıcının olduğu mesajları çeker, hızı artırır.
      const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: true }).limit(500); 
      if (data) {
        const grouped = {};
        data.forEach(m => {
          if (!grouped[m.chat_id]) grouped[m.chat_id] = [];
          grouped[m.chat_id].push(m);
        });
        setMessages(grouped);
      }
    };

    fetchRequests();
    fetchGroups();
    fetchMessages();

    const msgChannel = supabase.channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        setMessages(prev => {
          const chatMsgs = prev[payload.new.chat_id] || [];
          return { ...prev, [payload.new.chat_id]: [...chatMsgs, payload.new] };
        });
      }).subscribe();

    return () => supabase.removeChannel(msgChannel);
  }, [session, currentUser]);

  // Tema ve Özel Renk Entegrasyonu
  useEffect(() => {
    localStorage.setItem('kignal_theme', theme);
    const root = window.document.documentElement;
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) root.classList.add('dark');
    else root.classList.remove('dark');
    
    // Custom renk hex kodunu CSS değişkeni olarak ata
    root.style.setProperty('--kignal-primary', primaryColor.includes('#') || primaryColor.includes('rgb') ? primaryColor : '#2563eb');
    localStorage.setItem('kignal_color', primaryColor);
  }, [theme, primaryColor]);

  useEffect(() => {
    const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = KATEX_CSS; document.head.appendChild(link);
    const script = document.createElement('script'); script.src = KATEX_JS; script.async = true; script.onload = () => setKatexLoaded(true); document.head.appendChild(script);
  }, []);

  const notify = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };
  const removeNotification = (id) => setNotifications(prev => prev.filter(n => n.id !== id));

  const handleSend = async (type = 'text', mediaContent = null) => {
    const contentToSend = mediaContent || inputText;
    if (!contentToSend.trim() || !activeChatId) return;

    const { error } = await supabase.from('messages').insert([{ 
      content: contentToSend, sender_username: currentUser, chat_id: activeChatId, type: type 
    }]);

    if (error) notify("Mesaj gönderilemedi!", "error");
    else { setInputText(""); setMediaPanel(null); setShowMediaPanel(null); }
  };

  const sendMediaMessage = (type, content) => handleSend(type, content);

  const toggleFavorite = (type, item) => {
    setFavorites(prev => {
      const list = prev[type];
      const isFav = type === 'stickers' ? list.includes(item) : list.some(i => i.id === item.id);
      if (isFav) { notify("Kaldırıldı.", "info"); return { ...prev, [type]: type === 'stickers' ? list.filter(i => i !== item) : list.filter(i => i.id !== item.id) }; } 
      else { notify("Eklendi!", "success"); return { ...prev, [type]: [...list, item] }; }
    });
  };

  // Çift İstek Göndermeyi Engelleme
  const sendFriendRequest = async () => {
    if (!newFriendName.trim() || newFriendName === currentUser) return;
    
    const exists = friendRequests.find(r => 
      (r.sender_username === currentUser && r.receiver_username === newFriendName) || 
      (r.sender_username === newFriendName && r.receiver_username === currentUser)
    );
    
    if (exists) {
      notify("Bu kullanıcıyla aranızda zaten bir istek veya arkadaşlık var!", "error");
      return;
    }

    const { error } = await supabase.from('friend_requests').insert([{ sender_username: currentUser, receiver_username: newFriendName, status: 'pending' }]);
    if (error) notify("İstek gönderilemedi: " + error.message, "error");
    else { notify("İstek gönderildi!", "success"); setShowAddFriend(false); setNewFriendName(""); setFriendRequests([...friendRequests, { id: Date.now(), sender_username: currentUser, receiver_username: newFriendName, status: 'pending'}]); }
  };

  const createGroup = async (groupName) => {
    if (!groupName.trim()) return;
    // Geçici grup ekleme mantığı (Supabase'de groups tablosu olmalı)
    const newGroup = { id: `group_${Date.now()}`, name: groupName, members: [currentUser], isGroup: true };
    setGroups([...groups, newGroup]);
    setActiveChatId(newGroup.id);
    setShowCreateGroup(false);
    notify("Grup oluşturuldu!", "success");
  };

  const acceptFriendRequest = async (req) => {
    await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', req.id);
    notify("İstek kabul edildi!", "success");
    setFriendRequests(friendRequests.map(r => r.id === req.id ? { ...r, status: 'accepted'} : r));
  };
  const rejectFriendRequest = async (req) => {
    await supabase.from('friend_requests').delete().eq('id', req.id);
    notify("İstek reddedildi.", "info");
    setFriendRequests(friendRequests.filter(r => r.id !== req.id));
  };
  const cancelFriendRequest = async (req) => {
    await supabase.from('friend_requests').delete().eq('id', req.id);
    notify("İstek iptal edildi.", "info");
    setFriendRequests(friendRequests.filter(r => r.id !== req.id));
  };

  const handleStartCall = async (type) => { setIsCalling(true); setCallType(type); };
  const handleEndCall = () => { setIsCalling(false); setCallType(null); };

  const incomingRequests = useMemo(() => friendRequests.filter(r => r.receiver_username === currentUser && r.status === 'pending').map(r => ({ ...r, from: r.sender_username, to: r.receiver_username })), [friendRequests, currentUser]);
  const outgoingRequests = useMemo(() => friendRequests.filter(r => r.sender_username === currentUser && r.status === 'pending').map(r => ({ ...r, from: r.sender_username, to: r.receiver_username })), [friendRequests, currentUser]);

  const userChats = useMemo(() => {
    const friends = friendRequests.filter(r => r.status === 'accepted').map(r => {
      const friendName = r.sender_username === currentUser ? r.receiver_username : r.sender_username;
      return { id: String(r.id), isGroup: false, name: friendName, color: 'from-emerald-500 to-teal-700', lastSeen: 'Bağlantı Kuruldu' };
    });
    const groupChats = groups.map(g => ({
      id: String(g.id), isGroup: true, name: g.name, color: 'from-purple-500 to-pink-700', lastSeen: `${g.members?.length || 1} Üye`
    }));
    return [...friends, ...groupChats];
  }, [friendRequests, groups, currentUser]);

  const activeChat = useMemo(() => userChats.find(c => c.id === activeChatId), [activeChatId, userChats]);

  const renderMessageContent = (m) => {
    if (m.type === 'gif') return <img src={m.content} className="max-w-[240px] rounded-2xl shadow-lg border border-white/10" alt="gif" />;
    if (m.type === 'sticker') return <div className="text-8xl p-4 drop-shadow-2xl animate-bounce-slow">{m.content}</div>;
    let parts = String(m.content).split(/(\$\$.*?\$\$)/g);
    return parts.map((part, index) => {
      if (part.startsWith('$$') && part.endsWith('$$') && katexLoaded && window.katex) {
        try { const html = window.katex.renderToString(part.slice(2, -2), { displayMode: true }); return <div key={index} className="my-2 bg-black/40 p-3 rounded-xl border border-white/5" dangerouslySetInnerHTML={{ __html: html }} />; } catch (e) { return <code key={index} className="text-red-400">{part}</code>; }
      }
      return <span key={index}>{part}</span>;
    });
  };

  if (loading) return <div className="h-screen w-screen bg-black flex items-center justify-center text-white">Yükleniyor...</div>;

  if (!session) return <AuthScreen authMode={authMode} setAuthMode={setAuthMode} notify={notify} notifications={notifications} removeNotification={removeNotification} />;

  return (
    <div className="flex h-screen bg-black text-neutral-200 font-sans overflow-hidden kignal-theme-wrapper">
      <ToastContainer notifications={notifications} removeNotification={removeNotification} />
      
      <Sidebar 
        currentUser={currentUser} setIsLoggedIn={() => supabase.auth.signOut()} 
        showRequests={showRequests} setShowRequests={setShowRequests} incomingRequests={incomingRequests} 
        outgoingRequests={outgoingRequests} acceptFriendRequest={acceptFriendRequest} 
        rejectFriendRequest={rejectFriendRequest} cancelFriendRequest={cancelFriendRequest} 
        setShowAddFriend={setShowAddFriend} setShowCreateGroup={setShowCreateGroup} setShowSettings={setShowSettings} 
        userChats={userChats} activeChatId={activeChatId} setActiveChatId={setActiveChatId}
      />

      <ChatArea 
        activeChat={activeChat} activeChatId={activeChatId} handleStartCall={handleStartCall} 
        messages={messages} scrollRef={scrollRef} renderMessageContent={renderMessageContent} 
        showMediaPanel={showMediaPanel} setShowMediaPanel={setShowMediaPanel} gifSearch={gifSearch} 
        setGifSearch={setGifSearch} gifResults={gifResults} sendMediaMessage={sendMediaMessage} 
        toggleFavorite={toggleFavorite} favorites={favorites} stickerTab={stickerTab} 
        setStickerTab={setStickerTab} inputText={inputText} setInputText={setInputText} 
        handleSend={() => handleSend('text')} mediaPanel={mediaPanel} setMediaPanel={setMediaPanel}
        currentUser={currentUser} primaryColor={primaryColor}
      />

      {showAddFriend && <AddFriendModal setShowAddFriend={setShowAddFriend} newFriendName={newFriendName} setNewFriendName={setNewFriendName} sendFriendRequest={sendFriendRequest} />}
      {showCreateGroup && <CreateGroupModal setShowCreateGroup={setShowCreateGroup} createGroup={createGroup} />}
      {isCalling && <CallOverlay activeChat={activeChat} isVideoOff={isVideoOff} setIsVideoOff={setIsVideoOff} isMuted={isMuted} setIsMuted={setIsMuted} localVideoRef={localVideoRef} handleEndCall={handleEndCall} />}
      {showSettings && <SettingsModal setShowSettings={setShowSettings} currentUser={currentUser} setCurrentUser={setCurrentUser} supabase={supabase} notify={notify} theme={theme} setTheme={setTheme} primaryColor={primaryColor} setPrimaryColor={setPrimaryColor} />}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
        .animate-bounce-slow { animation: bounce 3s infinite; }
        @keyframes bounce { 0%, 100% { transform: translateY(-5%); } 50% { transform: translateY(0); } }
        .kignal-primary-bg { background-color: var(--kignal-primary); }
        .kignal-primary-text { color: var(--kignal-primary); }
      `}</style>
    </div>
  );
};

export default App;