import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { AppSidebar } from "@/components/navigation/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Heart, MessageCircle, Send, Hash, Filter, Plus, ChevronDown, ChevronUp, Tag } from "lucide-react";

interface CommunityPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  post_type: "general" | "help" | "achievement" | "discussion";
  tags: string[];
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

  // Filters
  const [tagFilter, setTagFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<CommunityPost["post_type"] | "all">("all");
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, CommunityComment[]>>({});
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
        .select("id, user_id, title, content, post_type, tags, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const userIds: string[] = (data || []).map((p: any) => p.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
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
            likes_count: likes.length,
            comments_count: cmts.length,
            user_has_liked: user ? likes.some((l: any) => l.user_id === user.id) : false,
            user_profile: profile,
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
        })
        .select()
        .single();

      if (error) throw error;

      // Optimistic add
      setTitle("");
      setContent("");
      setTagsInput("");
      setPostType("general");

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
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", userIds);

      const withProfiles: CommunityComment[] = (data || []).map((c: any) => ({
        ...c,
        user_profile: profiles?.find((p) => p.id === c.user_id) || null,
      }));

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
    <div className="min-h-screen flex">
      <AppSidebar />
      <main className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Community Chat</h1>
            <p className="text-muted-foreground">Showcase achievements, ask for help, and connect with explorers.</p>
          </div>
        </div>

        {/* Create Post */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" /> Create a Post</CardTitle>
            <CardDescription>Share an achievement, ask for help, or start a discussion. Add tags for discoverability.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Input placeholder="Title (e.g., Completed the Summit Quest!)" value={title} onChange={(e) => setTitle(e.target.value)} />
              <div className="grid md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground whitespace-nowrap">Type</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={postType}
                    onChange={(e) => setPostType(e.target.value as CommunityPost["post_type"]) }
                  >
                    <option value="general">General</option>
                    <option value="help">Help</option>
                    <option value="achievement">Achievement</option>
                    <option value="discussion">Discussion</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Tags (comma separated)" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
                </div>
              </div>
              <Textarea placeholder="Write your post..." value={content} onChange={(e) => setContent(e.target.value)} className="min-h-[120px]" />
              <div className="flex justify-end">
                <Button onClick={handleCreatePost} disabled={!title.trim() || !content.trim() || creating}>
                  {creating ? "Posting..." : "Post"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <Input placeholder="Filter by tag (e.g., hiking)" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground whitespace-nowrap">Type</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                >
                  <option value="all">All</option>
                  <option value="general">General</option>
                  <option value="help">Help</option>
                  <option value="achievement">Achievement</option>
                  <option value="discussion">Discussion</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => { setTagFilter(""); setTypeFilter("all"); }}>Clear</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts List */}
        {loading ? (
          <div className="text-center text-muted-foreground py-12">Loading posts...</div>
        ) : filteredPosts.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground">No posts yet. Be the first to share!</CardContent></Card>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={post.user_profile?.avatar_url || undefined} alt={post.user_profile?.full_name || post.user_profile?.username || "User"} />
                        <AvatarFallback>
                          {(post.user_profile?.full_name?.charAt(0) || post.user_profile?.username?.charAt(0) || "U").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{post.title}</h3>
                          <span className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {post.user_profile?.full_name || post.user_profile?.username || "Anonymous"} • {post.post_type}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="mt-3 text-sm whitespace-pre-wrap">{post.content}</div>

                    {/* Tags */}
                    {post.tags?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {post.tags.map((t) => (
                          <Badge key={t} variant="secondary" className="cursor-pointer" onClick={() => setTagFilter(t)}>
                            #{t}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-4 flex items-center gap-4">
                      <Button variant="ghost" size="sm" onClick={() => toggleLike(post.id)} className={post.user_has_liked ? "text-red-500" : "text-muted-foreground"}>
                        <Heart className={`h-5 w-5 ${post.user_has_liked ? "fill-current" : ""}`} /> {post.likes_count}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleComments(post.id)} className="text-muted-foreground">
                        <MessageCircle className="h-5 w-5" /> {post.comments_count}
                        {openComments[post.id] ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
                      </Button>
                    </div>

                    {/* Comments */}
                    {openComments[post.id] && (
                      <div className="mt-4 space-y-3">
                        {(comments[post.id] || []).map((c) => (
                          <div key={c.id} className="flex gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={c.user_profile?.avatar_url || undefined} />
                              <AvatarFallback>
                                {(c.user_profile?.full_name?.charAt(0) || c.user_profile?.username?.charAt(0) || "U").toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="text-sm">
                                <span className="font-medium">{c.user_profile?.full_name || c.user_profile?.username || "User"}</span>{" "}
                                {c.content}
                              </div>
                              <div className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</div>
                            </div>
                          </div>
                        ))}

                        {/* Add comment */}
                        {user && (
                          <div className="flex gap-2 pt-2">
                            <Input
                              placeholder="Add a comment..."
                              value={newComment[post.id] || ""}
                              onChange={(e) => setNewComment((prev) => ({ ...prev, [post.id]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") addComment(post.id);
                              }}
                            />
                            <Button size="sm" onClick={() => addComment(post.id)} disabled={!newComment[post.id]?.trim()}>
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Community;
