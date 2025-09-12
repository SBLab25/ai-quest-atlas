import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useLocationPermission } from '@/hooks/useLocationPermission';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Clock, Star, Sparkles, RefreshCw, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AIGeneratedQuest {
  id: string;
  title: string;
  description: string;
  quest_type: string;
  difficulty: number;
  location: string;
  generated_by: string;
  created_at: string;
}

export const AIQuestGenerator = () => {
  const { user } = useAuth();
  const { location, hasPermission, requestLocationPermission } = useLocationPermission();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [aiQuests, setAiQuests] = useState<AIGeneratedQuest[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAIQuests();
    }
  }, [user]);

  const fetchAIQuests = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_generated_quests')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setAiQuests(data || []);
    } catch (error) {
      console.error('Error fetching AI quests:', error);
      toast({
        title: "Error",
        description: "Failed to load AI-generated quests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateNewQuest = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to generate AI quests",
        variant: "destructive"
      });
      return;
    }

    if (!hasPermission) {
      const granted = await requestLocationPermission();
      if (!granted) return;
    }

    try {
      setGenerating(true);
      
      const { data, error } = await supabase.functions.invoke('generate-daily-ai-quests', {
        body: { 
          manual: true,
          userId: user.id 
        }
      });

      if (error) throw error;

      toast({
        title: "Quest generated!",
        description: "A new personalized quest has been created for you"
      });

      // Refresh the quest list
      await fetchAIQuests();
    } catch (error) {
      console.error('Error generating quest:', error);
      toast({
        title: "Generation failed",
        description: "Unable to generate a new quest. Please try again later.",
        variant: "destructive"
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
      discovery: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      photography: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      nature: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      history: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
      science: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
      community: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      adventure: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      culture: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">AI-Generated Quests</h3>
          <p className="text-muted-foreground mb-4">
            Sign in to get personalized quests generated daily based on your location
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>AI-Generated Quests</CardTitle>
            </div>
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
          <CardDescription>
            Personalized quests generated daily based on your location and interests.
            {!hasPermission && (
              <span className="block mt-1 text-amber-600 dark:text-amber-400">
                Enable location access to get location-based quests.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-muted-foreground py-8">
              Loading AI quests...
            </div>
          ) : aiQuests.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No AI quests yet</h3>
              <p className="text-muted-foreground mb-4">
                Generate your first personalized quest or wait for the daily automatic generation at midnight UTC.
              </p>
              {!hasPermission && (
                <Button onClick={requestLocationPermission} variant="outline" className="mb-4">
                  <MapPin className="h-4 w-4 mr-2" />
                  Enable Location Access
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {aiQuests.map((quest) => (
                <Card key={quest.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-lg leading-tight">{quest.title}</h3>
                      <div className="flex items-center gap-1 ml-2">
                        {getDifficultyStars(quest.difficulty)}
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground text-sm mb-3 leading-relaxed">
                      {quest.description}
                    </p>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={getQuestTypeColor(quest.quest_type)}>
                        {quest.quest_type}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Sparkles className="h-3 w-3" />
                        AI Generated
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {quest.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(quest.created_at)}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/submit/${quest.id}`)}
                        className="ml-4"
                      >
                        Submit Quest
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};