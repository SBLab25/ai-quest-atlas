# Discovery Atlas - Database Structure Documentation

**Generated:** 2025-11-01  
**Database Type:** PostgreSQL (Supabase)  
**Project:** Discovery Atlas - Gamified Quest Platform

---

## Table of Contents
- [Overview](#overview)
- [Database Tables](#database-tables)
- [Enums](#enums)
- [Functions](#functions)
- [Triggers](#triggers)
- [Storage Buckets](#storage-buckets)
- [Security](#security)
- [Relationships Diagram](#relationships-diagram)

---

## Overview

The Discovery Atlas database is built on Supabase (PostgreSQL) and implements a comprehensive gamified quest system with AI photo verification, social features, and role-based access control.

**Key Features:**
- User authentication and profiles
- Quest management with AI verification
- Gamification (XP, levels, achievements, badges)
- Social features (posts, comments, likes)
- Team/Crew collaboration
- Real-time updates via Supabase
- Storage for photos and avatars

---

## Database Tables

### 1. **profiles**
*Main user profile table - extends auth.users*

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | - | Primary key, references auth.users(id) |
| username | text | Yes | - | User's display name |
| full_name | text | Yes | - | User's full name |
| avatar_url | text | Yes | - | Profile picture URL |
| location | text | Yes | - | User's location name |
| latitude | double precision | Yes | - | User's latitude coordinate |
| longitude | double precision | Yes | - | User's longitude coordinate |
| location_last_updated | timestamp with time zone | Yes | - | When location was last updated |
| interests | text[] | Yes | - | Array of user interests |
| xp | integer | Yes | 0 | Experience points |
| level | integer | Yes | 1 | User level |
| created_at | timestamp with time zone | No | now() | Account creation timestamp |
| updated_at | timestamp with time zone | No | now() | Last profile update |

**RLS Policies:**
- ✅ Anyone can view profiles
- ✅ Users can insert their own profile
- ✅ Users can update their own profile
- ❌ Users cannot delete profiles

**Purpose:** Central user data table for app functionality, separate from auth.users

---

### 2. **user_roles**
*Role-based access control system*

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| user_id | uuid | No | - | References auth.users(id) |
| role | app_role (enum) | No | 'user' | User's role (admin, moderator, user) |
| created_at | timestamp with time zone | No | now() | Role assignment date |

**RLS Policies:**
- ✅ Everyone can view user roles
- ✅ Only admins can manage (insert/update/delete) roles

**Unique Constraint:** (user_id, role) - prevents duplicate role assignments

**Purpose:** Secure role management using security definer functions

---

### 3. **Quests**
*Main quest/challenge table*

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| title | text | No | - | Quest title |
| description | text | Yes | - | Quest description |
| location | text | Yes | - | Quest location name |
| quest_type | text | Yes | - | Type (photography, nature, history, etc.) |
| difficulty | smallint | Yes | - | Difficulty level (1-5) |
| difficulty_level | text | Yes | 'medium' | Difficulty as text |
| xp_reward | integer | Yes | 25 | XP awarded upon completion |
| is_active | boolean | Yes | - | Whether quest is active |
| is_limited_time | boolean | Yes | false | Time-limited quest flag |
| expires_at | timestamp with time zone | Yes | - | Quest expiration time |
| created_by | uuid | Yes | - | Creator user ID |
| created_at | timestamp without time zone | Yes | now() | Creation timestamp |

**RLS Policies:**
- ✅ Everyone can view quests
- ✅ Admins can create quests
- ✅ Admins can update quests
- ✅ Admins can delete quests

**Purpose:** Stores all quest challenges for users to complete

---

### 4. **Submissions**
*User quest submission/completion records*

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| user_id | uuid | No | auth.uid() | Submitter user ID |
| quest_id | uuid | Yes | auth.uid() | Related quest ID |
| photo_url | text | Yes | - | Primary photo URL (deprecated) |
| image_urls | text[] | Yes | '{}' | Array of image URLs |
| description | text | Yes | - | Submission description |
| geo_location | text | Yes | - | Submission location |
| status | text | Yes | 'pending' | Status: pending, verified, rejected |
| submitted_at | timestamp without time zone | Yes | now() | Submission timestamp |

**RLS Policies:**
- ✅ Everyone can view submissions
- ✅ Users can create their own submissions
- ✅ Users can update their own submissions
- ✅ Admins can update any submission
- ❌ Users cannot delete submissions

**Foreign Key:** quest_id references Quests(id) ON DELETE CASCADE

**Purpose:** Tracks user quest completions with photos

---

### 5. **ai_verifications**
*AI photo verification results*

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| user_id | uuid | No | - | User who submitted |
| quest_id | uuid | Yes | - | Related quest |
| submission_id | uuid | No | - | Related submission |
| photo_url | text | No | - | Verified photo URL |
| quest_match_score | numeric(3,2) | Yes | - | Quest match score (0-1) |
| geolocation_match_score | numeric(3,2) | Yes | - | Location match score (0-1) |
| authenticity_score | numeric(3,2) | Yes | - | Photo authenticity score (0-1) |
| scene_relevance_score | numeric(3,2) | Yes | - | Scene relevance score (0-1) |
| final_confidence | numeric(3,2) | Yes | - | Overall confidence (0-1) |
| verdict | text | No | - | verified, uncertain, rejected |
| reason | text | No | - | Verification reasoning |
| exif_latitude | numeric | Yes | - | EXIF GPS latitude |
| exif_longitude | numeric | Yes | - | EXIF GPS longitude |
| exif_timestamp | timestamp with time zone | Yes | - | EXIF timestamp |
| model_used | text | Yes | 'google/gemini-2.5-pro' | AI model used |
| admin_override | boolean | Yes | false | Manual override flag |
| admin_override_by | uuid | Yes | - | Admin who overrode |
| admin_override_reason | text | Yes | - | Override reason |
| verified_at | timestamp with time zone | Yes | now() | Verification timestamp |
| created_at | timestamp with time zone | Yes | now() | Creation timestamp |
| updated_at | timestamp with time zone | Yes | now() | Last update timestamp |

**RLS Policies:**
- ✅ Users can view their own verifications
- ✅ Admins can view all verifications
- ✅ System can insert verifications
- ✅ Admins can update verifications

**Indexes:**
- idx_ai_verifications_user_id
- idx_ai_verifications_submission_id
- idx_ai_verifications_verdict

**Purpose:** Stores AI analysis results for photo submissions

---

### 6. **ai_logs**
*AI operation logs for debugging*

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| user_id | uuid | No | - | User ID |
| submission_id | uuid | No | - | Related submission |
| verification_id | uuid | Yes | - | Related verification |
| task_type | text | Yes | - | Type of AI task |
| input_id | uuid | Yes | - | Input reference |
| model_used | text | No | - | AI model used |
| confidence | numeric(3,2) | Yes | - | Confidence score |
| confidence_score | numeric(3,2) | Yes | - | Legacy confidence field |
| output | jsonb | Yes | - | AI output data |
| execution_time_ms | integer | Yes | - | Execution time |
| status | text | No | - | success, error, timeout |
| error_message | text | Yes | - | Error details |
| created_at | timestamp with time zone | Yes | now() | Log timestamp |

**RLS Policies:**
- ✅ Users can view their own logs
- ✅ Admins can view all logs
- ✅ System can insert logs

**Indexes:**
- idx_ai_logs_user_id
- idx_ai_logs_task_type
- idx_ai_logs_status

**Purpose:** Debugging and analytics for AI operations

---

### 7. **Badges**
*Achievement badges*

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| name | text | No | - | Badge name |
| description | text | Yes | - | Badge description |
| icon_url | text | Yes | - | Badge icon URL |
| quest_id | uuid | Yes | auth.uid() | Related quest |

**RLS Policies:**
- ✅ Everyone can view badges
- ✅ Admins can manage badges (CRUD)

**Purpose:** Defines available badges users can earn

---

### 8. **User Badges**
*User badge awards*

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| user_id | uuid | No | auth.uid() | User who earned badge |
| badge_id | uuid | Yes | auth.uid() | Badge earned |
| earned_at | timestamp without time zone | Yes | - | When badge was earned |

**RLS Policies:**
- ✅ Authenticated users can view badges
- ✅ Users can manage their own badges

**Purpose:** Tracks which badges users have earned

---

### 9. **achievements**
*Gamification achievements*

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| title | text | No | - | Achievement title |
| description | text | No | - | Achievement description |
| category | text | No | - | Category (quests, social, exploration, etc.) |
| requirement_type | text | No | - | Type of requirement |
| requirement_value | integer | No | - | Required count |
| xp_reward | integer | No | 0 | XP reward |
| rarity | text | No | - | common, rare, epic, legendary |
| icon_url | text | Yes | - | Achievement icon |
| created_at | timestamp with time zone | Yes | now() | Creation timestamp |

**RLS Policies:**
- ✅ Anyone can view achievements
- ❌ No insert/update/delete (managed by admins)

**Purpose:** Defines achievable milestones for gamification

---

### 10. **user_achievements**
*User achievement unlocks*

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| user_id | uuid | No | - | User who unlocked |
| achievement_id | uuid | No | - | Achievement unlocked |
| unlocked_at | timestamp with time zone | Yes | now() | Unlock timestamp |

**RLS Policies:**
- ✅ Users can view their own achievements
- ❌ No manual insert/update/delete (system managed)

**Purpose:** Tracks user achievement progress

---

### 11. **challenges**
*Time-limited challenges*

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| type | text | No | - | Challenge type (daily, weekly, special) |
| title | text | No | - | Challenge title |
| description | text | No | - | Challenge description |
| requirement_type | text | No | - | What to complete |
| requirement_value | integer | No | - | How many to complete |
| reward_xp | integer | No | 0 | XP reward |
| reward_points | integer | No | 0 | Points reward |
| start_date | timestamp with time zone | No | - | Challenge start |
| end_date | timestamp with time zone | No | - | Challenge end |
| is_active | boolean | Yes | true | Active status |
| created_at | timestamp with time zone | Yes | now() | Creation timestamp |

**RLS Policies:**
- ✅ Anyone can view active challenges
- ❌ No user management (admin only)

**Purpose:** Time-based competitive challenges

---

### 12. **user_challenges**
*User challenge progress*

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| user_id | uuid | No | - | Participating user |
| challenge_id | uuid | No | - | Related challenge |
| progress | integer | Yes | 0 | Current progress |
| status | text | Yes | 'in_progress' | in_progress, completed |
| completed_at | timestamp with time zone | Yes | - | Completion timestamp |
| created_at | timestamp with time zone | Yes | now() | Join timestamp |

**RLS Policies:**
- ✅ Users can view their own challenges
- ✅ Users can insert their own challenges
- ✅ Users can update their own challenges

**Purpose:** Tracks individual challenge participation

---

### 13. **powerups**
*Game power-ups*

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| name | text | No | - | Power-up name |
| description | text | No | - | Power-up description |
| effect_type | text | No | - | xp_multiplier, quest_reveal, etc. |
| multiplier | numeric | Yes | 1.0 | Effect multiplier |
| duration_hours | integer | No | - | Duration in hours |
| rarity | text | Yes | - | Power-up rarity |
| icon_url | text | Yes | - | Power-up icon |
| created_at | timestamp with time zone | Yes | now() | Creation timestamp |

**RLS Policies:**
- ✅ Anyone can view power-ups
- ❌ No user management

**Purpose:** Defines available power-ups

---

### 14. **user_powerups**
*User power-up inventory*

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| user_id | uuid | No | - | Owner user |
| powerup_id | uuid | No | - | Power-up type |
| is_active | boolean | Yes | false | Currently active |
| activated_at | timestamp with time zone | Yes | - | Activation time |
| expires_at | timestamp with time zone | Yes | - | Expiration time |
| created_at | timestamp with time zone | Yes | now() | Acquisition time |

**RLS Policies:**
- ✅ Users can view their own power-ups
- ✅ Users can insert their own power-ups
- ✅ Users can update their own power-ups

**Purpose:** Tracks user power-up ownership and usage

---

### 15. **events**
*Special game events*

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| name | text | No | - | Event name |
| description | text | No | - | Event description |
| theme | text | No | - | Event theme |
| banner_url | text | Yes | - | Event banner image |
| start_date | timestamp with time zone | No | - | Event start |
| end_date | timestamp with time zone | No | - | Event end |
| reward_type | text | Yes | - | Reward type |
| reward_value | integer | Yes | - | Reward amount |
| is_active | boolean | Yes | true | Active status |
| created_at | timestamp with time zone | Yes | now() | Creation timestamp |

**RLS Policies:**
- ✅ Anyone can view active events
- ❌ No user management

**Purpose:** Special time-limited events

---

### 16. **event_quests**
*Quest-to-event associations*

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| event_id | uuid | No | - | Related event |
| quest_id | uuid | No | - | Related quest |
| created_at | timestamp with time zone | Yes | now() | Association timestamp |

**RLS Policies:**
- ✅ Anyone can view event quests
- ❌ No user management

**Purpose:** Links quests to special events

---

### 17. **xp_logs**
*XP transaction history*

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| user_id | uuid | No | - | User who earned XP |
| points | integer | No | - | XP amount |
| source | text | No | - | Source of XP (quest, achievement, etc.) |
| description | text | Yes | - | Description |
| created_at | timestamp with time zone | Yes | now() | Transaction timestamp |

**RLS Policies:**
- ✅ Users can view their own XP logs
- ❌ No insert/update/delete (system managed)

**Purpose:** Audit trail for XP changes

---

### 18. **community_posts**
*Social community posts*

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| user_id | uuid | No | - | Post author |
| title | text | No | - | Post title |
| content | text | No | - | Post content |
| post_type | text | No | 'general' | general, achievement, quest |
| image_url | text | Yes | - | Single image (deprecated) |
| image_urls | text[] | Yes | '{}' | Multiple images |
| tags | text[] | Yes | '{}' | Post tags |
| created_at | timestamp with time zone | No | now() | Creation timestamp |
| updated_at | timestamp with time zone | No | now() | Last update timestamp |

**RLS Policies:**
- ✅ Everyone can view posts
- ✅ Users can create their own posts
- ✅ Users can update their own posts
- ✅ Users can delete their own posts
- ✅ Admins can update/delete any post

**Purpose:** Social feed for community interaction

---

### 19. **community_post_comments**
*Comments on community posts*

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| post_id | uuid | No | - | Parent post |
| user_id | uuid | No | - | Comment author |
| content | text | No | - | Comment content |
| created_at | timestamp with time zone | No | now() | Creation timestamp |
| updated_at | timestamp with time zone | No | now() | Last update timestamp |

**RLS Policies:**
- ✅ Everyone can view comments
- ✅ Users can create comments
- ✅ Users can update their own comments
- ✅ Users can delete their own comments
- ✅ Admins can update/delete any comment

**Purpose:** Commenting system for posts

---

### 20. **community_post_likes**
*Post likes*

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| post_id | uuid | No | - | Liked post |
| user_id | uuid | No | - | User who liked |
| created_at | timestamp with time zone | No | now() | Like timestamp |

**RLS Policies:**
- ✅ Everyone can view likes
- ✅ Users can create likes
- ✅ Users can delete their own likes
- ✅ Admins can delete any like

**Purpose:** Like system for posts

---

### 21. **post_comments**
*Comments on submissions (quest posts)*

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| submission_id | uuid | No | - | Parent submission |
| user_id | uuid | No | - | Comment author |
| content | text | No | - | Comment content |
| created_at | timestamp with time zone | No | now() | Creation timestamp |
| updated_at | timestamp with time zone | No | now() | Last update timestamp |

**RLS Policies:**
- ✅ Everyone can view comments
- ✅ Users can create comments
- ✅ Users can update their own comments
- ✅ Users can delete their own comments

**Purpose:** Comments on quest submissions

---

### 22. **post_likes**
*Submission likes*

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| submission_id | uuid | No | - | Liked submission |
| user_id | uuid | No | - | User who liked |
| created_at | timestamp with time zone | No | now() | Like timestamp |

**RLS Policies:**
- ✅ Everyone can view likes
- ✅ Users can create likes
- ✅ Users can delete their own likes

**Purpose:** Like system for submissions

---

### 23. **post_shares**
*Submission shares*

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| submission_id | uuid | No | - | Shared submission |
| user_id | uuid | No | - | User who shared |
| created_at | timestamp with time zone | No | now() | Share timestamp |

**RLS Policies:**
- ✅ Everyone can view shares
- ✅ Users can create shares
- ✅ Users can delete their own shares

**Purpose:** Share tracking for submissions

---

### 24. **crews**
*User teams/groups*

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| name | text | No | - | Crew name |
| description | text | Yes | - | Crew description |
| leader_id | uuid | Yes | - | Crew leader user ID |
| max_members | integer | No | 100 | Maximum member count |
| created_at | timestamp with time zone | No | now() | Creation timestamp |

**RLS Policies:**
- ✅ Everyone can view crews
- ✅ Authenticated users can create crews
- ✅ Leaders can update their crews
- ✅ Leaders can delete their crews

**Purpose:** Team/crew system for collaboration

---

### 25. **crew_members**
*Crew membership*

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| crew_id | uuid | No | - | Crew ID |
| user_id | uuid | No | - | Member user ID |
| role | text | No | 'member' | member, leader |
| joined_at | timestamp with time zone | No | now() | Join timestamp |

**RLS Policies:**
- ✅ Everyone can view crew members
- ✅ Users can join crews (insert themselves)
- ✅ Users can leave crews (delete themselves)

**Unique Constraint:** (crew_id, user_id) - prevents duplicate membership

**Purpose:** Tracks crew membership

---

### 26. **teams**
*Alternative team structure*

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| name | text | No | - | Team name |
| description | text | Yes | - | Team description |
| leader_id | uuid | Yes | - | Team leader |
| max_members | integer | Yes | 6 | Maximum members |
| created_at | timestamp with time zone | No | timezone('utc', now()) | Creation timestamp |

**RLS Policies:**
- ✅ Everyone can view teams
- ✅ Users can create teams
- ✅ Leaders can update their teams
- ✅ Leaders can delete their teams

**Purpose:** Alternative team system (consider consolidating with crews)

---

### 27. **team_members**
*Team membership (alternative to crew_members)*

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| team_id | uuid | Yes | - | Team ID |
| user_id | uuid | Yes | - | Member user ID |
| role | text | Yes | 'member' | member, leader |
| joined_at | timestamp with time zone | No | timezone('utc', now()) | Join timestamp |

**RLS Policies:**
- ✅ Everyone can view team members
- ✅ Users can join teams
- ✅ Users can leave teams
- ✅ Team leaders can manage members

**Unique Constraint:** (team_id, user_id)

**Purpose:** Team membership tracking

---

### 28. **team_quest_completions**
*Team quest progress*

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| team_id | uuid | Yes | - | Team ID |
| quest_id | uuid | Yes | - | Completed quest |
| completed_by | uuid | Yes | - | User who completed |
| completed_at | timestamp with time zone | No | timezone('utc', now()) | Completion timestamp |

**RLS Policies:**
- ✅ Team members can view completions
- ✅ Team members can mark quests complete

**Unique Constraint:** (team_id, quest_id)

**Purpose:** Tracks team quest completions

---

### 29. **ai_generated_quests**
*AI-generated quest suggestions*

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| user_id | uuid | No | - | Requesting user |
| title | text | No | - | Quest title |
| description | text | No | - | Quest description |
| location | text | No | - | Quest location |
| latitude | double precision | Yes | - | Location latitude |
| longitude | double precision | Yes | - | Location longitude |
| quest_type | text | No | 'discovery' | Quest type |
| difficulty | smallint | No | 1 | Difficulty (1-5) |
| generated_by | text | No | 'gemini' | AI model used |
| generation_prompt | text | Yes | - | Prompt used |
| is_active | boolean | No | true | Active status |
| created_at | timestamp with time zone | No | now() | Generation timestamp |
| updated_at | timestamp with time zone | No | now() | Last update timestamp |

**RLS Policies:**
- ✅ Everyone can view AI quests
- ✅ Users can view their own AI quests
- ✅ Users can insert their own AI quests
- ✅ Users can update their own AI quests
- ✅ Users can delete their own AI quests
- ✅ Admins can manage all AI quests

**Purpose:** Stores AI-generated quest suggestions

---

### 30. **suggested_quests**
*User-suggested quests for review*

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| user_id | uuid | No | - | Suggesting user |
| title | text | No | - | Quest title |
| description | text | No | - | Quest description |
| category | text | No | - | Quest category |
| quest_type | text | No | 'discovery' | Quest type |
| difficulty | smallint | No | - | Difficulty (1-5) |
| estimated_duration | integer | No | - | Duration in minutes |
| location | text | Yes | - | Location name |
| latitude | double precision | Yes | - | Location latitude |
| longitude | double precision | Yes | - | Location longitude |
| is_active | boolean | No | true | Active status |
| is_accepted | boolean | No | false | Accepted by admin |
| generated_at | timestamp with time zone | No | now() | Generation timestamp |
| expires_at | timestamp with time zone | No | now() + '7 days' | Expiration timestamp |
| generation_context | jsonb | Yes | - | Context data |
| created_at | timestamp with time zone | No | now() | Creation timestamp |

**RLS Policies:**
- ✅ Users can view their own suggestions
- ✅ Users can insert their own suggestions
- ✅ Users can update their own suggestions
- ✅ Users can delete their own suggestions

**Purpose:** User-generated quest suggestions pending approval

---

### 31. **moderation_logs**
*Content moderation logs*

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| user_id | uuid | No | - | Content author |
| content_type | text | No | - | Type of content moderated |
| is_allowed | boolean | No | - | Content allowed |
| flagged | boolean | No | - | Content flagged |
| categories | text[] | Yes | - | Violation categories |
| confidence | numeric(3,2) | Yes | - | AI confidence |
| reason | text | Yes | - | Moderation reason |
| created_at | timestamp with time zone | Yes | now() | Moderation timestamp |

**RLS Policies:**
- ✅ Users can view their own logs
- ✅ Admins can view all logs
- ✅ System can insert logs

**Indexes:**
- idx_moderation_logs_user_id
- idx_moderation_logs_flagged

**Purpose:** Tracks content moderation decisions

---

## Enums

### app_role
User roles enum

**Values:**
- `admin` - Full system access
- `moderator` - Content moderation access
- `user` - Standard user access

**Usage:** Used in user_roles table and RLS policies

---

## Functions

### 1. **has_role(_user_id uuid, _role app_role)**
*Security definer function for role checking*

```sql
-- Returns boolean indicating if user has specified role
-- Used extensively in RLS policies to avoid recursion
```

**Purpose:** Safe role checking for RLS policies  
**Security:** SECURITY DEFINER  
**Search Path:** public

---

### 2. **add_xp_to_user(p_user_id uuid, p_xp integer, p_source text, p_description text)**
*Adds XP to user and handles level-ups*

**Parameters:**
- p_user_id: Target user
- p_xp: Amount of XP to add
- p_source: Source of XP (quest, achievement, etc.)
- p_description: Optional description

**Returns:** JSON object with:
- success (boolean)
- previous_xp (integer)
- previous_level (integer)
- new_xp (integer)
- new_level (integer)
- leveled_up (boolean)
- xp_added (integer)

**Logic:**
- Each level requires level * 100 XP
- Automatically calculates level-ups
- Logs transaction to xp_logs table

**Purpose:** Centralized XP management with automatic leveling  
**Security:** SECURITY DEFINER

---

### 3. **activate_powerup(p_user_powerup_id uuid)**
*Activates a user's power-up*

**Parameters:**
- p_user_powerup_id: Power-up to activate

**Returns:** JSON object with:
- success (boolean)
- activated_at (timestamp)
- expires_at (timestamp)
- error (string, if failed)

**Purpose:** Power-up activation with expiration  
**Security:** SECURITY DEFINER

---

### 4. **check_and_unlock_achievement(p_user_id uuid, p_achievement_id uuid)**
*Checks and unlocks achievement for user*

**Parameters:**
- p_user_id: Target user
- p_achievement_id: Achievement to unlock

**Returns:** Boolean (true if newly unlocked, false if already had)

**Logic:**
- Checks if already unlocked
- Awards XP reward
- Creates user_achievements record

**Purpose:** Achievement unlocking with XP rewards  
**Security:** SECURITY DEFINER  
**Search Path:** public

---

### 5. **archive_expired_quests()**
*Archives expired time-limited quests*

**Returns:** void

**Logic:**
- Sets is_active = false for expired quests
- Only affects quests with is_limited_time = true

**Purpose:** Automated quest expiration  
**Security:** SECURITY DEFINER

---

### 6. **update_ai_verification_timestamp()**
*Trigger function for ai_verifications*

**Returns:** Trigger

**Purpose:** Auto-updates updated_at column

---

### 7. **update_updated_at_column()**
*Generic trigger function for updated_at*

**Returns:** Trigger

**Purpose:** Auto-updates updated_at column  
**Search Path:** ''

---

### 8. **handle_new_user()**
*Trigger function for new user signup*

**Returns:** Trigger

**Logic:**
- Creates profile record when user signs up
- Extracts username and full_name from metadata

**Purpose:** Auto-create profiles on signup  
**Security:** SECURITY DEFINER  
**Search Path:** ''

---

## Triggers

### 1. **update_ai_verifications_timestamp**
- **Table:** ai_verifications
- **Event:** BEFORE UPDATE
- **Function:** update_ai_verification_timestamp()
- **Purpose:** Auto-update updated_at on modifications

---

### 2. **on_auth_user_created**
- **Table:** auth.users
- **Event:** AFTER INSERT
- **Function:** handle_new_user()
- **Purpose:** Create profile when user signs up

---

## Storage Buckets

### 1. **quest-submissions**
- **Public:** Yes
- **Purpose:** Stores quest submission photos
- **Policies:**
  - Authenticated users can upload
  - Public read access
  - Users can delete their own images

---

### 2. **community-images**
- **Public:** Yes
- **Purpose:** Stores community post images
- **Policies:**
  - Authenticated users can upload
  - Public read access
  - Users can delete their own images

---

### 3. **user-uploads**
- **Public:** Yes
- **Purpose:** General user uploads
- **Policies:**
  - Authenticated users can upload
  - Public read access
  - Users can delete their own images

---

### 4. **avatars**
- **Public:** Yes
- **Purpose:** User avatar images
- **Policies:**
  - Authenticated users can upload
  - Public read access
  - Users can update their own avatar

---

## Security

### Row Level Security (RLS)

**All tables have RLS enabled** with carefully designed policies:

**Key Security Patterns:**

1. **Role-Based Access:**
   - Uses `has_role()` security definer function
   - Prevents infinite recursion in RLS policies
   - Separates role storage from user profiles

2. **User Data Isolation:**
   - Users can only modify their own data
   - `auth.uid() = user_id` pattern throughout
   - Admin override capabilities where needed

3. **Public Read, Authenticated Write:**
   - Most content viewable by all
   - Creation requires authentication
   - Modification restricted to owners/admins

4. **System Operations:**
   - Special policies for system/edge function operations
   - `WITH CHECK (true)` for automated inserts
   - Used by AI verification and logging systems

### Secrets Management

**Configured Secrets:**
- GEMINI_API_KEY - AI operations
- SUPABASE_URL - Database connection
- SUPABASE_ANON_KEY - Public API key
- SUPABASE_SERVICE_ROLE_KEY - Admin operations
- SUPABASE_DB_URL - Direct database access
- HUGGINGFACE_API_KEY - Alternative AI models
- SUPABASE_PUBLISHABLE_KEY - Public operations

---

## Relationships Diagram

```
┌─────────────┐
│ auth.users  │ (Managed by Supabase)
└──────┬──────┘
       │
       ├──────> profiles (id references auth.users)
       │
       ├──────> user_roles (user_id references auth.users)
       │
       └──────> [All user-specific tables]

profiles
  ├──────> Submissions (user_id)
  ├──────> User Badges (user_id)
  ├──────> user_achievements (user_id)
  ├──────> user_challenges (user_id)
  ├──────> user_powerups (user_id)
  ├──────> community_posts (user_id)
  ├──────> community_post_comments (user_id)
  ├──────> community_post_likes (user_id)
  ├──────> post_comments (user_id)
  ├──────> post_likes (user_id)
  ├──────> post_shares (user_id)
  ├──────> crew_members (user_id)
  ├──────> team_members (user_id)
  ├──────> ai_generated_quests (user_id)
  └──────> suggested_quests (user_id)

Quests
  ├──────> Submissions (quest_id)
  ├──────> Badges (quest_id)
  ├──────> ai_verifications (quest_id)
  ├──────> event_quests (quest_id)
  └──────> team_quest_completions (quest_id)

Submissions
  ├──────> ai_verifications (submission_id)
  ├──────> ai_logs (submission_id)
  ├──────> post_comments (submission_id)
  ├──────> post_likes (submission_id)
  └──────> post_shares (submission_id)

community_posts
  ├──────> community_post_comments (post_id)
  └──────> community_post_likes (post_id)

crews
  └──────> crew_members (crew_id)

teams
  ├──────> team_members (team_id)
  └──────> team_quest_completions (team_id)

events
  └──────> event_quests (event_id)

Badges
  └──────> User Badges (badge_id)

achievements
  └──────> user_achievements (achievement_id)

challenges
  └──────> user_challenges (challenge_id)

powerups
  └──────> user_powerups (powerup_id)
```

---

## Database Health & Recommendations

### ✅ Strengths

1. **Comprehensive gamification system** with XP, levels, badges, achievements
2. **Advanced AI integration** for photo verification and content moderation
3. **Robust security** with RLS on all tables and security definer functions
4. **Rich social features** with likes, comments, shares, and crews
5. **Flexible quest system** supporting various types and difficulties
6. **Good indexing** on frequently queried columns
7. **Audit trails** via logs tables

### ⚠️ Areas for Improvement

1. **Data Duplication:**
   - Both `crews` and `teams` tables exist with similar functionality
   - Consider consolidating into single team system
   - `photo_url` and `image_urls` columns duplicated in multiple tables

2. **Missing Indexes:**
   - Consider indexes on `created_at` for time-based queries
   - Foreign key columns could use additional indexes

3. **Storage Optimization:**
   - Consider implementing image compression
   - Set up lifecycle policies for old submissions

4. **Data Retention:**
   - No clear retention policy for logs tables
   - Consider archiving old ai_logs and moderation_logs

5. **Foreign Keys:**
   - Some tables missing explicit foreign key constraints
   - Recommend adding for referential integrity

6. **Naming Consistency:**
   - Mix of PascalCase ("Quests", "Submissions") and snake_case
   - Consider standardizing to snake_case

### 🔄 Suggested Migrations

```sql
-- Consolidate teams/crews (future)
-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON "Submissions"(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_level ON profiles(level DESC);

-- Add foreign key constraints where missing
ALTER TABLE "User Badges" 
  ADD CONSTRAINT fk_user_badges_user 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "User Badges"
  ADD CONSTRAINT fk_user_badges_badge
  FOREIGN KEY (badge_id) REFERENCES "Badges"(id) ON DELETE CASCADE;
```

---

## Notes

- **Case Sensitivity:** Some tables use PascalCase (Quests, Submissions) requiring quoted identifiers
- **Timestamps:** Mix of `timestamp with time zone` and `timestamp without time zone` - standardize to `with time zone`
- **Auth Integration:** Tight integration with Supabase auth via triggers and foreign keys
- **Edge Functions:** Database designed to support Supabase edge functions for AI operations
- **Scalability:** Consider partitioning large tables (submissions, ai_logs) as data grows

---

**Last Updated:** 2025-11-01  
**Database Version:** PostgreSQL 15.x (Supabase)  
**Total Tables:** 31  
**Total Functions:** 8+  
**Total Storage Buckets:** 4
