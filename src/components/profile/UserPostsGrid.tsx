import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share2, Grid3X3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { PostImageCarousel } from '@/components/ui/post-image-carousel';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Post {
  id: string;
  title: string;
  content: string;
  image_urls: string[] | null;
  image_url: string | null;
  tags: string[] | null;
  created_at: string;
  post_type: string;
  likes_count?: number;
  comments_count?: number;
  user_has_liked?: boolean;
}

interface UserPostsGridProps {
  userId: string;
}

export const UserPostsGrid: React.FC<UserPostsGridProps> = ({ userId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserPosts();
    const refetch = () => fetchUserPosts();
    window.addEventListener('community-posts-changed', refetch);
    // Refresh every 30 seconds to sync likes/comments
    const refreshInterval = setInterval(() => {
      fetchUserPosts();
    }, 30000);
    return () => {
      window.removeEventListener('community-posts-changed', refetch);
      clearInterval(refreshInterval);
    };
  }, [userId]);

  const fetchUserPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch likes and comments for each post
      const postsWithInteractions = await Promise.all((data || []).map(async (post: any) => {
        const [likesRes, commentsRes] = await Promise.all([
          (supabase as any).from("community_post_likes").select("user_id").eq("post_id", post.id),
          (supabase as any).from("community_post_comments").select("id").eq("post_id", post.id),
        ]);

        const likes = likesRes.data || [];
        const comments = commentsRes.data || [];

        return {
          ...post,
          likes_count: likes.length,
          comments_count: comments.length,
          user_has_liked: user ? likes.some((l: any) => l.user_id === user.id) : false,
        };
      }));

      setPosts(postsWithInteractions);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async (postId: string) => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to like posts", variant: "destructive" });
      return;
    }

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    try {
      if (post.user_has_liked) {
        await (supabase as any)
          .from("community_post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
      } else {
        await (supabase as any)
          .from("community_post_likes")
          .insert({ post_id: postId, user_id: user.id });
      }

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                user_has_liked: !p.user_has_liked,
                likes_count: (p.likes_count || 0) + (p.user_has_liked ? -1 : 1),
              }
            : p
        )
      );
    } catch (err) {
      console.error("Error toggling like", err);
      toast({ title: "Error", description: "Failed to update like", variant: "destructive" });
    }
  };

  const getPostImages = (post: Post) => {
    if (post.image_urls && post.image_urls.length > 0) {
      return post.image_urls;
    }
    if (post.image_url) {
      return [post.image_url];
    }
    return [];
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
                <div className="group cursor-pointer relative">
                  <AspectRatio ratio={1} className="w-full">
                    {getPostImages(post).length > 0 ? (
                      <PostImageCarousel
                        images={getPostImages(post)}
                        alt={post.title}
                        className="w-full h-full transition-all duration-300 group-hover:shadow-lg group-hover:scale-[1.02] rounded-lg overflow-hidden"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:shadow-lg group-hover:scale-[1.02]">
                        <div className="text-center p-4">
                          <h4 className="font-semibold text-sm line-clamp-2">
                            {post.title}
                          </h4>
                        </div>
                      </div>
                    )}
                  </AspectRatio>
                  <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-lg">
                    <div className="flex gap-4 text-foreground">
                      <div className="flex items-center gap-1">
                        <Heart className={`h-4 w-4 ${post.user_has_liked ? 'fill-red-500 text-red-500' : ''}`} />
                        <span className="text-sm font-semibold">{post.likes_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-sm font-semibold">{post.comments_count || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogTrigger>
              
              <DialogContent className="max-w-2xl" aria-describedby="post-detail-description">
                <div className="space-y-4" id="post-detail-description">
                  {getPostImages(post).length > 0 && (
                    <PostImageCarousel 
                      images={getPostImages(post)}
                      alt={post.title}
                    />
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
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(post.id);
                      }}
                    >
                      <Heart className={`h-4 w-4 mr-2 ${post.user_has_liked ? 'fill-red-500 text-red-500' : ''}`} />
                      {post.likes_count || 0} {post.likes_count === 1 ? 'Like' : 'Likes'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/post/${post.id}`);
                      }}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      {post.comments_count || 0} {post.comments_count === 1 ? 'Comment' : 'Comments'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={(e) => {
                      e.stopPropagation();
                      if (navigator.share) {
                        navigator.share({
                          title: post.title,
                          text: post.content,
                        }).catch(console.error);
                      } else {
                        toast({
                          title: "Share feature",
                          description: "Share functionality will be available soon!",
                        });
                      }
                    }}>
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
                {getPostImages(post).length > 0 && (
                  <div className="flex-shrink-0">
                    <PostImageCarousel 
                      images={getPostImages(post)}
                      alt={post.title}
                      className="w-20"
                      showCounter={false}
                    />
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
                  <div className="flex items-center gap-4 pt-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(post.id);
                      }}
                    >
                      <Heart className={`h-4 w-4 mr-1 ${post.user_has_liked ? 'fill-red-500 text-red-500' : ''}`} />
                      <span className="text-xs">{post.likes_count || 0}</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/post/${post.id}`);
                      }}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      <span className="text-xs">{post.comments_count || 0}</span>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};