import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { MapPin, Clock, Star, Shuffle, Compass, Trophy, Users, User, Settings, BarChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SearchAndFilter } from "@/components/search/SearchAndFilter";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { useRole } from "@/hooks/useSimpleRole";
import { useAnalytics } from "@/hooks/useSimpleAnalytics";
import { LiveActivityFeed } from "@/components/realtime/LiveActivityFeed";
import { QuestRecommendations } from "@/components/performance/QuestRecommendations";
import { AppSidebar } from "@/components/navigation/AppSidebar";
import { ProfileDropdown } from "@/components/navigation/ProfileDropdown";

import { usePerformance } from "@/hooks/use-performance";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
import { AIQuestGenerator } from "@/components/quest/AIQuestGenerator";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useUserBadges } from "@/hooks/useUserBadges";
import { StreakDisplay } from "@/components/streak/StreakDisplay";

interface Quest {
  id: string;
  title: string;
  description: string;
  quest_type: string;
  difficulty: number;
  location: string;
  is_active: boolean;
  created_at: string;
}

const Home = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, isModerator } = useRole();
  const { trackPageView } = useAnalytics();
  const { throttle, debounce } = usePerformance();
  const { userRank, loading: leaderboardLoading } = useLeaderboard();
  const { recentBadge, totalBadges, loading: badgesLoading } = useUserBadges();
  const [allQuests, setAllQuests] = useState<Quest[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [featuredQuest, setFeaturedQuest] = useState<Quest | null>(null);
  const [loading, setLoading] = useState(true);
  const [featuredQuestIndex, setFeaturedQuestIndex] = useState(0);

  useEffect(() => {
    trackPageView('/home');
    
    const fetchQuests = async () => {
      try {
        // Fetch both regular and AI generated quests
        const [regularQuestsRes, aiQuestsRes] = await Promise.all([
          supabase
            .from("Quests")
            .select("*")
            .eq("is_active", true)
            .order("created_at", { ascending: false }),
          supabase
            .from("ai_generated_quests")
            .select("*")
            .eq("is_active", true)
            .order("created_at", { ascending: false })
        ]);

        if (regularQuestsRes.error) throw regularQuestsRes.error;
        if (aiQuestsRes.error) throw aiQuestsRes.error;

        // Combine both quest types
        const combinedQuests = [
          ...(regularQuestsRes.data || []),
          ...(aiQuestsRes.data || [])
        ];

        setAllQuests(combinedQuests);
        setQuests(combinedQuests);
        // Set first quest as featured
        if (combinedQuests.length > 0) {
          setFeaturedQuest(combinedQuests[0]);
        }
      } catch (error) {
        console.error("Error fetching quests:", error);
        toast({
          title: "Error",
          description: "Failed to load quests",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQuests();
  }, [toast, trackPageView]);

  // Rotate featured quest every 30 seconds
  useEffect(() => {
    if (allQuests.length === 0) return;
    
    const interval = setInterval(() => {
      setFeaturedQuestIndex((prev) => {
        const nextIndex = (prev + 1) % allQuests.length;
        setFeaturedQuest(allQuests[nextIndex]);
        return nextIndex;
      });
    }, 30000); // Change every 30 seconds

    return () => clearInterval(interval);
  }, [allQuests]);

  const handleFilteredQuests = useCallback((filteredQuests: Quest[]) => {
    setQuests(filteredQuests);
  }, []);

  const getDifficultyStars = useCallback((difficulty: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < difficulty ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  }, []);

  const getQuestTypeColor = useCallback((type: string) => {
    const colors = {
      photography: "bg-purple-100 text-purple-800",
      nature: "bg-green-100 text-green-800",
      history: "bg-amber-100 text-amber-800",
      science: "bg-blue-100 text-blue-800",
      community: "bg-pink-100 text-pink-800",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  }, []);

  const handleRandomQuest = () => {
    if (quests.length > 0) {
      const randomQuest = quests[Math.floor(Math.random() * quests.length)];
      navigate(`/quest/${randomQuest.id}`);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1">
          {/* Header */}
          <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="container mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-2xl font-bold">Home</h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <h2 className="text-lg font-semibold">Welcome back!</h2>
                  <p className="text-sm text-muted-foreground">Ready for your next adventure?</p>
                </div>
                <ThemeToggleButton />
                <NotificationCenter />
                <StreakDisplay />
                <ProfileDropdown />
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 py-8">
              {/* Hero Section */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Your Adventure Home</h1>
                <p className="text-muted-foreground">
                  Explore featured quests, connect with the community, and discover your next adventure.
                </p>
              </div>

              {/* Main Content Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Side - Quick Actions */}
                <div className="order-2 lg:order-1">
                  <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
                  <div className="space-y-4">
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/all-quests')}>
                      <CardHeader>
                        <CardTitle className="text-lg">View All Quests</CardTitle>
                        <CardDescription>
                          Browse {quests.length} available adventures
                        </CardDescription>
                      </CardHeader>
                    </Card>
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleRandomQuest}>
                      <CardHeader>
                        <CardTitle className="text-lg">Random Quest</CardTitle>
                        <CardDescription>
                          Get a surprise adventure
                        </CardDescription>
                      </CardHeader>
                    </Card>
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/community')}>
                      <CardHeader>
                        <CardTitle className="text-lg">Community Hub</CardTitle>
                        <CardDescription>
                          Connect with other adventurers
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </div>
                </div>

                {/* Right Side - Dashboard Cards */}
                <div className="order-1 lg:order-2 space-y-8">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/home')}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available Quests</CardTitle>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{loading ? "..." : quests.length}</div>
                        <p className="text-xs text-muted-foreground">Including AI generated</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/badges')}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Badge Gallery</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {badgesLoading ? "..." : totalBadges}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {recentBadge ? `Latest: ${recentBadge.badge.name}` : "No badges yet"}
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/profile')}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Your Profile</CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">View</div>
                        <p className="text-xs text-muted-foreground">Stats & progress</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/leaderboard')}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Leaderboard</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                         <div className="text-2xl font-bold">
                           {leaderboardLoading ? "..." : userRank ? `#${userRank}` : "Unranked"}
                         </div>
                        <p className="text-xs text-muted-foreground">Your current position</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Search and Filter */}
                  <SearchAndFilter quests={allQuests} onFilteredQuests={handleFilteredQuests} />

                   {/* AI Generated Quests */}
                   <AIQuestGenerator />

                   {/* Phase 4 Advanced Features */}
                   <div className="space-y-6">
                     <LiveActivityFeed />
                     <QuestRecommendations />
                   </div>

                  {/* Featured Quest */}
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Featured Quest</h2>
                    {featuredQuest ? (
                      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="flex items-center space-x-2">
                                <Compass className="w-5 h-5 text-primary" />
                                <span>{featuredQuest.title}</span>
                              </CardTitle>
                              <CardDescription className="mt-2">
                                {featuredQuest.description}
                              </CardDescription>
                            </div>
                            <Badge className={getQuestTypeColor(featuredQuest.quest_type)}>
                              {featuredQuest.quest_type}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center space-x-1 mb-2">
                              {getDifficultyStars(featuredQuest.difficulty)}
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              <span>{featuredQuest.location}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              <span>Posted {new Date(featuredQuest.created_at).toLocaleDateString()}</span>
                            </div>
                            <Button 
                              className="w-full mt-4"
                              onClick={() => navigate(`/quest/${featuredQuest.id}`)}
                            >
                              View Quest Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
                        <CardContent className="flex items-center justify-center h-64">
                          {loading ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          ) : (
                            <div className="text-center">
                              <p className="text-muted-foreground">No quests available at the moment</p>
                              <p className="text-sm text-muted-foreground/60 mt-1">Check back later for new adventures!</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Home;