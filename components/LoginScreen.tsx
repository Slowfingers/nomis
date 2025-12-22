import * as React from 'react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Sparkles, CheckCircle2, X, ShieldCheck, Lock, Server, Cloud } from 'lucide-react';
import { UzbekPattern } from './UzbekPattern';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    await login();
    // No need to set false, component will unmount
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-[#f8fafc] p-6 relative overflow-hidden">
       <UzbekPattern opacity={0.1} />
       {/* Background Decoration */}
       <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-200/20 blur-3xl pointer-events-none"></div>
       <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-200/20 blur-3xl pointer-events-none"></div>

       <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-emerald-900/5 p-8 md:p-12 relative z-10 border border-white/50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-700">
          
          {/* Logo */}
          <div className="flex flex-col items-center mb-10 text-center">
             <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-emerald-200 mb-6 rotate-3 hover:rotate-6 transition-transform duration-500">
                <span className="text-4xl font-black">N</span>
             </div>
             <h1 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">{t('app.name')}</h1>
             <p className="text-slate-500 font-medium">{t('app.slogan')}</p>
          </div>

          {/* Features */}
          <div className="space-y-4 mb-10">
             <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div className="bg-white p-1.5 rounded-lg shadow-sm text-emerald-500"><CheckCircle2 size={18} /></div>
                <span className="text-sm font-medium">{t('sidebar.lists')} & {t('sidebar.all')}</span>
             </div>
             <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div className="bg-white p-1.5 rounded-lg shadow-sm text-emerald-500"><Sparkles size={18} /></div>
                <span className="text-sm font-medium">{t('sidebar.habits')} & {t('sidebar.focus')}</span>
             </div>
          </div>

          {/* Google Button */}
          <button 
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full relative group flex items-center justify-center gap-3 bg-white text-slate-700 font-bold py-4 rounded-2xl border-2 border-slate-100 hover:border-emerald-200 hover:bg-slate-50 transition-all duration-300 shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            {isLoggingIn ? (
               <div className="flex items-center gap-2">
                 <svg className="animate-spin h-5 w-5 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
                 <span>{t('auth.logging_in')}</span>
               </div>
            ) : (
                <>
                    {/* Google Icon SVG */}
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                        />
                        <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                        />
                        <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                        />
                        <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                        />
                    </svg>
                    <span>{t('auth.login_google')}</span>
                </>
            )}
          </button>
          
          <p className="mt-8 text-center text-xs text-slate-400 leading-relaxed">
            {t('auth.terms_agreement')} <button onClick={() => setShowTerms(true)} className="text-emerald-600 hover:text-emerald-700 hover:underline font-medium focus:outline-none">{t('auth.terms')}</button> Timsy.
            <br/>{t('auth.demo_mode')}
          </p>
       </div>

       {/* Terms Modal */}
       {showTerms && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] max-w-lg w-full p-6 md:p-8 shadow-2xl relative overflow-y-auto max-h-[85vh] animate-in zoom-in-95 duration-300">
               <button 
                 onClick={() => setShowTerms(false)}
                 className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
               >
                 <X size={20} />
               </button>

               <h2 className="text-2xl font-bold text-slate-800 mb-6">{t('auth.modal.title')}</h2>
               
               <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                     <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-2">
                        <Lock size={16} className="text-emerald-500" />
                        1. {t('auth.modal.sso')}
                     </h3>
                     <p>
                        {t('auth.modal.sso_desc')}
                     </p>
                  </div>

                  <div>
                     <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-2">
                        <ShieldCheck size={16} className="text-blue-500" />
                        2. {t('auth.modal.data')}
                     </h3>
                     <p>
                        {t('auth.modal.data_desc')}
                     </p>
                  </div>

                  <div>
                     <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-2">
                        <Cloud size={16} className="text-orange-500" />
                        3. {t('auth.modal.sync')}
                     </h3>
                     <p>
                        {t('auth.modal.sync_desc')}
                     </p>
                  </div>
               </div>
               
               <button 
                 onClick={() => setShowTerms(false)}
                 className="w-full mt-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors"
               >
                 {t('auth.modal.close')}
               </button>
            </div>
         </div>
       )}
    </div>
  );
};