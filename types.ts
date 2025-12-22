export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string; // Hex code or Tailwind class class fragment
  type: 'system' | 'user';
}

export enum Repeat {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
}

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string; // ISO date string YYYY-MM-DD or YYYY-MM-DDTHH:mm
  duration?: number; // Duration in minutes (default 60 if has time)
  priority: Priority;
  categoryId: string; // Reference to Category ID
  tags: string[];
  subtasks: Subtask[];
  isCompleted: boolean;
  completedAt?: number; // Timestamp when task was completed
  repeat: Repeat;
  createdAt: number;
}

export interface Habit {
  id: string;
  title: string;
  streak: number;
  completedDates: string[]; // ISO Date strings
  goalPerWeek: number;
}

export type ViewMode = 'all' | 'today' | 'upcoming' | 'overdue' | 'calendar' | 'habits' | 'analytics' | 'focus';