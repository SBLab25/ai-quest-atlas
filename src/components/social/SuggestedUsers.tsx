import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, RefreshCw, Search, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { FollowButton } from './FollowButton';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface SuggestedUser {
  user_id: string;
  username: string;
  avatar_url: string | null;
  follower_count: number;
  mutual_count: number;
}

export const SuggestedUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [searchResults, setSearchResults] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      // Search users by username (case-insensitive)
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, follower_count')
        .ilike('username', `%${query}%`)
        .limit(10);

      if (error) throw error;

      // Get current user's following list to calculate mutual connections
      let followingIds = new Set<string>();
      if (currentUser) {
        // @ts-ignore - Table will exist after running setupFollowSystem.sql
        const { data: following } = await (supabase as any)
          .from('follows')
          .select('following_id')
          .eq('follower_id', currentUser.id);
        
        if (following) {
          following.forEach((f: any) => followingIds.add(f.following_id));
        }
      }

      // Transform results to match SuggestedUser interface
      const results: SuggestedUser[] = (profiles || [])
        .filter((p: any) => p.id !== currentUser?.id) // Exclude current user
        .map((profile: any) => {
          // Calculate mutual connections
          let mutualCount = 0;
          if (currentUser && followingIds.has(profile.id)) {
            // If we're following them, check for mutuals
            // This is a simplified version - for full mutual count, we'd need to check their following list
            mutualCount = 0; // Simplified for now
          }

          return {
            user_id: profile.id,
            username: profile.username || 'Anonymous',
            avatar_url: profile.avatar_url,
            follower_count: profile.follower_count || 0,
            mutual_count: mutualCount
          };
        });

      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchUsers]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      // @ts-ignore - RPC will exist after running setupFollowSystem.sql
      const { data, error } = await supabase.rpc('get_suggested_users', {
        p_limit: 5
      });

      if (error) throw error;
      setUsers((data as any) || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayUsers = searchQuery.trim() ? searchResults : users;
  const isSearchMode = searchQuery.trim().length > 0;

  if (loading && !isSearchMode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Who to Follow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {isSearchMode ? 'Search Users' : 'Who to Follow'}
        </CardTitle>
        {!isSearchMode && (
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchSuggestions}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Loading State for Search */}
        {searchLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Search Results or Suggested Users */}
        {!searchLoading && (
          <>
            {displayUsers.length > 0 ? (
              <div className="space-y-4">
                {displayUsers.map((user) => (
                  <div key={user.user_id} className="flex items-center justify-between">
                    <Link 
                      to={`/profile/${user.user_id}`}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>{user.username?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user.username}</p>
                        <p className="text-sm text-muted-foreground">
                          {user.follower_count} {user.follower_count === 1 ? 'follower' : 'followers'}
                          {user.mutual_count > 0 && ` • ${user.mutual_count} mutual`}
                        </p>
                      </div>
                    </Link>
                    <FollowButton userId={user.user_id} size="sm" variant="outline" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  {isSearchMode 
                    ? searchQuery.trim() 
                      ? 'No users found' 
                      : 'Start typing to search for users'
                    : 'No suggestions available'}
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
