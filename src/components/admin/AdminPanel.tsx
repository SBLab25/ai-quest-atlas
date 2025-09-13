import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Settings, Plus, Edit, Trash2, Users, BarChart, Flag, Crown, Shield, User as UserIcon } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

interface UserWithRole {
  id: string;
  username: string;
  full_name: string;
  email: string;
  created_at: string;
  current_role: string;
}

interface Submission {
  id: string;
  quest_id: string;
  user_id: string;
  status: string;
  submitted_at: string;
  description: string;
  photo_url?: string;
}

export const AdminPanel = () => {
  const { toast } = useToast();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [newQuest, setNewQuest] = useState({
    title: '',
    description: '',
    quest_type: '',
    difficulty: 1,
    location: '',
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [questsRes, submissionsRes] = await Promise.all([
        supabase.from('Quests').select('*').order('created_at', { ascending: false }),
        supabase.from('Submissions').select('*').order('submitted_at', { ascending: false })
      ]);

      if (questsRes.error) throw questsRes.error;
      if (submissionsRes.error) throw submissionsRes.error;

      setQuests(questsRes.data || []);
      setSubmissions(submissionsRes.data || []);

      // Fetch users with their roles from auth.users and user_roles tables
      await fetchUsersWithRoles();
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersWithRoles = async () => {
    try {
      // Get all users from auth.users and profiles
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) throw authError;

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      if (profilesError) throw profilesError;

      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');
      if (rolesError) throw rolesError;

      // Combine the data
      const usersWithRoles = authUsers.users.map(user => {
        const profile = profiles?.find(p => p.id === user.id);
        const userRole = userRoles?.find(r => r.user_id === user.id);
        
        return {
          id: user.id,
          email: user.email || '',
          username: profile?.username || 'No username',
          full_name: profile?.full_name || 'No name',
          created_at: user.created_at,
          current_role: userRole?.role || 'user'
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users with roles:', error);
      // Fallback: just fetch profiles without roles
      const { data: profiles } = await supabase.from('profiles').select('*');
      setUsers((profiles || []).map(p => ({
        id: p.id,
        email: '',
        username: p.username || 'No username',
        full_name: p.full_name || 'No name', 
        created_at: p.created_at,
        current_role: 'user'
      })));
    }
  };

  const createQuest = async () => {
    try {
      const { error } = await supabase.from('Quests').insert([newQuest]);
      if (error) throw error;

      toast({ title: 'Success', description: 'Quest created successfully' });
      setNewQuest({
        title: '',
        description: '',
        quest_type: '',
        difficulty: 1,
        location: '',
        is_active: true
      });
      fetchData();
    } catch (error) {
      console.error('Error creating quest:', error);
      toast({
        title: 'Error',
        description: 'Failed to create quest',
        variant: 'destructive'
      });
    }
  };

  const updateQuest = async () => {
    if (!editingQuest) return;

    try {
      const { error } = await supabase
        .from('Quests')
        .update(editingQuest)
        .eq('id', editingQuest.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Quest updated successfully' });
      setEditingQuest(null);
      fetchData();
    } catch (error) {
      console.error('Error updating quest:', error);
      toast({
        title: 'Error',
        description: 'Failed to update quest',
        variant: 'destructive'
      });
    }
  };

  const deleteQuest = async (questId: string) => {
    try {
      const { error } = await supabase.from('Quests').delete().eq('id', questId);
      if (error) throw error;

      toast({ title: 'Success', description: 'Quest deleted successfully' });
      fetchData();
    } catch (error) {
      console.error('Error deleting quest:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete quest',
        variant: 'destructive'
      });
    }
  };

  const updateSubmissionStatus = async (submissionId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('Submissions')
        .update({ status })
        .eq('id', submissionId);

      if (error) throw error;

      toast({ title: 'Success', description: 'Submission status updated' });
      fetchData();
    } catch (error) {
      console.error('Error updating submission:', error);
      toast({
        title: 'Error',
        description: 'Failed to update submission',
        variant: 'destructive'
      });
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'moderator' | 'user') => {
    try {
      // First, remove existing role for this user
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Then add the new role (only if not 'user' since 'user' is default)
      if (newRole !== 'user') {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole });

        if (error) throw error;
      }

      toast({ title: 'Success', description: `User role updated to ${newRole}` });
      await fetchUsersWithRoles(); // Refresh users list
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive'
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'moderator':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <UserIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'moderator':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Admin Panel</h1>
        </div>

        <Tabs defaultValue="quests" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="quests">Quests</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="quests" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Quest Management</CardTitle>
                    <CardDescription>Create and manage quests</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Quest
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Create New Quest</DialogTitle>
                        <DialogDescription>Add a new quest for users to complete</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="Quest title"
                          value={newQuest.title}
                          onChange={(e) => setNewQuest({ ...newQuest, title: e.target.value })}
                        />
                        <Textarea
                          placeholder="Quest description"
                          value={newQuest.description}
                          onChange={(e) => setNewQuest({ ...newQuest, description: e.target.value })}
                        />
                        <Select value={newQuest.quest_type} onValueChange={(value) => setNewQuest({ ...newQuest, quest_type: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Quest type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="photography">Photography</SelectItem>
                            <SelectItem value="nature">Nature</SelectItem>
                            <SelectItem value="history">History</SelectItem>
                            <SelectItem value="science">Science</SelectItem>
                            <SelectItem value="community">Community</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Location"
                          value={newQuest.location}
                          onChange={(e) => setNewQuest({ ...newQuest, location: e.target.value })}
                        />
                        <Select value={newQuest.difficulty.toString()} onValueChange={(value) => setNewQuest({ ...newQuest, difficulty: parseInt(value) })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Difficulty" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 Star</SelectItem>
                            <SelectItem value="2">2 Stars</SelectItem>
                            <SelectItem value="3">3 Stars</SelectItem>
                            <SelectItem value="4">4 Stars</SelectItem>
                            <SelectItem value="5">5 Stars</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button onClick={createQuest} className="w-full">Create Quest</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {quests.map((quest) => (
                    <div key={quest.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold">{quest.title}</h3>
                        <p className="text-sm text-muted-foreground">{quest.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={quest.is_active ? 'default' : 'secondary'}>
                            {quest.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline">{quest.quest_type}</Badge>
                          <span className="text-sm text-muted-foreground">Difficulty: {quest.difficulty}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingQuest(quest)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteQuest(quest.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Submission Reviews</CardTitle>
                <CardDescription>Review and approve user submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div key={submission.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">Submission {submission.id.slice(0, 8)}</h3>
                          <p className="text-sm text-muted-foreground">
                            Quest: {submission.quest_id.slice(0, 8)} • {new Date(submission.submitted_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          variant={
                            submission.status === 'verified' ? 'default' :
                            submission.status === 'rejected' ? 'destructive' : 'secondary'
                          }
                        >
                          {submission.status}
                        </Badge>
                      </div>
                      {submission.description && (
                        <p className="text-sm mb-3">{submission.description}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateSubmissionStatus(submission.id, 'verified')}
                          disabled={submission.status === 'verified'}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateSubmissionStatus(submission.id, 'rejected')}
                          disabled={submission.status === 'rejected'}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage users and their roles</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Current Role</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.full_name}</div>
                            <div className="text-sm text-muted-foreground">@{user.username}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{user.email}</TableCell>
                        <TableCell className="text-sm">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getRoleIcon(user.current_role)}
                            <Badge className={getRoleBadgeColor(user.current_role)}>
                              {user.current_role}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={user.current_role}
                            onValueChange={(newRole: 'admin' | 'moderator' | 'user') => 
                              updateUserRole(user.id, newRole)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">
                                <div className="flex items-center gap-2">
                                  <UserIcon className="h-4 w-4" />
                                  User
                                </div>
                              </SelectItem>
                              <SelectItem value="moderator">
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4" />
                                  Moderator
                                </div>
                              </SelectItem>
                              <SelectItem value="admin">
                                <div className="flex items-center gap-2">
                                  <Crown className="h-4 w-4" />
                                  Admin
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Quests</CardTitle>
                  <Flag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{quests.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
                  <BarChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{submissions.length}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Quest Dialog */}
        {editingQuest && (
          <Dialog open={!!editingQuest} onOpenChange={() => setEditingQuest(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Quest</DialogTitle>
                <DialogDescription>Update quest details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Quest title"
                  value={editingQuest.title}
                  onChange={(e) => setEditingQuest({ ...editingQuest, title: e.target.value })}
                />
                <Textarea
                  placeholder="Quest description"
                  value={editingQuest.description}
                  onChange={(e) => setEditingQuest({ ...editingQuest, description: e.target.value })}
                />
                <Select value={editingQuest.quest_type} onValueChange={(value) => setEditingQuest({ ...editingQuest, quest_type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Quest type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="photography">Photography</SelectItem>
                    <SelectItem value="nature">Nature</SelectItem>
                    <SelectItem value="history">History</SelectItem>
                    <SelectItem value="science">Science</SelectItem>
                    <SelectItem value="community">Community</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Location"
                  value={editingQuest.location}
                  onChange={(e) => setEditingQuest({ ...editingQuest, location: e.target.value })}
                />
                <Select value={editingQuest.difficulty.toString()} onValueChange={(value) => setEditingQuest({ ...editingQuest, difficulty: parseInt(value) })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Star</SelectItem>
                    <SelectItem value="2">2 Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="4">4 Stars</SelectItem>
                    <SelectItem value="5">5 Stars</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={updateQuest} className="w-full">Update Quest</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};