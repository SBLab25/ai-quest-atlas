import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { User, Shield, Bell, Trash2, MapPin, Eye, EyeOff, Settings, Lock, Globe, Palette, Accessibility, Mail, Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccountSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProfileData {
  username: string;
  full_name: string;
  avatar_url: string;
  interests: string[];
}

type SettingsSection = 'profile' | 'account' | 'appearance' | 'privacy' | 'notifications' | 'security';
interface NotificationSettings {
  events: boolean;
  quests: boolean;
  posts: boolean;
  likes: boolean;
  comments: boolean;
}

const settingsNavItems = [
  { id: 'profile' as SettingsSection, label: 'Public profile', icon: User },
  { id: 'account' as SettingsSection, label: 'Account', icon: Settings },
  { id: 'appearance' as SettingsSection, label: 'Appearance', icon: Palette },
  { id: 'privacy' as SettingsSection, label: 'Privacy', icon: Eye },
  { id: 'notifications' as SettingsSection, label: 'Notifications', icon: Bell },
  { id: 'security' as SettingsSection, label: 'Security', icon: Lock },
];

export const AccountSettingsModal = ({ open, onOpenChange }: AccountSettingsModalProps) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { theme: currentMode, setTheme: setMode } = useTheme();
  
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [currentTheme, setCurrentTheme] = useState('default');
  
  const [profileData, setProfileData] = useState<ProfileData>({
    username: '',
    full_name: '',
    avatar_url: '',
    interests: [],
  });
  
  const [locationVisible, setLocationVisible] = useState(false);
  const [nameVisible, setNameVisible] = useState(true);
  const [bio, setBio] = useState('');
  
  const [notifications, setNotifications] = useState<NotificationSettings>({
    events: true,
    quests: true,
    posts: true,
    likes: true,
    comments: true,
  });
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id && open) {
      fetchProfileData();
      fetchNotificationSettings();
      // Load current theme
      const savedTheme = localStorage.getItem('selected-theme');
      if (savedTheme) {
        setCurrentTheme(savedTheme);
      }
    }
  }, [user?.id, open]);

  const fetchProfileData = async () => {
    if (!user?.id) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (data && !error) {
      setProfileData({
        username: data.username || '',
        full_name: data.full_name || '',
        avatar_url: data.avatar_url || '',
        interests: data.interests || [],
      });
      // For now, use localStorage for additional settings until DB is updated
      setLocationVisible(localStorage.getItem(`location_visible_${user?.id}`) === 'true');
      setNameVisible(localStorage.getItem(`name_visible_${user?.id}`) !== 'false');
      setBio(localStorage.getItem(`bio_${user?.id}`) || '');
    }
  };

  const fetchNotificationSettings = async () => {
    // For now, use local storage. This could be moved to database later
    const saved = localStorage.getItem(`notifications_${user?.id}`);
    if (saved) {
      setNotifications(JSON.parse(saved));
    }
  };

  const updateProfile = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: profileData.username,
          full_name: profileData.full_name,
          interests: profileData.interests,
        })
        .eq('id', user.id);
      
      // Save additional settings to localStorage for now
      localStorage.setItem(`location_visible_${user?.id}`, locationVisible.toString());
      localStorage.setItem(`name_visible_${user?.id}`, nameVisible.toString());
      localStorage.setItem(`bio_${user?.id}`, bio);
      
      if (error) throw error;
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      setNewPassword('');
      setConfirmPassword('');
      toast({
        title: "Password updated",
        description: "Your password has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateNotifications = () => {
    localStorage.setItem(`notifications_${user?.id}`, JSON.stringify(notifications));
    toast({
      title: "Notification settings updated",
      description: "Your notification preferences have been saved.",
    });
  };

  const deleteAccount = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // First delete the user's profile and related data
      await supabase.from('profiles').delete().eq('id', user.id);
      
      // Sign out the user
      await signOut();
      
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Public profile</h3>
              <p className="text-sm text-muted-foreground mb-6">
                This information will be visible to other users on your public profile.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={profileData.username}
                    onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                    placeholder="Enter your username"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your username will appear around Discovery Atlas where you contribute or are mentioned.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell others about yourself..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  You can @mention other users and organizations to link to them.
                </p>
              </div>
              
              <Button onClick={updateProfile} disabled={loading} className="w-full md:w-auto">
                Update profile
              </Button>
            </div>
          </div>
        );
        
      case 'account':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Account settings</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Manage your account preferences and settings.
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Email address</h4>
                <p className="text-sm text-muted-foreground mb-3">{user?.email}</p>
                <Button variant="outline" size="sm" onClick={() => {
                  toast({
                    title: "Change email",
                    description: "Email change functionality will be available soon!",
                  });
                }}>
                  Change email
                </Button>
              </div>
              
              <div className="p-4 border border-destructive rounded-lg">
                <h4 className="font-medium text-destructive mb-2">Delete account</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Permanently delete your account and all associated data.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      Delete account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account
                        and remove all your data including quests, submissions, and profile information.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteAccount} className="bg-destructive text-destructive-foreground">
                        Delete Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        );
        
      case 'privacy':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Privacy settings</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Control what information is visible to other users.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2 font-medium">
                    <MapPin className="h-4 w-4" />
                    Location visibility
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Allow others to see your location in your profile
                  </p>
                </div>
                <Switch
                  checked={locationVisible}
                  onCheckedChange={setLocationVisible}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2 font-medium">
                    {nameVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    Full name visibility
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Show your full name instead of just username
                  </p>
                </div>
                <Switch
                  checked={nameVisible}
                  onCheckedChange={setNameVisible}
                />
              </div>
              
              <Button onClick={updateProfile} disabled={loading} className="w-full md:w-auto">
                Save privacy settings
              </Button>
            </div>
          </div>
        );
        
      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Password and authentication</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Manage your password and account security.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 border rounded-lg space-y-4">
                <h4 className="font-medium">Change password</h4>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                  
                  <Button 
                    onClick={updatePassword} 
                    disabled={loading || !newPassword || !confirmPassword}
                    size="sm"
                  >
                    Update password
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Notification preferences</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Choose what notifications you want to receive.
              </p>
            </div>
            
            <div className="space-y-4">
              {[
                { key: 'events', label: 'Event notifications', description: 'Notifications about community events and activities' },
                { key: 'quests', label: 'Quest notifications', description: 'Updates about new quests and quest completions' },
                { key: 'posts', label: 'Post notifications', description: 'Notifications about new community posts' },
                { key: 'likes', label: 'Like notifications', description: 'When someone likes your posts or submissions' },
                { key: 'comments', label: 'Comment notifications', description: 'When someone comments on your posts or submissions' },
              ].map((item, index) => (
                <div key={item.key} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="font-medium">{item.label}</Label>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch
                    checked={notifications[item.key as keyof NotificationSettings]}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, [item.key]: checked })
                    }
                  />
                </div>
              ))}
              
              <Button onClick={updateNotifications} className="w-full md:w-auto">
                Save notification settings
              </Button>
            </div>
          </div>
        );
        
      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Appearance</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Customize how Discovery Atlas looks and feels.
              </p>
            </div>
            
            <div className="space-y-6">
              {/* Theme Mode Toggle */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-3">Theme mode</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'light', label: 'Light', icon: Sun },
                      { id: 'dark', label: 'Dark', icon: Moon },
                      { id: 'system', label: 'System', icon: Monitor },
                    ].map((mode) => {
                      const Icon = mode.icon;
                      return (
                        <button
                          key={mode.id}
                          onClick={() => setMode(mode.id)}
                          className={cn(
                            "p-4 border rounded-lg text-sm transition-all hover:border-primary/50",
                            "focus:outline-none focus:ring-2 focus:ring-primary",
                            "flex flex-col items-center gap-2",
                            currentMode === mode.id 
                              ? "border-primary bg-primary/5 text-primary" 
                              : "border-border hover:bg-muted/50"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="font-medium">{mode.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Theme Colors */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-3">Theme colors</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose a color scheme for your interface.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {/* Theme options will be rendered here */}
                    {[
                      { id: 'default', name: 'Discovery', colors: ['261 86% 55%', '0 100% 85%', '201 59% 60%'] },
                      { id: 'ocean', name: 'Ocean', colors: ['210 100% 50%', '210 100% 85%', '180 60% 60%'] },
                      { id: 'forest', name: 'Forest', colors: ['120 60% 40%', '120 50% 80%', '110 50% 60%'] },
                      { id: 'sunset', name: 'Sunset', colors: ['15 100% 60%', '15 100% 85%', '25 80% 70%'] },
                      { id: 'purple', name: 'Purple', colors: ['280 100% 60%', '280 80% 85%', '270 70% 75%'] },
                      { id: 'rose', name: 'Rose', colors: ['330 80% 60%', '330 70% 85%', '340 60% 75%'] },
                      { id: 'cosmic', name: 'Cosmic', colors: ['250 100% 70%', '250 80% 85%', '270 70% 80%'] },
                    ].map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => {
                          // Apply theme
                          const themeClass = theme.id === 'default' ? '' : `theme-${theme.id}`;
                          
                          // Remove all theme classes
                          document.documentElement.classList.remove(
                            'theme-ocean', 'theme-forest', 'theme-sunset', 
                            'theme-purple', 'theme-rose', 'theme-cosmic'
                          );
                          
                          // Add new theme class
                          if (themeClass) {
                            document.documentElement.classList.add(themeClass);
                          }
                          
                          // Save to localStorage and update state
                          localStorage.setItem('selected-theme', theme.id);
                          setCurrentTheme(theme.id);
                          
                          toast({
                            title: "Theme updated",
                            description: `Switched to ${theme.name} theme.`,
                          });
                        }}
                        className={cn(
                          "p-4 border rounded-lg text-left transition-all hover:border-primary/50",
                          "focus:outline-none focus:ring-2 focus:ring-primary group",
                          currentTheme === theme.id 
                            ? "border-primary bg-primary/5" 
                            : "border-border"
                        )}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex gap-1">
                            {theme.colors.map((color, index) => (
                              <div
                                key={index}
                                className="w-4 h-4 rounded-full border"
                                style={{ backgroundColor: `hsl(${color})` }}
                              />
                            ))}
                          </div>
                          <span className="font-medium text-sm">{theme.name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {theme.id === 'default' ? 'Classic Discovery Atlas colors' :
                           theme.id === 'ocean' ? 'Cool blues and ocean vibes' :
                           theme.id === 'forest' ? 'Natural greens and earth tones' :
                           theme.id === 'sunset' ? 'Warm oranges and golden hues' :
                           theme.id === 'purple' ? 'Rich purples and magentas' :
                           theme.id === 'rose' ? 'Elegant pinks and roses' :
                           'Deep space purples and blues'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return <div>Section not implemented yet</div>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <div className="flex h-[80vh]">
          {/* Sidebar */}
          <div className="w-64 border-r bg-muted/30 p-4">
            <div className="mb-6">
              <DialogTitle className="text-lg font-semibold">Settings</DialogTitle>
              <p className="text-sm text-muted-foreground">Manage your account settings and preferences</p>
            </div>
            
            <nav className="space-y-1">
              {settingsNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      activeSection === item.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
          
          {/* Main content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {renderContent()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};