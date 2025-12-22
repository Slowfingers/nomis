import { useEffect, useCallback, useRef } from 'react';
import { Task, Category, Habit } from '../types';
import { saveUserData, loadUserData, subscribeToUserData, mergeData } from '../services/firebaseService';
import { AppData } from '../utils/dataManager';

interface UseDataSyncProps {
  userId: string | null;
  useFirebase: boolean;
  tasks: Task[];
  categories: Category[];
  habits: Habit[];
  onDataLoaded: (data: AppData) => void;
}

export function useDataSync({
  userId,
  useFirebase,
  tasks,
  categories,
  habits,
  onDataLoaded,
}: UseDataSyncProps) {
  const lastSyncRef = useRef<string>('');
  const isSyncingRef = useRef(false);

  // Load data from cloud on mount
  useEffect(() => {
    if (!userId || !useFirebase) return;

    const loadCloudData = async () => {
      try {
        const cloudData = await loadUserData(userId);
        if (cloudData) {
          // Merge with local data
          const localData: AppData = {
            version: 1,
            tasks,
            categories,
            habits,
            lastModified: localStorage.getItem('nomis_last_sync') || new Date().toISOString(),
          };

          const mergedData = mergeData(localData, cloudData);
          onDataLoaded(mergedData);
          lastSyncRef.current = mergedData.lastModified;
        }
      } catch (error) {
        console.error('Error loading cloud data:', error);
      }
    };

    loadCloudData();
  }, [userId, useFirebase]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!userId || !useFirebase) return;

    const unsubscribe = subscribeToUserData(userId, (cloudData) => {
      if (!cloudData) return;
      
      // Avoid syncing our own changes
      if (cloudData.lastModified === lastSyncRef.current) return;
      if (isSyncingRef.current) return;

      console.log('Received cloud update');
      localStorage.setItem('nomis_last_sync', cloudData.lastModified);
      onDataLoaded(cloudData);
      lastSyncRef.current = cloudData.lastModified;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userId, useFirebase, onDataLoaded]);

  // Sync to cloud when data changes
  const syncToCloud = useCallback(async () => {
    if (!userId || !useFirebase || isSyncingRef.current) return;

    try {
      isSyncingRef.current = true;
      const timestamp = await saveUserData(userId, tasks, categories, habits);
      lastSyncRef.current = timestamp;
      localStorage.setItem('nomis_last_sync', timestamp);
    } catch (error) {
      console.error('Error syncing to cloud:', error);
    } finally {
      isSyncingRef.current = false;
    }
  }, [userId, useFirebase, tasks, categories, habits]);

  // Debounced sync
  useEffect(() => {
    if (!userId || !useFirebase) return;

    const timeoutId = setTimeout(() => {
      syncToCloud();
    }, 2000); // Sync 2 seconds after last change

    return () => clearTimeout(timeoutId);
  }, [tasks, categories, habits, syncToCloud, userId, useFirebase]);

  return { syncToCloud };
}
