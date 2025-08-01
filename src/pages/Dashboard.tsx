import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Star, Shuffle, Compass, Trophy, Users, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [featuredQuest, setFeaturedQuest] = useState<Quest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuests = async () => {
      try {
        const { data, error } = await supabase
          .from("Quests")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setQuests(data || []);
        // Set first quest as featured, or random one
        if (data && data.length > 0) {
          setFeaturedQuest(data[Math.floor(Math.random() * data.length)]);
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
  }, [toast]);

  const getDifficultyStars = (difficulty: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < difficulty ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  const getQuestTypeColor = (type: string) => {
    const colors = {
      photography: "bg-purple-100 text-purple-800",
      nature: "bg-green-100 text-green-800",
      history: "bg-amber-100 text-amber-800",
      science: "bg-blue-100 text-blue-800",
      community: "bg-pink-100 text-pink-800",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const handleRandomQuest = () => {
    if (quests.length > 0) {
      const randomQuest = quests[Math.floor(Math.random() * quests.length)];
      navigate(`/quest/${randomQuest.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
              <Compass className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Discovery Atlas</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleRandomQuest}
              variant="outline"
              className="hidden sm:flex"
              disabled={quests.length === 0}
            >
              <Shuffle className="h-4 w-4 mr-2" />
              Random Quest
            </Button>
            <Button
              onClick={() => navigate('/profile')}
              variant="outline"
              className="hidden sm:flex"
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
            <span className="text-sm text-muted-foreground">
              Welcome back, {user?.email?.split('@')[0] || 'Explorer'}!
            </span>
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Adventure Awaits</h1>
          <p className="text-muted-foreground">
            Ready to explore the world? Check out today's quests and continue your journey.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/dashboard')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Quests</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quests.length}</div>
              <p className="text-xs text-muted-foreground">Ready to explore</p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/badges')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Badge Gallery</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Explore</div>
              <p className="text-xs text-muted-foreground">View achievements</p>
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
              <div className="text-2xl font-bold">Compete</div>
              <p className="text-xs text-muted-foreground">View rankings</p>
            </CardContent>
          </Card>
        </div>

        {/* Current Quests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

          {/* All Quests List */}
          <div>
            <h2 className="text-2xl font-bold mb-4">All Quests</h2>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Available Adventures</CardTitle>
                <CardDescription>
                  {quests.length} quest{quests.length !== 1 ? 's' : ''} waiting for you
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : quests.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {quests.map((quest) => (
                      <div
                        key={quest.id}
                        className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/quest/${quest.id}`)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm line-clamp-1">{quest.title}</h4>
                          <Badge 
                            className={`${getQuestTypeColor(quest.quest_type)} text-xs`}
                            variant="secondary"
                          >
                            {quest.quest_type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 mb-1">
                          {getDifficultyStars(quest.difficulty)}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{quest.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No quests available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;