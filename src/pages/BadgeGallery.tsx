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
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Badge Gallery
            </h1>
            <p className="text-muted-foreground">
              Collect badges by completing quests and achievements
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{userBadges.length}</p>
                  <p className="text-sm text-muted-foreground">Earned Badges</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{allBadges.length}</p>
                  <p className="text-sm text-muted-foreground">Total Available</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-2xl font-bold">
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
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              Earned Badges
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userBadges.map((userBadge) => (
                <Card key={userBadge.id} className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                  <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
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
                    <CardTitle className="text-lg">{userBadge.badge.name}</CardTitle>
                    <CardDescription>{userBadge.badge.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <Badge variant="secondary" className="mb-2">
                        Earned
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {new Date(userBadge.earned_at).toLocaleDateString()}
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
          <h2 className="text-2xl font-semibold mb-4">All Badges</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allBadges.map((badge) => {
              const earnedBadge = getBadgeStatus(badge.id);
              const isEarned = !!earnedBadge;
              
              return (
                <Card 
                  key={badge.id} 
                  className={`transition-all duration-200 ${
                    isEarned 
                      ? 'border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10' 
                      : 'opacity-70 hover:opacity-90 border-muted'
                  }`}
                >
                  <CardHeader className="text-center">
                    <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-2 ${
                      isEarned ? 'bg-primary/10' : 'bg-muted'
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
                    <CardTitle className="text-lg">{badge.name}</CardTitle>
                    <CardDescription>{badge.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <Badge 
                        variant={isEarned ? "secondary" : "outline"}
                        className="mb-2"
                      >
                        {isEarned ? 'Earned' : 'Not Earned'}
                      </Badge>
                      {isEarned && earnedBadge && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(earnedBadge.earned_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BadgeGallery;