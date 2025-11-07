import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Clock, Award, Target } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Challenge {
  id: string;
  title: string;
  description: string;
  quest_id: string | null;
  required_completions: number;
  start_date: string;
  end_date: string | null;
  reward_points: number;
  reward_badge_id: string | null;
  is_active: boolean;
  Quests?: { title: string };
  Badges?: { name: string; icon: string };
}

interface ChallengeProgress {
  id: string;
  challenge_id: string;
  completions: number;
  is_completed: boolean;
  completed_at: string | null;
}

interface TeamChallengesProps {
  teamId: string;
}

export const TeamChallenges = ({ teamId }: TeamChallengesProps) => {
  const [activeChallenges, setActiveChallenges] = useState<
    (Challenge & { progress?: ChallengeProgress })[]
  >([]);
  const [completedChallenges, setCompletedChallenges] = useState<
    (Challenge & { progress?: ChallengeProgress })[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (teamId) {
      fetchChallenges();
      subscribeToProgress();
    }
  }, [teamId]);

  const fetchChallenges = async () => {
    try {
      // Fetch all active challenges
      const { data: challenges, error: challengesError }: { data: any; error: any } = await (supabase as any)
        .from("team_challenges")
        .select(`
          *,
          Quests(title),
          Badges(name, icon)
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (challengesError) throw challengesError;

      // Fetch team's progress for these challenges
      const { data: progress, error: progressError }: { data: any; error: any } = await (supabase as any)
        .from("team_challenge_progress")
        .select("*")
        .eq("team_id", teamId);

      if (progressError) throw progressError;

      // Merge challenges with progress with explicit typing to avoid TS issues
      const typedChallenges = (challenges ?? []) as (Challenge & { Quests?: { title: string }; Badges?: { name: string; icon: string } })[];
      const typedProgress = (progress ?? []) as ChallengeProgress[];

      const challengesWithProgress = typedChallenges.map((challenge) => ({
        ...challenge,
        progress: typedProgress.find((p) => p.challenge_id === challenge.id),
      }));

      // Separate active and completed
      const active = challengesWithProgress?.filter(
        (c) => !c.progress?.is_completed
      ) || [];
      const completed = challengesWithProgress?.filter(
        (c) => c.progress?.is_completed
      ) || [];

      setActiveChallenges(active);
      setCompletedChallenges(completed);
    } catch (error) {
      console.error("Error fetching challenges:", error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToProgress = () => {
    const channel = supabase
      .channel(`team_progress:${teamId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "team_challenge_progress",
          filter: `team_id=eq.${teamId}`,
        },
        () => {
          fetchChallenges();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getProgressPercentage = (challenge: Challenge & { progress?: ChallengeProgress }) => {
    if (!challenge.progress) return 0;
    return Math.min(
      (challenge.progress.completions / challenge.required_completions) * 100,
      100
    );
  };

  const getTimeRemaining = (endDate: string | null) => {
    if (!endDate) return "No deadline";
    const now = new Date();
    const end = new Date(endDate);
    if (end < now) return "Expired";
    return formatDistanceToNow(end, { addSuffix: true });
  };

  const ChallengeCard = ({ challenge }: { challenge: Challenge & { progress?: ChallengeProgress } }) => {
    const progress = getProgressPercentage(challenge);
    const completions = challenge.progress?.completions || 0;

    return (
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{challenge.title}</CardTitle>
              {challenge.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {challenge.description}
                </p>
              )}
            </div>
            {challenge.progress?.is_completed && (
              <Trophy className="h-6 w-6 text-yellow-500" />
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {challenge.Quests && (
            <div className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-primary" />
              <span>Quest: {challenge.Quests.title}</span>
            </div>
          )}

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>
                Progress: {completions} / {challenge.required_completions}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {challenge.end_date && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{getTimeRemaining(challenge.end_date)}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {challenge.reward_points > 0 && (
              <Badge variant="secondary">
                <Award className="h-3 w-3 mr-1" />
                +{challenge.reward_points} points
              </Badge>
            )}
            {challenge.Badges && (
              <Badge variant="secondary">
                <Trophy className="h-3 w-3 mr-1" />
                {challenge.Badges.name}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Tabs defaultValue="active" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="active">
          Active ({activeChallenges.length})
        </TabsTrigger>
        <TabsTrigger value="completed">
          Completed ({completedChallenges.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="active" className="space-y-4 mt-4">
        {activeChallenges.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-48">
              <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No active challenges at the moment
              </p>
            </CardContent>
          </Card>
        ) : (
          activeChallenges.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))
        )}
      </TabsContent>

      <TabsContent value="completed" className="space-y-4 mt-4">
        {completedChallenges.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-48">
              <Award className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No completed challenges yet
              </p>
            </CardContent>
          </Card>
        ) : (
          completedChallenges.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))
        )}
      </TabsContent>
    </Tabs>
  );
};
