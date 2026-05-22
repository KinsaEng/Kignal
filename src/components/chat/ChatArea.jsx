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
  inputText, setInputText, handleSend, mediaPanel, setMediaPanel, currentUser, onHeaderClick, primaryColor
}) => {
const [showAttachMenu, setShowAttachMenu] = useState(false);
const fileInputRef = React.useRef(null);

const handleFileMenuClick = (type) => {
setShowAttachMenu(false);
if (type === 'poll') {
// Poll modalını açacak state'i tetikle
return;
}
// Resim veya dosya seçimi için gizli input'u tıkla
fileInputRef.current.click();
};

const handleFileUpload = async (e) => {
const file = e.target.files[0];
if (!file) return;

// Burada Supabase Storage'a yükleme yapacağız (bknz. sonraki adım)
// Şimdilik sadece bildirim verelim:
alert(`Seçilen dosya: ${file.name}. Supabase Storage bağlantısı gerekiyor!`);
};

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
    <div className="flex-1 flex flex-col bg-neutral-50 dark:bg-[#050505] relative transition-colors duration-300">
      
      <div onClick={onHeaderClick} className="h-20 border-b border-neutral-200 dark:border-neutral-800/40 flex items-center justify-between px-8 bg-white/40 dark:bg-black/40 backdrop-blur-2xl z-20 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black shadow-lg" style={{ background: activeChat.color || primaryColor }}>
            {activeChat.name[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="font-bold text-lg text-neutral-900 dark:text-white flex items-center gap-2">
              {activeChat.name} {activeChat.isGroup ? <span className="text-xs bg-neutral-200 dark:bg-neutral-800 px-2 rounded-md">GRUP</span> : <ShieldCheck className="w-4 h-4" style={{ color: primaryColor }} />}
            </h2>
            <p className="text-[10px] text-neutral-500 uppercase font-mono tracking-widest">{activeChat.isGroup ? 'Çoklu Bağlantı' : 'Kignal Double Ratchet v2'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => handleStartCall('voice')} className="p-3 bg-neutral-900/50 hover:bg-white/10 rounded-xl transition" title="Sesli Sohbet"><Phone className="w-5 h-5 text-neutral-400" /></button>
          <button onClick={() => handleStartCall('video')} className="p-3 bg-neutral-900/50 hover:bg-white/10 rounded-xl transition" title="Görüntülü Sohbet"><Video className="w-5 h-5 text-neutral-400" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
        {/* 2. AŞAMA: Mesaj Baloncuklarına Inline Style Veriyoruz */}
        {(messages[activeChatId] || []).map(m => {
            const isMe = m.sender_username === currentUser;
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  {activeChat.isGroup && !isMe && <span className="text-[10px] text-neutral-500 ml-2">{m.sender_username}</span>}
                  
                  {/* ÖNEMLİ KISIM: isMe ise senin seçtiğin RGB/Gradient arkaplan uygulanır */}
                  <div 
                    className={`p-1 rounded-[28px] overflow-hidden ${m.type === 'text' ? 'px-6 py-4' : ''} ${isMe ? 'text-white rounded-br-none shadow-xl border-none' : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-bl-none shadow-xl'}`}
                    style={isMe ? { background: primaryColor } : {}}
                  >
                    {renderMessageContent(m)}
                  </div>
                  
                  <span className="text-[9px] font-mono text-neutral-500 tracking-widest px-2">{new Date(m.created_at || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              </div>
            );
          })}
        <div ref={scrollRef}></div>
      </div>

      {/* DİKEY MEDYA PANELİ DÜZENLEMESİ (w-[360px] h-[500px]) */}
      {showMediaPanel && (
        <div className="absolute bottom-28 right-8 w-[360px] h-[500px] bg-[#0a0a0a] border border-neutral-800 rounded-[32px] shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom duration-300">
          <div className="flex p-4 border-b border-neutral-800 gap-4">
            <div className="flex-1 flex bg-black rounded-2xl px-4 items-center border border-neutral-800/40">
              <Search className="w-4 h-4 text-neutral-600 mr-3" />
              <input 
                type="text" placeholder={showMediaPanel === 'gif' ? "GIPHY Ara..." : "Paketler..."}
                className="bg-transparent border-none focus:outline-none w-full text-sm py-3 text-white"
                value={gifSearch} onChange={e => setGifSearch(e.target.value)}
              />
            </div>
            <button onClick={() => setShowMediaPanel(null)} className="p-3 hover:bg-neutral-800 rounded-2xl transition"><X className="w-5 h-5" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {showMediaPanel === 'gif' ? (
              <div className="grid grid-cols-2 gap-3">
                {gifResults.map(g => (
                  <div key={g.id} className="relative group cursor-pointer aspect-video rounded-xl overflow-hidden bg-neutral-900 border border-white/5 shadow-inner">
                    <img src={g.images.fixed_height.url} onClick={() => sendMediaMessage('gif', g.images.original.url)} className="w-full h-full object-cover transition hover:scale-105" alt="gif" />
                    <button onClick={() => toggleFavorite('gifs', g)} className={`absolute top-2 right-2 p-1.5 rounded-lg backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition ${favorites.gifs.some(i => i.id === g.id) ? 'bg-red-500 text-white animate-pulse' : 'bg-black/60 text-white'}`}>
                      <Heart className="w-3 h-3" fill={favorites.gifs.some(i => i.id === g.id) ? "currentColor" : "none"} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex flex-wrap gap-2 mb-4 sticky top-0 bg-[#0a0a0a] z-10 py-2 border-b border-neutral-800/20">
                  {['classic', 'neon', 'animated', 'favs'].map(t => (
                    <button key={t} onClick={() => setStickerTab(t)} className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${stickerTab === t ? 'bg-blue-600 text-white' : 'bg-neutral-900 text-neutral-500'}`}>
                      {t === 'favs' ? <Heart className="w-3 h-3 inline mr-1" /> : t}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-4 place-items-center pb-4">
                  {(stickerTab === 'favs' ? favorites.stickers : STICKER_PACKS[stickerTab] || []).map((s, i) => (
                    <div key={i} className="group relative cursor-pointer hover:scale-110 transition-transform p-2">
                      <span className="text-5xl drop-shadow-2xl" onClick={() => sendMediaMessage('sticker', s)}>{s}</span>
                      <button onClick={() => toggleFavorite('stickers', s)} className={`absolute -top-1 -right-1 p-1.5 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition shadow-lg ${favorites.stickers.includes(s) ? 'bg-red-500' : 'bg-black/80'}`}>
                        <Heart className="w-3 h-3 text-white" fill={favorites.stickers.includes(s) ? "white" : "none"} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="p-6 bg-white/60 dark:bg-black/60 border-t border-neutral-200 dark:border-neutral-800/40 w-full backdrop-blur-md">
        <div className="mx-auto flex items-end gap-3 relative">
          <div className="relative flex items-center justify-center mb-1">
            <button 
              onClick={() => setShowAttachMenu(!showAttachMenu)} 
              className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all active:scale-90 ${showAttachMenu ? 'bg-white/10 text-white' : 'bg-neutral-900/80 text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
            >
              <Plus className="w-6 h-6" />
            </button>
            {showAttachMenu && (
                <div className="absolute bottom-full left-0 mb-4 w-56 bg-[#111] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-50">
                <button onClick={() => handleFileMenuClick('media')} className="w-full text-left px-5 py-4 hover:bg-neutral-800 text-sm font-bold flex items-center gap-3 text-white transition"><Image className="w-5 h-5 text-blue-400"/> Photos & Videos</button>
                <div className="h-[1px] w-full bg-neutral-800/50"></div>
                <button onClick={() => handleFileMenuClick('file')} className="w-full text-left px-5 py-4 hover:bg-neutral-800 text-sm font-bold flex items-center gap-3 text-white transition"><File className="w-5 h-5 text-emerald-400"/> Files</button>
                {activeChat.isGroup && (
                    <>
                    <div className="h-[1px] w-full bg-neutral-800/50"></div>
                    <button onClick={() => handleFileMenuClick('poll')} className="w-full text-left px-5 py-4 hover:bg-neutral-800 text-sm font-bold flex items-center gap-3 text-white transition"><BarChart2 className="w-5 h-5 text-purple-400"/> Poll</button>
                    </>
                )}
                </div>
            )}
            {/* Gizli Input */}
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
          </div>

          <div className="flex-1 bg-neutral-100 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800/80 rounded-[28px] px-6 flex items-end relative min-h-[50px]">
            <textarea 
              rows="1" placeholder="Mesaj yazın..."
              className="w-full bg-transparent py-4 focus:outline-none resize-none text-sm text-neutral-900 dark:text-white custom-scrollbar max-h-32"
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
          <button onClick={() => handleSend()} className="w-12 h-12 flex items-center justify-center rounded-2xl hover:brightness-110 transition-all active:scale-90 text-white shadow-xl mb-1"
             style={{ background: primaryColor }}>
            <Send className="w-5 h-5 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;