# Discovery Atlas - Task Prompts for Next Development Phase

## 🎯 Purpose
This document contains detailed, ready-to-use prompts for implementing pending features in Discovery Atlas. Each prompt includes context, requirements, and implementation guidance.

---

## 📋 HIGH PRIORITY TASKS

### 1. EXIF Metadata Extraction (AI Verification Enhancement)
**Status:** Placeholder implementation needs completion  
**Priority:** 🔴 CRITICAL  
**Estimated Complexity:** Medium

#### Prompt:
```
Implement real EXIF metadata extraction for the AI photo verification system.

CONTEXT:
- The edge function `supabase/functions/ai-photo-verification/index.ts` currently has a placeholder for EXIF extraction
- We need to extract GPS coordinates, timestamps, and camera information from submitted photos
- This data is crucial for geofence validation and anti-spoofing checks

REQUIREMENTS:
1. Find a Deno-compatible EXIF parsing library (alternatives to exif-reader)
2. Extract the following metadata:
   - GPS coordinates (latitude, longitude)
   - Timestamp (DateTimeOriginal, DateTime)
   - Camera model and make
   - Image dimensions
   - ISO, aperture, shutter speed (optional, for authenticity checking)

3. Handle edge cases:
   - Images without EXIF data (stripped metadata)
   - Corrupted EXIF data
   - Various image formats (JPEG, PNG, HEIC)

4. Update the `extractExifData` function in the edge function
5. Log EXIF extraction results for debugging
6. Store extracted coordinates in the ai_verifications table

ACCEPTANCE CRITERIA:
- Successfully extracts GPS from photos with location data
- Returns gracefully when EXIF is missing
- Execution time < 500ms for EXIF parsing
- Integration works with existing geofence validation

TECHNICAL NOTES:
- Consider using `https://esm.sh/exifr` or similar Deno-compatible library
- Test with images from different sources (iPhone, Android, DSLR)
- Ensure EXIF GPS format conversion (DMS to decimal degrees)
```

---

### 2. Real-Time Notifications System
**Status:** Simple notifications exist, needs enhancement  
**Priority:** 🔴 HIGH  
**Estimated Complexity:** High

#### Prompt:
```
Build a comprehensive real-time notification system with push notifications and preferences.

CONTEXT:
- Users need to be notified about quest completions, badge earnings, comments, likes, and team activities
- Current notification center is basic (src/components/notifications/NotificationCenter.tsx)
- Need both in-app and push notification support

REQUIREMENTS:

1. DATABASE SCHEMA:
   Create a notifications table with:
   - id (uuid)
   - user_id (uuid) - recipient
   - type (enum: quest_approved, quest_rejected, badge_earned, comment_received, like_received, team_invite, challenge_completed)
   - title (text)
   - message (text)
   - related_id (uuid) - links to quest, submission, post, etc.
   - related_type (text) - quest, submission, post, comment, badge
   - is_read (boolean)
   - created_at (timestamp)
   
   Create a notification_preferences table with:
   - user_id (uuid)
   - email_notifications (boolean)
   - push_notifications (boolean)
   - quest_updates (boolean)
   - social_interactions (boolean)
   - team_activities (boolean)

2. BACKEND (Edge Function):
   Create `supabase/functions/send-notification/index.ts` that:
   - Accepts notification data
   - Stores in database
   - Triggers real-time subscription
   - Optionally sends push notification (Web Push API)
   - Respects user preferences

3. FRONTEND COMPONENTS:
   Update NotificationCenter to:
   - Show all notification types with icons
   - Mark as read functionality
   - Delete notifications
   - Filter by type
   - Real-time updates using Supabase subscriptions
   - "Mark all as read" button
   - Notification sound (toggle in preferences)

4. NOTIFICATION TRIGGERS:
   Add triggers in these flows:
   - Quest submission approved → notify user
   - Quest submission rejected → notify user
   - Badge earned → notify user
   - Comment on your post → notify post author
   - Like on your post → notify post author
   - Team invitation → notify invited user
   - Daily challenge reset → notify all users

5. PREFERENCES UI:
   Create a notification preferences section in settings where users can:
   - Enable/disable notifications by category
   - Toggle email notifications
   - Toggle push notifications
   - Set quiet hours

ACCEPTANCE CRITERIA:
- Real-time notifications appear instantly
- Users can manage preferences
- Notifications link to related content
- Badge counter shows unread count
- Mobile-responsive design
- RLS policies secure notification access

TECHNICAL NOTES:
- Use Supabase Realtime for instant updates
- Consider using Notification API for browser push
- Implement notification batching for high-volume users
- Add rate limiting to prevent spam
```

---

### 3. Enhanced Team Features (Chat + Challenges)
**Status:** Basic teams exist, needs chat and challenges  
**Priority:** 🟡 MEDIUM-HIGH  
**Estimated Complexity:** High

#### Prompt:
```
Implement team chat functionality and team challenges system.

CONTEXT:
- Teams exist with basic join/leave functionality
- Need to add communication (chat) and competitive features (team challenges)
- Should encourage team collaboration and engagement

REQUIREMENTS:

1. DATABASE SCHEMA:

   CREATE TABLE team_messages (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
     user_id uuid REFERENCES profiles(id),
     message text NOT NULL,
     reply_to uuid REFERENCES team_messages(id),
     attachments jsonb, -- URLs to images
     created_at timestamptz DEFAULT now()
   );

   CREATE TABLE team_challenges (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     title text NOT NULL,
     description text,
     quest_id uuid REFERENCES "Quests"(id),
     required_completions integer DEFAULT 5,
     start_date timestamptz,
     end_date timestamptz,
     reward_points integer,
     reward_badge_id uuid REFERENCES "Badges"(id),
     is_active boolean DEFAULT true,
     created_at timestamptz DEFAULT now()
   );

   CREATE TABLE team_challenge_progress (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     team_id uuid REFERENCES teams(id),
     challenge_id uuid REFERENCES team_challenges(id),
     completions integer DEFAULT 0,
     is_completed boolean DEFAULT false,
     completed_at timestamptz
   );

2. TEAM CHAT COMPONENT:
   Create `src/components/teams/TeamChat.tsx` with:
   - Real-time message display (Supabase subscriptions)
   - Send text messages
   - Upload images
   - Reply to messages (thread view)
   - User avatars and names
   - Typing indicators
   - Message timestamps
   - "Load more" pagination for old messages

3. TEAM CHALLENGES COMPONENT:
   Create `src/components/teams/TeamChallenges.tsx` with:
   - List of active team challenges
   - Progress bars showing completion %
   - Countdown timer for time-limited challenges
   - Reward information (points, badges)
   - Completed challenges archive
   - Team leaderboard for challenge completions

4. ADMIN FEATURES:
   Add to admin panel:
   - Create/edit team challenges
   - Set challenge rewards
   - Monitor team challenge progress
   - Assign challenges to specific teams or all teams

5. INTEGRATION:
   - Update team pages to include chat and challenges tabs
   - Send notifications when challenges are completed
   - Award points and badges automatically when team completes challenge
   - Track individual contributions to team challenges

ACCEPTANCE CRITERIA:
- Messages appear in real-time for all team members
- Image uploads work in chat
- Challenges track progress automatically when members complete quests
- Rewards are distributed when challenge is completed
- Mobile-responsive chat interface
- RLS policies ensure only team members see team chat

TECHNICAL NOTES:
- Use Supabase Realtime for instant message delivery
- Consider implementing read receipts later
- Add profanity filter for chat messages
- Implement message search functionality
- Rate limit message sending (max 10 messages per minute)
```

---

### 4. Progressive Web App (PWA) Features
**Status:** Not implemented  
**Priority:** 🟡 MEDIUM  
**Estimated Complexity:** Medium

#### Prompt:
```
Convert Discovery Atlas into a Progressive Web App (PWA) with offline capabilities.

CONTEXT:
- Users should be able to install the app on mobile devices
- Offline mode allows viewing cached quests and submissions
- Improves mobile user experience and engagement

REQUIREMENTS:

1. SERVICE WORKER:
   Create `public/service-worker.js` that:
   - Caches static assets (HTML, CSS, JS, images)
   - Implements cache-first strategy for static resources
   - Implements network-first strategy for API calls
   - Handles offline scenarios gracefully
   - Background sync for pending submissions

2. WEB APP MANIFEST:
   Create `public/manifest.json` with:
   - App name: "Discovery Atlas"
   - Short name: "Discovery"
   - Description
   - Icons (192x192, 512x512)
   - Theme color matching design system
   - Background color
   - Display mode: standalone
   - Start URL: /

3. OFFLINE FUNCTIONALITY:
   - Cache quest details for offline viewing
   - Queue submissions when offline (sync when online)
   - Show offline indicator in UI
   - Allow viewing cached community posts
   - Store user profile data locally

4. INSTALLATION PROMPT:
   Create a component that:
   - Detects if app is installable
   - Shows custom install prompt (instead of browser default)
   - Tracks installation analytics
   - Shows on second visit or after 30 seconds

5. UPDATES:
   - Detect when new version is available
   - Show "Update available" notification
   - Reload to apply updates

6. OFFLINE PAGE:
   Create a custom offline fallback page showing:
   - Friendly "You're offline" message
   - Cached content that's available
   - Tips for reconnecting

ACCEPTANCE CRITERIA:
- App installable on iOS and Android
- Works offline for viewing cached content
- Submissions queue and sync when back online
- Install prompt appears appropriately
- App icons and splash screen work correctly

TECHNICAL NOTES:
- Use Workbox for service worker management
- Test on multiple devices and browsers
- Consider IndexedDB for larger offline storage
- Implement background sync API for submission queue
- Add to vite.config.ts using vite-plugin-pwa
```

---

### 5. User Onboarding Flow
**Status:** Not implemented  
**Priority:** 🟡 MEDIUM  
**Estimated Complexity:** Medium

#### Prompt:
```
Create an interactive onboarding flow for new users to understand Discovery Atlas.

CONTEXT:
- New users need guidance on how to use the platform
- Should explain quests, submissions, badges, and social features
- Must be skippable but engaging

REQUIREMENTS:

1. DATABASE:
   Add to profiles table:
   - onboarding_completed (boolean, default false)
   - onboarding_step (integer, default 0)
   - onboarding_skipped (boolean, default false)

2. ONBOARDING SCREENS:
   Create `src/components/onboarding/OnboardingFlow.tsx` with 5 steps:

   STEP 1 - Welcome:
   - Hero image/animation
   - "Welcome to Discovery Atlas!" headline
   - Brief intro (1-2 sentences)
   - "Get Started" button

   STEP 2 - What are Quests:
   - Visual example of a quest card
   - Explain quest types (photography, nature, history, etc.)
   - Explain difficulty levels
   - Show quest details modal

   STEP 3 - How to Complete Quests:
   - Photo upload illustration
   - Explain submission process
   - Mention AI verification
   - Show example of approved submission

   STEP 4 - Earn Badges & Level Up:
   - Show badge gallery
   - Explain points and levels
   - Show leaderboard preview
   - Streak explanation

   STEP 5 - Join the Community:
   - Social features overview
   - Team creation/joining
   - Community posts
   - "Start Exploring" CTA

3. INTERACTIVE TUTORIAL:
   After onboarding, guide user through:
   - Creating their first post
   - Viewing their first quest
   - Customizing their profile

4. UI/UX:
   - Progress indicator (1 of 5, 2 of 5, etc.)
   - "Skip" button on all screens
   - "Back" button (except first screen)
   - Smooth animations between steps
   - Responsive design for mobile

5. TRIGGER:
   - Show automatically on first login
   - Add "Replay Tutorial" button in settings
   - Don't show if user skipped

ACCEPTANCE CRITERIA:
- Onboarding flows smoothly through all steps
- Can be skipped at any time
- Saves progress if interrupted
- Works on mobile and desktop
- Engaging animations and visuals
- Can be replayed from settings

TECHNICAL NOTES:
- Use Framer Motion for animations
- Consider using a library like react-joyride for interactive tooltips
- Store completion state in database
- Track analytics: completion rate, drop-off points
```

---

### 6. Enhanced Search with NLP (Natural Language Processing)
**Status:** Basic search exists, needs AI enhancement  
**Priority:** 🟢 LOW-MEDIUM  
**Estimated Complexity:** Medium

#### Prompt:
```
Implement AI-powered natural language quest search using existing edge function.

CONTEXT:
- Edge function `supabase/functions/ai-quest-search/index.ts` exists but not connected
- Users should search quests using natural language ("show me easy photo quests near me")
- Should understand intent, location, difficulty, type

REQUIREMENTS:

1. UPDATE EDGE FUNCTION:
   Enhance the existing edge function to:
   - Parse natural language query using Gemini API
   - Extract filters: type, difficulty, location, keywords
   - Query database with extracted filters
   - Rank results by relevance
   - Return interpretation of query for user feedback

   Example parsing:
   "easy photo quests in Delhi" →
   { type: "photography", difficulty: [1,2], location: "Delhi" }

2. FRONTEND COMPONENT:
   Update `src/components/search/SearchAndFilter.tsx` to:
   - Add "Natural Language Search" toggle
   - Show interpretation of query ("Showing easy photography quests in Delhi")
   - Display confidence score for interpretation
   - Fall back to standard search if interpretation fails
   - Show example queries as placeholder

3. SEARCH EXAMPLES:
   Support queries like:
   - "show me hard history quests"
   - "nature photography near me"
   - "quests I haven't completed yet"
   - "community service activities in my area"
   - "beginner friendly quests"

4. CACHING:
   - Cache common searches to reduce API calls
   - Store in localStorage with TTL (1 hour)

5. ANALYTICS:
   Track:
   - Most common search queries
   - Failed interpretations
   - Search → quest completion conversion

ACCEPTANCE CRITERIA:
- Accurately interprets 80%+ of natural language queries
- Falls back gracefully for unrecognized queries
- Shows user-friendly interpretation
- Response time < 2 seconds
- Works on mobile

TECHNICAL NOTES:
- Use Gemini 2.5 Flash for speed
- Implement query suggestion/autocomplete later
- Consider vector search for semantic matching
- Add spell correction for queries
```

---

## 📊 MEDIUM PRIORITY TASKS

### 7. Analytics Dashboard for Users
**Status:** Basic analytics exist, needs enhancement  
**Priority:** 🟢 MEDIUM  

#### Prompt:
```
Create a comprehensive user analytics dashboard showing engagement metrics and insights.

CONTEXT:
- Users want to see their progress and activity trends
- Basic analytics exist in `src/components/performance/AdvancedAnalytics.tsx`
- Need more insights: quest completion trends, badge progress, social engagement

REQUIREMENTS:

1. DATABASE VIEWS:
   Create database views for:
   - Daily/weekly/monthly quest completions
   - Points earned over time
   - Badge progress (% toward next badge)
   - Social engagement (likes, comments received)
   - Streak history
   - Quest type preferences

2. FRONTEND DASHBOARD:
   Create `src/pages/Analytics.tsx` with sections:

   SECTION 1 - Overview:
   - Total quests completed
   - Total points earned
   - Current level and XP progress bar
   - Badges earned / total badges
   - Current streak

   SECTION 2 - Activity Trends:
   - Line chart: quest completions over time (last 30 days)
   - Bar chart: quests by type
   - Heat map: activity by day of week

   SECTION 3 - Achievements:
   - Progress toward next badges (progress bars)
   - Recent achievements timeline
   - Rarest badges earned

   SECTION 4 - Social Stats:
   - Community posts created
   - Likes received
   - Comments received
   - Most popular post

   SECTION 5 - Comparisons:
   - Your rank vs friends
   - Your activity vs community average
   - Quest completion rate

3. DATA VISUALIZATION:
   - Use Recharts library (already installed)
   - Responsive charts
   - Interactive tooltips
   - Export data as CSV option

4. TIME RANGES:
   - Last 7 days, 30 days, 90 days, All time
   - Custom date range picker

ACCEPTANCE CRITERIA:
- All charts render correctly with real data
- Data updates in real-time
- Mobile-responsive layout
- Export functionality works
- Fast loading (< 2s for all charts)

TECHNICAL NOTES:
- Optimize database queries with proper indexes
- Consider caching analytics data
- Use React Query for data fetching
- Implement lazy loading for charts
```

---

### 8. Advanced Map Features
**Status:** Basic map exists, needs enhancements  
**Priority:** 🟢 MEDIUM  

#### Prompt:
```
Enhance the quest map with clustering, routes, heatmaps, and user location.

CONTEXT:
- Basic map exists at `src/pages/QuestMap.tsx`
- Need better UX for dense quest areas
- Users want to see nearby quests and popular areas

REQUIREMENTS:

1. MAP ENHANCEMENTS:
   
   A. QUEST CLUSTERING:
   - Group nearby quests when zoomed out
   - Show cluster count (e.g., "5 quests")
   - Expand cluster on click
   - Use Leaflet MarkerCluster plugin

   B. USER LOCATION:
   - Request geolocation permission
   - Show user's current location with custom marker
   - Add "Center on me" button
   - Show distance to quests from user location

   C. HEATMAP:
   - Show quest density heatmap
   - Toggle between marker view and heatmap view
   - Color gradient: blue (low) → red (high)
   - Use Leaflet.heat plugin

   D. FILTERS:
   - Filter by quest type (show/hide layers)
   - Filter by difficulty
   - Filter by completion status (completed, not completed)
   - Show only quests within X km

2. QUEST MARKERS:
   - Custom icons by quest type (camera, tree, monument, etc.)
   - Color-coded by difficulty (green=easy, yellow=medium, red=hard)
   - Popup shows quest preview (title, image, difficulty)
   - Click popup to go to quest detail

3. NEARBY QUESTS:
   - Create sidebar showing quests sorted by distance
   - "Navigate" button opens maps app with directions
   - Estimated distance and time

4. QUEST ROUTES:
   - Admin can create quest routes (sequence of quests)
   - Show route as polyline on map
   - "Start Route" button opens route mode
   - Track progress through route

5. PERFORMANCE:
   - Virtualize markers (only render visible ones)
   - Lazy load quest details
   - Cache map tiles

ACCEPTANCE CRITERIA:
- Map is fast and responsive (60fps)
- Clustering works smoothly at all zoom levels
- User location is accurate
- Filters work instantly
- Mobile-friendly controls

TECHNICAL NOTES:
- Use Leaflet plugins: MarkerCluster, Leaflet.heat
- Consider Mapbox for better performance
- Implement custom tile layer for offline mode
- Add loading skeleton for map
```

---

### 9. Content Moderation System
**Status:** Edge function exists but not integrated  
**Priority:** 🟢 MEDIUM  

#### Prompt:
```
Integrate AI content moderation for posts, comments, and submissions using existing edge function.

CONTEXT:
- Edge function `supabase/functions/ai-content-moderation/index.ts` exists
- Need to protect against spam, abuse, and inappropriate content
- Should work in real-time before content is posted

REQUIREMENTS:

1. DATABASE SCHEMA:
   CREATE TABLE moderated_content (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     content_type text, -- 'post', 'comment', 'submission_description'
     content_id uuid,
     user_id uuid REFERENCES profiles(id),
     content_text text,
     is_flagged boolean DEFAULT false,
     flag_reason text,
     confidence_score float,
     auto_blocked boolean DEFAULT false,
     reviewed_by uuid REFERENCES profiles(id),
     reviewed_at timestamptz,
     created_at timestamptz DEFAULT now()
   );

2. INTEGRATION POINTS:

   A. COMMUNITY POSTS:
   - Call moderation before creating post
   - Block posts with high toxicity (confidence > 0.8)
   - Flag posts with medium toxicity (0.5-0.8) for review
   - Allow posts with low toxicity (< 0.5)

   B. COMMENTS:
   - Same logic as posts
   - Real-time moderation (shouldn't delay posting)

   C. SUBMISSION DESCRIPTIONS:
   - Moderate when submission is created
   - Less strict than posts (allow more flexibility)

3. USER FEEDBACK:
   - Show friendly error when content blocked: "Your message contains inappropriate language"
   - Allow user to edit and resubmit
   - Don't specify exact words flagged

4. ADMIN MODERATION QUEUE:
   Create admin panel section showing:
   - All flagged content (not auto-blocked)
   - Option to approve or reject
   - Ban user option for repeat offenders
   - Whitelist certain phrases (false positives)

5. REPORTING:
   - Users can report content
   - Reported content goes to moderation queue
   - Track reporter accuracy (prevent abuse)

ACCEPTANCE CRITERIA:
- < 1% false positive rate (good content blocked)
- > 95% catch rate for actual violations
- Response time < 1 second
- Appeals process for blocked users
- Admin dashboard functional

TECHNICAL NOTES:
- Use Gemini API for content analysis
- Implement rate limiting on moderation API
- Cache moderation results for duplicate content
- Consider using perspective API as backup
```

---

## 🔄 REFACTORING & OPTIMIZATION TASKS

### 10. Code Refactoring - Break Down Large Files
**Status:** Multiple large files need splitting  
**Priority:** 🟢 LOW-MEDIUM  

#### Prompt:
```
Refactor large components and services into smaller, focused modules.

IDENTIFIED LARGE FILES:
1. src/services/aiEnhancements.ts (223 lines) - Split into separate service files
2. PROJECT_STATUS.md (373 lines) - Split into focused docs

TASK 1 - SPLIT AI SERVICES:

Current structure:
```
src/services/aiEnhancements.ts
├── AI Photo Verification
├── Content Moderation  
├── NLP Search
├── Quest Image Generation
└── Quest Suggestions
```

New structure:
```
src/services/ai/
├── photoVerification.ts
├── contentModeration.ts
├── questSearch.ts
├── imageGeneration.ts
├── questSuggestions.ts
├── types.ts (shared interfaces)
└── index.ts (re-exports)
```

REQUIREMENTS:
- Each service in its own file
- Shared types in types.ts
- Update all imports across codebase
- Maintain backward compatibility
- Add JSDoc comments to each service

TASK 2 - SPLIT PROJECT STATUS:

New structure:
```
docs/
├── README.md (overview)
├── FEATURES.md (completed features)
├── ROADMAP.md (pending features)
├── ARCHITECTURE.md (technical stack)
└── METRICS.md (completion status)
```

ACCEPTANCE CRITERIA:
- No broken imports
- All tests pass
- Improved code readability
- Easier to navigate codebase
- Documentation is more organized
```

---

### 11. Implement Proper EXIF Library for Deno
**Status:** Currently placeholder  
**Priority:** 🔴 CRITICAL (Blocker for AI verification)  

#### Prompt:
```
Research and implement a working EXIF extraction solution for Deno edge functions.

CONTEXT:
- Current implementation has a placeholder for EXIF extraction
- exif-reader library doesn't work well with Deno
- Critical for AI photo verification geofence validation

TASK:

1. RESEARCH PHASE:
   Evaluate these options:
   - https://esm.sh/exifr (recommended)
   - https://deno.land/x/exif
   - Pure JavaScript EXIF parser
   - Native Deno EXIF module

2. REQUIREMENTS:
   Must support:
   - GPS coordinate extraction (lat/lon)
   - DateTime extraction
   - Camera model extraction
   - Works with JPEG, PNG, HEIC
   - Fast (< 500ms per image)
   - Compatible with Deno runtime

3. IMPLEMENTATION:
   - Install and configure chosen library
   - Update extractExifData function
   - Handle coordinate format conversion (DMS → decimal)
   - Add proper error handling
   - Add extensive logging

4. TESTING:
   Test with images from:
   - iPhone (various models)
   - Android phones
   - DSLR cameras
   - Images with stripped EXIF
   - Various image formats

5. FALLBACK:
   - If no library works, implement basic EXIF parser
   - Focus on GPS and DateTime tags only
   - Use DataView to read EXIF binary data

ACCEPTANCE CRITERIA:
- Successfully extracts GPS from 90%+ of photos with location data
- No errors when EXIF is missing
- Works in production (Supabase edge function)
- Comprehensive test coverage

DELIVERABLES:
- Working EXIF extraction
- Test suite with sample images
- Documentation on chosen approach
```

---

## 📱 MOBILE & UX IMPROVEMENTS

### 12. Camera Integration Improvements
**Status:** Basic upload works, needs enhancement  
**Priority:** 🟡 MEDIUM  

#### Prompt:
```
Improve mobile camera integration for quest submissions.

CONTEXT:
- Mobile upload test exists at src/pages/MobileTest.tsx
- Need better UX for taking photos directly in app
- Should auto-capture location metadata

REQUIREMENTS:

1. CAMERA COMPONENT:
   Create `src/components/camera/CameraCapture.tsx`:
   - Access device camera directly
   - Show live camera preview
   - Capture button with feedback
   - Switch front/back camera
   - Flash toggle
   - Grid overlay (rule of thirds)

2. LOCATION CAPTURE:
   - Request location permission when opening camera
   - Embed GPS coordinates in EXIF before upload
   - Show location accuracy indicator
   - "Use current location" vs "Pick on map" options

3. IMAGE EDITING:
   - Crop/rotate before upload
   - Basic filters (optional)
   - Compress large images
   - Preview before submitting

4. OFFLINE QUEUE:
   - Save photos locally if offline
   - Auto-upload when connection restored
   - Show pending uploads counter

5. PERMISSIONS HANDLING:
   - Clear UI for requesting permissions
   - Explain why permissions needed
   - Fallback to file picker if camera denied
   - Settings deep link if permissions denied

ACCEPTANCE CRITERIA:
- Works on iOS Safari and Android Chrome
- Photos include accurate GPS data
- Smooth camera preview (30fps)
- Image compression reduces file size by 50%+
- Offline mode works correctly

TECHNICAL NOTES:
- Use getUserMedia API
- Use Geolocation API
- Consider using Compressor.js for image compression
- Test on actual devices (not just simulators)
```

---

## 🎮 GAMIFICATION ENHANCEMENTS

### 13. Daily & Weekly Challenges System
**Status:** Database table exists, needs frontend  
**Priority:** 🟡 MEDIUM  

#### Prompt:
```
Implement daily and weekly challenge system to boost user engagement.

CONTEXT:
- Daily challenges table exists in database
- Edge function `supabase/functions/reset-daily-challenges/index.ts` exists
- Need frontend to display and track challenges

REQUIREMENTS:

1. DATABASE (Already exists but verify):
   - daily_challenges table
   - user_daily_progress table
   - Challenge types: complete_quests, earn_points, social_interaction, etc.

2. CHALLENGE GENERATION LOGIC:
   Update edge function to generate varied challenges:
   - Easy: Complete 1 quest (30 points)
   - Medium: Complete 3 quests (100 points)
   - Hard: Complete 5 hard quests (300 points)
   - Social: Like 5 posts (50 points)
   - Weekly: Complete 10 quests this week (500 points + badge)

3. FRONTEND COMPONENT:
   Create `src/components/challenges/DailyChallenges.tsx`:
   - Show today's 3 daily challenges
   - Show this week's challenge
   - Progress bars for each
   - Countdown timer until reset
   - Claim rewards button when completed
   - Challenge history (last 7 days)

4. CHALLENGE CARDS:
   - Icon based on challenge type
   - Title and description
   - Progress (e.g., "2/3 quests completed")
   - Reward info (points, XP, badge)
   - Animated when completed

5. NOTIFICATIONS:
   - Notify when new challenges available
   - Notify when challenge completed
   - Remind if challenges expiring soon (< 2 hours)

6. STREAK BONUS:
   - Track consecutive days completing all challenges
   - Bonus rewards for 7-day, 30-day streaks
   - Display streak counter

ACCEPTANCE CRITERIA:
- Challenges reset daily at midnight (user's timezone)
- Progress tracks correctly
- Rewards are awarded automatically
- Mobile-responsive design
- Engaging animations

TECHNICAL NOTES:
- Use Supabase Realtime for progress updates
- Schedule edge function with Supabase cron
- Consider challenge variety algorithm
- Add achievements for challenge streaks
```

---

### 14. Seasonal Events System
**Status:** Not implemented  
**Priority:** 🟢 LOW  

#### Prompt:
```
Create a seasonal events system for special limited-time quests and rewards.

CONTEXT:
- Drive engagement during holidays and special occasions
- Offer exclusive badges and rewards
- Create FOMO (fear of missing out) to boost participation

REQUIREMENTS:

1. DATABASE SCHEMA:
   CREATE TABLE seasonal_events (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     name text NOT NULL,
     description text,
     theme text, -- 'halloween', 'christmas', 'summer', etc.
     start_date timestamptz,
     end_date timestamptz,
     banner_image text,
     exclusive_badge_id uuid REFERENCES "Badges"(id),
     bonus_points_multiplier float DEFAULT 1.5,
     is_active boolean DEFAULT true
   );

   CREATE TABLE event_quests (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     event_id uuid REFERENCES seasonal_events(id),
     quest_id uuid REFERENCES "Quests"(id),
     display_order integer
   );

2. EVENT TYPES:
   - Holiday Events (Christmas, Halloween, Diwali, etc.)
   - Seasonal Events (Summer Adventure, Winter Quest)
   - Community Events (1M quests completed celebration)
   - Competition Events (Team vs Team)

3. FRONTEND:
   Create `src/components/events/SeasonalEvent.tsx`:
   - Event banner on home page
   - Event details page with theme
   - List of event-specific quests
   - Progress toward event badge
   - Countdown timer
   - Leaderboard for event (top participants)

4. EVENT MECHANICS:
   - Bonus points during event (1.5x-2x)
   - Exclusive event badge for completing X event quests
   - Special event quest types
   - Limited-time power-ups

5. ADMIN FEATURES:
   - Create/schedule events
   - Upload themed assets
   - Activate/deactivate events
   - Monitor participation

6. NOTIFICATIONS:
   - Event starting soon
   - Event ending in 24 hours
   - New event quest available
   - Event badge earned

ACCEPTANCE CRITERIA:
- Events activate/deactivate automatically
- Exclusive rewards work correctly
- Themed UI elements match event
- Past events are archived
- Analytics track event performance

TECHNICAL NOTES:
- Use Supabase cron for event activation
- Archive old events (don't delete)
- Consider internationalization for event names
- Prepare event templates for quick setup
```

---

## 🔒 SECURITY & PRIVACY

### 15. Two-Factor Authentication (2FA)
**Status:** Not implemented  
**Priority:** 🟢 LOW-MEDIUM  

#### Prompt:
```
Implement two-factor authentication for enhanced account security.

CONTEXT:
- Users with valuable accounts need extra security
- Supabase Auth supports 2FA
- Should be optional but encouraged

REQUIREMENTS:

1. SETUP FLOW:
   Create `src/components/settings/TwoFactorSetup.tsx`:
   - Generate QR code for authenticator app
   - Show backup codes (8 codes)
   - Verify setup with test code
   - Store 2FA enabled status in profile

2. LOGIN FLOW:
   Update login page:
   - If 2FA enabled, show code input after password
   - Support backup codes
   - "Lost device?" recovery flow

3. RECOVERY:
   - Generate 8 backup codes during setup
   - Allow regenerating backup codes
   - Each backup code single-use
   - Require email verification to disable 2FA

4. SETTINGS:
   Add to security settings:
   - Enable/Disable 2FA toggle
   - View backup codes
   - Regenerate backup codes
   - Trusted devices list (optional)

5. NOTIFICATIONS:
   Notify user when:
   - 2FA enabled
   - 2FA disabled
   - Backup code used
   - Unknown device login (if 2FA enabled)

ACCEPTANCE CRITERIA:
- Works with Google Authenticator, Authy
- Backup codes work correctly
- Can't disable without verification
- Recovery flow works
- Mobile-friendly QR code

TECHNICAL NOTES:
- Use Supabase Auth MFA API
- Consider SMS backup (future)
- Add rate limiting on code verification
- Test extensively with different authenticator apps
```

---

## 📊 ANALYTICS & MONITORING

### 16. Admin Metrics Dashboard
**Status:** Basic admin panel exists  
**Priority:** 🟡 MEDIUM  

#### Prompt:
```
Build a comprehensive admin dashboard with key metrics and insights.

CONTEXT:
- Admins need visibility into platform health
- Current admin panel is basic
- Need metrics for users, quests, engagement

REQUIREMENTS:

1. METRICS TO TRACK:

   USER METRICS:
   - Total users, active users (daily/weekly/monthly)
   - New signups (graph over time)
   - User retention rate
   - Average session duration
   - Churn rate

   QUEST METRICS:
   - Total quests, active quests
   - Quest completion rate
   - Average time to complete
   - Most popular quest types
   - Quest submissions pending review

   ENGAGEMENT METRICS:
   - Daily active users (DAU)
   - Posts created per day
   - Comments per day
   - Likes per day
   - Average posts per user

   AI METRICS:
   - Total AI verifications
   - Verification success rate
   - Average verification time
   - AI cost per verification
   - False positive/negative rate

2. DASHBOARD LAYOUT:
   Create `src/pages/AdminDashboard.tsx`:

   SECTION 1 - Overview (KPIs):
   - 4 key metrics cards (users, quests, submissions, engagement)
   - Each with trend indicator (↑↓)

   SECTION 2 - Growth Charts:
   - User growth over time (line chart)
   - Quest completions over time (line chart)
   - Active users (last 30 days, bar chart)

   SECTION 3 - Engagement:
   - Posts/comments/likes per day (area chart)
   - Top contributors (leaderboard)
   - Most active teams

   SECTION 4 - Content:
   - Pending submissions count (with link)
   - Flagged content (with link)
   - Recently created quests

   SECTION 5 - AI Performance:
   - Verification stats
   - Cost tracking
   - Error rate

3. REAL-TIME UPDATES:
   - Auto-refresh every 30 seconds
   - Live activity feed (last 10 actions)
   - Alert badges for pending items

4. FILTERS:
   - Date range selector
   - Quest type filter
   - User segment filter (new, active, churned)

5. EXPORT:
   - Export metrics as CSV
   - Generate PDF report
   - Schedule email reports

ACCEPTANCE CRITERIA:
- All metrics accurate
- Charts render quickly (< 2s)
- Mobile-responsive
- Real-time updates work
- Export functions work

TECHNICAL NOTES:
- Cache metrics data (refresh every 5 min)
- Use database views for complex queries
- Implement query optimization
- Consider using a dedicated analytics database
```

---

## 🌐 INTERNATIONALIZATION

### 17. Multi-Language Support
**Status:** Not implemented  
**Priority:** 🟢 LOW  

#### Prompt:
```
Add internationalization (i18n) support for multiple languages.

CONTEXT:
- Expand to non-English speaking markets
- Start with Hindi, Spanish, French
- Should be easy to add more languages

REQUIREMENTS:

1. SETUP i18n:
   Install and configure react-i18next:
   - Create language files (en.json, hi.json, es.json, fr.json)
   - Set up language detection
   - Language switcher in settings

2. TRANSLATION FILES:
   Structure:
   ```json
   {
     "common": {
       "welcome": "Welcome",
       "login": "Login",
       "signup": "Sign Up"
     },
     "quest": {
       "title": "Quests",
       "complete": "Complete Quest",
       "difficulty": "Difficulty"
     },
     "navigation": { ... },
     "errors": { ... }
   }
   ```

3. IMPLEMENTATION:
   - Wrap all user-facing text with t() function
   - Use Trans component for complex strings
   - Format dates/numbers based on locale
   - RTL support for Arabic (future)

4. LANGUAGE SWITCHER:
   Create dropdown in:
   - Settings page
   - Profile menu
   - Landing page footer

5. DATABASE:
   Add to profiles:
   - preferred_language (text)
   
   For user-generated content:
   - Store in original language
   - Option to auto-translate (future)

6. INITIAL LANGUAGES:
   - English (en) - 100%
   - Hindi (hi) - translate
   - Spanish (es) - translate
   - French (fr) - translate

ACCEPTANCE CRITERIA:
- All UI text translates correctly
- Language persists across sessions
- Dates/numbers formatted correctly
- Works on mobile
- No untranslated strings visible

TECHNICAL NOTES:
- Use professional translation service
- Consider community translations later
- Test with native speakers
- Implement lazy loading for translations
- Add CI check for missing translations
```

---

## 🎨 UI/UX POLISH

### 18. Accessibility Improvements (A11y)
**Status:** Basic accessibility, needs enhancement  
**Priority:** 🟡 MEDIUM  

#### Prompt:
```
Improve accessibility to WCAG 2.1 AA standards.

AUDIT AREAS:

1. KEYBOARD NAVIGATION:
   - All interactive elements reachable via Tab
   - Focus visible (outline on focused elements)
   - Logical tab order
   - Skip to content link
   - Escape key closes modals

2. SCREEN READER SUPPORT:
   - Add ARIA labels to all interactive elements
   - ARIA landmarks (nav, main, aside)
   - ARIA live regions for dynamic content
   - Alt text for all images
   - Form labels properly associated

3. COLOR CONTRAST:
   - Text contrast ratio ≥ 4.5:1 (AA standard)
   - Check in both light and dark modes
   - Focus indicators high contrast
   - Don't rely on color alone for info

4. TEXT & READABILITY:
   - Font size ≥ 16px
   - Line height ≥ 1.5
   - Paragraph width ≤ 80 characters
   - Text resizable up to 200%
   - No text in images (use alt text)

5. FORMS:
   - Clear error messages
   - Inline validation feedback
   - Required fields marked
   - Error summary at top of form

6. INTERACTIVE ELEMENTS:
   - Buttons ≥ 44x44px (touch target)
   - Loading states announced
   - Success/error feedback
   - Tooltip on hover + focus

IMPLEMENTATION TASKS:

1. Install and run accessibility audit tools:
   - axe DevTools
   - Lighthouse accessibility audit
   - WAVE browser extension

2. Fix all critical and serious issues

3. Add ARIA attributes:
   ```tsx
   <button aria-label="Complete quest">
   <nav aria-label="Main navigation">
   <div role="alert" aria-live="polite">
   ```

4. Update theme for contrast:
   - Check all color combinations
   - Update design tokens if needed

5. Test with:
   - Screen reader (NVDA, JAWS, VoiceOver)
   - Keyboard only (no mouse)
   - Browser zoom at 200%

6. Create accessibility statement page

ACCEPTANCE CRITERIA:
- Lighthouse accessibility score ≥ 90
- Zero critical axe violations
- Usable with keyboard only
- Usable with screen reader
- WCAG 2.1 AA compliant

DELIVERABLES:
- Accessibility audit report
- Fixed issues list
- Testing documentation
- Accessibility statement
```

---

## 🚀 PERFORMANCE OPTIMIZATION

### 19. Performance Optimization Sprint
**Status:** Ongoing need  
**Priority:** 🟡 MEDIUM  

#### Prompt:
```
Optimize application performance for faster load times and better UX.

AUDIT CURRENT PERFORMANCE:

1. RUN LIGHTHOUSE:
   - Performance score (target: ≥90)
   - Identify bottlenecks
   - Document findings

OPTIMIZATION TASKS:

1. CODE SPLITTING:
   - Lazy load route components
   - Dynamic imports for heavy components
   - Vendor bundle optimization

   ```tsx
   const AdminPanel = lazy(() => import('./pages/Admin'));
   ```

2. IMAGE OPTIMIZATION:
   - Use WebP format where supported
   - Implement progressive loading
   - Add blur placeholders
   - Lazy load images below fold
   - Responsive images (srcset)

3. BUNDLE SIZE:
   - Analyze bundle with webpack-bundle-analyzer
   - Remove unused dependencies
   - Tree-shake lodash (use lodash-es)
   - Replace heavy libraries with lighter alternatives

4. API OPTIMIZATION:
   - Implement request caching (React Query)
   - Debounce search queries
   - Paginate long lists
   - Reduce payload size (select only needed fields)

5. RENDERING OPTIMIZATION:
   - Memoize expensive computations
   - Use React.memo for pure components
   - Virtualize long lists (react-window)
   - Avoid unnecessary re-renders

6. FONTS:
   - Preload critical fonts
   - Use font-display: swap
   - Subset fonts (only needed characters)

7. DATABASE:
   - Add indexes to frequently queried columns
   - Optimize complex queries
   - Use database views for complex joins
   - Implement connection pooling

8. CACHING:
   - Cache static assets (1 year)
   - Cache API responses (React Query)
   - Service worker caching (PWA)
   - CDN for images

MONITORING:

1. Add performance monitoring:
   - Core Web Vitals tracking
   - LCP, FID, CLS metrics
   - Custom performance marks
   - Error tracking (Sentry)

2. Set up alerts for:
   - LCP > 2.5s
   - FID > 100ms
   - CLS > 0.1
   - Bundle size increase > 10%

ACCEPTANCE CRITERIA:
- Lighthouse Performance ≥ 90
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1
- Bundle size < 500KB (initial)
- Time to Interactive < 3s

DELIVERABLES:
- Before/after performance comparison
- List of optimizations implemented
- Performance monitoring dashboard
```

---

## 📝 DOCUMENTATION

### 20. Comprehensive Developer Documentation
**Status:** Basic docs exist  
**Priority:** 🟢 LOW  

#### Prompt:
```
Create thorough documentation for developers working on Discovery Atlas.

DOCUMENTATION STRUCTURE:

/docs
├── README.md (overview)
├── SETUP.md (local development)
├── ARCHITECTURE.md (system design)
├── API.md (backend endpoints)
├── COMPONENTS.md (component library)
├── DEPLOYMENT.md (production deployment)
├── CONTRIBUTING.md (contribution guidelines)
└── TROUBLESHOOTING.md (common issues)

CONTENT FOR EACH:

1. SETUP.md:
   - Prerequisites (Node, Supabase CLI)
   - Clone and install steps
   - Environment variables
   - Database setup
   - Run locally
   - Run tests

2. ARCHITECTURE.md:
   - System overview diagram
   - Tech stack rationale
   - Folder structure
   - Design patterns used
   - State management
   - Database schema diagram
   - Authentication flow
   - AI verification flow

3. API.md:
   - All Edge Functions documented
   - Request/response examples
   - Authentication requirements
   - Error codes
   - Rate limits

4. COMPONENTS.md:
   - Component catalog
   - Props documentation
   - Usage examples
   - Storybook setup (future)

5. DEPLOYMENT.md:
   - CI/CD pipeline
   - Environment setup
   - Database migrations
   - Edge function deployment
   - Rollback procedures
   - Monitoring setup

6. CONTRIBUTING.md:
   - Code style guide
   - Git workflow (branches, PRs)
   - Commit message format
   - Testing requirements
   - Review process

7. TROUBLESHOOTING.md:
   - Common errors and solutions
   - Debug tips
   - Known issues
   - FAQ

ADD CODE EXAMPLES:
- Include code snippets in docs
- Use syntax highlighting
- Show both good and bad examples
- Link to actual code files

ACCEPTANCE CRITERIA:
- All sections complete
- Code examples tested
- Diagrams included
- Easy to navigate
- Kept up to date

TOOLS:
- Use Mermaid for diagrams
- Use Markdown for all docs
- Consider Docusaurus for docs site (future)
```

---

## 🎯 QUICK WINS (Low effort, high impact)

### 21. Dark Mode Improvements
**Prompt:** "Audit and fix dark mode color contrast issues. Check all components in dark mode and ensure text is readable."

### 22. Loading Skeletons
**Prompt:** "Add skeleton loading states to all data fetching components (quest cards, user profiles, leaderboard, etc.) for better perceived performance."

### 23. Error Boundaries
**Prompt:** "Implement React Error Boundaries for graceful error handling. Show friendly error messages instead of white screen."

### 24. Toast Notifications Standardization
**Prompt:** "Standardize all success/error messages to use toast notifications consistently across the app."

### 25. Mobile Bottom Navigation
**Prompt:** "Add a sticky bottom navigation bar for mobile with quick access to Home, Quests, Community, Profile."

---

## 📊 TASK PRIORITIZATION MATRIX

### CRITICAL (Do First):
1. ✅ EXIF Metadata Extraction (Blocker)
2. Real-Time Notifications System
3. Code Refactoring (Large Files)

### HIGH PRIORITY (Do Next):
4. Enhanced Team Features
5. Progressive Web App
6. User Onboarding Flow
7. Camera Integration Improvements

### MEDIUM PRIORITY:
8. Analytics Dashboard
9. Advanced Map Features
10. Content Moderation Integration
11. Daily Challenges UI
12. Admin Metrics Dashboard
13. Accessibility Improvements
14. Performance Optimization

### LOW PRIORITY (Nice to Have):
15. NLP Search Integration
16. Seasonal Events
17. Two-Factor Authentication
18. Multi-Language Support
19. Developer Documentation

### QUICK WINS (Do Anytime):
20-25. Dark mode, loading skeletons, error boundaries, etc.

---

## 📈 ESTIMATED TIMELINE

**Sprint 1 (Week 1-2): Critical Fixes**
- EXIF extraction
- Code refactoring
- Build error fixes

**Sprint 2 (Week 3-4): User Engagement**
- Notifications system
- Team chat
- PWA setup

**Sprint 3 (Week 5-6): Onboarding & UX**
- User onboarding
- Camera improvements
- Mobile navigation

**Sprint 4 (Week 7-8): Gamification**
- Daily challenges UI
- Seasonal events setup
- Analytics dashboard

**Sprint 5 (Week 9-10): Polish & Optimization**
- Accessibility
- Performance optimization
- Documentation

---

## 💡 USAGE INSTRUCTIONS

1. Copy the relevant prompt from this document
2. Paste into Lovable chat
3. AI will implement the feature
4. Review and test
5. Mark as complete in PROJECT_STATUS.md
6. Move to next task

---

**Last Updated:** [Current Date]
**Version:** 1.0
**Total Tasks:** 25+
