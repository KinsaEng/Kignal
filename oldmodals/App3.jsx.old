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
  
  const [incomingCall, setIncomingCall] = useState(null); // Gelen arama sinyali durum bilgisi
  const [activeCall, setActiveCall] = useState(null);     // Aktif devam eden arama bilgisi

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

  // "Yazıyor..." durumu için state ve refler
  const [typingUsers, setTypingUsers] = useState({});
  const typingChannelRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
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

  // GERÇEK ZAMANLI TAKİP İÇİN EFFECT BLOĞU
  useEffect(() => {
    if (!currentUser) return;

    // 1. Gerçek Zamanlı Arama Kanalı (Broadcast Sinyalleri)
    const callChannel = supabase
      .channel('realtime-calls')
      .on('broadcast', { event: 'call-invite' }, ({ payload }) => {
        // Birisi bizi arıyorsa anlık olarak ekranda modal tetiklensin
        if (payload.receiver === currentUser && payload.status === 'ringing') {
          setIncomingCall(payload);
        }
      })
      .on('broadcast', { event: 'call-action' }, ({ payload }) => {
        if (payload.room_id === activeCall?.room_id || payload.room_id === incomingCall?.room_id) {
          if (payload.status === 'ended') {
            setIsCalling(false);
            setIncomingCall(null);
            setActiveCall(null);
          } else if (payload.status === 'accepted') {
            setIsCalling(true);
            setIncomingCall(null);
            setActiveCall(payload);
          }
        }
      })
      .subscribe();

    // 2. Gerçek Zamanlı Arkadaşlık İstekleri & DM Listesi Güncellemesi (Postgres Changes)
    const friendshipChannel = supabase
      .channel('friendship-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'friend_requests' }, (payload) => {
        // İstek bize geldiyse anlık olarak istek listesine ekle
        if (payload.new.receiver === currentUser) {
          setFriendRequests(prev => [...prev, payload.new]);
          notify("Yeni bir arkadaşlık isteği aldınız!", "info");
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'friend_requests' }, (payload) => {
        const { sender, receiver, status } = payload.new;
        // İstek onaylandığı an iki tarafta da yenileme olmadan DM listesine sol tarafa yansır
        if ((sender === currentUser || receiver === currentUser) && status === 'accepted') {
          const friendName = sender === currentUser ? receiver : sender;
          
          setUserChats(prev => {
            // Eğer zaten listede varsa mükerrer ekleme yapma
            if (prev.some(c => c.name === friendName)) return prev;
            return [
              ...prev,
              {
                id: friendName, // ya da benzersiz oda/kullanıcı ID'si
                name: friendName,
                color: 'from-blue-500 to-indigo-600',
                lastSeen: 'Az önce'
              }
            ];
          });
          notify(`${friendName} ile artık arkadaşsınız! DM listenize eklendi.`, "success");
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(callChannel);
      supabase.removeChannel(friendshipChannel);
    };
  }, [currentUser, activeCall, incomingCall]);

// Arama kabul etme fonksiyonu
const handleAcceptCall = () => {
  if (!incomingCall) return;
  const acceptedPayload = { ...incomingCall, status: 'accepted' };
  
  // Arayan tarafa kabul edildiğini broadcast et
  supabase.channel('realtime-calls').send({
    type: 'broadcast',
    event: 'call-action',
    payload: acceptedPayload
  });

  setActiveCall(acceptedPayload);
  setIsCalling(true);
  setIncomingCall(null);
};

// Arama reddetme / sonlandırma fonksiyonu
const handleRejectCall = () => {
  const targetCall = incomingCall || activeCall;
  if (!targetCall) return;

  supabase.channel('realtime-calls').send({
    type: 'broadcast',
    event: 'call-action',
    payload: { ...targetCall, status: 'ended' }
  });

  setIsCalling(false);
  setIncomingCall(null);
  setActiveCall(null);
};

  useEffect(() => {
    userChatsRef.current = userChats;
  }, [userChats]);

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
      if (!session?.user?.id) return; 
      const { data, error } = await supabase
        .from('groups')
        .select('*, group_members!inner(user_id)') 
        .eq('group_members.user_id', session.user.id); 
        
      if (error) console.error("Grup çekme hatası:", error);
      if (data) setGroups(data);
    };

    const fetchMessages = async () => {
      const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: true }).limit(500); 
      if (data) {
        const grouped = {};
        data.forEach(m => {
          const chatId = String(m.chat_id);
          if (!grouped[chatId]) grouped[chatId] = [];
          grouped[chatId].push(m);
        });
        setMessages(grouped);
      }
    };

    fetchRequests(); fetchGroups(); fetchMessages();

    // MESAJ KANALI: Anlık mesajların düşmesini sağlayan alan
    const msgChannel = supabase.channel('public-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        setMessages(prev => {
          const chatId = String(payload.new.chat_id);
          const chatMsgs = prev[chatId] || [];
          if (chatMsgs.some(m => String(m.id) === String(payload.new.id))) return prev;
          return { ...prev, [chatId]: [...chatMsgs, payload.new] };
        });
        
        if (!userChatsRef.current.some(c => String(c.id) === String(payload.new.chat_id))) {
           fetchGroups(); 
        }
      }).subscribe();

    // YAZIYOR... KANALI: Anlık . . . animasyonu için yayın (broadcast) sistemi
    const typingChannel = supabase.channel('typing-room', {
      config: { broadcast: { self: false } }
    });

    typingChannel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        // Eğer grupta veya özel sohbette başka biri yazıyorsa durumu yakala
        setTypingUsers(prev => ({
           ...prev,
           [payload.chat_id]: payload.isTyping ? payload.username : null
        }));
      })
      .subscribe((status) => {
         if(status === 'SUBSCRIBED') {
            typingChannelRef.current = typingChannel;
         }
      });

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
      supabase.removeChannel(typingChannel);
      typingChannelRef.current = null;
    };
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

  // KULLANICI YAZARKEN TETİKLENEN YENİ FONKSİYON
  const handleTypingChange = (text) => {
      setInputText(text);

      if (typingChannelRef.current && activeChatId) {
          // Yazmaya başladığını herkese bildir
          typingChannelRef.current.send({
              type: 'broadcast',
              event: 'typing',
              payload: { chat_id: String(activeChatId), username: currentUser, isTyping: text.length > 0 }
          });

          // 2 saniye boyunca hiçbir şeye basmazsa "yazıyor" durumunu kaldır
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
               if (typingChannelRef.current) {
                   typingChannelRef.current.send({
                       type: 'broadcast',
                       event: 'typing',
                       payload: { chat_id: String(activeChatId), username: currentUser, isTyping: false }
                   });
               }
          }, 2000);
      }
  };

  const handleSend = async (type = 'text', mediaContent = null) => {
    const contentToSend = mediaContent || inputText;
    if (!contentToSend.trim() || !activeChatId) return;

    setInputText(""); setMediaPanel(null); setShowMediaPanel(null);

    // Mesajı gönderdiğinde yazıyor durumunu iptal et
    if (typingChannelRef.current) {
        typingChannelRef.current.send({
            type: 'broadcast',
            event: 'typing',
            payload: { chat_id: String(activeChatId), username: currentUser, isTyping: false }
        });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    const { data, error } = await supabase.from('messages').insert([{ 
      content: contentToSend, sender_username: currentUser, chat_id: activeChatId, type: type 
    }]).select('*').single();

    if (error) {
      notify("Mesaj gönderilemedi!", "error");
    } else if (data) {
      setMessages(prev => {
        const chatId = String(activeChatId);
        const currentChatMsgs = prev[chatId] || [];
        if (currentChatMsgs.some(m => String(m.id) === String(data.id))) return prev;
        return { ...prev, [chatId]: [...currentChatMsgs, data] };
      });
    }
  };

  const sendMediaMessage = (type, content) => handleSend(type, content);

  const sendFriendRequest = async () => {
    if (!newFriendName.trim() || newFriendName === currentUser) return;
    
    const { data: userExists, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', newFriendName) 
      .maybeSingle();

    if (userError) {
        console.error(userError);
        return;
    }
    if (!userExists) {
        notify("Böyle bir kullanıcı bulunamadı (Büyük/Küçük harf duyarlı olabilir)!", "error");
        return;
    }
    
    const exists = friendRequests.find(r => 
      (r.sender_username === currentUser && r.receiver_username === newFriendName) || 
      (r.sender_username === newFriendName && r.receiver_username === currentUser)
    );
    if (exists) {
      notify("Bu kullanıcıyla zaten bir bağınız var!", "error");
      return;
    }

    const { data, error } = await supabase
      .from('friend_requests')
      .insert([{ sender_username: currentUser, receiver_username: newFriendName, status: 'pending' }])
      .select() 
      .single();

    if (error) {
      notify("İstek gönderilemedi: " + error.message, "error");
    } else { 
      notify("İstek başarıyla gönderildi!", "success"); 
      setShowAddFriend(false); 
      setNewFriendName(""); 
      if (data) {
        setFriendRequests([...friendRequests, data]); 
      }
    }
  };

  const createGroup = async (groupName, selectedMembers) => {
    if (!groupName.trim()) return;
    const members = [currentUser, ...selectedMembers];
    const newGroup = { id: `group_${Date.now()}`, name: groupName, members: members, isGroup: true };
    setGroups([...groups, newGroup]); 
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
        setStickerTab={setStickerTab} inputText={inputText} 
        handleTypingChange={handleTypingChange} // YENİ EKLENDİ
        typingUsers={typingUsers} // YENİ EKLENDİ
        handleSend={() => handleSend('text')} mediaPanel={mediaPanel} setMediaPanel={setMediaPanel}
        currentUser={currentUser} primaryColor={primaryColor} onHeaderClick={() => setShowChatDetails(true)}
      />

      {showAddFriend && <AddFriendModal setShowAddFriend={setShowAddFriend} newFriendName={newFriendName} setNewFriendName={setNewFriendName} sendFriendRequest={sendFriendRequest} />}
      {showCreateGroup && <CreateGroupModal setShowCreateGroup={setShowCreateGroup} createGroup={createGroup} friendsList={friendsList} />}
      {showRequests && <RequestsModal setShowRequests={setShowRequests} incomingRequests={incomingRequests} outgoingRequests={outgoingRequests} handleAction={handleRequestAction} />}
      {showChatDetails && <ChatDetailsModal activeChat={activeChat} setShowChatDetails={setShowChatDetails} handleStartCall={handleStartCall} handleAction={(type, target, action) => console.log(type, target, action)} notify={notify} />}
      {isCalling && <CallOverlay      activeChat={activeChat}      currentUser={currentUser}      isVideoOff={isVideoOff}      setIsVideoOff={setIsVideoOff}      isMuted={isMuted}      setIsMuted={setIsMuted}      handleEndCall={handleEndCall}      supabase={supabase}    />}
      {showSettings && <SettingsModal setShowSettings={setShowSettings} currentUser={currentUser} setCurrentUser={setCurrentUser} supabase={supabase} notify={notify} theme={theme} setTheme={setTheme} primaryColor={primaryColor} setPrimaryColor={setPrimaryColor} />}
      {/* GELEN ARAMA ANLIK BİLDİRİM PANELİ */} {incomingCall && (   <div className="fixed inset-x-0 top-6 mx-auto w-full max-w-sm bg-neutral-900/95 backdrop-blur-2xl border border-neutral-800 p-6 rounded-[32px] shadow-2xl z-[200] flex flex-col items-center gap-4 animate-in slide-in-from-top duration-300">     <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 animate-pulse">       <Phone className="w-6 h-6" />     </div>     <div className="text-center">       <h4 className="text-sm font-black text-white uppercase tracking-wider">{incomingCall.caller} Arıyor...</h4>       <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-0.5">Gelen Sesli/Görüntülü Arama</p>     </div>     <div className="flex gap-3 w-full mt-2">       <button onClick={handleRejectCall} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white text-xs font-black uppercase rounded-xl transition active:scale-95">Reddet</button>       <button onClick={handleAcceptCall} className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white text-xs font-black uppercase rounded-xl transition active:scale-95 animate-bounce">Kabul Et</button>     </div>   </div> )}
    
    
    </div>
  );
};

export default App;