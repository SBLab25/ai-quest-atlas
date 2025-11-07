# Notification System Setup

## Features

✅ **Real-time Notifications** - Instant updates using Supabase Realtime  
✅ **Browser Push Notifications** - Native browser notifications with permission management  
✅ **Notification Sounds** - Audio alerts for new notifications (toggleable)  
✅ **Automatic Triggers** - Notifications sent automatically for:
  - Quest approvals and rejections
  - Badge earnings
  - Comments and likes (ready to integrate)
  - Team invitations (ready to integrate)

✅ **User Preferences** - Customize notification settings  
✅ **Notification Center** - View, filter, and manage all notifications  
✅ **Mobile-Responsive** - Works perfectly on all devices  
✅ **Secure** - Protected with RLS policies

## Setup Instructions

### 1. Run the Database Migration

1. Go to your Supabase Dashboard
2. Navigate to the **SQL Editor**
3. Copy and paste the contents of `DATABASE_NOTIFICATIONS_SETUP.sql`
4. Click **Run** to execute the SQL

This will create:
- `notifications` table with all necessary columns
- `notification_preferences` table for user settings
- RLS policies for security
- Realtime subscriptions
- Automatic preference creation for new users

### 2. Wait for Types to Regenerate

After running the SQL, Lovable will automatically regenerate the TypeScript types for the new tables. This may take a minute.

### 3. Test the System

The notification system is now fully integrated!

## Components

#### NotificationCenter Component
Located in the top navbar, it provides:
- Real-time notification updates
- Badge counter showing unread count
- Filter by type (All, Unread, Quests, Social)
- Mark as read/delete functionality
- Click to navigate to related content
- **Sound notification** when new notifications arrive
- **Browser push notifications** (when enabled)

#### Notification Preferences
Access via Settings → Notifications to control:

**Notification Channels:**
- 📧 Email notifications
- 🔔 Push notifications (browser push with permission request)
- 🔊 Notification sounds (audio alerts)

**Notification Categories:**
- Quest updates (approvals, rejections, badges, challenges)
- Social interactions (comments, likes)
- Team activities (invites, challenges)

#### Edge Function
- `send-notification` function deployed automatically
- Checks user preferences before sending
- Handles all notification types
- Triggers real-time updates

## Automatic Notification Triggers

The system now automatically sends notifications for:

### ✅ Quest Submissions
- **Approved** → User receives "Quest Completed! 🎉" notification
- **Rejected** → User receives rejection notification with details

### ✅ Badge Earnings
- When a badge is earned → User receives "New Badge Earned! 🏆" notification

### 🔜 Ready to Integrate
- **Comments** → Post author receives notification
- **Likes** → Post author receives notification
- **Team Invites** → Invited user receives notification
- **Daily Challenges** → All users receive reset notification

## How It Works

1. **Event occurs** (e.g., admin approves quest)
2. **Helper function called** (`sendNotification()`)
3. **Edge function invoked** (checks user preferences)
4. **Notification created** in database
5. **Real-time update** triggers on client
6. **Sound plays** (if enabled)
7. **Browser notification** shows (if enabled)
8. **Badge counter updates** in UI

## Notification Types

- `quest_approved` - When a quest submission is approved
- `quest_rejected` - When a quest submission is rejected
- `badge_earned` - When a user earns a new badge
- `comment_received` - When someone comments on your content
- `like_received` - When someone likes your content
- `team_invite` - When invited to join a team
- `challenge_completed` - When a challenge is completed
- `daily_challenge_reset` - Daily challenge reminder

## Sending Notifications (For Developers)

### Using the Helper Function (Recommended)

```typescript
import { sendNotification } from '@/utils/notificationHelper';

await sendNotification({
  userId: 'user-uuid',
  type: 'quest_approved',
  title: 'Quest Completed! 🎉',
  message: 'Your submission has been approved! You earned points and XP.',
  relatedId: 'quest-uuid',
  relatedType: 'quest'
});
```

This helper automatically:
- Calls the edge function
- Plays notification sound
- Shows browser push notification
- Respects user preferences

### Directly Calling the Edge Function

```typescript
await supabase.functions.invoke('send-notification', {
  body: {
    user_id: 'user-uuid',
    type: 'quest_approved',
    title: 'Quest Approved!',
    message: 'Your quest submission has been approved.',
    related_id: 'quest-uuid',
    related_type: 'quest'
  }
});
```

## Browser Push Notifications

### How to Enable
1. Go to Settings → Notifications
2. Toggle "Push notifications"
3. Allow browser permission when prompted

### Features
- Native browser notifications
- Works even when tab is in background
- Customizable icon and badge
- Respects user preferences

### Browser Support
- ✅ Chrome, Edge, Firefox
- ✅ Safari (macOS 16.4+)
- ✅ Mobile browsers (with limitations)

## Notification Sounds

### Audio Alerts
- Plays a subtle notification sound
- Volume: 30% (non-intrusive)
- Can be toggled in Settings

### Toggle Sound
Go to Settings → Notifications → Notification sound

## Testing the System

### Test Quest Notifications
1. Submit a quest as a regular user
2. Log in as admin
3. Go to Admin Panel → Submissions
4. Approve or reject the submission
5. Check the notification bell icon

### Test Badge Notifications
1. Complete activities to earn badges
2. Notification appears automatically
3. Sound plays (if enabled)
4. Browser notification shows (if enabled)

## Troubleshooting

### Notifications Not Appearing?
1. ✓ Check that SQL has been run in Supabase
2. ✓ Verify `send-notification` edge function is deployed
3. ✓ Check browser console for errors
4. ✓ Ensure realtime is enabled on notifications table

### Sound Not Playing?
1. ✓ Check browser autoplay policies
2. ✓ Verify sound toggle in Settings is enabled
3. ✓ Try user gesture (click) before expecting sound
4. ✓ Check browser console for audio errors

### Push Notifications Not Working?
1. ✓ Check browser notification permissions
2. ✓ Verify push toggle in Settings is enabled
3. ✓ Grant permission when browser prompts
4. ✓ Check if browser supports Notification API

### TypeScript Errors?
If you see TypeScript errors after running the SQL:
1. Wait 1-2 minutes for Supabase to regenerate types
2. Refresh the Lovable editor
3. Types should automatically update

## Next Steps

### Adding More Triggers

To add notifications for comments, likes, or other events:

1. Find where the event occurs in your code
2. Import and call `sendNotification()`:

```typescript
import { sendNotification } from '@/utils/notificationHelper';

// When creating a comment
await sendNotification({
  userId: postAuthorId,
  type: 'comment_received',
  title: 'New Comment',
  message: `${commenterName} commented on your post`,
  relatedId: postId,
  relatedType: 'post'
});
```

### Email Notifications

To implement email notifications:
1. Set up a Resend account
2. Create an edge function that sends emails
3. Call it when creating notifications
4. Respect user's email_notifications preference

## Summary

✅ Real-time notifications with sound and push support  
✅ Automatic triggers for quests and badges  
✅ User preferences and customization  
✅ Mobile-responsive notification center  
✅ Secure with RLS policies  
✅ Ready to extend with more triggers
