import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Clock, Star, Users } from "lucide-react";
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

const QuestDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [quest, setQuest] = useState<Quest | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    const fetchQuest = async () => {
      if (!id) return;

      try {
        const { data: questData, error: questError } = await supabase
          .from("Quests")
          .select("*")
          .eq("id", id)
          .single();

        if (questError) throw questError;
        setQuest(questData);

        // Check if user has already submitted for this quest
        if (user) {
          const { data: submission } = await supabase
            .from("Submissions")
            .select("id")
            .eq("quest_id", id)
            .eq("user_id", user.id)
            .maybeSingle();
          
          setHasSubmitted(!!submission);
        }
      } catch (error) {
        console.error("Error fetching quest:", error);
        toast({
          title: "Error",
          description: "Failed to load quest details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQuest();
  }, [id, user, toast]);

  const getDifficultyStars = (difficulty: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!quest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Quest Not Found</h2>
          <p className="text-muted-foreground mb-4">The quest you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/home")}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/home")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* Quest Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getQuestTypeColor(quest.quest_type)}>
                    {quest.quest_type}
                  </Badge>
                  <div className="flex items-center">
                    {getDifficultyStars(quest.difficulty)}
                  </div>
                </div>
                <CardTitle className="text-3xl font-bold mb-2">
                  {quest.title}
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-lg mb-6 leading-relaxed">
              {quest.description}
            </CardDescription>

            {/* Quest Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-5 w-5" />
                <span>{quest.location}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-5 w-5" />
                <span>Posted {new Date(quest.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              {user ? (
                <>
                  {hasSubmitted ? (
                    <Button disabled variant="secondary">
                      <Users className="h-4 w-4 mr-2" />
                      Already Submitted
                    </Button>
                  ) : (
                    <Button
                      onClick={() => navigate(`/submit/${quest.id}`)}
                    >
                      Submit Your Quest
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => navigate("/home")}
                  >
                    View All Quests
                  </Button>
                </>
              ) : (
                <Button onClick={() => navigate("/auth")}>
                  Sign In to Participate
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tips Section */}
        <Card>
          <CardHeader>
            <CardTitle>Quest Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-foreground">
              <li>Take clear, high-quality photos to document your quest</li>
              <li>Include a detailed description of your experience</li>
              <li>If possible, add location information to help others</li>
              <li>Be creative and think outside the box</li>
              <li>Safety first - only participate in activities within your comfort zone</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuestDetail;