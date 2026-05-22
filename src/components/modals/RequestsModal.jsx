import React, { useState } from 'react';
import { UserPlus, X, Check, XCircle } from 'lucide-react';

const RequestsModal = ({ setShowRequests, incomingRequests, outgoingRequests, handleAction }) => {
  const [tab, setTab] = useState('incoming');

  return (
    <div className="absolute inset-0 z-[150] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800/60 p-8 rounded-[40px] shadow-2xl relative max-h-[80vh] flex flex-col">
        <button onClick={() => setShowRequests(false)} className="absolute top-6 right-6 p-2 text-neutral-500 hover:text-white transition"><X className="w-6 h-6" /></button>
        
        <div className="flex items-center gap-3 mb-6">
          <UserPlus className="w-6 h-6 kignal-primary-text" />
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">İstek Yönetimi</h2>
        </div>

        <div className="flex bg-black p-1.5 rounded-2xl mb-6 border border-neutral-800 shrink-0">
          <button onClick={() => setTab('incoming')} className={`flex-1 py-2.5 rounded-xl text-[11px] font-black transition relative ${tab === 'incoming' ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}>
            GELEN İSTEKLER 
            {incomingRequests.length > 0 && <span className="ml-2 bg-red-500 text-white px-1.5 py-0.5 rounded-md text-[9px]">{incomingRequests.length}</span>}
          </button>
          <button onClick={() => setTab('outgoing')} className={`flex-1 py-2.5 rounded-xl text-[11px] font-black transition ${tab === 'outgoing' ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}>
            GÖNDERİLENLER
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
          {tab === 'incoming' && (
            incomingRequests.length === 0 ? <p className="text-xs text-neutral-500 text-center py-6">Bekleyen gelen istek yok.</p> :
            incomingRequests.map(req => (
              <div key={req.id} className="flex items-center justify-between bg-black border border-neutral-800 p-4 rounded-2xl">
                <span className="text-sm font-bold text-white">{req.sender_username}</span>
                <div className="flex gap-2">
                  <button onClick={() => handleAction(req.id, 'accept')} className="p-2 bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white rounded-lg transition" title="Kabul Et"><Check className="w-4 h-4" /></button>
                  <button onClick={() => handleAction(req.id, 'reject')} className="p-2 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition" title="Reddet"><X className="w-4 h-4" /></button>
                </div>
              </div>
            ))
          )}

          {tab === 'outgoing' && (
            outgoingRequests.length === 0 ? <p className="text-xs text-neutral-500 text-center py-6">Gönderilmiş bir isteğiniz yok.</p> :
            outgoingRequests.map(req => (
              <div key={req.id} className="flex items-center justify-between bg-black border border-neutral-800 p-4 rounded-2xl">
                <span className="text-sm font-bold text-white">{req.receiver_username}</span>
                <button onClick={() => handleAction(req.id, 'cancel')} className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition text-xs font-bold">
                  <XCircle className="w-4 h-4" /> İPTAL ET
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestsModal;