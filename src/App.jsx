import React, { useState, useEffect, useRef, useMemo } from 'react';
import ToastContainer from './components/shared/ToastContainer';
import { Phone } from 'lucide-react';
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
import { supabase } from './lib/supabaseClient'; 

const KATEX_CSS = "https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css";
const KATEX_JS = "https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js";

const App = () => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [liveCalls, setLiveCalls] = useState({});

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
  const userChatsRef = useRef([]);

  const [theme, setTheme] = useState(() => localStorage.getItem('kignal_theme') || 'system');
  const [primaryColor, setPrimaryColor] = useState(() => localStorage.getItem('kignal_color') || '#2563eb');

  const [typingUsers, setTypingUsers] = useState({});
  const typingChannelRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const callChannelRef = useRef(null); // BUNU YENİ EKLEDİK

  const incomingRequests = useMemo(() => friendRequests.filter(r => r.receiver_username === currentUser && r.status === 'pending'), [friendRequests, currentUser]);
  const outgoingRequests = useMemo(() => friendRequests.filter(r => r.sender_username === currentUser && r.status === 'pending'), [friendRequests, currentUser]);

  const userChats = useMemo(() => {
    const friends = friendRequests.filter(r => r.status === 'accepted').map(r => {
      const friendName = r.sender_username === currentUser ? r.receiver_username : r.sender_username;
      
      // ÇÖZÜM 1: İki kullanıcının da "AYNI" odaya bakmasını garanti altına alan ortak chat_id mantığı
      const sharedChatId = [currentUser, friendName].sort().join('_');

      return { id: sharedChatId, isGroup: false, name: friendName, color: 'from-emerald-500 to-teal-700', lastSeen: 'Çevrimiçi' };
    });
    
    const groupChats = groups.map(g => ({
      id: String(g.id), isGroup: true, name: g.name, color: 'from-purple-500 to-pink-700', lastSeen: `${g.members?.length || 1} Üye`, members: g.members
    }));
    
    return [...friends, ...groupChats];
  }, [friendRequests, groups, currentUser]);

  const activeChat = useMemo(() => userChats.find(c => c.id === activeChatId), [activeChatId, userChats]);
  const friendsList = useMemo(() => userChats.filter(c => !c.isGroup), [userChats]);

  useEffect(() => { userChatsRef.current = userChats; }, [userChats]);

  // Auth Effect
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

  const fetchRequests = async () => {
    if (!currentUser) return;
    const { data } = await supabase.from('friend_requests').select('*').or(`sender_username.eq.${currentUser},receiver_username.eq.${currentUser}`);
    if (data) setFriendRequests(data);
  };

  const fetchGroups = async () => {
    if (!session?.user?.id) return; 
    const { data, error } = await supabase.from('groups').select('*, group_members!inner(user_id)').eq('group_members.user_id', session.user.id); 
    if (!error && data) setGroups(data);
  };

  // Realtime Data & Subscriptions
  useEffect(() => {
    if (!session || !currentUser) return;

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

    const channel = supabase.channel('realtime-kignal')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        setMessages(prev => {
          const chatId = String(payload.new.chat_id);
          const chatMsgs = prev[chatId] || [];
          if (chatMsgs.some(m => String(m.id) === String(payload.new.id))) return prev;
          return { ...prev, [chatId]: [...chatMsgs, payload.new] };
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, (payload) => {
        fetchRequests(); 
        if (payload.eventType === 'INSERT' && payload.new.receiver_username === currentUser) {
          notify("Yeni bir arkadaşlık isteği aldınız!", "info");
        } else if (payload.eventType === 'UPDATE' && payload.new.status === 'accepted') {
          notify("Arkadaşlık isteği onaylandı. Listedeyin!", "success");
        }
      })
      .subscribe();


    
    const callChannel = supabase.channel('realtime-calls')
      .on('broadcast', { event: 'call-invite' }, ({ payload }) => {
        if (payload.receiver === currentUser && payload.status === 'ringing') setIncomingCall(payload);
      })
      .on('broadcast', { event: 'call-action' }, ({ payload }) => {
        if (payload.room_id === activeCall?.room_id || payload.room_id === incomingCall?.room_id) {
          if (payload.status === 'ended') { setIsCalling(false); setIncomingCall(null); setActiveCall(null); } 
          else if (payload.status === 'accepted') { setIsCalling(true); setIncomingCall(null); setActiveCall(payload); }
        }
      })
      .subscribe((status) => {
         // BURAYI EKLİYORUZ: Kanal bağlandığında kullanmak üzere kaydediyoruz
         if (status === 'SUBSCRIBED') callChannelRef.current = callChannel;
      });

    const typingChannel = supabase.channel('typing-room', { config: { broadcast: { self: false } } });
    typingChannel.on('broadcast', { event: 'typing' }, ({ payload }) => {
        setTypingUsers(prev => ({ ...prev, [payload.chat_id]: payload.isTyping ? payload.username : null }));
    }).subscribe((status) => { if(status === 'SUBSCRIBED') typingChannelRef.current = typingChannel; });

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(callChannel);
      supabase.removeChannel(typingChannel);
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

// useEffect(() => {
//   if (!currentUser) return;

//   const callChannel = supabase.channel('realtime-calls')
//     // 1. Bize BİR ARAMA GELDİĞİNDE (B kişisi bunu duyar)
//     .on('broadcast', { event: 'call-invite' }, ({ payload }) => {
//       if (payload.receiver === currentUser && payload.status === 'ringing') {
//         setIncomingCall(payload);
//       }
//     })
//     // 2. ARAMAMIZA CEVAP VERİLDİĞİNDE (A kişisi bunu duyar)
//     .on('broadcast', { event: 'call-action' }, ({ payload }) => {
//       // Eğer gelen sinyal bizim bulunduğumuz sohbetle ilgiliyse
//       if (activeChatId === payload.room_id || activeCall?.room_id === payload.room_id) {
        
//         if (payload.status === 'accepted') {
//           // B kişisi kabul etti! A kişisi de HEMEN B'nin olduğu odaya (room_id) giriyor.
//           setActiveCall(payload); // İkisinin de activeCall içindeki room_id'si aynı oluyor!
//           setIsCalling(true);
//           setIncomingCall(null);
//         } 
//         else if (payload.status === 'ended') {
//           // Arama reddedildi veya kapatıldı
//           setIsCalling(false);
//           setIncomingCall(null);
//           setActiveCall(null);
//         }
//       }
//     })
//     .subscribe((status) => {
//       if (status === 'SUBSCRIBED') {
//         callChannelRef.current = callChannel;
//       }
//     });

//   return () => {
//     supabase.removeChannel(callChannel);
//   };
// }, [currentUser, activeChatId, activeCall]); 



// DİKKAT: Bağımlılıklara activeChatId ve activeCall'u da ekledik ki güncel kalsınlar


  useEffect(() => {
  if (!currentUser) return;

  // Sadece bana ait olan 'call-alerts-kullaniciadim' kanalını dinle
  const callAlertsChannel = supabase.channel(`call-alerts-${currentUser}`)
    .on('broadcast', { event: 'incoming_call' }, (payload) => {
      // Birisi beni aradığında state'i güncelle (Ekranda modal çıkmasını sağlar)
      setIncomingCall({
        caller: payload.payload.caller,
        type: payload.payload.type,
        room_id: payload.payload.room_id,
      });
    })
    .subscribe();

  return () => {
    supabase.removeChannel(callAlertsChannel);
  };
}, [currentUser]);


  const notify = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };
  const removeNotification = (id) => setNotifications(prev => prev.filter(n => n.id !== id));

  // ÇÖZÜM 2: Supabase string parse hatalarını önleyen kesin silme mantığı
  const handleAction = async (type, targetId, action) => {
    if (type === 'chat') {
      if (action === 'unfriend') {
        // İki olasılığı da ayrı ayrı temiz bir şekilde siliyoruz
        await supabase.from('friend_requests').delete().match({ sender_username: currentUser, receiver_username: targetId });
        await supabase.from('friend_requests').delete().match({ sender_username: targetId, receiver_username: currentUser });
        
        fetchRequests();
        setActiveChatId(null);
        notify("Arkadaşlıktan çıkarıldı.", "success");
        setShowChatDetails(false);
      }
      if (action === 'block') {
        await supabase.from('blocked_users').insert([{ blocker_username: currentUser, blocked_username: targetId }]);
        
        await supabase.from('friend_requests').delete().match({ sender_username: currentUser, receiver_username: targetId });
        await supabase.from('friend_requests').delete().match({ sender_username: targetId, receiver_username: currentUser });
        
        fetchRequests();
        setActiveChatId(null);
        notify("Kullanıcı engellendi.", "error");
        setShowChatDetails(false);
      }
    }
  };

  const handleRequestAction = async (reqId, action) => {
    if(action === 'accept') await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', reqId);
    else await supabase.from('friend_requests').delete().eq('id', reqId);
    fetchRequests();
    notify(action === 'accept' ? "İstek kabul edildi!" : (action === 'reject' ? "İstek reddedildi." : "İstek iptal edildi."), action === 'accept' ? 'success' : 'info');
  };

  const handleTypingChange = (text) => {
      setInputText(text);
      if (typingChannelRef.current && activeChatId) {
          typingChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { chat_id: String(activeChatId), username: currentUser, isTyping: text.length > 0 } });
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
               if (typingChannelRef.current) typingChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { chat_id: String(activeChatId), username: currentUser, isTyping: false } });
          }, 2000);
      }
  };

  const handleSend = async (type = 'text', mediaContent = null) => {
    const contentToSend = mediaContent || inputText;
    if (!contentToSend.trim() || !activeChatId) return;

    setInputText(""); setMediaPanel(null); setShowMediaPanel(null);
    if (typingChannelRef.current) typingChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { chat_id: String(activeChatId), username: currentUser, isTyping: false } });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    const { data, error } = await supabase.from('messages').insert([{ content: contentToSend, sender_username: currentUser, chat_id: activeChatId, type: type }]).select('*').single();
    if (error) notify("Mesaj gönderilemedi!", "error");
    else if (data) {
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
    const { data: userExists } = await supabase.from('profiles').select('*').ilike('username', newFriendName).maybeSingle();
    if (!userExists) return notify("Böyle bir kullanıcı bulunamadı!", "error");
    
    const exists = friendRequests.find(r => (r.sender_username === currentUser && r.receiver_username === newFriendName) || (r.sender_username === newFriendName && r.receiver_username === currentUser));
    if (exists) return notify("Bu kullanıcıyla zaten bir bağınız var!", "error");

    const { data, error } = await supabase.from('friend_requests').insert([{ sender_username: currentUser, receiver_username: newFriendName, status: 'pending' }]).select().single();
    if (error) notify("İstek gönderilemedi: " + error.message, "error");
    else { notify("İstek gönderildi!", "success"); setShowAddFriend(false); setNewFriendName(""); fetchRequests(); }
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

  const leaveCurrentCall = () => {
    if (!activeCall?.room_id) return;

    setLiveCalls(prev => {
      const room = prev[activeCall.room_id];

      if (!room) return prev;

      return {
        ...prev,
        [activeCall.room_id]: {
          ...room,
          participants: room.participants.filter(
            p => p !== currentUser
          )
        }
      };
    });
  };

  const handleStartCall = (type) => {
  if (!activeChatId || !activeChat) return;

  setIsVideoOff(type === 'voice');

  const outgoingCall = {
    caller: currentUser,
    type,
    room_id: activeChatId,
    status: 'ringing'
  };

  const roomId = activeChatId;

  setCallRooms(prev => ({
    ...prev,
    [roomId]: {
      status: "active",
      caller: currentUser,
      participants: [currentUser]
    }
  }));

  setActiveCall(outgoingCall);
  setIsCalling(true);

  setLiveCalls(prev => ({
    ...prev,
    [activeChatId]: {
      room_id: activeChatId,
      started_by: currentUser,
      active: true,
      type,
      participants: [currentUser]
    }
  }));

  if (callChannelRef.current && !activeChat.isGroup) {
    callChannelRef.current.send({
      type: 'broadcast',
      event: 'call-invite',
      payload: {
        receiver: activeChat.name,
        caller: currentUser,
        type,
        room_id: activeChatId,
        status: 'ringing'
      }
    });
  }
};

  const handleAcceptCall = () => {
    if (!incomingCall) return;
    setIsVideoOff(incomingCall.type === 'voice'); // YENİ EKLENDİ: Sesli geliyorsa kamerayı açma
    
    const acceptedPayload = { ...incomingCall, status: 'accepted' };

    if (callChannelRef.current) {
      callChannelRef.current.send({ type: 'broadcast', event: 'call-action', payload: acceptedPayload });
    }

    setCallRooms(prev => ({
    ...prev,
    [incomingCall.room_id]: {
      ...prev[incomingCall.room_id],
      status: "active",
      participants: [
        ...(prev[incomingCall.room_id]?.participants || []),
        currentUser
      ]
    }
  }));

    setActiveCall(acceptedPayload); 
    setIsCalling(true); 
    setIncomingCall(null);
  };

const handleRejectCall = () => {
  const targetCall = incomingCall || activeCall;

  if (!targetCall) return;

  if (callChannelRef.current) {
    callChannelRef.current.send({
      type: 'broadcast',
      event: 'call-action',
      payload: {
        ...targetCall,
        status: 'ended'
      }
    });
  }


  const roomId = (incomingCall || activeCall)?.room_id;

  if (roomId) {
    setCallRooms(prev => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        status: "ended"
      }
    }));
  }

  leaveCurrentCall();

  setIsCalling(false);
  setIncomingCall(null);
  setActiveCall(null);
};

const [callRooms, setCallRooms] = useState({});

  const handleEndCall = () => {
    const roomId = (incomingCall || activeCall)?.room_id;

    if (roomId) {
      setCallRooms(prev => ({
        ...prev,
        [roomId]: {
          ...prev[roomId],
          status: "ended"
        }
      }));
    }


    if (roomId) {
      setCallRooms(prev => ({
        ...prev,
        [roomId]: {
          ...prev[roomId],
          status: "ended"
        }
      }));
    }

    setActiveCall(null);
    setIncomingCall(null);
    setIsCalling(false);
  };

  const toggleFavorite = (type, item) => {
    setFavorites(prev => {
      const list = prev[type]; const isFavorite = list.includes(item);
      return { ...prev, [type]: isFavorite ? list.filter(i => i !== item) : [...list, item] };
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
        handleTypingChange={handleTypingChange} typingUsers={typingUsers}
        incomingCall={incomingCall} 
        handleAcceptCall={handleAcceptCall} 
        handleSend={() => handleSend('text')} mediaPanel={mediaPanel} setMediaPanel={setMediaPanel}
        currentUser={currentUser} primaryColor={primaryColor} onHeaderClick={() => setShowChatDetails(true)}
      />

      {showAddFriend && <AddFriendModal setShowAddFriend={setShowAddFriend} newFriendName={newFriendName} setNewFriendName={setNewFriendName} sendFriendRequest={sendFriendRequest} />}
      {showCreateGroup && <CreateGroupModal setShowCreateGroup={setShowCreateGroup} createGroup={createGroup} friendsList={friendsList} />}
      {showRequests && <RequestsModal setShowRequests={setShowRequests} incomingRequests={incomingRequests} outgoingRequests={outgoingRequests} handleAction={handleRequestAction} />}
      
      {showChatDetails && <ChatDetailsModal activeChat={activeChat} setShowChatDetails={setShowChatDetails} handleStartCall={handleStartCall} handleAction={handleAction} notify={notify} />}
      
      {/* {isCalling && <CallOverlay activeChat={activeChat} currentUser={currentUser} isVideoOff={isVideoOff} setIsVideoOff={setIsVideoOff} isMuted={isMuted} setIsMuted={setIsMuted} handleEndCall={handleEndCall} supabase={supabase} />} */}
      {/* activeCall={activeCall} KISMINI EKLEDİK */}
          {isCalling && <CallOverlay activeChat={activeChat} activeCall={activeCall} currentUser={currentUser} isVideoOff={isVideoOff} setIsVideoOff={setIsVideoOff} isMuted={isMuted} setIsMuted={setIsMuted} handleEndCall={handleEndCall} supabase={supabase} />}
      {showSettings && <SettingsModal setShowSettings={setShowSettings} currentUser={currentUser} setCurrentUser={setCurrentUser} supabase={supabase} notify={notify} theme={theme} setTheme={setTheme} primaryColor={primaryColor} setPrimaryColor={setPrimaryColor} />}
      
      {incomingCall && !isCalling && callRooms?.[incomingCall.room_id]?.status !== "active" && (
        <div className="fixed inset-x-0 top-6 mx-auto w-full max-w-sm bg-neutral-900/95 backdrop-blur-2xl border border-neutral-800 p-6 rounded-[32px] shadow-2xl z-[200] flex flex-col items-center gap-4 animate-in slide-in-from-top duration-300">
          <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 animate-pulse"><Phone className="w-6 h-6" /></div>
          <div className="text-center">
            <h4 className="text-sm font-black text-white uppercase tracking-wider">{incomingCall.caller} Arıyor...</h4>
            <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-0.5">Gelen Sesli/Görüntülü Arama</p>
          </div>
          <div className="flex gap-3 w-full mt-2">
            <button onClick={handleRejectCall} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white text-xs font-black uppercase rounded-xl transition active:scale-95">Reddet</button>
            <button onClick={handleAcceptCall} className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white text-xs font-black uppercase rounded-xl transition active:scale-95 animate-bounce">Kabul Et</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;