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

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const KATEX_CSS = "https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css";
const KATEX_JS = "https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js";

const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY;

const DEFAULT_USERS = [
  { user: "admin", pass: "1234", email: "admin@kignal.com" },
  { user: "zeynep", pass: "1234", email: "zeynep@kignal.com" },
  { user: "ahmet", pass: "1234", email: "ahmet@kignal.com" }
];

const CHAT_COLORS = [
  "from-blue-600 to-indigo-700",
  "from-emerald-500 to-teal-700",
  "from-rose-500 to-pink-600",
  "from-violet-600 to-purple-800",
  "from-amber-500 to-orange-600"
];

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mediaPanel, setMediaPanel] = useState(null); 
  const [authMode, setAuthMode] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [registeredUsers, setRegisteredUsers] = useState(() => {
    const saved = localStorage.getItem('kignal_users');
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });
  
  const [chats, setChats] = useState(() => JSON.parse(localStorage.getItem('kignal_chats')) || []);
  const [messages, setMessages] = useState(() => JSON.parse(localStorage.getItem('kignal_messages')) || {});
  const [friendRequests, setFriendRequests] = useState(() => JSON.parse(localStorage.getItem('kignal_requests')) || []);
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('kignal_favorites')) || { gifs: [], stickers: [] });

  const [activeChatId, setActiveChatId] = useState(null);
  const [inputText, setInputText] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [loginInput, setLoginInput] = useState({ user: "", pass: "", email: "" });
  
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [showMediaPanel, setShowMediaPanel] = useState(null);
  const [gifSearch, setGifSearch] = useState("");
  const [gifResults, setGifResults] = useState([]);
  const [stickerTab, setStickerTab] = useState('classic'); 
  const [newFriendName, setNewFriendName] = useState("");
  const [katexLoaded, setKatexLoaded] = useState(false);
  
  const [isCalling, setIsCalling] = useState(false);
  const [callType, setCallType] = useState(null); 
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const scrollRef = useRef(null);
  const localVideoRef = useRef(null);

  // App.jsx içerisindeki mevcut useEffect'lerinin yanına bunu ekle
useEffect(() => {
  // 1. Mevcut mesajları çek
  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', 'general') // Sadece genel odadaki mesajlar
      .order('created_at', { ascending: true });
    
    if (data) setMessages(data);
  };

  fetchMessages();

  // 2. Yeni mesajları dinle (Realtime)
  const channel = supabase
    .channel('public:messages')
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'messages',
      filter: 'chat_id=eq.general' // Sadece genel oda mesajları
    }, payload => {
      setMessages(prev => [...prev, payload.new]);
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}, []);



  useEffect(() => {
    localStorage.setItem('kignal_users', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  useEffect(() => {
    localStorage.setItem('kignal_chats', JSON.stringify(chats));
    localStorage.setItem('kignal_messages', JSON.stringify(messages));
    localStorage.setItem('kignal_requests', JSON.stringify(friendRequests));
    localStorage.setItem('kignal_favorites', JSON.stringify(favorites));
  }, [chats, messages, friendRequests, favorites]);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet'; 
    link.href = KATEX_CSS;
    document.head.appendChild(link);
    
    const script = document.createElement('script');
    script.src = KATEX_JS; 
    script.async = true;
    script.onload = () => setKatexLoaded(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    const fetchGifs = async () => {
      try {
        let url = `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=12`;
        if (gifSearch) {
          url = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(gifSearch)}&limit=12`;
        }
        const res = await fetch(url);
        const data = await res.json();
        setGifResults(data.data || []);
      } catch (err) {
        notify("GIF yüklenirken hata oluştu.", "error");
      }
    };
    if (showMediaPanel === 'gif') {
      fetchGifs();
    }
  }, [gifSearch, showMediaPanel]);

  const notify = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!loginInput.user || !loginInput.pass) {
      notify("Lütfen tüm alanları doldurun!", "error");
      return;
    }
    const userObj = registeredUsers.find(u => 
      (u.user.toLowerCase() === loginInput.user.toLowerCase() || u.email.toLowerCase() === loginInput.user.toLowerCase()) 
      && u.pass === loginInput.pass
    );
    if (userObj) {
      setCurrentUser(userObj.user);
      setIsLoggedIn(true);
      notify(`Giriş başarılı! Hoş geldin, ${userObj.user}.`, 'success');
    } else {
      notify("Kullanıcı adı, e-posta veya şifre yanlış!", "error");
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    const { user, pass, email } = loginInput;
    if (!user || !pass || !email) {
      notify("Tüm alanları doldurmanız zorunludur!", "error");
      return;
    }
    const usernameExists = registeredUsers.some(u => u.user.toLowerCase() === user.toLowerCase());
    const emailExists = registeredUsers.some(u => u.email.toLowerCase() === email.toLowerCase());

    if (usernameExists) { notify("Bu kullanıcı adı zaten alınmış!", "error"); return; }
    if (emailExists) { notify("Bu e-posta adresiyle zaten kayıt yapılmış!", "error"); return; }

    const newUserObj = { user, pass, email };
    setRegisteredUsers(prev => [...prev, newUserObj]);
    notify("Hesabınız başarıyla oluşturuldu! Şimdi giriş yapabilirsiniz.", "success");
    setAuthMode('login');
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    const { user } = loginInput;
    if (!user) { notify("Lütfen e-posta adresinizi veya kullanıcı adınızı girin!", "error"); return; }

    const foundUser = registeredUsers.find(u => 
      u.user.toLowerCase() === user.toLowerCase() || u.email.toLowerCase() === user.toLowerCase()
    );
    if (foundUser) {
      console.log(`%c[KIGNAL DEBUG]%c Şifre Kurtarma Talebi:\nKullanıcı: ${foundUser.user}\nE-posta: ${foundUser.email}\nŞifre: ${foundUser.pass}`, "color: #3b82f6; font-weight: bold; font-size: 14px;", "color: white;");
      notify("Şifreniz geliştirici konsoluna (F12) başarıyla debuglandı!", "success");
      setAuthMode('login');
    } else {
      notify("Sistemde böyle bir kullanıcı bulunamadı!", "error");
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    // Supabase'e kaydet
    const { error } = await supabase
      .from('messages')
      .insert([
        { content: inputText, sender: currentUser, chat_id: 'general' }
      ]);

    if (error) {
      console.error("Mesaj gönderilemedi:", error);
      notify("Mesaj gönderilemedi!", "error");
    } else {
      setInputText(""); // Başarılıysa inputu temizle
    }
  };

  const sendMediaMessage = (type, content) => {
    handleSend(type, content);
    setShowMediaPanel(null);
  }

  const toggleFavorite = (type, item) => {
    setFavorites(prev => {
      const list = prev[type];
      const isAlreadyFav = type === 'stickers' ? list.includes(item) : list.some(i => i.id === item.id);

      if (isAlreadyFav) {
        notify("Favorilerden kaldırıldı.", "info");
        return { ...prev, [type]: type === 'stickers' ? list.filter(i => i !== item) : list.filter(i => i.id !== item.id) };
      } else {
        notify("Favorilere eklendi!", "success");
        return { ...prev, [type]: [...list, item] };
      }
    });
  };

  const sendFriendRequest = () => {
    if (!newFriendName.trim()) { notify("Lütfen geçerli bir kullanıcı adı girin!", "error"); return; }
    const targetName = newFriendName.trim();
    if (targetName.toLowerCase() === currentUser.toLowerCase()) { notify("Kendinizi arkadaş olarak ekleyemezsiniz!", "error"); return; }

    const userExists = registeredUsers.some(u => u.user.toLowerCase() === targetName.toLowerCase());
    if (!userExists) { notify("Böyle bir Kignal kullanıcısı bulunamadı!", "error"); return; }

    const alreadyFriends = chats.some(c => c.owner === currentUser && c.name.toLowerCase() === targetName.toLowerCase());
    if (alreadyFriends) { notify("Bu kullanıcıyla zaten arkadaşsınız!", "error"); return; }

    const requestAlreadyExists = friendRequests.some(r => 
      (r.from === currentUser && r.to.toLowerCase() === targetName.toLowerCase()) ||
      (r.from.toLowerCase() === targetName.toLowerCase() && r.to === currentUser)
    );
    if (requestAlreadyExists) { notify("Zaten beklemede olan bir arkadaşlık isteği mevcut!", "error"); return; }

    const newRequest = {
      id: Date.now(), from: currentUser,
      to: registeredUsers.find(u => u.user.toLowerCase() === targetName.toLowerCase()).user,
      status: 'pending'
    };
    setFriendRequests(prev => [...prev, newRequest]);
    notify(`Arkadaşlık isteği ${targetName} kullanıcısına gönderildi!`, "success");
    setNewFriendName("");
    setShowAddFriend(false);
  };

  const acceptFriendRequest = (req) => {
    const randomColor = CHAT_COLORS[Math.floor(Math.random() * CHAT_COLORS.length)];
    const mutualId = `chat_${Date.now()}`;

    const newChatForMe = { id: `${mutualId}_me`, owner: currentUser, name: req.from, color: randomColor, lastSeen: "Şimdi aktif" };
    const newChatForThem = { id: `${mutualId}_them`, owner: req.from, name: currentUser, color: randomColor, lastSeen: "Şimdi aktif" };
    
    setChats(prev => [...prev, newChatForMe, newChatForThem]);
    setFriendRequests(prev => prev.filter(r => r.id !== req.id));
    notify(`${req.from} ile artık arkadaşsınız!`, "success");
  };

  const rejectFriendRequest = (req) => {
    setFriendRequests(prev => prev.filter(r => r.id !== req.id));
    notify("Arkadaşlık isteği reddedildi.", "info");
  };

  const cancelFriendRequest = (req) => {
    setFriendRequests(prev => prev.filter(r => r.id !== req.id));
    notify("Arkadaşlık isteği iptal edildi.", "info");
  };

  const activeChat = useMemo(() => chats.find(c => c.id === activeChatId), [activeChatId, chats]);
  const userChats = useMemo(() => chats.filter(c => c.owner === currentUser), [chats, currentUser]);
  const incomingRequests = useMemo(() => friendRequests.filter(r => r.to === currentUser && r.status === 'pending'), [friendRequests, currentUser]);
  const outgoingRequests = useMemo(() => friendRequests.filter(r => r.from === currentUser && r.status === 'pending'), [friendRequests, currentUser]);

  const handleStartCall = async (type) => {
    setIsCalling(true);
    setCallType(type);
    
    if (type === 'screen') {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { width: { ideal: 3840 }, height: { ideal: 2160 }, frameRate: { ideal: 120 } }, audio: true
        });
        setScreenStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch (err) {
        notify("Ekran paylaşımı başlatılamadı. İzin reddedilmiş olabilir.", "error");
        setIsCalling(false);
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: type === 'video', audio: true });
        setScreenStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch (err) {
        notify("Kamera veya mikrofon erişimi başarısız oldu.", "error");
        setIsCalling(false);
      }
    }
  };

  const handleEndCall = () => {
    if (screenStream) screenStream.getTracks().forEach(track => track.stop());
    setScreenStream(null);
    setIsCalling(false);
    setCallType(null);
    notify("Aramayı sonlandırdınız.", "info");
  };

  const renderMessageContent = (m) => {
    if (m.type === 'gif') return <img src={m.content} className="max-w-[240px] rounded-2xl shadow-lg border border-white/10" alt="gif" />;
    if (m.type === 'sticker') return <div className="text-8xl p-4 drop-shadow-2xl animate-bounce-slow">{m.content}</div>;
    
    let parts = String(m.content).split(/(\$\$.*?\$\$)/g);
    return parts.map((part, index) => {
      if (part.startsWith('$$') && part.endsWith('$$') && katexLoaded && window.katex) {
        try {
          const html = window.katex.renderToString(part.slice(2, -2), { displayMode: true });
          return <div key={index} className="my-2 bg-black/40 p-3 rounded-xl border border-white/5" dangerouslySetInnerHTML={{ __html: html }} />;
        } catch (e) { 
          return <code key={index} className="text-red-400 bg-red-950/20 p-1 rounded">{part}</code>; 
        }
      }
      return <span key={index}>{part}</span>;
    });
  };

  if (!isLoggedIn) {
    return (
      <AuthScreen 
        authMode={authMode} setAuthMode={setAuthMode} handleLogin={handleLogin} 
        handleRegister={handleRegister} handleForgotPassword={handleForgotPassword} 
        loginInput={loginInput} setLoginInput={setLoginInput} setCurrentUser={setCurrentUser} 
        setIsLoggedIn={setIsLoggedIn} notify={notify} notifications={notifications}
        removeNotification={removeNotification}
      />
    );
  }

  return (
    <div className="flex h-screen bg-black text-neutral-200 font-sans overflow-hidden">
      <ToastContainer notifications={notifications} removeNotification={removeNotification} />
      
      <Sidebar 
        currentUser={currentUser} setIsLoggedIn={setIsLoggedIn} showRequests={showRequests} 
        setShowRequests={setShowRequests} incomingRequests={incomingRequests} 
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
        handleSend={handleSend} mediaPanel={mediaPanel} setMediaPanel={setMediaPanel}
      />

      {showAddFriend && (
        <AddFriendModal 
          setShowAddFriend={setShowAddFriend} newFriendName={newFriendName} 
          setNewFriendName={setNewFriendName} sendFriendRequest={sendFriendRequest}
        />
      )}

      {isCalling && (
        <CallOverlay 
          activeChat={activeChat} isVideoOff={isVideoOff} setIsVideoOff={setIsVideoOff} 
          isMuted={isMuted} setIsMuted={setIsMuted} localVideoRef={localVideoRef} 
          handleEndCall={handleEndCall}
        />
      )}

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