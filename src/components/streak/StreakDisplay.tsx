import React from 'react';
import { Flame } from 'lucide-react';
import { useStreak } from '@/hooks/useStreak';
import { cn } from '@/lib/utils';

interface StreakDisplayProps {
  className?: string;
}

export const StreakDisplay: React.FC<StreakDisplayProps> = ({ className }) => {
  const { streak, loading } = useStreak();

  if (loading) {
    return (
      <div className={cn("flex items-center gap-1.5 px-2 py-1", className)}>
        <Flame className="h-4 w-4 text-muted-foreground animate-pulse" />
        <span className="text-sm font-medium text-muted-foreground">...</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors",
      streak > 0 ? "bg-orange-500/10 text-orange-600 dark:text-orange-400" : "text-muted-foreground",
      className
    )}>
      <Flame 
        className={cn(
          "h-4 w-4 transition-colors",
          streak > 0 ? "text-orange-500" : "text-muted-foreground"
        )} 
      />
      <span className="text-sm font-medium">
        {streak}
      </span>
    </div>
  );
};