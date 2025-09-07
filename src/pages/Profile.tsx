import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, User, Trophy, MapPin, Edit3, Save, X, Calendar, Target, Grid3X3, History, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { StreakDisplay } from '@/components/streak/StreakDisplay';
import ThemeToggleButton from '@/components/ui/theme-toggle-button';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { ProfileDropdown } from '@/components/navigation/ProfileDropdown';
import { ProfileImageUpload } from '@/components/profile/ProfileImageUpload';
import { UserPostsGrid } from '@/components/profile/UserPostsGrid';
import { QuestHistory } from '@/components/profile/QuestHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  location: string;
  interests: string[];
  created_at: string;
}

interface UserStats {
  totalSubmissions: number;
  totalBadges: number;
  completedQuests: number;
  joinDate: string;
}

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    location: '',
    interests: [] as string[],
  });

  const handleAvatarUpdate = (newImageUrl: string) => {
    setProfile(prev => prev ? { ...prev, avatar_url: newImageUrl } : null);
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchStats();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setFormData({
        username: data.username || '',
        full_name: data.full_name || '',
        location: data.location || '',
        interests: data.interests || [],
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile.',
        variant: 'destructive',
      });
    }
  };

  const fetchStats = async () => {
    try {
      // Get submission count
      const { count: submissionCount, error: submissionError } = await supabase
        .from('Submissions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      if (submissionError) throw submissionError;

      // Get badge count
      const { count: badgeCount, error: badgeError } = await supabase
        .from('User Badges')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      if (badgeError) throw badgeError;

      // Get completed quests count (verified submissions)
      const { count: completedCount, error: completedError } = await supabase
        .from('Submissions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .eq('status', 'verified');

      if (completedError) throw completedError;

      setStats({
        totalSubmissions: submissionCount || 0,
        totalBadges: badgeCount || 0,
        completedQuests: completedCount || 0,
        joinDate: user?.created_at || new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load statistics.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          full_name: formData.full_name,
          location: formData.location,
          interests: formData.interests,
        })
        .eq('id', user?.id);

      if (error) throw error;

      await fetchProfile();
      setIsEditing(false);
      toast({
        title: 'Success',
        description: 'Profile updated successfully.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      username: profile?.username || '',
      full_name: profile?.full_name || '',
      location: profile?.location || '',
      interests: profile?.interests || [],
    });
    setIsEditing(false);
  };

  const handleInterestAdd = (interest: string) => {
    if (interest.trim() && !formData.interests.includes(interest.trim())) {
      setFormData({
        ...formData,
        interests: [...formData.interests, interest.trim()],
      });
    }
  };

  const handleInterestRemove = (index: number) => {
    setFormData({
      ...formData,
      interests: formData.interests.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
                onClick={() => navigate('/home')}
                className="flex items-center gap-2 hover:scale-105 transition-transform"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Profile
                </h1>
                <p className="text-sm text-muted-foreground">Manage your account & showcase your adventures</p>
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
                  <div className="relative group">
                    <ProfileImageUpload
                      currentImageUrl={profile?.avatar_url}
                      userId={user?.id!}
                      userName={profile?.full_name}
                      onImageUpdate={handleAvatarUpdate}
                    />
                  </div>

                  {/* Profile Info */}
                  <div className="flex-1 text-center md:text-left space-y-2">
                    <h2 className="text-3xl font-bold">{profile?.full_name || 'Anonymous User'}</h2>
                    <p className="text-muted-foreground text-lg">@{profile?.username || 'no-username'}</p>
                    {profile?.location && (
                      <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {profile.location}
                      </div>
                    )}
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
                {profile?.interests && profile.interests.length > 0 && (
                  <div className="mt-6">
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                      {profile.interests.map((interest, index) => (
                        <Badge key={index} variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="posts" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 bg-muted/50">
                <TabsTrigger value="posts" className="flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4" />
                  Posts
                </TabsTrigger>
                <TabsTrigger value="quests" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Quest History
                </TabsTrigger>
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Edit Profile
                </TabsTrigger>
              </TabsList>

              <TabsContent value="posts" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Grid3X3 className="h-5 w-5 text-primary" />
                      Community Posts
                    </CardTitle>
                    <CardDescription>
                      Your shared adventures and memories
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <UserPostsGrid userId={user?.id!} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="quests" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5 text-primary" />
                      Quest History
                    </CardTitle>
                    <CardDescription>
                      Track your completed adventures and achievements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <QuestHistory userId={user?.id!} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="profile" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Profile Information
                      </CardTitle>
                      <CardDescription>
                        Update your public profile information
                      </CardDescription>
                    </div>
                    {!isEditing ? (
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="hover:scale-105 transition-transform">
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleCancel}>
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={saving} className="hover:scale-105 transition-transform">
                          <Save className="h-4 w-4 mr-2" />
                          {saving ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-6">

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Username</label>
                        {isEditing ? (
                          <Input
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            placeholder="Enter username"
                            className="transition-all duration-200 focus:scale-[1.02]"
                          />
                        ) : (
                          <p className="mt-1 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                            {profile?.username || 'Not set'}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Full Name</label>
                        {isEditing ? (
                          <Input
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            placeholder="Enter full name"
                            className="transition-all duration-200 focus:scale-[1.02]"
                          />
                        ) : (
                          <p className="mt-1 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                            {profile?.full_name || 'Not set'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location
                      </label>
                      {isEditing ? (
                        <Input
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          placeholder="Enter your location"
                          className="transition-all duration-200 focus:scale-[1.02]"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                          {profile?.location || 'Not set'}
                        </p>
                      )}
                    </div>

                    {/* Interests */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Interests
                      </label>
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2 min-h-[2rem] p-2 border rounded-lg bg-muted/20">
                            {formData.interests.map((interest, index) => (
                              <Badge key={index} variant="secondary" className="flex items-center gap-1 hover:scale-105 transition-transform">
                                {interest}
                                <X 
                                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                                  onClick={() => handleInterestRemove(index)}
                                />
                              </Badge>
                            ))}
                            {formData.interests.length === 0 && (
                              <span className="text-sm text-muted-foreground">Add interests below...</span>
                            )}
                          </div>
                          <Input
                            placeholder="Add an interest (press Enter)"
                            className="transition-all duration-200 focus:scale-[1.02]"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleInterestAdd(e.currentTarget.value);
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div className="mt-1 flex flex-wrap gap-2 p-2 bg-muted/20 rounded-lg min-h-[2rem]">
                          {profile?.interests?.length ? (
                            profile.interests.map((interest, index) => (
                              <Badge key={index} variant="secondary" className="hover:scale-105 transition-transform">
                                {interest}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No interests added</p>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start hover:scale-105 transition-all duration-200 hover:bg-primary/5"
                  onClick={() => navigate('/badges')}
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  View Badge Gallery
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start hover:scale-105 transition-all duration-200 hover:bg-primary/5"
                  onClick={() => navigate('/leaderboard')}
                >
                  <Target className="h-4 w-4 mr-2" />
                  View Leaderboard
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start hover:scale-105 transition-all duration-200 hover:bg-primary/5"
                  onClick={() => navigate('/home')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Browse Quests
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start hover:scale-105 transition-all duration-200 hover:bg-primary/5"
                  onClick={() => navigate('/community')}
                >
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  Community Feed
                </Button>
              </CardContent>
            </Card>

            {/* Member Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Member Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Member Since</span>
                  <span className="font-semibold text-sm">
                    {stats ? new Date(stats.joinDate).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric'
                    }) : 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Activity</span>
                  <span className="font-semibold text-sm">
                    {(stats?.totalSubmissions || 0) + (stats?.totalBadges || 0)} items
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;