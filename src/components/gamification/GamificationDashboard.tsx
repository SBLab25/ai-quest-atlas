import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Calendar, Zap, Star, Clock } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';
import { usePoints } from '@/hooks/usePoints';
import { ChallengeCard } from './ChallengeCard';
import { AchievementCard } from './AchievementCard';
import { PowerUpInventory } from './PowerUpInventory';
import { PowerUpShop } from './PowerUpShop';
import { EventBanner } from './EventBanner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export const GamificationDashboard = () => {
  const {
    userAchievements,
    challenges,
    userChallenges,
    events,
    loading,
    userPowerUps,
    getActivePowerUps,
  } = useGamification();
  
  // Use points as XP (synced across all tabs)
  const { points, loading: pointsLoading, refetchPoints } = usePoints();
  const xp = points.total_points;

  // Listen for points updates to refresh when admin credits them
  useEffect(() => {
    const handlePointsUpdate = (e: CustomEvent) => {
      refetchPoints();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('user_points_')) {
        refetchPoints();
      }
    };

    window.addEventListener('pointsUpdated', handlePointsUpdate as EventListener);
    window.addEventListener('storage', handleStorageChange);
    
    // Poll for updates every 5 seconds as fallback (less frequent to reduce load)
    const interval = setInterval(() => {
      refetchPoints();
    }, 5000);

    return () => {
      window.removeEventListener('pointsUpdated', handlePointsUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [refetchPoints]);
  const level = Math.floor(xp / 100) + 1;

  const [dailyResetTime, setDailyResetTime] = useState('');
  const [weeklyResetTime, setWeeklyResetTime] = useState('');

  const getXPForNextLevel = (currentLevel: number) => currentLevel * 100;
  const xpForNextLevel = getXPForNextLevel(level);
  const xpProgress = ((xp % 100) / 100) * 100;

  // Filter out expired challenges and ensure they're active
  const now = new Date();
  const activeChallenges = challenges.filter(c => {
    // Check if challenge is active and not expired
    const isActive = c.is_active;
    const isNotExpired = new Date(c.end_date) > now;
    return isActive && isNotExpired;
  });
  
  // Filter daily challenges (only show non-expired ones)
  const dailyChallenges = activeChallenges.filter(c => c.type === 'daily');
  
  // Filter weekly challenges (only show non-expired ones)
  const weeklyChallenges = activeChallenges.filter(c => c.type === 'weekly');
  const recentAchievements = userAchievements.slice(0, 6);

  // Calculate time until next reset (IST)
  useEffect(() => {
    const updateResetTimes = () => {
      const now = new Date();
      // IST is UTC+5:30
      const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
      const nowIST = new Date(now.getTime() + istOffset);
      
      // Daily reset at midnight IST
      const istYear = nowIST.getUTCFullYear();
      const istMonth = nowIST.getUTCMonth();
      const istDate = nowIST.getUTCDate();
      const midnightIST = new Date(Date.UTC(istYear, istMonth, istDate, 0, 0, 0, 0));
      const midnightISTTimestamp = midnightIST.getTime() - istOffset;
      
      const nextDailyReset = now.getTime() >= midnightISTTimestamp 
        ? midnightISTTimestamp + 24 * 60 * 60 * 1000
        : midnightISTTimestamp;
      
      const dailyMs = nextDailyReset - now.getTime();
      const dailyHours = Math.floor(dailyMs / (1000 * 60 * 60));
      const dailyMinutes = Math.floor((dailyMs % (1000 * 60 * 60)) / (1000 * 60));
      setDailyResetTime(`${dailyHours}h ${dailyMinutes}m`);

      // Weekly reset on Monday midnight IST
      const currentDay = nowIST.getUTCDay();
      let daysUntilMonday = (8 - currentDay) % 7;
      if (daysUntilMonday === 0 && now.getTime() >= midnightISTTimestamp) {
        daysUntilMonday = 7;
      }
      
      const nextMondayIST = new Date(nowIST);
      nextMondayIST.setUTCDate(nowIST.getUTCDate() + daysUntilMonday);
      const nextMondayYear = nextMondayIST.getUTCFullYear();
      const nextMondayMonth = nextMondayIST.getUTCMonth();
      const nextMondayDate = nextMondayIST.getUTCDate();
      const mondayMidnightIST = new Date(Date.UTC(nextMondayYear, nextMondayMonth, nextMondayDate, 0, 0, 0, 0));
      const mondayMidnightISTTimestamp = mondayMidnightIST.getTime() - istOffset;
      
      const weeklyMs = mondayMidnightISTTimestamp - now.getTime();
      const weeklyHours = Math.floor(weeklyMs / (1000 * 60 * 60));
      const weeklyDays = Math.floor(weeklyHours / 24);
      const remainingHours = weeklyHours % 24;
      setWeeklyResetTime(`${weeklyDays}d ${remainingHours}h`);
    };

    updateResetTimes();
    const interval = setInterval(updateResetTimes, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Calculate completed challenges this week/month
  const completedThisWeek = userChallenges.filter(uc => {
    const completedDate = uc.completed_at ? new Date(uc.completed_at) : null;
    if (!completedDate) return false;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return completedDate > weekAgo && uc.status === 'completed';
  }).length;

  const completedThisMonth = userChallenges.filter(uc => {
    const completedDate = uc.completed_at ? new Date(uc.completed_at) : null;
    if (!completedDate) return false;
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return completedDate > monthAgo && uc.status === 'completed';
  }).length;

  if (loading || pointsLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 bg-muted rounded-lg" />
        <div className="h-64 bg-muted rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Events */}
      {events.length > 0 && (
        <div className="space-y-4">
          {events.map(event => (
            <EventBanner key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* XP Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-6 w-6 text-primary" />
                <CardTitle>Level {level}</CardTitle>
              </div>
              <Badge variant="secondary" className="text-lg font-bold">
                {xp} XP
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progress to Level {level + 1}</span>
                <span>{xp % 100} / {xpForNextLevel} XP</span>
              </div>
              <Progress value={xpProgress} className="h-3" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Challenge Stats */}
      {activeChallenges.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-accent/10 via-accent/5 to-background border-accent/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-accent" />
                  <CardTitle>Challenge Progress</CardTitle>
                </div>
                <Badge variant="secondary" className="text-sm">
                  {completedThisWeek} this week
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-primary">{completedThisWeek}</p>
                  <p className="text-sm text-muted-foreground">This Week</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-primary">{completedThisMonth}</p>
                  <p className="text-sm text-muted-foreground">This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Daily Challenges */}
      {dailyChallenges.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  <CardTitle>Daily Challenges</CardTitle>
                </div>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Resets in {dailyResetTime}
                </Badge>
              </div>
              <CardDescription>
                Complete before midnight IST to earn rewards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {dailyChallenges.map(challenge => {
                const userChallenge = userChallenges.find(
                  uc => uc.challenge_id === challenge.id
                );
                return (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    userChallenge={userChallenge}
                  />
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Weekly Challenges */}
      {weeklyChallenges.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  <CardTitle>Weekly Challenges</CardTitle>
                </div>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Resets in {weeklyResetTime}
                </Badge>
              </div>
              <CardDescription>
                Complete before Monday midnight IST for bigger rewards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {weeklyChallenges.map(challenge => {
                const userChallenge = userChallenges.find(
                  uc => uc.challenge_id === challenge.id
                );
                return (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    userChallenge={userChallenge}
                  />
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <CardTitle>Recent Achievements</CardTitle>
            </div>
            <CardDescription>
              You've unlocked {userAchievements.length} achievement{userAchievements.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {recentAchievements.map(ua => ua.achievements && (
                <AchievementCard
                  key={ua.id}
                  achievement={ua.achievements}
                  unlocked={true}
                  unlockedAt={ua.unlocked_at}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Power-Ups */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle>Power-Ups & Boosters</CardTitle>
          </div>
          <CardDescription>
            Manage your power-ups and purchase new boosters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="inventory" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="shop">Shop</TabsTrigger>
            </TabsList>
            <TabsContent value="inventory" className="mt-6">
              <PowerUpInventory />
            </TabsContent>
            <TabsContent value="shop" className="mt-6">
              <PowerUpShop />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
