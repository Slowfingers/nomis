import * as React from 'react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Calendar, CheckSquare, List, Clock, AlertCircle, 
  Target, BarChart2, Plus, Trash2, CalendarDays, CalendarClock,
  ChevronRight, ChevronDown, Check, RefreshCcw, Search, Grid, Layout,
  Tag, Palette, FolderPlus, X, Settings2, Pencil, Menu, MoreHorizontal, ArrowLeft,
  CornerDownLeft, LogOut, XCircle, Sparkles, Languages, Smartphone
} from 'lucide-react';
import { format, isToday, isTomorrow, isPast, isSameDay, parseISO, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isFuture, isThisWeek } from 'date-fns';
import { ru, enUS, uz } from 'date-fns/locale';
import { Task, Category, Priority, Habit, ViewMode, Repeat, Subtask } from './types';
import { Button } from './components/Button';
import { HabitTracker } from './components/HabitTracker';
import { FocusMode } from './components/FocusMode';
import { Analytics } from './components/Analytics';
import { CalendarView } from './components/CalendarView';
import { YearInReview } from './components/YearInReview';
import { useAuth } from './contexts/AuthContext';
import { LoginScreen } from './components/LoginScreen';
import { NetworkStatus } from './components/NetworkStatus';
import { InstallGuide } from './components/InstallGuide';
import { useLanguage } from './contexts/LanguageContext';
import { UzbekPattern } from './components/UzbekPattern';
import { loadData, saveData, exportData, importData, STORAGE_KEYS } from './utils/dataManager';
import { useDataSync } from './hooks/useDataSync';
import { AppData } from './utils/dataManager';

// --- Default Data ---
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'personal', name: 'cat.personal', color: '#10b981', type: 'system' }, // Emerald
  { id: 'work', name: 'cat.work', color: '#3b82f6', type: 'system' }, // Blue
  { id: 'sport', name: 'cat.sport', color: '#f59e0b', type: 'system' }, // Amber
  { id: 'study', name: 'cat.study', color: '#8b5cf6', type: 'system' }, // Violet
  { id: 'shopping', name: 'cat.shopping', color: '#ec4899', type: 'system' }, // Pink
];

// --- Helpers ---
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const playCompletionSound = () => {
  const audio = new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3');
  audio.volume = 0.5;
  audio.play().catch(() => {});
};

// Helper Components extracted from App
interface SidebarItemProps {
  icon?: any;
  label: string;
  id: string;
  count: number;
  color?: string; // Hex or tailwind class
  isActive: boolean;
  onClick: (id: any) => void;
  isCategory?: boolean;
  onEdit?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, id, count, color, isActive, onClick, isCategory, onEdit }) => (
  <button 
    onClick={() => onClick(id)}
    className={`w-full group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive 
      ? 'bg-emerald-50/80 text-emerald-800 shadow-sm ring-1 ring-emerald-100' 
      : 'text-slate-600 hover:bg-slate-100/80 hover:pl-4 hover:text-slate-900'
    }`}
  >
    <div className="flex items-center gap-3 truncate min-w-0 flex-1">
      {isCategory ? (
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-4 ring-transparent group-hover:ring-gray-100 transition-all" style={{ backgroundColor: color }}></span>
      ) : (
        Icon && <Icon size={20} className={isActive ? "text-emerald-600" : (color || "text-slate-400 group-hover:text-slate-600")} />
      )}
      <span className="truncate tracking-wide">{label}</span>
    </div>
    
    <div className="flex items-center gap-1">
      {onEdit && (
         <div 
          role="button"
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="opacity-0 group-hover:opacity-100 md:opacity-0 p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
         >
           <Settings2 size={14} />
         </div>
      )}
      {count > 0 && (
        <span className={`text-[10px] px-2 py-0.5 rounded-md flex-shrink-0 font-bold ${id === 'overdue' ? 'bg-red-50 text-red-600' : (isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')}`}>
          {count}
        </span>
      )}
    </div>
  </button>
);

interface TaskRowProps {
  task: Task;
  category?: Category;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onTagClick: (tag: string) => void;
  t: (key: string) => string;
  locale: any;
}

const TaskRow: React.FC<TaskRowProps> = ({ task, category, onToggle, onEdit, onDelete, onTagClick, t, locale }) => {
  const [expanded, setExpanded] = useState(false);
  const dateObj = parseISO(task.dueDate);
  const hasTime = task.dueDate.includes('T');
  
  return (
    <div className={`group bg-white rounded-2xl border border-slate-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.06)] hover:border-emerald-100/50 transition-all duration-300 mb-3 overflow-hidden ${task.isCompleted ? 'opacity-60 grayscale-[0.5]' : ''}`}>
      <div className="p-4 flex items-start gap-3.5">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (!task.isCompleted) playCompletionSound();
            onToggle(task.id);
          }}
          className={`mt-0.5 w-6 h-6 rounded-[0.5rem] border-2 flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
            task.isCompleted 
              ? 'bg-emerald-500 border-emerald-500 text-white scale-100' 
              : `border-slate-300 hover:border-emerald-500 bg-white hover:bg-emerald-50 ${task.priority === Priority.HIGH ? 'border-red-300' : ''}`
          }`}
        >
          <Check size={14} strokeWidth={3} className={`transition-transform duration-300 ${task.isCompleted ? 'scale-100' : 'scale-0'}`} />
        </button>
        
        <div className="flex-1 cursor-pointer overflow-hidden min-w-0" onClick={() => setExpanded(!expanded)}>
           <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-medium text-slate-800 text-sm sm:text-base break-words transition-all ${task.isCompleted ? 'line-through text-slate-400' : ''}`}>
                {task.title}
              </span>
              {task.priority === Priority.HIGH && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 animate-pulse" title={t('prio.high')}></span>}
              {task.repeat !== Repeat.NONE && <RefreshCcw size={12} className="text-slate-400 flex-shrink-0" />}
           </div>
           
           <div className="flex flex-wrap gap-2 mt-2">
              {task.tags.map(tag => (
                <span 
                  key={tag} 
                  onClick={(e) => { e.stopPropagation(); onTagClick(tag); }}
                  className="text-[10px] px-2 py-0.5 bg-white border border-slate-200 text-slate-500 hover:text-emerald-700 hover:border-emerald-300 rounded-md flex items-center transition-all cursor-pointer font-medium tracking-wide shadow-sm"
                >
                  #{tag}
                </span>
              ))}
           </div>

           <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-400 mt-2.5 font-medium flex-wrap">
              <span className={`${isPast(dateObj) && !task.isCompleted && !isToday(dateObj) ? 'text-red-500 font-bold bg-red-50 px-1.5 py-0.5 rounded' : 'flex items-center gap-1'}`}>
                 <Calendar size={11} className="inline mr-0.5" />
                 {format(dateObj, hasTime ? 'd MMM HH:mm' : 'd MMM', { locale })}
              </span>
              
              {category && (
                 <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-50 border border-slate-100/50 max-w-[100px] sm:max-w-[120px] truncate">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }}></span>
                    <span className="truncate text-[10px] sm:text-xs">{t(category.name)}</span>
                 </span>
              )}
              
              {task.subtasks.length > 0 && (
                 <span className="bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100/50 text-[10px] sm:text-xs">
                   {task.subtasks.filter(s => s.isCompleted).length}/{task.subtasks.length}
                 </span>
              )}
           </div>
        </div>

        {/* Action Button - Edit */}
        <div className="flex flex-col gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200 md:translate-x-2 md:group-hover:translate-x-0">
          <button onClick={(e) => { e.stopPropagation(); onEdit(task); }} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
             <List size={18} />
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="bg-slate-50/50 px-4 py-4 border-t border-slate-100">
           {task.description && <p className="text-sm text-slate-600 mb-4 whitespace-pre-line leading-relaxed">{task.description}</p>}
           
           {task.subtasks.length > 0 && (
             <div className="space-y-2 pl-1">
               {task.subtasks.map((st, idx) => (
                 <div key={st.id} className="flex items-center gap-3 text-sm text-slate-700 bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                   <div 
                      onClick={(e) => { e.stopPropagation(); }}
                      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${st.isCompleted ? 'bg-emerald-400 border-emerald-400' : 'border-slate-300'}`}
                   >
                      {st.isCompleted && <Check size={10} className="text-white"/>}
                   </div>
                   <span className={st.isCompleted ? 'line-through text-slate-400' : ''}>{st.title}</span>
                 </div>
               ))}
             </div>
           )}
           
           <div className="flex justify-end pt-2 mt-2">
              <button 
                type="button"
                onClick={(e) => { 
                    e.stopPropagation();
                    onDelete(task.id);
                }}
                className="text-red-500 text-xs flex items-center gap-1.5 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors font-bold border border-transparent hover:border-red-100 cursor-pointer active:scale-95 select-none"
              >
                <Trash2 size={14} /> {t('task.delete')}
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

// Time Roulette Component
const TimeRoulette: React.FC<{ 
  selectedTime: string, 
  onSelect: (time: string) => void,
  onClose: () => void 
}> = ({ selectedTime, onSelect, onClose }) => {
  const [hour, setHour] = useState(selectedTime ? parseInt(selectedTime.split(':')[0]) : 9);
  const [minute, setMinute] = useState(selectedTime ? parseInt(selectedTime.split(':')[1]) : 0);
  
  // Helper to ensure scroll position centers the selected item
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, 10...

  return (
    <div className="absolute top-12 right-0 z-50 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 w-64 animate-in fade-in zoom-in-95 origin-top-right">
       <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Выбор времени</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><XCircle size={16}/></button>
       </div>
       
       <div className="flex gap-2 h-40 relative">
          {/* Selection Highlight Bar */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-10 bg-emerald-50 rounded-lg pointer-events-none border border-emerald-100/50"></div>

          {/* Hours Column */}
          <div className="flex-1 overflow-y-auto no-scrollbar snap-y snap-mandatory py-[60px] text-center"
               onScroll={(e) => {
                  const el = e.currentTarget;
                  const index = Math.round(el.scrollTop / 40);
                  if (hours[index] !== undefined && hours[index] !== hour) setHour(hours[index]);
               }}
          >
             {hours.map(h => (
               <div 
                 key={h} 
                 onClick={() => { setHour(h); }}
                 className={`h-10 flex items-center justify-center snap-center cursor-pointer transition-all ${hour === h ? 'text-xl font-bold text-emerald-600' : 'text-slate-400 text-sm'}`}
               >
                 {h.toString().padStart(2, '0')}
               </div>
             ))}
          </div>

          <div className="flex items-center justify-center font-bold text-slate-300 pb-1">:</div>

          {/* Minutes Column */}
          <div className="flex-1 overflow-y-auto no-scrollbar snap-y snap-mandatory py-[60px] text-center"
               onScroll={(e) => {
                  const el = e.currentTarget;
                  const index = Math.round(el.scrollTop / 40);
                  if (minutes[index] !== undefined && minutes[index] !== minute) setMinute(minutes[index]);
               }}
          >
             {minutes.map(m => (
               <div 
                 key={m} 
                 onClick={() => { setMinute(m); }}
                 className={`h-10 flex items-center justify-center snap-center cursor-pointer transition-all ${minute === m ? 'text-xl font-bold text-emerald-600' : 'text-slate-400 text-sm'}`}
               >
                 {m.toString().padStart(2, '0')}
               </div>
             ))}
          </div>
       </div>
       
       <Button 
          size="sm" 
          className="w-full mt-3 rounded-lg"
          onClick={() => {
            const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            onSelect(timeStr);
            onClose();
          }}
       >
         Установить {hour.toString().padStart(2, '0')}:{minute.toString().padStart(2, '0')}
       </Button>
    </div>
  );
}

const QuickAddInput: React.FC<{ onAdd: (title: string, time?: string) => void, t: (key: string) => string }> = ({ onAdd, t }) => {
  const [value, setValue] = useState('');
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsTimePickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      onAdd(value.trim(), selectedTime || undefined);
      setValue('');
      setSelectedTime(null);
      setIsTimePickerOpen(false);
    }
  };

  const handleAddClick = () => {
    if(value.trim()) { 
      onAdd(value.trim(), selectedTime || undefined); 
      setValue('');
      setSelectedTime(null);
      setIsTimePickerOpen(false);
    }
  };

  return (
    <div className="relative group mb-6 animate-in fade-in slide-in-from-top-4 duration-500 z-30" ref={containerRef}>
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
         <Plus className="text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
      </div>
      <input 
        type="text"
        className="block w-full pl-11 pr-24 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium"
        placeholder={t('task.quick_add')}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      
      {/* Right side actions */}
      <div className="absolute inset-y-0 right-2 flex items-center gap-1">
         {/* Time Picker Button */}
         <button 
           onClick={() => setIsTimePickerOpen(!isTimePickerOpen)}
           className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold ${
             selectedTime 
               ? 'bg-emerald-100 text-emerald-700' 
               : 'text-slate-300 hover:text-emerald-500 hover:bg-slate-50'
           }`}
           title="Выбрать время"
         >
           <Clock size={16} strokeWidth={2.5}/>
           {selectedTime && <span>{selectedTime}</span>}
         </button>

         {/* Enter Button */}
         <button 
            onClick={handleAddClick}
            className="p-1.5 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
         >
           <CornerDownLeft size={16} strokeWidth={2.5}/>
         </button>
      </div>

      {/* Time Picker Popover */}
      {isTimePickerOpen && (
        <TimeRoulette 
          selectedTime={selectedTime || ''} 
          onSelect={setSelectedTime}
          onClose={() => setIsTimePickerOpen(false)}
        />
      )}
    </div>
  );
};

export const App = () => {
  // Auth & Language
  const { user, logout, isLoading: isAuthLoading, useFirebase } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  // State with versioned storage
  const [tasks, setTasks] = useState<Task[]>(() => {
    return loadData<Task[]>(STORAGE_KEYS.TASKS, []);
  });
  const [categories, setCategories] = useState<Category[]>(() => {
    return loadData<Category[]>(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
  });
  const [habits, setHabits] = useState<Habit[]>(() => {
    return loadData<Habit[]>(STORAGE_KEYS.HABITS, []);
  });
  const [viewMode, setViewMode] = useState<ViewMode | string>('today');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // UI State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false); // Mobile search toggle
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isYearReviewOpen, setIsYearReviewOpen] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  
  // Category Editing State
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // Persist State with versioning
  useEffect(() => {
    saveData(STORAGE_KEYS.TASKS, tasks);
  }, [tasks]);

  useEffect(() => {
    saveData(STORAGE_KEYS.HABITS, habits);
  }, [habits]);

  useEffect(() => {
    saveData(STORAGE_KEYS.CATEGORIES, categories);
  }, [categories]);

  // Cloud sync
  const handleDataLoaded = (data: AppData) => {
    setTasks(data.tasks);
    setCategories(data.categories);
    setHabits(data.habits);
  };

  const { syncToCloud } = useDataSync({
    userId: user?.id || null,
    useFirebase,
    tasks,
    categories,
    habits,
    onDataLoaded: handleDataLoaded,
  });

  // Export/Import handlers
  const handleExport = () => {
    exportData(tasks, categories, habits);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await importData(file);
      if (window.confirm('Импортировать данные? Это заменит текущие данные.')) {
        setTasks(data.tasks);
        setCategories(data.categories);
        setHabits(data.habits);
        alert('Данные успешно импортированы!');
      }
    } catch (error) {
      alert('Ошибка импорта: ' + (error as Error).message);
    }
    event.target.value = '';
  };

  // Locale object for date-fns
  const dateLocale = language === 'ru' ? ru : language === 'uz' ? uz : enUS;

  // Derived State
  const filteredTasks = useMemo(() => {
    let processedTasks = tasks;
    
    // 1. Search Filter - GLOBAL MODE
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      // When searching, we search across ALL tasks (completed or not, any date)
      processedTasks = processedTasks.filter(t => 
        t.title.toLowerCase().includes(lowerQuery) || 
        t.description?.toLowerCase().includes(lowerQuery) ||
        t.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
        t.subtasks.some(st => st.title.toLowerCase().includes(lowerQuery))
      );
      
      // Return search results without applying View filters
      return processedTasks.sort((a, b) => {
          if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
          const pMap = { [Priority.HIGH]: 3, [Priority.MEDIUM]: 2, [Priority.LOW]: 1 };
          return pMap[b.priority] - pMap[a.priority];
      });
    }

    // 2. View Mode Filter (Normal operation)
    processedTasks = processedTasks.filter(task => {
      const taskDate = parseISO(task.dueDate);
      
      if (['calendar', 'habits', 'focus', 'analytics'].includes(viewMode)) return true;
      
      const isCategoryView = categories.some(c => c.id === viewMode);
      if (isCategoryView) {
        return task.categoryId === viewMode && (!task.isCompleted || viewMode === 'all');
      }

      if (task.isCompleted && viewMode !== 'all') return false;

      switch (viewMode) {
        case 'today': return isToday(taskDate);
        case 'upcoming': return isFuture(taskDate) && !isToday(taskDate);
        case 'overdue': return isPast(taskDate) && !isToday(taskDate) && !task.isCompleted;
        case 'all': return true;
        default: return true;
      }
    });

    return processedTasks.sort((a, b) => {
        if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
        const pMap = { [Priority.HIGH]: 3, [Priority.MEDIUM]: 2, [Priority.LOW]: 1 };
        return pMap[b.priority] - pMap[a.priority];
    });
  }, [tasks, viewMode, searchQuery, categories]);

  // Sections Logic for Grouped Views
  const taskSections = useMemo(() => {
    // If searching, show a simple flat list title
    if (searchQuery.trim()) {
        return [{ title: t('task.search'), tasks: filteredTasks }];
    }

    if (['calendar', 'habits', 'focus', 'analytics', 'today', 'overdue'].includes(viewMode)) {
        // No grouping for these modes, return simple list wrapped in one group
        return [{ title: null, tasks: filteredTasks }];
    }

    const groups: Record<string, Task[]> = {};
    const order: string[] = [];

    // Grouping for "Upcoming" or "All" or Category views
    filteredTasks.forEach(task => {
        const d = parseISO(task.dueDate);
        let key = 'No Date';
        let sortKey = 9999999999999;

        if (task.dueDate) {
            if (isPast(d) && !isToday(d)) {
                key = t('sidebar.overdue');
                sortKey = 0;
            }
            else if (isToday(d)) {
                key = t('sidebar.today');
                sortKey = 1;
            }
            else if (isTomorrow(d)) {
                key = format(d, 'EEEE', { locale: dateLocale }); // Tomorrow -> Day Name
                // Capitalize
                key = key.charAt(0).toUpperCase() + key.slice(1); 
                sortKey = 2;
            }
            else if (isThisWeek(d, { weekStartsOn: 1 })) {
                key = format(d, 'EEEE', { locale: dateLocale });
                key = key.charAt(0).toUpperCase() + key.slice(1) + ` · ${format(d, 'd MMM', { locale: dateLocale })}`;
                sortKey = d.getTime();
            }
            else if (isFuture(d)) {
                key = format(d, 'd MMM · EEEE', { locale: dateLocale });
                sortKey = d.getTime();
            }
        }

        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(task);
    });
    
    const sortedKeys = Object.keys(groups).sort((a, b) => {
        const getRank = (k: string) => {
            if (k === t('sidebar.overdue')) return 0;
            if (k === t('sidebar.today')) return 1;
            return 3; 
        };
        // Very basic sorting, mostly relies on 'upcoming' view specific sort below
        return getRank(a) - getRank(b);
    });

    // Special sorting for upcoming dates to ensure chronological order
    if (viewMode === 'upcoming') {
         sortedKeys.sort((a, b) => {
             const tA = groups[a][0];
             const tB = groups[b][0];
             return new Date(tA.dueDate).getTime() - new Date(tB.dueDate).getTime();
         });
    }

    return sortedKeys.map(k => ({ title: k, tasks: groups[k] }));
  }, [filteredTasks, viewMode, searchQuery, language]);


  const overdueCount = tasks.filter(t => isPast(parseISO(t.dueDate)) && !isToday(parseISO(t.dueDate)) && !t.isCompleted).length;

  // Handlers
  const addTask = (task: Task) => {
    setTasks(prev => [...prev, task]);
    setIsModalOpen(false);
    setEditingTask(null);
  };
  
  const handleQuickAdd = (title: string, time?: string) => {
      const today = new Date();
      let dueDate = format(today, 'yyyy-MM-dd');
      
      // Smart-ish date defaults
      if (viewMode === 'upcoming') dueDate = format(addDays(today, 1), 'yyyy-MM-dd');
      if (viewMode === 'all') dueDate = ''; // Inbox style
      if (categories.some(c => c.id === viewMode)) {
           // Keep today default for lists unless specified
      }

      // Append time if selected
      if (time && dueDate) {
        dueDate = `${dueDate}T${time}`;
      } else if (time && !dueDate) {
        // Fallback if no date but time set (implies today)
        dueDate = `${format(today, 'yyyy-MM-dd')}T${time}`;
      }

      const newTask: Task = {
        id: generateId(),
        title,
        dueDate,
        priority: Priority.MEDIUM,
        categoryId: categories.some(c => c.id === viewMode) ? viewMode : 'personal',
        tags: [],
        subtasks: [],
        isCompleted: false,
        repeat: Repeat.NONE,
        createdAt: Date.now()
      };
      addTask(newTask);
  };

  const updateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const toggleTaskCompletion = (taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;

      const newStatus = !t.isCompleted;
      
      if (newStatus && t.repeat !== Repeat.NONE) {
        const nextDate = t.repeat === Repeat.DAILY 
          ? addDays(parseISO(t.dueDate), 1) 
          : addDays(parseISO(t.dueDate), 7);
        
        const nextTask: Task = {
          ...t,
          id: generateId(),
          dueDate: nextDate.toISOString().split('T')[0],
          isCompleted: false,
          subtasks: t.subtasks.map(st => ({ ...st, isCompleted: false }))
        };
        
        setTimeout(() => setTasks(current => [...current, nextTask]), 300);
        return { ...t, isCompleted: true, completedAt: Date.now() };
      }

      return { ...t, isCompleted: newStatus, completedAt: newStatus ? Date.now() : undefined };
    }));
  };

  const deleteTask = (taskId: string) => {
    // Removed confirmation for "easier to learn" and to ensure it works
    setTasks(prev => prev.filter(t => t.id !== taskId));
    if (editingTask && editingTask.id === taskId) {
      setIsModalOpen(false);
      setEditingTask(null);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleMoveOverdueToToday = () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    setTasks(prev => prev.map(t => {
      if (isPast(parseISO(t.dueDate)) && !isToday(parseISO(t.dueDate)) && !t.isCompleted) {
        return { ...t, dueDate: todayStr };
      }
      return t;
    }));
  };

  const handleDateSelect = (date: Date) => {
      setEditingTask({
        id: '',
        title: '',
        dueDate: format(date, "yyyy-MM-dd'T'HH:mm"),
        priority: Priority.MEDIUM,
        categoryId: 'personal',
        tags: [],
        subtasks: [],
        isCompleted: false,
        repeat: Repeat.NONE,
        createdAt: Date.now(),
        duration: 60
      });
      setIsModalOpen(true);
  };

  const updateCategory = (id: string, name: string, color: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name, color } : c));
    setEditingCategory(null);
  };

  const deleteCategory = (id: string) => {
    // Direct deletion without confirmation
    setCategories(prev => prev.filter(c => c.id !== id));
    setTasks(prev => prev.map(t => t.categoryId === id ? { ...t, categoryId: 'personal' } : t));
    if (viewMode === id) setViewMode('today');
    setEditingCategory(null);
  };

  const addHabit = (title: string) => {
    const newHabit: Habit = {
      id: generateId(),
      title,
      streak: 0,
      completedDates: [],
      goalPerWeek: 7
    };
    setHabits(prev => [...prev, newHabit]);
  };

  const toggleHabit = (id: string, date: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id !== id) return h;
      
      const exists = h.completedDates.includes(date);
      let newDates = exists 
        ? h.completedDates.filter(d => d !== date)
        : [...h.completedDates, date];
      
      newDates.sort();
      let streak = newDates.length; 

      return { ...h, completedDates: newDates, streak };
    }));
  };

  const deleteHabit = (id: string) => {
      setHabits(prev => prev.filter(h => h.id !== id));
  }

  // Auth Loading State
  if (isAuthLoading) {
    return <div className="flex items-center justify-center h-screen bg-[#f8fafc] text-emerald-600">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
    </div>;
  }

  // Login Gate
  if (!user) {
    return <LoginScreen />;
  }

  // --- Components ---

  const CategoryEditModal = () => {
    if (!editingCategory) return null;
    const [name, setName] = useState(editingCategory.name);
    const [color, setColor] = useState(editingCategory.color);

    return (
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-[70] p-0 sm:p-4 transition-opacity"
        onClick={(e) => {
            if (e.target === e.currentTarget) setEditingCategory(null);
        }}
      >
         <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 ring-1 ring-slate-100 pb-safe sm:pb-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">{t('task.edit_title')}</h3>
            <input 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-emerald-100 outline-none text-sm focus:border-emerald-500 transition-all"
              placeholder={t('task.category')}
            />
            <div className="flex items-center gap-4 mb-8">
              <label className="text-sm font-medium text-slate-600">{t('task.category')} Color:</label>
              <input 
                type="color" 
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-12 h-12 rounded-xl cursor-pointer border-0 p-1 bg-slate-100"
              />
            </div>
            <div className="flex justify-between items-center">
               <button 
                onClick={() => deleteCategory(editingCategory.id)}
                className="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-2"
               >
                 {t('task.delete')}
               </button>
               <div className="flex gap-2">
                 <Button variant="ghost" onClick={() => setEditingCategory(null)} size="sm">{t('task.cancel')}</Button>
                 <Button onClick={() => updateCategory(editingCategory.id, name, color)} size="sm">{t('task.save')}</Button>
               </div>
            </div>
         </div>
      </div>
    );
  }

  const TaskModal = () => {
    const [title, setTitle] = useState(editingTask?.title || '');
    const [desc, setDesc] = useState(editingTask?.description || '');
    const initialDate = editingTask?.dueDate ? editingTask.dueDate.split('T')[0] : format(new Date(), 'yyyy-MM-dd');
    const initialTime = editingTask?.dueDate && editingTask.dueDate.includes('T') ? editingTask.dueDate.split('T')[1].substring(0, 5) : '';
    const [date, setDate] = useState(initialDate);
    const [time, setTime] = useState(initialTime);
    const [prio, setPrio] = useState<Priority>(editingTask?.priority || Priority.MEDIUM);
    const [catId, setCatId] = useState<string>(editingTask?.categoryId || categories[0]?.id || 'personal');
    const [rpt, setRpt] = useState<Repeat>(editingTask?.repeat || Repeat.NONE);
    const [subs, setSubs] = useState<Subtask[]>(editingTask?.subtasks || []);
    const [tags, setTags] = useState<string[]>(editingTask?.tags || []);
    const [newTag, setNewTag] = useState('');
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [newCatColor, setNewCatColor] = useState('#10b981');
    const [showError, setShowError] = useState(false);

    const handleAddTag = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && newTag.trim()) {
        e.preventDefault();
        const tag = newTag.trim().replace(/^#/, '');
        if (!tags.includes(tag)) {
          setTags([...tags, tag]);
        }
        setNewTag('');
      }
    };

    const handleCreateCategory = () => {
      if (newCatName.trim()) {
        const newCat: Category = {
          id: generateId(),
          name: newCatName.trim(),
          color: newCatColor,
          type: 'user'
        };
        setCategories([...categories, newCat]);
        setCatId(newCat.id);
        setIsAddingCategory(false);
      }
    };

    const handleSave = () => {
      if (!title.trim()) {
        setShowError(true);
        return;
      }
      let finalDate = date;
      if (time) finalDate = `${date}T${time}`;

      const taskData: Task = {
        id: editingTask?.id || generateId(),
        title,
        description: desc,
        dueDate: finalDate,
        duration: editingTask?.duration || (time ? 60 : undefined),
        priority: prio,
        categoryId: catId,
        tags,
        subtasks: subs,
        isCompleted: editingTask?.isCompleted || false,
        repeat: rpt,
        createdAt: editingTask?.createdAt || Date.now()
      };
      
      editingTask ? updateTask(taskData) : addTask(taskData);
    };

    return (
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-[70] p-0 sm:p-4 transition-opacity"
        onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
        }}
      >
        {/* Modal Container: Bottom sheet on mobile, centered card on desktop */}
        <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200 border border-slate-100 flex flex-col max-h-[90dvh] sm:max-h-[85vh]">
          
          {/* Header & Scrollable Content */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
            {/* Mobile Drag Handle */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden"></div>
            
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">{editingTask ? t('task.edit_title') : t('task.new_title')}</h2>
               {editingTask && (
                 <button 
                    onClick={() => deleteTask(editingTask.id)} 
                    className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    title={t('task.delete')}
                 >
                    <Trash2 size={18} />
                 </button>
               )}
            </div>
            
            <input 
              className={`w-full text-base sm:text-lg font-medium border-b py-2 mb-1 focus:outline-none bg-transparent transition-colors ${showError ? 'border-red-500 placeholder-red-300' : 'border-slate-200 placeholder-slate-300 focus:border-emerald-500'}`}
              placeholder={t('task.placeholder')}
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                if(e.target.value.trim()) setShowError(false);
              }}
              autoFocus
            />
            {showError && <p className="text-red-500 text-xs font-medium mb-4 animate-in slide-in-from-top-1">{t('task.error_req')}</p>}
            {!showError && <div className="mb-5"></div>}

            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">{t('task.date')}</label>
                <input type="date" className="w-full bg-slate-50 rounded-xl border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all text-slate-700" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">{t('task.time')}</label>
                <input type="time" className="w-full bg-slate-50 rounded-xl border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all text-slate-700" value={time} onChange={e => setTime(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-5">
              <div className="relative">
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">{t('task.category')}</label>
                <div className="flex items-center gap-2">
                  <select 
                    className="w-full bg-slate-50 rounded-xl border border-slate-200 p-2 sm:p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all text-slate-700 appearance-none" 
                    value={catId} 
                    onChange={e => setCatId(e.target.value)}
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{t(c.name)}</option>)}
                  </select>
                  <button 
                    onClick={() => setIsAddingCategory(!isAddingCategory)}
                    className="p-2 sm:p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-all flex-shrink-0"
                    title={t('cat.new')}
                  >
                    <FolderPlus size={18} />
                  </button>
                </div>
                
                {isAddingCategory && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 shadow-xl rounded-xl p-3 z-10 animate-in fade-in zoom-in-95">
                    <input 
                      placeholder={t('task.category')}
                      className="w-full mb-2 p-2 border border-slate-200 rounded-lg text-sm"
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                    />
                    <div className="flex justify-between items-center">
                      <input 
                        type="color" 
                        value={newCatColor}
                        onChange={e => setNewCatColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer"
                      />
                      <Button size="sm" onClick={handleCreateCategory}>OK</Button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">{t('task.priority')}</label>
                <select className="w-full bg-slate-50 rounded-xl border border-slate-200 p-2 sm:p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all text-slate-700" value={prio} onChange={e => setPrio(e.target.value as Priority)}>
                  <option value={Priority.LOW}>{t('prio.low')}</option>
                  <option value={Priority.MEDIUM}>{t('prio.medium')}</option>
                  <option value={Priority.HIGH}>{t('prio.high')}</option>
                </select>
              </div>
            </div>
            
            <div className="mb-5">
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">{t('task.tags')}</label>
                <div className="flex flex-wrap gap-2 mb-2 p-2 sm:p-2.5 bg-slate-50 rounded-xl border border-slate-200 min-h-[42px] sm:min-h-[46px] focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
                  {tags.map(tag => (
                    <span key={tag} className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md text-xs flex items-center gap-1 font-medium">
                      #{tag}
                      <button onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-emerald-900"><X size={12} /></button>
                    </span>
                  ))}
                  <input 
                    className="bg-transparent text-xs sm:text-sm outline-none flex-1 min-w-[60px] placeholder-slate-400"
                    placeholder="#tag (Enter)"
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    onKeyDown={handleAddTag}
                  />
                </div>
              </div>

            <textarea 
              className="w-full bg-slate-50 rounded-xl border border-slate-200 p-2.5 sm:p-3 text-xs sm:text-sm mb-5 h-20 sm:h-24 resize-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all" 
              placeholder={t('task.notes')}
              value={desc}
              onChange={e => setDesc(e.target.value)}
            />

            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('task.checklist')}</label>
              </div>
              <div className="space-y-2.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                {subs.map((s, idx) => (
                  <div key={s.id} className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                    <input 
                      type="checkbox" 
                      checked={s.isCompleted} 
                      onChange={() => {
                          const newSubs = [...subs];
                          newSubs[idx].isCompleted = !newSubs[idx].isCompleted;
                          setSubs(newSubs);
                      }}
                      className="accent-emerald-600 rounded w-4 h-4 cursor-pointer flex-shrink-0"
                    />
                    <input 
                      value={s.title}
                      onChange={(e) => {
                        const newSubs = [...subs];
                        newSubs[idx].title = e.target.value;
                        setSubs(newSubs);
                      }}
                      className="flex-1 text-sm bg-transparent border-b border-transparent focus:border-slate-200 outline-none transition-colors text-slate-700 min-w-0"
                    />
                    <button onClick={() => setSubs(subs.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0">&times;</button>
                  </div>
                ))}
                <button 
                  onClick={() => setSubs([...subs, { id: generateId(), title: '', isCompleted: false }])}
                  className="text-xs text-slate-400 hover:text-emerald-600 flex items-center mt-3 transition-colors font-medium ml-1"
                >
                  <Plus size={14} className="mr-1"/> {t('task.add_item')}
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 sm:gap-3 p-3 sm:p-4 border-t border-slate-100 bg-white rounded-b-3xl pb-safe">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>{t('task.cancel')}</Button>
            <Button onClick={handleSave} className="shadow-lg shadow-emerald-200/50">{t('task.save')}</Button>
          </div>
        </div>
      </div>
    );
  };

  const SidebarContent = () => (
    <>
       <div className="p-6 pb-2 hidden md:block">
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
             <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                <span className="text-lg font-bold">N</span>
             </div>
             {t('app.name')}
          </h1>
          <p className="text-xs text-slate-400 mt-1 pl-12 font-medium tracking-wide">{t('app.slogan')}</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto custom-scrollbar">
          {/* Year in Review Trigger - Prominent */}
          {/* <button 
             onClick={() => { setIsYearReviewOpen(true); setIsMobileMenuOpen(false); }}
             className="w-full bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 p-0.5 rounded-xl shadow-lg shadow-amber-200/50 group transform hover:scale-[1.02] transition-all"
          >
             <div className="bg-white/90 backdrop-blur-sm hover:bg-white/95 rounded-[10px] px-3.5 py-3 flex items-center gap-3 transition-colors">
                 <div className="bg-gradient-to-br from-amber-400 to-orange-500 w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm">
                    <Sparkles size={18} fill="currentColor" />
                 </div>
                 <div className="flex flex-col items-start">
                    <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">{t('sidebar.year_review')} {new Date().getFullYear()}</span>
                 </div>
             </div>
          </button> */}

          <div className="space-y-1">
            <SidebarItem 
              id="today" 
              label={t('sidebar.today')}
              icon={Calendar} 
              count={tasks.filter(t => isToday(parseISO(t.dueDate)) && !t.isCompleted).length} 
              color="text-emerald-500" 
              isActive={viewMode === 'today'}
              onClick={(id) => { setViewMode(id); setIsMobileMenuOpen(false); }}
            />
             <SidebarItem 
              id="calendar" 
              label={t('sidebar.calendar')}
              icon={CalendarDays} 
              count={0} 
              color="text-violet-500" 
              isActive={viewMode === 'calendar'}
              onClick={(id) => { setViewMode(id); setIsMobileMenuOpen(false); }}
            />
            <SidebarItem 
              id="upcoming" 
              label={t('sidebar.upcoming')}
              icon={CalendarClock} 
              count={tasks.filter(t => isFuture(parseISO(t.dueDate)) && !isToday(parseISO(t.dueDate)) && !t.isCompleted).length} 
              color="text-blue-500" 
              isActive={viewMode === 'upcoming'}
              onClick={(id) => { setViewMode(id); setIsMobileMenuOpen(false); }}
            />
             <SidebarItem 
              id="overdue" 
              label={t('sidebar.overdue')}
              icon={AlertCircle} 
              count={overdueCount} 
              color="text-red-500" 
              isActive={viewMode === 'overdue'}
              onClick={(id) => { setViewMode(id); setIsMobileMenuOpen(false); }}
            />
            <SidebarItem 
              id="all" 
              label={t('sidebar.all')}
              icon={List} 
              count={tasks.filter(t => !t.isCompleted).length} 
              isActive={viewMode === 'all'}
              onClick={(id) => { setViewMode(id); setIsMobileMenuOpen(false); }}
            />
          </div>

          <div>
            <div className="px-3 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              <span>{t('sidebar.lists')}</span>
              <button 
                onClick={() => {
                   setEditingCategory({id: generateId(), name: 'cat.new', color: '#10b981', type: 'user'});
                   setIsMobileMenuOpen(false);
                }}
                className="hover:text-emerald-600 p-1 hover:bg-emerald-50 rounded"
              >
                <Plus size={14}/>
              </button>
            </div>
            
            <div className="space-y-1">
              {categories.map(cat => (
                <SidebarItem 
                  key={cat.id}
                  id={cat.id}
                  label={t(cat.name)}
                  color={cat.color}
                  isCategory={true}
                  count={tasks.filter(t => t.categoryId === cat.id && !t.isCompleted).length}
                  isActive={viewMode === cat.id}
                  onClick={(id) => { setViewMode(id); setIsMobileMenuOpen(false); }}
                  onEdit={() => setEditingCategory(cat)}
                />
              ))}
            </div>
          </div>
          
          <div className="md:hidden">
             <div className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">{t('sidebar.tools')}</div>
             <SidebarItem id="analytics" label={t('sidebar.analytics')} icon={BarChart2} count={0} color="text-pink-500" isActive={viewMode === 'analytics'} onClick={(id) => { setViewMode(id); setIsMobileMenuOpen(false); }} />
          </div>
        </nav>
    </>
  );

  const isCalendarMode = viewMode === 'calendar';

  return (
    <div className="flex h-[100dvh] w-full text-slate-800 bg-[#f8fafc] overflow-hidden font-sans select-none">
      
      {/* Desktop Sidebar */}
      <div className="w-72 bg-white border-r border-slate-100 flex flex-col flex-shrink-0 hidden md:flex z-20 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.03)]">
        <SidebarContent />
        
        {/* Desktop Bottom Sidebar Tools */}
        <div className="p-4 border-t border-slate-50 bg-slate-50/50 space-y-1">
             <SidebarItem id="habits" label={t('sidebar.habits')} icon={Target} count={0} color="text-orange-500" isActive={viewMode === 'habits'} onClick={setViewMode} />
             <SidebarItem id="focus" label={t('sidebar.focus')} icon={Clock} count={0} color="text-teal-500" isActive={viewMode === 'focus'} onClick={setViewMode} />
             <SidebarItem id="analytics" label={t('sidebar.analytics')} icon={BarChart2} count={0} color="text-pink-500" isActive={viewMode === 'analytics'} onClick={setViewMode} />
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)}></div>
           <div className="absolute left-0 top-0 bottom-0 w-[85%] max-w-xs bg-white shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col z-50 rounded-r-2xl pb-safe">
              <div className="p-6 pt-safe flex justify-between items-center border-b border-slate-100">
                 <h2 className="text-xl font-bold flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center text-white shadow-md">N</div>
                    {t('app.name')}
                 </h2>
                 <button onClick={() => setIsMobileMenuOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
              </div>
              <SidebarContent />
           </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col relative bg-[#f8fafc] h-full min-w-0 ${isCalendarMode ? 'overflow-hidden' : ''}`}>
        <UzbekPattern opacity={0.08} />
        
        {/* Header (Unified) */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-4 md:px-8 flex-shrink-0 z-40 sticky top-0 transition-all pt-safe h-[calc(4rem+env(safe-area-inset-top))] md:h-16 md:pt-0">
           <div className="flex items-center gap-3 md:hidden">
              <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                <Menu />
              </button>
              <h1 className="text-base sm:text-lg font-bold text-slate-800 capitalize tracking-tight truncate max-w-[140px] sm:max-w-[180px]">
                {searchQuery ? t('task.search') : (
                 t(categories.find(c => c.id === viewMode)?.name || 
                 (viewMode === 'today' ? 'sidebar.today' : 
                  viewMode === 'calendar' ? 'sidebar.calendar' :
                  viewMode === 'focus' ? 'sidebar.focus' :
                  viewMode === 'habits' ? 'sidebar.habits' : 'sidebar.all'))
                )}
              </h1>
           </div>

           <div className="hidden md:block">
              {/* Desktop Breadcrumb/Title */}
              <h2 className="text-xl font-bold text-slate-800 capitalize tracking-tight">
                {searchQuery ? t('task.search') : (
                 t(categories.find(c => c.id === viewMode)?.name || 
                 (viewMode === 'today' ? 'sidebar.today' : 
                  viewMode === 'calendar' ? 'sidebar.calendar' :
                  viewMode === 'focus' ? 'sidebar.focus' :
                  viewMode === 'habits' ? 'sidebar.habits' : 'sidebar.all'))
                )}
              </h2>
           </div>

           {/* Network Status Indicator */}
           <div className="hidden sm:block mx-4">
              <NetworkStatus />
           </div>

           {/* Search Bar - Responsive */}
           <div className={`absolute inset-0 bg-white z-20 flex items-center px-4 pt-safe md:pt-0 md:static md:bg-transparent md:flex-1 md:max-w-md md:mx-12 transition-transform duration-300 ${isSearchOpen ? 'translate-y-0' : '-translate-y-full md:translate-y-0'}`}>
               {isSearchOpen && <button onClick={() => setIsSearchOpen(false)} className="mr-2 md:hidden text-slate-500"><ArrowLeft size={20}/></button>}
              <div className="relative group w-full">
                <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={15} />
                <input 
                  type="text" 
                  placeholder={t('task.search')} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-100/50 border-transparent focus:bg-white border focus:border-emerald-200 focus:ring-4 focus:ring-emerald-50/50 rounded-xl pl-8 sm:pl-10 pr-8 sm:pr-4 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none transition-all placeholder-slate-400"
                />
                {searchQuery && (
                    <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                        <XCircle size={13} fill="currentColor" className="text-slate-200" />
                    </button>
                )}
              </div>
           </div>

           <div className="flex items-center gap-1.5 sm:gap-2 relative">
              <div className="sm:hidden">
                 <NetworkStatus />
              </div>
              <button onClick={() => setIsSearchOpen(true)} className="md:hidden p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg">
                  <Search size={18} />
              </button>
              
              {/* Profile Menu Trigger */}
              <div 
                className="relative cursor-pointer"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                  {user?.avatar && !avatarError ? (
                    <img 
                      src={user.avatar} 
                      alt="Profile" 
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-emerald-100 shadow-sm hover:shadow-md transition-all object-cover"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-emerald-100 to-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] sm:text-xs shadow-sm hover:shadow-md transition-all">
                        {user?.name?.substring(0,2).toUpperCase() || 'US'}
                    </div>
                  )}

                  {/* Profile Dropdown */}
                  {showProfileMenu && (
                    <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)}></div>
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 origin-top-right">
                       <div className="px-3 py-2 border-b border-slate-50 mb-1">
                          <p className="text-sm font-bold text-slate-800 truncate">{user?.name}</p>
                          <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                       </div>
                       
                       {/* Install Guide Button */}
                       <button 
                         onClick={() => { setShowInstallGuide(true); setShowProfileMenu(false); }}
                         className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors mb-1"
                       >
                         <Smartphone size={16} /> {t('install.title')}
                       </button>

                       {/* Language Switcher */}
                       <div className="px-3 py-2 border-b border-slate-50 mb-1">
                           <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">{t('profile.language')}</p>
                           <div className="flex gap-1 justify-between">
                               <button onClick={() => setLanguage('ru')} className={`flex-1 py-1 text-xs rounded-md font-medium border ${language === 'ru' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-600 border-slate-200'}`}>RU</button>
                               <button onClick={() => setLanguage('uz')} className={`flex-1 py-1 text-xs rounded-md font-medium border ${language === 'uz' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-600 border-slate-200'}`}>UZ</button>
                               <button onClick={() => setLanguage('en')} className={`flex-1 py-1 text-xs rounded-md font-medium border ${language === 'en' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-600 border-slate-200'}`}>EN</button>
                           </div>
                       </div>

                       {/* Data Management */}
                       <div className="px-3 py-2 border-b border-slate-50 mb-1">
                           <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Данные</p>
                           <button 
                             onClick={handleExport}
                             className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded-md transition-colors mb-1"
                           >
                             <CornerDownLeft size={14} /> Экспорт
                           </button>
                           <label className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded-md transition-colors cursor-pointer mb-1">
                             <CornerDownLeft size={14} className="rotate-180" /> Импорт
                             <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                           </label>
                           {useFirebase && (
                             <button 
                               onClick={() => syncToCloud()}
                               className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                             >
                               <RefreshCcw size={14} /> Синхронизация
                             </button>
                           )}
                       </div>

                       <button 
                         onClick={logout}
                         className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                       >
                         <LogOut size={16} /> {t('profile.logout')}
                       </button>
                    </div>
                    </>
                  )}
              </div>
           </div>
        </header>

        {/* Scrollable Content Container */}
        {/* Adjusted padding bottom to account for fixed bottom nav on mobile */}
        <div className={`flex-1 w-full relative ${isCalendarMode ? 'h-full overflow-hidden' : 'overflow-y-auto pb-[calc(80px+env(safe-area-inset-bottom))] md:pb-0'}`}>
             
             {/* Views */}
             {viewMode === 'habits' ? (
                <div className="p-4 md:p-8 max-w-5xl mx-auto animate-in fade-in duration-300">
                  <HabitTracker 
                    habits={habits} 
                    onAddHabit={addHabit} 
                    onToggleHabit={toggleHabit} 
                    onDeleteHabit={deleteHabit} 
                  />
                </div>
              ) : viewMode === 'focus' ? (
                <div className="h-full flex flex-col p-4 md:p-8 animate-in fade-in duration-300">
                  <FocusMode tasks={tasks} />
                </div>
              ) : viewMode === 'analytics' ? (
                <div className="p-4 md:p-8 animate-in fade-in duration-300">
                  <Analytics tasks={tasks} habits={habits} categories={categories} />
                </div>
              ) : viewMode === 'calendar' ? (
                <div className="h-full flex flex-col bg-white animate-in fade-in duration-300">
                   <CalendarView 
                      tasks={tasks} 
                      categories={categories}
                      onDateSelect={handleDateSelect} 
                      onUpdateTask={updateTask} 
                   />
                </div>
              ) : (
                <div className="p-4 md:p-8 max-w-4xl mx-auto animate-in fade-in duration-300">
                  {/* Task List Header info */}
                  <div className="flex justify-between items-start sm:items-end mb-6 md:mb-8 gap-4">
                    <div className="flex-1 min-w-0">
                       {!searchQuery && ['today'].includes(viewMode as string) && (
                        <p className="text-sm sm:text-base text-slate-500 font-medium tracking-wide capitalize truncate">
                          {format(new Date(), 'd MMMM, EEEE', { locale: dateLocale })}
                        </p>
                      )}
                      {viewMode === 'today' && overdueCount > 0 && !searchQuery && (
                         <div className="mt-3 text-xs sm:text-sm text-red-600 bg-red-50 border border-red-100 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl inline-flex items-center cursor-pointer hover:bg-red-100 transition-colors shadow-sm w-full sm:w-auto" onClick={handleMoveOverdueToToday}>
                           <AlertCircle size={14} className="mr-1.5 sm:mr-2 flex-shrink-0"/> 
                           <span className="font-semibold">{overdueCount} {t('task.overdue_count')}</span> 
                           <span className="opacity-75 ml-1 font-normal hidden sm:inline">— {t('task.move_overdue')}</span>
                           <span className="opacity-75 ml-0.5 sm:ml-1 font-normal sm:hidden text-[10px]">→ today</span>
                         </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Add Bar */}
                  {!['analytics', 'focus', 'habits', 'calendar', 'upcoming', 'overdue'].includes(viewMode) && !searchQuery && (
                     <QuickAddInput onAdd={handleQuickAdd} t={t} />
                  )}

                  {filteredTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-60">
                      <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                          {searchQuery ? <Search size={40} className="text-slate-300" /> : <CheckSquare size={40} className="text-slate-300" />}
                      </div>
                      <h3 className="text-lg font-semibold text-slate-500">{searchQuery ? t('task.search_empty') : t('task.empty_list')}</h3>
                      <p className="text-slate-400 text-sm mt-1">{searchQuery ? '' : t('task.empty_desc')}</p>
                    </div>
                  ) : (
                    <div className="space-y-6 pb-4">
                      {taskSections.map((section, idx) => (
                          <div key={section.title || idx}>
                             {section.title && (
                                <h3 className={`text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center ${idx > 0 ? 'mt-8' : ''}`}>
                                   {section.title === t('sidebar.today') && <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>}
                                   {section.title === t('sidebar.overdue') && <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>}
                                   {section.title}
                                </h3>
                             )}
                             <div>
                                {section.tasks.map(task => (
                                    <TaskRow 
                                        key={task.id} 
                                        task={task} 
                                        category={categories.find(c => c.id === task.categoryId)}
                                        onToggle={toggleTaskCompletion}
                                        onEdit={handleEditTask}
                                        onDelete={deleteTask}
                                        onTagClick={(tag) => setSearchQuery(tag)}
                                        t={t}
                                        locale={dateLocale}
                                    />
                                ))}
                             </div>
                          </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
        </div>

        {/* Mobile Bottom Navigation Bar - Fixed to bottom with safe area */}
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 flex justify-between items-center h-[calc(80px+env(safe-area-inset-bottom))] px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] z-50 fixed bottom-0 left-0 right-0 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)] pt-4">
           <button onClick={() => setViewMode('today')} className={`flex flex-col items-center justify-center w-14 transition-colors ${['today','upcoming','all'].includes(viewMode as string) || categories.some(c=>c.id===viewMode) ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>
              <List size={24} strokeWidth={['today','upcoming','all'].includes(viewMode as string) ? 2.5 : 2} />
              <span className="text-[10px] font-medium mt-1">{t('sidebar.all')}</span>
           </button>
           <button onClick={() => setViewMode('calendar')} className={`flex flex-col items-center justify-center w-14 transition-colors ${viewMode === 'calendar' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>
              <CalendarDays size={24} strokeWidth={viewMode === 'calendar' ? 2.5 : 2} />
              <span className="text-[10px] font-medium mt-1">{t('sidebar.calendar')}</span>
           </button>
           
           {/* Center FAB Placeholder */}
           <div className="w-12"></div>

           <button onClick={() => setViewMode('focus')} className={`flex flex-col items-center justify-center w-14 transition-colors ${viewMode === 'focus' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>
              <Clock size={24} strokeWidth={viewMode === 'focus' ? 2.5 : 2} />
              <span className="text-[10px] font-medium mt-1">{t('sidebar.focus')}</span>
           </button>
           <button onClick={() => setViewMode('habits')} className={`flex flex-col items-center justify-center w-14 transition-colors ${viewMode === 'habits' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>
              <Target size={24} strokeWidth={viewMode === 'habits' ? 2.5 : 2} />
              <span className="text-[10px] font-medium mt-1">{t('sidebar.habits')}</span>
           </button>
        </div>

        {/* Mobile FAB (Floating) */}
         <div className="md:hidden fixed bottom-[calc(40px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-[55]">
            <button 
              onClick={() => { setEditingTask(null); setIsModalOpen(true); }}
              className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-full shadow-xl shadow-emerald-200 flex items-center justify-center hover:scale-105 active:scale-95 transition-all border-4 border-white/80 ring-2 ring-emerald-50"
            >
              <Plus size={28} strokeWidth={3} />
            </button>
         </div>

        {/* Desktop FAB */}
        <button 
          onClick={() => { setEditingTask(null); setIsModalOpen(true); }}
          className="hidden md:flex fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-2xl shadow-xl shadow-emerald-200/50 items-center justify-center transition-all hover:scale-105 active:scale-95 group z-40"
        >
          <Plus size={32} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>

      </main>

      {/* Modals */}
      {isModalOpen && <TaskModal />}
      {editingCategory && <CategoryEditModal />}
      {isYearReviewOpen && <YearInReview tasks={tasks} habits={habits} categories={categories} onClose={() => setIsYearReviewOpen(false)} />}
      {showInstallGuide && <InstallGuide onClose={() => setShowInstallGuide(false)} />}
    </div>
  );
}