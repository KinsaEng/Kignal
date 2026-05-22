import React from 'react';
import { Zap, LogIn, UserPlus, Cpu } from 'lucide-react';
import ToastContainer from '../shared/ToastContainer';

const AuthScreen = ({ 
  authMode, setAuthMode, handleLogin, handleRegister, handleForgotPassword, 
  loginInput, setLoginInput, setCurrentUser, setIsLoggedIn, notify, notifications,
  removeNotification
}) => {
  return (
    <div className="h-screen bg-[#050505] flex items-center justify-center font-sans text-white p-6 relative overflow-hidden">
      <ToastContainer notifications={notifications} removeNotification={removeNotification} />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />

      <div className="w-full max-w-md bg-neutral-900/40 border border-neutral-800/50 p-10 rounded-[40px] backdrop-blur-3xl shadow-2xl z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/20 mb-6">
            <Zap className="w-10 h-10 text-white fill-white" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter">Kignal</h1>
          <p className="text-neutral-500 text-xs mt-2 font-mono tracking-widest uppercase">Ultra Secure Messenger</p>
          
          <div className="flex bg-black/60 p-1.5 rounded-2xl mt-8 border border-neutral-800">
            <button onClick={() => setAuthMode('login')} className={`px-8 py-2.5 rounded-xl text-xs font-black transition ${authMode === 'login' ? 'bg-blue-600 text-white shadow-lg' : 'text-neutral-500'}`}>GİRİŞ</button>
            <button onClick={() => setAuthMode('register')} className={`px-8 py-2.5 rounded-xl text-xs font-black transition ${authMode === 'register' ? 'bg-blue-600 text-white shadow-lg' : 'text-neutral-500'}`}>KAYIT</button>
          </div>
        </div>

        {authMode === 'forgot' ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="text-[10px] text-neutral-500 text-center uppercase tracking-widest mb-4">Şifrenizi kurtarmak için kullanıcı adınızı veya e-postanızı girin.</p>
            <input 
              type="text" placeholder="E-posta veya Kullanıcı Adı" 
              className="w-full bg-black/40 border border-neutral-800 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
              onChange={e => setLoginInput({...loginInput, email: e.target.value, user: e.target.value})} 
            />
            <button className="w-full py-4 bg-white text-black font-black rounded-2xl hover:bg-neutral-200 transition active:scale-95 flex items-center justify-center gap-2 shadow-xl mt-4">
              TALİMATLARI GÖNDER
            </button>
            <button type="button" onClick={() => setAuthMode('login')} className="w-full text-[10px] text-neutral-500 hover:text-white font-bold transition uppercase tracking-widest mt-2">
              Geri Dön
            </button>
          </form>
        ) : (
          <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-4">
            {authMode === 'register' && (
              <input type="email" placeholder="E-posta Adresi" className="w-full bg-black/40 border border-neutral-800 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" onChange={e => setLoginInput({...loginInput, email: e.target.value})} />
            )}
            <input type="text" placeholder="Kullanıcı Adı" className="w-full bg-black/40 border border-neutral-800 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" onChange={e => setLoginInput({...loginInput, user: e.target.value})} />
            <input type="password" placeholder="Şifre" className="w-full bg-black/40 border border-neutral-800 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" onChange={e => setLoginInput({...loginInput, pass: e.target.value})} />
            
            {authMode === 'login' && (
              <div className="flex justify-end px-2">
                <button type="button" onClick={() => setAuthMode('forgot')} className="text-[10px] text-neutral-500 hover:text-blue-400 font-bold transition uppercase tracking-widest">
                  Şifremi Unuttum?
                </button>
              </div>
            )}

            <button className="w-full py-4 bg-white text-black font-black rounded-2xl hover:bg-neutral-200 transition active:scale-95 flex items-center justify-center gap-2 shadow-xl mt-4">
              {authMode === 'login' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              {authMode === 'login' ? 'BAŞLAT' : 'HESAP OLUŞTUR'}
            </button>
          </form>
        )}

        <button onClick={() => { setCurrentUser("Bypass_Admin"); setIsLoggedIn(true); notify("Bypass Modu Aktif!", "info"); }} className="w-full mt-6 py-4 bg-red-600/10 border border-red-500/20 text-red-500 font-bold rounded-2xl hover:bg-red-600 hover:text-white transition flex items-center justify-center gap-2">
          <Cpu className="w-5 h-5" /> BYPASS MODU (DEBUG)
        </button>
      </div>
    </div>
  );
};

export default AuthScreen;