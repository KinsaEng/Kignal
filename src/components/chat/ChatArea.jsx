import React from 'react';
import { ShieldCheck, Phone, Video, Monitor, Search, Heart, Smile, Sparkles, X, Send, FilePlus, Zap,  } from 'lucide-react';
import IconButton from '../shared/IconButton';
import MediaPicker from '../shared/MediaPicker';
import { useEffect } from 'react';

const STICKER_PACKS = {
  classic: ["🚀", "🔥", "💎", "🌈", "👻", "🤖", "🍕", "🎮"],
  neon: ["⚡", "🎆", "✨", "🧬", "🧪", "🪐", "👾", "🕶️"],
  animated: ["❤️", "😂", "😮", "😡", "🥳", "🤔", "😴", "🙌"]
};

const ChatArea = ({ 
  activeChat, activeChatId, handleStartCall, messages, scrollRef, renderMessageContent, 
  showMediaPanel, setShowMediaPanel, gifSearch, setGifSearch, gifResults, 
  sendMediaMessage, toggleFavorite, favorites, stickerTab, setStickerTab, 
  inputText, setInputText, handleSend, mediaPanel, setMediaPanel, currentUser
}) => {

// ChatArea.jsx içinde return'den hemen önceye yapıştır:
useEffect(() => {
if (scrollRef && scrollRef.current) {
    scrollRef.current.scrollIntoView({ behavior: 'smooth' });
}
}, [messages, activeChatId]); // Mesajlar güncellendiğinde veya sohbet değiştiğinde çalışır


if (!activeChat) {
    
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#030303] text-neutral-600 p-12 text-center">
        <div className="w-24 h-24 bg-neutral-900 rounded-[40px] flex items-center justify-center mb-8 border border-neutral-800/50 animate-pulse">
          <Zap className="w-12 h-12 opacity-20 text-blue-500" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2 tracking-tighter uppercase">Kignal Ultra Messenger</h2>
        <p className="max-w-xs text-sm leading-relaxed text-neutral-500">Gizliliğin ön planda olduğu, GIF, Çıkartma ve KaTeX destekli ultra güvenli iletişim hattı.</p>
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
              {activeChat.name} <ShieldCheck className="w-4 h-4 text-blue-500" />
            </h2>
            <p className="text-[10px] text-neutral-500 uppercase font-mono tracking-widest">Kignal Double Ratchet v2</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleStartCall('voice')} className="p-3 bg-neutral-900/50 hover:bg-blue-600/20 rounded-xl transition" title="Sesli Sohbet"><Phone className="w-5 h-5 text-neutral-400" /></button>
          <button onClick={() => handleStartCall('video')} className="p-3 bg-neutral-900/50 hover:bg-blue-600/20 rounded-xl transition" title="Görüntülü Sohbet"><Video className="w-5 h-5 text-neutral-400" /></button>
          <button onClick={() => handleStartCall('screen')} className="p-3 bg-neutral-900/50 hover:bg-blue-600/20 rounded-xl transition" title="Ekran Paylaşımı (4K 120FPS)"><Monitor className="w-5 h-5 text-neutral-400" /></button>
          <div className="h-6 w-[1px] bg-neutral-800 mx-2" />
          <span className="px-5 py-3 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-500 transition font-black text-xs uppercase shadow-lg">4K 120FPS</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
        {(messages[activeChatId] || []).length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-neutral-600 space-y-2">
            <ShieldCheck className="w-8 h-8 opacity-25 text-blue-500" />
            <p className="text-xs">Sohbet şifreli ve güvendedir. İlk mesajı yazın!</p>
          </div>
        ) : (
          (messages[activeChatId] || []).map(m => (
            <div key={m.id} className={`flex ${m.sender === currentUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] ${m.sender === 'me' ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                <div className={`p-1 rounded-[28px] overflow-hidden ${m.type === 'text' ? 'px-6 py-4' : ''} ${m.sender === 'me' ? 'bg-blue-600 text-white rounded-br-none shadow-xl shadow-blue-900/20' : 'bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-bl-none shadow-xl'}`}>
                  {renderMessageContent(m)}
                </div>
                <span className="text-[9px] font-mono text-neutral-600 uppercase tracking-widest px-2">{m.time} • SECURE</span>
              </div>
            </div>
          ))
        )}

        <div ref={scrollRef} ></div>
      </div>

      {showMediaPanel && (
        <div className="absolute bottom-28 left-8 right-8 h-96 bg-[#0a0a0a] border border-neutral-800 rounded-[32px] shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom duration-300">
          <div className="flex p-4 border-b border-neutral-800 gap-4">
            <div className="flex-1 flex bg-black rounded-2xl px-4 items-center border border-neutral-800/40">
              <Search className="w-4 h-4 text-neutral-600 mr-3" />
              <input 
                type="text" placeholder={showMediaPanel === 'gif' ? "GIPHY üzerinde ara..." : "Çıkartma paketleri..."}
                className="bg-transparent border-none focus:outline-none w-full text-sm py-3 text-white"
                value={gifSearch} onChange={e => setGifSearch(e.target.value)}
              />
            </div>
            <button onClick={() => setShowMediaPanel(null)} className="p-3 hover:bg-neutral-800 rounded-2xl transition"><X className="w-5 h-5" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {showMediaPanel === 'gif' ? (
              <div className="grid grid-cols-3 gap-4">
                {gifResults.map(g => (
                  <div key={g.id} className="relative group cursor-pointer aspect-video rounded-xl overflow-hidden bg-neutral-900 border border-white/5 shadow-inner">
                    <img src={g.images.fixed_height.url} onClick={() => sendMediaMessage('gif', g.images.original.url)} className="w-full h-full object-cover transition hover:scale-105" alt="gif" />
                    <button onClick={() => toggleFavorite('gifs', g)} className={`absolute top-2 right-2 p-2 rounded-lg backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition ${favorites.gifs.some(i => i.id === g.id) ? 'bg-red-500 text-white animate-pulse' : 'bg-black/60 text-white'}`}>
                      <Heart className="w-4 h-4" fill={favorites.gifs.some(i => i.id === g.id) ? "currentColor" : "none"} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex gap-2 mb-6 sticky top-0 bg-[#0a0a0a] z-10 py-2 border-b border-neutral-800/20">
                  {['classic', 'neon', 'animated', 'favs', 'maker'].map(t => (
                    <button key={t} onClick={() => setStickerTab(t)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${stickerTab === t ? 'bg-blue-600 text-white' : 'bg-neutral-900 text-neutral-500 hover:text-white'}`}>
                      {t === 'favs' ? <Heart className="w-3.5 h-3.5 inline mr-1" /> : t === 'maker' ? <Sparkles className="w-3.5 h-3.5 inline mr-1" /> : t}
                    </button>
                  ))}
                </div>
                
                {stickerTab === 'maker' ? (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                    <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center border border-blue-500/20"><Smile className="w-10 h-10 text-blue-500" /></div>
                    <h3 className="font-bold">Kignal Sticker Maker</h3>
                    <p className="text-xs text-neutral-500 max-w-xs">Emoji klavyenden bir emoji seçerek onu devasa bir Kignal çıkartmasına dönüştürebilirsin!</p>
                    <input type="text" placeholder="Emoji Yapıştır" className="bg-black border border-neutral-800 rounded-xl px-4 py-3 text-center text-3xl focus:ring-2 focus:ring-blue-500 outline-none w-32" onInput={e => { if(e.target.value) { sendMediaMessage('sticker', e.target.value); e.target.value = ""; } }} />
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-6 place-items-center">
                    {(stickerTab === 'favs' ? favorites.stickers : STICKER_PACKS[stickerTab] || []).map((s, i) => (
                      <div key={i} className="group relative cursor-pointer hover:scale-110 transition-transform p-3">
                        <span className="text-6xl drop-shadow-2xl" onClick={() => sendMediaMessage('sticker', s)}>{s}</span>
                        <button onClick={() => toggleFavorite('stickers', s)} className={`absolute -top-1 -right-1 p-1.5 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition shadow-lg ${favorites.stickers.includes(s) ? 'bg-red-500' : 'bg-black/80'}`}>
                          <Heart className="w-3 h-3 text-white" fill={favorites.stickers.includes(s) ? "white" : "none"} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="p-8 bg-black/60 border-t border-neutral-800/40 w-full">
        <div className="mx-auto flex items-end gap-3 relative">
          <IconButton icon={FilePlus} className="item-center content-center justify-center mb-3" size={50}/>
          <div className="flex-1 bg-neutral-900/50 border border-neutral-800/80 rounded-[32px] px-6 py-1.5 flex items-end relative min-h-[60px]">
            <textarea 
              rows="1" placeholder="Şifreli bir mesaj yazın..."
              className="w-full bg-transparent py-4 focus:outline-none resize-none text-sm text-white custom-scrollbar max-h-32"
              value={inputText} onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            />
            <button onClick={() => setMediaPanel(mediaPanel ? null : 'emoji')} className={`p-3 mb-1 rounded-xl transition-all active:scale-90 ${mediaPanel ? 'text-blue-500 bg-blue-500/10' : 'text-neutral-500 hover:text-white'}`}>
              <Smile className="w-6 h-6" />
            </button>
            {mediaPanel && (
              <div className="absolute bottom-full left-0 right-0 mb-4 w-full">
                <MediaPicker activeTab={mediaPanel} setActiveTab={setMediaPanel} onClose={() => setMediaPanel(null)} onSelect={handleSend} />
              </div>
            )}
          </div>
          <button onClick={() => handleSend()} className="p-5 bg-blue-600 rounded-[28px] hover:bg-blue-500 transition-all active:scale-90 text-white shadow-2xl shadow-blue-900/40 mb-1">
            <Send className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;