import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { AppSidebar } from "@/components/navigation/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Heart, MessageCircle, Send, Hash, Filter, Plus, ChevronDown, ChevronUp, Tag, Image } from "lucide-react";
import { MultiImageUpload } from "@/components/ui/multi-image-upload";
import { SocialMediaFeed } from "@/components/social/SocialMediaFeed";
import { StreakDisplay } from "@/components/streak/StreakDisplay";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { ProfileDropdown } from "@/components/navigation/ProfileDropdown";

interface CommunityPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  post_type: "general" | "help" | "achievement" | "discussion";
  tags: string[];
  image_url?: string | null;
  image_urls?: string[];
  created_at: string;
  likes_count: number;
  comments_count: number;
  user_has_liked: boolean;
  user_profile?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface CommunityComment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  user_profile?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
}

const Community = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Create form state
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<CommunityPost["post_type"]>("general");
  const [tagsInput, setTagsInput] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // Filters
  const [tagFilter, setTagFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<CommunityPost["post_type"] | "all">("all");
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, CommunityComment[]>>({});
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [newComment, setNewComment] = useState<Record<string, string>>({});

  // SEO
  useEffect(() => {
    document.title = "Community Chat & Achievements | Quest Community";

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Community chat to showcase achievements, ask for help, comment, and tag posts.");
    } else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = "Community chat to showcase achievements, ask for help, comment, and tag posts.";
      document.head.appendChild(m);
    }

    const canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      const link = document.createElement("link");
      link.rel = "canonical";
      link.href = window.location.href;
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      // Using any casting to avoid strict typing against generated types
      const { data, error } = await (supabase as any)
        .from("community_posts")
        .select("id, user_id, title, content, post_type, tags, image_url, image_urls, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const userIds: string[] = (data || []).map((p: any) => p.user_id);
      const { data: profiles } = await supabase
        .from("Users")
        .select("id, username, bio, avatar_url")
        .in("id", userIds);

      const postsWithCounts: CommunityPost[] = await Promise.all(
        (data || []).map(async (p: any) => {
          const [likesRes, commentsRes] = await Promise.all([
            (supabase as any).from("community_post_likes").select("user_id").eq("post_id", p.id),
            (supabase as any).from("community_post_comments").select("id").eq("post_id", p.id),
          ]);
          const likes = likesRes.data || [];
          const cmts = commentsRes.data || [];
          const profile = profiles?.find((pr) => pr.id === p.user_id) || null;
          return {
            ...p,
            tags: p.tags || [],
            image_urls: p.image_urls || [],
            likes_count: likes.length,
            comments_count: cmts.length,
            user_has_liked: user ? likes.some((l: any) => l.user_id === user.id) : false,
            user_profile: profile ? {
              username: profile.username,
              full_name: profile.bio, // Using bio as full_name since Users table has bio instead of full_name
              avatar_url: profile.avatar_url
            } : null,
          } as CommunityPost;
        })
      );

      setPosts(postsWithCounts);
    } catch (err) {
      console.error("Error loading community posts", err);
      toast({ title: "Error", description: "Failed to load community posts", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const tagOk = tagFilter ? (p.tags || []).some((t) => t.toLowerCase() === tagFilter.toLowerCase()) : true;
      const typeOk = typeFilter === "all" ? true : p.post_type === typeFilter;
      return tagOk && typeOk;
    });
  }, [posts, tagFilter, typeFilter]);

  const handleCreatePost = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to post", variant: "destructive" });
      return;
    }
    if (!title.trim() || !content.trim()) return;

    try {
      setCreating(true);
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const { data, error } = await (supabase as any)
        .from("community_posts")
        .insert({
          user_id: user.id,
          title: title.trim(),
          content: content.trim(),
          post_type: postType,
          tags,
          image_url: imageUrls.length > 0 ? imageUrls[0] : null, // Keep backward compatibility with first image
          image_urls: imageUrls,
        })
        .select()
        .single();

      if (error) throw error;

      // Optimistic add
      setTitle("");
      setContent("");
      setTagsInput("");
      setPostType("general");
      setImageUrls([]);

      toast({ title: "Posted", description: "Your community post is live!" });
      await fetchPosts();
    } catch (err) {
      console.error("Error creating post", err);
      toast({ title: "Error", description: "Failed to create post", variant: "destructive" });
    } finally {
      setCreating(false);
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
                likes_count: p.user_has_liked ? p.likes_count - 1 : p.likes_count + 1,
              }
            : p
        )
      );
    } catch (err) {
      console.error("Error toggling like", err);
    }
  };

  const loadComments = async (postId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from("community_post_comments")
        .select("id, user_id, post_id, content, created_at")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (error) throw error;

      const userIds = (data || []).map((c: any) => c.user_id);
      const { data: profiles } = await supabase
        .from("Users")
        .select("id, username, bio, avatar_url")
        .in("id", userIds);

      const withProfiles: CommunityComment[] = (data || []).map((c: any) => {
        const profile = profiles?.find((p) => p.id === c.user_id);
        return {
          ...c,
          user_profile: profile ? {
            username: profile.username,
            full_name: profile.bio,
            avatar_url: profile.avatar_url
          } : null,
        };
      });

      setComments((prev) => ({ ...prev, [postId]: withProfiles }));
    } catch (err) {
      console.error("Error loading comments", err);
    }
  };

  const toggleComments = async (postId: string) => {
    const isOpen = openComments[postId];
    setOpenComments((prev) => ({ ...prev, [postId]: !isOpen }));
    if (!isOpen && !comments[postId]) {
      await loadComments(postId);
    }
  };

  const addComment = async (postId: string) => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to comment", variant: "destructive" });
      return;
    }
    const text = (newComment[postId] || "").trim();
    if (!text) return;

    try {
      const { error } = await (supabase as any)
        .from("community_post_comments")
        .insert({ post_id: postId, user_id: user.id, content: text });
      if (error) throw error;

      setNewComment((prev) => ({ ...prev, [postId]: "" }));
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p)));
      await loadComments(postId);
    } catch (err) {
      console.error("Error adding comment", err);
      toast({ title: "Error", description: "Failed to add comment", variant: "destructive" });
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <div className="flex-1">
          {/* Header */}
          <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="container mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-2xl font-bold">Community</h1>
              </div>
              <div className="flex items-center gap-4">
                <ThemeToggleButton />
                <NotificationCenter />
                <StreakDisplay />
                <ProfileDropdown />
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <div className="max-w-4xl mx-auto">
              {/* Community Feed Section */}
              <div className="border-b pb-6 mb-6">
                <div className="px-4 py-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold">Community Feed</h2>
                      <p className="text-muted-foreground">See what other adventurers are sharing</p>
                    </div>
                  </div>
                  <SocialMediaFeed />
                </div>
              </div>

              {/* Community Posts Section */}
              <div className="px-4 relative">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Community Posts</h2>
                    <p className="text-muted-foreground">Share achievements, ask for help, and discuss</p>
                  </div>
                </div>

                {/* Floating Action Buttons */}
                <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
                  <Button 
                    size="icon" 
                    className="h-12 w-12 rounded-full shadow-lg"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-5 w-5" />
                  </Button>
                  
                  <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                    <DialogTrigger asChild>
                      <Button 
                        size="icon" 
                        className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
                      >
                        <Plus className="h-6 w-6" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Create a Post</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4">
                        <Input 
                          placeholder="What's on your mind?" 
                          value={title} 
                          onChange={(e) => setTitle(e.target.value)} 
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={postType}
                            onChange={(e) => setPostType(e.target.value as CommunityPost["post_type"])}
                          >
                            <option value="general">General</option>
                            <option value="help">Help</option>
                            <option value="achievement">Achievement</option>
                            <option value="discussion">Discussion</option>
                          </select>
                          <Input 
                            placeholder="Tags (comma separated)" 
                            value={tagsInput} 
                            onChange={(e) => setTagsInput(e.target.value)} 
                          />
                        </div>
                        <Textarea 
                          placeholder="Write your post..." 
                          value={content} 
                          onChange={(e) => setContent(e.target.value)} 
                          className="min-h-[100px]" 
                        />
                        
                        {/* Multi-Image Upload */}
                        <div>
                          <label className="text-sm font-medium mb-2 flex items-center gap-2">
                            <Image className="h-4 w-4" />
                            Add Images (Optional, up to 3)
                          </label>
                          <MultiImageUpload
                            onImagesUpdate={setImageUrls}
                            existingImages={imageUrls}
                            maxImages={3}
                          />
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            onClick={() => setShowCreateDialog(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={() => {
                              handleCreatePost();
                              setShowCreateDialog(false);
                            }} 
                            disabled={!title.trim() || !content.trim() || creating}
                          >
                            {creating ? "Posting..." : "Post"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                  <Card className="mb-4">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input 
                          placeholder="Filter by tag..." 
                          value={tagFilter} 
                          onChange={(e) => setTagFilter(e.target.value)} 
                        />
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={typeFilter}
                          onChange={(e) => setTypeFilter(e.target.value as any)}
                        >
                          <option value="all">All Posts</option>
                          <option value="general">General</option>
                          <option value="help">Help</option>
                          <option value="achievement">Achievement</option>
                          <option value="discussion">Discussion</option>
                        </select>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2" 
                        onClick={() => { setTagFilter(""); setTypeFilter("all"); }}
                      >
                        Clear Filters
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Instagram-like Posts Feed */}
                <div className="space-y-6 pb-20">
                  {loading ? (
                    <div className="text-center text-muted-foreground py-12">Loading posts...</div>
                  ) : filteredPosts.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-4">No posts yet. Be the first to share!</p>
                      <Button onClick={() => setShowCreateDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" /> Create First Post
                      </Button>
                    </div>
                  ) : (
                    filteredPosts.map((post) => (
                      <Card key={post.id} className="border-0 shadow-sm">
                        <CardContent className="p-0">
                          {/* Post Header */}
                          <div className="flex items-center gap-3 p-4 pb-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={post.user_profile?.avatar_url || undefined} />
                              <AvatarFallback>
                                {(post.user_profile?.full_name?.charAt(0) || post.user_profile?.username?.charAt(0) || "U").toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-semibold text-sm">
                                {post.user_profile?.username || "Anonymous"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(post.created_at).toLocaleString()}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {post.post_type}
                            </Badge>
                          </div>

                          {/* Post Title */}
                          {post.title && (
                            <div className="px-4 pb-2">
                              <h3 className="font-semibold text-base">{post.title}</h3>
                            </div>
                          )}

                          {/* Post Images */}
                          {((post.image_urls && post.image_urls.length > 0) || post.image_url) && (
                            <div className="relative">
                              {/* Use new image_urls array if available, fallback to single image_url */}
                              {post.image_urls && post.image_urls.length > 0 ? (
                                post.image_urls.length === 1 ? (
                                  <img
                                    src={post.image_urls[0]}
                                    alt="Post image"
                                    className="w-full max-h-96 object-cover"
                                  />
                                ) : (
                                  <div className={`grid gap-1 ${post.image_urls.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                                    {post.image_urls.slice(0, 3).map((url, index) => (
                                      <div key={index} className={`relative ${post.image_urls!.length === 3 && index === 0 ? 'col-span-2' : ''}`}>
                                        <img
                                          src={url}
                                          alt={`Post image ${index + 1}`}
                                          className="w-full h-48 object-cover"
                                        />
                                        {/* Show +N overlay for more than 3 images */}
                                        {index === 2 && post.image_urls!.length > 3 && (
                                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <span className="text-white font-semibold">+{post.image_urls!.length - 3}</span>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )
                              ) : post.image_url && (
                                <img
                                  src={post.image_url}
                                  alt="Post image"
                                  className="w-full max-h-96 object-cover"
                                />
                              )}
                            </div>
                          )}

                          {/* Post Content */}
                          <div className="px-4 pb-3">
                            <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                          </div>

                          {/* Tags */}
                          {post.tags?.length > 0 && (
                            <div className="px-4 pb-3 flex flex-wrap gap-1">
                              {post.tags.map((tag) => (
                                <Badge 
                                  key={tag} 
                                  variant="secondary" 
                                  className="text-xs cursor-pointer hover:bg-secondary/80" 
                                  onClick={() => setTagFilter(tag)}
                                >
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* Post Actions */}
                          <div className="flex items-center justify-between px-4 py-3 border-t">
                            <div className="flex items-center gap-4">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => toggleLike(post.id)} 
                                className={`p-1 h-auto ${post.user_has_liked ? "text-red-500" : "text-muted-foreground"}`}
                              >
                                <Heart className={`h-5 w-5 ${post.user_has_liked ? "fill-current" : ""}`} />
                                <span className="ml-1 text-sm">{post.likes_count}</span>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => toggleComments(post.id)} 
                                className="p-1 h-auto text-muted-foreground"
                              >
                                <MessageCircle className="h-5 w-5" />
                                <span className="ml-1 text-sm">{post.comments_count}</span>
                              </Button>
                            </div>
                          </div>

                          {/* Comments Section */}
                          {openComments[post.id] && (
                            <div className="border-t">
                              <div className="p-4 space-y-3">
                                {comments[post.id]?.map((comment) => (
                                  <div key={comment.id} className="flex items-start gap-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={comment.user_profile?.avatar_url || undefined} />
                                      <AvatarFallback>
                                        {(comment.user_profile?.username?.charAt(0) || "U").toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <div className="bg-muted rounded-lg p-3">
                                        <p className="font-semibold text-sm mb-1">
                                          {comment.user_profile?.username || "Anonymous"}
                                        </p>
                                        <p className="text-sm">{comment.content}</p>
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-1 ml-1">
                                        {new Date(comment.created_at).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                ))}

                                {/* Add Comment */}
                                {user && (
                                  <div className="flex items-center gap-3 pt-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback>
                                        {user.email?.charAt(0).toUpperCase() || "U"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 flex gap-2">
                                      <Input
                                        placeholder="Add a comment..."
                                        value={newComment[post.id] || ""}
                                        onChange={(e) => setNewComment((prev) => ({ ...prev, [post.id]: e.target.value }))}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") addComment(post.id);
                                        }}
                                        className="flex-1"
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
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Community;