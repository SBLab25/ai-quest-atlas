import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Send,
  MapPin,
  User,
  Clock
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";

interface Post {
  id: string;
  description: string;
  photo_url: string;
  photo_urls?: string[];
  user_id: string;
  geo_location: string;
  submitted_at: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  user_has_liked: boolean;
  user_has_shared: boolean;
  user_profile?: {
    username: string;
    avatar_url: string;
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user_profile?: {
    username: string;
    avatar_url: string;
  };
}

export function SocialMediaFeed() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>({});
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [openComments, setOpenComments] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      // Fetch submissions
      const { data: submissions, error: submissionsError } = await supabase
        .from("Submissions")
        .select(`
          id,
          description,
          photo_url,
          image_urls,
          user_id,
          geo_location,
          submitted_at
        `)
        .eq("status", "verified")
        .order("submitted_at", { ascending: false });

      if (submissionsError) throw submissionsError;

      if (!submissions) {
        setPosts([]);
        setLoading(false);
        return;
      }

      // Fetch user profiles
      const userIds = submissions.map(s => s.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      // Fetch social interaction counts for each post
      const postsWithCounts = await Promise.all(
        submissions.map(async (submission) => {
          const [likesResult, commentsResult, sharesResult] = await Promise.all([
            supabase
              .from("post_likes")
              .select("user_id")
              .eq("submission_id", submission.id),
            supabase
              .from("post_comments")
              .select("id")
              .eq("submission_id", submission.id),
            supabase
              .from("post_shares")
              .select("user_id")
              .eq("submission_id", submission.id)
          ]);

          const likes = likesResult.data || [];
          const comments = commentsResult.data || [];
          const shares = sharesResult.data || [];
          const profile = profiles?.find(p => p.id === submission.user_id);

          return {
            ...submission,
            photo_urls: submission.image_urls || [],
            likes_count: likes.length,
            comments_count: comments.length,
            shares_count: shares.length,
            user_has_liked: user ? likes.some(like => like.user_id === user.id) : false,
            user_has_shared: user ? shares.some(share => share.user_id === user.id) : false,
            user_profile: profile || { username: "Unknown User", avatar_url: null }
          };
        })
      );

      setPosts(postsWithCounts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast({
        title: "Error",
        description: "Failed to load social media feed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from("post_comments")
        .select(`
          id,
          content,
          created_at,
          user_id
        `)
        .eq("submission_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch profiles separately
      const userIds = data?.map(comment => comment.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      const commentsWithProfile = data?.map(comment => {
        const profile = profiles?.find(p => p.id === comment.user_id);
        return {
          ...comment,
          user_profile: profile || { username: "Unknown User", avatar_url: null }
        };
      }) || [];

      setComments(prev => ({ ...prev, [postId]: commentsWithProfile }));
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (post.user_has_liked) {
        await supabase
          .from("post_likes")
          .delete()
          .eq("submission_id", postId)
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("post_likes")
          .insert({ submission_id: postId, user_id: user.id });
      }

      // Update local state
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { 
              ...p, 
              user_has_liked: !p.user_has_liked,
              likes_count: p.user_has_liked ? p.likes_count - 1 : p.likes_count + 1
            }
          : p
      ));
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const toggleShare = async (postId: string) => {
    if (!user) return;

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (post.user_has_shared) {
        await supabase
          .from("post_shares")
          .delete()
          .eq("submission_id", postId)
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("post_shares")
          .insert({ submission_id: postId, user_id: user.id });
      }

      // Update local state
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { 
              ...p, 
              user_has_shared: !p.user_has_shared,
              shares_count: p.user_has_shared ? p.shares_count - 1 : p.shares_count + 1
            }
          : p
      ));

      toast({
        title: post.user_has_shared ? "Unshared" : "Shared",
        description: post.user_has_shared ? "Post removed from your shares" : "Post shared successfully",
      });
    } catch (error) {
      console.error("Error toggling share:", error);
    }
  };

  const addComment = async (postId: string) => {
    if (!user || !newComment[postId]?.trim()) return;

    try {
      const { error } = await supabase
        .from("post_comments")
        .insert({
          submission_id: postId,
          user_id: user.id,
          content: newComment[postId].trim()
        });

      if (error) throw error;

      setNewComment(prev => ({ ...prev, [postId]: "" }));
      
      // Update comments count
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, comments_count: p.comments_count + 1 }
          : p
      ));

      // Refresh comments for this post
      await fetchComments(postId);

      toast({
        title: "Comment added",
        description: "Your comment has been posted",
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    }
  };

  const toggleComments = async (postId: string) => {
    const isOpen = openComments[postId];
    setOpenComments(prev => ({ ...prev, [postId]: !isOpen }));
    
    if (!isOpen && !comments[postId]) {
      await fetchComments(postId);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-64 bg-gray-200 rounded-md mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">
            <p className="text-lg mb-2">No posts to show yet</p>
            <p className="text-sm">When quest submissions are verified, they'll appear here!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <Card key={post.id} className="overflow-hidden">
          <CardContent className="p-0">
            {/* Post Header */}
            <div className="p-4 flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.user_profile?.avatar_url || undefined} />
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-sm">
                  {post.user_profile?.username || "Anonymous"}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(post.submitted_at).toLocaleDateString()}
                  </div>
                  {post.geo_location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {post.geo_location}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Post Images */}
            <div className="aspect-square relative">
              {/* Use new image_urls array if available, fallback to single photo_url */}
              {(post.photo_urls && post.photo_urls.length > 0) ? (
                post.photo_urls.length === 1 ? (
                  <img
                    src={post.photo_urls[0]}
                    alt="Quest submission"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`grid gap-1 h-full ${post.photo_urls.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                    {post.photo_urls.slice(0, 3).map((url, index) => (
                      <div key={index} className={`relative ${post.photo_urls!.length === 3 && index === 0 ? 'col-span-2' : ''}`}>
                        <img
                          src={url}
                          alt={`Quest submission ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {/* Show +N overlay for more than 3 images */}
                        {index === 2 && post.photo_urls!.length > 3 && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white font-semibold">+{post.photo_urls!.length - 3}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              ) : post.photo_url && (
                <img
                  src={post.photo_url}
                  alt="Quest submission"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Post Actions */}
            <div className="p-4">
              <div className="flex items-center gap-4 mb-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleLike(post.id)}
                  className={`p-0 h-auto ${post.user_has_liked ? 'text-red-500' : 'text-muted-foreground'}`}
                  disabled={!user}
                >
                  <Heart className={`h-6 w-6 ${post.user_has_liked ? 'fill-current' : ''}`} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleComments(post.id)}
                  className="p-0 h-auto text-muted-foreground"
                >
                  <MessageCircle className="h-6 w-6" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleShare(post.id)}
                  className={`p-0 h-auto ${post.user_has_shared ? 'text-blue-500' : 'text-muted-foreground'}`}
                  disabled={!user}
                >
                  <Share2 className="h-6 w-6" />
                </Button>
              </div>

              {/* Stats */}
              <div className="text-sm space-y-1">
                {post.likes_count > 0 && (
                  <p className="font-semibold">
                    {post.likes_count} {post.likes_count === 1 ? 'like' : 'likes'}
                  </p>
                )}
                
                {post.description && (
                  <p>
                    <span className="font-semibold">{post.user_profile?.username || "Anonymous"}</span>{" "}
                    {post.description}
                  </p>
                )}

                {post.comments_count > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleComments(post.id)}
                    className="p-0 h-auto text-muted-foreground text-sm"
                  >
                    View all {post.comments_count} comment{post.comments_count !== 1 ? 's' : ''}
                  </Button>
                )}
              </div>

              {/* Comments Section */}
              <Collapsible
                open={openComments[post.id]}
                onOpenChange={() => toggleComments(post.id)}
              >
                <CollapsibleContent className="space-y-3 mt-3">
                  {comments[post.id]?.map((comment) => (
                    <div key={comment.id} className="flex gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={comment.user_profile?.avatar_url || undefined} />
                        <AvatarFallback>
                          <User className="h-3 w-3" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-semibold">
                            {comment.user_profile?.username || "Anonymous"}
                          </span>{" "}
                          {comment.content}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {/* Add Comment */}
                  {user && (
                    <div className="flex gap-2 pt-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>
                          <User className="h-3 w-3" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 flex gap-2">
                        <Input
                          placeholder="Add a comment..."
                          value={newComment[post.id] || ""}
                          onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyPress={(e) => e.key === 'Enter' && addComment(post.id)}
                          className="text-sm"
                        />
                        <Button
                          size="sm"
                          onClick={() => addComment(post.id)}
                          disabled={!newComment[post.id]?.trim()}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}