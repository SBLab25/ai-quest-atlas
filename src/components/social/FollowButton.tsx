import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck, Clock } from 'lucide-react';
import { useFollow } from '@/hooks/useFollow';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface FollowButtonProps {
  userId: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline';
  showCounts?: boolean;
  className?: string;
}

export const FollowButton = ({ 
  userId, 
  size = 'default', 
  variant = 'default',
  showCounts = false,
  className 
}: FollowButtonProps) => {
  const { isFollowing, isPending, loading, followerCount, toggleFollow } = useFollow(userId);
  const [isHovering, setIsHovering] = useState(false);

  const getButtonContent = () => {
    if (isPending) {
      return (
        <>
          <Clock className="h-4 w-4 mr-2" />
          Requested
        </>
      );
    }

    if (isFollowing) {
      return (
        <>
          <UserCheck className="h-4 w-4 mr-2" />
          {isHovering ? 'Unfollow' : 'Following'}
        </>
      );
    }

    return (
      <>
        <UserPlus className="h-4 w-4 mr-2" />
        Follow
      </>
    );
  };

  const getButtonVariant = () => {
    if (isPending) return 'outline';
    if (isFollowing) return 'secondary';
    return variant;
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        size={size}
        variant={getButtonVariant()}
        onClick={toggleFollow}
        disabled={loading || isPending}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className={cn(
          "transition-all",
          isFollowing && isHovering && "border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
        )}
      >
        {getButtonContent()}
      </Button>
      {showCounts && (
        <span className="text-sm text-muted-foreground">
          {followerCount} {followerCount === 1 ? 'follower' : 'followers'}
        </span>
      )}
    </div>
  );
};
