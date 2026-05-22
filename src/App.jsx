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
  const [showChatDetails, setShowChatDetails] = useState(false); // YENİ

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
      const { data } = await supabase.from('groups').select('*').contains('members', [currentUser]);
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

    const msgChannel = supabase.channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        setMessages(prev => {
          const chatMsgs = prev[payload.new.chat_id] || [];
          // Çift mesaj (Deduplication) engelleme: Eğer mesaj zaten eklendiyse (optimistic UI) es geç.
          if (chatMsgs.some(m => m.id === payload.new.id)) return prev;
          return { ...prev, [payload.new.chat_id]: [...chatMsgs, payload.new] };
        });
      }).subscribe();

    return () => supabase.removeChannel(msgChannel);
  }, [session, currentUser]);

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

  // KULLANICI KONTROLLÜ İSTEK GÖNDERME
  const sendFriendRequest = async () => {
    if (!newFriendName.trim() || newFriendName === currentUser) return;
    
    // 1. Kullanıcı gerçekten var mı kontrolü (profiles tablosundan)
    const { data: userExists } = await supabase.from('profiles').select('username').eq('username', newFriendName).single();
    if (!userExists) {
      notify("Böyle bir kullanıcı bulunamadı!", "error");
      return;
    }

    // 2. Zaten istek atılmış mı kontrolü
    const exists = friendRequests.find(r => 
      (r.sender_username === currentUser && r.receiver_username === newFriendName) || 
      (r.sender_username === newFriendName && r.receiver_username === currentUser)
    );
    if (exists) {
      notify("Bu kullanıcıyla zaten bir bağınız var!", "error");
      return;
    }

    const { error } = await supabase.from('friend_requests').insert([{ sender_username: currentUser, receiver_username: newFriendName, status: 'pending' }]);
    if (error) notify("İstek gönderilemedi: " + error.message, "error");
    else { 
      notify("İstek başarıyla gönderildi!", "success"); 
      setShowAddFriend(false); setNewFriendName(""); 
      setFriendRequests([...friendRequests, { id: Date.now(), sender_username: currentUser, receiver_username: newFriendName, status: 'pending'}]); 
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

  const incomingRequests = useMemo(() => friendRequests.filter(r => r.receiver_username === currentUser && r.status === 'pending'), [friendRequests, currentUser]);
  const outgoingRequests = useMemo(() => friendRequests.filter(r => r.sender_username === currentUser && r.status === 'pending'), [friendRequests, currentUser]);

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
    <div className="flex h-screen bg-black text-neutral-200 font-sans overflow-hidden kignal-theme-wrapper">
      <ToastContainer notifications={notifications} removeNotification={removeNotification} />
      
      <Sidebar 
        currentUser={currentUser} setIsLoggedIn={() => supabase.auth.signOut()} 
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
      {showChatDetails && <ChatDetailsModal activeChat={activeChat} setShowChatDetails={setShowChatDetails} handleStartCall={handleStartCall} notify={notify} />}
      {isCalling && <CallOverlay activeChat={activeChat} isVideoOff={isVideoOff} setIsVideoOff={setIsVideoOff} isMuted={isMuted} setIsMuted={setIsMuted} localVideoRef={localVideoRef} handleEndCall={handleEndCall} />}
      {showSettings && <SettingsModal setShowSettings={setShowSettings} currentUser={currentUser} setCurrentUser={setCurrentUser} supabase={supabase} notify={notify} theme={theme} setTheme={setTheme} primaryColor={primaryColor} setPrimaryColor={setPrimaryColor} />}
    </div>
  );
};

export default App;