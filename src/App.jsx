import React, { useState, useEffect, useRef, useMemo } from 'react';
import ToastContainer from './components/shared/ToastContainer';
import AuthScreen from './components/auth/AuthScreen';
import Sidebar from './components/layout/Sidebar';
import ChatArea from './components/chat/ChatArea';
import AddFriendModal from './components/modals/AddFriendModal';
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
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  
  // DÜZELTİLEN KISIM: State'ler artık aktif ve boş başlıyor
  const [messages, setMessages] = useState({});
  const [friendRequests, setFriendRequests] = useState([]);
  const [favorites, setFavorites] = useState({ gifs: [], stickers: [] });

  const [activeChatId, setActiveChatId] = useState('general');
  const [inputText, setInputText] = useState("");
  const [notifications, setNotifications] = useState([]);
  
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
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
  
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('kignal_theme') || 'system');
  const [primaryColor, setPrimaryColor] = useState(() => localStorage.getItem('kignal_color') || 'blue');

  // AUTH BİLGİSİNİ ALMA
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if(session) {
        const name = session.user.user_metadata?.username || session.user.email.split('@')[0];
        setCurrentUser(name);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if(session) {
        const name = session.user.user_metadata?.username || session.user.email.split('@')[0];
        setCurrentUser(name);
      } else setCurrentUser(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // MESAJLARI VE ARKADAŞLIK İSTEKLERİNİ ÇEKME (REALTIME)
  useEffect(() => {
    if (!session || !currentUser) return;

    // Mesajları Çek
    const fetchMessages = async () => {
      const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
      if (data) {
        const grouped = {};
        data.forEach(m => {
          if (!grouped[m.chat_id]) grouped[m.chat_id] = [];
          grouped[m.chat_id].push(m);
        });
        setMessages(grouped);
      }
    };

    // İstekleri Çek
    const fetchRequests = async () => {
      const { data } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`sender_username.eq.${currentUser},receiver_username.eq.${currentUser}`);
      if (data) setFriendRequests(data);
    };

    fetchMessages();
    fetchRequests();

    // Dinleyiciler (Realtime)
    const msgChannel = supabase.channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        setMessages(prev => {
          const chatMsgs = prev[payload.new.chat_id] || [];
          return { ...prev, [payload.new.chat_id]: [...chatMsgs, payload.new] };
        });
      }).subscribe();

    const reqChannel = supabase.channel('public:friend_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, () => {
        fetchRequests(); // Değişiklik olunca listeyi yenile
      }).subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(reqChannel);
    };
  }, [session, currentUser]);

  // TEMA AYARLARI
  useEffect(() => {
    localStorage.setItem('kignal_theme', theme);
    const root = window.document.documentElement;
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme]);

  useEffect(() => localStorage.setItem('kignal_color', primaryColor), [primaryColor]);

  // KATEX VE GIPHY...
  useEffect(() => {
    const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = KATEX_CSS; document.head.appendChild(link);
    const script = document.createElement('script'); script.src = KATEX_JS; script.async = true; script.onload = () => setKatexLoaded(true); document.head.appendChild(script);
  }, []);

  useEffect(() => {
    const fetchGifs = async () => {
      try {
        let url = gifSearch ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(gifSearch)}&limit=12` : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=12`;
        const res = await fetch(url);
        const data = await res.json();
        setGifResults(data.data || []);
      } catch (err) { notify("GIF yüklenirken hata oluştu.", "error"); }
    };
    if (showMediaPanel === 'gif' || mediaPanel === 'gif') fetchGifs();
  }, [gifSearch, showMediaPanel, mediaPanel]);

  const notify = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };
  const removeNotification = (id) => setNotifications(prev => prev.filter(n => n.id !== id));

  // MESAJ GÖNDERME
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

  // --- SUPABASE ARKADAŞLIK SİSTEMİ FONKSİYONLARI ---
  const sendFriendRequest = async () => {
    if (!newFriendName.trim() || newFriendName === currentUser) return;
    const { error } = await supabase.from('friend_requests').insert([{ sender_username: currentUser, receiver_username: newFriendName, status: 'pending' }]);
    if (error) notify("İstek gönderilemedi: " + error.message, "error");
    else { notify("İstek gönderildi!", "success"); setShowAddFriend(false); setNewFriendName(""); }
  };

  const acceptFriendRequest = async (req) => {
    await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', req.id);
    notify("İstek kabul edildi!", "success");
  };

  const rejectFriendRequest = async (req) => {
    await supabase.from('friend_requests').delete().eq('id', req.id);
    notify("İstek reddedildi.", "info");
  };

  const cancelFriendRequest = async (req) => {
    await supabase.from('friend_requests').delete().eq('id', req.id);
    notify("İstek iptal edildi.", "info");
  };

  const handleStartCall = async (type) => { setIsCalling(true); setCallType(type); };
  const handleEndCall = () => { setIsCalling(false); setCallType(null); };

  // --- VERİLERİ ARAYÜZ İÇİN ŞEKİLLENDİRME ---
  const incomingRequests = useMemo(() => friendRequests.filter(r => r.receiver_username === currentUser && r.status === 'pending').map(r => ({ ...r, from: r.sender_username, to: r.receiver_username })), [friendRequests, currentUser]);
  const outgoingRequests = useMemo(() => friendRequests.filter(r => r.sender_username === currentUser && r.status === 'pending').map(r => ({ ...r, from: r.sender_username, to: r.receiver_username })), [friendRequests, currentUser]);

  const userChats = useMemo(() => {
    const defaultChat = { id: 'general', owner: 'all', name: 'Genel Sohbet', color: 'from-blue-600 to-indigo-700', lastSeen: 'Her zaman aktif' };
    const friends = friendRequests.filter(r => r.status === 'accepted').map(r => {
      const friendName = r.sender_username === currentUser ? r.receiver_username : r.sender_username;
      return { id: r.id, owner: 'private', name: friendName, color: 'from-emerald-500 to-teal-700', lastSeen: 'Bağlantı Kuruldu' };
    });
    return [defaultChat, ...friends];
  }, [friendRequests, currentUser]);

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

  if (!session) {
    return <AuthScreen authMode={authMode} setAuthMode={setAuthMode} notify={notify} notifications={notifications} removeNotification={removeNotification} />;
  }

  return (
    <div className="flex h-screen bg-black text-neutral-200 font-sans overflow-hidden">
      <ToastContainer notifications={notifications} removeNotification={removeNotification} />
      
      <Sidebar 
        currentUser={currentUser} setIsLoggedIn={() => supabase.auth.signOut()} 
        showRequests={showRequests} setShowRequests={setShowRequests} incomingRequests={incomingRequests} 
        outgoingRequests={outgoingRequests} acceptFriendRequest={acceptFriendRequest} 
        rejectFriendRequest={rejectFriendRequest} cancelFriendRequest={cancelFriendRequest} 
        setShowAddFriend={setShowAddFriend} userChats={userChats} activeChatId={activeChatId} 
        setActiveChatId={setActiveChatId}
      />

      <ChatArea 
        activeChat={activeChat} activeChatId={activeChatId} handleStartCall={handleStartCall} 
        messages={messages} scrollRef={scrollRef} renderMessageContent={renderMessageContent} 
        showMediaPanel={showMediaPanel} setShowMediaPanel={setShowMediaPanel} gifSearch={gifSearch} 
        setGifSearch={setGifSearch} gifResults={gifResults} sendMediaMessage={sendMediaMessage} 
        toggleFavorite={toggleFavorite} favorites={favorites} stickerTab={stickerTab} 
        setStickerTab={setStickerTab} inputText={inputText} setInputText={setInputText} 
        handleSend={() => handleSend('text')} mediaPanel={mediaPanel} setMediaPanel={setMediaPanel}
        currentUser={currentUser} 
      />

      {showAddFriend && <AddFriendModal setShowAddFriend={setShowAddFriend} newFriendName={newFriendName} setNewFriendName={setNewFriendName} sendFriendRequest={sendFriendRequest} />}
      {isCalling && <CallOverlay activeChat={activeChat} isVideoOff={isVideoOff} setIsVideoOff={setIsVideoOff} isMuted={isMuted} setIsMuted={setIsMuted} localVideoRef={localVideoRef} handleEndCall={handleEndCall} />}
      {showSettings && <SettingsModal setShowSettings={setShowSettings} currentUser={currentUser} setCurrentUser={setCurrentUser} supabase={supabase} notify={notify} theme={theme} setTheme={setTheme} primaryColor={primaryColor} setPrimaryColor={setPrimaryColor} />}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
        .animate-bounce-slow { animation: bounce 3s infinite; }
        @keyframes bounce { 0%, 100% { transform: translateY(-5%); } 50% { transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default App;