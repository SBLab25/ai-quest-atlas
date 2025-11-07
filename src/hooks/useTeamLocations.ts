import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface TeamMemberLocation {
  id: string;
  username?: string | null;
  avatar_url?: string | null;
  lat: number;
  lng: number;
  team_id?: string;
}

export const useTeamLocations = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMemberLocation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) { setMembers([]); return; }

    const fetchTeamMembers = async () => {
      try {
        setLoading(true);
        // Find teams current user belongs to
        const { data: myMemberships, error: memErr } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('user_id', user.id);
        if (memErr) throw memErr;
        const teamIds = (myMemberships || []).map((m: any) => m.team_id);
        if (teamIds.length === 0) { setMembers([]); return; }

        // Get other members of those teams
        const { data: teamMembers, error: membersErr } = await supabase
          .from('team_members')
          .select('user_id, team_id')
          .in('team_id', teamIds)
          .neq('user_id', user.id);
        if (membersErr) throw membersErr;

        if (!teamMembers || teamMembers.length === 0) {
          setMembers([]);
          return;
        }

        // Get unique user IDs
        const userIds = [...new Set(teamMembers.map((m: any) => m.user_id))];

        // Fetch profiles for these users
        const { data: profiles, error: profilesErr } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, latitude, longitude')
          .in('id', userIds)
          .not('latitude', 'is', null)
          .not('longitude', 'is', null);
        
        if (profilesErr) throw profilesErr;

        // Create a map of user_id -> profile for quick lookup
        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

        // Map team members to locations
        const mapped = (teamMembers || [])
          .filter((m: any) => {
            const profile = profileMap.get(m.user_id);
            return profile && profile.latitude && profile.longitude;
          })
          .map((m: any) => {
            const profile = profileMap.get(m.user_id);
            return {
              id: profile.id,
              username: profile.username,
              avatar_url: profile.avatar_url,
              lat: profile.latitude,
              lng: profile.longitude,
              team_id: m.team_id,
            };
          }) as TeamMemberLocation[];

        setMembers(mapped);
      } catch (e) {
        console.error('Failed to fetch team locations', e);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();

    // Realtime updates: listen to profile location changes
    const channel = supabase
      .channel('team-profiles-location')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          const rec: any = payload.new;
          setMembers((prev) => {
            const idx = prev.findIndex((p) => p.id === rec.id);
            if (idx === -1) return prev;
            const updated = [...prev];
            updated[idx] = { ...updated[idx], lat: rec.latitude, lng: rec.longitude };
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { members, loading };
};
