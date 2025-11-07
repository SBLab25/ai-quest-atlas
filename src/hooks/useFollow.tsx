import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export const useFollow = (targetUserId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    if (user && targetUserId) {
      checkFollowStatus();
      fetchCounts();
    }
  }, [user, targetUserId]);

  const checkFollowStatus = async () => {
    if (!user) return;
    
    try {
      // Check if following
      // @ts-ignore - Table will exist after running setupFollowSystem.sql
      const { data: followData } = await (supabase as any)
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .single();

      setIsFollowing(!!followData);

      // Check for pending request
      // @ts-ignore - Table will exist after running setupFollowSystem.sql
      const { data: requestData } = await (supabase as any)
        .from('follow_requests')
        .select('id')
        .eq('requester_id', user.id)
        .eq('target_id', targetUserId)
        .eq('status', 'pending')
        .single();

      setIsPending(!!requestData);
    } catch (error) {
      console.error('Error checking follow status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCounts = async () => {
    try {
      // @ts-ignore - Columns will exist after running setupFollowSystem.sql
      const { data } = await supabase
        .from('profiles')
        .select('follower_count, following_count')
        .eq('id', targetUserId)
        .single();

      if (data) {
        setFollowerCount((data as any).follower_count || 0);
        setFollowingCount((data as any).following_count || 0);
      }
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  const toggleFollow = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to follow users",
        variant: "destructive",
      });
      return;
    }

    try {
      // @ts-ignore - RPC will exist after running setupFollowSystem.sql
      const { data, error } = await supabase.rpc('toggle_follow', {
        p_target_user_id: targetUserId
      });

      if (error) throw error;

      const action = (data as any)?.action;

      if (action === 'followed') {
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
        toast({
          title: "Following",
          description: "You are now following this user",
        });
      } else if (action === 'unfollowed') {
        setIsFollowing(false);
        setFollowerCount(prev => Math.max(0, prev - 1));
        toast({
          title: "Unfollowed",
          description: "You have unfollowed this user",
        });
      } else if (action === 'requested') {
        setIsPending(true);
        toast({
          title: "Request Sent",
          description: "Your follow request has been sent",
        });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      });
    }
  };

  return {
    isFollowing,
    isPending,
    loading,
    followerCount,
    followingCount,
    toggleFollow,
    refetch: () => {
      checkFollowStatus();
      fetchCounts();
    }
  };
};
