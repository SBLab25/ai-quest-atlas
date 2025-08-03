import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Sparkles, Star, MapPin, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

interface UserProfile {
  interests: string[];
  location: string;
}

export const QuestRecommendations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      generateRecommendations();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('interests, location')
        .eq('id', user?.id)
        .single();
      
      if (data) {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const generateRecommendations = async () => {
    try {
      // Get user's submission history to understand preferences
      const { data: userSubmissions } = await supabase
        .from('Submissions')
        .select('quest_id, Quests!inner(quest_type, difficulty)')
        .eq('user_id', user?.id);

      // Get all available quests
      const { data: allQuests } = await supabase
        .from('Quests')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!allQuests) return;

      // Get user's completed quest IDs to exclude them
      const completedQuestIds = userSubmissions?.map(sub => sub.quest_id) || [];

      // Filter out completed quests
      const availableQuests = allQuests.filter(quest => 
        !completedQuestIds.includes(quest.id)
      );

      // Simple recommendation algorithm
      let scoredQuests = availableQuests.map(quest => {
        let score = 0;

        // Score based on user's previous quest types
        const userQuestTypes = userSubmissions?.map((sub: any) => sub.Quests.quest_type) || [];
        const typeFrequency = userQuestTypes.filter(type => type === quest.quest_type).length;
        score += typeFrequency * 3;

        // Score based on user interests
        if (userProfile?.interests) {
          const matchingInterests = userProfile.interests.filter(interest =>
            quest.quest_type.toLowerCase().includes(interest.toLowerCase()) ||
            quest.title.toLowerCase().includes(interest.toLowerCase()) ||
            quest.description.toLowerCase().includes(interest.toLowerCase())
          );
          score += matchingInterests.length * 2;
        }

        // Score based on difficulty progression
        const userDifficulties = userSubmissions?.map((sub: any) => sub.Quests.difficulty) || [];
        const avgDifficulty = userDifficulties.length > 0 
          ? userDifficulties.reduce((a, b) => a + b, 0) / userDifficulties.length 
          : 2;
        
        // Prefer quests slightly harder than user's average
        const difficultyDiff = Math.abs(quest.difficulty - (avgDifficulty + 0.5));
        score += Math.max(0, 3 - difficultyDiff);

        // Boost newer quests slightly
        const daysOld = (new Date().getTime() - new Date(quest.created_at).getTime()) / (1000 * 60 * 60 * 24);
        if (daysOld < 7) score += 1;

        // Random factor for variety
        score += Math.random() * 2;

        return { ...quest, score };
      });

      // Sort by score and take top recommendations
      scoredQuests.sort((a, b) => b.score - a.score);
      setRecommendations(scoredQuests.slice(0, 6));
    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Recommended for You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Recommended for You
          <Badge variant="secondary" className="ml-auto">
            <TrendingUp className="h-3 w-3 mr-1" />
            Personalized
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recommendations.length > 0 ? (
          <div className="space-y-3">
            {recommendations.map((quest) => (
              <div
                key={quest.id}
                className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/quest/${quest.id}`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1">{quest.title}</h4>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`${getQuestTypeColor(quest.quest_type)} text-xs`}>
                        {quest.quest_type}
                      </Badge>
                      <div className="flex items-center">
                        {getDifficultyStars(quest.difficulty)}
                      </div>
                    </div>
                  </div>
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {quest.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {quest.location}
                  </div>
                  <Button size="sm" variant="outline" className="text-xs h-6">
                    View Quest
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Sparkles className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">No recommendations available</p>
            <p className="text-xs text-muted-foreground">
              Complete a few quests to get personalized recommendations
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};