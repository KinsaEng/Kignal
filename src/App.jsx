import React, { useState, useEffect, useRef, useMemo } from 'react';
import ToastContainer from './components/shared/ToastContainer';
import AuthScreen from './components/auth/AuthScreen';
import Sidebar from './components/layout/Sidebar';
import ChatArea from './components/chat/ChatArea';
import { 
  AddFriendModal, 
  CreateGroupModal, 
  CallOverlay, 
  SettingsModal, 
  RequestsModal, 
  ChatDetailsModal 
} from './components/modals/AllModals';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const KATEX_CSS = "https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css";
const KATEX_JS = "https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js";

const App = () => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  
  const [messages, setMessages] = useState({});
  const [friendRequests, setFriendRequests] = useState([]);
  const [groups, setGroups] = useState([]); 
  const [favorites, setFavorites] = useState({ gifs: [], stickers: [] });

  const [activeChatId, setActiveChatId] = useState(null);
  const [inputText, setInputText] = useState("");
  const [notifications, setNotifications] = useState([]);
  
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChatDetails, setShowChatDetails] = useState(false);

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

  // --- 2. USEMEMO TANIMLAMALARI (YUKARI ALINDI!) ---
  // --- USEMEMO TANIMLAMALARI ---
  // 1. REF EKLİYORUZ (Sonsuz Döngüyü Kırmak İçin)
  const userChatsRef = useRef([]);

  const incomingRequests = useMemo(() => friendRequests.filter(r => r.receiver_username === currentUser && r.status === 'pending'), [friendRequests, currentUser]);
  const outgoingRequests = useMemo(() => friendRequests.filter(r => r.sender_username === currentUser && r.status === 'pending'), [friendRequests, currentUser]);

  const userChats = useMemo(() => {
    const friends = friendRequests.filter(r => r.status === 'accepted').map(r => {
      const friendName = r.sender_username === currentUser ? r.receiver_username : r.sender_username;
      return { id: String(r.id), isGroup: false, name: friendName, color: 'from-emerald-500 to-teal-700', lastSeen: 'Çevrimiçi' };
    });
    const groupChats = groups.map(g => ({
      id: String(g.id), isGroup: true, name: g.name, color: 'from-purple-500 to-pink-700', lastSeen: `${g.members?.length || 1} Üye`, members: g.members
    }));
    return [...friends, ...groupChats];
  }, [friendRequests, groups, currentUser]);

  const activeChat = useMemo(() => userChats.find(c => c.id === activeChatId), [activeChatId, userChats]);
  const friendsList = useMemo(() => userChats.filter(c => !c.isGroup), [userChats]);

  // 2. userChats değiştiğinde Ref'i sessizce güncelliyoruz (Render tetiklemez)
  useEffect(() => {
    userChatsRef.current = userChats;
  }, [userChats]);

  // (Session useEffect'i burada kalacak)
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

  // 3. ANA VERİ ÇEKME (userChats bağımlılığını sildik, SONSUZ DÖNGÜ BİTTİ!)
  useEffect(() => {
    if (!session || !currentUser) return;

    const fetchRequests = async () => {
      const { data } = await supabase.from('friend_requests').select('*').or(`sender_username.eq.${currentUser},receiver_username.eq.${currentUser}`);
      if (data) setFriendRequests(data);
    };

    const fetchGroups = async () => {
      // session yoksa sorguyu çalıştırma
      if (!session?.user?.id) return; 

      const { data, error } = await supabase
        .from('groups')
        .select('*, group_members!inner(user_id)') 
        .eq('group_members.user_id', session.user.id); // userId YERİNE session.user.id KULLANILMALI
        
      if (error) console.error("Grup çekme hatası:", error);
      if (data) setGroups(data);
    };

    const fetchMessages = async () => {
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

    fetchRequests(); fetchGroups(); fetchMessages();

    const msgChannel = supabase.channel('public-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        setMessages(prev => {
          const chatMsgs = prev[payload.new.chat_id] || [];
          if (chatMsgs.some(m => m.id === payload.new.id)) return prev;
          return { ...prev, [payload.new.chat_id]: [...chatMsgs, payload.new] };
        });
        
        // Ref kullanarak güncel userChats'e erişiyoruz
        if (!userChatsRef.current.some(c => c.id === payload.new.chat_id)) {
           fetchGroups(); 
        }
      }).subscribe();

    const requestsChannel = supabase.channel('public-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, () => {
        fetchRequests();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'groups' }, () => {
        fetchGroups();
      }).subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(requestsChannel);
    };
  }, [session, currentUser]); // <--- DİKKAT: userChats BURADAN SİLİNDİ!

  useEffect(() => {
    localStorage.setItem('kignal_theme', theme);
    const root = window.document.documentElement;
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) root.classList.add('dark'); else root.classList.remove('dark');
    root.style.setProperty('--kignal-primary', primaryColor);
    localStorage.setItem('kignal_color', primaryColor);
  }, [theme, primaryColor]);

  useEffect(() => {
    const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = KATEX_CSS; document.head.appendChild(link);
    const script = document.createElement('script'); script.src = KATEX_JS; script.async = true; script.onload = () => setKatexLoaded(true); document.head.appendChild(script);
  }, []);

  // App.jsx içine eklenecek
  useEffect(() => {
    // Session veya currentUser yoksa dinlemeye başlama
    if (!session?.user?.id) return;

    // messages tablosundaki INSERT (yeni mesaj ekleme) işlemlerini dinle
    const messagesChannel = supabase
      .channel('realtime-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMessage = payload.new;
          
          // Yeni mesaj geldiğinde state'i güncelle (Sayfa yenilemeye gerek kalmaz)
          // Not: "messages" state'ini nasıl tuttuğuna göre burayı ufak ayarlaman gerekebilir.
          // Eğer dizi olarak tutuyorsan: setMessages(prev => [...prev, newMessage]);
          // Eğer obje olarak tutuyorsan (benim gördüğüm kadarıyla obje tutuyorsun):
          setMessages(prev => ({
            ...prev,
            [newMessage.id]: newMessage
          }));
        }
      )
      .subscribe();

    // Bileşen kapandığında kanalı temizle
    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [session]); // Session değiştiğinde tetiklensin


  const notify = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };
  const removeNotification = (id) => setNotifications(prev => prev.filter(n => n.id !== id));

  // HIZLI MESAJ (Optimistic UI) ÇÖZÜMÜ
  const handleSend = async (type = 'text', mediaContent = null) => {
    const contentToSend = mediaContent || inputText;
    if (!contentToSend.trim() || !activeChatId) return;

    setInputText(""); setMediaPanel(null); setShowMediaPanel(null);

    // Veritabanına anında yaz ve geri dönen gerçek veriyi state'e ekle
    const { data, error } = await supabase.from('messages').insert([{ 
      content: contentToSend, sender_username: currentUser, chat_id: activeChatId, type: type 
    }]).select('*').single();

    if (error) {
      notify("Mesaj gönderilemedi!", "error");
    } else if (data) {
      setMessages(prev => {
        const currentChatMsgs = prev[activeChatId] || [];
        if (currentChatMsgs.some(m => m.id === data.id)) return prev;
        return { ...prev, [activeChatId]: [...currentChatMsgs, data] };
      });
    }
  };

  const sendMediaMessage = (type, content) => handleSend(type, content);


 const sendFriendRequest = async () => {
    if (!newFriendName.trim()) return notify("Lütfen bir kullanıcı adı girin.", "error");
    if (newFriendName === currentUser) return notify("Kendinize istek gönderemezsiniz.", "error");

    // 1. Kontrol: Zaten arkadaş mıyız? (Hata vermemesi için güvenli kontrol)
    const isAlreadyFriend = friendsList && friendsList.some(f => 
      (typeof f === 'string' ? f : (f.username || f.name)) === newFriendName
    );
    if (isAlreadyFriend) return notify("Bu kişiyle zaten arkadaşsınız.", "error");

    // 2. Kontrol: Bekleyen (Gelen veya Giden) bir istek zaten var mı?
    const { data: existingRequests } = await supabase
      .from('friend_requests')
      .select('*')
      .or(`and(sender.eq.${currentUser},receiver.eq.${newFriendName}),and(sender.eq.${newFriendName},receiver.eq.${currentUser})`);

    if (existingRequests && existingRequests.length > 0) {
      return notify("Bu kişiyle zaten bekleyen bir arkadaşlık işleminiz var.", "error");
    }

    // 3. Her şey temizse isteği gönder
    const { error } = await supabase
      .from('friend_requests')
      .insert([{ sender: currentUser, receiver: newFriendName, status: 'pending' }]);

    if (error) {
      notify("İstek gönderilemedi: " + error.message, "error");
    } else {
      notify("Arkadaşlık isteği başarıyla gönderildi!", "success");
      setShowAddFriend(false);
      setNewFriendName("");
    }
  };

  const createGroup = async (groupName, selectedMembers) => {
    if (!groupName.trim()) return;
    const members = [currentUser, ...selectedMembers];
    const newGroup = { id: `group_${Date.now()}`, name: groupName, members: members, isGroup: true };
    setGroups([...groups, newGroup]); // Supabase gruplarına bağladığında update et
    setActiveChatId(newGroup.id);
    setShowCreateGroup(false);
    notify("Grup oluşturuldu!", "success");
  };

  const handleRequestAction = async (reqId, action) => {
    if(action === 'accept') await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', reqId);
    else await supabase.from('friend_requests').delete().eq('id', reqId);
    
    notify(action === 'accept' ? "İstek kabul edildi!" : (action === 'reject' ? "İstek reddedildi." : "İstek iptal edildi."), action === 'accept' ? 'success' : 'info');
    
    if(action === 'accept') {
      setFriendRequests(friendRequests.map(r => r.id === reqId ? { ...r, status: 'accepted'} : r));
    } else {
      setFriendRequests(friendRequests.filter(r => r.id !== reqId));
    }
  };

  const handleStartCall = async (type) => { setIsCalling(true); setCallType(type); };
  const handleEndCall = () => { setIsCalling(false); setCallType(null); };


  // App.jsx içerisinde uygun bir yere ekleyin
  const toggleFavorite = (type, item) => {
    setFavorites(prev => {
      const list = prev[type];
      const isFavorite = list.includes(item);
      return {
        ...prev,
        [type]: isFavorite 
          ? list.filter(i => i !== item) 
          : [...list, item]
      };
    });
  };

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
    <div className="flex h-screen bg-white dark:bg-[#030303] text-neutral-900 dark:text-neutral-200 font-sans overflow-hidden transition-colors duration-300">
      <ToastContainer notifications={notifications} removeNotification={removeNotification} />
      
      
      <Sidebar 
        currentUser={currentUser} primaryColor={primaryColor} setIsLoggedIn={() => supabase.auth.signOut()} 
        setShowRequests={setShowRequests} incomingCount={incomingRequests.length}
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
        currentUser={currentUser} primaryColor={primaryColor} onHeaderClick={() => setShowChatDetails(true)}
      />

      {showAddFriend && <AddFriendModal setShowAddFriend={setShowAddFriend} newFriendName={newFriendName} setNewFriendName={setNewFriendName} sendFriendRequest={sendFriendRequest} />}
      {showCreateGroup && <CreateGroupModal setShowCreateGroup={setShowCreateGroup} createGroup={createGroup} friendsList={friendsList} />}
      {showRequests && <RequestsModal setShowRequests={setShowRequests} incomingRequests={incomingRequests} outgoingRequests={outgoingRequests} handleAction={handleRequestAction} />}
      {showChatDetails && <ChatDetailsModal activeChat={activeChat} setShowChatDetails={setShowChatDetails} handleStartCall={handleStartCall} handleAction={(type, target, action) => console.log(type, target, action)} notify={notify} />}
      {isCalling && <CallOverlay activeChat={activeChat} isVideoOff={isVideoOff} setIsVideoOff={setIsVideoOff} isMuted={isMuted} setIsMuted={setIsMuted} localVideoRef={localVideoRef} handleEndCall={handleEndCall} />}
      {showSettings && <SettingsModal setShowSettings={setShowSettings} currentUser={currentUser} setCurrentUser={setCurrentUser} supabase={supabase} notify={notify} theme={theme} setTheme={setTheme} primaryColor={primaryColor} setPrimaryColor={setPrimaryColor} />}
    </div>
  );
};

export default App;