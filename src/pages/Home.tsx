import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Star, Shuffle, Trophy, Users, TrendingUp, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DiscoveryAtlasIcon from '@/components/ui/discovery-atlas-icon';
import { SearchAndFilter } from "@/components/search/SearchAndFilter";
import { useAnalytics } from "@/hooks/useSimpleAnalytics";
import { LiveActivityFeed } from "@/components/realtime/LiveActivityFeed";
import { QuestRecommendations } from "@/components/performance/QuestRecommendations";
import { TopNavbar } from "@/components/navigation/TopNavbar";
import { MiniCalendar } from "@/components/calendar/MiniCalendar";
import { AIQuestGenerator } from "@/components/quest/AIQuestGenerator";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useUserBadges } from "@/hooks/useUserBadges";

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { trackPageView } = useAnalytics();
  const { userRank, loading: leaderboardLoading } = useLeaderboard();
  const { recentBadge, totalBadges, loading: badgesLoading } = useUserBadges();
  const [allQuests, setAllQuests] = useState<Quest[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [featuredQuest, setFeaturedQuest] = useState<Quest | null>(null);
  const [loading, setLoading] = useState(true);
  const [featuredQuestIndex, setFeaturedQuestIndex] = useState(0);
  const [availableCount, setAvailableCount] = useState<number>(0);

  useEffect(() => {
    trackPageView('/home');
    
    const fetchQuests = async () => {
      try {
        // Fetch regular quests
        const { data: regularQuests, error: regularError } = await supabase
          .from("Quests")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (regularError) throw regularError;

        // Fetch AI-generated quests only if user is logged in
        let aiQuests = [];
        if (user) {
          const { data: aiData, error: aiError } = await supabase
            .from("ai_generated_quests")
            .select("*")
            .eq("is_active", true)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });
          
          if (aiError) {
            console.error("Error fetching AI quests:", aiError);
            // Don't throw, just log - AI quests are optional
          } else {
            aiQuests = aiData || [];
          }
        }

        // Combine both quest types for listing
        const combinedQuests = [
          ...(regularQuests || []),
          ...aiQuests
        ];

        setAllQuests(combinedQuests);
        setQuests(combinedQuests);

        // Compute user-specific available count (exclude user's submitted/finished quests)
        let completedIds = new Set<string>();
        if (user) {
          const { data: subs } = await supabase
            .from('Submissions')
            .select('quest_id')
            .eq('user_id', user.id);
          subs?.forEach((s: any) => completedIds.add(s.quest_id));
        }

        const regularAvailable = (regularQuests || []).filter((q: any) => !completedIds.has(q.id));
        const aiAvailable = aiQuests.filter((q: any) => !completedIds.has(q.id));
        setAvailableCount(regularAvailable.length + aiAvailable.length);

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
  }, [toast, trackPageView, user]);

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <TopNavbar />
      
      <main className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <DiscoveryAtlasIcon className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent">
              Adventure Camp
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Welcome back, adventurer! Your next epic quest awaits in the vast world of discovery.
          </p>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Left Side - Stats Cards */}
          <div className="xl:col-span-3">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200/50 dark:border-blue-800/30" onClick={() => navigate('/all-quests')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Available Quests</CardTitle>
                  <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                    <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-800 dark:text-blue-200">{loading ? "..." : availableCount}</div>
                  <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">User-specific total</p>
                </CardContent>
              </Card>
              
              <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-950/20 dark:to-orange-900/20 border-yellow-200/50 dark:border-orange-800/30" onClick={() => navigate('/badges')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Badges Earned</CardTitle>
                  <div className="p-2 bg-orange-500/10 rounded-lg group-hover:bg-orange-500/20 transition-colors">
                    <Star className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-800 dark:text-orange-200">
                    {badgesLoading ? "..." : totalBadges}
                  </div>
                  <p className="text-xs text-orange-600/70 dark:text-orange-400/70 mt-1">
                    {recentBadge ? `Latest: ${recentBadge.badge.name}` : "Start your journey"}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/20 dark:to-emerald-900/20 border-green-200/50 dark:border-emerald-800/30" onClick={() => navigate('/profile')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Your Profile</CardTitle>
                  <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                    <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-800 dark:text-emerald-200">View</div>
                  <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">Stats & progress</p>
                </CardContent>
              </Card>
              
              <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-950/20 dark:to-violet-900/20 border-purple-200/50 dark:border-violet-800/30" onClick={() => navigate('/leaderboard')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-violet-700 dark:text-violet-300">Leaderboard</CardTitle>
                  <div className="p-2 bg-violet-500/10 rounded-lg group-hover:bg-violet-500/20 transition-colors">
                    <Trophy className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-violet-800 dark:text-violet-200">
                    {leaderboardLoading ? "..." : userRank ? `#${userRank}` : "Unranked"}
                  </div>
                  <p className="text-xs text-violet-600/70 dark:text-violet-400/70 mt-1">Your rank</p>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filter */}
            <div className="mb-8">
              <SearchAndFilter quests={allQuests} onFilteredQuests={handleFilteredQuests} />
            </div>

            {/* Main Content Sections */}
            <div className="space-y-8">
              {/* AI Quest Generator */}
              <AIQuestGenerator />

              {/* Featured Quest */}
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  Featured Quest
                </h2>
                {featuredQuest ? (
                  <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/5 overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center space-x-2 text-xl">
                            <DiscoveryAtlasIcon className="w-6 h-6 text-primary" />
                            <span>{featuredQuest.title}</span>
                          </CardTitle>
                          <CardDescription className="mt-3 text-base">
                            {featuredQuest.description}
                          </CardDescription>
                        </div>
                        <Badge className={`${getQuestTypeColor(featuredQuest.quest_type)} font-medium px-3 py-1`}>
                          {featuredQuest.quest_type}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-1">
                          {getDifficultyStars(featuredQuest.difficulty)}
                          <span className="ml-2 text-sm text-muted-foreground">Difficulty</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2 text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>{featuredQuest.location}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>Posted {new Date(featuredQuest.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Button 
                          className="w-full mt-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200"
                          onClick={() => navigate(`/quest/${featuredQuest.id}`)}
                        >
                          Start This Adventure
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
                    <CardContent className="flex items-center justify-center h-64">
                      {loading ? (
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                      ) : (
                        <div className="text-center">
                          <DiscoveryAtlasIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                          <p className="text-lg font-medium text-muted-foreground mb-2">No quests available</p>
                          <p className="text-sm text-muted-foreground/60">Check back later for new adventures!</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Live Activity and Recommendations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <LiveActivityFeed />
                <QuestRecommendations />
              </div>
            </div>
          </div>

          {/* Right Side - Calendar */}
          <div className="xl:col-span-1">
            <div className="sticky top-24">
              <MiniCalendar />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;