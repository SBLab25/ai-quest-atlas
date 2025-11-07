import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Clock, Sparkles, RefreshCw, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SearchAndFilter } from "@/components/search/SearchAndFilter";
import { useAnalytics } from "@/hooks/useSimpleAnalytics";
import { TopNavbar } from "@/components/navigation/TopNavbar";
import { AIQuestGenerator } from "@/components/quest/AIQuestGenerator";
import { QuestRecommendations } from "@/components/performance/QuestRecommendations";
import { useAuth } from "@/hooks/useAuth";

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

const AllQuests = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { trackPageView } = useAnalytics();
  const { user } = useAuth();
  const [allQuests, setAllQuests] = useState<Quest[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [aiQuests, setAiQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'regular' | 'ai' | 'recommended'>('regular');
  const [completedQuestIds, setCompletedQuestIds] = useState<Set<string>>(new Set());
  const [isFetching, setIsFetching] = useState(false);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchCompletedQuests = async () => {
    if (!user) return;

    try {
      const completedIds = new Set<string>();

      // Fetch regular quest completions (with quest_id)
      const { data: regularSubmissions, error: regularError } = await supabase
        .from('Submissions')
        .select('quest_id, status')
        .eq('user_id', user.id)
        .in('status', ['verified', 'approved'])
        .not('quest_id', 'is', null)
        .limit(1000);

      if (regularError) throw regularError;

      if (regularSubmissions) {
        regularSubmissions.forEach((sub: any) => {
          if (sub.quest_id) {
            completedIds.add(sub.quest_id);
          }
        });
      }

      // For AI quests, we can't use quest_id due to foreign key constraints
      // We'll extract AI quest IDs from submission descriptions (format: [AI_QUEST_ID:quest_id])
      // and also use heuristic matching as fallback
      const { data: aiSubmissions, error: aiError } = await supabase
        .from('Submissions')
        .select('id, submitted_at, status, description')
        .eq('user_id', user.id)
        .in('status', ['verified', 'approved'])
        .is('quest_id', null)
        .order('submitted_at', { ascending: true })
        .limit(100);

      if (aiSubmissions && aiSubmissions.length > 0 && !aiError) {
        // First, try to extract AI quest IDs from submission descriptions
        // Format: [AI_QUEST_ID:quest_id] at the end of description
        const aiQuestIdPattern = /\[AI_QUEST_ID:([a-f0-9-]+)\]/i;
        
        aiSubmissions.forEach((submission: any) => {
          if (submission.description) {
            const match = submission.description.match(aiQuestIdPattern);
            if (match && match[1]) {
              // Found AI quest ID in description - directly mark as completed
              completedIds.add(match[1]);
            }
          }
        });

        // For submissions without AI quest ID in description, use heuristic matching
        // Get the most recent submission date - quests created after this should never be marked
        const submissionsWithoutId = aiSubmissions.filter((s: any) => {
          if (!s.description) return true;
          const match = s.description.match(aiQuestIdPattern);
          return !match || !match[1];
        });

        if (submissionsWithoutId.length > 0) {
          const mostRecentSubmissionDate = Math.max(
            ...submissionsWithoutId.map((s: any) => new Date(s.submitted_at).getTime())
          );

          // Fetch user's AI quests with creation dates
          const [aiQuestsResult, suggestedQuestsResult] = await Promise.all([
            supabase
              .from('ai_generated_quests')
              .select('id, created_at')
              .eq('user_id', user.id)
              .eq('is_active', true)
              .order('created_at', { ascending: true }),
            supabase
              .from('suggested_quests')
              .select('id, generated_at, created_at')
              .eq('user_id', user.id)
              .eq('is_active', true)
              .gte('expires_at', new Date().toISOString())
              .order('generated_at', { ascending: true })
          ]);

          // Combine all AI quests with their creation dates
          const allAIQuests: Array<{id: string, created_at: string}> = [];
          if (aiQuestsResult.data) {
            aiQuestsResult.data.forEach((q: any) => {
              allAIQuests.push({ id: q.id, created_at: q.created_at });
            });
          }
          if (suggestedQuestsResult.data) {
            suggestedQuestsResult.data.forEach((q: any) => {
              allAIQuests.push({ 
                id: q.id, 
                created_at: q.generated_at || q.created_at 
              });
            });
          }

          // Sort by creation date
          allAIQuests.sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );

          // Match submissions to quests using heuristic (only for submissions without ID)
          const usedQuestIndices = new Set<number>();
          const now = Date.now();
          
          submissionsWithoutId.forEach((submission: any) => {
            const submissionDate = new Date(submission.submitted_at).getTime();
            
            // Find the best matching quest using heuristic
            const maxDaysBefore = 30 * 24 * 60 * 60 * 1000; // 30 days
            const minTimeBefore = 60 * 60 * 1000; // 1 hour
            const minTimeSinceCreation = 5 * 60 * 1000; // 5 minutes
            
            for (let i = 0; i < allAIQuests.length; i++) {
              if (usedQuestIndices.has(i)) continue;
              if (completedIds.has(allAIQuests[i].id)) continue; // Already matched via ID
              
              const questDate = new Date(allAIQuests[i].created_at).getTime();
              const timeDiff = submissionDate - questDate;
              const timeSinceQuestCreation = now - questDate;
              
              if (
                timeDiff >= minTimeBefore &&
                timeDiff <= maxDaysBefore &&
                questDate < mostRecentSubmissionDate &&
                timeSinceQuestCreation >= minTimeSinceCreation
              ) {
                completedIds.add(allAIQuests[i].id);
                usedQuestIndices.add(i);
                break;
              }
            }
          });
        }
        
        console.log('AI Quest Completion Matching:', {
          totalSubmissions: aiSubmissions.length,
          matchedViaId: Array.from(completedIds).length,
          matchedViaHeuristic: 0
        });
      }

      setCompletedQuestIds(completedIds);
    } catch (error) {
      console.error('Error fetching completed quests:', error);
      // Don't throw - just log, so it doesn't break the main quest fetch
    }
  };

  const fetchAIQuests = async () => {
    if (!user) return;

    try {
      // Fetch from both ai_generated_quests and suggested_quests
      const [aiQuestsResult, suggestedQuestsResult] = await Promise.all([
        supabase
          .from("ai_generated_quests")
          .select("*")
          .eq("is_active", true)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("suggested_quests")
          .select("*")
          .eq("is_active", true)
          .eq("user_id", user.id)
          .gte("expires_at", new Date().toISOString())
          .order("generated_at", { ascending: false })
      ]);

      if (aiQuestsResult.error) throw aiQuestsResult.error;
      if (suggestedQuestsResult.error) throw suggestedQuestsResult.error;

      // Merge and transform suggested quests to match AI quest format
      const aiQuests = (aiQuestsResult.data || []).map((aq: any) => ({
        id: aq.id,
        title: aq.title,
        description: aq.description,
        quest_type: aq.quest_type,
        difficulty: aq.difficulty,
        location: aq.location,
        is_active: aq.is_active ?? true,
        created_at: aq.created_at
      }));
      const suggestedQuests = (suggestedQuestsResult.data || []).map((sq: any) => ({
        id: sq.id,
        title: sq.title,
        description: sq.description,
        quest_type: sq.quest_type,
        difficulty: sq.difficulty,
        location: sq.location,
        is_active: sq.is_active ?? true,
        generated_by: 'suggestions',
        created_at: sq.generated_at || sq.created_at
      }));

      // Combine and sort by creation date
      const allQuests = [...aiQuests, ...suggestedQuests].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setAiQuests(allQuests);
    } catch (error) {
      console.error("Error fetching AI quests:", error);
    }
  };

  useEffect(() => {
    trackPageView('/all-quests');
    
    // Prevent multiple simultaneous fetches
    if (isFetching) return;
    
    const fetchQuests = async () => {
      setIsFetching(true);
      try {
        // Fetch regular quests
        const { data: regularQuests, error: regularError } = await supabase
          .from("Quests")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (regularError) throw regularError;

        setAllQuests(regularQuests || []);
        setQuests(regularQuests || []);

        // Fetch AI-generated quests and user data (only for current user)
        if (user) {
          // Run these in parallel but with error handling
          await Promise.allSettled([
            fetchAIQuests(),
            fetchUserProfile(),
            fetchCompletedQuests()
          ]);
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
        setIsFetching(false);
      }
    };

    fetchQuests();
  }, [user]); // Removed toast and trackPageView from dependencies to prevent re-runs

  const handleFilteredQuests = (filteredQuests: Quest[]) => {
    setQuests(filteredQuests);
  };

  const generateNewQuest = async () => {
    if (!user || generating) return;

    setGenerating(true);
    try {
      const { error } = await supabase.functions.invoke('generate-quest-suggestions');

      if (error) throw error;

      toast({
        title: "✨ New quest generated!",
        description: "Check out your personalized AI-generated quest.",
      });

      // Refresh the AI quest list and completion status
      await Promise.all([
        fetchAIQuests(),
        fetchCompletedQuests() // Refresh to ensure new quests aren't marked as completed
      ]);
    } catch (error) {
      console.error('Error generating quest:', error);
      toast({
        title: "Error",
        description: "Failed to generate new quest. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <TopNavbar />
      
      <main className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent mb-4">
            Explore All Quests
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover community quests, AI-generated adventures, and personalized recommendations.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 justify-center">
          <button
            onClick={() => setActiveTab('regular')}
            className={`px-6 py-3 rounded-full font-medium transition-all duration-200 ${
              activeTab === 'regular' 
                ? 'bg-primary text-primary-foreground shadow-lg' 
                : 'bg-muted/50 text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Community Quests ({allQuests.length})
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-6 py-3 rounded-full font-medium transition-all duration-200 ${
              activeTab === 'ai' 
                ? 'bg-primary text-primary-foreground shadow-lg' 
                : 'bg-muted/50 text-muted-foreground hover:bg-muted/80'
            }`}
          >
            AI Generated ({aiQuests.length})
          </button>
          <button
            onClick={() => setActiveTab('recommended')}
            className={`px-6 py-3 rounded-full font-medium transition-all duration-200 ${
              activeTab === 'recommended' 
                ? 'bg-primary text-primary-foreground shadow-lg' 
                : 'bg-muted/50 text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Recommended
          </button>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'regular' && (
          <div>
            {/* Search and Filter for regular quests */}
            <SearchAndFilter quests={allQuests} onFilteredQuests={handleFilteredQuests} />
            
            <div className="mt-8">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : quests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {quests.map((quest) => {
                    const isCompleted = completedQuestIds.has(quest.id);
                    return (
                    <Card key={quest.id} className={`cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-gradient-to-br from-background to-accent/5 relative ${isCompleted ? 'ring-2 ring-green-500/50' : ''}`} onClick={() => navigate(`/quest/${quest.id}`)}>
                      {isCompleted && (
                        <div className="absolute top-2 right-2 z-20 bg-green-500 rounded-full p-1 shadow-md">
                          <CheckCircle2 className="h-3.5 w-3.5 text-black stroke-[3]" />
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg line-clamp-2">{quest.title}</CardTitle>
                          <Badge className={getQuestTypeColor(quest.quest_type)}>
                            {quest.quest_type}
                          </Badge>
                        </div>
                        <CardDescription className="line-clamp-3">
                          {quest.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-1">
                            {getDifficultyStars(quest.difficulty)}
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>{quest.location}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>Posted {new Date(quest.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">No community quests available</p>
                  <p className="text-sm text-muted-foreground/60 mt-1">Check back later for new adventures!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : aiQuests.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Your AI-Generated Quests</h2>
                  <Button 
                    onClick={generateNewQuest} 
                    disabled={generating}
                    size="sm"
                    variant="outline"
                  >
                    {generating ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    {generating ? "Generating..." : "Generate New Quest"}
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {aiQuests.map((quest) => {
                  const isCompleted = completedQuestIds.has(quest.id);
                  return (
                  <Card key={quest.id} className={`cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50/50 to-background dark:from-purple-950/20 relative ${isCompleted ? 'ring-2 ring-green-500/50' : ''}`} onClick={() => navigate(`/submit/${quest.id}`)}>
                    {isCompleted && (
                      <div className="absolute top-2 right-2 z-20 bg-green-500 rounded-full p-1 shadow-md">
                        <CheckCircle2 className="h-3.5 w-3.5 text-black stroke-[3]" />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg line-clamp-2">{quest.title}</CardTitle>
                        <div className="flex flex-col gap-1">
                          <Badge className={getQuestTypeColor(quest.quest_type)}>
                            {quest.quest_type}
                          </Badge>
                          <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                            AI Generated
                          </Badge>
                        </div>
                      </div>
                      <CardDescription className="line-clamp-3">
                        {quest.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-1">
                          {getDifficultyStars(quest.difficulty)}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{quest.location}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>Generated {new Date(quest.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <AIQuestGenerator />
              </div>
            )}
          </div>
        )}

        {activeTab === 'recommended' && (
          <div>
            <QuestRecommendations />
          </div>
        )}
      </main>
    </div>
  );
};

export default AllQuests;