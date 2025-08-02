import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export const useRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<string>('user');
  const [loading, setLoading] = useState(false);

  // For now, return basic user role until tables are updated
  useEffect(() => {
    setRole('user');
    setLoading(false);
  }, [user]);

  const isAdmin = role === 'admin';
  const isModerator = role === 'moderator' || role === 'admin';

  return { role, isAdmin, isModerator, loading };
};