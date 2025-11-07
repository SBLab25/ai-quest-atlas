import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { FollowButton } from './FollowButton';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

interface FollowersModalProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: 'followers' | 'following';
}

interface UserItem {
  user_id: string;
  username: string;
  avatar_url: string | null;
  is_mutual: boolean;
  followed_at: string;
}

export const FollowersModal = ({ 
  userId, 
  open, 
  onOpenChange,
  defaultTab = 'followers'
}: FollowersModalProps) => {
  const { user } = useAuth();
  const [followers, setFollowers] = useState<UserItem[]>([]);
  const [following, setFollowing] = useState<UserItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchFollowers();
      fetchFollowing();
    }
  }, [open, userId]);

  const fetchFollowers = async () => {
    setLoading(true);
    try {
      // @ts-ignore - RPC will exist after running setupFollowSystem.sql
      const { data, error } = await supabase.rpc('get_followers', {
        p_user_id: userId,
        p_limit: 50,
        p_offset: 0
      });

      if (error) throw error;
      setFollowers((data as any) || []);
    } catch (error) {
      console.error('Error fetching followers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowing = async () => {
    setLoading(true);
    try {
      // @ts-ignore - RPC will exist after running setupFollowSystem.sql
      const { data, error } = await supabase.rpc('get_following', {
        p_user_id: userId,
        p_limit: 50,
        p_offset: 0
      });

      if (error) throw error;
      setFollowing((data as any) || []);
    } catch (error) {
      console.error('Error fetching following:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = (users: UserItem[]) => {
    if (!searchQuery) return users;
    return users.filter(u => 
      u.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const UserList = ({ users }: { users: UserItem[] }) => {
    const filteredUsers = filterUsers(users);

    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (filteredUsers.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>{searchQuery ? 'No users found' : 'No users yet'}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {filteredUsers.map((item) => (
          <div key={item.user_id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
            <Link 
              to={`/profile/${item.user_id}`}
              className="flex items-center gap-3 flex-1 min-w-0"
              onClick={() => onOpenChange(false)}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={item.avatar_url || undefined} />
                <AvatarFallback>{item.username?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{item.username}</p>
                  {item.is_mutual && (
                    <Badge variant="secondary" className="text-xs">
                      Mutual
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(item.followed_at).toLocaleDateString()}
                </p>
              </div>
            </Link>
            {user?.id !== item.user_id && (
              <FollowButton userId={item.user_id} size="sm" />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Connections</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs defaultValue={defaultTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="followers">
              Followers ({followers.length})
            </TabsTrigger>
            <TabsTrigger value="following">
              Following ({following.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="followers" className="flex-1 overflow-y-auto mt-4">
            <UserList users={followers} />
          </TabsContent>
          
          <TabsContent value="following" className="flex-1 overflow-y-auto mt-4">
            <UserList users={following} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
