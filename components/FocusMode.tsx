import * as React from 'react';
import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, CheckCircle, Bell } from 'lucide-react';
import { Button } from './Button';
import { Task } from '../types';

interface FocusModeProps {
  tasks: Task[];
}

export const FocusMode: React.FC<FocusModeProps> = ({ tasks }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'pomodoro' | 'short' | 'long'>('pomodoro');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  const activeTasks = tasks.filter(t => !t.isCompleted);

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    let interval: number | undefined;

    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      // Timer finished
      setIsActive(false);
      if (mode === 'pomodoro') {
        setSessionsCompleted(s => s + 1);
      }
      
      // Sound
      const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
      audio.play().catch(() => {});

      // Notification
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Timsy: Время вышло!", {
          body: mode === 'pomodoro' ? "Отличная работа! Пора отдохнуть." : "Перерыв окончен, за работу!",
          icon: "/icon.png" // Fallback usually
        });
      }
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    if (mode === 'pomodoro') setTimeLeft(25 * 60);
    if (mode === 'short') setTimeLeft(5 * 60);
    if (mode === 'long') setTimeLeft(15 * 60);
  };

  const setTimerMode = (newMode: 'pomodoro' | 'short' | 'long') => {
    setMode(newMode);
    setIsActive(false);
    if (newMode === 'pomodoro') setTimeLeft(25 * 60);
    if (newMode === 'short') setTimeLeft(5 * 60);
    if (newMode === 'long') setTimeLeft(15 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = 100 - (timeLeft / (mode === 'pomodoro' ? 1500 : mode === 'short' ? 300 : 900)) * 100;

  return (
    <div className="flex flex-col items-center justify-center h-full p-2 md:p-6 max-w-2xl mx-auto animate-in fade-in duration-500 w-full">
      <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 p-6 md:p-10 w-full text-center border border-slate-100">
        
        <div className="flex justify-center mb-6 md:mb-10 w-full">
          <div className="bg-slate-50 p-1.5 rounded-2xl inline-flex shadow-inner gap-1 sm:gap-2 max-w-full">
            <button 
              onClick={() => setTimerMode('pomodoro')}
              className={`px-2.5 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2.5 rounded-xl text-[11px] sm:text-xs md:text-sm font-bold transition-all whitespace-nowrap ${mode === 'pomodoro' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <span className="hidden sm:inline">Фокус (25м)</span>
              <span className="sm:hidden">25м</span>
            </button>
            <button 
              onClick={() => setTimerMode('short')}
              className={`px-2.5 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2.5 rounded-xl text-[11px] sm:text-xs md:text-sm font-bold transition-all whitespace-nowrap ${mode === 'short' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <span className="hidden sm:inline">Короткий (5м)</span>
              <span className="sm:hidden">5м</span>
            </button>
            <button 
              onClick={() => setTimerMode('long')}
              className={`px-2.5 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2.5 rounded-xl text-[11px] sm:text-xs md:text-sm font-bold transition-all whitespace-nowrap ${mode === 'long' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <span className="hidden sm:inline">Длинный (15м)</span>
              <span className="sm:hidden">15м</span>
            </button>
          </div>
        </div>

        <div className="relative w-56 h-56 sm:w-64 sm:h-64 md:w-80 md:h-80 mx-auto mb-8 md:mb-10 flex items-center justify-center">
           {/* Circular Progress Ring */}
           <svg className="w-full h-full transform -rotate-90 drop-shadow-xl">
             <circle
               cx="50%"
               cy="50%"
               r="44%"
               stroke="#f1f5f9"
               strokeWidth="8%"
               fill="none"
             />
             <circle
               cx="50%"
               cy="50%"
               r="44%"
               stroke={mode === 'pomodoro' ? '#10b981' : '#34d399'}
               strokeWidth="8%"
               fill="none"
               strokeDasharray={`${2 * Math.PI * 44}%`} 
               // Note: SVG Dashoffset math for percentage radius needs actual pixel calculation or viewBox. 
               // Simplified for responsiveness: using css variable or standard viewbox might be better, 
               // but here we stick to relative sizing.
               // Let's use standard unitless coords for SVG to make it perfectly responsive.
               pathLength={100}
               strokeDashoffset={100 - progress}
               className="transition-all duration-1000 ease-linear"
               strokeLinecap="round"
             />
           </svg>
           <div className="absolute inset-0 flex flex-col items-center justify-center">
             <span className="text-4xl sm:text-5xl md:text-7xl font-black text-slate-800 tracking-tighter tabular-nums">
               {formatTime(timeLeft)}
             </span>
             <span className="text-emerald-500 text-[10px] sm:text-xs md:text-sm font-bold mt-2 uppercase tracking-[0.15em] sm:tracking-[0.2em]">
                {isActive ? 'Не отвлекайся' : 'Готов к работе?'}
             </span>
           </div>
        </div>

        <div className="mb-8 md:mb-10">
          <select 
            className="w-full max-w-xs bg-slate-50 border-0 text-slate-700 font-medium rounded-xl px-3 sm:px-4 py-2.5 sm:py-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-200 cursor-pointer hover:bg-slate-100 transition-colors shadow-sm text-xs sm:text-sm md:text-base"
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
          >
            <option value="">🎯 Выбери задачу цели</option>
            {activeTasks.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-center gap-3 sm:gap-4">
          <Button 
            onClick={toggleTimer}
            size="lg"
            className={`min-w-[120px] sm:min-w-[140px] md:min-w-[160px] text-sm sm:text-base md:text-lg py-2.5 sm:py-3 md:py-4 rounded-2xl shadow-lg ${isActive ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200' : 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-200'}`}
          >
            {isActive ? <Pause className="mr-1.5 sm:mr-2" size={18}/> : <Play className="mr-1.5 sm:mr-2" size={18}/>}
            {isActive ? 'Пауза' : 'Старт'}
          </Button>
          
          <Button variant="secondary" onClick={resetTimer} size="lg" className="px-4 sm:px-5 md:px-6 rounded-2xl border-slate-200 text-slate-400 hover:text-slate-600">
            <RotateCcw size={18} />
          </Button>
        </div>

        <div className="mt-8 md:mt-10 pt-6 border-t border-slate-50 text-slate-400 flex items-center justify-center gap-1.5 sm:gap-2 font-medium text-xs sm:text-sm md:text-base">
            <CheckCircle size={16} className="text-emerald-500 flex-shrink-0"/>
            <span className="text-center">Фокус-сессий сегодня: <strong className="text-emerald-600 text-sm sm:text-base md:text-lg ml-1">{sessionsCompleted}</strong></span>
        </div>

      </div>
    </div>
  );
};