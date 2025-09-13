import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { addNewBadges } from '@/utils/addNewBadges';
import { TopNavbar } from '@/components/navigation/TopNavbar';

interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  quest_id?: string;
}

interface UserBadge {
  id: string;
  badge_id: string;
  earned_at: string;
  badge: BadgeData;
}

const BadgeGallery = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [allBadges, setAllBadges] = useState<BadgeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      initializeBadges();
    }
  }, [user]);

  const initializeBadges = async () => {
    try {
      // First add new badges if they don't exist
      await addNewBadges();
    } catch (error) {
      // Badges might already exist, which is fine
      console.log('Badges already exist or error adding:', error);
    }
    // Then fetch all badges
    await fetchBadges();
  };

  const fetchBadges = async () => {
    try {
      // Fetch user's earned badges
      const { data: earnedBadges, error: earnedError } = await supabase
        .from('User Badges')
        .select(`
          id,
          badge_id,
          earned_at,
          badge:Badges(id, name, description, icon_url, quest_id)
        `)
        .eq('user_id', user?.id);

      if (earnedError) throw earnedError;

      // Fetch all available badges
      const { data: badges, error: badgesError } = await supabase
        .from('Badges')
        .select('*');

      if (badgesError) throw badgesError;

      setUserBadges(earnedBadges || []);
      setAllBadges(badges || []);
    } catch (error) {
      console.error('Error fetching badges:', error);
      toast({
        title: 'Error',
        description: 'Failed to load badges.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getBadgeStatus = (badgeId: string) => {
    return userBadges.find(ub => ub.badge_id === badgeId);
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
            Badge Gallery
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Showcase your achievements and track your collection progress across all adventures.
          </p>
        </div>

        {/* Achievement Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{userBadges.length}</p>
                  <p className="text-sm text-muted-foreground">Earned Badges</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-secondary/20 bg-gradient-to-br from-secondary/5 to-secondary/10 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-secondary/10 rounded-full">
                  <Calendar className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{allBadges.length}</p>
                  <p className="text-sm text-muted-foreground">Total Available</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-accent/10 rounded-full">
                  <Trophy className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-3xl font-bold">
                    {Math.round((userBadges.length / Math.max(allBadges.length, 1)) * 100)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Collection Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Earned Badges */}
        {userBadges.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-8 flex items-center gap-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              <div className="p-2 bg-primary/10 rounded-full">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              Your Achievements
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userBadges.map((userBadge) => (
                <Card key={userBadge.id} className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <CardHeader className="text-center">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full flex items-center justify-center mb-4 shadow-lg">
                      {userBadge.badge.icon_url ? (
                        userBadge.badge.icon_url.startsWith('http') ? (
                          <img 
                            src={userBadge.badge.icon_url} 
                            alt={userBadge.badge.name}
                            className="w-8 h-8"
                          />
                        ) : (
                          <span className="text-3xl">{userBadge.badge.icon_url}</span>
                        )
                      ) : (
                        <Trophy className="h-8 w-8 text-primary" />
                      )}
                    </div>
                    <CardTitle className="text-xl font-bold">{userBadge.badge.name}</CardTitle>
                    <CardDescription className="text-base">{userBadge.badge.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <Badge className="mb-3 bg-gradient-to-r from-primary to-primary/80 text-white border-0">
                        ✨ Achieved
                      </Badge>
                      <p className="text-sm text-muted-foreground font-medium">
                        Earned on {new Date(userBadge.earned_at).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Badges */}
        <div>
          <h2 className="text-2xl font-semibold mb-8 flex items-center gap-3">
            <div className="p-2 bg-muted/30 rounded-full">
              <Trophy className="h-6 w-6 text-muted-foreground" />
            </div>
            Complete Collection
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allBadges.map((badge) => {
              const earnedBadge = getBadgeStatus(badge.id);
              const isEarned = !!earnedBadge;
              
              return (
                <Card 
                  key={badge.id} 
                  className={`transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg ${
                    isEarned 
                      ? 'border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 shadow-md' 
                      : 'opacity-60 hover:opacity-80 border-muted/50 hover:border-border'
                  }`}
                >
                  <CardHeader className="text-center">
                    <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-md ${
                      isEarned ? 'bg-gradient-to-br from-primary/10 to-primary/20' : 'bg-muted/50'
                    }`}>
                       {badge.icon_url ? (
                         badge.icon_url.startsWith('http') ? (
                           <img 
                             src={badge.icon_url} 
                             alt={badge.name}
                             className={`w-8 h-8 ${!isEarned ? 'grayscale' : ''}`}
                           />
                         ) : (
                           <span className={`text-3xl ${!isEarned ? 'grayscale opacity-50' : ''}`}>
                             {badge.icon_url}
                           </span>
                         )
                       ) : (
                         <Trophy className={`h-8 w-8 ${isEarned ? 'text-primary' : 'text-muted-foreground'}`} />
                       )}
                    </div>
                    <CardTitle className="text-xl font-bold">{badge.name}</CardTitle>
                    <CardDescription className="text-base">{badge.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <Badge 
                        variant={isEarned ? "default" : "outline"}
                        className={`mb-3 ${isEarned ? 'bg-gradient-to-r from-primary to-primary/80 text-white' : ''}`}
                      >
                        {isEarned ? '✨ Achieved' : '🔒 Locked'}
                      </Badge>
                      {isEarned && earnedBadge && (
                        <p className="text-sm text-muted-foreground font-medium">
                          Earned on {new Date(earnedBadge.earned_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default BadgeGallery;