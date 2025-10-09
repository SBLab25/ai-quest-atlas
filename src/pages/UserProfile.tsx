import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, User, Trophy, Calendar, Target, Grid3X3, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StreakDisplay } from '@/components/streak/StreakDisplay';
import ThemeToggleButton from '@/components/ui/theme-toggle-button';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { ProfileDropdown } from '@/components/navigation/ProfileDropdown';
import { UserPostsGrid } from '@/components/profile/UserPostsGrid';
import { QuestHistory } from '@/components/profile/QuestHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  interests: string[];
  created_at: string;
}

interface UserStats {
  totalSubmissions: number;
  totalBadges: number;
  completedQuests: number;
  joinDate: string;
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      // Redirect to own profile if viewing own ID
      if (currentUser && userId === currentUser.id) {
        navigate('/profile');
        return;
      }
      fetchUserProfile();
      fetchUserStats();
    }
  }, [userId, currentUser]);

  const fetchUserProfile = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, interests, created_at')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          toast({
            title: 'User Not Found',
            description: 'This user profile does not exist.',
            variant: 'destructive',
          });
          navigate('/community');
          return;
        }
        throw error;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user profile.',
        variant: 'destructive',
      });
      navigate('/community');
    }
  };

  const fetchUserStats = async () => {
    if (!userId) return;

    try {
      // Get submission count
      const { count: submissionCount, error: submissionError } = await supabase
        .from('Submissions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (submissionError) throw submissionError;

      // Get badge count
      const { count: badgeCount, error: badgeError } = await supabase
        .from('User Badges')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (badgeError) throw badgeError;

      // Get completed quests count (verified submissions)
      const { count: completedCount, error: completedError } = await supabase
        .from('Submissions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'verified');

      if (completedError) throw completedError;

      setStats({
        totalSubmissions: submissionCount || 0,
        totalBadges: badgeCount || 0,
        completedQuests: completedCount || 0,
        joinDate: profile?.created_at || new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user statistics.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">User Not Found</h2>
            <p className="text-muted-foreground mb-4">This user profile does not exist.</p>
            <Button onClick={() => navigate('/community')}>
              Back to Community
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b mb-8 rounded-b-xl shadow-sm">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/community')}
                className="flex items-center gap-2 hover:scale-105 transition-transform"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Community
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  User Profile
                </h1>
                <p className="text-sm text-muted-foreground">Explore {profile.username}'s adventures</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggleButton />
              <NotificationCenter />
              <StreakDisplay />
              <ProfileDropdown />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Profile Header */}
          <div className="lg:col-span-4">
            <Card className="overflow-hidden bg-gradient-to-r from-card via-card to-secondary/5 border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  {/* Profile Image */}
                  <div className="relative">
                    <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback className="text-2xl">
                        {profile.username?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Profile Info */}
                  <div className="flex-1 text-center md:text-left space-y-2">
                    <h2 className="text-3xl font-bold">{profile.username || 'Anonymous User'}</h2>
                    <p className="text-muted-foreground text-lg">@{profile.username || 'no-username'}</p>
                    <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Joined {new Date(profile.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-6 text-center">
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-primary">{stats?.totalSubmissions || 0}</div>
                      <div className="text-sm text-muted-foreground">Submissions</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-primary">{stats?.completedQuests || 0}</div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-primary">{stats?.totalBadges || 0}</div>
                      <div className="text-sm text-muted-foreground">Badges</div>
                    </div>
                  </div>
                </div>

                {/* Interests */}
                {profile.interests && profile.interests.length > 0 && (
                  <div className="mt-6">
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                      {profile.interests.map((interest, index) => (
                        <Badge key={index} variant="secondary" className="text-sm">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Content Tabs */}
          <div className="lg:col-span-4">
            <Tabs defaultValue="posts" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="posts" className="flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4" />
                  Posts
                </TabsTrigger>
                <TabsTrigger value="quests" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Quest History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="posts" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Grid3X3 className="h-5 w-5" />
                      Community Posts
                    </CardTitle>
                    <CardDescription>
                      Posts and submissions by {profile.username}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <UserPostsGrid userId={profile.id} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="quests" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Quest History
                    </CardTitle>
                    <CardDescription>
                      Completed quests and achievements by {profile.username}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <QuestHistory userId={profile.id} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;