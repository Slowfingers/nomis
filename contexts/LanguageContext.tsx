import * as React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ru' | 'en' | 'uz';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  ru: {
    'app.name': 'Nomis',
    'app.slogan': 'Never miss',
    'auth.login_google': 'Войти через Google',
    'auth.logging_in': 'Вход...',
    'auth.terms_agreement': 'Входя в систему, вы принимаете',
    'auth.terms': 'условия использования',
    'auth.demo_mode': 'Демо-режим: Реальная отправка данных отключена.',
    'auth.modal.title': 'Пользовательское соглашение',
    'auth.modal.sso': 'Авторизация через Google',
    'auth.modal.sso_desc': 'Мы не получаем и не храним ваш пароль.',
    'auth.modal.data': 'Данные пользователя',
    'auth.modal.data_desc': 'Мы используем только имя и аватар.',
    'auth.modal.sync': 'Синхронизация',
    'auth.modal.sync_desc': 'Ваши данные синхронизируются с облаком.',
    'auth.modal.close': 'Понятно',

    'sidebar.today': 'Сегодня',
    'sidebar.calendar': 'Календарь',
    'sidebar.upcoming': 'Предстоящие',
    'sidebar.overdue': 'Просроченные',
    'sidebar.all': 'Все задачи',
    'sidebar.lists': 'Списки',
    'sidebar.habits': 'Привычки',
    'sidebar.focus': 'Фокус',
    'sidebar.analytics': 'Статистика',
    'sidebar.year_review': 'Итоги года',
    'sidebar.tools': 'Инструменты',

    'cat.personal': 'Личное',
    'cat.work': 'Работа',
    'cat.sport': 'Спорт',
    'cat.study': 'Учеба',
    'cat.shopping': 'Покупки',
    'cat.new': 'Новый список',

    'task.search': 'Поиск...',
    'task.search_empty': 'Ничего не найдено',
    'task.empty_list': 'Задач нет',
    'task.empty_desc': 'Отдыхайте или добавьте новую',
    'task.quick_add': 'Быстро добавить задачу...',
    'task.move_overdue': 'перенести на сегодня',
    'task.overdue_count': 'просроченных',
    'task.delete_confirm': 'Удалить задачу?',
    'task.new_title': 'Новая задача',
    'task.edit_title': 'Редактировать',
    'task.placeholder': 'Что нужно сделать?',
    'task.date': 'ДАТА',
    'task.time': 'ВРЕМЯ',
    'task.category': 'КАТЕГОРИЯ',
    'task.priority': 'ПРИОРИТЕТ',
    'task.tags': 'ТЕГИ',
    'task.notes': 'Заметки...',
    'task.checklist': 'ЧЕК-ЛИСТ',
    'task.add_item': 'Добавить пункт',
    'task.save': 'Сохранить',
    'task.cancel': 'Отмена',
    'task.delete': 'Удалить',
    'task.error_req': 'Пожалуйста, введите название',

    'prio.low': 'Низкий 🟢',
    'prio.medium': 'Средний 🟡',
    'prio.high': 'Высокий 🔴',

    'profile.logout': 'Выйти',
    'profile.language': 'Язык / Language / Til',

    // Year In Review
    'yir.title': 'Ваш',
    'yir.subtitle': 'Это был год больших свершений. Давайте посмотрим, чего вы достигли!',
    'yir.completed_tasks': 'Завершено задач',
    'yir.completed_desc': 'Каждая галочка — это шаг к вашей мечте. Вы сделали {count} шагов вперед!',
    'yir.main_focus': 'Ваш главный фокус',
    'yir.focus_desc': 'Именно в этой сфере вы приложили больше всего усилий.',
    'yir.peak_productivity': 'Пик продуктивности',
    'yir.tasks_done': 'Задач выполнено',
    'yir.month_desc': 'В этом месяце вы были просто неудержимы!',
    'yir.habit_power': 'Сила привычки',
    'yir.days_streak': 'Дней подряд!',
    'yir.in_habit': 'В привычке',
    'yir.started': 'Начало положено',
    'yir.started_desc': 'В следующем году будем строить серии!',
    'yir.level': 'Ваш уровень за год',
    'yir.tasks': 'Задач',
    'yir.streak': 'Серия',
    'yir.new_heights': 'К новым вершинам! 🚀',
    'yir.continue': 'Нажмите, чтобы продолжить',
    'yir.misc': 'Разное',

    'lvl.novice': 'Новичок',
    'lvl.amateur': 'Любитель',
    'lvl.pro': 'Профи',
    'lvl.machine': 'Машина продуктивности',
    'lvl.lord': 'Повелитель времени',
  },
  en: {
    'app.name': 'Nomis',
    'app.slogan': 'Never miss',
    'auth.login_google': 'Sign in with Google',
    'auth.logging_in': 'Signing in...',
    'auth.terms_agreement': 'By signing in, you agree to',
    'auth.terms': 'Terms of Service',
    'auth.demo_mode': 'Demo mode: Real data submission disabled.',
    'auth.modal.title': 'Terms of Service',
    'auth.modal.sso': 'Google Authorization',
    'auth.modal.sso_desc': 'We do not store your password.',
    'auth.modal.data': 'User Data',
    'auth.modal.data_desc': 'We only use your name and avatar.',
    'auth.modal.sync': 'Synchronization',
    'auth.modal.sync_desc': 'Your data is synced to the cloud.',
    'auth.modal.close': 'Got it',

    'sidebar.today': 'Today',
    'sidebar.calendar': 'Calendar',
    'sidebar.upcoming': 'Upcoming',
    'sidebar.overdue': 'Overdue',
    'sidebar.all': 'All Tasks',
    'sidebar.lists': 'Lists',
    'sidebar.habits': 'Habits',
    'sidebar.focus': 'Focus',
    'sidebar.analytics': 'Analytics',
    'sidebar.year_review': 'Year in Review',
    'sidebar.tools': 'Tools',

    'cat.personal': 'Personal',
    'cat.work': 'Work',
    'cat.sport': 'Sport',
    'cat.study': 'Study',
    'cat.shopping': 'Shopping',
    'cat.new': 'New List',

    'task.search': 'Search...',
    'task.search_empty': 'Nothing found',
    'task.empty_list': 'No tasks',
    'task.empty_desc': 'Relax or add a new one',
    'task.quick_add': 'Quick add task...',
    'task.move_overdue': 'move to today',
    'task.overdue_count': 'overdue',
    'task.delete_confirm': 'Delete task?',
    'task.new_title': 'New Task',
    'task.edit_title': 'Edit Task',
    'task.placeholder': 'What needs to be done?',
    'task.date': 'DATE',
    'task.time': 'TIME',
    'task.category': 'CATEGORY',
    'task.priority': 'PRIORITY',
    'task.tags': 'TAGS',
    'task.notes': 'Notes...',
    'task.checklist': 'CHECKLIST',
    'task.add_item': 'Add item',
    'task.save': 'Save',
    'task.cancel': 'Cancel',
    'task.delete': 'Delete',
    'task.error_req': 'Please enter a title',

    'prio.low': 'Low 🟢',
    'prio.medium': 'Medium 🟡',
    'prio.high': 'High 🔴',

    'profile.logout': 'Logout',
    'profile.language': 'Language',

    // Year In Review
    'yir.title': 'Your',
    'yir.subtitle': 'It was a year of great achievements. Let\'s see what you accomplished!',
    'yir.completed_tasks': 'Tasks Completed',
    'yir.completed_desc': 'Every checkmark is a step towards your dream. You took {count} steps forward!',
    'yir.main_focus': 'Main Focus',
    'yir.focus_desc': 'This is the area where you put the most effort.',
    'yir.peak_productivity': 'Peak Productivity',
    'yir.tasks_done': 'Tasks Done',
    'yir.month_desc': 'You were unstoppable this month!',
    'yir.habit_power': 'Habit Power',
    'yir.days_streak': 'Day Streak!',
    'yir.in_habit': 'In habit',
    'yir.started': 'Just Started',
    'yir.started_desc': 'Next year we will build streaks!',
    'yir.level': 'Year Level',
    'yir.tasks': 'Tasks',
    'yir.streak': 'Streak',
    'yir.new_heights': 'To new heights! 🚀',
    'yir.continue': 'Tap to continue',
    'yir.misc': 'Misc',

    'lvl.novice': 'Novice',
    'lvl.amateur': 'Amateur',
    'lvl.pro': 'Pro',
    'lvl.machine': 'Productivity Machine',
    'lvl.lord': 'Time Lord',
  },
  uz: {
    'app.name': 'Nomis',
    'app.slogan': 'Never miss',
    'auth.login_google': 'Google orqali kirish',
    'auth.logging_in': 'Kirilmoqda...',
    'auth.terms_agreement': 'Kirish orqali siz qabul qilasiz',
    'auth.terms': 'Foydalanish shartlari',
    'auth.demo_mode': 'Demo rejim: Ma\'lumotlar yuborilmaydi.',
    'auth.modal.title': 'Foydalanish shartlari',
    'auth.modal.sso': 'Google Avtorizatsiya',
    'auth.modal.sso_desc': 'Biz parolingizni saqlamaymiz.',
    'auth.modal.data': 'Foydalanuvchi ma\'lumotlari',
    'auth.modal.data_desc': 'Faqat ism va avatardan foydalanamiz.',
    'auth.modal.sync': 'Sinxronizatsiya',
    'auth.modal.sync_desc': 'Ma\'lumotlaringiz bulutda saqlanadi.',
    'auth.modal.close': 'Tushunarli',

    'sidebar.today': 'Bugun',
    'sidebar.calendar': 'Taqvim',
    'sidebar.upcoming': 'Kelgusi',
    'sidebar.overdue': 'Muddati o\'tgan',
    'sidebar.all': 'Barcha vazifalar',
    'sidebar.lists': 'Ro\'yxatlar',
    'sidebar.habits': 'Odatlar',
    'sidebar.focus': 'Diqqat',
    'sidebar.analytics': 'Statistika',
    'sidebar.year_review': 'Yil sarhisobi',
    'sidebar.tools': 'Asboblar',

    'cat.personal': 'Shaxsiy',
    'cat.work': 'Ish',
    'cat.sport': 'Sport',
    'cat.study': 'O\'qish',
    'cat.shopping': 'Xaridlar',
    'cat.new': 'Yangi ro\'yxat',

    'task.search': 'Qidirish...',
    'task.search_empty': 'Hech narsa topilmadi',
    'task.empty_list': 'Vazifalar yo\'q',
    'task.empty_desc': 'Dam oling yoki yangi vazifa qo\'shing',
    'task.quick_add': 'Tezkor qo\'shish...',
    'task.move_overdue': 'bugunga o\'tkazish',
    'task.overdue_count': 'muddati o\'tgan',
    'task.delete_confirm': 'Vazifani o\'chirib tashlaysizmi?',
    'task.new_title': 'Yangi vazifa',
    'task.edit_title': 'Tahrirlash',
    'task.placeholder': 'Nima qilish kerak?',
    'task.date': 'SANA',
    'task.time': 'VAQT',
    'task.category': 'TOIFA',
    'task.priority': 'MUHIMLIK',
    'task.tags': 'TEGLAR',
    'task.notes': 'Izohlar...',
    'task.checklist': 'TEKSHIRUV RO\'YXATI',
    'task.add_item': 'Band qo\'shish',
    'task.save': 'Saqlash',
    'task.cancel': 'Bekor qilish',
    'task.delete': 'O\'chirish',
    'task.error_req': 'Iltimos, nomini kiriting',

    'prio.low': 'Past 🟢',
    'prio.medium': 'O\'rta 🟡',
    'prio.high': 'Yuqori 🔴',

    'profile.logout': 'Chiqish',
    'profile.language': 'Til / Language',

    // Year In Review
    'yir.title': 'Sizning',
    'yir.subtitle': 'Bu katta yutuqlar yili bo\'ldi. Keling, nimalarga erishganingizni ko\'rib chiqamiz!',
    'yir.completed_tasks': 'Bajarilgan vazifalar',
    'yir.completed_desc': 'Har bir belgi — orzuingiz sari qadam. Siz {count} qadam oldinga tashladingiz!',
    'yir.main_focus': 'Asosiy e\'tibor',
    'yir.focus_desc': 'Aynan shu sohada siz eng ko\'p harakat qildingiz.',
    'yir.peak_productivity': 'Eng yuqori unumdorlik',
    'yir.tasks_done': 'Vazifalar bajarildi',
    'yir.month_desc': 'Bu oyda sizni to\'xtatib bo\'lmasdi!',
    'yir.habit_power': 'Odat kuchi',
    'yir.days_streak': 'Kunlik seriya!',
    'yir.in_habit': 'Odatda',
    'yir.started': 'Boshlanishi',
    'yir.started_desc': 'Keyingi yil seriyalarni quramiz!',
    'yir.level': 'Yillik daraja',
    'yir.tasks': 'Vazifalar',
    'yir.streak': 'Seriya',
    'yir.new_heights': 'Yangi cho\'qqilarga! 🚀',
    'yir.continue': 'Davom etish uchun bosing',
    'yir.misc': 'Boshqa',

    'lvl.novice': 'Boshlovchi',
    'lvl.amateur': 'Havaskor',
    'lvl.pro': 'Professional',
    'lvl.machine': 'Unumdorlik mashinasi',
    'lvl.lord': 'Vaqt hukmdori',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('timsy_lang');
    return (saved as Language) || 'ru';
  });

  useEffect(() => {
    localStorage.setItem('timsy_lang', language);
  }, [language]);

  const t = (key: string): string => {
    const keys = key.split('.');
    let current: any = translations[language];
    
    // Fallback to RU if key missing
    if (!current[key] && language !== 'ru') {
        current = translations['ru'];
    }
    
    return current[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
