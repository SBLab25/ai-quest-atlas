import { useGamification } from '@/hooks/useGamification';
import { Badge } from '@/components/ui/badge';
import { Clock, Cloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getPowerUpIconEmoji,
  getTimeRemaining,
} from '@/utils/powerupUtils';

export const ActivePowerUpBar = () => {
  const { getActivePowerUps } = useGamification();
  const activePowerUps = getActivePowerUps();

  if (activePowerUps.length === 0) return null;

  // Show only the first active power-up in the floating cloud
  const activePowerUp = activePowerUps[0];
  if (!activePowerUp?.powerups) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0, x: 50, y: -50 }}
        animate={{ scale: 1, opacity: 1, x: 0, y: 0 }}
        exit={{ scale: 0, opacity: 0, x: 50, y: -50 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed right-4 z-40 pointer-events-none"
        style={{ top: 'calc(64px + 30px)' }}
      >
        <motion.div
          animate={{
            y: [0, -5, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative pointer-events-auto"
        >
          {/* Cloud-like background with theme-adaptive colors */}
          <div className="relative bg-background/95 dark:bg-background/90 backdrop-blur-xl border-2 border-primary/30 dark:border-primary/50 rounded-3xl shadow-2xl dark:shadow-primary/20 p-4 min-w-[200px] ring-2 ring-primary/20 dark:ring-primary/40 ring-offset-2 ring-offset-background">
            {/* Cloud puff effect - theme adaptive */}
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary/20 dark:bg-primary/40 rounded-full blur-md" />
            <div className="absolute -top-1 -left-1 w-6 h-6 bg-primary/15 dark:bg-primary/30 rounded-full blur-sm" />
            <div className="absolute -bottom-1 right-4 w-5 h-5 bg-primary/25 dark:bg-primary/35 rounded-full blur-sm" />
            
            {/* Glow effect - visible in both themes */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 dark:from-primary/40 dark:via-primary/50 dark:to-primary/40 rounded-3xl blur-2xl -z-10 animate-pulse" />
            <div className="absolute -inset-1 bg-primary/10 dark:bg-primary/30 rounded-3xl blur-xl -z-20" />
            
            {/* Content */}
            <div className="relative flex items-center gap-3">
              <div className="text-2xl animate-pulse drop-shadow-lg">
                {getPowerUpIconEmoji(activePowerUp.powerups.effect_type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Cloud className="h-3 w-3 text-primary dark:text-primary/80" />
                  <span className="text-sm font-semibold text-foreground dark:text-foreground truncate">
                    {activePowerUp.powerups.name}
                  </span>
                </div>
                {activePowerUp.expires_at && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground dark:text-muted-foreground" />
                    <span className="text-xs text-muted-foreground dark:text-muted-foreground font-medium">
                      {getTimeRemaining(activePowerUp.expires_at, false)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
