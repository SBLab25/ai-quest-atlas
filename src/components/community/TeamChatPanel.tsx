import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, X, Users, Sparkles, Zap, ArrowLeft, UserCheck } from "lucide-react";
import { DirectChat } from "@/components/chat/DirectChat";
import { TeamChat } from "@/components/teams/TeamChat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChatUser {
  user_id: string;
  username: string;
  avatar_url: string | null;
  is_mutual: boolean;
  followed_at: string;
}

interface Team {
  id: string;
  name: string;
  description: string;
  member_count?: number;
}

export const TeamChatPanel = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'direct' | 'team'>('direct');
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      if (activeTab === 'direct') {
        fetchChatUsers();
      } else {
        fetchTeams();
      }
    }
  }, [isOpen, user, activeTab]);

  const fetchChatUsers = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch both followers and following
      const [followersResult, followingResult] = await Promise.all([
        supabase.rpc('get_followers', {
          p_user_id: user.id,
          p_limit: 100,
          p_offset: 0
        }),
        supabase.rpc('get_following', {
          p_user_id: user.id,
          p_limit: 100,
          p_offset: 0
        })
      ]);

      if (followersResult.error) throw followersResult.error;
      if (followingResult.error) throw followingResult.error;

      // Combine followers and following, remove duplicates, prioritize mutual follows
      const followers = (followersResult.data as any[]) || [];
      const following = (followingResult.data as any[]) || [];
      
      // Create a map to combine and deduplicate
      const userMap = new Map<string, ChatUser>();
      
      // Add followers
      followers.forEach((f: any) => {
        userMap.set(f.user_id, {
          user_id: f.user_id,
          username: f.username,
          avatar_url: f.avatar_url,
          is_mutual: f.is_mutual,
          followed_at: f.followed_at,
        });
      });
      
      // Add following (update if already exists, prioritize mutual)
      following.forEach((f: any) => {
        const existing = userMap.get(f.user_id);
        if (!existing || f.is_mutual) {
          userMap.set(f.user_id, {
            user_id: f.user_id,
            username: f.username,
            avatar_url: f.avatar_url,
            is_mutual: f.is_mutual,
            followed_at: f.followed_at,
          });
        }
      });

      // Sort: mutual first, then by followed_at
      const sortedUsers = Array.from(userMap.values()).sort((a, b) => {
        if (a.is_mutual !== b.is_mutual) {
          return a.is_mutual ? -1 : 1;
        }
        return new Date(b.followed_at).getTime() - new Date(a.followed_at).getTime();
      });

      setChatUsers(sortedUsers);
    } catch (error) {
      console.error("Error fetching chat users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: memberships, error } = await (supabase as any)
        .from("team_members")
        .select(`
          team_id,
          teams:team_id (
            id,
            name,
            description
          )
        `)
        .eq("user_id", user.id);

      if (error) throw error;

      const teamsList = (memberships || [])
        .map((m: any) => m.teams)
        .filter(Boolean);

      setTeams(teamsList);
    } catch (error) {
      console.error("Error fetching teams:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Button - Above Team Dialog Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="fixed bottom-[87px] right-6 z-50"
          >
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <Button
                onClick={() => setIsOpen(true)}
                size="lg"
                className="rounded-full h-14 w-14 shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300"
              >
                <MessageCircle className="h-6 w-6" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Innovative Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-6 right-6 z-50 w-[420px] h-[650px]"
          >
            {/* Glassmorphism Card with gradient border */}
            <div className="relative h-full rounded-2xl overflow-hidden">
              {/* Animated gradient border */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-500 to-pink-500 opacity-50 blur-sm" />
              
              <Card className="relative h-full flex flex-col backdrop-blur-2xl bg-gradient-to-br from-card/95 via-card/90 to-card/95 border-2 border-white/10 shadow-2xl overflow-hidden">
                {/* Animated background particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <motion.div
                    className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl"
                    animate={{
                      x: [0, 100, 0],
                      y: [0, 50, 0],
                    }}
                    transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                  />
                  <motion.div
                    className="absolute bottom-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"
                    animate={{
                      x: [0, -80, 0],
                      y: [0, -60, 0],
                    }}
                    transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                  />
                </div>

                {/* Header */}
                <CardHeader className="relative pb-3 border-b border-white/10 bg-gradient-to-r from-primary/5 via-purple-500/5 to-pink-500/5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-purple-600">
                        <MessageCircle className="h-5 w-5 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent font-bold">
                        Chat
                      </span>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                      >
                        <Sparkles className="h-4 w-4 text-yellow-500" />
                      </motion.div>
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsOpen(false);
                        setSelectedUserId(null);
                        setSelectedTeam(null);
                      }}
                      className="h-8 w-8 p-0 hover:bg-destructive/20 hover:text-destructive transition-all duration-200"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Tabs for Direct Messages and Team Chat */}
                  <Tabs value={activeTab} onValueChange={(v) => {
                    setActiveTab(v as 'direct' | 'team');
                    setSelectedUserId(null);
                    setSelectedTeam(null);
                  }} className="mt-3">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="direct" className="text-xs">
                        <MessageCircle className="h-3 w-3 mr-1" />
                        Direct
                      </TabsTrigger>
                      <TabsTrigger value="team" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        Teams
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {/* Selected User Header */}
                  {selectedUserId && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-gradient-to-r from-primary/10 to-purple-500/10 border border-white/10"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedUserId(null)}
                        className="text-xs hover:bg-white/10"
                      >
                        <ArrowLeft className="h-3 w-3 mr-1" />
                        Back
                      </Button>
                      {(() => {
                        const selectedUser = chatUsers.find(u => u.user_id === selectedUserId);
                        return selectedUser ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={selectedUser.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {selectedUser.username[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <Badge variant="secondary" className="text-xs bg-gradient-to-r from-primary to-purple-600 text-white border-0">
                              {selectedUser.username}
                              {selectedUser.is_mutual && (
                                <UserCheck className="h-3 w-3 ml-1" />
                              )}
                            </Badge>
                          </div>
                        ) : null;
                      })()}
                    </motion.div>
                  )}

                  {/* Selected Team Header */}
                  {selectedTeam && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-gradient-to-r from-primary/10 to-purple-500/10 border border-white/10"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTeam(null)}
                        className="text-xs hover:bg-white/10"
                      >
                        <ArrowLeft className="h-3 w-3 mr-1" />
                        Back
                      </Button>
                      <Badge variant="secondary" className="text-xs bg-gradient-to-r from-primary to-purple-600 text-white border-0">
                        <Zap className="h-3 w-3 mr-1" />
                        {selectedTeam.name}
                      </Badge>
                    </motion.div>
                  )}
                </CardHeader>

                {/* Content */}
                <CardContent className="relative flex-1 overflow-hidden p-0">
                  {selectedUserId ? (
                    <div className="h-full">
                      <DirectChat otherUserId={selectedUserId} />
                    </div>
                  ) : selectedTeam ? (
                    <div className="h-full">
                      <TeamChat teamId={selectedTeam.id} />
                    </div>
                  ) : (
                    <ScrollArea className="h-full p-4">
                      {loading ? (
                        <div className="flex items-center justify-center h-full">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            className="rounded-full h-12 w-12 border-4 border-primary border-t-transparent"
                          />
                        </div>
                      ) : (
                        activeTab === 'direct' ? (
                          chatUsers.length === 0 ? (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex flex-col items-center justify-center h-full text-center p-6"
                            >
                              <div className="relative mb-4">
                                <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-600 opacity-20 blur-2xl rounded-full" />
                                <Users className="relative h-16 w-16 text-muted-foreground opacity-50" />
                              </div>
                              <p className="text-sm font-semibold mb-2">No connections yet</p>
                              <p className="text-xs text-muted-foreground">
                                Follow users to start chatting with them!
                              </p>
                            </motion.div>
                          ) : (
                            <div className="space-y-3">
                              {chatUsers.map((chatUser, index) => (
                                <motion.div
                                  key={chatUser.user_id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  whileHover={{ scale: 1.03, x: 5 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <Card
                                    className={cn(
                                      "cursor-pointer overflow-hidden transition-all duration-300",
                                      "bg-gradient-to-r from-card to-card/80 hover:from-primary/10 hover:to-purple-500/10",
                                      "border border-white/10 hover:border-primary/50 shadow-lg hover:shadow-primary/25"
                                    )}
                                    onClick={() => setSelectedUserId(chatUser.user_id)}
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                                          <AvatarImage src={chatUser.avatar_url || undefined} />
                                          <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white">
                                            {chatUser.username[0]?.toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-sm truncate">
                                              {chatUser.username}
                                            </h3>
                                            {chatUser.is_mutual && (
                                              <Badge variant="secondary" className="text-xs bg-primary/20 text-primary border-primary/30">
                                                <UserCheck className="h-3 w-3 mr-1" />
                                                Mutual
                                              </Badge>
                                            )}
                                          </div>
                                          <p className="text-xs text-muted-foreground">
                                            {chatUser.is_mutual ? "You follow each other" : "Connected"}
                                          </p>
                                        </div>
                                        <motion.div
                                          whileHover={{ x: 5 }}
                                          transition={{ type: "spring", stiffness: 400 }}
                                        >
                                          <MessageCircle className="h-4 w-4 text-primary/50" />
                                        </motion.div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </motion.div>
                              ))}
                            </div>
                          )
                        ) : (
                          teams.length === 0 ? (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex flex-col items-center justify-center h-full text-center p-6"
                            >
                              <div className="relative mb-4">
                                <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-600 opacity-20 blur-2xl rounded-full" />
                                <Users className="relative h-16 w-16 text-muted-foreground opacity-50" />
                              </div>
                              <p className="text-sm font-semibold mb-2">No teams yet</p>
                              <p className="text-xs text-muted-foreground">
                                Join a crew to start chatting with your teammates!
                              </p>
                            </motion.div>
                          ) : (
                            <div className="space-y-3">
                              {teams.map((team, index) => (
                                <motion.div
                                  key={team.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  whileHover={{ scale: 1.03, x: 5 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <Card
                                    className={cn(
                                      "cursor-pointer overflow-hidden transition-all duration-300",
                                      "bg-gradient-to-r from-card to-card/80 hover:from-primary/10 hover:to-purple-500/10",
                                      "border border-white/10 hover:border-primary/50 shadow-lg hover:shadow-primary/25"
                                    )}
                                    onClick={() => setSelectedTeam(team)}
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-purple-600/20 border border-white/10">
                                          <Users className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h3 className="font-semibold text-sm mb-1 truncate">
                                            {team.name}
                                          </h3>
                                          <p className="text-xs text-muted-foreground line-clamp-2">
                                            {team.description}
                                          </p>
                                        </div>
                                        <motion.div
                                          whileHover={{ x: 5 }}
                                          transition={{ type: "spring", stiffness: 400 }}
                                        >
                                          <Zap className="h-4 w-4 text-primary/50" />
                                        </motion.div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </motion.div>
                              ))}
                            </div>
                          )
                        )
                      )}
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
