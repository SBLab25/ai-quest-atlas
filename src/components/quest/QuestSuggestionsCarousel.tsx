import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Sparkles, Clock, MapPin, Star, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface QuestSuggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: number;
  estimated_duration: number;
  quest_type: string;
  location: string;
  is_active: boolean;
}

export const QuestSuggestionsCarousel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<QuestSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchSuggestions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('suggested_quests')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .order('generated_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateNewSuggestions = async () => {
    if (!user || generating) return;

    setGenerating(true);
    try {
      const { error } = await supabase.functions.invoke('generate-quest-suggestions');

      if (error) throw error;

      toast({
        title: "✨ New suggestions generated!",
        description: "Check out your personalized quest recommendations.",
      });

      await fetchSuggestions();
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast({
        title: "Error",
        description: "Failed to generate new suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [user]);

  const getDifficultyStars = (difficulty: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < difficulty ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`}
      />
    ));
  };

  const getQuestTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      discovery: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      photography: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      nature: 'bg-green-500/10 text-green-500 border-green-500/20',
      history: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      science: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
      community: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
      adventure: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      culture: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
      social: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    };
    return colors[type] || 'bg-muted text-muted-foreground';
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="w-full py-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">Recommended for You</h2>
        </div>
        <div className="animate-pulse">
          <div className="h-48 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">Recommended for You</h2>
        </div>
        <Button
          onClick={generateNewSuggestions}
          disabled={generating}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Generating...' : 'Generate New'}
        </Button>
      </div>

      {suggestions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-4">
              No suggestions yet. Generate personalized quests based on your interests!
            </p>
            <Button onClick={generateNewSuggestions} disabled={generating}>
              {generating ? 'Generating...' : 'Generate Suggestions'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Carousel className="w-full">
          <CarouselContent className="-ml-2 md:-ml-4">
            {suggestions.map((quest) => (
              <CarouselItem key={quest.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge variant="outline" className={getQuestTypeColor(quest.quest_type)}>
                        {quest.category}
                      </Badge>
                      <div className="flex gap-0.5">
                        {getDifficultyStars(quest.difficulty)}
                      </div>
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {quest.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <CardDescription className="line-clamp-3">
                      {quest.description}
                    </CardDescription>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{quest.estimated_duration} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{quest.location}</span>
                      </div>
                    </div>

                    <Button 
                      className="w-full mt-4"
                      onClick={() => navigate(`/submit/${quest.id}`)}
                    >
                      Start Quest
                    </Button>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      )}
    </div>
  );
};
