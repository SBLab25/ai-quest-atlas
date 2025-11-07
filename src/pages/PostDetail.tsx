import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { TopNavbar } from "@/components/navigation/TopNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostImageCarousel } from "@/components/ui/post-image-carousel";
import { Heart, MessageCircle, Send, Share2, ArrowLeft, User, Clock, MapPin, Reply } from "lucide-react";

interface UnifiedPost {
  id: string;
  user_id: string;
  type: 'community' | 'quest';
  title?: string;
  content: string;
  description?: string;
  post_type?: "general" | "help" | "achievement" | "discussion";
  tags?: string[];
  image_urls: string[];
  created_at: string;
  geo_location?: string;
  likes_count: number;
  comments_count: number;
  shares_count?: number;
  user_has_liked: boolean;
  user_has_shared?: boolean;
  user_profile?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  parent_id?: string | null;
  user_profile?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
  replies?: Comment[];
}

const PostDetail = () => {
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [post, setPost] = useState<UnifiedPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    if (postId) {
      fetchPost();
    }
  }, [postId]);

  useEffect(() => {
    document.title = post?.title || "Post Details | Adventure Crew";
    
    const metaDesc = document.querySelector('meta[name="description"]');
    const description = post?.content || post?.description || "View post details and comments on Adventure Crew";
    if (metaDesc) {
      metaDesc.setAttribute("content", description.slice(0, 160));
    } else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = description.slice(0, 160);
      document.head.appendChild(m);
    }
  }, [post]);

  const fetchPost = async () => {
    if (!postId) return;
    
    try {
      setLoading(true);
      
      // Try to find in community posts first
      const { data: communityPost, error: communityError } = await supabase
        .from("community_posts")
        .select("id, user_id, title, content, post_type, tags, image_urls, created_at")
        .eq("id", postId)
        .single();

      let postData;
      let postType: 'community' | 'quest' = 'community';

      if (communityPost && !communityError) {
        postData = communityPost;
        postType = 'community';
      } else {
        // Try quest submissions
        const { data: questPost, error: questError } = await supabase
          .from("Submissions")
          .select("id, description, photo_url, image_urls, user_id, geo_location, submitted_at")
          .eq("id", postId)
          .eq("status", "verified")
          .single();

        if (questError || !questPost) {
          throw new Error("Post not found");
        }
        
        postData = questPost;
        postType = 'quest';
      }

      // Fetch user profile
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .eq("id", postData.user_id)
        .single();

      // Fetch interaction counts
      const [likesRes, commentsRes, sharesRes] = await Promise.all([
        postType === 'community'
          ? supabase.from("community_post_likes").select("user_id").eq("post_id", postId)
          : supabase.from("post_likes").select("user_id").eq("submission_id", postId),
        postType === 'community'
          ? supabase.from("community_post_comments").select("id").eq("post_id", postId)
          : supabase.from("post_comments").select("id").eq("submission_id", postId),
        postType === 'quest'
          ? supabase.from("post_shares").select("user_id").eq("submission_id", postId)
          : Promise.resolve({ data: [] })
      ]);

      const likes = likesRes.data || [];
      const commentsCount = commentsRes.data?.length || 0;
      const shares = sharesRes.data || [];

      // Process image URLs
      const toPublicUrls = (bucket: string, urls: string[]) => {
        return (urls || []).map((u) => {
          if (!u) return u;
          if (u.startsWith("http")) return u;
          const { data } = supabase.storage.from(bucket).getPublicUrl(u);
          return data.publicUrl || u;
        });
      };

      let processedImageUrls: string[] = [];
      if (postType === 'community') {
        processedImageUrls = toPublicUrls('community-images', postData.image_urls || []);
      } else {
        if (postData.image_urls && postData.image_urls.length > 0) {
          processedImageUrls = toPublicUrls('quest-submissions', postData.image_urls);
        } else if (postData.photo_url) {
          processedImageUrls = [postData.photo_url];
        }
      }

      const processedPost: UnifiedPost = {
        id: postData.id,
        user_id: postData.user_id,
        type: postType,
        title: postData.title,
        content: postType === 'community' ? postData.content : postData.description,
        description: postData.description,
        post_type: postData.post_type,
        tags: postData.tags || [],
        image_urls: processedImageUrls,
        created_at: postType === 'community' ? postData.created_at : postData.submitted_at,
        geo_location: postData.geo_location,
        likes_count: likes.length,
        comments_count: commentsCount,
        shares_count: shares.length,
        user_has_liked: user ? likes.some((l: any) => l.user_id === user.id) : false,
        user_has_shared: user ? shares.some((s: any) => s.user_id === user.id) : false,
        user_profile: userProfile ? {
          username: userProfile.username,
          full_name: userProfile.username,
          avatar_url: userProfile.avatar_url
        } : null,
      };

      setPost(processedPost);
      
      // Fetch comments after post is loaded
      console.log("Post loaded, fetching comments for:", postId);
      await fetchComments();
    } catch (err) {
      console.error("Error fetching post:", err);
      toast({ title: "Error", description: "Failed to load post", variant: "destructive" });
      navigate("/community");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    if (!postId) return;

    // Determine post type - use post state if available, otherwise try both
    const postType = post?.type || 'community';
    
    try {
      let data, error;
      
      // Try community first, then quest if that fails
      if (postType === 'community' || !post) {
        const result = await supabase
          .from("community_post_comments")
          .select("id, user_id, post_id, content, created_at")
          .eq("post_id", postId)
          .order("created_at", { ascending: true });
        data = result.data;
        error = result.error;
        
        // If no data and we don't know the type, try quest comments
        if ((!data || data.length === 0) && !post) {
          const questResult = await supabase
            .from("post_comments")
            .select("id, user_id, submission_id, content, created_at")
            .eq("submission_id", postId)
            .order("created_at", { ascending: true });
          if (questResult.data && questResult.data.length > 0) {
            data = questResult.data;
            error = questResult.error;
          }
        }
      } else {
        const result = await supabase
          .from("post_comments")
          .select("id, user_id, submission_id, content, created_at")
          .eq("submission_id", postId)
          .order("created_at", { ascending: true });
        data = result.data;
        error = result.error;
      }

      if (error) throw error;

      const userIds = (data || []).map((c: any) => c.user_id);
      
      // Fetch profiles, including current user if needed
      const uniqueUserIds = [...new Set(userIds)];
      if (user && !uniqueUserIds.includes(user.id)) {
        uniqueUserIds.push(user.id);
      }
      
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", uniqueUserIds);

      const withProfiles: Comment[] = (data || []).map((c: any) => {
        const profile = profiles?.find((p) => p.id === c.user_id);
        // If profile not found and it's the current user, use user metadata
        if (!profile && c.user_id === user?.id) {
          return {
            ...c,
            post_id: postId,
            parent_id: null, // parent_id not in schema, set to null
            user_profile: {
              username: user.user_metadata?.username || user.email?.split('@')[0] || "You",
              full_name: user.user_metadata?.username || user.email?.split('@')[0] || "You",
              avatar_url: user.user_metadata?.avatar_url || null
            },
          };
        }
        return {
          ...c,
          post_id: postId,
          parent_id: null, // parent_id not in schema, set to null
          user_profile: profile ? {
            username: profile.username,
            full_name: profile.username,
            avatar_url: profile.avatar_url
          } : {
            username: "Unknown",
            full_name: "Unknown",
            avatar_url: null
          },
        };
      });

      // Since parent_id is not in the schema, all comments are root comments
      // Sort by created_at ascending (oldest first) for chronological display
      withProfiles.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      console.log("Fetched comments:", {
        totalComments: withProfiles.length,
        comments: withProfiles
      });
      
      // Set all comments as root comments (no hierarchical structure)
      setComments(withProfiles);
    } catch (err) {
      console.error("Error loading comments:", err);
      // Set empty array on error to prevent showing stale data
      setComments([]);
    }
  };

  const toggleLike = async () => {
    if (!user || !post) return;

    try {
      if (post.type === 'community') {
        if (post.user_has_liked) {
          await supabase
            .from("community_post_likes")
            .delete()
            .eq("post_id", postId)
            .eq("user_id", user.id);
        } else {
          await supabase
            .from("community_post_likes")
            .insert({ post_id: postId, user_id: user.id });
        }
      } else {
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
      }

      setPost(prev => prev ? {
        ...prev,
        user_has_liked: !prev.user_has_liked,
        likes_count: prev.user_has_liked ? prev.likes_count - 1 : prev.likes_count + 1,
      } : null);
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const addComment = async (parentId?: string) => {
    if (!user || !post) {
      toast({ title: "Error", description: "You must be logged in to comment", variant: "destructive" });
      return;
    }
    
    const text = parentId ? replyText.trim() : newComment.trim();
    if (!text) {
      toast({ title: "Invalid comment", description: "Comment cannot be empty", variant: "destructive" });
      return;
    }

    try {
      let result;
      // Note: parent_id might not exist in the schema, so we'll only include it if it's provided
      // and the table supports it. For now, we'll omit it to avoid errors.
      if (post.type === 'community') {
        result = await supabase
          .from("community_post_comments")
          .insert({ 
            post_id: postId, 
            user_id: user.id, 
            content: text
            // parent_id is not in the schema, so we omit it
          })
          .select()
          .single();
      } else {
        result = await supabase
          .from("post_comments")
          .insert({ 
            submission_id: postId, 
            user_id: user.id, 
            content: text
            // parent_id is not in the schema, so we omit it
          })
          .select()
          .single();
      }

      if (result.error) {
        console.error("Database error:", result.error);
        throw new Error(result.error.message || "Database error occurred");
      }

      if (!result.data) {
        throw new Error("Comment was not created");
      }

      if (parentId) {
        setReplyText("");
        setReplyingTo(null);
      } else {
        setNewComment("");
      }
      
      // Wait a bit for database to commit
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh comment count first
      await refreshCommentCount();
      
      // Then refresh comments (with retry to ensure new comment appears)
      for (let i = 0; i < 3; i++) {
        await fetchComments();
        // Check if comment count matches
        if (i < 2) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      toast({ title: "Comment added", description: "Your comment has been posted" });
    } catch (err: any) {
      console.error("Error adding comment:", err);
      const errorMessage = err?.message || err?.error?.message || "Failed to add comment. Please try again.";
      toast({ 
        title: "Error", 
        description: errorMessage, 
        variant: "destructive" 
      });
    }
  };

  const refreshCommentCount = async () => {
    if (!postId || !post) return;

    try {
      let commentsRes;
      if (post.type === 'community') {
        commentsRes = await supabase
          .from("community_post_comments")
          .select("id")
          .eq("post_id", postId);
      } else {
        commentsRes = await supabase
          .from("post_comments")
          .select("id")
          .eq("submission_id", postId);
      }

      if (commentsRes.error) throw commentsRes.error;
      const commentsCount = (commentsRes.data || []).length;

      setPost(prev => prev ? { ...prev, comments_count: commentsCount } : null);
    } catch (err) {
      console.error("Error refreshing comment count:", err);
    }
  };

  const renderComment = (comment: Comment, depth = 0) => (
    <div key={comment.id} className={`${depth > 0 ? 'ml-8 border-l-2 border-muted pl-4' : ''}`}>
      <div className="flex gap-3 mb-4">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={comment.user_profile?.avatar_url || undefined} />
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">
              {comment.user_profile?.username || "Anonymous"}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(comment.created_at).toLocaleString()}
            </span>
          </div>
          <p className="text-sm mb-2">{comment.content}</p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </Button>
          </div>
          
          {replyingTo === comment.id && (
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addComment(comment.id)}
                className="text-sm"
              />
              <Button
                size="sm"
                onClick={() => addComment(comment.id)}
                disabled={!replyText.trim()}
              >
                Reply
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyText("");
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {comment.replies && comment.replies.map(reply => renderComment(reply, depth + 1))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
        <TopNavbar />
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <Card>
              <CardContent className="p-6">
                <div className="h-64 bg-muted rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
        <TopNavbar />
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Post not found</h1>
            <Button onClick={() => navigate("/community")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Community
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <TopNavbar />
      
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-6">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate("/community")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Community
          </Button>

          {/* Post */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {/* Post Header */}
              <div className="p-6 pb-0">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={post.user_profile?.avatar_url || undefined} />
                    <AvatarFallback>
                      {post.user_profile?.username?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">
                      {post.user_profile?.username || "Anonymous"}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(post.created_at).toLocaleString()}
                      </div>
                      {post.geo_location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {post.geo_location}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant={post.type === 'community' ? 'default' : 'secondary'}>
                    {post.type === 'community' ? 'Community' : 'Quest'}
                  </Badge>
                </div>

                {post.title && (
                  <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
                )}
              </div>

              {/* Post Images - Full width without crop */}
              {post.image_urls && post.image_urls.length > 0 && (
                <div className="mb-6">
                  <PostImageCarousel 
                    images={post.image_urls} 
                    alt={post.title || "Post image"}
                    className="w-full"
                  />
                </div>
              )}

              <div className="px-6 pb-6">
                {/* Post Content */}
                <div className="mb-4">
                  <p className="text-base leading-relaxed">{post.content}</p>
                </div>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-6 py-4 border-y">
                  <Button
                    variant="ghost"
                    onClick={toggleLike}
                    className="flex items-center gap-2"
                  >
                    <Heart 
                      className={`h-5 w-5 ${post.user_has_liked ? 'fill-red-500 text-red-500' : ''}`} 
                    />
                    <span>{post.likes_count}</span>
                  </Button>
                  
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MessageCircle className="h-5 w-5" />
                    <span>{post.comments_count} comments</span>
                  </div>
                  
                  {post.type === 'quest' && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Share2 className="h-5 w-5" />
                      <span>{post.shares_count || 0} shares</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add Comment */}
          {user && (
            <Card>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={user.user_metadata?.avatar_url || undefined} />
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <Textarea
                      placeholder="What are your thoughts?"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[100px] resize-none"
                    />
                    <div className="flex justify-end">
                      <Button 
                        onClick={() => addComment()}
                        disabled={!newComment.trim()}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Comment
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-6">
                Comments ({post.comments_count})
              </h2>
              
              {(() => {
                console.log("Rendering comments section:", {
                  commentsLength: comments.length,
                  comments: comments,
                  postCommentsCount: post.comments_count
                });
                
                if (comments.length === 0) {
                  return (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No comments yet. Be the first to share your thoughts!</p>
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-6">
                    {comments.map(comment => {
                      console.log("Rendering comment:", comment);
                      return renderComment(comment);
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PostDetail;