import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Task, Habit, Category } from '../types';
import { X, ChevronRight, ChevronLeft, Trophy, Flame, Target, Calendar, Sparkles, Star, Award } from 'lucide-react';
import { format, getMonth, getDay, isSameYear } from 'date-fns';
import { ru, enUS, uz } from 'date-fns/locale';
import { useLanguage } from '../contexts/LanguageContext';

interface YearInReviewProps {
  tasks: Task[];
  habits: Habit[];
  categories: Category[];
  onClose: () => void;
}

export const YearInReview: React.FC<YearInReviewProps> = ({ tasks, habits, categories, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { t, language } = useLanguage();
  const dateLocale = language === 'ru' ? ru : language === 'uz' ? uz : enUS;
  const totalSlides = 6;

  // --- Statistics Calculation ---
  const stats = useMemo(() => {
    const currentYear = new Date().getFullYear();
    // Filter tasks completed this year (fallback to dueDate if completedAt missing, but only if completed)
    const yearTasks = tasks.filter(t => {
      if (!t.isCompleted) return false;
      const date = t.completedAt ? new Date(t.completedAt) : new Date(t.dueDate);
      return isSameYear(date, new Date());
    });

    const totalCompleted = yearTasks.length;

    // Best Category
    const catCounts: Record<string, number> = {};
    yearTasks.forEach(t => {
      catCounts[t.categoryId] = (catCounts[t.categoryId] || 0) + 1;
    });
    const bestCatId = Object.keys(catCounts).sort((a, b) => catCounts[b] - catCounts[a])[0];
    const bestCategory = categories.find(c => c.id === bestCatId);

    // Best Month
    const monthCounts: Record<number, number> = {};
    yearTasks.forEach(t => {
      const date = t.completedAt ? new Date(t.completedAt) : new Date(t.dueDate);
      const m = getMonth(date);
      monthCounts[m] = (monthCounts[m] || 0) + 1;
    });
    const bestMonthIndex = Object.keys(monthCounts).length > 0 
        ? parseInt(Object.keys(monthCounts).sort((a, b) => monthCounts[parseInt(b)] - monthCounts[parseInt(a)])[0])
        : new Date().getMonth();
    
    // Best Streak across all habits
    const maxStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;
    const bestHabit = habits.find(h => h.streak === maxStreak);

    // Productivity Level (Fun calculation)
    let levelKey = "lvl.novice";
    if (totalCompleted > 50) levelKey = "lvl.amateur";
    if (totalCompleted > 150) levelKey = "lvl.pro";
    if (totalCompleted > 300) levelKey = "lvl.machine";
    if (totalCompleted > 500) levelKey = "lvl.lord";

    return {
      year: currentYear,
      total: totalCompleted,
      bestCategory,
      bestMonthName: format(new Date(currentYear, bestMonthIndex), 'MMMM', { locale: dateLocale }),
      monthCount: monthCounts[bestMonthIndex] || 0,
      maxStreak,
      bestHabit,
      levelKey
    };
  }, [tasks, habits, categories, dateLocale]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  const nextSlide = () => {
    if (currentSlide < totalSlides - 1) setCurrentSlide(c => c + 1);
    else onClose();
  };

  const prevSlide = () => {
    if (currentSlide > 0) setCurrentSlide(c => c - 1);
  };

  // --- Slides Content ---
  const renderSlide = () => {
    switch (currentSlide) {
      case 0: // Intro
        return (
          <div className="flex flex-col items-center justify-center text-center h-full animate-in zoom-in-95 duration-700">
             <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mb-8 shadow-2xl rotate-12">
                <span className="text-6xl">✨</span>
             </div>
             <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight drop-shadow-md">
                {t('yir.title')} {stats.year}
             </h1>
             <p className="text-xl md:text-2xl text-emerald-100 font-medium max-w-md">
                {t('yir.subtitle')}
             </p>
          </div>
        );
      case 1: // Total Tasks
        return (
          <div className="flex flex-col items-center justify-center text-center h-full animate-in slide-in-from-right duration-500">
             <div className="mb-6 text-emerald-200">
                <Trophy size={80} strokeWidth={1.5} />
             </div>
             <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 uppercase tracking-widest opacity-80">{t('yir.completed_tasks')}</h2>
             <div className="text-[120px] md:text-[180px] font-black text-white leading-none tracking-tighter drop-shadow-lg tabular-nums">
                {stats.total}
             </div>
             <p className="text-lg text-emerald-50 mt-8 max-w-sm px-4">
                {t('yir.completed_desc').replace('{count}', stats.total.toString())}
             </p>
          </div>
        );
      case 2: // Best Category
        return (
          <div className="flex flex-col items-center justify-center text-center h-full animate-in slide-in-from-right duration-500">
             <h2 className="text-2xl font-bold text-white mb-8 opacity-90">{t('yir.main_focus')}</h2>
             
             <div className="relative mb-12">
                <div className="absolute inset-0 bg-white/30 blur-3xl rounded-full"></div>
                <div 
                    className="relative w-48 h-48 md:w-64 md:h-64 rounded-[3rem] flex items-center justify-center shadow-2xl border-4 border-white/20"
                    style={{ backgroundColor: stats.bestCategory?.color || '#10b981' }}
                >
                    <span className="text-6xl md:text-8xl font-black text-white opacity-90">
                        {t(stats.bestCategory?.name || 'yir.misc').charAt(0).toUpperCase()}
                    </span>
                </div>
             </div>
             
             <h3 className="text-4xl md:text-5xl font-black text-white mb-4">
                {t(stats.bestCategory?.name || 'yir.misc')}
             </h3>
             <p className="text-lg text-white/80">
                {t('yir.focus_desc')}
             </p>
          </div>
        );
      case 3: // Best Month
        return (
          <div className="flex flex-col items-center justify-center text-center h-full animate-in slide-in-from-right duration-500">
             <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mb-6 text-orange-200">
                <Flame size={40} />
             </div>
             <h2 className="text-xl font-bold text-white mb-2 uppercase tracking-widest opacity-70">{t('yir.peak_productivity')}</h2>
             <h1 className="text-5xl md:text-7xl font-black text-white mb-6 capitalize text-transparent bg-clip-text bg-gradient-to-r from-orange-200 to-white">
                {stats.bestMonthName}
             </h1>
             <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                 <p className="text-4xl font-bold text-white mb-1">{stats.monthCount}</p>
                 <p className="text-sm text-emerald-100 uppercase tracking-wider font-bold">{t('yir.tasks_done')}</p>
             </div>
             <p className="text-lg text-white/80 mt-8 max-w-sm">
                {t('yir.month_desc')}
             </p>
          </div>
        );
      case 4: // Habits
        return (
          <div className="flex flex-col items-center justify-center text-center h-full animate-in slide-in-from-right duration-500">
             <Target size={64} className="text-white mb-6 opacity-80" />
             <h2 className="text-2xl font-bold text-white mb-10">{t('yir.habit_power')}</h2>
             
             {stats.maxStreak > 0 ? (
                 <>
                    <div className="text-[100px] md:text-[140px] font-black text-white leading-none mb-4 tabular-nums">
                        {stats.maxStreak}
                    </div>
                    <div className="bg-white text-emerald-900 px-6 py-2 rounded-full font-bold text-xl md:text-2xl mb-6 shadow-lg transform -rotate-2">
                        {t('yir.days_streak')}
                    </div>
                    {stats.bestHabit && (
                        <p className="text-xl text-emerald-100 font-medium">
                            {t('yir.in_habit')} <br/> <strong className="text-white text-2xl">"{stats.bestHabit.title}"</strong>
                        </p>
                    )}
                 </>
             ) : (
                 <div className="bg-white/10 p-8 rounded-3xl backdrop-blur-sm">
                    <p className="text-2xl text-white font-bold mb-2">{t('yir.started')}</p>
                    <p className="text-emerald-100">{t('yir.started_desc')}</p>
                 </div>
             )}
          </div>
        );
      case 5: // Summary/Level
        return (
          <div className="flex flex-col items-center justify-center text-center h-full animate-in zoom-in-95 duration-700">
             <Award size={80} className="text-yellow-300 mb-6 drop-shadow-lg" />
             <p className="text-xl text-emerald-100 font-medium mb-4">{t('yir.level')}</p>
             <h1 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight drop-shadow-xl uppercase px-4 leading-tight">
                {t(stats.levelKey)}
             </h1>
             
             <div className="grid grid-cols-2 gap-4 w-full max-w-md px-6">
                 <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                    <div className="text-2xl font-bold text-white">{stats.total}</div>
                    <div className="text-xs text-emerald-200 uppercase">{t('yir.tasks')}</div>
                 </div>
                 <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                    <div className="text-2xl font-bold text-white">{stats.maxStreak}</div>
                    <div className="text-xs text-emerald-200 uppercase">{t('yir.streak')}</div>
                 </div>
             </div>

             <button 
                onClick={onClose}
                className="mt-12 bg-white text-emerald-900 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-50 hover:scale-105 transition-all shadow-xl"
             >
                {t('yir.new_heights')}
             </button>
          </div>
        );
      default:
        return null;
    }
  };

  // --- Backgrounds based on slide ---
  const getBackground = () => {
      const bgs = [
          'bg-gradient-to-br from-emerald-600 to-teal-900', // Intro
          'bg-gradient-to-bl from-blue-600 to-indigo-900', // Tasks
          'bg-gradient-to-tr from-violet-600 to-fuchsia-900', // Category
          'bg-gradient-to-b from-orange-500 to-red-900', // Month
          'bg-gradient-to-br from-pink-600 to-rose-900', // Habits
          'bg-gradient-to-t from-emerald-900 to-emerald-600', // Summary
      ];
      return bgs[currentSlide] || bgs[0];
  };

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col ${getBackground()} transition-colors duration-1000 overflow-hidden`}>
       {/* Progress Bars */}
       <div className="absolute top-0 left-0 right-0 flex gap-1.5 p-4 pt-safe z-20">
          {Array.from({ length: totalSlides }).map((_, i) => (
             <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                <div 
                    className={`h-full bg-white transition-all duration-300 ${i === currentSlide ? 'w-full' : (i < currentSlide ? 'w-full' : 'w-0')}`}
                ></div>
             </div>
          ))}
       </div>

       {/* Close Button */}
       <button 
         onClick={onClose}
         className="absolute top-8 right-4 z-20 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors"
       >
         <X size={24} />
       </button>

       {/* Main Content Area (Clickable) */}
       <div className="flex-1 relative cursor-pointer" onClick={(e) => {
           // Basic tap detection for left/right side
           const width = e.currentTarget.clientWidth;
           const clickX = e.clientX;
           if (clickX < width / 3) prevSlide();
           else nextSlide();
       }}>
          {renderSlide()}
       </div>

       {/* Mobile Helper Text */}
       <div className="absolute bottom-safe pb-6 w-full text-center text-white/30 text-xs font-medium pointer-events-none animate-pulse">
           {t('yir.continue')}
       </div>
    </div>
  );
};