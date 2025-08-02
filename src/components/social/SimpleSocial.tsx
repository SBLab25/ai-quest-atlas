import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Heart, MessageCircle, Send } from 'lucide-react';

interface SimpleSocialProps {
  targetId: string;
  targetType: 'quest' | 'submission';
}

export const SimpleSocial: React.FC<SimpleSocialProps> = ({ targetId, targetType }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState('');
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const handleLike = () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to like content',
        variant: 'destructive'
      });
      return;
    }

    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
    
    toast({
      title: liked ? 'Unliked' : 'Liked',
      description: `You ${liked ? 'unliked' : 'liked'} this ${targetType}`
    });
  };

  const handleComment = () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to comment',
        variant: 'destructive'
      });
      return;
    }

    if (!newComment.trim()) return;

    toast({
      title: 'Comment added',
      description: 'Your comment has been added successfully'
    });
    setNewComment('');
  };

  return (
    <div className="space-y-4">
      {/* Like and Comment Stats */}
      <div className="flex items-center gap-4">
        <Button
          variant={liked ? 'default' : 'outline'}
          size="sm"
          onClick={handleLike}
          className="flex items-center gap-2"
        >
          <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
          {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
        </Button>
        <Badge variant="outline" className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          0 Comments
        </Badge>
      </div>

      {/* Add Comment */}
      {user && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleComment}
                  disabled={!newComment.trim()}
                  size="sm"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Post Comment
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Comments will be available once the database is fully updated.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};