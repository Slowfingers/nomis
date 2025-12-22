import * as React from 'react';
import { Task, Habit, Category } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart2, CalendarClock, Sun } from 'lucide-react';
import { subDays, isAfter, getDay, format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface AnalyticsProps {
  tasks: Task[];
  habits: Habit[];
  categories: Category[];
}

export const Analytics: React.FC<AnalyticsProps> = ({ tasks, habits, categories }) => {
  // Calculate completion rate
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.isCompleted).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculate tasks completed in the last 7 days
  const last7DaysCount = tasks.filter(t => {
    if (!t.isCompleted) return false;
    // Fallback: If completedAt is missing, check if dueDate is within last 7 days.
    // Ideally, we rely on completedAt.
    const completedDate = t.completedAt ? t.completedAt : (t.dueDate ? new Date(t.dueDate).getTime() : 0);
    return isAfter(completedDate, subDays(new Date(), 7));
  }).length;

  // Calculate best day of the week
  const bestDay = React.useMemo(() => {
    const daysCount = [0, 0, 0, 0, 0, 0, 0]; // 0=Sun, 1=Mon, etc.
    let hasData = false;
    
    tasks.filter(t => t.isCompleted).forEach(t => {
       const d = t.completedAt ? new Date(t.completedAt) : new Date(t.dueDate || t.createdAt);
       const dayIndex = getDay(d);
       daysCount[dayIndex]++;
       hasData = true;
    });

    if (!hasData) return null;

    const maxVal = Math.max(...daysCount);
    if (maxVal === 0) return null;
    
    const maxIndex = daysCount.indexOf(maxVal);
    // Create a dummy date for formatting (e.g., closest upcoming Sunday + maxIndex)
    const dummyDate = new Date();
    const currentDay = dummyDate.getDay();
    const distance = maxIndex - currentDay;
    dummyDate.setDate(dummyDate.getDate() + distance);
    
    return format(dummyDate, 'EEEE', { locale: ru });
  }, [tasks]);


  // Calculate tasks completed per category
  const categoriesData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.filter(t => t.isCompleted).forEach(t => {
      // Find category name or use ID as fallback
      const cat = categories.find(c => c.id === t.categoryId);
      const name = cat ? cat.name : 'Unknown';
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [tasks, categories]);

  // Map category names to their colors for the chart
  const getBarColor = (name: string) => {
      const cat = categories.find(c => c.name === name);
      return cat ? cat.color : '#cbd5e1';
  }

  return (
    <div className="p-2 md:p-6 max-w-5xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Ваша продуктивность</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {/* Card 1: Total Completed */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Всего выполнено</h3>
          <p className="text-4xl font-black text-slate-800 mt-2 tracking-tight">{completedTasks}</p>
        </div>
        
        {/* Card 2: Last 7 Days */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
             <CalendarClock size={12} /> 7 Дней
          </h3>
          <p className="text-4xl font-black text-blue-500 mt-2 tracking-tight">{last7DaysCount}</p>
          <p className="text-slate-400 text-xs font-medium">задач закрыто</p>
        </div>

        {/* Card 3: Best Day */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
             <Sun size={12} /> Лучший день
          </h3>
          <p className="text-2xl font-bold text-slate-800 mt-2 tracking-tight capitalize truncate">
             {bestDay || '—'}
          </p>
        </div>

        {/* Card 4: Best Habit */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Лучшая привычка</h3>
          {habits.length > 0 ? (
            <div>
              <p className="text-lg font-bold text-slate-800 mt-2 truncate leading-tight">
                {habits.sort((a, b) => b.streak - a.streak)[0].title}
              </p>
              <p className="text-orange-500 text-xs mt-1 font-bold">
                🔥 {Math.max(...habits.map(h => h.streak))} дней
              </p>
            </div>
          ) : (
             <p className="text-slate-300 mt-2 font-medium italic text-sm">Нет данных</p>
          )}
        </div>
      </div>

      {/* Completion Rate Bar */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-end mb-2">
             <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Общая эффективность</h3>
             <span className="text-2xl font-black text-emerald-500">{completionRate}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div className="bg-emerald-500 h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: `${completionRate}%` }}></div>
          </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 h-80">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Выполненные задачи по категориям</h3>
        {categoriesData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoriesData}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <Tooltip cursor={{fill: '#f1f5f9', radius: 8}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={48}>
                {categoriesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.name)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-300">
            <BarChart2 size={48} className="mb-4 opacity-50" />
            <span className="font-medium">Нет данных для графика</span>
          </div>
        )}
      </div>
    </div>
  );
};