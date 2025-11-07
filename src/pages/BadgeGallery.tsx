import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Calendar as CalendarIcon, Coins, Award, RefreshCw, Sparkles, TrendingUp } from 'lucide-react';
import { Calendar as DayPickerCalendar } from '@/components/ui/calendar';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { addNewBadges } from '@/utils/addNewBadges';
import { TopNavbar } from '@/components/navigation/TopNavbar';
import { useUserBadges } from "@/hooks/useUserBadges";
import { usePoints } from "@/hooks/usePoints";
import { useBadgeAwarding } from "@/hooks/useBadgeAwarding";
import { useGamification } from '@/hooks/useGamification';
import { AchievementCard } from '@/components/gamification/AchievementCard';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  quest_id?: string;
}

interface UserBadge {
  id: string;
  badge_id: string;
  earned_at: string;
  badge: BadgeData;
}

const BadgeGallery = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [allBadges, setAllBadges] = useState<BadgeData[]>([]);
  const [loading, setLoading] = useState(true);
  const { points, loading: pointsLoading, recalculatePoints, getPointsHistory } = usePoints();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'exploration' | 'consistency' | 'creativity' | 'social'>('all');
  const [rarityFilter, setRarityFilter] = useState<'all' | 'common' | 'rare' | 'epic' | 'legendary'>('all');
  
  // Initialize badge awarding system
  useBadgeAwarding();
  
  // Get gamification data for achievements
  const { achievements, userAchievements, loading: achievementsLoading } = useGamification();

  const handleRecalculatePoints = async () => {
    try {
      await recalculatePoints();
      toast({
        title: 'Success',
        description: 'Points have been recalculated based on your activity history.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to recalculate points.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (user) {
      initializeBadges();
    }
  }, [user]);

  const initializeBadges = async () => {
    try {
      // First add new badges if they don't exist
      await addNewBadges();
    } catch (error) {
      // Badges might already exist, which is fine
      console.log('Badges already exist or error adding:', error);
    }
    // Then fetch all badges
    await fetchBadges();
  };

  const fetchBadges = async () => {
    try {
      // Fetch user's earned badges
      const { data: earnedBadges, error: earnedError } = await supabase
        .from('User Badges')
        .select(`
          id,
          badge_id,
          earned_at,
          badge:Badges(id, name, description, icon_url, quest_id)
        `)
        .eq('user_id', user?.id);

      if (earnedError) throw earnedError;

      // Fetch all available badges and de-duplicate by name
      const { data: badges, error: badgesError } = await supabase
        .from('Badges')
        .select('*')
        .order('name', { ascending: true });

      if (badgesError) throw badgesError;

      const deduped = (badges || []).reduce((acc: Record<string, BadgeData>, b: any) => {
        acc[(b.name || '').trim().toLowerCase()] = b;
        return acc;
      }, {});
      const uniqueBadges = Object.values(deduped) as BadgeData[];

      // Deduplicate earned badges by badge_id (keep most recent)
      const earnedMap = new Map<string, UserBadge>();
      (earnedBadges || []).forEach((eb: any) => {
        const existing = earnedMap.get(eb.badge_id);
        if (!existing || new Date(eb.earned_at) > new Date(existing.earned_at)) {
          earnedMap.set(eb.badge_id, eb as UserBadge);
        }
      });

      setUserBadges(Array.from(earnedMap.values()));
      setAllBadges(uniqueBadges);
    } catch (error) {
      console.error('Error fetching badges:', error);
      toast({
        title: 'Error',
        description: 'Failed to load badges.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getBadgeStatus = (badgeId: string) => {
    return userBadges.find(ub => ub.badge_id === badgeId);
  };

  // Achievement filtering logic
  const getUnlockedCount = (category?: string) => {
    const relevantAchievements = category 
      ? achievements.filter(a => a.category === category)
      : achievements;
    const unlockedIds = new Set(userAchievements.map(ua => ua.achievement_id));
    return relevantAchievements.filter(a => unlockedIds.has(a.id)).length;
  };

  const getTotalCount = (category?: string) => {
    return category 
      ? achievements.filter(a => a.category === category).length
      : achievements.length;
  };

  const filteredAchievements = achievements.filter(achievement => {
    const categoryMatch = categoryFilter === 'all' || achievement.category === categoryFilter;
    const rarityMatch = rarityFilter === 'all' || achievement.rarity === rarityFilter;
    return categoryMatch && rarityMatch;
  });

  const unlockedIds = new Set(userAchievements.map(ua => ua.achievement_id));
  const unlockedAchievements = filteredAchievements.filter(a => unlockedIds.has(a.id));
  const lockedAchievements = filteredAchievements.filter(a => !unlockedIds.has(a.id));

  const achievementProgressPercentage = achievements.length > 0 
    ? (getUnlockedCount() / getTotalCount()) * 100 
    : 0;

  if (loading || achievementsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <TopNavbar />
      
      <main className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl">
              <Trophy className="w-10 h-10 text-yellow-600" />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-600 bg-clip-text text-transparent mb-4">
            Treasure Vault
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your collection of badges, achievements, and points earned throughout your journey
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-yellow-500/10 hover:shadow-lg transition-all duration-300 cursor-help hover:scale-105">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-yellow-500/10 rounded-full animate-pulse">
                        <Coins className="h-6 w-6 text-yellow-500" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-yellow-600 animate-fade-in">
                          {pointsLoading ? '...' : points.total_points.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">Current Score</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent 
                side="bottom" 
                className="p-4 max-w-xs bg-card/95 backdrop-blur-sm border-yellow-500/20 shadow-xl"
              >
                <div className="space-y-3 animate-fade-in">
                  <h4 className="font-semibold text-yellow-600 flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Points History
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center p-2 bg-blue-500/10 rounded border border-blue-500/20">
                      <span>Daily Visits</span>
                      <span className="font-semibold text-blue-600">+{points.daily_visit_points}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-green-500/10 rounded border border-green-500/20">
                      <span>Quest Completions</span>
                      <span className="font-semibold text-green-600">+{points.quest_completion_points}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-purple-500/10 rounded border border-purple-500/20">
                      <span>Exercise Quota</span>
                      <span className="font-semibold text-purple-600">+{points.exercise_quota_points}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-orange-500/10 rounded border border-orange-500/20">
                      <span>Streak Bonus</span>
                      <span className="font-semibold text-orange-600">+{points.streak_bonus_points}</span>
                    </div>
                  </div>
                  <div className="border-t pt-2 mt-3">
                    <div className="flex justify-between items-center font-semibold text-yellow-600">
                      <span>Total Score</span>
                      <span>{points.total_points.toLocaleString()}</span>
                    </div>
                  </div>
                  {points.last_quest_date && (
                    <p className="text-xs text-muted-foreground text-center">
                      Last activity: {new Date(points.last_quest_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{new Set(userBadges.map(b => b.badge_id)).size}</p>
                  <p className="text-sm text-muted-foreground">Earned Badges</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-secondary/20 bg-gradient-to-br from-secondary/5 to-secondary/10 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-secondary/10 rounded-full">
                  <Award className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{allBadges.length}</p>
                  <p className="text-sm text-muted-foreground">Total Available</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-accent/10 rounded-full">
                  <Trophy className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-3xl font-bold">
                    {Math.round((new Set(userBadges.map(b => b.badge_id)).size / Math.max(allBadges.length, 1)) * 100)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Badge Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-purple-500/10 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-500/10 rounded-full">
                  <Sparkles className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-3xl font-bold">
                    {getUnlockedCount()} / {getTotalCount()}
                  </p>
                  <p className="text-sm text-muted-foreground">Achievements</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Points Breakdown */}
        <Card className="mb-12 border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-yellow-500/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-yellow-500" />
                  Points Breakdown
                </CardTitle>
                <CardDescription>How you've earned your points</CardDescription>
              </div>
              <div className="flex items-center gap-2">
              <Button 
                onClick={handleRecalculatePoints} 
                variant="outline" 
                size="sm"
                disabled={pointsLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${pointsLoading ? 'animate-spin' : ''}`} />
                Recalculate
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setCalendarOpen(v => !v)} title="Points calendar">
                <CalendarIcon className="h-5 w-5" />
              </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="text-lg font-semibold text-blue-600">+1</div>
                <div className="text-sm text-muted-foreground">Daily Visit</div>
                <div className="text-xs mt-1 font-medium">{points.daily_visit_points} earned</div>
              </div>
              <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="text-lg font-semibold text-green-600">+10</div>
                <div className="text-sm text-muted-foreground">Quest Complete</div>
                <div className="text-xs mt-1 font-medium">{points.quest_completion_points} earned</div>
              </div>
              <div className="text-center p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <div className="text-lg font-semibold text-purple-600">+5</div>
                <div className="text-sm text-muted-foreground">Exercise Quota</div>
                <div className="text-xs mt-1 font-medium">{points.exercise_quota_points} earned</div>
              </div>
              <div className="text-center p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                <div className="text-lg font-semibold text-orange-600">+10/+50</div>
                <div className="text-sm text-muted-foreground">Streak Bonus</div>
                <div className="text-xs mt-1 font-medium">{points.streak_bonus_points} earned</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {calendarOpen && (
          <div className="relative mb-8">
            <div className="absolute right-0 z-50 w-[360px] sm:w-[420px] bg-popover border rounded-xl shadow-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Points Calendar</p>
                <Button size="sm" variant="ghost" onClick={() => setCalendarOpen(false)}>Close</Button>
              </div>
              <PointsCalendar history={getPointsHistory()} />
            </div>
          </div>
        )}

        {/* Tabbed Content */}
        <Tabs defaultValue="badges" className="mb-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="badges" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Badges
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Achievements
            </TabsTrigger>
          </TabsList>

          {/* BADGES TAB */}
          <TabsContent value="badges" className="space-y-12">
            {/* Earned Badges */}
            {userBadges.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                  Your Badges
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userBadges.map((userBadge) => (
                    <Card key={userBadge.id} className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      <CardHeader className="text-center">
                        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full flex items-center justify-center mb-4 shadow-lg">
                          {userBadge.badge.icon_url ? (
                            userBadge.badge.icon_url.startsWith('http') ? (
                              <img 
                                src={userBadge.badge.icon_url} 
                                alt={userBadge.badge.name}
                                className="w-8 h-8"
                              />
                            ) : (
                              <span className="text-3xl">{userBadge.badge.icon_url}</span>
                            )
                          ) : (
                            <Trophy className="h-8 w-8 text-primary" />
                          )}
                        </div>
                        <CardTitle className="text-xl font-bold">{userBadge.badge.name}</CardTitle>
                        <CardDescription className="text-base">{userBadge.badge.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center">
                          <Badge className="mb-3 bg-gradient-to-r from-primary to-primary/80 text-white border-0">
                            ✨ Achieved
                          </Badge>
                          <p className="text-sm text-muted-foreground font-medium">
                            Earned on {new Date(userBadge.earned_at).toLocaleDateString()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* All Badges */}
            <div>
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                <div className="p-2 bg-muted/30 rounded-full">
                  <Trophy className="h-6 w-6 text-muted-foreground" />
                </div>
                Complete Badge Collection
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allBadges.map((badge) => {
                  const earnedBadge = getBadgeStatus(badge.id);
                  const isEarned = !!earnedBadge;
              
              return (
                <Card 
                  key={badge.id} 
                  className={`transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg ${
                    isEarned 
                      ? 'border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 shadow-md' 
                      : 'opacity-60 hover:opacity-80 border-muted/50 hover:border-border'
                  }`}
                >
                  <CardHeader className="text-center">
                    <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-md ${
                      isEarned ? 'bg-gradient-to-br from-primary/10 to-primary/20' : 'bg-muted/50'
                    }`}>
                       {badge.icon_url ? (
                         badge.icon_url.startsWith('http') ? (
                           <img 
                             src={badge.icon_url} 
                             alt={badge.name}
                             className={`w-8 h-8 ${!isEarned ? 'grayscale' : ''}`}
                           />
                         ) : (
                           <span className={`text-3xl ${!isEarned ? 'grayscale opacity-50' : ''}`}>
                             {badge.icon_url}
                           </span>
                         )
                       ) : (
                         <Trophy className={`h-8 w-8 ${isEarned ? 'text-primary' : 'text-muted-foreground'}`} />
                       )}
                    </div>
                    <CardTitle className="text-xl font-bold">{badge.name}</CardTitle>
                    <CardDescription className="text-base">{badge.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <Badge 
                        variant={isEarned ? "default" : "outline"}
                        className={`mb-3 ${isEarned ? 'bg-gradient-to-r from-primary to-primary/80 text-white' : ''}`}
                      >
                        {isEarned ? '✨ Achieved' : '🔒 Locked'}
                      </Badge>
                      {isEarned && earnedBadge && (
                        <p className="text-sm text-muted-foreground font-medium">
                          Earned on {new Date(earnedBadge.earned_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
              </div>
            </div>
          </TabsContent>

          {/* ACHIEVEMENTS TAB */}
          <TabsContent value="achievements" className="space-y-8">
            {/* Achievement Progress Card */}
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  Overall Achievement Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">{getUnlockedCount()} / {getTotalCount()}</span>
                    <span className="text-sm text-muted-foreground">{achievementProgressPercentage.toFixed(0)}% Complete</span>
                  </div>
                  <Progress value={achievementProgressPercentage} className="h-3" />
                  
                  {/* Category Breakdown */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                    <div className="text-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <div className="text-xl mb-1">🗺️</div>
                      <div className="text-sm font-semibold">{getUnlockedCount('exploration')} / {getTotalCount('exploration')}</div>
                      <div className="text-xs text-muted-foreground">Exploration</div>
                    </div>
                    <div className="text-center p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                      <div className="text-xl mb-1">🔥</div>
                      <div className="text-sm font-semibold">{getUnlockedCount('consistency')} / {getTotalCount('consistency')}</div>
                      <div className="text-xs text-muted-foreground">Consistency</div>
                    </div>
                    <div className="text-center p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                      <div className="text-xl mb-1">🎨</div>
                      <div className="text-sm font-semibold">{getUnlockedCount('creativity')} / {getTotalCount('creativity')}</div>
                      <div className="text-xs text-muted-foreground">Creativity</div>
                    </div>
                    <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                      <div className="text-xl mb-1">👥</div>
                      <div className="text-sm font-semibold">{getUnlockedCount('social')} / {getTotalCount('social')}</div>
                      <div className="text-xs text-muted-foreground">Social</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filters */}
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={categoryFilter === 'all' ? 'default' : 'outline'}
                  className="cursor-pointer hover:shadow-md transition-all"
                  onClick={() => setCategoryFilter('all')}
                >
                  All Categories
                </Badge>
                <Badge
                  variant={categoryFilter === 'exploration' ? 'default' : 'outline'}
                  className="cursor-pointer hover:shadow-md transition-all"
                  onClick={() => setCategoryFilter('exploration')}
                >
                  🗺️ Exploration
                </Badge>
                <Badge
                  variant={categoryFilter === 'consistency' ? 'default' : 'outline'}
                  className="cursor-pointer hover:shadow-md transition-all"
                  onClick={() => setCategoryFilter('consistency')}
                >
                  🔥 Consistency
                </Badge>
                <Badge
                  variant={categoryFilter === 'creativity' ? 'default' : 'outline'}
                  className="cursor-pointer hover:shadow-md transition-all"
                  onClick={() => setCategoryFilter('creativity')}
                >
                  🎨 Creativity
                </Badge>
                <Badge
                  variant={categoryFilter === 'social' ? 'default' : 'outline'}
                  className="cursor-pointer hover:shadow-md transition-all"
                  onClick={() => setCategoryFilter('social')}
                >
                  👥 Social
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={rarityFilter === 'all' ? 'default' : 'outline'}
                  className="cursor-pointer hover:shadow-md transition-all"
                  onClick={() => setRarityFilter('all')}
                >
                  All Rarities
                </Badge>
                <Badge
                  variant={rarityFilter === 'common' ? 'default' : 'outline'}
                  className="cursor-pointer hover:shadow-md transition-all bg-gray-500/10 text-gray-600 border-gray-500/20"
                  onClick={() => setRarityFilter('common')}
                >
                  Common
                </Badge>
                <Badge
                  variant={rarityFilter === 'rare' ? 'default' : 'outline'}
                  className="cursor-pointer hover:shadow-md transition-all bg-blue-500/10 text-blue-600 border-blue-500/20"
                  onClick={() => setRarityFilter('rare')}
                >
                  Rare
                </Badge>
                <Badge
                  variant={rarityFilter === 'epic' ? 'default' : 'outline'}
                  className="cursor-pointer hover:shadow-md transition-all bg-purple-500/10 text-purple-600 border-purple-500/20"
                  onClick={() => setRarityFilter('epic')}
                >
                  Epic
                </Badge>
                <Badge
                  variant={rarityFilter === 'legendary' ? 'default' : 'outline'}
                  className="cursor-pointer hover:shadow-md transition-all bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                  onClick={() => setRarityFilter('legendary')}
                >
                  Legendary
                </Badge>
              </div>
            </div>

            {/* Unlocked Achievements */}
            {unlockedAchievements.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  Unlocked Achievements ({unlockedAchievements.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {unlockedAchievements.map((achievement) => {
                    const userAchievement = userAchievements.find(ua => ua.achievement_id === achievement.id);
                    return (
                      <AchievementCard
                        key={achievement.id}
                        achievement={achievement}
                        unlocked={true}
                        unlockedAt={userAchievement?.unlocked_at}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Locked Achievements */}
            {lockedAchievements.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-muted-foreground">
                  <Trophy className="h-5 w-5" />
                  Locked Achievements ({lockedAchievements.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {lockedAchievements.map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      achievement={achievement}
                      unlocked={false}
                    />
                  ))}
                </div>
              </div>
            )}

            {unlockedAchievements.length === 0 && lockedAchievements.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">No achievements found</p>
                  <p className="text-sm text-muted-foreground/70 mt-2">Complete quests to start earning achievements!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default BadgeGallery;

function PointsCalendar({ history }: { history: Record<string, { total: number; daily: number; quest: number; exercise: number; streak: number; }> }) {
  const [month, setMonth] = useState<Date>(new Date());
  const getTitle = (date: Date) => {
    const key = date.toISOString().slice(0,10);
    const h = history[key];
    if (!h) return undefined;
    return `Total: ${h.total}\nDaily: +${h.daily}\nQuests: +${h.quest}\nExercise: +${h.exercise}\nStreak: +${h.streak}`;
  };
  return (
    <div>
      <DayPickerCalendar
        month={month}
        onMonthChange={setMonth}
        showOutsideDays
      />
      <div className="grid grid-cols-7 gap-1 mt-2 text-xs text-muted-foreground">
        {Array.from({ length: 42 }).map((_, idx) => {
          const first = new Date(month.getFullYear(), month.getMonth(), 1);
          const dayOfWeek = first.getDay();
          const date = new Date(first);
          date.setDate(1 - dayOfWeek + idx);
          const title = getTitle(date);
          const isCurrent = date.getMonth() === month.getMonth();
          return (
            <div key={idx} title={title} className={`h-6 rounded ${title ? 'bg-primary/10' : 'bg-transparent'} ${isCurrent ? '' : 'opacity-40'}`}></div>
          );
        })}
      </div>
    </div>
  );
}