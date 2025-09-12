import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Trophy, Medal, Crown, Star, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { StreakDisplay } from '@/components/streak/StreakDisplay';
import ThemeToggleButton from '@/components/ui/theme-toggle-button';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { ProfileDropdown } from '@/components/navigation/ProfileDropdown';

interface LeaderboardEntry {
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  total_submissions: number;
  verified_submissions: number;
  total_badges: number;
  score: number;
  rank: number;
}

const Leaderboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'month' | 'week'>('all');

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedPeriod]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      
      // Get users with their badge and submission counts
      const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url");

      if (usersError) throw usersError;

      // Get badge counts for each user
      const { data: badgeCounts, error: badgeError } = await supabase
        .from("User Badges")
        .select("user_id");

      if (badgeError) throw badgeError;

      // Get submission counts for each user
      const { data: submissionCounts, error: submissionError } = await supabase
        .from("Submissions")
        .select("user_id");

      if (submissionError) throw submissionError;

      // Calculate scores and build leaderboard
      const leaderboardData: LeaderboardEntry[] = (users || []).map((user) => {
        const badges = badgeCounts?.filter(b => b.user_id === user.id).length || 0;
        const submissions = submissionCounts?.filter(s => s.user_id === user.id).length || 0;
        
        // Score calculation: badges worth 10 points, submissions worth 2 points
        const score = badges * 10 + submissions * 2;
        
        return {
          user_id: user.id,
          username: user.full_name || 'Anonymous',
          full_name: user.full_name || 'Anonymous',
          avatar_url: user.avatar_url || '',
          total_submissions: submissions,
          verified_submissions: submissions, // All submissions are considered verified for now
          total_badges: badges,
          score,
          rank: 0 // Will be set below
        };
      });

      // Sort by score and assign ranks to ALL users
      const sortedData = leaderboardData.sort((a, b) => b.score - a.score);
      sortedData.forEach((user, index) => {
        user.rank = index + 1;
      });

      // Set leaderboard to top 50 for display
      setLeaderboard(sortedData.slice(0, 50));

      // Find current user's rank from ALL users, not just top 50
      if (user) {
        const currentUserData = sortedData.find(u => u.user_id === user.id);
        setUserRank(currentUserData || null);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to load leaderboard.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank <= 3) {
      return (
        <Badge 
          variant="secondary" 
          className={`${
            rank === 1 ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
            rank === 2 ? 'bg-gray-100 text-gray-800 border-gray-300' :
            'bg-amber-100 text-amber-800 border-amber-300'
          }`}
        >
          {rank === 1 ? 'Champion' : rank === 2 ? 'Runner-up' : 'Third Place'}
        </Badge>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b mb-8">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/home')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Leaderboard</h1>
                <p className="text-sm text-muted-foreground">See how you rank</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggleButton />
              <NotificationCenter />
              <StreakDisplay />
              <ProfileDropdown />
            </div>
          </div>
        </header>

        {/* User's Current Rank */}
        {userRank && (
          <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Your Current Rank
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  {getRankIcon(userRank.rank)}
                </div>
                <Avatar className="h-12 w-12">
                  <AvatarImage src={userRank.avatar_url} />
                  <AvatarFallback>
                    {userRank.full_name?.charAt(0) || userRank.username?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">
                      {userRank.full_name || userRank.username || 'Anonymous'}
                    </h3>
                    {getRankBadge(userRank.rank)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{userRank.score} points</span>
                    <span>•</span>
                    <span>{userRank.verified_submissions} completed quests</span>
                    <span>•</span>
                    <span>{userRank.total_badges} badges</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-center">Hall of Fame</h2>
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              {/* Second Place */}
              <div className="order-1">
                <Card className="text-center border-gray-300 bg-gradient-to-b from-gray-50 to-gray-100">
                  <CardContent className="p-4">
                    <div className="relative">
                      <Avatar className="h-16 w-16 mx-auto mb-2">
                        <AvatarImage src={leaderboard[1].avatar_url} />
                        <AvatarFallback>
                          {leaderboard[1].full_name?.charAt(0) || leaderboard[1].username?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <Medal className="h-6 w-6 text-gray-400 absolute -top-2 -right-2" />
                    </div>
                    <h3 className="font-semibold text-sm truncate">
                      {leaderboard[1].full_name || leaderboard[1].username}
                    </h3>
                    <p className="text-xs text-muted-foreground">{leaderboard[1].score} points</p>
                    <div className="text-xs text-muted-foreground mt-1">
                      {leaderboard[1].verified_submissions} quests • {leaderboard[1].total_badges} badges
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* First Place */}
              <div className="order-2">
                <Card className="text-center border-yellow-300 bg-gradient-to-b from-yellow-50 to-yellow-100">
                  <CardContent className="p-4">
                    <div className="relative">
                      <Avatar className="h-20 w-20 mx-auto mb-2">
                        <AvatarImage src={leaderboard[0].avatar_url} />
                        <AvatarFallback>
                          {leaderboard[0].full_name?.charAt(0) || leaderboard[0].username?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <Crown className="h-8 w-8 text-yellow-500 absolute -top-3 -right-3" />
                    </div>
                    <h3 className="font-semibold truncate">
                      {leaderboard[0].full_name || leaderboard[0].username}
                    </h3>
                    <p className="text-sm text-muted-foreground">{leaderboard[0].score} points</p>
                    <div className="text-xs text-muted-foreground mt-1">
                      {leaderboard[0].verified_submissions} quests • {leaderboard[0].total_badges} badges
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Third Place */}
              <div className="order-3">
                <Card className="text-center border-amber-300 bg-gradient-to-b from-amber-50 to-amber-100">
                  <CardContent className="p-4">
                    <div className="relative">
                      <Avatar className="h-16 w-16 mx-auto mb-2">
                        <AvatarImage src={leaderboard[2].avatar_url} />
                        <AvatarFallback>
                          {leaderboard[2].full_name?.charAt(0) || leaderboard[2].username?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <Medal className="h-6 w-6 text-amber-600 absolute -top-2 -right-2" />
                    </div>
                    <h3 className="font-semibold text-sm truncate">
                      {leaderboard[2].full_name || leaderboard[2].username}
                    </h3>
                    <p className="text-xs text-muted-foreground">{leaderboard[2].score} points</p>
                    <div className="text-xs text-muted-foreground mt-1">
                      {leaderboard[2].verified_submissions} quests • {leaderboard[2].total_badges} badges
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Full Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Full Rankings
            </CardTitle>
            <CardDescription>
              Rankings are based on completed quests, badges earned, and total participation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leaderboard.map((entry) => (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                    entry.user_id === user?.id 
                      ? 'bg-primary/10 border border-primary/20' 
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-center w-10 h-10">
                    {getRankIcon(entry.rank)}
                  </div>
                  
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={entry.avatar_url} />
                    <AvatarFallback>
                      {entry.full_name?.charAt(0) || entry.username?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">
                        {entry.full_name || entry.username || 'Anonymous User'}
                      </h3>
                      {getRankBadge(entry.rank)}
                      {entry.user_id === user?.id && (
                        <Badge variant="outline" className="text-xs">You</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {entry.score} points
                      </span>
                      <span>{entry.verified_submissions} completed</span>
                      <span>{entry.total_badges} badges</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {leaderboard.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Rankings Yet</h3>
              <p className="text-muted-foreground">
                Complete some quests to see the leaderboard!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;