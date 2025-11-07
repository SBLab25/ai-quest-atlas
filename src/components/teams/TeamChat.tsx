import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Send, Image as ImageIcon, Reply, X } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

interface TeamMessage {
  id: string;
  team_id: string;
  user_id: string;
  message: string;
  reply_to: string | null;
  attachments: { url: string }[] | null;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
  reply_message?: TeamMessage;
}

interface TeamChatProps {
  teamId: string;
}

export const TeamChat = ({ teamId }: TeamChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<TeamMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(0);

  const MESSAGES_PER_PAGE = 50;

  useEffect(() => {
    if (teamId && user) {
      fetchMessages();
      subscribeToMessages();
    }
  }, [teamId, user, page]);

  useEffect(() => {
    // Auto-scroll only if new messages arrived
    if (messages.length > lastMessageCountRef.current && page === 0) {
      scrollToBottom();
    }
    lastMessageCountRef.current = messages.length;
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("team_messages")
        .select(`
          *,
          profiles(username, avatar_url),
          reply_message:team_messages!reply_to(
            id,
            message,
            profiles(username)
          )
        `)
        .eq("team_id", teamId)
        .order("created_at", { ascending: false })
        .range(page * MESSAGES_PER_PAGE, (page + 1) * MESSAGES_PER_PAGE - 1);

      if (error) throw error;

      if (data) {
        setHasMore(data.length === MESSAGES_PER_PAGE);
        if (page === 0) {
          setMessages(data.reverse());
        } else {
          setMessages((prev) => [...data.reverse(), ...prev]);
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`team_messages:${teamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "team_messages",
          filter: `team_id=eq.${teamId}`,
        },
        async (payload) => {
          // Fetch complete message with profile data
          const { data } = await (supabase as any)
            .from("team_messages")
            .select(`
              *,
              profiles(username, avatar_url),
              reply_message:team_messages!reply_to(
                id,
                message,
                profiles(username)
              )
            `)
            .eq("id", payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => [...prev, data as TeamMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      const { error } = await (supabase as any).from("team_messages").insert({
        team_id: teamId,
        user_id: user.id,
        message: newMessage.trim(),
        reply_to: replyingTo?.id || null,
      });

      if (error) throw error;

      setNewMessage("");
      setReplyingTo(null);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `team-chat/${teamId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("quest-submissions")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("quest-submissions")
        .getPublicUrl(filePath);

      const { error: messageError } = await (supabase as any)
        .from("team_messages")
        .insert({
          team_id: teamId,
          user_id: user.id,
          message: "📷 Image",
          attachments: [{ url: publicUrl }],
        });

      if (messageError) throw messageError;

      toast.success("Image sent!");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const loadMoreMessages = () => {
    if (hasMore && !loading) {
      setPage((prev) => prev + 1);
    }
  };

  if (loading && page === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            onClick={loadMoreMessages}
            className="w-full mb-4 hover:bg-primary/10"
          >
            Load older messages
          </Button>
        )}
        
        <div className="space-y-4">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${
                msg.user_id === user?.id ? "flex-row-reverse" : ""
              }`}
            >
              <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                <AvatarImage src={msg.profiles.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white text-xs">
                  {msg.profiles.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className={`flex-1 ${msg.user_id === user?.id ? "text-right" : ""}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold">
                    {msg.profiles.username}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(msg.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>

                {msg.reply_message && (
                  <div className="text-xs text-muted-foreground bg-primary/10 border-l-2 border-primary p-2 rounded mb-2">
                    <span className="font-semibold">Replying to:</span> {msg.reply_message.message}
                  </div>
                )}

                <div
                  className={`inline-block rounded-2xl px-4 py-2 shadow-sm ${
                    msg.user_id === user?.id
                      ? "bg-gradient-to-r from-primary to-purple-600 text-white"
                      : "bg-card border border-border"
                  }`}
                >
                  <p className="text-sm break-words">{msg.message}</p>

                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {msg.attachments.map((att, idx) => (
                        <img
                          key={idx}
                          src={att.url}
                          alt="Attachment"
                          className="max-w-xs rounded-lg border-2 border-white/20"
                        />
                      ))}
                    </div>
                  )}
                </div>

                {msg.user_id !== user?.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(msg)}
                    className="mt-1 h-6 text-xs hover:bg-primary/10"
                  >
                    <Reply className="h-3 w-3 mr-1" />
                    Reply
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Enhanced Input Area */}
      <div className="p-4 border-t border-white/10 bg-gradient-to-r from-card/50 to-card backdrop-blur-sm">
        {replyingTo && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between bg-primary/10 border-l-2 border-primary p-2 rounded mb-2"
          >
            <span className="text-xs flex-1 truncate">
              <span className="font-semibold">Replying to:</span> {replyingTo.message}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(null)}
              className="h-6 w-6 p-0 hover:bg-destructive/20"
            >
              <X className="h-3 w-3" />
            </Button>
          </motion.div>
        )}

        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="shrink-0 hover:bg-primary/10 hover:border-primary transition-all duration-200"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>

          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
            placeholder="Type a message..."
            disabled={uploading}
            className="flex-1 bg-card/50 border-white/10 focus:border-primary transition-all duration-200"
          />

          <Button 
            onClick={handleSendMessage} 
            disabled={uploading || !newMessage.trim()}
            className="shrink-0 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-500 transition-all duration-200"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
