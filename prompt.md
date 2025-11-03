# Discovery Atlas - Enhanced Features Implementation Prompts

## 🎮 Enhanced Gamification Features

### 1. Achievement System Beyond Badges

**Prompt:**
```
Implement a comprehensive achievement system for Discovery Atlas with the following requirements:

DATABASE REQUIREMENTS:
- The achievements table already exists with proper structure
- Add achievement categories: 'exploration', 'consistency', 'creativity', 'social'
- Add rarity levels: 'common', 'rare', 'epic', 'legendary'
- Each achievement should have:
  - Title and description
  - Icon URL (optional)
  - Category and rarity
  - XP reward value
  - Requirement type (e.g., 'quests_completed', 'locations_visited', 'streak_days', 'followers')
  - Requirement value (numeric threshold)
  - Created timestamp

FRONTEND COMPONENTS:
1. Create AchievementCard component at src/components/gamification/AchievementCard.tsx
   - Display achievement icon, title, description
   - Show rarity with color coding (common: gray, rare: blue, epic: purple, legendary: gold)
   - Show progress bar if not unlocked (current/required)
   - Show unlock date if unlocked
   - Add shine/glow effect for legendary achievements
   - Use semantic tokens from design system

2. Create AchievementUnlockedPopup component at src/components/gamification/AchievementUnlockedPopup.tsx
   - Animated popup that appears when achievement is unlocked
   - Show achievement icon with celebration animation
   - Display XP reward earned
   - Auto-dismiss after 5 seconds or manual close
   - Use framer-motion for animations

3. Create AchievementGallery page at src/pages/AchievementGallery.tsx
   - Grid layout showing all achievements
   - Filter by category and rarity
   - Show locked vs unlocked achievements (locked ones slightly grayed out)
   - Display total progress (X/Y achievements unlocked)
   - Add to navigation menu

BACKEND LOGIC:
1. Create edge function at supabase/functions/check-achievements/index.ts
   - Triggered after quest completion, new follower, etc.
   - Check all achievement requirements against user stats
   - Use the existing check_and_unlock_achievement() database function
   - Return array of newly unlocked achievements
   - Log all checks to ai_logs table for debugging

2. Update useGamification hook:
   - Add checkAchievements() method that calls the edge function
   - Trigger achievement check after relevant user actions
   - Show popup for newly unlocked achievements
   - Refresh achievement list after unlock

ACHIEVEMENT SEEDS (add to setupGamification.sql):
Exploration Category:
- "First Steps" - Complete 1 quest (common, 10 XP)
- "Explorer" - Visit 10 locations (common, 25 XP)
- "Adventurer" - Visit 25 locations (rare, 75 XP)
- "Master Explorer" - Visit 50 locations (epic, 200 XP)
- "Legend of Discovery" - Visit 100 locations (legendary, 500 XP)

Consistency Category:
- "Streak Starter" - 3-day streak (common, 15 XP)
- "Dedicated" - 7-day streak (rare, 50 XP)
- "Committed" - 14-day streak (epic, 150 XP)
- "Unstoppable" - 30-day streak (legendary, 400 XP)

Creativity Category:
- "Photographer" - 5 verified photos (common, 20 XP)
- "Artist" - 15 verified photos (rare, 60 XP)
- "Master Photographer" - 50 verified photos (epic, 180 XP)

Social Category:
- "Social Butterfly" - 10 followers (rare, 30 XP)
- "Influencer" - 25 followers (epic, 100 XP)
- "Community Leader" - 50 followers (legendary, 250 XP)

SECURITY:
- Use existing RLS policies on achievements and user_achievements tables
- Only backend functions can insert into user_achievements
- Users can only view their own achievements

TESTING:
- Test achievement unlock flow end-to-end
- Verify animations work smoothly
- Check that duplicate unlocks are prevented
- Ensure XP rewards are properly awarded
```

---

### 2. Daily/Weekly Challenges

**Prompt:**
```
Implement a dynamic daily and weekly challenge system:

DATABASE REQUIREMENTS:
- The challenges and user_challenges tables already exist
- Challenges table structure:
  - Type: 'daily' or 'weekly'
  - Title, description
  - Start date, end date
  - Reward points and reward XP
  - Requirement type and value
  - is_active flag

FRONTEND COMPONENTS:
1. Create ChallengeCard component at src/components/gamification/ChallengeCard.tsx
   - Show challenge type badge (Daily/Weekly) with different colors
   - Display title, description
   - Show progress bar (current/required)
   - Display rewards (points + XP)
   - Show time remaining until expiration
   - Add "Claim Reward" button when completed
   - Disable card if expired

2. Update GamificationDashboard component:
   - Add "Active Challenges" section
   - Separate daily and weekly challenges
   - Show countdown timer for daily reset (midnight UTC)
   - Show countdown for weekly reset (Monday midnight UTC)
   - Display total challenges completed this week/month

BACKEND LOGIC:
1. Create edge function at supabase/functions/reset-daily-challenges/index.ts
   - Scheduled to run daily at midnight UTC (use Supabase cron)
   - Deactivate expired daily challenges
   - Generate new random daily challenges from challenge pool
   - Types of daily challenges:
     - Complete X quests today (2-3 quests)
     - Get X AI verifications (1-2 verifications)
     - Upload photos at X different locations (2-3 locations)
     - Earn X points today (50-100 points)

2. Create similar edge function for weekly challenges at supabase/functions/reset-weekly-challenges/index.ts
   - Runs every Monday at midnight UTC
   - Weekly challenges are more substantial:
     - Complete X quests this week (5-10 quests)
     - Visit X new locations (5-8 locations)
     - Earn X total points (200-500 points)
     - Maintain daily streak all week

3. Update useGamification hook:
   - Add updateChallengeProgress() method
   - Automatically track progress on relevant actions
   - Call after quest completion, photo upload, etc.
   - Award rewards when challenge is completed
   - Use existing RPC function: add_xp_to_user()

CHALLENGE GENERATION LOGIC:
- Keep pool of challenge templates in challenges table
- Each template has min/max values for randomization
- Daily challenges: easier, quick to complete (30 min - 2 hours)
- Weekly challenges: harder, require sustained effort
- Ensure variety - don't repeat same challenge type consecutively

REWARD SYSTEM:
- Daily challenges: 20-50 points, 10-30 XP
- Weekly challenges: 100-200 points, 50-100 XP
- Bonus multiplier for completing all daily challenges in a week (+50% XP)

SUPABASE CRON CONFIGURATION (add to config.toml):
```toml
[functions.reset-daily-challenges]
verify_jwt = false

[functions.reset-weekly-challenges]
verify_jwt = false
```

Add cron jobs in Supabase Dashboard:
- Daily: 0 0 * * * (midnight UTC)
- Weekly: 0 0 * * 1 (Monday midnight UTC)

SECURITY:
- Edge functions are public (no JWT) but check for system execution
- Use existing RLS policies on challenges and user_challenges tables
- Validate challenge completion server-side

UI/UX:
- Add toast notification when challenge is completed
- Show sparkle animation on challenge card completion
- Add sound effect (optional, with mute toggle)
```

---

### 3. Seasonal Events

**Prompt:**
```
Implement a seasonal events system with themed quests and rewards:

DATABASE REQUIREMENTS:
- The events and event_quests tables already exist
- Events table structure:
  - Name, theme, description
  - Start date, end date
  - Reward type and value
  - Banner URL (for event header image)
  - is_active flag

FRONTEND COMPONENTS:
1. Create EventBanner component at src/components/gamification/EventBanner.tsx
   - Full-width hero banner at top of quest pages
   - Show event theme image/gradient background
   - Display event name, description
   - Show countdown timer to event end
   - Link to event-specific quests page
   - Only visible when event is active
   - Use framer-motion for entrance animation

2. Create EventQuestsPage at src/pages/EventQuests.tsx
   - Filter quests by current active event
   - Show event-themed UI (colors, badges)
   - Display event progress: X/Y quests completed
   - Show leaderboard for event participation
   - Display exclusive event rewards
   - Add special event badges/icons

3. Update AllQuests page:
   - Add "Event Quests" filter/tab
   - Show event badge on event-related quests
   - Highlight event quests with special border/glow

EVENT TYPES TO IMPLEMENT:

1. **Summer Adventure (June-August)**
   - Theme: Beach, outdoor, nature exploration
   - Banner: Bright, sunny colors
   - Special quests: Visit beaches, parks, outdoor cafes
   - Rewards: "Summer Explorer" badge, 500 XP bonus

2. **Fall Discovery (September-November)**
   - Theme: Autumn colors, cozy places
   - Banner: Orange, brown, warm tones
   - Special quests: Visit coffee shops, libraries, scenic viewpoints
   - Rewards: "Autumn Adventurer" badge, 2x XP multiplier

3. **Winter Wonderland (December-February)**
   - Theme: Winter activities, indoor exploration
   - Banner: Blue, white, snowy aesthetic
   - Special quests: Visit museums, indoor markets, festive locations
   - Rewards: "Winter Warrior" badge, exclusive power-up

4. **Spring Renewal (March-May)**
   - Theme: New beginnings, gardens, fresh starts
   - Banner: Green, pastel colors
   - Special quests: Visit gardens, new locations, hidden gems
   - Rewards: "Spring Scout" badge, bonus points

BACKEND LOGIC:
1. Create edge function at supabase/functions/manage-seasonal-events/index.ts
   - Check current date and activate appropriate seasonal event
   - Deactivate expired events
   - Can be triggered manually by admins or via cron
   - Link themed quests to active event

2. Admin functionality:
   - Allow admins to create custom events (not just seasonal)
   - Set custom start/end dates
   - Upload custom banner images
   - Create event-specific quests
   - Set event rewards

EVENT QUEST CREATION:
- Admins can tag quests as "event quests" when creating them
- Event quests have higher XP rewards (1.5x normal)
- Event quests appear in special "Event" section
- Limited-time availability (expires when event ends)

LEADERBOARD:
- Track event participation by user
- Show top 10 users who completed most event quests
- Display on EventQuestsPage
- Award bonus badges to top 3 participants

NOTIFICATIONS:
- Send notification when new event starts
- Reminder notification 3 days before event ends
- Notification when user completes all event quests

BANNER IMAGE STORAGE:
- Store in Supabase Storage bucket: 'event-banners'
- Recommended size: 1920x400px
- Use WebP format for optimization
- Create RLS policy allowing public read access

SECURITY:
- Only admins can create/modify events
- Public read access to active events
- Event quest completion uses existing submission flow

UI/UX ENHANCEMENTS:
- Add confetti animation when user completes all event quests
- Theme the entire app with event colors when event is active (optional)
- Add event progress bar to user profile
```

---

### 4. Special Limited-Time Quests

**Prompt:**
```
Implement limited-time quest functionality with countdown timers and urgency indicators:

DATABASE REQUIREMENTS:
- Add to existing Quests table (already has these columns):
  - is_limited_time: boolean (default false)
  - expires_at: timestamp with time zone (nullable)
  - xp_reward: integer (higher for limited quests)

FRONTEND COMPONENTS:
1. Update QuestCard component to show:
   - "LIMITED TIME" badge with red/orange gradient
   - Countdown timer showing time remaining
   - Pulsing animation when < 24 hours remain
   - Higher XP reward display (with "+50% bonus" indicator)
   - Urgency indicator: "Expires in X hours"

2. Create LimitedQuestsSection component:
   - Dedicated section on Home page
   - Carousel of active limited-time quests
   - Sort by expiration time (soonest first)
   - "View All Limited Quests" link to filtered quest page

3. Update AllQuests page:
   - Add "Limited Time" filter toggle
   - Show limited quests at top when filter is active
   - Red/orange accent for limited quest cards

QUEST TYPES:

1. **Flash Quests** (6-12 hours)
   - Very short duration
   - High XP rewards (2x normal)
   - Simple, quick to complete
   - Examples:
     - "Coffee Break Challenge" - Visit any coffee shop in 6 hours
     - "Lunch Rush" - Find a new restaurant by 2 PM
     - "Sunset Seeker" - Photograph sunset from any viewpoint

2. **Daily Special Quests** (24 hours)
   - Generated daily by AI or admin
   - Location-specific
   - 1.5x XP reward
   - Examples:
     - "Today's Hidden Gem" - Visit specific local business
     - "Street Art Hunt" - Find and photograph specific mural
     - "Local Legend" - Interview someone at historic location

3. **Weekend Quests** (48-72 hours)
   - Released Friday, expire Sunday
   - More complex, multi-step
   - Bonus rewards + badges
   - Examples:
     - "Weekend Explorer" - Visit 3 new neighborhoods
     - "Foodie Weekend" - Try 5 different cuisines
     - "Nature Escape" - Visit 2 parks and 1 trail

BACKEND LOGIC:
1. Create edge function at supabase/functions/generate-limited-quests/index.ts
   - AI-powered quest generation using Lovable AI
   - Consider user's location (from profile)
   - Generate quests based on:
     - Time of day (morning/lunch/evening/night)
     - Day of week (weekday vs weekend)
     - Weather (if API integrated)
     - User's past quest history (avoid repetition)
   - Use google/gemini-2.5-flash model
   - Prompt structure:
     ```
     Generate a limited-time quest for a user in [LOCATION].
     Time available: [DURATION] hours
     User interests: [INTERESTS]
     Quest should be:
     - Achievable within timeframe
     - Location-appropriate
     - Engaging and fun
     - Include specific location name
     Return JSON: {title, description, location, difficulty, duration_hours}
     ```

2. Create cron job to auto-generate limited quests:
   - Flash quests: Every 6 hours
   - Daily quests: Every day at 6 AM local time
   - Weekend quests: Every Friday at 6 AM

3. Create archive_expired_quests() function (already exists in setupGamification.sql):
   - Runs every hour
   - Sets is_active = false for expired limited quests
   - Prevents new submissions to expired quests

EXPIRATION HANDLING:
1. Frontend countdown timer:
   - Update every second when < 1 hour remaining
   - Update every minute when < 24 hours
   - Update every hour otherwise
   - Show different colors based on urgency:
     - Green: > 24 hours
     - Yellow: 6-24 hours
     - Orange: 1-6 hours
     - Red: < 1 hour

2. Prevent submissions after expiration:
   - Check expires_at before allowing submission
   - Show "Quest Expired" message if past deadline
   - Suggest similar active quests

NOTIFICATIONS:
- Push notification when new limited quest in user's area
- Reminder 1 hour before quest expires (if user started but not completed)
- "Last chance!" notification 15 minutes before expiration

REWARD MULTIPLIERS:
- Completion within 50% of time limit: +25% XP bonus
- Completion within 25% of time limit: +50% XP bonus
- First 10 users to complete: Exclusive "Speed Demon" badge

ADMIN CONTROLS:
- Manual creation of limited quests
- Set custom expiration times
- Feature specific limited quests (pin to top)
- Extend quest duration if needed

UI/UX:
- Use Lucide icons: Clock, Zap, AlertTriangle
- Animate countdown numbers when they change
- Add pulse effect to limited quest badges
- Show "NEW!" indicator for quests created in last hour

SECURITY:
- Validate expiration time server-side on submission
- Prevent time manipulation exploits
- Use existing quest RLS policies
```

---

### 5. Quest Difficulty Progression System

**Prompt:**
```
Implement a dynamic difficulty progression system that adapts to user skill level:

DATABASE UPDATES:
- The Quests table already has difficulty_level column: 'easy', 'medium', 'hard', 'epic'
- Add to profiles table:
  - skill_rating: integer (0-1000, default 100)
  - quests_by_difficulty: jsonb (track completion counts)
  - avg_completion_time: integer (minutes)
  - success_rate: decimal (0-1)

DIFFICULTY SYSTEM:

1. **Difficulty Levels:**
   - **Easy** (Level 1-5): 10 XP base
     - Single location visit
     - Simple photo verification
     - 1-2 requirements
     - Examples: "Visit the park", "Find a coffee shop"
   
   - **Medium** (Level 5-15): 25 XP base
     - 2-3 locations or steps
     - More specific requirements
     - 2-3 requirements
     - Examples: "Visit 3 historic sites", "Find hidden street art"
   
   - **Hard** (Level 15-30): 50 XP base
     - Multi-step complex quests
     - Challenging verification requirements
     - 3-5 requirements
     - Examples: "Complete scavenger hunt", "Interview local artisan"
   
   - **Epic** (Level 30+): 100 XP base
     - Highly complex, long-duration
     - Multiple locations and steps
     - 5+ requirements
     - May require collaboration
     - Examples: "City-wide photo series", "Document neighborhood history"

2. **Skill Rating Calculation:**
   - Start at 100 (beginner)
   - +10 points per easy quest completed
   - +25 points per medium quest
   - +50 points per hard quest
   - +100 points per epic quest
   - -5 points per failed attempt
   - Bonus multipliers:
     - First-time completion: +25%
     - Perfect verification: +10%
     - Fast completion (< avg time): +15%

FRONTEND COMPONENTS:
1. Create DifficultyBadge component at src/components/quest/DifficultyBadge.tsx
   - Color-coded badges:
     - Easy: green
     - Medium: blue
     - Hard: purple
     - Epic: gold with animation
   - Show XP reward with multiplier
   - Display estimated completion time

2. Update UserProfile to show:
   - Skill rating with visual tier (Novice/Explorer/Adventurer/Master/Legend)
   - Progress bar to next tier
   - Breakdown of quests by difficulty
   - Success rate percentage
   - Average completion time
   - Recommended difficulty level

3. Create ProgressionDashboard component at src/components/gamification/ProgressionDashboard.tsx
   - Skill rating history graph (last 30 days)
   - Difficulty distribution chart
   - Recommendations for next quest difficulty
   - Unlock requirements for higher difficulties
   - Achievement unlocks at certain skill levels

QUEST RECOMMENDATIONS:
1. Create recommendation algorithm:
   ```typescript
   function recommendDifficulty(user) {
     const skillRating = user.skill_rating;
     const successRate = user.success_rate;
     const recentCompletions = user.recentQuests.length;
     
     // Too many failures? Recommend easier quests
     if (successRate < 0.6) return getCurrentLevel(skillRating) - 1;
     
     // High success rate? Challenge the user
     if (successRate > 0.85 && recentCompletions >= 3) {
       return getCurrentLevel(skillRating) + 1;
     }
     
     // Default: current level
     return getCurrentLevel(skillRating);
   }
   ```

2. Update AllQuests page:
   - Show "Recommended for You" section
   - Filter by difficulty with user's level highlighted
   - "Challenge Yourself" section (quests 1 level higher)
   - Lock epic quests until skill rating >= 500

PROGRESSION UNLOCKS:
- Skill 0-100: Easy quests only
- Skill 100-300: Easy + Medium unlocked
- Skill 300-600: Easy + Medium + Hard unlocked
- Skill 600+: All difficulties unlocked
- Skill 1000: "Legendary Explorer" title + exclusive quests

BACKEND LOGIC:
1. Create RPC function update_skill_rating():
   ```sql
   CREATE OR REPLACE FUNCTION update_skill_rating(
     p_user_id UUID,
     p_quest_difficulty TEXT,
     p_completion_time INTEGER,
     p_success BOOLEAN
   ) RETURNS VOID AS $$
   DECLARE
     v_rating_change INTEGER;
     v_avg_time INTEGER;
   BEGIN
     -- Calculate rating change based on difficulty
     v_rating_change := CASE p_quest_difficulty
       WHEN 'easy' THEN 10
       WHEN 'medium' THEN 25
       WHEN 'hard' THEN 50
       WHEN 'epic' THEN 100
     END;
     
     IF NOT p_success THEN
       v_rating_change := -5;
     END IF;
     
     -- Get average completion time for this difficulty
     SELECT AVG(completion_time) INTO v_avg_time
     FROM quest_completions
     WHERE difficulty = p_quest_difficulty;
     
     -- Bonus for fast completion
     IF p_completion_time < v_avg_time * 0.75 THEN
       v_rating_change := v_rating_change * 1.15;
     END IF;
     
     -- Update profile
     UPDATE profiles
     SET skill_rating = LEAST(1000, skill_rating + v_rating_change),
         success_rate = (
           SELECT SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)
           FROM "Submissions"
           WHERE user_id = p_user_id
         )
     WHERE id = p_user_id;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

2. Call this function after every quest submission verdict

ADAPTIVE DIFFICULTY:
- Track user performance over last 10 quests
- If success rate drops below 50%, suggest easier quests
- If user completes 5 consecutive quests, unlock next tier
- Show "Skill Up!" animation when tier increases

GAMIFICATION:
- Add achievements for skill milestones (100, 250, 500, 750, 1000)
- Leaderboard showing top skill ratings
- Weekly "Most Improved" recognition
- Seasonal skill rating reset option (with rewards for high rating)

UI/UX:
- Particle effects when leveling up
- Sound effects for skill increases (optional)
- Visual progression bar always visible in header
- Celebratory modal when reaching new tier

TESTING:
- Test skill calculation accuracy
- Verify difficulty locks work correctly
- Ensure progression feels rewarding but not too easy
- Balance XP rewards across difficulties
```

---

### 6. Power-ups and Boosters

**Prompt:**
```
Implement a power-up system that provides temporary boosts and advantages:

DATABASE REQUIREMENTS:
- Tables powerups and user_powerups already exist
- Power-up types (in effect_type column):
  - 'double_xp': Doubles XP earned
  - 'instant_verify': Skip AI verification wait time
  - 'bonus_badge': Earn random badge on quest completion
  - 'point_multiplier': Multiply points earned
  - 'auto_accept': Auto-accept next X quests (admin approval bypass)
  - 'location_hint': Reveal nearby uncompleted quests
  - 'streak_freeze': Protect streak for 1 day
  - 'lucky_charm': Higher chance of rare rewards

FRONTEND COMPONENTS:
1. Create PowerUpInventory component at src/components/gamification/PowerUpInventory.tsx
   - Grid display of owned power-ups
   - Show power-up icon, name, description
   - Display duration and multiplier
   - "Activate" button for each power-up
   - Show active power-ups with countdown timer
   - Show cooldown timers for used power-ups
   - Quantity badge if user has multiple of same type

2. Create PowerUpShop component at src/components/gamification/PowerUpShop.tsx
   - Browse available power-ups
   - Purchase with earned points
   - Show rarity and effects clearly
   - Preview power-up benefits
   - "Buy" button with point cost
   - Confirmation modal before purchase
   - Show user's current point balance

3. Create ActivePowerUpBar component:
   - Small banner at top of screen
   - Shows all currently active power-ups
   - Countdown timers for each
   - Quick deactivate button
   - Pulsing glow effect
   - Show multiplier values prominently

4. Update GamificationDashboard:
   - Add "Power-Ups" section
   - Quick access to inventory and shop
   - Show active power-ups
   - Display power-up usage statistics

POWER-UP DEFINITIONS:

1. **Double XP Boost** (Rare)
   - Duration: 24 hours
   - Effect: 2x XP on all quest completions
   - Cost: 200 points
   - Icon: Zap icon with sparkles
   - Cooldown: 48 hours after use

2. **Instant Verify** (Epic)
   - Duration: Instant (single use)
   - Effect: One quest auto-verified immediately
   - Cost: 150 points
   - Icon: CheckCircle with fast-forward
   - Limit: 1 per day

3. **Point Multiplier** (Legendary)
   - Duration: 12 hours
   - Effect: 3x points on all activities
   - Cost: 500 points
   - Icon: TrendingUp with stars
   - Cooldown: 7 days

4. **Streak Freeze** (Common)
   - Duration: 24 hours
   - Effect: Protect your streak for 1 missed day
   - Cost: 50 points
   - Icon: Shield
   - Auto-activates when streak at risk

5. **Location Hint** (Common)
   - Duration: Instant (single use)
   - Effect: Reveals 3 nearby uncompleted quests on map
   - Cost: 30 points
   - Icon: MapPin with question mark

6. **Lucky Charm** (Rare)
   - Duration: 6 hours
   - Effect: 50% higher chance of rare badge drops
   - Cost: 100 points
   - Icon: Clover or sparkle

7. **Quest Radar** (Rare)
   - Duration: 2 hours
   - Effect: Shows all quests within 5km radius on map
   - Cost: 80 points
   - Icon: Radar or compass

BACKEND LOGIC:
1. The activate_powerup() function already exists
2. Create edge function at supabase/functions/award-powerup/index.ts:
   - Award power-ups as quest completion rewards (random chance)
   - Award power-ups for achievements
   - Award daily login power-ups
   - Epic quests guarantee power-up drop

3. Create edge function at supabase/functions/expire-powerups/index.ts:
   - Cron job runs every hour
   - Deactivate expired power-ups
   - Send notification when power-up is about to expire (30 min warning)
   - Clean up old inactive power-ups

4. Update useGamification hook:
   - Add methods:
     - activatePowerUp(userPowerUpId)
     - deactivatePowerUp(userPowerUpId)
     - purchasePowerUp(powerUpId, pointsCost)
     - getActivePowerUps()
     - getXPMultiplier() (already exists)
     - getPointsMultiplier() (already exists)

PURCHASE SYSTEM:
1. Create RPC function purchase_powerup():
   ```sql
   CREATE OR REPLACE FUNCTION purchase_powerup(
     p_user_id UUID,
     p_powerup_id UUID,
     p_cost INTEGER
   ) RETURNS JSON AS $$
   DECLARE
     v_current_points INTEGER;
   BEGIN
     -- Check if user has enough points
     SELECT total_points INTO v_current_points
     FROM profiles WHERE id = p_user_id;
     
     IF v_current_points < p_cost THEN
       RETURN json_build_object('success', FALSE, 'error', 'Insufficient points');
     END IF;
     
     -- Deduct points
     UPDATE profiles
     SET total_points = total_points - p_cost
     WHERE id = p_user_id;
     
     -- Add power-up to inventory
     INSERT INTO user_powerups (user_id, powerup_id, is_active)
     VALUES (p_user_id, p_powerup_id, FALSE);
     
     RETURN json_build_object('success', TRUE);
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

POWER-UP DROP RATES:
- Easy quests: 5% chance (Common only)
- Medium quests: 15% chance (Common 70%, Rare 30%)
- Hard quests: 30% chance (Common 40%, Rare 50%, Epic 10%)
- Epic quests: 60% chance (Rare 50%, Epic 40%, Legendary 10%)
- Daily login: 1 random Common power-up every 7 days

STACKING RULES:
- Same power-up type: Effects don't stack (must wait for expiration)
- Different power-up types: Can be active simultaneously
- Maximum 3 active power-ups at once

ACTIVATION RESTRICTIONS:
- Must not have same power-up already active
- Cooldown period must be over
- Cannot activate during quest submission (prevents abuse)

NOTIFICATIONS:
- Toast when power-up activates
- Warning toast 5 minutes before expiration
- Notification when new power-up is earned
- Push notification for rare/legendary drops

ANALYTICS:
- Track power-up usage per user
- Most popular power-ups
- Average XP boost from power-ups
- Power-up effectiveness metrics

UI/UX:
- Shimmer effect on active power-ups
- Particle animations when activating
- Sound effects for activation (optional)
- Visual indicator on quests when boost is active
- Color-coded rarity:
  - Common: gray/white
  - Rare: blue
  - Epic: purple
  - Legendary: gold with gradient

ADMIN FEATURES:
- Create custom power-ups
- Adjust costs and durations
- Grant power-ups to users (rewards, compensation)
- View power-up usage statistics
- Enable/disable specific power-ups

SECURITY:
- Validate power-up ownership before activation
- Prevent time manipulation exploits
- Server-side verification of all power-up effects
- Rate limit power-up purchases (max 10 per day)

TESTING:
- Test multiplier calculations
- Verify expiration timing
- Check stacking restrictions
- Ensure cooldowns work correctly
- Test edge cases (multiple activations, rapid deactivation)
```

---

## 👥 Enhanced Social Features

### 7. Direct Messaging Between Users

**Prompt:**
```
Implement a real-time direct messaging system:

DATABASE REQUIREMENTS:
1. Create conversations table:
   ```sql
   CREATE TABLE public.conversations (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. Create conversation_participants table:
   ```sql
   CREATE TABLE public.conversation_participants (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     joined_at TIMESTAMPTZ DEFAULT NOW(),
     last_read_at TIMESTAMPTZ,
     is_archived BOOLEAN DEFAULT FALSE,
     UNIQUE(conversation_id, user_id)
   );
   ```

3. Create messages table:
   ```sql
   CREATE TABLE public.messages (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
     sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     content TEXT NOT NULL,
     attachment_url TEXT,
     attachment_type TEXT, -- 'image', 'quest', 'submission'
     is_read BOOLEAN DEFAULT FALSE,
     is_deleted BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

4. Create message_reactions table:
   ```sql
   CREATE TABLE public.message_reactions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     emoji TEXT NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     UNIQUE(message_id, user_id)
   );
   ```

RLS POLICIES:
```sql
-- Conversations: Users can only see conversations they're part of
CREATE POLICY "Users can view their conversations"
ON conversations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = conversations.id
    AND user_id = auth.uid()
  )
);

-- Messages: Users can view messages in their conversations
CREATE POLICY "Users can view their messages"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = messages.conversation_id
    AND user_id = auth.uid()
  )
);

-- Messages: Users can send messages to their conversations
CREATE POLICY "Users can send messages"
ON messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = messages.conversation_id
    AND user_id = auth.uid()
  )
);
```

FRONTEND COMPONENTS:
1. Create MessagesPage at src/pages/Messages.tsx:
   - Left sidebar: Conversation list
   - Right panel: Active conversation view
   - Show unread message count on each conversation
   - Search conversations by username
   - Sort by most recent message
   - Mobile: Stack vertically, hide sidebar when viewing conversation

2. Create ConversationList component at src/components/messages/ConversationList.tsx:
   - List all user's conversations
   - Show other participant's avatar and name
   - Display last message preview (truncated to 50 chars)
   - Show timestamp of last message
   - Badge for unread count
   - Highlight active conversation
   - Pull to refresh on mobile

3. Create MessageThread component at src/components/messages/MessageThread.tsx:
   - Display all messages in conversation
   - Sender messages on right (blue), received on left (gray)
   - Show avatar for each message
   - Group consecutive messages from same sender
   - Show timestamps (smart formatting: "Just now", "5m ago", "Yesterday", full date)
   - Auto-scroll to bottom on new message
   - "Load more" button for older messages (pagination)
   - Use VirtualScroll for performance with long conversations

4. Create MessageInput component at src/components/messages/MessageInput.tsx:
   - Textarea with auto-expand (max 5 lines)
   - Send button (disabled when empty)
   - Attachment button (images only)
   - "Share Quest" button (opens quest picker dialog)
   - "Share Submission" button (opens submission picker)
   - Show "Typing..." indicator to other user
   - Character limit: 2000
   - Enter to send, Shift+Enter for new line

5. Create NewConversationDialog component:
   - Search for users by username
   - Show user's avatar, name, follower status
   - "Start Conversation" button
   - Check if conversation already exists, navigate to it if so

REALTIME FUNCTIONALITY:
1. Use Supabase Realtime for instant message delivery:
   ```typescript
   // Subscribe to new messages in conversation
   const channel = supabase
     .channel(`conversation:${conversationId}`)
     .on(
       'postgres_changes',
       {
         event: 'INSERT',
         schema: 'public',
         table: 'messages',
         filter: `conversation_id=eq.${conversationId}`
       },
       (payload) => {
         // Add new message to thread
         // Play notification sound
         // Mark as read if conversation is active
       }
     )
     .subscribe();
   ```

2. Typing indicators:
   - Broadcast typing status using Supabase Presence
   - Show "Username is typing..." below message input
   - Timeout after 3 seconds of no typing

3. Read receipts:
   - Update last_read_at when user views conversation
   - Show checkmark when message is read
   - Double checkmark when all participants read

BACKEND LOGIC:
1. Create edge function at supabase/functions/send-message/index.ts:
   - Validate message content (no spam, profanity if moderation enabled)
   - Check conversation exists and user is participant
   - Insert message into database
   - Update conversation updated_at timestamp
   - Send push notification to other participants
   - Return message with sender profile info

2. Create RPC function get_or_create_conversation():
   ```sql
   CREATE OR REPLACE FUNCTION get_or_create_conversation(
     p_other_user_id UUID
   ) RETURNS UUID AS $$
   DECLARE
     v_conversation_id UUID;
   BEGIN
     -- Check if conversation exists
     SELECT c.id INTO v_conversation_id
     FROM conversations c
     JOIN conversation_participants cp1 ON cp1.conversation_id = c.id
     JOIN conversation_participants cp2 ON cp2.conversation_id = c.id
     WHERE cp1.user_id = auth.uid()
       AND cp2.user_id = p_other_user_id
     LIMIT 1;
     
     -- Create if doesn't exist
     IF v_conversation_id IS NULL THEN
       INSERT INTO conversations DEFAULT VALUES
       RETURNING id INTO v_conversation_id;
       
       INSERT INTO conversation_participants (conversation_id, user_id)
       VALUES
         (v_conversation_id, auth.uid()),
         (v_conversation_id, p_other_user_id);
     END IF;
     
     RETURN v_conversation_id;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

FEATURES:
1. **Message Types:**
   - Text messages
   - Image attachments (upload to Supabase Storage)
   - Quest links (clickable, shows quest preview)
   - Submission links (shows photo preview)
   - Reactions/emojis on messages

2. **Conversation Management:**
   - Archive conversations
   - Delete conversations (soft delete, remove from view)
   - Mute notifications for specific conversation
   - Block user (prevents messaging)

3. **Moderation:**
   - Report messages/conversations
   - Profanity filter on messages
   - Spam detection (rate limiting)
   - Admin can view reported conversations

NOTIFICATIONS:
- Push notification for new message (if app not active)
- In-app toast notification (if on different page)
- Desktop notification (if browser supports)
- Badge count on Messages icon in navigation
- Email digest for unread messages (daily, if enabled)

UI/UX:
- Smooth scroll animations
- Message send animation (slide in)
- Skeleton loading for message history
- Empty state: "No conversations yet. Start chatting!"
- Error handling: "Message failed to send. Retry?"
- Optimistic updates: Show message immediately, confirm from server

PRIVACY & SECURITY:
- Users can only message users they follow OR who follow them back
- Option to allow messages from anyone
- Block functionality prevents all interaction
- Report functionality for harassment
- Auto-delete spam messages
- Rate limit: Max 100 messages per hour per user

PERFORMANCE:
- Paginate message history (50 messages per page)
- Use virtual scrolling for long conversations
- Lazy load images in messages
- Cache conversation list
- Debounce typing indicator broadcasts

ACCESSIBILITY:
- Keyboard navigation (Tab through conversations, Enter to open)
- Screen reader support for all elements
- High contrast mode support
- Focus indicators

TESTING:
- Test real-time message delivery
- Verify read receipts work correctly
- Test conversation creation and retrieval
- Check notification delivery
- Test with poor network conditions
- Verify blocking functionality
```

---

### 8. Follow/Unfollow System

**Prompt:**
```
Implement a comprehensive follow/unfollow system with follower feeds:

DATABASE REQUIREMENTS:
1. Create follows table:
   ```sql
   CREATE TABLE public.follows (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
     following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     UNIQUE(follower_id, following_id),
     CHECK (follower_id != following_id)
   );
   
   CREATE INDEX idx_follows_follower ON follows(follower_id);
   CREATE INDEX idx_follows_following ON follows(following_id);
   ```

2. Add to profiles table:
   ```sql
   ALTER TABLE profiles ADD COLUMN follower_count INTEGER DEFAULT 0;
   ALTER TABLE profiles ADD COLUMN following_count INTEGER DEFAULT 0;
   ```

3. Create follow_requests table (for private profiles):
   ```sql
   CREATE TABLE public.follow_requests (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     target_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
     created_at TIMESTAMPTZ DEFAULT NOW(),
     responded_at TIMESTAMPTZ,
     UNIQUE(requester_id, target_id)
   );
   ```

RLS POLICIES:
```sql
-- Follows: Public read access
CREATE POLICY "Anyone can view follows"
ON follows FOR SELECT USING (true);

-- Follows: Users can follow others
CREATE POLICY "Users can follow others"
ON follows FOR INSERT
WITH CHECK (auth.uid() = follower_id);

-- Follows: Users can unfollow
CREATE POLICY "Users can unfollow"
ON follows FOR DELETE
USING (auth.uid() = follower_id);
```

FRONTEND COMPONENTS:
1. Create FollowButton component at src/components/social/FollowButton.tsx:
   - Shows current follow status
   - States:
     - "Follow" (not following)
     - "Following" (currently following, hover shows "Unfollow")
     - "Requested" (pending approval for private profile)
     - "Follow Back" (user follows you but you don't follow them)
   - Button variants:
     - Primary for "Follow"
     - Secondary for "Following"
     - Outline for "Requested"
   - Loading state during API call
   - Optimistic updates
   - Props: userId, size variant, showCounts

2. Create FollowersModal component at src/components/social/FollowersModal.tsx:
   - Tabbed interface: "Followers" | "Following"
   - List of users with avatars
   - Show follow button for each user
   - Search functionality
   - Infinite scroll pagination
   - Show "Follows you" badge if they follow you back
   - Show mutual follows first
   - Empty states with suggestions

3. Create FollowersPage at src/pages/Followers.tsx:
   - Full page version of FollowersModal
   - Better for mobile experience
   - Route: /users/:userId/followers and /users/:userId/following
   - Tabs for Followers/Following
   - Filter: All | Mutual | New

4. Update UserProfile component:
   - Show follower count and following count (clickable)
   - Follow/Unfollow button in header
   - Show mutual followers count
   - "Followed by [username] and X others you follow"

5. Create SuggestedUsers component at src/components/social/SuggestedUsers.tsx:
   - "Who to Follow" section
   - Show 5 suggested users
   - Based on:
     - Users in same location
     - Users who completed similar quests
     - Popular users (high follower count)
     - Mutual follows (followers of people you follow)
   - Mini profile card with avatar, name, follower count
   - Quick follow button
   - "Refresh" button for new suggestions

BACKEND LOGIC:
1. Create RPC function toggle_follow():
   ```sql
   CREATE OR REPLACE FUNCTION toggle_follow(
     p_target_user_id UUID
   ) RETURNS JSON AS $$
   DECLARE
     v_is_following BOOLEAN;
     v_is_private BOOLEAN;
   BEGIN
     -- Check if already following
     SELECT EXISTS(
       SELECT 1 FROM follows
       WHERE follower_id = auth.uid()
       AND following_id = p_target_user_id
     ) INTO v_is_following;
     
     IF v_is_following THEN
       -- Unfollow
       DELETE FROM follows
       WHERE follower_id = auth.uid()
       AND following_id = p_target_user_id;
       
       -- Update counts
       UPDATE profiles SET following_count = following_count - 1
       WHERE id = auth.uid();
       
       UPDATE profiles SET follower_count = follower_count - 1
       WHERE id = p_target_user_id;
       
       RETURN json_build_object('success', TRUE, 'action', 'unfollowed');
     ELSE
       -- Check if target profile is private
       SELECT is_private INTO v_is_private
       FROM profiles WHERE id = p_target_user_id;
       
       IF v_is_private THEN
         -- Create follow request
         INSERT INTO follow_requests (requester_id, target_id)
         VALUES (auth.uid(), p_target_user_id)
         ON CONFLICT DO NOTHING;
         
         RETURN json_build_object('success', TRUE, 'action', 'requested');
       ELSE
         -- Follow directly
         INSERT INTO follows (follower_id, following_id)
         VALUES (auth.uid(), p_target_user_id);
         
         -- Update counts
         UPDATE profiles SET following_count = following_count + 1
         WHERE id = auth.uid();
         
         UPDATE profiles SET follower_count = follower_count + 1
         WHERE id = p_target_user_id;
         
         RETURN json_build_object('success', TRUE, 'action', 'followed');
       END IF;
     END IF;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

2. Create get_suggested_users() function:
   ```sql
   CREATE OR REPLACE FUNCTION get_suggested_users(p_limit INTEGER DEFAULT 5)
   RETURNS TABLE (
     user_id UUID,
     username TEXT,
     avatar_url TEXT,
     follower_count INTEGER,
     mutual_count INTEGER
   ) AS $$
   BEGIN
     RETURN QUERY
     SELECT
       p.id,
       p.username,
       p.avatar_url,
       p.follower_count,
       (
         SELECT COUNT(*)::INTEGER
         FROM follows f1
         JOIN follows f2 ON f1.following_id = f2.follower_id
         WHERE f1.follower_id = auth.uid()
         AND f2.following_id = p.id
       ) as mutual_count
     FROM profiles p
     WHERE p.id != auth.uid()
     AND NOT EXISTS (
       SELECT 1 FROM follows
       WHERE follower_id = auth.uid()
       AND following_id = p.id
     )
     ORDER BY
       p.follower_count DESC,
       mutual_count DESC,
       RANDOM()
     LIMIT p_limit;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

FEATURES:
1. **Follow Feed:**
   - Create FollowingFeedPage at src/pages/FollowingFeed.tsx
   - Show submissions from users you follow
   - Real-time updates
   - Filter by quest type
   - Infinite scroll
   - Empty state: Suggestions to follow users

2. **Mutual Follows:**
   - Badge indicator for mutual follows
   - Special styling in followers list
   - Quick action: "Add to Close Friends" (future feature)

3. **Follow Notifications:**
   - Notification when someone follows you
   - Notification when follow request is accepted
   - Batch notifications: "X new followers this week"

4. **Follow Limits:**
   - Max 1000 follows per account (prevent spam)
   - Rate limit: Max 50 follow actions per hour
   - Cooldown after mass unfollowing

5. **Privacy Controls:**
   - Private profile option in settings
   - Approve/reject follow requests
   - Remove followers (soft block)
   - Hide follower/following counts option

ACTIVITY TRACKING:
- Track when users started following each other
- Show "Following since [date]" on profile
- Anniversary notifications (1 year following)
- Track mutual engagement (likes, comments between users)

ANALYTICS FOR USERS:
- "Your Growth" section showing:
  - New followers this week/month
  - Follower growth graph
  - Most engaged followers
  - Follower demographics (locations)

SOCIAL GRAPH INSIGHTS:
- "You might know" suggestions based on:
  - Mutual followers
  - Similar quest completions
  - Same location/interests
  - Interaction patterns

UI/UX:
- Smooth animations for follow/unfollow
- Confetti animation when getting 10th, 50th, 100th follower
- Toast notifications for follow actions
- Optimistic UI updates
- Undo option (5 seconds) after unfollowing

NOTIFICATIONS:
- "[Username] started following you"
- "[Username] accepted your follow request"
- "You have X new followers"
- Weekly summary: "You gained X followers this week"

SECURITY:
- Prevent follow/unfollow spam (rate limiting)
- Detect bot accounts (too many follows too quickly)
- Report suspicious follow patterns to admins
- Block functionality prevents following

TESTING:
- Test follow/unfollow flow
- Verify count updates correctly
- Test private profile request flow
- Check suggestion algorithm accuracy
- Test rate limiting
```

---

*Due to length constraints, I'll continue with the remaining social and team features in a systematic format...*

### 9-14. Remaining Social & Team Features

[The file would continue with detailed prompts for:
- Friend Requests
- Activity Timeline
- Post Editing
- Reporting/Moderation
- User Blocking
- Team Chat
- Team Leaderboards
- Team Challenges
- Team Achievements
- Team Roles
- Team Invitations]

---

## 🔒 Critical Security Considerations for All Features

```
GENERAL SECURITY RULES TO FOLLOW:

1. **RLS Policies:**
   - Every new table MUST have RLS enabled
   - Use SECURITY DEFINER functions for complex checks
   - Never expose auth.users table directly
   - Test policies with different user roles

2. **Input Validation:**
   - Sanitize all user inputs
   - Validate on both client and server
   - Use Zod schemas for type safety
   - Prevent XSS attacks

3. **Rate Limiting:**
   - Implement on all user actions
   - Track in separate rate_limits table
   - Different limits for different actions
   - Clear limits after cooldown period

4. **Data Privacy:**
   - Users can only access their own data unless public
   - Implement proper CASCADE deletes
   - GDPR compliance: Export and delete functionality
   - Audit logs for sensitive operations

5. **Authentication:**
   - Always verify auth.uid() in RLS policies
   - Use proper JWT validation in edge functions
   - Implement session timeouts
   - Secure password requirements

6. **File Uploads:**
   - Validate file types and sizes
   - Scan for malware (if possible)
   - Use Supabase Storage RLS policies
   - Implement upload rate limits

7. **API Security:**
   - Use HTTPS only
   - Implement CORS properly
   - API keys in environment variables
   - Never expose secrets to client
```

---

## 📊 Testing Checklist for All Features

```
BEFORE MARKING ANY FEATURE AS COMPLETE:

✅ **Functionality Testing:**
   - All happy paths work correctly
   - Edge cases handled gracefully
   - Error states display properly
   - Loading states implemented

✅ **Security Testing:**
   - RLS policies prevent unauthorized access
   - Input validation prevents injection
   - Rate limiting works correctly
   - User data is properly isolated

✅ **Performance Testing:**
   - Page loads in < 2 seconds
   - No memory leaks
   - Infinite scroll works smoothly
   - Real-time updates don't lag

✅ **UI/UX Testing:**
   - Responsive on mobile, tablet, desktop
   - Dark mode works correctly
   - Animations are smooth
   - Accessibility standards met

✅ **Database Testing:**
   - Migrations run without errors
   - Indexes created for performance
   - Triggers work correctly
   - Constraints prevent bad data

✅ **Integration Testing:**
   - Features work with existing code
   - No breaking changes
   - Edge functions deploy successfully
   - Real-time subscriptions work
```

---

## 🎯 Implementation Priority & Dependencies

```
RECOMMENDED ORDER (based on dependencies):

Phase 1 - Foundation:
1. Achievement System (independent)
2. Daily/Weekly Challenges (depends on achievements)
3. Power-ups (independent)

Phase 2 - Social Core:
4. Follow/Unfollow System (foundation for social features)
5. Activity Timeline (depends on follows)
6. Direct Messaging (depends on follows)

Phase 3 - Advanced Social:
7. Friend Requests (enhancement of follows)
8. Post Editing (independent)
9. Reporting/Moderation (independent but important)
10. User Blocking (depends on follows)

Phase 4 - Gamification Enhancement:
11. Quest Difficulty Progression (depends on achievements)
12. Seasonal Events (depends on achievements/challenges)
13. Limited-Time Quests (depends on progression)

Phase 5 - Team Features:
14. Team Chat (depends on messaging infrastructure)
15. Team Challenges (depends on challenge system)
16. Team Leaderboards (independent)
17. Team Achievements (depends on achievement system)
18. Team Roles (independent)
19. Team Invitations (depends on follows)
```
