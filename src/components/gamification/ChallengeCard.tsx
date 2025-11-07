import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, Trophy, Sparkles } from 'lucide-react';
import { Challenge, UserChallenge } from '@/hooks/useGamification';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { usePoints } from '@/hooks/usePoints';

interface ChallengeCardProps {
  challenge: Challenge;
  userChallenge?: UserChallenge;
}

export const ChallengeCard = ({ challenge, userChallenge }: ChallengeCardProps) => {
  const { addShoppingPoints } = usePoints();
  const progress = userChallenge?.progress || 0;
  const progressPercentage = (progress / challenge.requirement_value) * 100;
  const isCompleted = userChallenge?.status === 'completed';
  const canClaim = isCompleted && !userChallenge?.completed_at;
  const timeRemaining = new Date(challenge.end_date).getTime() - Date.now();
  const isExpired = timeRemaining <= 0;
  const hoursRemaining = Math.max(0, Math.floor(timeRemaining / (1000 * 60 * 60)));
  const minutesRemaining = Math.max(0, Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60)));

  const getChallengeTypeColor = (type: string) => {
    return type === 'daily'
      ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      : 'bg-purple-500/10 text-purple-500 border-purple-500/20';
  };

  const handleClaimReward = () => {
    // Award shopping points (currency) when reward is claimed
    if (challenge.reward_points > 0) {
      addShoppingPoints(challenge.reward_points);
    }
    
    toast({
      title: "🎉 Reward Claimed!",
      description: `You earned ${challenge.reward_points} shopping points and ${challenge.reward_xp} XP!`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`${isCompleted ? 'border-green-500/50 bg-green-500/5' : isExpired ? 'opacity-50' : ''} hover:shadow-lg transition-all relative overflow-hidden`}>
        {isCompleted && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-transparent to-green-500/10"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          />
        )}
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className={getChallengeTypeColor(challenge.type)}>
                  {challenge.type === 'daily' ? '⏰ Daily' : '📅 Weekly'}
                </Badge>
                {isCompleted && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
              <CardTitle className="text-base">{challenge.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {challenge.description}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {progress} / {challenge.requirement_value}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          <div className="flex items-center justify-between text-sm gap-2">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                {isExpired ? 'Expired' : `${hoursRemaining}h ${minutesRemaining}m remaining`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 border-amber-500/20">
                <Trophy className="h-3 w-3 mr-1" />
                {challenge.reward_xp} XP
              </Badge>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                {challenge.reward_points} Points
              </Badge>
            </div>
          </div>

          {canClaim && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button 
                className="w-full mt-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                onClick={handleClaimReward}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Claim Reward
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
