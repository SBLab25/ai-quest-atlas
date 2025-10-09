import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { SimpleTeamDialog } from "@/components/teams/SimpleTeamDialog";
import CrewSidebar from "@/components/community/CrewSidebar";

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
  const navigate = useNavigate();

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
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  

  // SEO
  useEffect(() => {
    document.title = "Adventure Crew | Quest Community";

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
    const refetch = () => fetchPosts();
    window.addEventListener('submissions-changed', refetch);
    window.addEventListener('community-posts-changed', refetch);
    return () => {
      window.removeEventListener('submissions-changed', refetch);
      window.removeEventListener('community-posts-changed', refetch);
    };
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

      // Fetch user profiles from both Users and profiles tables
      const { data: usersProfiles } = await supabase
        .from("Users")
        .select("id, username, bio, avatar_url")
        .in("id", uniqueUserIds);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", uniqueUserIds);

      // Merge profiles, prioritizing profiles table over Users table
      const profilesMap = new Map();
      (usersProfiles || []).forEach(p => profilesMap.set(p.id, p));
      (profiles || []).forEach(p => profilesMap.set(p.id, p)); // Override with profiles data if exists
      const allProfiles = Array.from(profilesMap.values());

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
              username: profile.username || null,
              full_name: ('full_name' in profile) ? (profile as any).full_name : (('bio' in profile) ? (profile as any).bio : null),
              avatar_url: profile.avatar_url || null
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
              username: profile.username || null,
              full_name: ('full_name' in profile) ? (profile as any).full_name : (('bio' in profile) ? (profile as any).bio : null),
              avatar_url: profile.avatar_url || null
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

  const [globalSearch, setGlobalSearch] = useState("");

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const text = `${p.title || ""} ${p.content || p.description || ""} ${(p.tags || []).join(" ")}`.toLowerCase();
      const searchOk = globalSearch ? text.includes(globalSearch.toLowerCase()) : true;
      const tagOk = tagFilter ? (p.tags || []).some((t) => t.toLowerCase() === tagFilter.toLowerCase()) : true;
      const contentTypeOk = typeFilter === "all" ? true : p.type === typeFilter;
      const postTypeOk = postTypeFilter === "all" ? true : p.post_type === postTypeFilter;
      return searchOk && tagOk && contentTypeOk && postTypeOk;
    });
  }, [posts, globalSearch, tagFilter, typeFilter, postTypeFilter]);

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

  const handleUserProfileClick = (userId: string) => {
    if (userId && user && userId !== user.id) {
      navigate(`/profile/${userId}`);
    } else if (userId === user?.id) {
      navigate('/profile');
    }
  };

  const renderDescription = (post: UnifiedPost, maxLength: number = 150) => {
    const description = post.content || post.description || "";
    const isExpanded = expandedDescriptions[post.id];
    
    if (description.length <= maxLength || isExpanded) {
      return description;
    }
    
    return (
      <>
        {description.slice(0, maxLength)}...
        <button
          className="text-muted-foreground ml-1 hover:text-foreground"
          onClick={() => setExpandedDescriptions(prev => ({
            ...prev,
            [post.id]: true
          }))}
        >
          more
        </button>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <TopNavbar />
      <CrewSidebar onSearchChange={(t) => setGlobalSearch(t)} />
      
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent mb-4">Adventure Crew</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Share achievements, get help, and connect with fellow adventurers</p>
          </div>

          {/* Action Bar */}
          <Card className="backdrop-blur-sm bg-card/50 border-border/50 shadow-lg">
            <CardContent className="p-4">
              <div className="flex gap-2">
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Post
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md mx-auto">
                      <DialogHeader>
                        <DialogTitle>Share with Community</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input 
                          placeholder="Post title" 
                          value={title} 
                          onChange={(e) => setTitle(e.target.value)} 
                        />
                        
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={postType}
                            onChange={(e) => setPostType(e.target.value as any)}
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
                
                <Button 
                  variant="outline" 
                  className="border-border/50 hover:bg-accent/20"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Filters Panel */}
          {showFilters && (
            <Card className="backdrop-blur-sm bg-card/50 border-border/50 shadow-lg">
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
                    <option value="quest">Quest Submissions</option>
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

          {/* Instagram-style Posts Feed */}
          <div className="space-y-6">
            {loading ? (
              <div className="grid gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse border-0 rounded-lg shadow-lg bg-card/50">
                    <CardContent className="p-0">
                      <div className="h-96 bg-muted/50 rounded-lg"></div>
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
                <Card key={post.id} className="overflow-hidden rounded-lg shadow-lg bg-card/80 backdrop-blur-sm border-border/50 hover:shadow-xl transition-all duration-300">
                  <div className="p-4 flex flex-col md:flex-row gap-4">
                    {/* Media - Left */}
                    {post.image_urls && post.image_urls.length > 0 && (
                      <div className="w-full md:w-80 md:h-80 aspect-square md:aspect-auto flex-shrink-0 relative overflow-hidden rounded-lg">
                        <PostImageCarousel 
                          images={post.image_urls}
                          alt={post.title || "Post image"}
                          className="w-full h-full object-cover"
                          showCounter={post.image_urls.length > 1}
                          onImageClick={() => navigate(`/post/${post.id}`)}
                        />
                      </div>
                    )}

                    {/* Content - Right */}
                    <div className="flex-1 flex flex-col">
                      {/* Profile Header */}
                      <div className="flex items-center gap-3 pb-2">
                        <Avatar 
                          className="h-8 w-8 cursor-pointer" 
                          onClick={() => handleUserProfileClick(post.user_id)}
                        >
                          <AvatarImage src={post.user_profile?.avatar_url || ""} />
                          <AvatarFallback>
                            {post.user_profile?.username?.[0]?.toUpperCase() || 
                             post.user_profile?.full_name?.[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p 
                            className="text-sm font-semibold truncate cursor-pointer hover:underline" 
                            onClick={() => handleUserProfileClick(post.user_id)}
                          >
                            {post.user_profile?.username || post.user_profile?.full_name || "Anonymous"}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-2">
                            {new Date(post.created_at).toLocaleDateString()}
                            <span className="inline-flex items-center gap-1">
                              {post.geo_location && (
                                <>
                                  <MapPin className="h-3 w-3" /> {post.geo_location}
                                </>
                              )}
                            </span>
                          </p>
                        </div>
                        <Badge variant={post.type === 'community' ? 'default' : 'secondary'} className="text-xs">
                          {post.type === 'community' ? 'Community' : 'Quest'}
                        </Badge>
                      </div>

                      {/* Caption */}
                      <div className="text-sm mb-3">
                        <span className="font-semibold mr-2">
                          {post.user_profile?.username || post.user_profile?.full_name || "Anonymous"}
                        </span>
                        <span>
                          {expandedDescriptions[post.id] || (post.content || post.description || "").length <= 150
                            ? (post.content || post.description || "")
                            : `${(post.content || post.description || "").slice(0, 150)}...`}
                        </span>
                        {(post.content || post.description || "").length > 150 && (
                          <button
                            className="text-muted-foreground ml-1 hover:text-foreground"
                            onClick={() => setExpandedDescriptions(prev => ({
                              ...prev,
                              [post.id]: !prev[post.id]
                            }))}
                          >
                            {expandedDescriptions[post.id] ? " less" : " more"}
                          </button>
                        )}
                      </div>

                      {/* Tags */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
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

                      {/* Actions and Stats */}
                      <div className="mt-auto">
                        <div className="flex items-center gap-4 mb-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 h-auto hover:bg-transparent"
                            onClick={() => toggleLike(post.id)}
                          >
                            <Heart 
                              className={`h-6 w-6 ${post.user_has_liked ? 'fill-red-500 text-red-500' : 'text-foreground'}`} 
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 h-auto hover:bg-transparent"
                            onClick={() => navigate(`/post/${post.id}`)}
                          >
                            <MessageCircle className="h-6 w-6" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 h-auto hover:bg-transparent"
                            onClick={() => navigator.share ? navigator.share({ 
                              title: post.title || 'Check out this post',
                              text: post.content || post.description,
                              url: window.location.href 
                            }) : null}
                          >
                            <Send className="h-6 w-6" />
                          </Button>
                          {post.type === 'quest' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-0 h-auto hover:bg-transparent ml-auto"
                              onClick={() => toggleShare(post.id)}
                            >
                              <Share2 className={`${post.user_has_shared ? 'fill-current' : ''} h-6 w-6`} />
                            </Button>
                          )}
                        </div>

                        {post.likes_count > 0 && (
                          <p className="text-sm font-semibold mb-1">
                            {post.likes_count} {post.likes_count === 1 ? 'like' : 'likes'}
                          </p>
                        )}

                        {post.comments_count > 0 && (
                          <button
                            className="text-sm text-muted-foreground mt-1 hover:text-foreground"
                            onClick={() => navigate(`/post/${post.id}`)}
                          >
                            View all {post.comments_count} comment{post.comments_count !== 1 ? 's' : ''}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
        
        {/* Team-Up Button - Fixed position bottom right */}
        <div className="fixed bottom-6 right-6 z-50">
          <SimpleTeamDialog />
        </div>
      </main>

    </div>
  );
};

export default Community;