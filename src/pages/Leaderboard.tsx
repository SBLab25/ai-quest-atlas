import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Trophy, Medal, Crown, Star, TrendingUp, Zap, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { TopNavbar } from '@/components/navigation/TopNavbar';

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <TopNavbar />
      
      <main className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent mb-4">
            Champions Board
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Compete with fellow adventurers and climb to the top of the leaderboard.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{leaderboard.length}</p>
                  <p className="text-sm text-muted-foreground">Active Competitors</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-secondary/20 bg-gradient-to-br from-secondary/5 to-secondary/10 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-secondary/10 rounded-full">
                  <Zap className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{userRank?.score || 0}</p>
                  <p className="text-sm text-muted-foreground">Your Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-accent/10 rounded-full">
                  <Target className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">#{userRank?.rank || '?'}</p>
                  <p className="text-sm text-muted-foreground">Your Rank</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User's Current Rank */}
        {userRank && (
          <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Your Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20">
                  {getRankIcon(userRank.rank)}
                </div>
                <Avatar className="h-16 w-16 border-2 border-primary/20">
                  <AvatarImage src={userRank.avatar_url} />
                  <AvatarFallback className="text-lg font-semibold">
                    {userRank.full_name?.charAt(0) || userRank.username?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold">
                      {userRank.full_name || userRank.username || 'Anonymous'}
                    </h3>
                    {getRankBadge(userRank.rank)}
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-primary" />
                      <span className="font-medium">{userRank.score} points</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Trophy className="h-4 w-4 text-secondary" />
                      <span>{userRank.verified_submissions} quests</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Medal className="h-4 w-4 text-accent" />
                      <span>{userRank.total_badges} badges</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-8 text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Hall of Fame
            </h2>
            <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto">
              {/* Second Place */}
              <div className="order-1">
                <Card className="text-center border-gray-300 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="relative mb-4">
                      <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center">
                        <Avatar className="h-16 w-16 border-2 border-gray-300 dark:border-gray-600">
                          <AvatarImage src={leaderboard[1].avatar_url} />
                          <AvatarFallback className="text-lg font-semibold">
                            {leaderboard[1].full_name?.charAt(0) || leaderboard[1].username?.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                        <Medal className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg mb-1 truncate">
                      {leaderboard[1].full_name || leaderboard[1].username}
                    </h3>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{leaderboard[1].score} points</p>
                    <div className="text-xs text-muted-foreground">
                      {leaderboard[1].verified_submissions} quests • {leaderboard[1].total_badges} badges
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* First Place */}
              <div className="order-2 relative">
                <Card className="text-center border-yellow-300 bg-gradient-to-b from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 scale-105">
                  <CardContent className="p-8">
                    <div className="relative mb-6">
                      <div className="w-24 h-24 mx-auto bg-gradient-to-br from-yellow-200 to-yellow-300 dark:from-yellow-600 dark:to-yellow-700 rounded-full flex items-center justify-center shadow-lg">
                        <Avatar className="h-20 w-20 border-4 border-yellow-400 dark:border-yellow-500">
                          <AvatarImage src={leaderboard[0].avatar_url} />
                          <AvatarFallback className="text-xl font-bold">
                            {leaderboard[0].full_name?.charAt(0) || leaderboard[0].username?.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                        <Crown className="h-7 w-7 text-white" />
                      </div>
                    </div>
                    <Badge className="mb-3 bg-yellow-500 text-white border-0">Champion</Badge>
                    <h3 className="font-bold text-xl mb-2 truncate">
                      {leaderboard[0].full_name || leaderboard[0].username}
                    </h3>
                    <p className="text-lg font-semibold text-yellow-700 dark:text-yellow-400 mb-2">{leaderboard[0].score} points</p>
                    <div className="text-sm text-muted-foreground">
                      {leaderboard[0].verified_submissions} quests • {leaderboard[0].total_badges} badges
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Third Place */}
              <div className="order-3">
                <Card className="text-center border-amber-300 bg-gradient-to-b from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="relative mb-4">
                      <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-700 dark:to-amber-800 rounded-full flex items-center justify-center">
                        <Avatar className="h-16 w-16 border-2 border-amber-300 dark:border-amber-600">
                          <AvatarImage src={leaderboard[2].avatar_url} />
                          <AvatarFallback className="text-lg font-semibold">
                            {leaderboard[2].full_name?.charAt(0) || leaderboard[2].username?.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center">
                        <Medal className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg mb-1 truncate">
                      {leaderboard[2].full_name || leaderboard[2].username}
                    </h3>
                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-2">{leaderboard[2].score} points</p>
                    <div className="text-xs text-muted-foreground">
                      {leaderboard[2].verified_submissions} quests • {leaderboard[2].total_badges} badges
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Full Leaderboard */}
        <Card className="bg-gradient-to-br from-background to-accent/5 border-primary/10 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Trophy className="h-6 w-6 text-primary" />
              Global Rankings
            </CardTitle>
            <CardDescription className="text-base">
              Compete with adventurers worldwide. Rankings update in real-time based on quest completions and achievements.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leaderboard.map((entry) => (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 hover:shadow-md ${
                    entry.user_id === user?.id 
                      ? 'bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20 shadow-lg' 
                      : 'hover:bg-gradient-to-r hover:from-muted/30 hover:to-transparent border border-transparent hover:border-border/50'
                  }`}
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-muted/30 rounded-full">
                    {getRankIcon(entry.rank)}
                  </div>
                  
                  <Avatar className="h-12 w-12 border-2 border-border/20">
                    <AvatarImage src={entry.avatar_url} />
                    <AvatarFallback className="font-semibold">
                      {entry.full_name?.charAt(0) || entry.username?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">
                        {entry.full_name || entry.username || 'Anonymous User'}
                      </h3>
                      {getRankBadge(entry.rank)}
                      {entry.user_id === user?.id && (
                        <Badge className="bg-primary text-primary-foreground">You</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-primary" />
                        <span className="font-medium">{entry.score} points</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-secondary" />
                        <span>{entry.verified_submissions} quests</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Medal className="h-4 w-4 text-accent" />
                        <span>{entry.total_badges} badges</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {leaderboard.length === 0 && (
          <Card className="bg-gradient-to-br from-background to-accent/5">
            <CardContent className="text-center py-12">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Competition Awaits</h3>
              <p className="text-muted-foreground text-lg mb-6 max-w-md mx-auto">
                Be the first to complete quests and earn your place on the leaderboard!
              </p>
              <Button onClick={() => navigate('/home')} className="bg-primary hover:bg-primary/90">
                Start Your Journey
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Leaderboard;