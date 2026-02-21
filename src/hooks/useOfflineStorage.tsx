import React, { useEffect, useState } from 'react';
// @ts-ignore - idb installed for offline support
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface DiscoveryAtlasDB extends DBSchema {
  quests: {
    key: string;
    value: {
      id: string;
      title: string;
      description: string;
      location: string;
      difficulty: number;
      xp_reward: number;
      cached_at: number;
      data: any;
    };
  };
  submissions: {
    key: string;
    value: {
      id: string;
      quest_id: string;
      user_id: string;
      photo_url: string;
      description: string;
      status: 'pending' | 'synced';
      created_at: number;
      data: any;
    };
    indexes: {
      'by-status': string;
    };
  };
  profile: {
    key: string;
    value: {
      id: string;
      username: string;
      avatar_url: string;
      cached_at: number;
      data: any;
    };
  };
}

let dbInstance: IDBPDatabase<DiscoveryAtlasDB> | null = null;

async function getDB() {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<DiscoveryAtlasDB>('discovery-atlas-db', 1, {
    upgrade(db) {
      // Create object stores
      if (!db.objectStoreNames.contains('quests')) {
        db.createObjectStore('quests', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('submissions')) {
        const submissionStore = db.createObjectStore('submissions', { keyPath: 'id' });
        submissionStore.createIndex('by-status', 'status');
      }
      if (!db.objectStoreNames.contains('profile')) {
        db.createObjectStore('profile', { keyPath: 'id' });
      }
    },
  });

  return dbInstance;
}

export const useOfflineStorage = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    getDB().then(() => setIsReady(true));
  }, []);

  const cacheQuest = async (quest: any) => {
    const db = await getDB();
    await db.put('quests', {
      id: quest.id,
      title: quest.title,
      description: quest.description,
      location: quest.location,
      difficulty: quest.difficulty,
      xp_reward: quest.xp_reward,
      cached_at: Date.now(),
      data: quest,
    });
  };

  const getCachedQuest = async (id: string) => {
    const db = await getDB();
    return await db.get('quests', id);
  };

  const getAllCachedQuests = async () => {
    const db = await getDB();
    return await db.getAll('quests');
  };

  const queueSubmission = async (submission: any) => {
    const db = await getDB();
    await db.put('submissions', {
      id: crypto.randomUUID(),
      quest_id: submission.quest_id,
      user_id: submission.user_id,
      photo_url: submission.photo_url,
      description: submission.description,
      status: 'pending',
      created_at: Date.now(),
      data: submission,
    });
  };

  const getPendingSubmissions = async () => {
    const db = await getDB();
    const tx = db.transaction('submissions', 'readonly');
    const index = tx.store.index('by-status');
    return await index.getAll('pending');
  };

  const markSubmissionSynced = async (id: string) => {
    const db = await getDB();
    const submission = await db.get('submissions', id);
    if (submission) {
      submission.status = 'synced';
      await db.put('submissions', submission);
    }
  };

  const cacheProfile = async (profile: any) => {
    const db = await getDB();
    await db.put('profile', {
      id: profile.id,
      username: profile.username,
      avatar_url: profile.avatar_url,
      cached_at: Date.now(),
      data: profile,
    });
  };

  const getCachedProfile = async (id: string) => {
    const db = await getDB();
    return await db.get('profile', id);
  };

  const clearOldCache = async (maxAge = 7 * 24 * 60 * 60 * 1000) => {
    const db = await getDB();
    const now = Date.now();
    
    // Clear old quests
    const quests = await db.getAll('quests');
    for (const quest of quests) {
      if (now - quest.cached_at > maxAge) {
        await db.delete('quests', quest.id);
      }
    }
    
    // Clear synced submissions
    const submissions = await db.getAll('submissions');
    for (const submission of submissions) {
      if (submission.status === 'synced' && now - submission.created_at > maxAge) {
        await db.delete('submissions', submission.id);
      }
    }
  };

  return {
    isReady,
    cacheQuest,
    getCachedQuest,
    getAllCachedQuests,
    queueSubmission,
    getPendingSubmissions,
    markSubmissionSynced,
    cacheProfile,
    getCachedProfile,
    clearOldCache,
  };
};
