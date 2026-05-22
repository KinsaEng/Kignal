import React, { useState, useEffect, useRef, useMemo } from 'react';
import ToastContainer from './components/shared/ToastContainer';
import AuthScreen from './components/auth/AuthScreen';
import Sidebar from './components/layout/Sidebar';
import ChatArea from './components/chat/ChatArea';
import AddFriendModal from './components/modals/AddFriendModal';
import CallOverlay from './components/modals/CallOverlay';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey); // AuthScreen'de kullanmak için export ettik

const KATEX_CSS = "https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css";
const KATEX_JS = "https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js";
const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY;

const CHAT_COLORS = [
  "from-blue-600 to-indigo-700", "from-emerald-500 to-teal-700", 
  "from-rose-500 to-pink-600", "from-violet-600 to-purple-800", "from-amber-500 to-orange-600"
];

const App = () => {
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  
  // // Local states for UI
  // const [chats, setChats] = useState(() => JSON.parse(localStorage.getItem('kignal_chats')) || [{ id: 'general', owner: 'all', name: 'Genel Sohbet', color: 'from-blue-600 to-indigo-700', lastSeen: 'Her zaman aktif' }]);
  // const [messages, setMessages] = useState({});
  // const [friendRequests, setFriendRequests] = useState(() => JSON.parse(localStorage.getItem('kignal_requests')) || []);
  // const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('kignal_favorites')) || { gifs: [], stickers: [] });

  const [activeChatId, setActiveChatId] = useState('general');
  const [inputText, setInputText] = useState("");
  const [notifications, setNotifications] = useState([]);
  
  // Modals & Panels
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [showMediaPanel, setShowMediaPanel] = useState(null);
  const [mediaPanel, setMediaPanel] = useState(null);
  const [gifSearch, setGifSearch] = useState("");
  const [gifResults, setGifResults] = useState([]);
  const [stickerTab, setStickerTab] = useState('classic'); 
  const [newFriendName, setNewFriendName] = useState("");
  const [katexLoaded, setKatexLoaded] = useState(false);
  
  // Call States
  const [isCalling, setIsCalling] = useState(false);
  const [callType, setCallType] = useState(null); 
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const scrollRef = useRef(null);
  const localVideoRef = useRef(null);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('kignal_theme') || 'system');
  const [primaryColor, setPrimaryColor] = useState(() => localStorage.getItem('kignal_color') || 'blue');
  // SUPABASE AUTH LISTENER
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if(session) {
        // Eğer metadata'da username varsa onu kullan, yoksa email'in ilk kısmını
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

  // SUPABASE MESSAGES LISTENER (Sadece giriş yapıldıysa çalışır)
  useEffect(() => {
    if (!session) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
      if (data) {
        const grouped = {};
        data.forEach(m => {
          if (!grouped[m.chat_id]) grouped[m.chat_id] = [];
          grouped[m.chat_id].push(m);
        });
        setMessages(grouped);
      }
    };

    fetchMessages();

    const channel = supabase.channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        setMessages(prev => {
          const chatMsgs = prev[payload.new.chat_id] || [];
          return { ...prev, [payload.new.chat_id]: [...chatMsgs, payload.new] };
        });
      }).subscribe();

    return () => supabase.removeChannel(channel);
  }, [session]);


  useEffect(() => {
  localStorage.setItem('kignal_theme', theme);
  const root = window.document.documentElement;
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) root.classList.add('dark');
  else root.classList.remove('dark');
  }, [theme]);

  useEffect(() => {
  localStorage.setItem('kignal_color', primaryColor);
  // Eğer tüm projede rengin anında değişmesini istersen Tailwind yapılandırmanda 
  // primary rengini bu değişkene bağlayabiliriz. Şimdilik SettingsModal içinde çalışır.
  }, [primaryColor]);

  // // UI LocalStorage Sync
  // useEffect(() => {
  //   localStorage.setItem('kignal_chats', JSON.stringify(chats));
  //   localStorage.setItem('kignal_requests', JSON.stringify(friendRequests));
  //   localStorage.setItem('kignal_favorites', JSON.stringify(favorites));
  // }, [chats, friendRequests, favorites]);

  // KaTeX Script Load
  useEffect(() => {
    const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = KATEX_CSS; document.head.appendChild(link);
    const script = document.createElement('script'); script.src = KATEX_JS; script.async = true; script.onload = () => setKatexLoaded(true); document.head.appendChild(script);
  }, []);

  // Giphy Search
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

  // SUPABASE SEND MESSAGE
  const handleSend = async (type = 'text', mediaContent = null) => {
    const contentToSend = mediaContent || inputText;
    if (!contentToSend.trim() || !activeChatId) return;

    const { error } = await supabase.from('messages').insert([{ 
      content: contentToSend, 
      sender: currentUser, 
      chat_id: activeChatId,
      type: type 
    }]);

    if (error) {
      console.error(error);
      notify("Mesaj gönderilemedi!", "error");
    } else {
      setInputText("");
      setMediaPanel(null);
      setShowMediaPanel(null);
    }
  };

  const sendMediaMessage = (type, content) => handleSend(type, content);

  const toggleFavorite = (type, item) => {
    setFavorites(prev => {
      const list = prev[type];
      const isFav = type === 'stickers' ? list.includes(item) : list.some(i => i.id === item.id);
      if (isFav) { notify("Favorilerden kaldırıldı.", "info"); return { ...prev, [type]: type === 'stickers' ? list.filter(i => i !== item) : list.filter(i => i.id !== item.id) }; } 
      else { notify("Favorilere eklendi!", "success"); return { ...prev, [type]: [...list, item] }; }
    });
  };

  // --- UI Functions (Arama, İstek Gönderme vb.) ---
  const sendFriendRequest = () => { /* Mevcut kodlar aynı bırakıldı, sadece görsel */ };
  const acceptFriendRequest = (req) => { /* Mevcut kodlar */ };
  const rejectFriendRequest = (req) => { /* Mevcut kodlar */ };
  const cancelFriendRequest = (req) => { /* Mevcut kodlar */ };
  const handleStartCall = async (type) => { /* Mevcut kodlar */ };
  const handleEndCall = () => { /* Mevcut kodlar */ };

  const activeChat = useMemo(() => chats.find(c => c.id === activeChatId), [activeChatId, chats]);
  const userChats = chats; // Şimdilik tüm chatleri göster
  const incomingRequests = useMemo(() => friendRequests.filter(r => r.to === currentUser && r.status === 'pending'), [friendRequests, currentUser]);
  const outgoingRequests = useMemo(() => friendRequests.filter(r => r.from === currentUser && r.status === 'pending'), [friendRequests, currentUser]);

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
    return (
      <AuthScreen 
        authMode={authMode} setAuthMode={setAuthMode}
        notify={notify} notifications={notifications} removeNotification={removeNotification}
      />
    );
  }

  return (
    <div className="flex h-screen bg-black text-neutral-200 font-sans overflow-hidden">
      <ToastContainer notifications={notifications} removeNotification={removeNotification} />
      
      <Sidebar 
        currentUser={currentUser} 
        setIsLoggedIn={() => supabase.auth.signOut()} // Çıkış yap butonu güncellendi
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
        currentUser={currentUser} // Mesaj balonlarının sağda solda çıkması için
      />

      {showAddFriend && <AddFriendModal setShowAddFriend={setShowAddFriend} newFriendName={newFriendName} setNewFriendName={setNewFriendName} sendFriendRequest={sendFriendRequest} />}
      {isCalling && <CallOverlay activeChat={activeChat} isVideoOff={isVideoOff} setIsVideoOff={setIsVideoOff} isMuted={isMuted} setIsMuted={setIsMuted} localVideoRef={localVideoRef} handleEndCall={handleEndCall} />}
      {showSettings && (   <SettingsModal      setShowSettings={setShowSettings} currentUser={currentUser}      setCurrentUser={setCurrentUser} supabase={supabase} notify={notify}     theme={theme} setTheme={setTheme}      primaryColor={primaryColor} setPrimaryColor={setPrimaryColor}   /> )}

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