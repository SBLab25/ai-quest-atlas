# Follow/Unfollow System Setup Guide

## Overview
A comprehensive social follow system with follower feeds, suggestions, and mutual connections.

## Database Setup

### 1. Run the Follow System Migration

Execute `src/utils/setupFollowSystem.sql` in your Supabase SQL Editor to:
- Create `follows` and `follow_requests` tables
- Add follower/following counts to profiles
- Set up RLS policies
- Create helper RPC functions

This will enable:
- Following/unfollowing users
- Private profile support with follow requests
- Follower/following lists
- Suggested users to follow

## Features Implemented

### 1. **FollowButton Component**
Location: `src/components/social/FollowButton.tsx`

Dynamic button that shows:
- "Follow" - When not following
- "Following" - When following (hover shows "Unfollow")
- "Requested" - When follow request is pending (private profiles)

```tsx
import { FollowButton } from '@/components/social/FollowButton';

<FollowButton 
  userId={targetUserId} 
  size="default"
  variant="default"
  showCounts={true}
/>
```

### 2. **FollowersModal Component**
Location: `src/components/social/FollowersModal.tsx`

Modal showing:
- Tabbed interface (Followers/Following)
- Search functionality
- Mutual follow badges
- Quick follow buttons for each user

```tsx
import { FollowersModal } from '@/components/social/FollowersModal';

<FollowersModal
  userId={profileUserId}
  open={showModal}
  onOpenChange={setShowModal}
  defaultTab="followers"
/>
```

### 3. **SuggestedUsers Component**
Location: `src/components/social/SuggestedUsers.tsx`

Shows 5 suggested users based on:
- High follower count (popular users)
- Mutual connections
- Random selection for variety

```tsx
import { SuggestedUsers } from '@/components/social/SuggestedUsers';

<SuggestedUsers />
```

### 4. **useFollow Hook**
Location: `src/hooks/useFollow.tsx`

Custom hook for managing follow state:

```tsx
import { useFollow } from '@/hooks/useFollow';

const { 
  isFollowing,
  isPending,
  loading,
  followerCount,
  followingCount,
  toggleFollow,
  refetch 
} = useFollow(targetUserId);
```

## RPC Functions

### toggle_follow(p_target_user_id UUID)
Handles follow/unfollow logic:
- Creates follow relationship for public profiles
- Creates follow request for private profiles
- Updates follower/following counts automatically
- Prevents self-following

Returns:
```json
{
  "success": true,
  "action": "followed" | "unfollowed" | "requested"
}
```

### get_suggested_users(p_limit INTEGER)
Returns suggested users to follow based on:
- Users not currently followed
- Ordered by follower count and mutual connections
- Random element for variety

### get_followers(p_user_id UUID, p_limit INTEGER, p_offset INTEGER)
Returns paginated list of followers with:
- User profile information
- Mutual follow status
- Follow timestamp

### get_following(p_user_id UUID, p_limit INTEGER, p_offset INTEGER)
Returns paginated list of users being followed with:
- User profile information
- Mutual follow status
- Follow timestamp

## Integration Points

### UserProfile Page
The system integrates with the UserProfile page to show:
- Follow/Unfollow button
- Follower and following counts (clickable to open modal)
- Mutual connections indicator

### Community Feed
Can be enhanced to:
- Show posts from followed users first
- Filter by "Following" vs "All"
- Display "X users you follow also follow this person"

### Notifications
Create notifications for:
- New followers
- Accepted follow requests
- Milestones (100 followers, etc.)

## Privacy Features

### Private Profiles
Users can set their profile to private in settings:
```sql
UPDATE profiles 
SET is_private = true 
WHERE id = auth.uid();
```

When a profile is private:
- Follow button shows "Follow" → "Requested"
- Creates entry in `follow_requests` table
- User must approve/reject request
- Follower count only updates after approval

## UI/UX Features

### Optimistic Updates
The FollowButton uses optimistic UI updates:
- Immediately shows new state when clicked
- Updates counts instantly
- Rolls back if API call fails

### Hover States
- "Following" button shows "Unfollow" on hover with red styling
- Smooth transitions between states
- Loading states during API calls

### Mutual Follow Badges
- Shows "Mutual" badge in follower/following lists
- Sorts mutual follows to the top
- Helps identify close connections

## Analytics Possibilities

Track social engagement:
```sql
-- Most followed users
SELECT username, follower_count
FROM profiles
ORDER BY follower_count DESC
LIMIT 10;

-- Users with highest follow ratio
SELECT username, follower_count, following_count,
  CASE WHEN following_count > 0 
    THEN follower_count::float / following_count 
    ELSE follower_count 
  END as follow_ratio
FROM profiles
WHERE follower_count > 10
ORDER BY follow_ratio DESC;

-- Mutual connection strength
SELECT COUNT(*) as mutual_follows
FROM follows f1
JOIN follows f2 ON f1.follower_id = f2.following_id 
  AND f1.following_id = f2.follower_id;
```

## Security Features

### Rate Limiting
Consider adding rate limits to prevent spam:
- Max 50 follow actions per hour
- Max 1000 total follows per account
- Cooldown after mass unfollowing

### Prevention of Abuse
- Cannot follow yourself (CHECK constraint)
- Unique constraint prevents duplicate follows
- Cascade deletes when user is deleted

## Future Enhancements

1. **Close Friends List**
   - Subset of followers for private content
   - Stories/posts visible only to close friends

2. **Follower Requests Management**
   - Page to view pending follow requests
   - Batch approve/reject
   - View who you've requested to follow

3. **Following Feed**
   - Dedicated feed of posts from followed users
   - Chronological or algorithmic sorting
   - Filter by user or content type

4. **Follow Recommendations**
   - ML-based suggestions
   - "Followed by your connections"
   - Interest-based recommendations

5. **Social Graph Analytics**
   - Network visualization
   - Follower growth charts
   - Engagement metrics per follower

6. **Block/Mute Features**
   - Block users (prevents following)
   - Mute users (still following but don't see posts)
   - Remove followers (soft block)

## Troubleshooting

### Counts not updating
- Check RLS policies are enabled
- Verify function has SECURITY DEFINER
- Ensure profiles table has follower_count columns

### Follow button not working
- Verify user is authenticated
- Check browser console for errors
- Ensure RPC functions are created

### Private profiles not working
- Verify is_private column exists on profiles
- Check follow_requests table is created
- Ensure RLS policies allow creating requests

## Testing Checklist

- [ ] Can follow a user
- [ ] Can unfollow a user
- [ ] Follower counts update correctly
- [ ] Following counts update correctly
- [ ] Private profile creates follow request
- [ ] Cannot follow yourself
- [ ] Mutual follow badge shows correctly
- [ ] Suggested users appear
- [ ] Search in followers/following works
- [ ] Clicking counts opens modal
- [ ] Optimistic updates work
- [ ] Error states handled gracefully
