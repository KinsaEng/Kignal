import React, { useEffect, useState } from 'react';
import { ShieldCheck, Phone, Video, Monitor, Search, Heart, Smile, Sparkles, X, Send, Plus, Image, File, BarChart2, Zap } from 'lucide-react';
import MediaPicker from '../shared/MediaPicker';

const STICKER_PACKS = {
  classic: ["🚀", "🔥", "💎", "🌈", "👻", "🤖", "🍕", "🎮"],
  neon: ["⚡", "🎆", "✨", "🧬", "🧪", "🪐", "👾", "🕶️"],
  animated: ["❤️", "😂", "😮", "😡", "🥳", "🤔", "😴", "🙌"]
};

const ChatArea = ({ 
  activeChat, activeChatId, handleStartCall, messages, scrollRef, renderMessageContent, 
  showMediaPanel, setShowMediaPanel, gifSearch, setGifSearch, gifResults, 
  sendMediaMessage, toggleFavorite, favorites, stickerTab, setStickerTab, 
  inputText, setInputText, handleSend, mediaPanel, setMediaPanel, currentUser, primaryColor
}) => {
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  useEffect(() => {
    if (scrollRef && scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeChatId, scrollRef]);

  if (!activeChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#030303] text-neutral-600 p-12 text-center">
        <div className="w-24 h-24 bg-neutral-900 rounded-[40px] flex items-center justify-center mb-8 border border-neutral-800/50 animate-pulse">
          <Zap className="w-12 h-12 opacity-20 kignal-primary-text" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2 tracking-tighter uppercase">Kignal Ultra Messenger</h2>
        <p className="max-w-xs text-sm leading-relaxed text-neutral-500">Sohbet etmek için soldaki menüden birini seçin veya yeni bir sohbet başlatın.</p>
      </div>
    );
  }
   
  return (
    <div className="flex-1 flex flex-col bg-[#050505] relative">
      <div className="h-20 border-b border-neutral-800/40 flex items-center justify-between px-8 bg-black/40 backdrop-blur-2xl z-20">
        <div className="flex items-center gap-4">
          <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${activeChat.color} flex items-center justify-center text-white font-black`}>
            {activeChat.name[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2">
              {activeChat.name} {activeChat.isGroup ? <span className="text-xs bg-neutral-800 px-2 rounded-md">GRUP</span> : <ShieldCheck className="w-4 h-4 kignal-primary-text" />}
            </h2>
            <p className="text-[10px] text-neutral-500 uppercase font-mono tracking-widest">{activeChat.isGroup ? 'Çoklu Bağlantı' : 'Kignal Double Ratchet v2'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleStartCall('voice')} className="p-3 bg-neutral-900/50 hover:bg-white/10 rounded-xl transition" title="Sesli Sohbet"><Phone className="w-5 h-5 text-neutral-400" /></button>
          <button onClick={() => handleStartCall('video')} className="p-3 bg-neutral-900/50 hover:bg-white/10 rounded-xl transition" title="Görüntülü Sohbet"><Video className="w-5 h-5 text-neutral-400" /></button>
          <button onClick={() => handleStartCall('screen')} className="p-3 bg-neutral-900/50 hover:bg-white/10 rounded-xl transition" title="Ekran Paylaşımı"><Monitor className="w-5 h-5 text-neutral-400" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
        {(messages[activeChatId] || []).length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-neutral-600 space-y-2">
            <ShieldCheck className="w-8 h-8 opacity-25 kignal-primary-text" />
            <p className="text-xs">İlk mesajı gönderin!</p>
          </div>
        ) : (
          (messages[activeChatId] || []).map(m => {
            // BURASI DÜZELTİLDİ: sender_username ile currentUser kontrol ediliyor
            const isMe = m.sender_username === currentUser;
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  {activeChat.isGroup && !isMe && <span className="text-[10px] text-neutral-500 ml-2">{m.sender_username}</span>}
                  <div className={`p-1 rounded-[28px] overflow-hidden ${m.type === 'text' ? 'px-6 py-4' : ''} ${isMe ? 'kignal-primary-bg text-white rounded-br-none shadow-xl' : 'bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-bl-none shadow-xl'}`}>
                    {renderMessageContent(m)}
                  </div>
                  <span className="text-[9px] font-mono text-neutral-600 tracking-widest px-2">{new Date(m.created_at || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={scrollRef} ></div>
      </div>

      {showMediaPanel && ( /* ... Mevcut GIF/Sticker Kodu Aynen Kalır ... */ )}

      <div className="p-6 bg-black/60 border-t border-neutral-800/40 w-full">
        <div className="mx-auto flex items-end gap-3 relative">
          
          {/* YENİ DOSYA EKLEME BUTONU VE MENÜSÜ */}
          <div className="relative flex items-center justify-center mb-1">
            <button 
              onClick={() => setShowAttachMenu(!showAttachMenu)} 
              className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all active:scale-90 ${showAttachMenu ? 'bg-white/10 text-white' : 'bg-neutral-900/80 text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
            >
              <Plus className="w-6 h-6" />
            </button>
            {showAttachMenu && (
              <div className="absolute bottom-full left-0 mb-4 w-56 bg-[#111] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2">
                <button className="w-full text-left px-5 py-4 hover:bg-neutral-800 text-sm font-bold flex items-center gap-3 text-white transition"><Image className="w-5 h-5 text-blue-400"/> Photos & Videos</button>
                <div className="h-[1px] w-full bg-neutral-800/50"></div>
                <button className="w-full text-left px-5 py-4 hover:bg-neutral-800 text-sm font-bold flex items-center gap-3 text-white transition"><File className="w-5 h-5 text-emerald-400"/> Files</button>
                {activeChat.isGroup && (
                  <>
                    <div className="h-[1px] w-full bg-neutral-800/50"></div>
                    <button className="w-full text-left px-5 py-4 hover:bg-neutral-800 text-sm font-bold flex items-center gap-3 text-white transition"><BarChart2 className="w-5 h-5 text-purple-400"/> Poll</button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 bg-neutral-900/50 border border-neutral-800/80 rounded-[28px] px-6 flex items-end relative min-h-[50px]">
            <textarea 
              rows="1" placeholder="Mesaj yazın..."
              className="w-full bg-transparent py-4 focus:outline-none resize-none text-sm text-white custom-scrollbar max-h-32"
              value={inputText} onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            />
            <button onClick={() => setMediaPanel(mediaPanel ? null : 'emoji')} className={`p-3 mb-1 rounded-xl transition-all active:scale-90 ${mediaPanel ? 'kignal-primary-text bg-white/5' : 'text-neutral-500 hover:text-white'}`}>
              <Smile className="w-6 h-6" />
            </button>
            {mediaPanel && (
              <div className="absolute bottom-full left-0 right-0 mb-4 w-full">
                <MediaPicker activeTab={mediaPanel} setActiveTab={setMediaPanel} onClose={() => setMediaPanel(null)} onSelect={handleSend} />
              </div>
            )}
          </div>
          <button onClick={() => handleSend()} className="w-12 h-12 flex items-center justify-center kignal-primary-bg rounded-2xl hover:brightness-110 transition-all active:scale-90 text-white shadow-xl mb-1">
            <Send className="w-5 h-5 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;