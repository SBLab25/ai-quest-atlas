import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Users, Trophy, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ActivityItem {
  id: string;
  type: 'submission' | 'badge' | 'user_joined';
  user_name: string;
  user_avatar?: string;
  quest_title?: string;
  badge_name?: string;
  created_at: string;
  quest_id?: string;
}

export const LiveActivityFeed = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivity();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('activity-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Submissions'
        },
        () => {
          fetchRecentActivity();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'User Badges'
        },
        () => {
          fetchRecentActivity();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          fetchRecentActivity();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRecentActivity = async () => {
    try {
      const activities: ActivityItem[] = [];

      // Get recent submissions
      const { data: submissions } = await supabase
        .from('Submissions')
        .select(`
          id,
          created_at,
          quest_id,
          user_id,
          profiles!inner(username, full_name, avatar_url),
          Quests!inner(title)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (submissions) {
        submissions.forEach((sub: any) => {
          activities.push({
            id: `sub-${sub.id}`,
            type: 'submission',
            user_name: sub.profiles.full_name || sub.profiles.username || 'Anonymous',
            user_avatar: sub.profiles.avatar_url,
            quest_title: sub.Quests.title,
            quest_id: sub.quest_id,
            created_at: sub.created_at,
          });
        });
      }

      // Get recent badge awards
      const { data: badges } = await supabase
        .from('User Badges')
        .select(`
          id,
          earned_at,
          user_id,
          profiles!inner(username, full_name, avatar_url),
          Badges!inner(name)
        `)
        .order('earned_at', { ascending: false })
        .limit(5);

      if (badges) {
        badges.forEach((badge: any) => {
          activities.push({
            id: `badge-${badge.id}`,
            type: 'badge',
            user_name: badge.profiles.full_name || badge.profiles.username || 'Anonymous',
            user_avatar: badge.profiles.avatar_url,
            badge_name: badge.Badges.name,
            created_at: badge.earned_at,
          });
        });
      }

      // Get recent user joins
      const { data: newUsers } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      if (newUsers) {
        newUsers.forEach((user) => {
          activities.push({
            id: `user-${user.id}`,
            type: 'user_joined',
            user_name: user.full_name || user.username || 'Anonymous',
            user_avatar: user.avatar_url,
            created_at: user.created_at,
          });
        });
      }

      // Sort all activities by date
      activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setActivities(activities.slice(0, 10));
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'submission':
        return <MapPin className="h-4 w-4 text-blue-500" />;
      case 'badge':
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'user_joined':
        return <Users className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'submission':
        return (
          <span>
            submitted a quest:{' '}
            <span 
              className="font-medium cursor-pointer hover:underline"
              onClick={() => activity.quest_id && navigate(`/quest/${activity.quest_id}`)}
            >
              {activity.quest_title}
            </span>
          </span>
        );
      case 'badge':
        return (
          <span>
            earned the badge: <span className="font-medium">{activity.badge_name}</span>
          </span>
        );
      case 'user_joined':
        return <span>joined the community</span>;
      default:
        return <span>performed an action</span>;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Live Activity
          <Badge variant="secondary" className="ml-auto">
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length > 0 ? (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={activity.user_avatar} />
                  <AvatarFallback>
                    {activity.user_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user_name}</span>{' '}
                        {getActivityText(activity)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getTimeAgo(activity.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No recent activity</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};