import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share2, Grid3X3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface Post {
  id: string;
  title: string;
  content: string;
  image_urls: string[] | null;
  image_url: string | null;
  tags: string[] | null;
  created_at: string;
  post_type: string;
}

interface UserPostsGridProps {
  userId: string;
}

export const UserPostsGrid: React.FC<UserPostsGridProps> = ({ userId }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    fetchUserPosts();
  }, [userId]);

  const fetchUserPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPostImage = (post: Post) => {
    if (post.image_urls && post.image_urls.length > 0) {
      return post.image_urls[0];
    }
    return post.image_url;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-1 sm:gap-2">
        {[...Array(6)].map((_, i) => (
          <AspectRatio key={i} ratio={1}>
            <div className="w-full h-full bg-muted animate-pulse rounded-lg" />
          </AspectRatio>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="space-y-3">
          <Grid3X3 className="h-12 w-12 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-semibold">No posts yet</h3>
          <p className="text-muted-foreground">Start sharing your adventures!</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex justify-end gap-2">
        <Button
          variant={viewMode === 'grid' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('grid')}
        >
          <Grid3X3 className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('list')}
        >
          <List className="h-4 w-4" />
        </Button>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          {posts.map((post) => (
            <Dialog key={post.id}>
              <DialogTrigger asChild>
                <div className="group cursor-pointer">
                  <AspectRatio ratio={1}>
                    <div 
                      className="w-full h-full bg-gradient-to-br from-muted to-muted/50 rounded-lg overflow-hidden relative transition-all duration-300 group-hover:shadow-lg group-hover:scale-[1.02]"
                      style={{
                        backgroundImage: getPostImage(post) ? `url(${getPostImage(post)})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      {!getPostImage(post) && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center p-4">
                            <h4 className="font-semibold text-sm line-clamp-2">
                              {post.title}
                            </h4>
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="flex gap-4 text-foreground">
                          <div className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            <span className="text-sm font-semibold">0</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            <span className="text-sm font-semibold">0</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AspectRatio>
                </div>
              </DialogTrigger>
              
              <DialogContent className="max-w-2xl" aria-describedby="post-detail-description">
                <div className="space-y-4" id="post-detail-description">
                  {getPostImage(post) && (
                    <AspectRatio ratio={16/9}>
                      <img 
                        src={getPostImage(post)!} 
                        alt={post.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </AspectRatio>
                  )}
                  <div>
                    <h3 className="text-xl font-bold">{post.title}</h3>
                    <p className="text-muted-foreground text-sm">{formatDate(post.created_at)}</p>
                  </div>
                  <p className="text-foreground">{post.content}</p>
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-4 pt-2">
                    <Button variant="ghost" size="sm">
                      <Heart className="h-4 w-4 mr-2" />
                      Like
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Comment
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex gap-4">
                {getPostImage(post) && (
                  <div className="flex-shrink-0">
                    <AspectRatio ratio={1} className="w-20">
                      <img 
                        src={getPostImage(post)!} 
                        alt={post.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </AspectRatio>
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="font-semibold">{post.title}</h3>
                    <p className="text-muted-foreground text-sm">{formatDate(post.created_at)}</p>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {post.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};