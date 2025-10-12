import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Calendar, Zap, Star } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';
import { ChallengeCard } from './ChallengeCard';
import { AchievementCard } from './AchievementCard';
import { PowerUpInventory } from './PowerUpInventory';
import { EventBanner } from './EventBanner';
import { motion } from 'framer-motion';

export const GamificationDashboard = () => {
  const {
    userAchievements,
    challenges,
    userChallenges,
    events,
    xp,
    level,
    loading
  } = useGamification();

  const getXPForNextLevel = (currentLevel: number) => currentLevel * 100;
  const xpForNextLevel = getXPForNextLevel(level);
  const xpProgress = ((xp % 100) / 100) * 100;

  const activeChallenges = challenges.filter(c => c.is_active);
  const recentAchievements = userAchievements.slice(0, 6);

  if (loading) {
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

      {/* Active Challenges */}
      {activeChallenges.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle>Active Challenges</CardTitle>
            </div>
            <CardDescription>
              Complete challenges to earn bonus rewards
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeChallenges.map(challenge => {
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
            <CardTitle>Power-Ups</CardTitle>
          </div>
          <CardDescription>
            Activate power-ups to boost your rewards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PowerUpInventory />
        </CardContent>
      </Card>
    </div>
  );
};
