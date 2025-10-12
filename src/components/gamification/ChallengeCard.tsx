import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, Trophy } from 'lucide-react';
import { Challenge, UserChallenge } from '@/hooks/useGamification';
import { motion } from 'framer-motion';

interface ChallengeCardProps {
  challenge: Challenge;
  userChallenge?: UserChallenge;
}

export const ChallengeCard = ({ challenge, userChallenge }: ChallengeCardProps) => {
  const progress = userChallenge?.progress || 0;
  const progressPercentage = (progress / challenge.requirement_value) * 100;
  const isCompleted = userChallenge?.status === 'completed';
  const timeRemaining = new Date(challenge.end_date).getTime() - Date.now();
  const hoursRemaining = Math.max(0, Math.floor(timeRemaining / (1000 * 60 * 60)));
  const minutesRemaining = Math.max(0, Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60)));

  const getChallengeTypeColor = (type: string) => {
    return type === 'daily'
      ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      : 'bg-purple-500/10 text-purple-500 border-purple-500/20';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`${isCompleted ? 'opacity-75' : ''} hover:shadow-lg transition-shadow`}>
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

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                {hoursRemaining}h {minutesRemaining}m remaining
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                <Trophy className="h-3 w-3 mr-1" />
                {challenge.reward_xp} XP
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
