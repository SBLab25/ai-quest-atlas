import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';
import { Achievement } from '@/hooks/useGamification';

interface AchievementUnlockedPopupProps {
  achievement: Achievement;
  onClose: () => void;
}

export const AchievementUnlockedPopup = ({ achievement, onClose }: AchievementUnlockedPopupProps) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onClose, 500);
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getRarityColor = (rarity: string) => {
    const colors = {
      common: 'from-gray-500/20 to-gray-500/5',
      rare: 'from-blue-500/20 to-blue-500/5',
      epic: 'from-purple-500/20 to-purple-500/5',
      legendary: 'from-yellow-500/20 to-yellow-500/5',
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
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed top-20 right-4 z-50 max-w-sm"
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: "spring", damping: 20 }}
        >
          <Card className={`p-4 bg-gradient-to-br ${getRarityColor(achievement.rarity)} border-primary/30 shadow-xl`}>
            <div className="flex items-center gap-4">
              <motion.div
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 0.6,
                  ease: "easeInOut"
                }}
                className="text-5xl"
              >
                {getCategoryIcon(achievement.category)}
              </motion.div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Achievement Unlocked!</span>
                </div>
                <h4 className="font-bold">{achievement.title}</h4>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {achievement.description}
                </p>
                <Badge variant="secondary" className="text-xs">
                  +{achievement.xp_reward} XP
                </Badge>
              </div>
            </div>
          </Card>

          {/* Sparkle effects */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-primary rounded-full"
              initial={{
                x: "50%",
                y: "50%",
                scale: 0,
              }}
              animate={{
                x: `${50 + (Math.cos((i / 8) * Math.PI * 2) * 100)}%`,
                y: `${50 + (Math.sin((i / 8) * Math.PI * 2) * 100)}%`,
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 1,
                ease: "easeOut",
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
