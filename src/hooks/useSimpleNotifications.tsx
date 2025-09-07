import { useState } from 'react';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
  link?: string;
}

export const useNotifications = () => {
  const [notifications] = useState<Notification[]>([]);
  const [unreadCount] = useState(0);
  const [loading] = useState(false);

  const markAsRead = async (notificationId: string) => {
    // Will be implemented when database is updated
  };

  const markAllAsRead = async () => {
    // Will be implemented when database is updated
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead
  };
};