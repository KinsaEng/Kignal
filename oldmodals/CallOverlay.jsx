import React from 'react';
import { Zap, Activity, VideoOff, MicOff, Mic, Video } from 'lucide-react';

const CallOverlay = ({ activeChat, isVideoOff, setIsVideoOff, isMuted, setIsMuted, localVideoRef, handleEndCall }) => {
  return (
    <div className="absolute inset-0 z-[200] bg-neutral-950/95 backdrop-blur-xl flex flex-col justify-between p-12 text-white animate-in zoom-in duration-300">
      <div className="flex justify-between items-center max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <Zap className="w-6 h-6 text-blue-500 fill-blue-500 animate-pulse" />
          <span className="text-xs uppercase tracking-widest font-mono text-neutral-400">Kignal HD P2P Video Link</span>
        </div>
        <div className="px-4 py-2 bg-red-600/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-black uppercase flex items-center gap-2">
          <Activity className="w-4 h-4" /> CANLI • 4K 120FPS
        </div>
      </div>

      <div className="flex-1 my-10 max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center justify-center">
        <div className="bg-neutral-900 border border-neutral-800 rounded-[40px] h-[360px] relative overflow-hidden flex items-center justify-center shadow-2xl">
          {isVideoOff ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center"><VideoOff className="w-6 h-6 text-neutral-500" /></div>
              <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Kamera Kapatıldı</span>
            </div>
          ) : (
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-[40px]" />
          )}
          <div className="absolute bottom-6 left-6 bg-black/60 px-4 py-2 rounded-xl text-xs font-bold backdrop-blur-md">Kendi Yayınınız</div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-[40px] h-[360px] relative overflow-hidden flex items-center justify-center shadow-2xl">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className={`w-20 h-20 bg-gradient-to-tr ${activeChat.color} rounded-[32px] flex items-center justify-center text-3xl font-black text-white shadow-2xl`}>
              {activeChat.name[0]?.toUpperCase()}
            </div>
            <div>
              <h4 className="font-bold text-lg text-white">{activeChat.name}</h4>
              <span className="text-xs text-neutral-500 uppercase tracking-widest">P2P Bağlantısı Bekleniyor</span>
            </div>
          </div>
          <div className="absolute bottom-6 left-6 bg-black/60 px-4 py-2 rounded-xl text-xs font-bold backdrop-blur-md">{activeChat.name}</div>
        </div>
      </div>

      <div className="flex justify-center items-center gap-4 max-w-5xl mx-auto w-full">
        <button 
          onClick={() => setIsMuted(!isMuted)} 
          className={`p-5 rounded-2xl transition border ${isMuted ? 'bg-red-500 border-red-500 text-white' : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-300'}`}
          title={isMuted ? "Mikrofonu Aç" : "Mikrofonu Kapat"}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>
        <button 
          onClick={() => setIsVideoOff(!isVideoOff)} 
          className={`p-5 rounded-2xl transition border ${isVideoOff ? 'bg-red-500 border-red-500 text-white' : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-300'}`}
          title={isVideoOff ? "Kamerayı Aç" : "Kamerayı Kapat"}
        >
          {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
        </button>
        <button onClick={handleEndCall} className="p-6 bg-red-600 hover:bg-red-500 text-white rounded-[24px] shadow-2xl transition font-black text-xs uppercase px-10">
          Aramayı Bitir
        </button>
      </div>
    </div>
  );
};

export default CallOverlay;