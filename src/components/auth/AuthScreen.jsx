import React, { useState } from 'react';
import { Zap, LogIn, UserPlus, Mail } from 'lucide-react';
import ToastContainer from '../shared/ToastContainer';
import { supabase } from '../../App';

const AuthScreen = ({ authMode, setAuthMode, notify, notifications, removeNotification }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (authMode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) notify("Giriş başarısız: " + error.message, "error");
    } else if (authMode === 'register') {
      // Kayıt olurken metadata olarak username gönderiyoruz
      const { error } = await supabase.auth.signUp({ 
        email, password, options: { data: { username: username } }
      });
      if (error) notify("Kayıt başarısız: " + error.message, "error");
      else { notify("Kayıt başarılı! Giriş yapabilirsiniz.", "success"); setAuthMode('login'); }
    } else if (authMode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) notify("Hata: " + error.message, "error");
      else notify("Şifre sıfırlama bağlantısı e-postanıza gönderildi!", "success");
    }
    setLoading(false);
  };

  return (
    <div className="h-screen bg-[#050505] flex items-center justify-center font-sans text-white p-6 relative overflow-hidden">
      <ToastContainer notifications={notifications} removeNotification={removeNotification} />
      
      <div className="w-full max-w-md bg-neutral-900/40 border border-neutral-800/50 p-10 rounded-[40px] backdrop-blur-3xl shadow-2xl z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/20 mb-6">
            <Zap className="w-10 h-10 text-white fill-white" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter">Kignal</h1>
          
          <div className="flex bg-black/60 p-1.5 rounded-2xl mt-8 border border-neutral-800 w-full">
            <button onClick={() => setAuthMode('login')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition ${authMode === 'login' ? 'bg-blue-600 text-white shadow-lg' : 'text-neutral-500'}`}>GİRİŞ</button>
            <button onClick={() => setAuthMode('register')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition ${authMode === 'register' ? 'bg-blue-600 text-white shadow-lg' : 'text-neutral-500'}`}>KAYIT</button>
          </div>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <input 
            type="email" placeholder="E-posta Adresi" required
            className="w-full bg-black/40 border border-neutral-800 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-white" 
            onChange={e => setEmail(e.target.value)} 
          />
          
          {authMode === 'register' && (
            <input 
              type="text" placeholder="Kullanıcı Adı" required
              className="w-full bg-black/40 border border-neutral-800 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-white" 
              onChange={e => setUsername(e.target.value)} 
            />
          )}

          {authMode !== 'forgot' && (
            <input 
              type="password" placeholder="Şifre" required minLength="6"
              className="w-full bg-black/40 border border-neutral-800 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-white" 
              onChange={e => setPassword(e.target.value)} 
            />
          )}

          {authMode === 'login' && (
            <div className="flex justify-end px-2">
              <button type="button" onClick={() => setAuthMode('forgot')} className="text-[10px] text-neutral-500 hover:text-blue-400 font-bold transition uppercase tracking-widest">
                Şifremi Unuttum?
              </button>
            </div>
          )}

          {authMode === 'forgot' && (
             <button type="button" onClick={() => setAuthMode('login')} className="w-full text-[10px] text-neutral-500 hover:text-white font-bold transition uppercase tracking-widest text-center">
               Geri Dön
             </button>
          )}

          <button disabled={loading} className="w-full py-4 bg-white text-black font-black rounded-2xl hover:bg-neutral-200 transition active:scale-95 flex items-center justify-center gap-2 shadow-xl mt-4 uppercase">
            {loading ? "Bekleyin..." : authMode === 'login' ? <><LogIn className="w-5 h-5"/> Başlat</> : authMode === 'register' ? <><UserPlus className="w-5 h-5"/> Hesap Oluştur</> : <><Mail className="w-5 h-5"/> Sıfırlama Gönder</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthScreen;