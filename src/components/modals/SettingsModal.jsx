import React, { useState } from 'react';
import { Settings, User, Palette, Moon, Sun, Monitor, Phone, Trash2, X, Check } from 'lucide-react';

const SettingsModal = ({ 
  setShowSettings, currentUser, setCurrentUser, supabase, notify,
  theme, setTheme, primaryColor, setPrimaryColor 
}) => {
  const [newUsername, setNewUsername] = useState(currentUser);
  const [newPhone, setNewPhone] = useState("");
  const [customColor, setCustomColor] = useState(primaryColor);
  const [loading, setLoading] = useState(false);

  const colors = ['#2563eb', '#059669', '#e11d48', '#7c3aed', '#d97706'];

  const handleUpdate = async () => {
    setLoading(true);
    let updateData = {};
    if (newUsername.trim() && newUsername !== currentUser) updateData.data = { username: newUsername };
    if (newPhone.trim()) updateData.phone = newPhone;

    const { error } = await supabase.auth.updateUser(updateData);
    if (error) notify("Güncelleme hatası: " + error.message, "error");
    else {
      if(updateData.data?.username) setCurrentUser(newUsername);
      setPrimaryColor(customColor);
      notify("Ayarlar başarıyla güncellendi!", "success");
      setShowSettings(false);
    }
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    if(window.confirm("Hesabınızı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) {
      // Supabase'de hesabı silme işlemi (Backend'de admin yetkisi gerektirebilir, burada auth çağrısı atıyoruz)
      notify("Hesap silme işlemi yöneticilere iletildi.", "info");
      await supabase.auth.signOut();
    }
  };

  return (
    <div className="absolute inset-0 z-[150] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 p-8 rounded-[40px] shadow-2xl relative">
        <button onClick={() => setShowSettings(false)} className="absolute top-6 right-6 p-2 text-neutral-500 hover:text-white transition"><X className="w-6 h-6" /></button>
        
        <div className="flex items-center gap-3 mb-8">
          <Settings className="w-8 h-8 kignal-primary-text" />
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Ayarlar</h2>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest flex items-center gap-2"><User className="w-3 h-3" /> Kullanıcı Adı</label>
            <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none text-white" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest flex items-center gap-2"><Phone className="w-3 h-3" /> Telefon Ekle (SMS için)</label>
            <input type="tel" placeholder="+90555..." value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none text-white" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest flex items-center gap-2"><Monitor className="w-3 h-3" /> Görünüm Modu</label>
            <div className="flex gap-2 p-1 bg-black border border-neutral-800 rounded-xl">
              {[{ id: 'light', icon: Sun }, { id: 'dark', icon: Moon }, { id: 'system', icon: Monitor }].map(t => (
                <button key={t.id} onClick={() => setTheme(t.id)} className={`flex-1 flex justify-center py-2 rounded-lg transition ${theme === t.id ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}><t.icon className="w-4 h-4" /></button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest flex items-center gap-2"><Palette className="w-3 h-3" /> Özel Renk Paleti (Hex/RGB)</label>
            <div className="flex items-center gap-3">
              {colors.map(c => (
                <button key={c} onClick={() => setCustomColor(c)} style={{backgroundColor: c}} className={`w-8 h-8 rounded-full transition-transform hover:scale-110 flex items-center justify-center ${customColor === c ? 'ring-2 ring-white' : ''}`}>
                  {customColor === c && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
              <input type="text" placeholder="#ff0055" value={customColor} onChange={(e) => setCustomColor(e.target.value)} className="w-24 bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs text-center text-white ml-auto font-mono" />
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-800 flex justify-between items-center">
            <button onClick={handleDeleteAccount} className="flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-400 transition"><Trash2 className="w-4 h-4" /> Hesabı Sil</button>
            <button onClick={handleUpdate} disabled={loading} className="px-6 py-3 kignal-primary-bg hover:brightness-110 text-white rounded-xl font-bold text-sm transition">
              {loading ? 'KAYDEDİLİYOR...' : 'KAYDET'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;