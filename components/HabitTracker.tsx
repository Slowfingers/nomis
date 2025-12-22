import * as React from 'react';
import { useMemo, useState } from 'react';
import { Plus, Check, Flame, Trophy, Zap, Sprout, TreeDeciduous, Crown, Sparkles, Quote, TrendingUp, X } from 'lucide-react';
import { Habit } from '../types';
import { Button } from './Button';
import { startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';

interface HabitTrackerProps {
  habits: Habit[];
  onAddHabit: (title: string) => void;
  onToggleHabit: (id: string, date: string) => void;
  onDeleteHabit: (id: string) => void;
}

const MOTIVATIONAL_QUOTES = [
  "Маленькие шаги ведут к большим переменам.",
  "Дисциплина — это решение делать то, чего очень не хочется делать, чтобы достичь того, чего очень хочется достичь.",
  "Мы — это то, что мы делаем постоянно.",
  "Успех — это сумма небольших усилий, повторяющихся изо дня в день.",
  "Не ждите вдохновения, станьте дисциплинированным.",
  "Лучшее время посадить дерево было 20 лет назад. Следующее лучшее время — сегодня."
];

const LEVEL_THRESHOLDS = [
  { min: 0, name: 'Семя', icon: Sprout, color: 'text-slate-400', bg: 'bg-slate-50' },
  { min: 7, name: 'Росток', icon: Sprout, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { min: 21, name: 'Деревце', icon: TreeDeciduous, color: 'text-green-600', bg: 'bg-green-50' },
  { min: 66, name: 'Могучий дуб', icon: TreeDeciduous, color: 'text-teal-600', bg: 'bg-teal-50' },
  { min: 100, name: 'Легенда', icon: Crown, color: 'text-amber-500', bg: 'bg-amber-50' },
];

export const HabitTracker: React.FC<HabitTrackerProps> = ({ habits, onAddHabit, onToggleHabit, onDeleteHabit }) => {
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [quoteIndex] = useState(() => Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length));
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newHabitTitle.trim()) {
      onAddHabit(newHabitTitle.trim());
      setNewHabitTitle('');
    }
  };

  // Generate last 7 days for the mini chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const getHabitLevel = (completedCount: number) => {
    return [...LEVEL_THRESHOLDS].reverse().find(l => completedCount >= l.min) || LEVEL_THRESHOLDS[0];
  };

  const getWeeklyProgress = (habit: Habit) => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const end = endOfWeek(new Date(), { weekStartsOn: 1 });
    const completedThisWeek = habit.completedDates.filter(d => {
        const date = parseISO(d);
        return isWithinInterval(date, { start, end });
    }).length;
    return completedThisWeek;
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-2 md:p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Motivation Header */}
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-emerald-200/50 relative overflow-hidden ring-1 ring-white/20">
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 transform translate-x-4 -translate-y-4">
          <Quote size={140} />
        </div>
        <div className="relative z-10 max-w-2xl">
           <div className="flex items-center gap-2 mb-3 opacity-90">
             <Sparkles size={16} className="text-emerald-100" />
             <span className="text-xs font-bold uppercase tracking-widest text-emerald-50">Мудрость дня</span>
           </div>
           <h2 className="text-lg sm:text-xl md:text-3xl font-bold leading-tight mb-4 tracking-tight drop-shadow-sm">
             "{MOTIVATIONAL_QUOTES[quoteIndex]}"
           </h2>
           <p className="text-emerald-100 text-sm font-medium flex items-center gap-2">
             <div className="w-8 h-0.5 bg-emerald-200/50 rounded-full"></div>
             Продолжай расти
           </p>
        </div>
      </div>

      <div className="flex justify-between items-center px-1">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Zap className="text-amber-500 fill-amber-500" size={20}/>
            Мои привычки
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3 bg-white p-2 sm:p-2.5 md:p-3 rounded-2xl shadow-lg shadow-slate-100 border border-slate-100 transition-all focus-within:ring-2 focus-within:ring-emerald-100 focus-within:border-emerald-200">
        <input
          type="text"
          value={newHabitTitle}
          onChange={(e) => setNewHabitTitle(e.target.value)}
          placeholder="Например: Читать 15 минут..."
          className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 placeholder-slate-400 text-sm sm:text-base md:text-lg px-2 sm:px-3 md:px-4 min-w-0"
        />
        <Button type="submit" disabled={!newHabitTitle} className="rounded-xl shadow-none bg-emerald-600 hover:bg-emerald-700 flex-shrink-0 px-3 sm:px-4">
          <Plus size={18} className="sm:mr-1" /> <span className="hidden sm:inline">Создать</span>
        </Button>
      </form>

      <div className="grid gap-5">
        {habits.length === 0 && (
          <div className="text-center py-16 text-slate-400 bg-white rounded-3xl border border-slate-100 border-dashed">
            <Sprout size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-medium">Ваш сад пуст</p>
            <p className="text-sm">Посадите первую привычку, чтобы начать рост.</p>
          </div>
        )}
        
        {habits.map((habit) => {
          const isDoneToday = habit.completedDates.includes(today);
          const totalCompletions = habit.completedDates.length;
          const level = getHabitLevel(totalCompletions);
          const LevelIcon = level.icon;
          const weeklyProgress = getWeeklyProgress(habit);
          const weeklyGoal = habit.goalPerWeek || 7;
          const progressPercent = Math.min(100, (weeklyProgress / weeklyGoal) * 100);

          return (
            <div key={habit.id} className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-100 flex flex-col gap-6 transition-all hover:shadow-xl hover:translate-y-[-2px] relative group">
              
              {/* Desktop Delete Button */}
              <button 
                onClick={() => onDeleteHabit(habit.id)}
                className="hidden md:flex absolute -top-3 -right-3 w-8 h-8 bg-white border border-slate-100 rounded-full items-center justify-center text-slate-300 hover:text-red-500 hover:border-red-100 shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10"
                title="Удалить привычку"
              >
                <X size={14} />
              </button>

              <div className="flex flex-col md:flex-row md:items-center gap-5 w-full">
                {/* Main Action Area */}
                <div className="flex items-center gap-5 flex-1">
                    <button
                    onClick={() => onToggleHabit(habit.id, today)}
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 group relative overflow-hidden ${
                        isDoneToday 
                        ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-200 scale-105' 
                        : 'bg-slate-50 text-slate-300 hover:bg-emerald-50 hover:text-emerald-400 border-2 border-slate-100 hover:border-emerald-200'
                    }`}
                    >
                    <Check size={32} strokeWidth={3} className={`transition-transform duration-300 ${isDoneToday ? 'scale-100' : 'scale-90'}`} />
                    {isDoneToday && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg sm:text-xl text-slate-800 truncate">{habit.title}</h3>
                            <div className={`hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${level.bg} ${level.color}`}>
                                <LevelIcon size={12} />
                                {level.name}
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                            <div className="flex items-center text-orange-500 font-bold bg-orange-50 px-1.5 sm:px-2 py-0.5 rounded-lg">
                                <Flame size={12} className="mr-1 sm:mr-1.5 fill-current" />
                                {habit.streak} дней
                            </div>
                            <div className="text-slate-400 font-medium flex items-center gap-1">
                                <Trophy size={12} />
                                Всего: {totalCompletions}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side Stats */}
                <div className="flex flex-row md:flex-col items-center md:items-end gap-3 sm:gap-4 md:gap-2 pl-3 sm:pl-4 md:pl-0 border-l md:border-l-0 border-slate-100">
                    
                    {/* Weekly Progress Bar */}
                    <div className="flex-1 md:w-32 min-w-0">
                        <div className="flex justify-between text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            <span>Неделя</span>
                            <span>{weeklyProgress}/{weeklyGoal}</span>
                        </div>
                        <div className="h-1.5 sm:h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-emerald-500 rounded-full transition-all duration-500 shadow-sm shadow-emerald-200" 
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Mini Heatmap (Desktop Only mainly) */}
                    <div className="hidden md:flex items-center gap-1 mt-2">
                        {last7Days.map((date) => {
                            const isDone = habit.completedDates.includes(date);
                            const dayLabel = new Date(date).toLocaleDateString('ru-RU', { weekday: 'short' });
                            return (
                                <div key={date} className="flex flex-col items-center gap-1">
                                    <div 
                                        className={`w-1.5 h-1.5 rounded-full ${date === today ? 'bg-emerald-500' : 'bg-transparent'}`}
                                    />
                                    <div 
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${
                                        isDone ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-300'
                                        }`}
                                        title={date}
                                    >
                                        {dayLabel[0].toUpperCase()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
              </div>

              {/* Mobile Level Badge (shown below on small screens) */}
              <div className="sm:hidden flex items-center justify-between pt-4 border-t border-slate-50">
                   <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${level.bg} ${level.color}`}>
                        <LevelIcon size={14} />
                        {level.name}
                    </div>
                    <button 
                        onClick={() => onDeleteHabit(habit.id)}
                        className="text-slate-300 hover:text-red-500 text-xs px-2 py-1 transition-colors"
                    >
                        Удалить
                    </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};