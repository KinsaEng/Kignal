import React from 'react';
import { Video, Phone, MicOff, Search, Timer, Edit2, Palette, Image as ImageIcon, ShieldCheck, Plus, Ban, AlertOctagon, X, Users } from 'lucide-react';

const ChatDetailsModal = ({ activeChat, setShowChatDetails, handleStartCall, notify }) => {
  if (!activeChat) return null;

  const handleAction = (msg) => notify(msg, "info");

  return (
    <div className="absolute right-0 top-0 bottom-0 w-[420px] bg-[#121212] border-l border-neutral-800/60 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
      
      {/* Kapatma Butonu */}
      <div className="flex justify-start p-6">
        <button onClick={() => setShowChatDetails(false)} className="text-neutral-400 hover:text-white transition">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-8">
        
        {/* Avatar ve İsim */}
        <div className="flex flex-col items-center mb-8">
          <div className={`w-24 h-24 rounded-full bg-gradient-to-tr ${activeChat.color} flex items-center justify-center text-white font-black text-4xl shadow-xl mb-4`}>
            {activeChat.name[0]?.toUpperCase()}
          </div>
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2 cursor-pointer hover:underline">
            {activeChat.name}
          </h2>
          {activeChat.isGroup && <p className="text-xs text-neutral-400 mt-1">{activeChat.members?.length || 1} Üye</p>}
        </div>

        {/* Aksiyon Butonları */}
        <div className="flex justify-center gap-4 mb-8">
          <button onClick={() => handleStartCall('video')} className="flex flex-col items-center gap-2 p-3 bg-[#2a2a2a] hover:bg-[#333] rounded-2xl w-[72px] transition"><Video className="w-5 h-5 text-neutral-300" /><span className="text-[10px] text-neutral-400">Video</span></button>
          <button onClick={() => handleStartCall('voice')} className="flex flex-col items-center gap-2 p-3 bg-[#2a2a2a] hover:bg-[#333] rounded-2xl w-[72px] transition"><Phone className="w-5 h-5 text-neutral-300" /><span className="text-[10px] text-neutral-400">Audio</span></button>
          <button onClick={() => handleAction("Sohbet sessize alındı")} className="flex flex-col items-center gap-2 p-3 bg-[#2a2a2a] hover:bg-[#333] rounded-2xl w-[72px] transition"><MicOff className="w-5 h-5 text-neutral-300" /><span className="text-[10px] text-neutral-400">Mute</span></button>
          <button onClick={() => handleAction("Arama modülü açılıyor")} className="flex flex-col items-center gap-2 p-3 bg-[#2a2a2a] hover:bg-[#333] rounded-2xl w-[72px] transition"><Search className="w-5 h-5 text-neutral-300" /><span className="text-[10px] text-neutral-400">Search</span></button>
        </div>

        {/* Birinci Ayar Grubu */}
        <div className="border-t border-neutral-800/80 pt-4 mb-4 space-y-1">
          <div className="flex items-start justify-between p-3 hover:bg-white/5 rounded-xl cursor-pointer transition">
            <div className="flex gap-4">
              <Timer className="w-5 h-5 text-neutral-400 mt-0.5" />
              <div>
                <span className="text-sm text-neutral-200 block">Disappearing messages</span>
                <span className="text-xs text-neutral-500 block">When enabled, messages sent and received in this chat will disappear after they've been seen.</span>
              </div>
            </div>
            <span className="text-xs bg-[#2a2a2a] px-3 py-1 rounded-full text-neutral-300 shrink-0">Off v</span>
          </div>

          <div className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl cursor-pointer transition">
            <Edit2 className="w-5 h-5 text-neutral-400" />
            <span className="text-sm text-neutral-200">Nickname</span>
          </div>

          <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl cursor-pointer transition">
            <div className="flex gap-4 items-center">
              <Palette className="w-5 h-5 text-neutral-400" />
              <span className="text-sm text-neutral-200">Chat color</span>
            </div>
            <div className={`w-6 h-6 rounded-full bg-gradient-to-tr ${activeChat.color}`}></div>
          </div>

          <div className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl cursor-pointer transition">
            <ImageIcon className="w-5 h-5 text-neutral-400" />
            <span className="text-sm text-neutral-200">Media, links, and files</span>
          </div>

          {!activeChat.isGroup && (
            <div className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl cursor-pointer transition">
              <ShieldCheck className="w-5 h-5 text-neutral-400" />
              <span className="text-sm text-neutral-200">View Safety Number</span>
            </div>
          )}
        </div>

        {/* İkinci Ayar Grubu (Grup işlemleri) */}
        <div className="border-t border-neutral-800/80 pt-4 mb-4 space-y-1">
          {activeChat.isGroup ? (
            <div className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl cursor-pointer transition">
              <Plus className="w-5 h-5 text-neutral-400" />
              <span className="text-sm text-neutral-200">Add members</span>
            </div>
          ) : (
            <>
              <p className="text-xs text-neutral-500 px-3 font-semibold mb-2">No groups in common</p>
              <div className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl cursor-pointer transition">
                <Plus className="w-5 h-5 text-neutral-400" />
                <span className="text-sm text-neutral-200">Add to a group</span>
              </div>
            </>
          )}
        </div>

        {/* Üçüncü Ayar Grubu (Kırmızı olanlar) */}
        <div className="border-t border-neutral-800/80 pt-4 space-y-1">
          <div className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl cursor-pointer transition text-[#ff4b4b]">
            <Ban className="w-5 h-5" />
            <span className="text-sm font-medium">Block</span>
          </div>
          <div className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl cursor-pointer transition text-[#ff4b4b]">
            <AlertOctagon className="w-5 h-5" />
            <span className="text-sm font-medium">Report spam</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ChatDetailsModal;