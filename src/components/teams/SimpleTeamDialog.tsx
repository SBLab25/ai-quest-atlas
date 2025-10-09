import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Users, Plus, User, MessageCircle, Crown, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Team {
  id: string;
  name: string;
  description: string | null;
  leader_id: string;
  max_members: number;
  created_at: string;
  member_count?: number;
  is_member?: boolean;
  is_leader?: boolean;
}

interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  username?: string;
}

export function SimpleTeamDialog() {
  const { user } = useAuth();
  const [createTeamName, setCreateTeamName] = useState('');
  const [createTeamDescription, setCreateTeamDescription] = useState('');
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'find' | 'create' | 'manage'>('find');

  useEffect(() => {
    if (user) {
      fetchTeams();
    }
  }, [user]);

  const fetchTeams = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch available teams (not at max capacity and user not already a member)
      const { data: allTeams, error: teamsError } = await (supabase as any)
        .from('teams')
        .select(`
          *,
          team_members(count)
        `);

      if (teamsError) throw teamsError;

      // Get user's teams
      const { data: userTeamMemberships, error: membershipError } = await (supabase as any)
        .from('team_members')
        .select(`
          team_id,
          role,
          teams(*)
        `)
        .eq('user_id', user.id);

      if (membershipError) throw membershipError;

      const userTeamIds = new Set(userTeamMemberships?.map((m: any) => m.team_id) || []);
      
      // Process teams with member counts
      const teamsWithCounts = (allTeams || []).map((team: any) => {
        const memberCount = Array.isArray(team.team_members) ? team.team_members.length : 0;
        return {
          ...team,
          member_count: memberCount,
          is_member: userTeamIds.has(team.id),
          is_leader: team.leader_id === user.id
        };
      });

      // Available teams: not full, user not a member
      const available = teamsWithCounts.filter((team: any) => 
        team.member_count < team.max_members && !team.is_member
      );

      // User's teams
      const userTeams = teamsWithCounts.filter((team: any) => team.is_member);

      setAvailableTeams(available);
      setMyTeams(userTeams);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast({
        title: "Error loading teams",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!user || !createTeamName.trim()) {
      toast({
        title: "Team name required",
        description: "Please enter a team name to create your adventure crew!",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Create team
      const { data: team, error: teamError } = await (supabase as any)
        .from('teams')
        .insert({
          name: createTeamName,
          description: createTeamDescription || null,
          leader_id: user.id,
          max_members: 6
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add creator as team member with leader role
      const { error: memberError } = await (supabase as any)
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: user.id,
          role: 'leader'
        });

      if (memberError) throw memberError;

      toast({
        title: "🎉 Team Created!",
        description: `Welcome to "${createTeamName}"! You can now invite others to join.`,
      });
      
      setCreateTeamName('');
      setCreateTeamDescription('');
      setActiveTab('manage');
      fetchTeams();
    } catch (error) {
      console.error('Error creating team:', error);
      toast({
        title: "Error creating team",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async (teamId: string, teamName: string) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: user.id,
          role: 'member'
        });

      if (error) throw error;

      toast({
        title: "🎊 Joined Team!",
        description: `Welcome to "${teamName}"! Start collaborating on quests.`,
      });
      
      fetchTeams();
    } catch (error) {
      console.error('Error joining team:', error);
      toast({
        title: "Error joining team",
        description: "This team might be full or you're already a member.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveTeam = async (teamId: string, teamName: string) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Left Team",
        description: `You've left "${teamName}".`,
      });
      
      fetchTeams();
    } catch (error) {
      console.error('Error leaving team:', error);
      toast({
        title: "Error leaving team",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          className="group relative overflow-hidden bg-gradient-to-r from-primary/90 via-secondary/90 to-accent/90 hover:from-primary hover:to-accent ring-1 ring-primary/30 dark:ring-0 hover:shadow-2xl hover:shadow-primary/25 transform hover:scale-110 transition-all duration-300 ease-out rounded-2xl px-6 py-4 text-primary-foreground dark:text-white font-semibold shadow-lg"
          size="lg"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-quest-accent/20 via-transparent to-quest-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-center gap-2">
            <Users className="h-5 w-5 animate-pulse drop-shadow dark:drop-shadow-none" />
            <span className="hidden sm:inline">Find Adventure Team</span>
            <span className="sm:hidden">Team Up</span>
          </div>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl mx-auto max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            🚀 Adventure Team Hub
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Tab Navigation */}
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            {[
              { key: 'find', label: 'Find Teams', icon: User },
              { key: 'create', label: 'Create Team', icon: Plus },
              { key: 'manage', label: 'My Teams', icon: MessageCircle }
            ].map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={activeTab === key ? "default" : "ghost"}
                size="sm"
                className="flex-1"
                onClick={() => setActiveTab(key as any)}
              >
                <Icon className="h-4 w-4 mr-2" />
                {label}
              </Button>
            ))}
          </div>

          {/* Find Teams Tab */}
          {activeTab === 'find' && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <h3 className="font-semibold">Available Adventure Teams</h3>
                <p className="text-sm text-muted-foreground">
                  Join existing teams looking for new members!
                </p>
              </div>
              
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading teams...</div>
              ) : availableTeams.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No available teams found. Create your own!
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {availableTeams.map((team) => (
                    <Card key={team.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{team.name}</h4>
                          {team.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {team.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {team.member_count || 0}/{team.max_members} members
                          </p>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => handleJoinTeam(team.id, team.name)}
                          disabled={loading}
                          className="ml-3"
                        >
                          Join
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Create Team Tab */}
          {activeTab === 'create' && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <h3 className="font-semibold">Create Your Adventure Team</h3>
                <p className="text-sm text-muted-foreground">
                  Start your own team and lead epic adventures!
                </p>
              </div>
              
              <Card className="p-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Team Name</label>
                    <Input
                      placeholder="Enter team name"
                      value={createTeamName}
                      onChange={(e) => setCreateTeamName(e.target.value)}
                      maxLength={50}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Description (optional)</label>
                    <Textarea
                      placeholder="Describe your team's mission and goals..."
                      value={createTeamDescription}
                      onChange={(e) => setCreateTeamDescription(e.target.value)}
                      maxLength={200}
                      rows={3}
                    />
                  </div>
                  
                  <Button 
                    className="w-full"
                    onClick={handleCreateTeam}
                    disabled={loading || !createTeamName.trim()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Team
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* My Teams Tab */}
          {activeTab === 'manage' && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <h3 className="font-semibold">My Adventure Teams</h3>
                <p className="text-sm text-muted-foreground">
                  Manage your teams and track progress!
                </p>
              </div>
              
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading your teams...</div>
              ) : myTeams.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  You haven't joined any teams yet. Find or create one!
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {myTeams.map((team) => (
                    <Card key={team.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{team.name}</h4>
                            {team.is_leader && (
                              <div title="Team Leader">
                                <Crown className="h-4 w-4 text-yellow-500" />
                              </div>
                            )}
                          </div>
                          {team.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {team.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {team.member_count || 0}/{team.max_members} members
                          </p>
                        </div>
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => handleLeaveTeam(team.id, team.name)}
                          disabled={loading}
                          className="ml-3 text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              💡 Tip: When any team member completes a quest, it counts for the whole team!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}