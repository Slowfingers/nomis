import * as React from 'react';
import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Smartphone, X, Share, MoreVertical, Plus, Home } from 'lucide-react';

export const InstallGuide: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useLanguage();
  const [platform, setPlatform] = useState<'ios' | 'android'>('ios');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] max-w-lg w-full p-6 md:p-8 shadow-2xl relative overflow-y-auto max-h-[85vh] animate-in zoom-in-95 duration-300">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-3 text-white">
            <Smartphone size={24} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">{t('install.title')}</h2>
        </div>

        {/* Platform Selector */}
        <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setPlatform('ios')}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
              platform === 'ios'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            iPhone (iOS)
          </button>
          <button
            onClick={() => setPlatform('android')}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
              platform === 'android'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Android
          </button>
        </div>

        {/* iOS Instructions */}
        {platform === 'ios' && (
          <div className="space-y-4">
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              {t('install.ios.intro')}
            </p>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="bg-emerald-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 mb-2">{t('install.ios.step1.title')}</p>
                    <p className="text-sm text-slate-600 mb-3">{t('install.ios.step1.desc')}</p>
                    <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-center gap-2">
                      <Share size={20} className="text-blue-500" />
                      <span className="text-sm font-medium text-slate-700">{t('install.ios.step1.button')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="bg-emerald-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 mb-2">{t('install.ios.step2.title')}</p>
                    <p className="text-sm text-slate-600 mb-3">{t('install.ios.step2.desc')}</p>
                    <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-center gap-2">
                      <Plus size={20} className="text-slate-700" />
                      <span className="text-sm font-medium text-slate-700">{t('install.ios.step2.button')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="bg-emerald-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 mb-2">{t('install.ios.step3.title')}</p>
                    <p className="text-sm text-slate-600">{t('install.ios.step3.desc')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Android Instructions */}
        {platform === 'android' && (
          <div className="space-y-4">
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              {t('install.android.intro')}
            </p>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="bg-emerald-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 mb-2">{t('install.android.step1.title')}</p>
                    <p className="text-sm text-slate-600 mb-3">{t('install.android.step1.desc')}</p>
                    <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-center gap-2">
                      <MoreVertical size={20} className="text-slate-700" />
                      <span className="text-sm font-medium text-slate-700">{t('install.android.step1.button')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="bg-emerald-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 mb-2">{t('install.android.step2.title')}</p>
                    <p className="text-sm text-slate-600 mb-3">{t('install.android.step2.desc')}</p>
                    <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-center gap-2">
                      <Home size={20} className="text-slate-700" />
                      <span className="text-sm font-medium text-slate-700">{t('install.android.step2.button')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="bg-emerald-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 mb-2">{t('install.android.step3.title')}</p>
                    <p className="text-sm text-slate-600">{t('install.android.step3.desc')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="w-full mt-6 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-colors"
        >
          {t('install.close')}
        </button>
      </div>
    </div>
  );
};
