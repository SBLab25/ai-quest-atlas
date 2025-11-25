# Power-Up System Setup Guide

## Overview
The power-up system provides temporary boosts and advantages to users. This guide covers setup and usage.

## Database Setup

### 1. Run the Power-Up Purchase Function

Execute `src/utils/setupPowerUpPurchase.sql` in your Supabase SQL Editor to:
- Create the `purchase_powerup()` RPC function
- Add the `total_points` column to profiles (if not exists)
- Seed default power-ups

### 2. Set Up Cron Jobs for Power-Up Expiration

The `expire-powerups` edge function runs hourly to deactivate expired power-ups.

**Enable pg_cron and pg_net extensions:**
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
```

**Schedule the cron job:**
```sql
SELECT cron.schedule(
  'expire-powerups-hourly',
  '0 * * * *', -- Every hour
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/expire-powerups',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
```

**Verify cron job:**
```sql
SELECT * FROM cron.job;
```

## Power-Up Types

### 1. **Double XP Boost** (Rare)
- Duration: 24 hours
- Effect: 2x XP on all quest completions
- Cost: 200 points
- Cooldown: 48 hours

### 2. **Instant Verify** (Epic)
- Duration: Single use
- Effect: One quest auto-verified immediately
- Cost: 150 points
- Limit: 1 per day

### 3. **Point Multiplier** (Legendary)
- Duration: 12 hours
- Effect: 3x points on all activities
- Cost: 500 points
- Cooldown: 7 days

### 4. **Streak Freeze** (Common)
- Duration: 24 hours
- Effect: Protect your streak for 1 missed day
- Cost: 50 points
- Auto-activates when streak at risk

### 5. **Location Hint** (Common)
- Duration: Single use
- Effect: Reveals 3 nearby uncompleted quests on map
- Cost: 30 points

### 6. **Lucky Charm** (Rare)
- Duration: 6 hours
- Effect: 50% higher chance of rare badge drops
- Cost: 100 points

### 7. **Quest Radar** (Rare)
- Duration: 2 hours
- Effect: Shows all quests within 5km radius on map
- Cost: 80 points

## Usage in Code

### Activate a Power-Up
```typescript
import { useGamification } from '@/hooks/useGamification';

const { activatePowerUp } = useGamification();

// Activate power-up
const success = await activatePowerUp(userPowerUpId);
```

### Get Active Power-Ups
```typescript
const { getActivePowerUps } = useGamification();
const activePowerUps = getActivePowerUps();
```

### Get Multipliers
```typescript
const { getXPMultiplier, getPointsMultiplier } = useGamification();

const xpMultiplier = getXPMultiplier();
const pointsMultiplier = getPointsMultiplier();
```

### Apply Multipliers
```typescript
// When awarding XP
const baseXP = 50;
const multipliedXP = baseXP * getXPMultiplier();

// When awarding points
const basePoints = 100;
const multipliedPoints = basePoints * getPointsMultiplier();
```

## UI Components

### PowerUpInventory
Shows user's owned power-ups with activation controls.

```tsx
import { PowerUpInventory } from '@/components/gamification/PowerUpInventory';

<PowerUpInventory />
```

### PowerUpShop
Browse and purchase power-ups using earned points.

```tsx
import { PowerUpShop } from '@/components/gamification/PowerUpShop';

<PowerUpShop />
```

### ActivePowerUpBar
Displays active power-ups at the top of the screen.

```tsx
import { ActivePowerUpBar } from '@/components/gamification/ActivePowerUpBar';

<ActivePowerUpBar />
```

## Power-Up Awarding

The `award-powerup` edge function handles automatic power-up drops based on:
- Quest difficulty (different drop rates)
- Achievement unlocks
- Daily login rewards

**Drop Rates:**
- Easy quests: 5% (Common only)
- Medium quests: 15% (70% Common, 30% Rare)
- Hard quests: 30% (40% Common, 50% Rare, 10% Epic)
- Epic quests: 60% (50% Rare, 40% Epic, 10% Legendary)

**Call from quest completion:**
```typescript
await supabase.functions.invoke('award-powerup', {
  body: {
    userId: user.id,
    questDifficulty: 'hard',
    reason: 'quest_completion'
  }
});
```

## Stacking Rules
- Same power-up type: Effects don't stack (must wait for expiration)
- Different types: Can be active simultaneously
- Maximum: 3 active power-ups at once

## Security
- Server-side validation of power-up ownership
- Server-side verification of all effects
- Rate limiting on purchases (max 10 per day)
- Cooldown periods prevent abuse

## Troubleshooting

### Power-ups not expiring
- Check that the cron job is scheduled correctly
- Verify edge function is deployed
- Check Supabase function logs

### Purchase not working
- Ensure `purchase_powerup` RPC function is created
- Verify user has sufficient points
- Check RLS policies on user_powerups table

### Multipliers not applying
- Ensure power-up is activated (`is_active = true`)
- Check expiration time hasn't passed
- Verify effect_type matches your check

## Future Enhancements
- Admin panel for custom power-ups
- Power-up trading between users
- Time-limited special power-ups
- Power-up crafting system
- Power-up achievements
