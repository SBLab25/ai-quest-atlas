import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface UserBadge {
  id: string;
  badge_id: string;
  earned_at: string;
  badge: {
    name: string;
    description: string | null;
    icon_url: string | null;
  };
}

export const useUserBadges = () => {
  const { user } = useAuth();
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [recentBadge, setRecentBadge] = useState<UserBadge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserBadges();
    }
  }, [user]);

  const fetchUserBadges = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("User Badges")
        .select(`
          id,
          badge_id,
          earned_at,
          Badges:badge_id (
            name,
            description,
            icon_url
          )
        `)
        .eq("user_id", user.id)
        .order("earned_at", { ascending: false });

      if (error) throw error;

      // Transform the data to match our interface
      const transformedBadges: UserBadge[] = (data || []).map(item => ({
        id: item.id,
        badge_id: item.badge_id,
        earned_at: item.earned_at,
        badge: {
          name: (item.Badges as any)?.name || "Unknown Badge",
          description: (item.Badges as any)?.description || null,
          icon_url: (item.Badges as any)?.icon_url || null,
        }
      }));

      setBadges(transformedBadges);
      
      // Set most recent badge
      if (transformedBadges.length > 0) {
        setRecentBadge(transformedBadges[0]);
      }

    } catch (error) {
      console.error("Error fetching user badges:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    badges,
    recentBadge,
    loading,
    totalBadges: badges.length,
    refetch: fetchUserBadges
  };
};