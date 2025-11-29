import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useThemes } from '@/hooks/useThemes';
import { Settings, Palette, Bell, Accessibility, Volume2, Zap, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserPreferencesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Preferences {
  animations: boolean;
  soundEffects: boolean;
  soundVolume: number;
  reducedMotion: boolean;
  autoplay: boolean;
  notifications: boolean;
  fontSize: number;
  highContrast: boolean;
}

export const UserPreferencesModal = ({ open, onOpenChange }: UserPreferencesModalProps) => {
  const { toast } = useToast();
  const { currentTheme, setTheme, themeOptions, mode, toggleMode } = useThemes();

  const [preferences, setPreferences] = useState<Preferences>({
    animations: true,
    soundEffects: true,
    soundVolume: 70,
    reducedMotion: false,
    autoplay: true,
    notifications: true,
    fontSize: 100,
    highContrast: false,
  });

  useEffect(() => {
    if (open) {
      loadPreferences();
    }
  }, [open]);

  const loadPreferences = () => {
    const saved = localStorage.getItem('user_preferences');
    if (saved) {
      setPreferences(JSON.parse(saved));
    }
  };

  const savePreferences = () => {
    localStorage.setItem('user_preferences', JSON.stringify(preferences));
    
    // Apply preferences
    document.documentElement.style.fontSize = `${preferences.fontSize}%`;
    
    if (preferences.reducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }

    if (preferences.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    toast({
      title: 'Preferences saved',
      description: 'Your preferences have been updated successfully.',
    });
  };

  const updatePreference = <K extends keyof Preferences>(
    key: K,
    value: Preferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" aria-labelledby="preferences-title">
        <DialogHeader>
          <DialogTitle id="preferences-title" className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            User Preferences
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Theme Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Theme & Appearance</h3>
            </div>

            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-0.5">
                <Label className="font-medium">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark theme
                </p>
              </div>
              <Switch
                checked={mode === 'dark'}
                onCheckedChange={toggleMode}
                aria-label="Toggle dark mode"
              />
            </div>

            {/* Theme Colors */}
            <div className="space-y-2">
              <Label>Color Theme</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {themeOptions.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setTheme(theme.id)}
                    className={cn(
                      'p-4 border-2 rounded-lg transition-all hover:scale-105',
                      currentTheme === theme.id ? 'border-primary' : 'border-border'
                    )}
                    aria-label={`Select ${theme.name} theme`}
                    aria-pressed={currentTheme === theme.id}
                  >
                    <div className="flex gap-2 mb-2">
                      {['primary', 'secondary', 'accent'].map((key) => (
                        <div
                          key={key}
                          className="w-6 h-6 rounded-full"
                          style={{
                            backgroundColor: theme.colors[key as keyof typeof theme.colors]
                          }}
                        />
                      ))}
                    </div>
                    <p className="font-medium text-sm">{theme.name}</p>
                    <p className="text-xs text-muted-foreground">{theme.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Accessibility */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Accessibility className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Accessibility</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="font-medium">Reduced Motion</Label>
                  <p className="text-sm text-muted-foreground">
                    Minimize animations and transitions
                  </p>
                </div>
                <Switch
                  checked={preferences.reducedMotion}
                  onCheckedChange={(value) => updatePreference('reducedMotion', value)}
                  aria-label="Toggle reduced motion"
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="font-medium">High Contrast</Label>
                  <p className="text-sm text-muted-foreground">
                    Increase contrast for better visibility
                  </p>
                </div>
                <Switch
                  checked={preferences.highContrast}
                  onCheckedChange={(value) => updatePreference('highContrast', value)}
                  aria-label="Toggle high contrast"
                />
              </div>

              <div className="space-y-2 p-3 border rounded-lg">
                <Label>Font Size: {preferences.fontSize}%</Label>
                <Slider
                  value={[preferences.fontSize]}
                  onValueChange={(value) => updatePreference('fontSize', value[0])}
                  min={75}
                  max={150}
                  step={5}
                  className="w-full"
                  aria-label="Adjust font size"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Sound & Effects */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Sound & Effects</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="font-medium">Animations</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable page transitions and effects
                  </p>
                </div>
                <Switch
                  checked={preferences.animations}
                  onCheckedChange={(value) => updatePreference('animations', value)}
                  aria-label="Toggle animations"
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="font-medium">Sound Effects</Label>
                  <p className="text-sm text-muted-foreground">
                    Play sounds for notifications and actions
                  </p>
                </div>
                <Switch
                  checked={preferences.soundEffects}
                  onCheckedChange={(value) => updatePreference('soundEffects', value)}
                  aria-label="Toggle sound effects"
                />
              </div>

              {preferences.soundEffects && (
                <div className="space-y-2 p-3 border rounded-lg">
                  <Label>Volume: {preferences.soundVolume}%</Label>
                  <Slider
                    value={[preferences.soundVolume]}
                    onValueChange={(value) => updatePreference('soundVolume', value[0])}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                    aria-label="Adjust volume"
                  />
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Behavior */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Behavior</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="font-medium">Auto-play Media</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically play videos and animations
                  </p>
                </div>
                <Switch
                  checked={preferences.autoplay}
                  onCheckedChange={(value) => updatePreference('autoplay', value)}
                  aria-label="Toggle auto-play"
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="font-medium">Browser Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications in your browser
                  </p>
                </div>
                <Switch
                  checked={preferences.notifications}
                  onCheckedChange={(value) => updatePreference('notifications', value)}
                  aria-label="Toggle notifications"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={savePreferences} className="flex-1">
              Save Preferences
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
