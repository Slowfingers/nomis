import * as React from 'react';
import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export const NetworkStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsSyncing(true);
      // Simulate sync delay
      setTimeout(() => {
        setIsSyncing(false);
        setShowSyncSuccess(true);
        setTimeout(() => setShowSyncSuccess(false), 2000);
      }, 1500);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="bg-slate-800 text-white px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-medium shadow-lg animate-in fade-in slide-in-from-top-2">
        <WifiOff size={12} className="text-red-400" />
        <span>Офлайн режим</span>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="bg-white border border-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-medium shadow-sm animate-in fade-in slide-in-from-top-2">
        <RefreshCw size={12} className="animate-spin" />
        <span>Синхронизация...</span>
      </div>
    );
  }

  if (showSyncSuccess) {
    return (
      <div className="bg-emerald-500 text-white px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-medium shadow-lg animate-in fade-in slide-in-from-top-2 fade-out duration-500">
        <Wifi size={12} />
        <span>В сети</span>
      </div>
    );
  }

  return null;
};