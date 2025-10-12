import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Lock } from 'lucide-react';
import { Achievement } from '@/hooks/useGamification';
import { motion } from 'framer-motion';

interface AchievementCardProps {
  achievement: Achievement;
  unlocked: boolean;
  unlockedAt?: string;
}

export const AchievementCard = ({ achievement, unlocked, unlockedAt }: AchievementCardProps) => {
  const getRarityColor = (rarity: string) => {
    const colors = {
      common: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
      rare: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      epic: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      legendary: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    };
    return colors[rarity as keyof typeof colors] || colors.common;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      exploration: '🗺️',
      consistency: '🔥',
      creativity: '🎨',
      social: '👥',
    };
    return icons[category] || '🏆';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`p-4 text-center ${
          unlocked 
            ? 'bg-gradient-to-br from-primary/10 to-background border-primary/20' 
            : 'opacity-50 grayscale'
        } hover:shadow-md transition-all cursor-pointer`}
      >
        <div className="flex flex-col items-center gap-2">
          <div className={`text-4xl ${!unlocked && 'filter grayscale'}`}>
            {unlocked ? getCategoryIcon(achievement.category) : '🔒'}
          </div>
          
          <div className="space-y-1">
            <h4 className="font-semibold text-sm line-clamp-1">
              {achievement.title}
            </h4>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {achievement.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-1 justify-center">
            <Badge variant="outline" className={`text-xs ${getRarityColor(achievement.rarity)}`}>
              {achievement.rarity}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {achievement.xp_reward} XP
            </Badge>
          </div>

          {unlocked && unlockedAt && (
            <p className="text-xs text-muted-foreground mt-1">
              Unlocked {new Date(unlockedAt).toLocaleDateString()}
            </p>
          )}

          {!unlocked && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Lock className="h-3 w-3" />
              <span>Locked</span>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};
