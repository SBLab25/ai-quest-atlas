import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, User, Trophy, MapPin, Edit3, Save, X, Calendar, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { StreakDisplay } from '@/components/streak/StreakDisplay';
import ThemeToggleButton from '@/components/ui/theme-toggle-button';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { ProfileDropdown } from '@/components/navigation/ProfileDropdown';

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
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b mb-8">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/home')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Profile</h1>
                <p className="text-sm text-muted-foreground">Manage your account</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Your public profile information
                  </CardDescription>
                </div>
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCancel}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="text-lg">
                      {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{profile?.full_name || 'Anonymous User'}</h3>
                    <p className="text-muted-foreground">@{profile?.username || 'no-username'}</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Username</label>
                    {isEditing ? (
                      <Input
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="Enter username"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {profile?.username || 'Not set'}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Full Name</label>
                    {isEditing ? (
                      <Input
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="Enter full name"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {profile?.full_name || 'Not set'}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </label>
                  {isEditing ? (
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Enter your location"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {profile?.location || 'Not set'}
                    </p>
                  )}
                </div>

                {/* Interests */}
                <div>
                  <label className="text-sm font-medium">Interests</label>
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {formData.interests.map((interest, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {interest}
                            <X 
                              className="h-3 w-3 cursor-pointer" 
                              onClick={() => handleInterestRemove(index)}
                            />
                          </Badge>
                        ))}
                      </div>
                      <Input
                        placeholder="Add an interest (press Enter)"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleInterestAdd(e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-wrap gap-2">
                      {profile?.interests?.length ? (
                        profile.interests.map((interest, index) => (
                          <Badge key={index} variant="secondary">
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
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Submissions</span>
                  <span className="font-semibold">{stats?.totalSubmissions || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Completed Quests</span>
                  <span className="font-semibold">{stats?.completedQuests || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Badges Earned</span>
                  <span className="font-semibold">{stats?.totalBadges || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Member Since</span>
                  <span className="font-semibold">
                    {stats ? new Date(stats.joinDate).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/badges')}
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  View Badge Gallery
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/leaderboard')}
                >
                  <Target className="h-4 w-4 mr-2" />
                  View Leaderboard
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/home')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Browse Quests
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;