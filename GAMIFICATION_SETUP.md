# 🎮 Enhanced Gamification System Setup Guide

## Overview
This guide will help you set up the complete Enhanced Gamification System for Discovery Atlas, including achievements, challenges, events, power-ups, and XP progression.

## Step 1: Run Database Migration

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `src/utils/setupGamification.sql`
4. Copy all the SQL code
5. Paste it into the SQL Editor
6. Click **Run** to execute the migration

This will create all necessary tables:
- `achievements` - Achievement definitions
- `user_achievements` - User's unlocked achievements
- `challenges` - Daily/weekly challenges
- `user_challenges` - User's challenge progress
- `events` - Seasonal events
- `event_quests` - Event-specific quests
- `powerups` - Power-up definitions
- `user_powerups` - User's power-up inventory
- `xp_logs` - XP transaction history

It will also:
- Add `xp` and `level` columns to profiles
- Add `difficulty_level`, `xp_reward`, `is_limited_time`, and `expires_at` to Quests table
- Set up all RLS policies
- Create helper functions
- Insert seed data (achievements, power-ups, initial challenges)

## Step 2: Set Up Scheduled Functions (Optional)

To automate challenge resets and power-up expiry, set up cron jobs:

### Enable Extensions
```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### Daily Challenge Reset (runs at midnight UTC)
```sql
SELECT cron.schedule(
  'reset-daily-challenges',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url:='https://afglpoufxxgdxylvgeex.supabase.co/functions/v1/reset-daily-challenges',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  ) as request_id;
  $$
);
```

### Power-Up Expiry (runs every hour)
```sql
SELECT cron.schedule(
  'expire-powerups',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url:='https://afglpoufxxgdxylvgeex.supabase.co/functions/v1/expire-powerups',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  ) as request_id;
  $$
);
```

Replace `YOUR_ANON_KEY` with your actual Supabase anon key.

## Step 3: Add Gamification Tab to Home Page

The Gamification Dashboard is ready to be added to your Home page. Here's how:

```typescript
import { GamificationDashboard } from '@/components/gamification/GamificationDashboard';

// In your Home component, add a new tab:
<TabsContent value="gamification">
  <GamificationDashboard />
</TabsContent>
```

## Features Included

### 1. Achievement System
- **9 pre-loaded achievements** across 4 categories:
  - 🗺️ Exploration (visit locations)
  - 🔥 Consistency (maintain streaks)
  - 🎨 Creativity (upload verified photos)
  - 👥 Social (gain followers)
- **4 rarity tiers**: Common, Rare, Epic, Legendary
- **XP rewards** for each achievement
- **Auto-checking** via `check-achievements` edge function
- **Visual notifications** when unlocked

### 2. Daily & Weekly Challenges
- **Rotating challenges** that reset automatically
- **Progress tracking** with real-time updates
- **Reward system**: points + XP
- **Countdown timers** showing time remaining
- **Visual indicators** for completion status

### 3. XP & Level System
- **XP accumulation** from quests, challenges, and achievements
- **Automatic level calculation** (every 100 XP = 1 level)
- **XP transaction logging** for transparency
- **Level-up animations** with confetti effects
- **Progress bars** showing advancement

### 4. Power-Ups & Boosters
- **4 types of power-ups**:
  - ⚡ Double XP Boost (2x XP for 24h)
  - ✓ Instant Verify (skip AI verification)
  - 🏆 Bonus Badge (random badge on completion)
  - 💎 Triple Points (3x points for 12h)
- **Inventory management**
- **Activation system** with expiry timers
- **Visual aura effects** when active

### 5. Seasonal Events
- **Limited-time themed events**
- **Special event quests**
- **Event rewards** (NFTs, tokens, power-ups)
- **Event banners** with countdowns
- **Themed UI** during active events

### 6. Quest Difficulty System
- **4 difficulty tiers**:
  - 🟢 Easy (10 XP)
  - 🟡 Medium (25 XP)
  - 🔴 Hard (50 XP)
  - 🟣 Epic (100 XP + special NFT)
- **Adaptive recommendations** based on user level
- **Color-coded indicators** on quest cards

## Usage Examples

### Check for New Achievements
```typescript
import { useGamification } from '@/hooks/useGamification';

const { checkAchievements } = useGamification();

// After quest completion:
const newAchievements = await checkAchievements();
if (newAchievements.length > 0) {
  // Show achievement notification
}
```

### Update Challenge Progress
```typescript
const { updateChallengeProgress } = useGamification();

// When user completes a quest:
await updateChallengeProgress(challengeId, newProgress);
```

### Activate a Power-Up
```typescript
const { activatePowerUp } = useGamification();

await activatePowerUp(userPowerUpId);
```

### Get Active Multipliers
```typescript
const { getXPMultiplier, getPointsMultiplier } = useGamification();

const xpMultiplier = getXPMultiplier(); // 1 or 2 (if Double XP active)
const pointsMultiplier = getPointsMultiplier(); // 1 or 3 (if Triple Points active)

// Apply when awarding rewards:
const finalXP = baseXP * xpMultiplier;
```

## Integration with Existing Features

### Quest Completion
When a quest is submitted and verified:
1. Award XP based on difficulty
2. Check for new achievements
3. Update challenge progress
4. Apply active power-up multipliers

### Leaderboard
The existing leaderboard can be enhanced to show:
- User levels alongside points
- Achievement counts
- Active power-ups (visual indicators)

### Profile
Add a "Trophy Room" tab to show:
- All unlocked achievements
- Achievement progress
- XP history
- Power-up inventory

## Customization

### Adding New Achievements
```sql
INSERT INTO achievements (title, description, category, rarity, xp_reward, requirement_type, requirement_value)
VALUES ('World Explorer', 'Visit 100 different locations', 'exploration', 'legendary', 500, 'locations_visited', 100);
```

### Creating Custom Challenges
```sql
INSERT INTO challenges (type, title, description, start_date, end_date, reward_points, reward_xp, requirement_type, requirement_value)
VALUES ('weekly', 'Photography Master', 'Get 10 AI-verified photos this week', NOW(), NOW() + INTERVAL '7 days', 300, 150, 'verified_photos', 10);
```

### Adding New Power-Ups
```sql
INSERT INTO powerups (name, description, duration_hours, effect_type, multiplier, rarity)
VALUES ('Mega Boost', 'Earn 5x points for 6 hours', 6, 'point_multiplier', 5.0, 'legendary');
```

## Notifications

The system includes visual notifications for:
- ✨ Achievement unlocked
- ⭐ Level up
- ⚡ Power-up activated
- 🎯 Challenge completed

These use the existing toast system and Framer Motion animations.

## TypeScript Errors

**Note**: You may see TypeScript errors in `useGamification.tsx` until the database migration is run. This is because the new tables don't exist in the Supabase types yet. The errors will automatically resolve once:
1. You run the SQL migration
2. Supabase regenerates the types

## Testing

1. Complete a quest → Check if achievement unlocked
2. Activate a power-up → Verify multiplier applied
3. Complete daily challenge → Verify rewards granted
4. Level up → See animation
5. Create a seasonal event → Check banner displays

## Troubleshooting

### Achievements Not Unlocking
- Check if `check-achievements` function ran successfully
- Verify user stats meet achievement requirements
- Check console logs for errors

### Challenges Not Resetting
- Verify cron job is configured correctly
- Check `reset-daily-challenges` function logs
- Manually trigger the function for testing

### Power-Ups Not Expiring
- Verify cron job is running
- Check `expire-powerups` function logs
- Manually trigger expiry for testing

## Support

For issues or questions:
- Check console logs for detailed error messages
- Review Supabase function logs
- Verify RLS policies are set correctly
- Ensure all migrations ran successfully

## Future Enhancements

Consider adding:
- **Leaderboards per category** (XP, achievements, challenges)
- **Achievement sharing** on social media
- **Power-up marketplace** (buy/trade with points)
- **Team challenges** with crew-based rewards
- **Seasonal leaderboards** with special prizes
- **Achievement NFTs** on blockchain
- **Custom user badges** creation tools

Enjoy your enhanced gamification system! 🎮🏆
