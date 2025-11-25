import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Settings, Plus, Edit, Trash2, Users, BarChart, Flag, Crown, Shield, User as UserIcon, ImageIcon, Bot, Sparkles } from 'lucide-react';
import { fixHiddenTemplePost } from '@/utils/fixCommunityImages';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RecalculateAllPoints } from '@/components/admin/RecalculateAllPoints';
import { CreditPointsButton } from '@/components/admin/CreditPointsButton';
import { AIVerificationLogs } from '@/components/admin/AIVerificationLogs';
import { TeamChallengeManager } from '@/components/admin/TeamChallengeManager';
import { CreateUserWallets } from '@/components/admin/CreateUserWallets';
import { sendNotification } from '@/utils/notificationHelper';
import { cleanDescription } from '@/utils/cleanDescription';

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

interface AIGeneratedQuest {
  id: string;
  title: string;
  description: string;
  quest_type: string;
  difficulty: number;
  location: string;
  generated_by: string;
  user_id: string;
  is_active: boolean;
  created_at: string;
  latitude?: number;
  longitude?: number;
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

interface CommunityPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  post_type: string;
  tags: string[];
  image_urls: string[];
  created_at: string;
  username?: string;
  full_name?: string;
}

export const AdminPanel = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [aiQuests, setAiQuests] = useState<AIGeneratedQuest[]>([]);
  const [showAiQuests, setShowAiQuests] = useState(false);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [editingAiQuest, setEditingAiQuest] = useState<AIGeneratedQuest | null>(null);
  const [newQuest, setNewQuest] = useState({
    title: '',
    description: '',
    quest_type: '',
    difficulty: 1,
    location: '',
    is_active: true
  });
  const [newAiQuest, setNewAiQuest] = useState({
    title: '',
    description: '',
    quest_type: '',
    difficulty: 1,
    location: '',
    is_active: true,
    latitude: null as number | null,
    longitude: null as number | null
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [questsRes, aiQuestsRes, submissionsRes, communityPostsRes] = await Promise.all([
        supabase.from('Quests').select('*').order('created_at', { ascending: false }),
        supabase.from('ai_generated_quests').select('*').order('created_at', { ascending: false }),
        supabase.from('Submissions').select('*').order('submitted_at', { ascending: false }),
        supabase.from('community_posts').select('*').order('created_at', { ascending: false })
      ]);

      if (questsRes.error) throw questsRes.error;
      if (aiQuestsRes.error) throw aiQuestsRes.error;
      if (submissionsRes.error) throw submissionsRes.error;
      if (communityPostsRes.error) throw communityPostsRes.error;

      setQuests(questsRes.data || []);
      setAiQuests(aiQuestsRes.data || []);
      setSubmissions(submissionsRes.data || []);
      
      // Fetch profiles for community posts
      const { data: profiles } = await supabase.from('profiles').select('*');
      const postsWithProfiles = (communityPostsRes.data || []).map(post => {
        const profile = profiles?.find(p => p.id === post.user_id);
        return {
          ...post,
          username: profile?.username || 'Unknown',
          full_name: profile?.full_name || 'Unknown User'
        };
      });
      setCommunityPosts(postsWithProfiles);

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
    // Use only tables accessible from client to avoid 403s from admin API on the client
    try {
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('user_roles').select('*')
      ]);

      const profiles = (profilesRes.error || !profilesRes.data) ? [] : profilesRes.data as any[];
      const userRoles = (rolesRes.error || !rolesRes.data) ? [] : rolesRes.data as any[];

      const usersWithRoles = profiles.map((p: any) => ({
        id: p.id,
        email: '',
        username: p.username || 'No username',
        full_name: p.full_name || 'No name', 
        created_at: p.created_at,
        current_role: (userRoles.find((r: any) => r.user_id === p.id)?.role) || 'user'
      }));
      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users with roles (profiles only):', error);
      setUsers([]);
    }
  };

  const createQuest = async () => {
    try {
      if (!newQuest.title.trim() || !newQuest.description.trim() || !newQuest.quest_type || !newQuest.location.trim()) {
        toast({ title: 'Missing info', description: 'Please fill all required fields (title, description, type, location).', variant: 'destructive' });
        return;
      }

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
    } catch (error: any) {
      console.error('Error creating quest:', error);
      toast({
        title: 'Creation failed',
        description: error?.message || 'Failed to create quest. Ensure your account has admin permissions and RLS policies allow inserts.',
        variant: 'destructive'
      });
    }
  };

  const updateQuest = async () => {
    if (!editingQuest) return;

    try {
      if (!editingQuest.title.trim() || !editingQuest.description.trim() || !editingQuest.quest_type || !editingQuest.location.trim()) {
        toast({ title: 'Missing info', description: 'Please fill all required fields (title, description, type, location).', variant: 'destructive' });
        return;
      }

      const { error } = await supabase
        .from('Quests')
        .update({
          title: editingQuest.title,
          description: editingQuest.description,
          quest_type: editingQuest.quest_type,
          difficulty: editingQuest.difficulty,
          location: editingQuest.location,
          is_active: editingQuest.is_active
        })
        .eq('id', editingQuest.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Quest updated successfully' });
      setEditingQuest(null);
      fetchData();
    } catch (error: any) {
      console.error('Error updating quest:', error);
      toast({
        title: 'Update failed',
        description: error?.message || 'Failed to update quest. Ensure your account has admin permissions and RLS policies allow updates.',
        variant: 'destructive'
      });
    }
  };

  const createAiQuest = async () => {
    try {
      if (!newAiQuest.title.trim() || !newAiQuest.description.trim() || !newAiQuest.quest_type || !newAiQuest.location.trim()) {
        toast({ title: 'Missing info', description: 'Please fill all required fields (title, description, type, location).', variant: 'destructive' });
        return;
      }
      // Prefer direct DB insert first to avoid CORS issues
      const payload: any = {
        title: newAiQuest.title,
        description: newAiQuest.description,
        quest_type: newAiQuest.quest_type,
        difficulty: newAiQuest.difficulty,
        location: newAiQuest.location,
        is_active: newAiQuest.is_active,
        generated_by: user?.id || 'admin',
        user_id: user?.id || 'admin',
        latitude: newAiQuest.latitude,
        longitude: newAiQuest.longitude
      };

      const { data: inserted, error: dbError } = await supabase
        .from('ai_generated_quests')
        .insert([payload])
        .select('*')
        .single();
      if (dbError) throw dbError;

      // Optimistic UI update
      setAiQuests(prev => [{ ...(inserted as any) }, ...prev]);

      toast({ title: 'Success', description: 'AI Quest created' });
      setNewAiQuest({
        title: '',
        description: '',
        quest_type: '',
        difficulty: 1,
        location: '',
        is_active: true,
        latitude: null,
        longitude: null
      });
      fetchData();
    } catch (error: any) {
      console.error('Error creating AI quest:', error);
      toast({ title: 'Creation failed', description: error?.message || 'Failed to create AI quest.', variant: 'destructive' });
    }
  };

  const updateAiQuest = async () => {
    if (!editingAiQuest) return;

    try {
      if (!editingAiQuest.title.trim() || !editingAiQuest.description.trim() || !editingAiQuest.quest_type || !editingAiQuest.location.trim()) {
        toast({ title: 'Missing info', description: 'Please fill all required fields (title, description, type, location).', variant: 'destructive' });
        return;
      }

      // Direct DB update to avoid CORS/Edge Function issues
      const { error: dbError } = await supabase
        .from('ai_generated_quests')
        .update({
          title: editingAiQuest.title,
          description: editingAiQuest.description,
          quest_type: editingAiQuest.quest_type,
          difficulty: editingAiQuest.difficulty,
          location: editingAiQuest.location,
          is_active: editingAiQuest.is_active,
          latitude: editingAiQuest.latitude ?? null,
          longitude: editingAiQuest.longitude ?? null
        })
        .eq('id', editingAiQuest.id);

      if (dbError) throw dbError;

      // Fetch fresh row after update (separate GET avoids 406)
      const { data: refreshed } = await supabase
        .from('ai_generated_quests')
        .select('*')
        .eq('id', editingAiQuest.id)
        .single();
      if (refreshed) {
        setAiQuests(prev => prev.map(q => q.id === editingAiQuest.id ? { ...q, ...(refreshed as any) } : q));
      }
      toast({ title: 'Success', description: 'AI Quest updated' });
      setEditingAiQuest(null);
      fetchData();
    } catch (error: any) {
      console.error('Error updating AI quest:', error);
      toast({ title: 'Update failed', description: error?.message || 'Failed to update AI quest.', variant: 'destructive' });
    }
  };

  const deleteQuest = async (questId: string) => {
    try {
      console.log('Attempting to delete quest:', questId);
      
      // Use service role for admin operations
      const { error } = await supabase
        .from('Quests')
        .delete()
        .eq('id', questId);
        
      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      toast({ title: 'Success', description: 'Quest deleted successfully' });
      fetchData();
    } catch (error: any) {
      console.error('Error deleting quest:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete quest. Check RLS policies.',
        variant: 'destructive'
      });
    }
  };

  const deleteAiQuest = async (questId: string) => {
    try {
      const { error: dbError } = await supabase
        .from('ai_generated_quests')
        .delete()
        .eq('id', questId);
      if (dbError) throw dbError;

      setAiQuests(prev => prev.filter(q => q.id !== questId));
      toast({ title: 'Success', description: 'AI Quest deleted' });
      fetchData();
    } catch (error: any) {
      console.error('Error deleting AI quest:', error);
      toast({ title: 'Error', description: error?.message || 'Failed to delete AI quest', variant: 'destructive' });
    }
  };

  const updateSubmissionStatus = async (submissionId: string, status: string) => {
    console.log('🔔 updateSubmissionStatus called:', { submissionId, status });
    try {
      // Get submission details - fetch separately to avoid join issues
      const { data: subData, error: subError } = await supabase
        .from('Submissions')
        .select('*')
        .eq('id', submissionId)
        .single();
      
      let sub = subData;
      
      console.log('📋 Submission data:', sub);
      console.log('❌ Submission error:', subError);
      
      // If submission fetch failed, try to continue with what we have
      if (subError && !sub) {
        console.warn('⚠️ Could not fetch submission details, but proceeding with status update');
        // Try to update status anyway - the update might still work
        const { error: updateError } = await supabase
          .from('Submissions')
          .update({ status })
          .eq('id', submissionId);
        
        if (updateError) {
          throw updateError;
        }
        
        toast({ title: 'Success', description: 'Submission status updated' });
        await fetchData();
        return;
      }
      
      // Get quest title separately if needed
      let questTitle = 'Your quest';
      if (sub?.quest_id) {
        const { data: questData } = await supabase
          .from('Quests')
          .select('title')
          .eq('id', sub.quest_id)
          .single();
        if (questData) {
          questTitle = questData.title;
        }
      }
      
      if (status === 'rejected') {
        // When rejecting: delete related assets and records
        const keysToRemove: string[] = [];
        const collectKey = (url?: string | null) => {
          if (!url) return;
          try {
            const u = new URL(url);
            // Expect format .../storage/v1/object/public/quest-submissions/<path>
            const parts = u.pathname.split('/object/public/');
            if (parts[1]) keysToRemove.push(parts[1].replace(/^quest-submissions\//, ''));
          } catch {}
        };
        collectKey(sub?.photo_url);
        (sub?.image_urls || []).forEach((u: string) => collectKey(u));

        if (keysToRemove.length > 0) {
          await supabase.storage.from('quest-submissions').remove(keysToRemove);
        }

        await Promise.all([
          supabase.from('post_likes').delete().eq('submission_id', submissionId),
          supabase.from('post_comments').delete().eq('submission_id', submissionId),
          supabase.from('post_shares').delete().eq('submission_id', submissionId)
        ]);

        // Delete the submission - this makes the quest available for resubmission
        // Use RPC function if available, otherwise direct delete
        console.log('🗑️ Deleting submission:', submissionId, 'for quest:', sub?.quest_id);
        
        let deleteSuccess = false;
        let deleteError = null;
        
        // Try using the RPC function first (more secure)
        try {
          const { data: rpcResult, error: rpcError } = await supabase.rpc('delete_submission_admin', {
            p_submission_id: submissionId
          });
          
          const result = rpcResult as { success?: boolean; quest_id?: string } | null;
          if (!rpcError && result?.success) {
            console.log('✅ Submission deleted via RPC function:', result);
            deleteSuccess = true;
            // Use quest_id from RPC result if available
            if (result.quest_id && !sub?.quest_id) {
              sub = { ...sub, quest_id: result.quest_id };
            }
          } else {
            console.warn('⚠️ RPC function not available or failed, trying direct delete:', rpcError);
            deleteError = rpcError;
          }
        } catch (rpcException) {
          console.warn('⚠️ RPC function call failed, trying direct delete:', rpcException);
        }
        
        // Fallback to direct delete if RPC didn't work
        if (!deleteSuccess) {
          const { error: delErr, data: deleteResult } = await supabase.from('Submissions').delete().eq('id', submissionId).select();
          if (delErr) {
            console.error('❌ Error deleting submission:', delErr);
            throw delErr;
          }
          console.log('✅ Submission deleted successfully via direct delete:', deleteResult);
          deleteSuccess = true;
        }
        
        // Send rejection notification
        if (sub?.user_id) {
          try {
            console.log('Sending rejection notification to:', sub.user_id);
            await sendNotification({
              userId: sub.user_id,
              type: 'quest_rejected',
              title: 'Quest Submission Rejected',
              message: `Your submission has been rejected. You can submit again for this quest.`,
              relatedId: sub?.quest_id || submissionId,
              relatedType: 'submission',
            });
            console.log('Rejection notification sent successfully');
          } catch (notifError) {
            console.error('Failed to send rejection notification:', notifError);
          }
        }
        
        toast({ 
          title: 'Submission rejected', 
          description: 'Submission deleted. Quest is now available for resubmission.' 
        });
        
        // Verify deletion worked
        const { data: verifyDelete } = await supabase
          .from('Submissions')
          .select('id')
          .eq('id', submissionId)
          .maybeSingle();
        
        if (verifyDelete) {
          console.error('⚠️ WARNING: Submission still exists after deletion attempt!', verifyDelete);
        } else {
          console.log('✅ Verification: Submission successfully deleted');
        }
        
        // Broadcast events IMMEDIATELY after deletion
        console.log('📢 Broadcasting events for quest:', sub?.quest_id);
        window.dispatchEvent(new CustomEvent('submissions-changed'));
        window.dispatchEvent(new CustomEvent('quest-availability-changed', { 
          detail: { submissionId, questId: sub?.quest_id, userId: sub?.user_id } 
        }));
      } else {
        // Update status - explicitly only update status field to avoid trigger issues
        const { error } = await supabase
          .from('Submissions')
          .update({ status } as any)
          .eq('id', submissionId)
          .select('id')
          .single();
        if (error) throw error;
        
        // Send approval notification
        console.log('🎯 Checking notification conditions:', { status, hasUserId: !!sub?.user_id, sub });
        if (status === 'verified' && sub?.user_id) {
          try {
            console.log('📨 Sending approval notification to:', sub.user_id);
            console.log('🎮 Quest title:', questTitle);
            await sendNotification({
              userId: sub.user_id,
              type: 'quest_approved',
              title: 'Quest Completed! 🎉',
              message: `Your submission for "${questTitle}" has been approved! You earned points and XP.`,
              relatedId: submissionId,
              relatedType: 'submission',
            });
            console.log('✅ Approval notification sent successfully');
          } catch (notifError) {
            console.error('❌ Failed to send approval notification:', notifError);
            // Don't throw - notification failure shouldn't block status update
          }
        } else {
          console.log('⚠️ Skipping notification - conditions not met', { 
            status, 
            hasUserId: !!sub?.user_id, 
            userId: sub?.user_id 
          });
        }
        
        toast({ title: 'Success', description: 'Submission status updated' });
      }
      await fetchData();
      // Broadcast events so pages can refresh (for non-rejected status changes)
      if (status !== 'rejected') {
        window.dispatchEvent(new CustomEvent('submissions-changed'));
      }
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
      const deleteRes = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteRes.error) throw deleteRes.error;

      // Then add the new role (only if not 'user' since 'user' is default)
      if (newRole !== 'user') {
        const insertRes = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole });

        if (insertRes.error) throw insertRes.error;
      }

      // Optimistically update UI
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, current_role: newRole } : u)));
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

  const deleteCommunityPost = async (postId: string) => {
    try {
      // Fetch to collect images
      const { data: post } = await supabase.from('community_posts').select('*').eq('id', postId).single();
      const keysToRemove: string[] = [];
      const collectKey = (url?: string | null) => {
        if (!url) return;
        try {
          const u = new URL(url);
          const parts = u.pathname.split('/object/public/');
          if (parts[1]) keysToRemove.push(parts[1].replace(/^community-images\//, ''));
        } catch {}
      };
      (post?.image_urls || []).forEach((u: string) => collectKey(u));

      await Promise.all([
        supabase.from('community_post_likes').delete().eq('post_id', postId),
        supabase.from('community_post_comments').delete().eq('post_id', postId)
      ]);

      const { error } = await supabase.from('community_posts').delete().eq('id', postId);
      if (error) throw error;

      if (keysToRemove.length > 0) {
        await supabase.storage.from('community-images').remove(keysToRemove);
      }

      toast({ title: 'Success', description: 'Community post deleted successfully' });
      await fetchData();
      // Inform other views to refresh (profile grid, crew feed)
      window.dispatchEvent(new CustomEvent('community-posts-changed'));
    } catch (error) {
      console.error('Error deleting community post:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete community post',
        variant: 'destructive'
      });
    }
  };

  const updatePostImageUrl = async (postId: string, newImageUrl: string) => {
    try {
      const { error } = await supabase
        .from('community_posts')
        .update({ image_urls: [newImageUrl] })
        .eq('id', postId);

      if (error) throw error;

      toast({ title: 'Success', description: 'Post image updated successfully' });
      fetchData();
    } catch (error) {
      console.error('Error updating post image:', error);
      toast({
        title: 'Error',
        description: 'Failed to update post image',
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
    <div className="min-h-screen bg-background p-3 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <Settings className="h-5 w-5 md:h-6 md:w-6" />
          <h1 className="text-2xl md:text-3xl font-bold">Admin Panel</h1>
        </div>

        <Tabs defaultValue="quests" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-8 gap-1 h-auto">
            <TabsTrigger value="quests" className="text-xs md:text-sm px-2 py-2">Quests</TabsTrigger>
            <TabsTrigger value="submissions" className="text-xs md:text-sm px-2 py-2">Submissions</TabsTrigger>
            <TabsTrigger value="posts" className="text-xs md:text-sm px-2 py-2">Posts</TabsTrigger>
            <TabsTrigger value="users" className="text-xs md:text-sm px-2 py-2">Users</TabsTrigger>
            <TabsTrigger value="challenges" className="text-xs md:text-sm px-2 py-2">Challenges</TabsTrigger>
            <TabsTrigger value="verifications" className="text-xs md:text-sm px-2 py-2">AI</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs md:text-sm px-2 py-2">Analytics</TabsTrigger>
            <TabsTrigger value="points" className="text-xs md:text-sm px-2 py-2">Points</TabsTrigger>
          </TabsList>

          <TabsContent value="quests" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base md:text-lg">Quest Management</CardTitle>
                    <CardDescription className="text-xs md:text-sm">Create and manage quests</CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2 justify-center">
                      <Flag className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs md:text-sm">Regular</span>
                      <Switch
                        checked={showAiQuests}
                        onCheckedChange={setShowAiQuests}
                        className="data-[state=checked]:bg-blue-600"
                      />
                      <span className="text-xs md:text-sm">AI Generated</span>
                      <Bot className="h-4 w-4 text-blue-600" />
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full sm:w-auto">
                          <Plus className="h-4 w-4 mr-2" />
                          Create {showAiQuests ? 'AI Quest' : 'Quest'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-base md:text-lg">Create New {showAiQuests ? 'AI Quest' : 'Quest'}</DialogTitle>
                          <DialogDescription className="text-xs md:text-sm">Add a new {showAiQuests ? 'AI-generated quest' : 'quest'} for users to complete</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input
                            placeholder="Quest title"
                            value={showAiQuests ? newAiQuest.title : newQuest.title}
                            onChange={(e) => showAiQuests 
                              ? setNewAiQuest({ ...newAiQuest, title: e.target.value })
                              : setNewQuest({ ...newQuest, title: e.target.value })
                            }
                          />
                          <Textarea
                            placeholder="Quest description"
                            value={showAiQuests ? newAiQuest.description : newQuest.description}
                            onChange={(e) => showAiQuests
                              ? setNewAiQuest({ ...newAiQuest, description: e.target.value })
                              : setNewQuest({ ...newQuest, description: e.target.value })
                            }
                          />
                          <Select 
                            value={showAiQuests ? (newAiQuest.quest_type || "") : (newQuest.quest_type || "")}
                            onValueChange={(value) => showAiQuests
                              ? setNewAiQuest({ ...newAiQuest, quest_type: value })
                              : setNewQuest({ ...newQuest, quest_type: value })
                            }
                          >
                            <SelectTrigger className="z-50">
                              <SelectValue placeholder="Select quest type" />
                            </SelectTrigger>
                            <SelectContent className="z-[100] bg-popover border shadow-lg">
                              <SelectItem value="photography">Photography</SelectItem>
                              <SelectItem value="nature">Nature</SelectItem>
                              <SelectItem value="history">History</SelectItem>
                              <SelectItem value="science">Science</SelectItem>
                              <SelectItem value="community">Community</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Location"
                            value={showAiQuests ? newAiQuest.location : newQuest.location}
                            onChange={(e) => showAiQuests
                              ? setNewAiQuest({ ...newAiQuest, location: e.target.value })
                              : setNewQuest({ ...newQuest, location: e.target.value })
                            }
                          />
                          {showAiQuests && (
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                placeholder="Latitude (optional)"
                                type="number"
                                step="any"
                                value={newAiQuest.latitude?.toString() || ''}
                                onChange={(e) => setNewAiQuest({ 
                                  ...newAiQuest, 
                                  latitude: e.target.value ? parseFloat(e.target.value) : null 
                                })}
                              />
                              <Input
                                placeholder="Longitude (optional)"
                                type="number"
                                step="any"
                                value={newAiQuest.longitude?.toString() || ''}
                                onChange={(e) => setNewAiQuest({ 
                                  ...newAiQuest, 
                                  longitude: e.target.value ? parseFloat(e.target.value) : null 
                                })}
                              />
                            </div>
                          )}
                          <Select 
                            value={showAiQuests ? (newAiQuest.difficulty?.toString() || "1") : (newQuest.difficulty?.toString() || "1")}
                            onValueChange={(value) => showAiQuests
                              ? setNewAiQuest({ ...newAiQuest, difficulty: parseInt(value) })
                              : setNewQuest({ ...newQuest, difficulty: parseInt(value) })
                            }
                          >
                            <SelectTrigger className="z-50">
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                            <SelectContent className="z-[100] bg-popover border shadow-lg">
                              <SelectItem value="1">1 Star</SelectItem>
                              <SelectItem value="2">2 Stars</SelectItem>
                              <SelectItem value="3">3 Stars</SelectItem>
                              <SelectItem value="4">4 Stars</SelectItem>
                              <SelectItem value="5">5 Stars</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button 
                            onClick={showAiQuests ? createAiQuest : createQuest} 
                            className="w-full"
                          >
                            Create {showAiQuests ? 'AI Quest' : 'Quest'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {showAiQuests ? (
                    aiQuests.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No AI-generated quests found</p>
                      </div>
                    ) : (
                      aiQuests.map((quest) => (
                        <div key={quest.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 md:p-4 border rounded-lg">
                          <div className="flex-1 w-full">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-semibold text-sm md:text-base">{quest.title}</h3>
                              <Sparkles className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                            </div>
                            <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{quest.description}</p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <Badge variant={quest.is_active ? 'default' : 'secondary'} className="text-xs">
                                {quest.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                              <Badge variant="outline" className="text-xs">{quest.quest_type}</Badge>
                              <span className="text-xs text-muted-foreground">Diff: {quest.difficulty}</span>
                              {quest.latitude && quest.longitude && (
                                <Badge variant="secondary" className="text-xs">GPS: {quest.latitude.toFixed(2)}, {quest.longitude.toFixed(2)}</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingAiQuest(quest)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteAiQuest(quest.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )
                  ) : (
                    quests.map((quest) => (
                      <div key={quest.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 md:p-4 border rounded-lg">
                        <div className="flex-1 w-full">
                          <h3 className="font-semibold text-sm md:text-base">{quest.title}</h3>
                          <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{quest.description}</p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant={quest.is_active ? 'default' : 'secondary'} className="text-xs">
                              {quest.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">{quest.quest_type}</Badge>
                            <span className="text-xs text-muted-foreground">Diff: {quest.difficulty}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
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
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Submission Reviews</CardTitle>
                <CardDescription className="text-xs md:text-sm">Review and approve user submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div key={submission.id} className="p-3 md:p-4 border rounded-lg">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm md:text-base">Submission {(submission.id?.slice(0, 8)) ?? 'unknown'}</h3>
                          <p className="text-xs md:text-sm text-muted-foreground">
                            Quest: {(submission.quest_id?.slice(0, 8)) ?? 'N/A'} • {submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : '—'}
                          </p>
                        </div>
                        <Badge
                          variant={
                            submission.status === 'verified' ? 'default' :
                            submission.status === 'rejected' ? 'destructive' : 'secondary'
                          }
                          className="text-xs"
                        >
                          {submission.status}
                        </Badge>
                      </div>
                      {submission.description && (() => {
                        // Remove AI quest ID metadata from description for display
                        const cleanDescriptionText = cleanDescription(submission.description);
                        return cleanDescriptionText ? (
                          <p className="text-xs md:text-sm mb-3 line-clamp-2">{cleanDescriptionText}</p>
                        ) : null;
                      })()}
                       {submission.photo_url && (
                         <div className="mb-3">
                           <img 
                             src={submission.photo_url} 
                             alt="Submission" 
                             className="w-full max-w-full sm:max-w-md h-40 sm:h-48 object-cover rounded-lg border"
                             onError={(e) => {
                               e.currentTarget.style.display = 'none';
                             }}
                           />
                         </div>
                       )}
                       <div className="flex flex-wrap items-center gap-2">
                         <Button
                           size="sm"
                           onClick={() => updateSubmissionStatus(submission.id, 'verified')}
                           disabled={submission.status === 'verified'}
                           className="text-xs"
                         >
                           Approve
                         </Button>
                         <Button
                           size="sm"
                           variant="outline"
                           onClick={() => updateSubmissionStatus(submission.id, 'rejected')}
                           disabled={submission.status === 'rejected'}
                           className="text-xs"
                         >
                           Reject
                         </Button>
                         <Button
                           size="sm"
                           variant="secondary"
                           onClick={() => updateSubmissionStatus(submission.id, 'pending')}
                           disabled={submission.status === 'pending'}
                           className="text-xs"
                         >
                           Reset
                         </Button>
                       </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="posts" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base md:text-lg">Community Posts Management</CardTitle>
                    <CardDescription className="text-xs md:text-sm">Manage community posts and fix image issues</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {communityPosts.map((post) => (
                    <div key={post.id} className="p-3 md:p-4 border rounded-lg">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm md:text-base">{post.title}</h3>
                          <p className="text-xs md:text-sm text-muted-foreground">
                            By {post.full_name} (@{post.username}) • {new Date(post.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs md:text-sm mt-2 line-clamp-2">{post.content}</p>
                          {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {post.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={post.post_type === 'quest' ? 'default' : 'secondary'}>
                            {post.post_type}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium">Current Images:</label>
                          <div className="text-sm text-muted-foreground">
                            {post.image_urls && post.image_urls.length > 0 ? (
                              <div className="space-y-1">
                                {post.image_urls.map((url, index) => (
                                  <div key={index} className="break-all">{url}</div>
                                ))}
                              </div>
                            ) : (
                              <span>No images</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Enter new image URL to fix missing images"
                            className="flex-1"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const input = e.target as HTMLInputElement;
                                if (input.value.trim()) {
                                  updatePostImageUrl(post.id, input.value.trim());
                                  input.value = '';
                                }
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={(e) => {
                              const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement;
                              if (input?.value.trim()) {
                                updatePostImageUrl(post.id, input.value.trim());
                                input.value = '';
                              }
                            }}
                          >
                            Update Image
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteCommunityPost(post.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <CreateUserWallets />
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
                    <CardTitle className="text-sm font-medium">Available Quests (User-Specific)</CardTitle>
                    <Flag className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {user ? 
                        aiQuests.filter(q => q.user_id === user.id && q.is_active).length + 
                        quests.filter(q => q.is_active).length
                        : quests.filter(q => q.is_active).length
                      }
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {quests.filter(q => q.is_active).length} regular + {user ? aiQuests.filter(q => q.user_id === user.id && q.is_active).length : 0} AI quests
                    </p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Community Posts</CardTitle>
                    <Flag className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{communityPosts.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Posts with Missing Images</CardTitle>
                    <Flag className="h-4 w-4 text-destructive" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {communityPosts.filter(post => !post.image_urls || post.image_urls.length === 0).length}
                    </div>
                  </CardContent>
                </Card>
            </div>
          </TabsContent>

          <TabsContent value="points" className="space-y-6">
            <CreditPointsButton />
            <RecalculateAllPoints />
          </TabsContent>

          <TabsContent value="challenges" className="space-y-6">
            <TeamChallengeManager />
          </TabsContent>

          <TabsContent value="verifications" className="space-y-6">
            <AIVerificationLogs />
          </TabsContent>
        </Tabs>

        {/* Edit AI Quest Dialog */}
        {editingAiQuest && (
          <Dialog open={!!editingAiQuest} onOpenChange={() => setEditingAiQuest(null)}>
            <DialogContent className="max-w-md z-[100]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  Edit AI Quest
                </DialogTitle>
                <DialogDescription>Update AI-generated quest details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Quest title"
                  value={editingAiQuest.title || ""}
                  onChange={(e) => setEditingAiQuest({ ...editingAiQuest, title: e.target.value })}
                />
                <Textarea
                  placeholder="Quest description"
                  value={editingAiQuest.description || ""}
                  onChange={(e) => setEditingAiQuest({ ...editingAiQuest, description: e.target.value })}
                />
                <Select 
                  value={editingAiQuest.quest_type || ""} 
                  onValueChange={(value) => setEditingAiQuest({ ...editingAiQuest, quest_type: value })}
                >
                  <SelectTrigger className="z-50">
                    <SelectValue placeholder="Select quest type" />
                  </SelectTrigger>
                  <SelectContent className="z-[100] bg-popover border shadow-lg">
                    <SelectItem value="photography">Photography</SelectItem>
                    <SelectItem value="nature">Nature</SelectItem>
                    <SelectItem value="history">History</SelectItem>
                    <SelectItem value="science">Science</SelectItem>
                    <SelectItem value="community">Community</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Location"
                  value={editingAiQuest.location || ""}
                  onChange={(e) => setEditingAiQuest({ ...editingAiQuest, location: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Latitude (optional)"
                    type="number"
                    step="any"
                    value={editingAiQuest.latitude?.toString() || ''}
                    onChange={(e) => setEditingAiQuest({ 
                      ...editingAiQuest, 
                      latitude: e.target.value ? parseFloat(e.target.value) : null 
                    })}
                  />
                  <Input
                    placeholder="Longitude (optional)"
                    type="number"
                    step="any"
                    value={editingAiQuest.longitude?.toString() || ''}
                    onChange={(e) => setEditingAiQuest({ 
                      ...editingAiQuest, 
                      longitude: e.target.value ? parseFloat(e.target.value) : null 
                    })}
                  />
                </div>
                <Select 
                  value={editingAiQuest.difficulty?.toString() || "1"} 
                  onValueChange={(value) => setEditingAiQuest({ ...editingAiQuest, difficulty: parseInt(value) })}
                >
                  <SelectTrigger className="z-50">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent className="z-[100] bg-popover border shadow-lg">
                    <SelectItem value="1">1 Star</SelectItem>
                    <SelectItem value="2">2 Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="4">4 Stars</SelectItem>
                    <SelectItem value="5">5 Stars</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingAiQuest.is_active}
                    onCheckedChange={(checked) => setEditingAiQuest({ ...editingAiQuest, is_active: checked })}
                  />
                  <span className="text-sm">Quest is active</span>
                </div>
                <Button onClick={updateAiQuest} className="w-full">Update AI Quest</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Quest Dialog */}
        {editingQuest && (
          <Dialog open={!!editingQuest} onOpenChange={() => setEditingQuest(null)}>
            <DialogContent className="max-w-md z-[100]">
              <DialogHeader>
                <DialogTitle>Edit Quest</DialogTitle>
                <DialogDescription>Update quest details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Quest title"
                  value={editingQuest.title || ""}
                  onChange={(e) => setEditingQuest({ ...editingQuest, title: e.target.value })}
                />
                <Textarea
                  placeholder="Quest description"
                  value={editingQuest.description || ""}
                  onChange={(e) => setEditingQuest({ ...editingQuest, description: e.target.value })}
                />
                <Select 
                  value={editingQuest.quest_type || ""} 
                  onValueChange={(value) => setEditingQuest({ ...editingQuest, quest_type: value })}
                >
                  <SelectTrigger className="z-50">
                    <SelectValue placeholder="Select quest type" />
                  </SelectTrigger>
                  <SelectContent className="z-[100] bg-popover border shadow-lg">
                    <SelectItem value="photography">Photography</SelectItem>
                    <SelectItem value="nature">Nature</SelectItem>
                    <SelectItem value="history">History</SelectItem>
                    <SelectItem value="science">Science</SelectItem>
                    <SelectItem value="community">Community</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Location"
                  value={editingQuest.location || ""}
                  onChange={(e) => setEditingQuest({ ...editingQuest, location: e.target.value })}
                />
                <Select 
                  value={editingQuest.difficulty?.toString() || "1"} 
                  onValueChange={(value) => setEditingQuest({ ...editingQuest, difficulty: parseInt(value) })}
                >
                  <SelectTrigger className="z-50">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent className="z-[100] bg-popover border shadow-lg">
                    <SelectItem value="1">1 Star</SelectItem>
                    <SelectItem value="2">2 Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="4">4 Stars</SelectItem>
                    <SelectItem value="5">5 Stars</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="quest-active"
                    checked={editingQuest.is_active || false}
                    onChange={(e) => setEditingQuest({ ...editingQuest, is_active: e.target.checked })}
                    className="rounded h-4 w-4"
                  />
                  <label htmlFor="quest-active" className="text-sm font-medium">
                    Quest is active
                  </label>
                </div>
                <Button onClick={updateQuest} className="w-full">Update Quest</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};