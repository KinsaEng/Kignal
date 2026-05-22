import React, { useState } from 'react';
import { Settings, User, Palette, Moon, Sun, Monitor, X, Check } from 'lucide-react';

const SettingsModal = ({ 
  setShowSettings, currentUser, setCurrentUser, supabase, notify,
  theme, setTheme, primaryColor, setPrimaryColor 
}) => {
  const [newUsername, setNewUsername] = useState(currentUser);
  const [loading, setLoading] = useState(false);

  const colors = [
    { id: 'blue', class: 'bg-blue-600' },
    { id: 'emerald', class: 'bg-emerald-600' },
    { id: 'rose', class: 'bg-rose-600' },
    { id: 'violet', class: 'bg-violet-600' },
    { id: 'amber', class: 'bg-amber-600' }
  ];

  const handleUpdateUsername = async () => {
    if (!newUsername.trim() || newUsername === currentUser) return;
    setLoading(true);
    
    // Supabase User Metadata güncellemesi
    const { data, error } = await supabase.auth.updateUser({
      data: { username: newUsername }
    });

    if (error) {
      notify("Kullanıcı adı güncellenemedi: " + error.message, "error");
    } else {
      setCurrentUser(newUsername);
      notify("Kullanıcı adı başarıyla güncellendi!", "success");
    }
    setLoading(false);
  };

  return (
    <div className="absolute inset-0 z-[150] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 p-8 rounded-[40px] shadow-2xl relative">
        <button onClick={() => setShowSettings(false)} className="absolute top-6 right-6 p-2 text-neutral-500 hover:text-white transition"><X className="w-6 h-6" /></button>
        
        <div className="flex items-center gap-3 mb-8">
          <Settings className={`w-8 h-8 text-${primaryColor}-500`} />
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Ayarlar</h2>
        </div>

        <div className="space-y-8">
          {/* Kullanıcı Adı Ayarı */}
          <div className="space-y-3">
            <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest flex items-center gap-2"><User className="w-3 h-3" /> Kullanıcı Adı</label>
            <div className="flex gap-2">
              <input 
                type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)}
                className="flex-1 bg-black/50 border border-neutral-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-neutral-600 text-white"
              />
              <button onClick={handleUpdateUsername} disabled={loading} className={`px-4 bg-${primaryColor}-600 hover:bg-${primaryColor}-500 text-white rounded-2xl font-bold text-sm transition`}>
                {loading ? '...' : 'Kaydet'}
              </button>
            </div>
          </div>

          {/* Tema Ayarı */}
          <div className="space-y-3">
            <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest flex items-center gap-2"><Monitor className="w-3 h-3" /> Görünüm (Mod)</label>
            <div className="flex gap-2 p-1 bg-black/50 border border-neutral-800 rounded-2xl">
              {[
                { id: 'light', icon: Sun, label: 'Açık' },
                { id: 'dark', icon: Moon, label: 'Koyu' },
                { id: 'system', icon: Monitor, label: 'Sistem' }
              ].map(t => (
                <button key={t.id} onClick={() => setTheme(t.id)} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition ${theme === t.id ? `bg-${primaryColor}-600 text-white` : 'text-neutral-500 hover:text-white'}`}>
                  <t.icon className="w-4 h-4" /> {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Renk Paleti Ayarı */}
          <div className="space-y-3">
            <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest flex items-center gap-2"><Palette className="w-3 h-3" /> Vurgu Rengi</label>
            <div className="flex gap-3">
              {colors.map(c => (
                <button key={c.id} onClick={() => setPrimaryColor(c.id)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${c.class} ${primaryColor === c.id ? 'ring-4 ring-white/20' : ''}`}>
                  {primaryColor === c.id && <Check className="w-5 h-5 text-white" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;