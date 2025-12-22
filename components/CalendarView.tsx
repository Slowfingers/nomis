import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, 
  addWeeks, subWeeks, isToday, getHours, getMinutes, setHours, setMinutes, differenceInMinutes, addMinutes, isFuture, addDays, subDays
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, LayoutList, GripVertical, Inbox, X, Flag, Tag, Check } from 'lucide-react';
import { Task, Priority, Category } from '../types';

interface CalendarViewProps {
  tasks: Task[];
  categories: Category[];
  onDateSelect: (date: Date) => void;
  onUpdateTask?: (task: Task) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks, categories, onDateSelect, onUpdateTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  // Default view depends on screen size (handled in useEffect), but we init with 'week' to match server-side feel
  const [view, setView] = useState<'month' | 'week' | 'day'>('week');
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [resizingTask, setResizingTask] = useState<{task: Task, startY: number, startDuration: number} | null>(null);
  const [isBacklogOpen, setIsBacklogOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Responsive Check
  useEffect(() => {
    const handleResize = () => {
       const mobile = window.innerWidth < 768;
       setIsMobile(mobile);
       // Auto-switch view based on device if user hasn't heavily interacted
       if (mobile && view === 'week') setView('day');
       if (!mobile && view === 'day') setView('week');
       if (mobile) setIsBacklogOpen(false);
    };
    
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Navigation ---
  const next = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };
  
  const prev = () => {
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };
  
  const goToToday = () => setCurrentDate(new Date());

  // --- Data Prep ---
  const monthStart = startOfMonth(currentDate);
  
  // Calculate Start/End based on View
  let startDate: Date, endDate: Date;
  
  if (view === 'month') {
    startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    endDate = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 });
  } else if (view === 'week') {
    startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
    endDate = endOfWeek(startDate, { weekStartsOn: 1 });
  } else {
    // Day View
    startDate = currentDate;
    endDate = currentDate;
  }
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const backlogTasks = tasks.filter(t => !t.isCompleted && (!t.dueDate.includes('T')));

  // --- Drag & Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetDate: Date, targetHour?: number) => {
    e.preventDefault();
    if (!draggedTask || !onUpdateTask) return;

    let newDate = targetDate;
    
    if (targetHour !== undefined) {
      newDate = setHours(newDate, targetHour);
      const currentMin = draggedTask.dueDate.includes('T') ? getMinutes(parseISO(draggedTask.dueDate)) : 0;
      newDate = setMinutes(newDate, currentMin);
    } else {
        if (draggedTask.dueDate.includes('T')) {
            const oldDate = parseISO(draggedTask.dueDate);
            newDate = setHours(newDate, getHours(oldDate));
            newDate = setMinutes(newDate, getMinutes(oldDate));
        }
    }

    const newDueDate = format(newDate, "yyyy-MM-dd" + (draggedTask.dueDate.includes('T') || targetHour !== undefined ? "'T'HH:mm" : ""));
    onUpdateTask({ ...draggedTask, dueDate: newDueDate });
    setDraggedTask(null);
  };

  const handleSlotClick = (day: Date, hour?: number) => {
      let dateToUse = day;
      if (hour !== undefined) {
          dateToUse = setHours(dateToUse, hour);
      }
      onDateSelect(dateToUse);
  }

  // --- Resize (Stretch) Handlers ---
  const handleResizeStart = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingTask({ task, startY: e.clientY, startDuration: task.duration || 60 });
  };

  React.useEffect(() => {
    if (!resizingTask) return;

    const handleMouseUp = (e: MouseEvent) => {
      if (!resizingTask || !onUpdateTask) return;
       const diffY = e.clientY - resizingTask.startY;
       // Mobile grid is taller (80px vs 64px) usually, let's standardize
       const hourHeight = isMobile ? 80 : 64; 
       const pixelsPerMinute = hourHeight / 60; 
       const minutesAdded = diffY / pixelsPerMinute;
       const rawNewDuration = resizingTask.startDuration + minutesAdded;
       const snappedDuration = Math.max(15, Math.round(rawNewDuration / 15) * 15);
       
       onUpdateTask({ ...resizingTask.task, duration: snappedDuration });
       setResizingTask(null);
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingTask, onUpdateTask, isMobile]);


  // --- Render Helpers ---
  const getTasksForDay = (date: Date) => tasks.filter(task => isSameDay(parseISO(task.dueDate), date) && !task.isCompleted);
  const getTimedTasks = (date: Date) => getTasksForDay(date).filter(t => t.dueDate.includes('T'));
  const getAllDayTasks = (date: Date) => getTasksForDay(date).filter(t => !t.dueDate.includes('T'));

  const getCategoryColor = (catId: string) => {
      const cat = categories.find(c => c.id === catId);
      return cat ? cat.color : '#10b981';
  }
  
  const getPriorityIcon = (priority: Priority) => {
    if (priority === Priority.HIGH) return <Flag size={12} className="text-red-500 fill-red-500 flex-shrink-0" />;
    if (priority === Priority.MEDIUM) return <Flag size={12} className="text-yellow-500 fill-yellow-500 flex-shrink-0" />;
    return null;
  };
  
  // Dynamic columns style
  const gridStyle = {
    gridTemplateColumns: view === 'month' 
      ? 'repeat(7, 1fr)' 
      : isMobile 
        ? '1fr' // Single column for mobile day view
        : 'repeat(7, 1fr)' // 7 columns for desktop week
  };

  // Hour height
  const HOUR_HEIGHT = isMobile ? 80 : 64;

  return (
    <div className="flex h-full w-full bg-white overflow-hidden">
      
      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between p-3 md:p-4 border-b border-slate-100 flex-shrink-0 bg-white">
            <div className="flex items-center gap-2 md:gap-4">
            <h2 className="text-lg md:text-xl font-bold text-slate-800 capitalize min-w-[100px] md:min-w-[140px] tracking-tight">
                {format(currentDate, view === 'month' ? 'LLL yyyy' : 'd MMM', { locale: ru })}
            </h2>
            <div className="flex bg-slate-100 rounded-lg p-1">
                <button 
                  onClick={() => setView('month')} 
                  className={`px-2 md:px-3 py-1 md:py-1.5 rounded-md text-xs md:text-sm font-medium transition-all ${view === 'month' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500 hover:text-slate-900'}`}
                >
                Мес
                </button>
                <button 
                  onClick={() => setView(isMobile ? 'day' : 'week')} 
                  className={`px-2 md:px-3 py-1 md:py-1.5 rounded-md text-xs md:text-sm font-medium transition-all ${view !== 'month' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500 hover:text-slate-900'}`}
                >
                {isMobile ? 'День' : 'Неделя'}
                </button>
            </div>
            </div>

            <div className="flex gap-1 md:gap-2">
            <button onClick={goToToday} className="hidden md:block px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors mr-2">
                Сегодня
            </button>
            <button onClick={prev} className="p-1.5 md:p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                <ChevronLeft size={20} />
            </button>
            <button onClick={next} className="p-1.5 md:p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                <ChevronRight size={20} />
            </button>
            <button 
                onClick={() => setIsBacklogOpen(!isBacklogOpen)}
                className={`p-2 rounded-lg ml-2 transition-colors hidden md:block ${isBacklogOpen ? 'bg-emerald-50 text-emerald-600' : 'hover:bg-slate-100 text-slate-400'}`}
                title="Нераспределенные задачи"
            >
                <LayoutList size={20} />
            </button>
            </div>
        </div>

        {/* Calendar Body */}
        <div className="flex-1 overflow-auto bg-white custom-scrollbar relative">
            {view === 'month' ? (
            <div className="min-w-[350px] md:min-w-0 h-full flex flex-col min-h-[500px]">
                <div className="grid grid-cols-7 border-b border-slate-100 sticky top-0 bg-white z-10">
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
                    <div key={d} className="py-3 text-center text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wide">{d}</div>
                ))}
                </div>
                <div className="flex-1 grid grid-cols-7 grid-rows-5 lg:grid-rows-6">
                {days.map((day) => {
                    const dayTasks = getTasksForDay(day);
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    const isDayToday = isToday(day);
                    
                    return (
                    <div 
                        key={day.toISOString()}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, day)}
                        onClick={() => handleSlotClick(day)}
                        className={`border-r border-b border-slate-100 p-1 md:p-1.5 min-h-[60px] md:min-h-[80px] transition-colors hover:bg-slate-50/50 flex flex-col gap-0.5 md:gap-1.5 ${!isCurrentMonth ? 'bg-slate-50/30' : 'bg-white'}`}
                    >
                        <div className={`text-[10px] md:text-xs font-medium w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full ml-auto transition-all ${isDayToday ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' : 'text-slate-500'}`}>
                        {format(day, 'd')}
                        </div>
                        
                        <div className="flex-1 flex flex-col gap-0.5 md:gap-1 overflow-hidden">
                        {dayTasks.slice(0, 4).map(task => {
                            const color = getCategoryColor(task.categoryId);
                            return (
                                <div
                                key={task.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, task)}
                                onClick={(e) => { e.stopPropagation(); onDateSelect(day); }}
                                style={{ borderLeftColor: color, backgroundColor: `${color}10` }}
                                className={`text-[9px] md:text-[10px] truncate px-1 md:px-1.5 py-0.5 md:py-1 rounded-md cursor-move border-l-[3px] text-slate-700 font-medium flex items-center gap-1 hover:bg-slate-50 transition-colors`}
                                >
                                <span className="hidden md:inline">{getPriorityIcon(task.priority)}</span>
                                <span className="w-1.5 h-1.5 rounded-full md:hidden flex-shrink-0" style={{ backgroundColor: color }}></span>
                                <span className="truncate">{task.title}</span>
                                </div>
                            );
                        })}
                        {dayTasks.length > 4 && <div className="text-[9px] text-slate-400 pl-1 font-medium hidden md:block">+ еще {dayTasks.length - 4}</div>}
                        </div>
                    </div>
                    );
                })}
                </div>
            </div>
            ) : (
            /* Time Grid View (Week or Day) */
            <div className="flex flex-col min-w-full bg-white relative">
                
                {/* Header Grid */}
                <div className="flex sticky top-0 bg-white z-30 border-b border-slate-100 shadow-sm">
                    <div className="w-10 md:w-16 border-r border-slate-100 flex-shrink-0"></div>
                    <div className="flex-1 grid" style={gridStyle}>
                      {days.map(day => (
                        <div key={day.toISOString()} className={`py-2 md:py-3 text-center border-r border-slate-100 transition-colors ${isToday(day) ? 'bg-emerald-50/30' : ''}`}>
                            <div className={`text-[9px] md:text-[10px] font-bold uppercase mb-0.5 md:mb-1 tracking-widest ${isToday(day) ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {format(day, 'EEE', { locale: ru })}
                            </div>
                            <div className={`text-base md:text-xl font-light ${isToday(day) ? 'text-emerald-600 font-normal scale-110 inline-block' : 'text-slate-800'}`}>
                            {format(day, 'd')}
                            </div>
                        </div>
                      ))}
                    </div>
                </div>

                {/* All Day Section */}
                <div className="flex border-b border-slate-100">
                    <div className="w-10 md:w-16 border-r border-slate-100 p-1 md:p-2 text-[8px] md:text-[9px] text-slate-400 text-center font-medium flex-shrink-0 pt-2 md:pt-3 uppercase tracking-wider">
                      <span className="md:hidden">весь</span>
                      <span className="hidden md:inline">весь день</span>
                    </div>
                    <div className="flex-1 grid" style={gridStyle}>
                    {days.map(day => {
                        const allDayTasks = getAllDayTasks(day);
                        return (
                            <div 
                                key={day.toISOString()} 
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, day)}
                                onClick={() => handleSlotClick(day)}
                                className="border-r border-slate-100 p-0.5 md:p-1 min-h-[32px] md:min-h-[40px] flex flex-col gap-0.5 md:gap-1 hover:bg-slate-50 transition-colors"
                            >
                            {allDayTasks.map(task => {
                                const color = getCategoryColor(task.categoryId);
                                return (
                                    <div
                                        key={task.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, task)}
                                        style={{ backgroundColor: `${color}15`, color: '#334155', borderLeft: `3px solid ${color}` }}
                                        className={`text-[9px] md:text-[10px] truncate px-1 md:px-2 py-0.5 md:py-1 rounded-sm cursor-move font-medium border border-transparent hover:shadow-sm flex items-center gap-1 transition-all`}
                                    >
                                        <span className="hidden md:inline">{getPriorityIcon(task.priority)}</span>
                                        <span className="truncate">{task.title}</span>
                                    </div>
                                )
                            })}
                            </div>
                        )
                    })}
                    </div>
                </div>

                {/* Main Time Grid Scroll Area */}
                <div className="flex relative">
                    {/* Time Axis */}
                    <div className="w-10 md:w-16 border-r border-slate-100 bg-white z-10 flex-shrink-0">
                    {hours.map(h => (
                        <div key={h} style={{ height: `${HOUR_HEIGHT}px` }} className="border-b border-slate-50 relative">
                            <span className="absolute -top-2 right-1 md:right-2 text-[9px] md:text-[10px] text-slate-400 bg-white px-0.5 md:px-1 font-medium">
                            {h}:00
                            </span>
                        </div>
                    ))}
                    </div>

                    {/* Columns */}
                    <div className="flex-1 grid relative" style={gridStyle}>
                    {days.map(day => {
                        const timedTasks = getTimedTasks(day);
                        
                        // Current time indicator line if today
                        const showCurrentTime = isToday(day);
                        const now = new Date();
                        const currentMin = getHours(now) * 60 + getMinutes(now);
                        const currentTop = (currentMin * HOUR_HEIGHT) / 60;

                        return (
                        <div 
                            key={day.toISOString()} 
                            className="border-r border-slate-100 relative"
                            style={{ height: `${24 * HOUR_HEIGHT}px` }}
                        >
                            {/* Grid Lines */}
                            {hours.map(h => (
                                <div 
                                key={h} 
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, day, h)}
                                onClick={() => handleSlotClick(day, h)}
                                style={{ height: `${HOUR_HEIGHT}px` }}
                                className="border-b border-slate-50 hover:bg-emerald-50/10 transition-colors"
                                ></div>
                            ))}
                            
                            {/* Current Time Line */}
                            {showCurrentTime && (
                                <div 
                                    className="absolute left-0 right-0 border-t-2 border-emerald-500 z-30 pointer-events-none shadow-sm"
                                    style={{ top: `${currentTop}px` }}
                                >
                                    <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white"></div>
                                </div>
                            )}
                            
                            {/* Tasks */}
                            {timedTasks.map(task => {
                                const date = parseISO(task.dueDate);
                                const startMin = getHours(date) * 60 + getMinutes(date);
                                const duration = task.duration || 60;
                                const top = (startMin * HOUR_HEIGHT) / 60;
                                const height = (duration * HOUR_HEIGHT) / 60;
                                const color = getCategoryColor(task.categoryId);
                                const isShort = duration < 30;

                                return (
                                <div
                                    key={task.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, task)}
                                    style={{ 
                                        top: `${top}px`, 
                                        height: `${height}px`,
                                        backgroundColor: `${color}20`,
                                        borderLeftColor: color
                                    }}
                                    className={`absolute left-0.5 right-0.5 md:right-1.5 rounded-md border-l-[3px] md:border-l-4 shadow-sm p-1 md:p-1.5 cursor-move text-xs overflow-hidden group z-10 hover:z-20 border border-slate-100 hover:shadow-lg transition-all flex flex-col`}
                                >
                                    <div className="flex items-center gap-1 min-w-0">
                                        <div className="hidden md:block">{getPriorityIcon(task.priority)}</div>
                                        <div className="font-semibold leading-tight truncate text-slate-700 flex-1 text-[9px] md:text-xs">{task.title}</div>
                                    </div>
                                    
                                    {!isShort && (
                                    <div className="mt-0.5 md:mt-1">
                                        <div className="text-[8px] md:text-[10px] font-medium text-slate-500">{format(date, 'HH:mm')} - {format(addMinutes(date, duration), 'HH:mm')}</div>
                                        {task.tags.length > 0 && (
                                            <div className="flex gap-1 flex-wrap mt-0.5 md:mt-1 hidden md:flex">
                                                {task.tags.slice(0, 3).map(tag => (
                                                <span key={tag} className="bg-white/60 px-1.5 rounded-sm text-[9px] text-slate-600 truncate backdrop-blur-sm">#{tag}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    )}
                                    
                                    {/* Resize Handle */}
                                    <div 
                                    onMouseDown={(e) => handleResizeStart(e, task)}
                                    className="absolute bottom-0 left-0 right-0 h-2 md:h-3 cursor-ns-resize flex justify-center items-end opacity-0 group-hover:opacity-100 hover:bg-black/5"
                                    >
                                    <div className="w-6 md:w-8 h-1 bg-slate-400/50 rounded-full mb-0.5"></div>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                        );
                    })}
                    </div>
                </div>
            </div>
            )}
        </div>
      </div>

      {/* Right Sidebar - Backlog (Desktop Only) */}
      {isBacklogOpen && (
          <div className="w-64 border-l border-slate-100 bg-slate-50/50 flex flex-col transition-all duration-300 hidden md:flex">
             <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0">
                 <h3 className="font-bold text-sm text-slate-700 flex items-center gap-2">
                    <Inbox size={16} className="text-slate-400"/> Нераспределенные
                 </h3>
                 <button onClick={() => setIsBacklogOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={16}/></button>
             </div>
             <div className="p-3 overflow-y-auto flex-1 custom-scrollbar">
                 {backlogTasks.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-40 text-center text-slate-400 text-xs">
                         <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                            <Check size={16} />
                         </div>
                         Все задачи распределены
                     </div>
                 ) : (
                    <div className="space-y-2.5">
                        {backlogTasks.map(task => {
                            const color = getCategoryColor(task.categoryId);
                            return (
                                <div 
                                    key={task.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, task)}
                                    className="bg-white p-3 rounded-xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] border border-slate-100 cursor-move hover:shadow-md hover:border-emerald-200 transition-all group"
                                >
                                    <div className="flex items-start gap-2">
                                        <GripVertical size={14} className="text-slate-300 mt-1 flex-shrink-0 group-hover:text-emerald-500 transition-colors" />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                {getPriorityIcon(task.priority)}
                                                <p className="text-sm font-medium text-slate-700 line-clamp-1">{task.title}</p>
                                            </div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }}></span>
                                                {task.tags.map(t => (
                                                  <span key={t} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">#{t}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                 )}
             </div>
          </div>
      )}

    </div>
  );
};