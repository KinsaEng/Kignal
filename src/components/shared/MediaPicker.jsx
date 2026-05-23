import React, { useState, useEffect } from 'react';
import { Smile, Gift, Sticker, X, Search } from 'lucide-react';

const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY;

const EMOJI_LIST = ["😀", "😂", "🥰", "😎", "🤔", "🙄", "🔥", "✨", "🚀", "💎", "🌈", "🍕", "🎮", "👾", "❤️", "🙌", "🥳", "😭", "😡", "😴", "🧠", "🧬", "🧪", "🌍", "🍦", "🎸", "📸", "🧘", "👑", "🦄"];
const STICKER_LIST = ["🚀", "🔥", "💎", "🌈", "👻", "🤖", "🍕", "🎮", "👾", "🕶️", "⚡", "🎆", "✨", "🧬", "🧪", "🪐"];

const MediaPicker = ({ onSelect, onClose, activeTab, setActiveTab }) => {
  const [gifs, setGifs] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (activeTab === 'gif') {
      const fetchGifs = async () => {
        const url = search 
          ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(search)}&limit=12`
          : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=12`;
        const res = await fetch(url);
        const data = await res.json();
        setGifs(data.data || []);
      };
      fetchGifs();
    }
  }, [activeTab, search]);

  return (
    <div className="absolute bottom-full w-max-4xl h-[35rem] mb-4 left-0 right-0 dark:bg-[#0a0a0a]/95 bg-[#FAFAFA]/95 backdrop-blur-2xl border dark:border-neutral-800/60 rounded-[32px] shadow-2xl z-50 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex p-2 dark:bg-black/40 border-b dark:border-neutral-800/40">
        {[
          { id: 'emoji', icon: Smile, label: 'Emoji' },
          { id: 'gif', icon: Gift, label: 'GIF' },
          { id: 'sticker', icon: Sticker, label: 'Sticker' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] dark:font-black uppercase tracking-widest transition-all
              ${activeTab === tab.id ? 'dark:bg-neutral-800 dark:text-white shadow-inner' : 'dark:text-neutral-500 dark:hover:text-neutral-300'}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
        <button onClick={onClose} className="p-3 dark:text-neutral-600 dark:hover:text-white hover:text-white transition"><X className="w-4 h-4"/></button>
      </div>

      <div className="h-full overflow-y-auto p-4 custom-scrollbar">
        {activeTab === 'emoji' && (
          <div className="grid grid-cols-6 gap-2">
            {EMOJI_LIST.map(emoji => (
              <button key={emoji} onClick={() => onSelect('text', emoji)} className="text-3xl p-2 dark:hover:bg-neutral-800 rounded-xl transition-all active:scale-125 h-full">
                {emoji}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'sticker' && (
          <div className="grid grid-cols-4 gap-4">
            {STICKER_LIST.map(s => (
              <button key={s} onClick={() => onSelect('sticker', s)} className="text-6xl p-2 dark:hover:bg-neutral-800 rounded-2xl transition-all hover:scale-110">
                {s}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'gif' && (
          <div className="space-y-4">
            <div className="flex dark:bg-black/50 rounded-xl px-4 border dark:border-neutral-800 items-center">
              <Search className="w-4 h-4 dark:text-neutral-600 mr-2" />
              <input 
                placeholder="Ara..." 
                className="bg-transparent border-none focus:outline-none text-xs py-3 w-full dark:text-white"
                value={search} onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {gifs.map(g => (
                <img 
                  key={g.id} 
                  src={g.images.fixed_height.url} 
                  className="rounded-lg cursor-pointer hover:opacity-80 transition"
                  onClick={() => onSelect('gif', g.images.original.url)}
                  alt="gif"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaPicker;