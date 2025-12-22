import { Task, Category, Habit } from '../types';

// Current data version
export const DATA_VERSION = 1;

export interface AppData {
  version: number;
  tasks: Task[];
  categories: Category[];
  habits: Habit[];
  lastModified: string;
}

// Storage keys
const STORAGE_KEYS = {
  VERSION: 'nomis_data_version',
  TASKS: 'nomis_tasks',
  CATEGORIES: 'nomis_categories',
  HABITS: 'nomis_habits',
  LAST_SYNC: 'nomis_last_sync',
};

// Load data with version checking
export function loadData<T>(key: string, defaultValue: T): T {
  try {
    const version = localStorage.getItem(STORAGE_KEYS.VERSION);
    const currentVersion = version ? parseInt(version) : 0;

    // If version mismatch, migrate data
    if (currentVersion < DATA_VERSION) {
      migrateData(currentVersion, DATA_VERSION);
    }

    const saved = localStorage.getItem(key);
    if (!saved) return defaultValue;

    return JSON.parse(saved);
  } catch (error) {
    console.error(`Error loading ${key}:`, error);
    return defaultValue;
  }
}

// Save data with version
export function saveData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem(STORAGE_KEYS.VERSION, DATA_VERSION.toString());
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  } catch (error) {
    console.error(`Error saving ${key}:`, error);
  }
}

// Migrate data between versions
function migrateData(fromVersion: number, toVersion: number): void {
  console.log(`Migrating data from v${fromVersion} to v${toVersion}`);

  if (fromVersion === 0 && toVersion === 1) {
    // Migrate from old keys to new versioned keys
    const oldTasks = localStorage.getItem('tasks');
    const oldCategories = localStorage.getItem('categories');
    const oldHabits = localStorage.getItem('habits');

    if (oldTasks) {
      localStorage.setItem(STORAGE_KEYS.TASKS, oldTasks);
      localStorage.removeItem('tasks');
    }
    if (oldCategories) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, oldCategories);
      localStorage.removeItem('categories');
    }
    if (oldHabits) {
      localStorage.setItem(STORAGE_KEYS.HABITS, oldHabits);
      localStorage.removeItem('habits');
    }
  }

  // Add more migrations here as needed
  // if (fromVersion === 1 && toVersion === 2) { ... }

  localStorage.setItem(STORAGE_KEYS.VERSION, toVersion.toString());
}

// Export all data
export function exportData(tasks: Task[], categories: Category[], habits: Habit[]): void {
  const data: AppData = {
    version: DATA_VERSION,
    tasks,
    categories,
    habits,
    lastModified: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nomis-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Import data
export function importData(file: File): Promise<AppData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data: AppData = JSON.parse(content);

        // Validate data structure
        if (!data.version || !data.tasks || !data.categories || !data.habits) {
          throw new Error('Invalid backup file format');
        }

        // Migrate if needed
        if (data.version < DATA_VERSION) {
          console.warn(`Importing older version (v${data.version}), current is v${DATA_VERSION}`);
          // Apply migrations if needed
        }

        resolve(data);
      } catch (error) {
        reject(new Error('Failed to parse backup file: ' + (error as Error).message));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// Clear all data
export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  // Also clear old keys
  localStorage.removeItem('tasks');
  localStorage.removeItem('categories');
  localStorage.removeItem('habits');
  localStorage.removeItem('timsy_user');
}

// Get storage info
export function getStorageInfo(): { used: number; available: number; percentage: number } {
  let used = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      used += localStorage[key].length + key.length;
    }
  }

  // localStorage typically has 5-10MB limit
  const available = 5 * 1024 * 1024; // 5MB in bytes
  const percentage = (used / available) * 100;

  return { used, available, percentage };
}

export { STORAGE_KEYS };
