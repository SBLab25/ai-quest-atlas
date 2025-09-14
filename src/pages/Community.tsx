import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { TopNavbar } from "@/components/navigation/TopNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Heart, MessageCircle, Send, Share2, Filter, Plus, Tag, Image, MapPin, Clock, User } from "lucide-react";
import { MultiImageUpload } from "@/components/ui/multi-image-upload";
import { PostImageCarousel } from "@/components/ui/post-image-carousel";

// Unified interface for all posts (community posts + quest submissions)
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
  user_profile?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
}

const Community = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [posts, setPosts] = useState<UnifiedPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Create form state
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<UnifiedPost["post_type"]>("general");
  const [tagsInput, setTagsInput] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // Filters
  const [tagFilter, setTagFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<"all" | "community" | "quest">("all");
  const [postTypeFilter, setPostTypeFilter] = useState<UnifiedPost["post_type"] | "all">("all");
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});

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

      // Helper to ensure we always have public URLs for storage objects
      const toPublicUrls = (bucket: string, urls: string[]) => {
        return (urls || []).map((u) => {
          if (!u) return u;
          if (u.startsWith("http")) return u;
          const { data } = supabase.storage.from(bucket).getPublicUrl(u);
          return data.publicUrl || u;
        });
      };
      
      // Fetch both community posts and quest submissions
      const [communityRes, questRes] = await Promise.all([
        // Community posts
        (supabase as any)
          .from("community_posts")
          .select("id, user_id, title, content, post_type, tags, image_urls, created_at")
          .order("created_at", { ascending: false }),
        
        // Quest submissions (verified)
        supabase
          .from("Submissions")
          .select("id, description, photo_url, image_urls, user_id, geo_location, submitted_at")
          .eq("status", "verified")
          .order("submitted_at", { ascending: false })
      ]);

      if (communityRes.error || questRes.error) {
        throw communityRes.error || questRes.error;
      }

      const communityPosts = communityRes.data || [];
      const questSubmissions = questRes.data || [];

      // Get all unique user IDs
      const allUserIds = [
        ...communityPosts.map((p: any) => p.user_id),
        ...questSubmissions.map((s: any) => s.user_id)
      ];
      const uniqueUserIds = [...new Set(allUserIds)];

      // Fetch user profiles
      const { data: usersProfiles } = await supabase
        .from("Users")
        .select("id, username, bio, avatar_url")
        .in("id", uniqueUserIds);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", uniqueUserIds);

      const allProfiles = [...(usersProfiles || []), ...(profiles || [])];

      // Process community posts
      const processedCommunityPosts = await Promise.all(
        communityPosts.map(async (p: any) => {
          const [likesRes, commentsRes] = await Promise.all([
            (supabase as any).from("community_post_likes").select("user_id").eq("post_id", p.id),
            (supabase as any).from("community_post_comments").select("id").eq("post_id", p.id),
          ]);
          
          const likes = likesRes.data || [];
          const comments = commentsRes.data || [];
          const profile = allProfiles.find((pr) => pr.id === p.user_id);
          
          
          // Check for specific post debugging
          if (p.title?.includes("Hidden Temple")) {
            console.log("Hidden Temple post found in community_posts:", p);
          }
          
          return {
            id: p.id,
            user_id: p.user_id,
            type: 'community',
            title: p.title,
            content: p.content,
            post_type: p.post_type,
            tags: p.tags || [],
            image_urls: toPublicUrls('community-images', p.image_urls || []),
            created_at: p.created_at,
            likes_count: likes.length,
            comments_count: comments.length,
            user_has_liked: user ? likes.some((l: any) => l.user_id === user.id) : false,
            user_profile: profile ? {
              username: profile.username,
              full_name: ('bio' in profile) ? (profile as any).bio : profile.username,
              avatar_url: profile.avatar_url
            } : null,
          } as UnifiedPost;
        })
      );

      // Process quest submissions
      const processedQuestPosts = await Promise.all(
        questSubmissions.map(async (s: any) => {
          const [likesRes, commentsRes, sharesRes] = await Promise.all([
            supabase.from("post_likes").select("user_id").eq("submission_id", s.id),
            supabase.from("post_comments").select("id").eq("submission_id", s.id),
            supabase.from("post_shares").select("user_id").eq("submission_id", s.id)
          ]);

          const likes = likesRes.data || [];
          const comments = commentsRes.data || [];
          const shares = sharesRes.data || [];
          const profile = allProfiles.find((pr) => pr.id === s.user_id);

          // Process image URLs - ensure consistency between quest submissions and community posts
          let processedImageUrls: string[] = [];
          if (s.image_urls && s.image_urls.length > 0) {
            processedImageUrls = toPublicUrls('quest-submissions', s.image_urls);
          } else if (s.photo_url) {
            // photo_url is already a full URL, but ensure it's in array format for consistency
            processedImageUrls = [s.photo_url];
          }
          
          // Check for specific quest submission debugging
          if (s.description?.includes("Hidden Temple") || s.description?.includes("Kondapalli")) {
            console.log("Hidden Temple quest submission found:", s);
            console.log("Processed image URLs:", processedImageUrls);
          }

          return {
            id: s.id,
            user_id: s.user_id,
            type: 'quest',
            content: s.description || '',
            description: s.description,
            image_urls: processedImageUrls,
            created_at: s.submitted_at,
            geo_location: s.geo_location,
            likes_count: likes.length,
            comments_count: comments.length,
            shares_count: shares.length,
            user_has_liked: user ? likes.some((l: any) => l.user_id === user.id) : false,
            user_has_shared: user ? shares.some((sh: any) => sh.user_id === user.id) : false,
            user_profile: profile ? {
              username: profile.username,
              full_name: ('bio' in profile) ? (profile as any).bio : profile.username,
              avatar_url: profile.avatar_url
            } : null,
          } as UnifiedPost;
        })
      );

      // Combine and sort by creation date
      const allPosts = [...processedCommunityPosts, ...processedQuestPosts]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setPosts(allPosts);
    } catch (err) {
      console.error("Error loading posts", err);
      toast({ title: "Error", description: "Failed to load posts", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const tagOk = tagFilter ? (p.tags || []).some((t) => t.toLowerCase() === tagFilter.toLowerCase()) : true;
      const contentTypeOk = typeFilter === "all" ? true : p.type === typeFilter;
      const postTypeOk = postTypeFilter === "all" ? true : p.post_type === postTypeFilter;
      return tagOk && contentTypeOk && postTypeOk;
    });
  }, [posts, tagFilter, typeFilter, postTypeFilter]);

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
      if (post.type === 'community') {
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

  const toggleShare = async (postId: string) => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to share posts", variant: "destructive" });
      return;
    }
    const post = posts.find((p) => p.id === postId);
    if (!post || post.type !== 'quest') return;

    try {
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

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                user_has_shared: !p.user_has_shared,
                shares_count: (p.shares_count || 0) + (p.user_has_shared ? -1 : 1),
              }
            : p
        )
      );

      toast({
        title: post.user_has_shared ? "Unshared" : "Shared",
        description: post.user_has_shared ? "Post removed from your shares" : "Post shared successfully",
      });
    } catch (err) {
      console.error("Error toggling share", err);
    }
  };

  const loadComments = async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      let data, error;
      if (post.type === 'community') {
        const result = await (supabase as any)
          .from("community_post_comments")
          .select("id, user_id, post_id, content, created_at")
          .eq("post_id", postId)
          .order("created_at", { ascending: true });
        data = result.data;
        error = result.error;
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
      const [usersProfiles, profiles] = await Promise.all([
        supabase.from("Users").select("id, username, bio, avatar_url").in("id", userIds),
        supabase.from("profiles").select("id, username, avatar_url").in("id", userIds)
      ]);

      const allProfiles = [...(usersProfiles.data || []), ...(profiles.data || [])];

      const withProfiles: Comment[] = (data || []).map((c: any) => {
        const profile = allProfiles.find((p) => p.id === c.user_id);
        return {
          ...c,
          post_id: postId,
          user_profile: profile ? {
            username: profile.username,
            full_name: ('bio' in profile) ? (profile as any).bio : profile.username,
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
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (post.type === 'community') {
        const { error } = await (supabase as any)
          .from("community_post_comments")
          .insert({ post_id: postId, user_id: user.id, content: text });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("post_comments")
          .insert({ submission_id: postId, user_id: user.id, content: text });
        if (error) throw error;
      }

      setNewComment((prev) => ({ ...prev, [postId]: "" }));
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p)));
      await loadComments(postId);
      
      toast({ title: "Comment added", description: "Your comment has been posted" });
    } catch (err) {
      console.error("Error adding comment", err);
      toast({ title: "Error", description: "Failed to add comment", variant: "destructive" });
    }
  };

  const toggleDescriptionExpanded = (postId: string) => {
    setExpandedDescriptions(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const renderDescription = (post: UnifiedPost, maxLength: number = 150) => {
    const description = post.content || post.description || "";
    const isExpanded = expandedDescriptions[post.id];
    
    if (description.length <= maxLength) {
      return <span>{description}</span>;
    }
    
    return (
      <span>
        {isExpanded ? description : `${description.slice(0, maxLength)}...`}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleDescriptionExpanded(post.id)}
          className="p-0 h-auto ml-1 text-primary hover:underline"
        >
          {isExpanded ? "show less" : "view more"}
        </Button>
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <TopNavbar />
      
      <main className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent mb-4">
            Adventure Community
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Connect with fellow adventurers, share your quest achievements, and discover new challenges together.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {/* Community Controls */}
          <div className="relative mb-8">
            <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Community Hub</h2>
                    <p className="text-muted-foreground">Share achievements, connect with fellow adventurers</p>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-2"
                    >
                      <Filter className="h-4 w-4" />
                      Filters
                    </Button>
                    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                      <DialogTrigger asChild>
                        <Button className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Create Post
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Share Your Adventure</DialogTitle>
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
                              onChange={(e) => setPostType(e.target.value as UnifiedPost["post_type"])}
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
                              bucket="community-images"
                              path="community-posts"
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
                              {creating ? "Posting..." : "Share"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>


                {/* Filters Panel */}
                {showFilters && (
                  <Card className="mb-4">
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                            <option value="all">All Content</option>
                            <option value="community">Community Posts</option>
                            <option value="quest">Quest Discoveries</option>
                          </select>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={postTypeFilter}
                            onChange={(e) => setPostTypeFilter(e.target.value as any)}
                          >
                            <option value="all">All Types</option>
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
                          onClick={() => { 
                            setTagFilter(""); 
                            setTypeFilter("all"); 
                            setPostTypeFilter("all"); 
                          }}
                        >
                          Clear Filters
                        </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Unified Feed - Instagram-like for Desktop, Traditional for Mobile */}
                <div className="space-y-6 pb-20">
                  {loading ? (
                    <div className="grid gap-6">
                      {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse">
                          <CardContent className="p-0">
                            <div className="h-96 bg-muted rounded-md"></div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : filteredPosts.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-4">No posts yet. Be the first to share!</p>
                      <Button onClick={() => setShowCreateDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" /> Create First Post
                      </Button>
                    </div>
                  ) : (
                    filteredPosts.map((post) => (
                      <Card key={post.id} className="overflow-hidden animate-fade-in hover-scale transition-shadow">
                        <CardContent className="p-0">
                          {isMobile ? (
                            // Mobile Layout: Traditional Social Media Style
                            <>
                              {/* Post Header */}
                              <div className="flex items-center gap-3 p-4 pb-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={post.user_profile?.avatar_url || undefined} />
                                  <AvatarFallback>
                                    {post.type === 'quest' ? <User className="h-5 w-5" /> : (post.user_profile?.username?.charAt(0) || "U").toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <p className="font-semibold text-sm">
                                    {post.user_profile?.username || "Anonymous"}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {new Date(post.created_at).toLocaleDateString()}
                                    </div>
                                    {post.geo_location && (
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {post.geo_location}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Badge variant="outline" className="text-xs">
                                    {post.type}
                                  </Badge>
                                  {post.post_type && (
                                    <Badge variant="secondary" className="text-xs">
                                      {post.post_type}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Post Title */}
                              {post.title && (
                                <div className="px-4 pb-2">
                                  <h3 className="font-semibold text-base">{post.title}</h3>
                                </div>
                              )}

                              {/* Post Images */}
                              {post.image_urls && post.image_urls.length > 0 && (
                                <PostImageCarousel 
                                  images={post.image_urls}
                                  alt="Community post"
                                />
                              )}

                              {/* Post Actions - Below Image */}
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
                                  
                                  {post.type === 'quest' && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleShare(post.id)}
                                      className={`p-0 h-auto ${post.user_has_shared ? 'text-blue-500' : 'text-muted-foreground'}`}
                                      disabled={!user}
                                    >
                                      <Share2 className="h-6 w-6" />
                                    </Button>
                                  )}
                                </div>

                                {/* Stats and Description */}
                                <div className="text-sm space-y-1">
                                  {post.likes_count > 0 && (
                                    <p className="font-semibold">
                                      {post.likes_count} {post.likes_count === 1 ? 'like' : 'likes'}
                                    </p>
                                  )}
                                  
                                   <p>
                                     <span className="font-semibold">{post.user_profile?.username || "Anonymous"}</span>{" "}
                                     {renderDescription(post, 100)}
                                  </p>

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
                              </div>

                              {/* Tags */}
                              {post.tags && post.tags.length > 0 && (
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

                              {/* Comments Section */}
                              {openComments[post.id] && (
                                <div className="border-t p-4 space-y-3">
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
                                </div>
                              )}
                            </>
                          ) : (
                            // Desktop Layout: Instagram-like with fixed square images on left, content on right
                            <div className="flex min-h-[350px] max-w-xl mx-auto">
                              {/* Left Side - Images with fixed square ratio */}
                              <div className="w-[350px] flex-shrink-0">
                                {post.image_urls && post.image_urls.length > 0 ? (
                                  <PostImageCarousel 
                                    images={post.image_urls}
                                    alt={post.title || "Community post"}
                                    className="w-full h-[350px]"
                                  />
                                ) : (
                                  <div className="w-full h-[350px] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border border-border rounded-lg">
                                    <div className="text-center p-6">
                                      <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
                                      <p className="text-muted-foreground text-sm line-clamp-4">{post.content}</p>
                                      <div className="mt-3 text-xs text-muted-foreground">
                                        {post.type === 'quest' ? '🗺️ Quest Discovery' : '💬 Community Post'}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Right Side - Content and Interactions */}
                              <div className="w-64 flex flex-col">
                                {/* Post Header */}
                                <div className="flex items-center gap-3 p-4 border-b">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={post.user_profile?.avatar_url || undefined} />
                                    <AvatarFallback>
                                      {post.type === 'quest' ? <User className="h-5 w-5" /> : (post.user_profile?.username?.charAt(0) || "U").toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <p className="font-semibold text-sm">
                                      {post.user_profile?.username || "Anonymous"}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <Clock className="h-3 w-3" />
                                      {new Date(post.created_at).toLocaleDateString()}
                                      {post.geo_location && (
                                        <>
                                          <MapPin className="h-3 w-3 ml-2" />
                                          <span className="truncate max-w-20">{post.geo_location}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Post Content */}
                                <div className="flex-1 p-4 overflow-y-auto">
                                  <div className="space-y-3">
                                    {/* Title and Description */}
                                    {post.title && (
                                      <h3 className="font-semibold text-base">{post.title}</h3>
                                    )}
                                    
                                     <p className="text-sm">
                                       <span className="font-semibold">{post.user_profile?.username || "Anonymous"}</span>{" "}
                                       {renderDescription(post, 120)}
                                    </p>

                                    {/* Badges */}
                                    <div className="flex flex-wrap gap-1">
                                      <Badge variant="outline" className="text-xs">
                                        {post.type}
                                      </Badge>
                                      {post.post_type && (
                                        <Badge variant="secondary" className="text-xs">
                                          {post.post_type}
                                        </Badge>
                                      )}
                                    </div>

                                    {/* Tags */}
                                    {post.tags && post.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-1">
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

                                    {/* Comments */}
                                    {openComments[post.id] && (
                                      <div className="space-y-3 max-h-60 overflow-y-auto">
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
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Actions and Comment Input */}
                                <div className="border-t">
                                  {/* Action Buttons */}
                                  <div className="flex items-center gap-4 p-4">
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
                                    
                                    {post.type === 'quest' && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleShare(post.id)}
                                        className={`p-0 h-auto ${post.user_has_shared ? 'text-blue-500' : 'text-muted-foreground'}`}
                                        disabled={!user}
                                      >
                                        <Share2 className="h-6 w-6" />
                                      </Button>
                                    )}
                                  </div>

                                  {/* Stats */}
                                  <div className="px-4 pb-2">
                                    <div className="text-sm space-y-1">
                                      {post.likes_count > 0 && (
                                        <p className="font-semibold">
                                          {post.likes_count} {post.likes_count === 1 ? 'like' : 'likes'}
                                        </p>
                                      )}

                                      {post.comments_count > 0 && !openComments[post.id] && (
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
                                  </div>

                                  {/* Add Comment */}
                                  {user && (
                                    <div className="flex gap-2 p-4 pt-0">
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
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
        </div>
      </main>
    </div>
  );
};

export default Community;