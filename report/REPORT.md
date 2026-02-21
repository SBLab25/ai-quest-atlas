# 📋 Discovery Atlas — Comprehensive Project Report

> **Generated:** 2026-02-21  
> **Project:** Discovery Atlas (Adventure Camp)  
> **Platform:** Lovable + Supabase  
> **Status:** Production-Ready (Beta) — ~90% Feature Complete

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Tech Stack](#2-current-tech-stack)
3. [Project Architecture](#3-project-architecture)
4. [Database Schema & Relationships](#4-database-schema--relationships)
5. [Frontend Analysis](#5-frontend-analysis)
6. [Backend Analysis (Edge Functions)](#6-backend-analysis-edge-functions)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [AI Integration Analysis](#8-ai-integration-analysis)
9. [Feature Inventory (Complete)](#9-feature-inventory-complete)
10. [Build Errors & Bugs](#10-build-errors--bugs)
11. [Security Audit](#11-security-audit)
12. [Performance Analysis](#12-performance-analysis)
13. [Pending Tasks & Improvements](#13-pending-tasks--improvements)
14. [Upcoming Features](#14-upcoming-features)
15. [Future Tech Stack Recommendations](#15-future-tech-stack-recommendations)
16. [AI & Agentic AI Implementation Roadmap](#16-ai--agentic-ai-implementation-roadmap)
17. [Risk Assessment](#17-risk-assessment)
18. [Recommendations & Roadmap](#18-recommendations--roadmap)

---

## 1. Executive Summary

**Discovery Atlas** is a gamified, location-based quest and social exploration platform. Users complete real-world quests (photography, nature, history, social interaction), earn badges, XP, and NFTs, compete on leaderboards, and interact through a community feed with teams/crews. The platform leverages AI for photo verification, quest generation, content moderation, and deepfake detection.

### Key Metrics
| Metric | Value |
|--------|-------|
| Total Pages/Routes | 16 |
| React Components | ~90+ |
| Custom Hooks | 20+ |
| Edge Functions | 17 |
| Database Tables | 35+ |
| RLS Policies | 70+ |
| DB Functions | 30+ |
| Storage Buckets | 4 |

---

## 2. Current Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.3.1 | UI Framework |
| TypeScript | Latest | Type Safety |
| Vite | Latest | Build Tool (via `@vitejs/plugin-react-swc`) |
| Tailwind CSS | Latest | Utility-first CSS |
| shadcn/ui (Radix UI) | Multiple | Component Library (30+ components) |
| Framer Motion | 12.23.12 | Animations |
| React Router DOM | 6.26.2 | Client-side Routing |
| TanStack React Query | 5.56.2 | Server State Management |
| Recharts | 2.12.7 | Data Visualization |
| Leaflet + React Leaflet | 1.9.4 / 4.2.1 | Maps |
| Leaflet.heat / Leaflet.markercluster | Latest | Map Plugins |
| Three.js | 0.181.0 | 3D Graphics (shader backgrounds) |
| GSAP | 3.13.0 | Advanced Animations |
| Lottie (@lottiefiles/dotlottie-react) | 0.17.6 | Loading Animations |
| date-fns / date-fns-tz | 3.x | Date Utilities |
| Zod | 3.23.8 | Schema Validation |
| React Hook Form | 7.53.0 | Form Management |
| Sonner | 1.5.0 | Toast Notifications |
| Embla Carousel | 8.3.0 | Carousel Component |
| Vaul | 0.9.3 | Drawer Component |
| next-themes | 0.4.6 | Theme Management |
| cmdk | 1.0.0 | Command Palette |
| input-otp | 1.2.4 | OTP Input |

### Backend
| Technology | Purpose |
|-----------|---------|
| Supabase (PostgreSQL) | Database, Auth, Storage, Realtime |
| Supabase Edge Functions (Deno) | Serverless Backend Logic |
| Lovable AI Gateway | AI Model Access (Gemini, GPT-5) |
| Google Gemini API | Direct AI Calls (photo verification, quest generation) |
| Groq API | Fast LLM Inference |
| HuggingFace API | Deepfake Detection Models |

### Infrastructure
| Technology | Purpose |
|-----------|---------|
| Lovable Platform | Development & Hosting |
| Supabase Cloud | Backend-as-a-Service |
| Vercel (configured) | Alternative Deployment |
| Capacitor (configured) | Native Mobile Wrapper |
| PWA | Progressive Web App Support |

### Blockchain / Web3
| Technology | Purpose |
|-----------|---------|
| Optimism Sepolia (L2 Testnet) | NFT Minting Chain |
| Custom NFT Smart Contract | Achievement NFTs |

---

## 3. Project Architecture

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (React SPA)                    │
│  ┌──────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │Pages │ │Components│ │  Hooks   │ │   Services    │  │
│  │(16)  │ │  (90+)   │ │  (20+)   │ │ (AI, Utils)   │  │
│  └──┬───┘ └────┬─────┘ └────┬─────┘ └──────┬────────┘  │
│     └──────────┴─────────────┴──────────────┘           │
│                         │                                │
│              Supabase JS Client SDK                      │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTPS / WebSocket (Realtime)
┌─────────────────────────┴───────────────────────────────┐
│                   SUPABASE BACKEND                       │
│  ┌────────────┐ ┌──────────┐ ┌────────┐ ┌───────────┐  │
│  │ PostgreSQL │ │   Auth   │ │Storage │ │ Realtime  │  │
│  │ (35+ tbls) │ │ (Email)  │ │(4 bkts)│ │(Notifs)   │  │
│  └────────────┘ └──────────┘ └────────┘ └───────────┘  │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Edge Functions (17 Functions)             │   │
│  │  ai-photo-verification  │ generate-quest-suggest │   │
│  │  ai-content-moderation  │ generate-daily-ai-q... │   │
│  │  ai-generate-quest-img  │ check-achievements     │   │
│  │  ai-quest-search        │ reset-daily-challenges │   │
│  │  deepfake-detection     │ reset-weekly-challenges│   │
│  │  deepfake-analysis      │ expire-powerups        │   │
│  │  groq-analysis          │ award-powerup          │   │
│  │  admin-ai-quests        │ send-notification      │   │
│  │  mint-achievement-nft   │ create-user-wallet(s)  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────┐
│              EXTERNAL SERVICES                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │ Lovable  │ │  Google  │ │  Groq    │ │HuggingFace│  │
│  │ AI GW    │ │ Gemini   │ │  API     │ │   API     │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐    │
│  │Optimism  │ │Geoapify  │ │ Leaflet Tile Server  │    │
│  │ Sepolia  │ │ Maps API │ │                      │    │
│  └──────────┘ └──────────┘ └──────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### File Structure Overview
```
src/
├── assets/              # Static assets (logos, images)
├── components/
│   ├── admin/           # Admin panel, user wallets, AI logs
│   ├── badges/          # Badge verification, trophy links
│   ├── calendar/        # Mini calendar widget
│   ├── chat/            # Direct messaging
│   ├── community/       # Crew sidebar, team chat
│   ├── exercises/       # Daily exercise popup
│   ├── gamification/    # Achievements, challenges, powerups, XP
│   ├── landing/         # Landing page sections (Hero, CTA, etc.)
│   ├── location/        # Location picker
│   ├── native/          # Native camera/location buttons
│   ├── navigation/      # Top navbar, profile dropdown
│   ├── notifications/   # Notification center
│   ├── onboarding/      # Onboarding tutorial
│   ├── performance/     # Analytics, quest recommendations
│   ├── profile/         # Image upload, quest history, user posts
│   ├── pwa/             # Install prompt, offline indicator
│   ├── quest/           # Quest map, sidebar, walkthrough, AI gen
│   ├── realtime/        # Live activity feed
│   ├── search/          # Search and filter
│   ├── settings/        # Account settings, user preferences
│   ├── social/          # Follow, followers, social feed
│   ├── streak/          # Streak display
│   ├── teams/           # Team dialog, challenges, chat, details
│   ├── test/            # Mobile upload test
│   ├── ui/              # 50+ shadcn/ui components
│   └── verification/    # Verification progress & result
├── hooks/               # 20+ custom React hooks
├── integrations/        # Supabase client & auto-generated types
├── pages/               # 16 page components
├── services/            # AI verification, AI enhancements
├── utils/               # Helper functions, SQL setup scripts
└── theme-toggle.css     # Theme toggle styles

supabase/
├── config.toml          # Edge function config
└── functions/           # 17 edge functions
```

---

## 4. Database Schema & Relationships

### Core Tables (35+)

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `profiles` | User profile data | FK → `auth.users` (via trigger) |
| `Users` | Legacy user table | Standalone |
| `user_roles` | RBAC roles (admin, moderator, user) | FK → `auth.users` |
| `Quests` | Quest definitions | FK → `Users` (created_by) |
| `Submissions` | Quest submission proofs | FK → `Quests` |
| `Badges` | Badge definitions | FK → `Quests` |
| `User Badges` | Badge awards | FK → `Badges`, `Users` |
| `ai_generated_quests` | AI-created quests per user | FK → `profiles` |
| `suggested_quests` | AI quest suggestions | FK → `profiles` |
| `ai_verifications` | Photo verification results | FK → `Submissions`, `Quests` |
| `ai_logs` | AI operation logs | FK → `Submissions`, `ai_verifications` |
| `moderation_logs` | Content moderation logs | FK → `auth.users` |
| `achievements` | Achievement definitions | Standalone |
| `user_achievements` | Unlocked achievements | FK → `achievements` |
| `challenges` | Daily/weekly challenges | Standalone |
| `user_challenges` | User challenge progress | FK → `challenges` |
| `powerups` | Power-up definitions | Standalone |
| `user_powerups` | User power-up inventory | FK → `powerups` |
| `xp_logs` | XP transaction history | Standalone |
| `teams` | Team definitions | Standalone |
| `team_members` | Team membership | FK → `teams` |
| `team_messages` | Team chat messages | FK → `teams`, `profiles` |
| `team_challenges` | Team challenges | FK → `Quests`, `Badges` |
| `team_challenge_progress` | Team challenge tracking | FK → `team_challenges`, `teams` |
| `team_quest_completions` | Team quest completions | FK → `Quests`, `teams` |
| `crews` | Crew groups | Standalone |
| `crew_members` | Crew membership | FK → `crews` |
| `community_posts` | Community feed posts | Standalone |
| `community_post_likes` | Post likes | Standalone |
| `community_post_comments` | Post comments | Standalone |
| `post_likes` | Quest submission likes | Standalone |
| `post_comments` | Quest submission comments | Standalone |
| `post_shares` | Quest submission shares | Standalone |
| `follows` | Follow relationships | Standalone |
| `follow_requests` | Private account follow requests | Standalone |
| `direct_messages` | DM system | Self-referencing (reply_to) |
| `daily_exercises` | Daily exercise tracking | Standalone |
| `notifications` | In-app notifications | Standalone |
| `notification_preferences` | Notification settings | Standalone |
| `events` | Seasonal/special events | Standalone |
| `event_quests` | Event-quest mappings | FK → `events`, `Quests` |
| `verification_ledger` | NFT minting records | FK → `Badges` |

### Entity Relationship Summary
```
auth.users ──1:1──> profiles
auth.users ──1:N──> user_roles
profiles   ──1:N──> ai_generated_quests
profiles   ──1:N──> suggested_quests
Quests     ──1:N──> Submissions
Quests     ──1:N──> Badges
Submissions──1:N──> ai_verifications
Submissions──1:N──> post_likes / post_comments / post_shares
Users      ──1:N──> User Badges
achievements──1:N──> user_achievements
challenges ──1:N──> user_challenges
powerups   ──1:N──> user_powerups
teams      ──1:N──> team_members
teams      ──1:N──> team_messages
follows (self-join: follower_id, following_id)
direct_messages (self-referencing: reply_to)
```

### Storage Buckets
| Bucket | Public | Purpose |
|--------|--------|---------|
| `quest-submissions` | Yes | Quest photo proofs |
| `community-images` | Yes | Community post images |
| `user-uploads` | Yes | General user uploads |
| `avatars` | Yes | Profile pictures |

---

## 5. Frontend Analysis

### Pages (16 Routes)

| Route | Page | Auth Required | Description |
|-------|------|:---:|-------------|
| `/` | Index | No | Landing page with Hero, Features, Testimonials, CTA |
| `/auth` | Auth | No (redirects if logged in) | Sign in / Sign up with email/password |
| `/home` | Home | ✅ | Dashboard with stats, quest feed, gamification tabs |
| `/all-quests` | AllQuests | ✅ | Browse all available quests |
| `/quest/:id` | QuestDetail | ✅ | Individual quest details + submission |
| `/submit/:id` | SubmitQuest | ✅ | Photo submission for quest completion |
| `/badges` | BadgeGallery | ✅ | Badge collection gallery |
| `/treasure` | BadgeGallery | ✅ | Alias for badges |
| `/profile` | Profile | ✅ | User's own profile |
| `/profile/:userId` | UserProfile | ✅ | View another user's profile |
| `/leaderboard` | Leaderboard | ✅ | Global rankings |
| `/community` | Community | ✅ | Social feed (posts + quest submissions) |
| `/post/:postId` | PostDetail | ✅ | Individual post view |
| `/quest-map` | QuestMap | ✅ | Interactive map with quest locations |
| `/admin` | Admin | ✅ | Admin panel (no server-side role check on route!) |
| `/mobile-test` | MobileTest | No | Mobile upload testing |

### Component Architecture

**Navigation:** `TopNavbar` with `ProfileDropdown` (responsive, mobile-friendly)

**Design System:**
- 7 custom themes (Default, Ocean, Forest, Sunset, Purple, Rose, Dark)
- HSL-based CSS variables in `index.css`
- Semantic tokens mapped in `tailwind.config.ts`
- Dark mode via `next-themes` with class strategy
- Accessibility styles (focus-visible, skip-to-main, reduce-motion)

**Key Component Categories:**
- **Gamification:** AchievementCard, ChallengeCard, PowerUpShop, PowerUpInventory, LevelUpAnimation, EventBanner, GamificationDashboard
- **Social:** FollowButton, FollowersModal, SuggestedUsers, SocialMediaFeed, DirectChat
- **Quest:** QuestMap (Leaflet-based), QuestSidebar, QuestWalkthrough, QuestSuggestionsCarousel, AIQuestGenerator
- **AI:** VerificationProgress, VerificationResult, AIVerificationLogs
- **Admin:** AdminPanel, CreateUserWallets, CreditPointsButton, RecalculateAllPoints, TeamChallengeManager

### State Management
- **Server state:** TanStack React Query
- **Auth state:** React Context (`useAuth`)
- **Local state:** React `useState` / `useEffect`
- **No global client state library** (Redux, Zustand, etc.)

---

## 6. Backend Analysis (Edge Functions)

### Edge Function Inventory (17 Functions)

| Function | JWT Required | Purpose | AI Provider |
|----------|:---:|---------|-------------|
| `ai-photo-verification` | No | Multi-step photo proof verification | Gemini API (direct) |
| `ai-content-moderation` | Yes | Content safety checking | Gemini API |
| `ai-quest-search` | Yes | Natural language quest search | Gemini API |
| `ai-generate-quest-image` | Yes | Quest thumbnail generation | Gemini API |
| `generate-daily-ai-quests` | No | Bulk daily quest generation | Gemini API (direct) |
| `generate-quest-suggestions` | Yes | Personalized quest suggestions | Lovable AI Gateway |
| `groq-analysis` | — | Fast LLM analysis | Groq API |
| `deepfake-detection` | — | Image authenticity check | HuggingFace API |
| `deepfake-analysis` | — | Detailed deepfake analysis | HuggingFace API |
| `check-achievements` | Yes | Achievement unlock logic | None |
| `reset-daily-challenges` | No | Cron: reset daily challenges | None |
| `reset-weekly-challenges` | No | Cron: reset weekly challenges | None |
| `expire-powerups` | No | Cron: expire active powerups | None |
| `award-powerup` | No | Grant powerup to user | None |
| `send-notification` | Yes | Push notification dispatch | None |
| `create-user-wallet` | — | Single user wallet creation | Blockchain (Optimism) |
| `create-user-wallets-batch` | — | Batch wallet creation | Blockchain (Optimism) |
| `mint-achievement-nft` | — | Mint NFT on Optimism Sepolia | Blockchain (Optimism) |
| `admin-ai-quests` | — | Admin AI quest management | Gemini API |

### Secrets Configured (12)
| Secret | Used By |
|--------|---------|
| `GEMINI_API_KEY` | ai-photo-verification, generate-daily-ai-quests, generate-quest-suggestions |
| `LOVABLE_API_KEY` | generate-quest-suggestions (via Lovable AI Gateway) |
| `GROQ_API_KEY` | groq-analysis |
| `HUGGINGFACE_API_KEY` | deepfake-detection |
| `HF_TOKEN` | deepfake-analysis |
| `MINTER_PRIVATE_KEY` | mint-achievement-nft |
| `NFT_CONTRACT_ADDRESS` | mint-achievement-nft |
| `OPTIMISM_SEPOLIA_RPC` | mint-achievement-nft, create-user-wallet |
| `SUPABASE_SERVICE_ROLE_KEY` | Multiple functions |
| `SUPABASE_ANON_KEY` | Auto-configured |
| `SUPABASE_URL` | Auto-configured |
| `SUPABASE_DB_URL` | Direct DB access |

---

## 7. Authentication & Authorization

### Authentication
- **Provider:** Supabase Auth (email/password only)
- **Session:** Persisted in localStorage, auto-refresh enabled
- **Flow:** Sign up → auto-profile creation (via DB trigger `handle_new_user`) → auto notification preferences (via trigger `create_default_notification_preferences`)
- **Protected Routes:** Handled by `<ProtectedRoute>` wrapper in `App.tsx`
- **Auth Routes:** `<AuthRoute>` redirects logged-in users to `/home`

### Authorization (RBAC)
- **Roles:** `admin`, `moderator`, `user` (stored in `user_roles` table with `app_role` enum)
- **Role Check:** `has_role()` SECURITY DEFINER function (bypasses RLS)
- **Client-side:** `useSimpleRole` hook for UI-level role checks
- **RLS:** Extensive policies on all tables using `auth.uid()` and `has_role()`

### ⚠️ Authorization Issues
1. **Admin route not server-protected:** `/admin` route only uses `<ProtectedRoute>` (checks auth, not role). Any authenticated user can access the admin page component. Role checking happens within the component but the route itself is not protected.
2. **Service role key exposed in DB functions:** `handle_new_badge` and `handle_new_achievement` functions contain hardcoded service role keys in plain text — this is a **critical security issue**.

---

## 8. AI Integration Analysis

### Current AI Pipelines

#### 1. Photo Verification Pipeline
```
User submits photo → Edge Function (ai-photo-verification)
  ├── EXIF metadata extraction (exifr)
  ├── Geolocation matching (Haversine distance)
  ├── Scene analysis (Gemini Vision API)
  ├── Deepfake detection (HuggingFace)
  ├── Weighted scoring model:
  │   ├── Scene relevance: 20%
  │   ├── Geolocation match: 30%
  │   ├── Authenticity: 25%
  │   └── Text/context match: 15%
  ├── Verdict: verified (≥0.85) / uncertain (0.60-0.85) / rejected (<0.60)
  └── Store result in ai_verifications table
```

#### 2. Quest Generation Pipeline
```
Cron/Manual trigger → Edge Function (generate-daily-ai-quests)
  ├── Fetch user profiles with location data
  ├── Get recent quests (avoid repetition)
  ├── Generate quest via Gemini API
  │   ├── Location-based (30%)
  │   ├── Social interaction (40%)
  │   ├── Truth or Dare (20%)
  │   └── Creative challenges (10%)
  └── Store in ai_generated_quests table
```

#### 3. Quest Suggestions Pipeline
```
User requests suggestions → Edge Function (generate-quest-suggestions)
  ├── Fetch user profile + interests
  ├── Fetch recent submissions
  ├── Call Lovable AI Gateway (Gemini)
  ├── Parse structured response
  └── Store in suggested_quests table
```

#### 4. Content Moderation Pipeline
```
User submits content → Edge Function (ai-content-moderation)
  ├── Analyze text/image via Gemini
  ├── Classify: allowed / flagged
  └── Log result in moderation_logs table
```

### AI Provider Inconsistency
- Some functions use **direct Gemini API** calls with `GEMINI_API_KEY`
- `generate-quest-suggestions` was migrated to **Lovable AI Gateway** with `LOVABLE_API_KEY`
- `ai-photo-verification` references `GOOGLE_GEMINI_API_KEY` (different env var name than `GEMINI_API_KEY`)
- This inconsistency can cause runtime failures

---

## 9. Feature Inventory (Complete)

### ✅ Implemented Features

#### Core Platform
- [x] Landing page with animated hero, features, testimonials, CTA
- [x] Email/password authentication (sign up, sign in, sign out)
- [x] User profiles with avatar, bio, location, interests
- [x] Dark mode + 7 custom themes (Ocean, Forest, Sunset, Purple, Rose)
- [x] PWA support (install prompt, offline indicator, update notification)
- [x] Capacitor config for native mobile
- [x] Responsive design (mobile-first)
- [x] Lottie loading animations
- [x] Page loader with configurable delay

#### Quest System
- [x] Quest creation (admin only via RLS)
- [x] Quest browsing with search & filter
- [x] Quest detail view with difficulty, location, type
- [x] Quest submission with photo proof + geolocation
- [x] Multi-image upload support
- [x] AI-powered photo verification (multi-step)
- [x] AI-generated personalized quests
- [x] AI quest suggestions carousel
- [x] Quest map with Leaflet (markers, heatmap, clustering)
- [x] Random quest selection
- [x] Featured quest rotation (30-second interval)
- [x] Quest walkthrough component
- [x] Quest recommendations engine
- [x] Quest calendar view (MiniCalendar)
- [x] Limited-time quests with expiration

#### Gamification
- [x] XP system with level progression (100 XP = 1 level)
- [x] Points system (total_points for score, shopping_points for shop)
- [x] Badge collection & gallery
- [x] Achievement system with unlocking
- [x] Daily challenges with auto-progress tracking (via trigger)
- [x] Weekly challenges
- [x] Team challenges with progress tracking
- [x] Power-up shop (purchase with shopping_points)
- [x] Power-up inventory & activation
- [x] Power-up expiration (cron)
- [x] Streak tracking
- [x] Leaderboard with user ranking
- [x] Level-up animation
- [x] Achievement unlocked popup
- [x] Event banner for seasonal events
- [x] Daily exercises popup

#### Social Features
- [x] Community feed (posts + quest submissions unified)
- [x] Post creation with multi-image upload
- [x] Post likes, comments, shares
- [x] Follow/unfollow system
- [x] Private accounts with follow requests
- [x] Follower/following lists
- [x] Mutual follow detection
- [x] Suggested users
- [x] User profile viewing
- [x] Direct messaging (between connections)
- [x] Message read receipts
- [x] Reply-to messages

#### Teams & Crews
- [x] Team creation and management
- [x] Team membership (join/leave)
- [x] Team chat with real-time messages
- [x] Team challenges with reward distribution
- [x] Crew groups with sidebar
- [x] Team chat panel in community

#### Admin Features
- [x] Admin panel with role-based access
- [x] AI verification logs viewer
- [x] Credit points to users
- [x] Recalculate all user points
- [x] Create user wallets (single + batch)
- [x] Team challenge manager
- [x] Admin submission deletion (via DB function)
- [x] Admin content moderation override

#### NFT / Blockchain
- [x] Wallet creation for users (Optimism Sepolia)
- [x] Achievement NFT minting on badge earn
- [x] Verification ledger for NFT tracking
- [x] Duplicate minting prevention

#### AI Features
- [x] AI photo verification (scene, geo, authenticity, deepfake)
- [x] AI quest generation (daily bulk + manual)
- [x] AI quest suggestions (personalized)
- [x] AI content moderation
- [x] AI quest search (natural language)
- [x] AI quest image generation
- [x] Groq-based fast analysis
- [x] Deepfake detection (HuggingFace)
- [x] Deepfake detailed analysis

#### Other
- [x] Notification system (in-app)
- [x] Notification preferences
- [x] Analytics tracking (simple)
- [x] Onboarding tutorial
- [x] Account settings modal
- [x] User preferences modal
- [x] Accessibility features (ARIA, keyboard nav, skip-to-main)
- [x] Location picker with Geoapify
- [x] Native camera button (Capacitor)
- [x] Native geolocation button (Capacitor)
- [x] Offline storage hook
- [x] Live activity feed
- [x] Image cropper for profile photos

---

## 10. Build Errors & Bugs

### 🔴 Critical Build Errors (Currently Blocking Deployment)

#### Edge Function TypeScript Errors (6 errors)

1. **`ai-photo-verification/index.ts:334`** — `exifr.parse()` options type mismatch
   ```
   TS2345: Argument of type '{ gps: true; exif: true; tiff: true; ifd0: boolean; ifd1: true; }' 
   is not assignable to parameter of type 'boolean | Options | Filter | undefined'.
   ```
   **Fix:** Change `ifd0: boolean` to `ifd0: true` or use proper `exifr` Options type.

2. **`ai-photo-verification/index.ts:671`** — `Uint8Array` not assignable to `string | ArrayBuffer`
   ```
   TS2345: Argument of type 'Uint8Array<ArrayBuffer>' is not assignable to parameter of type 'string | ArrayBuffer'.
   ```
   **Fix:** Use `.buffer` property: `base64Encode(new Uint8Array(imgBuf).buffer)`

3. **`deepfake-analysis/index.ts:112,218`** — `error` is of type `unknown`
   ```
   TS18046: 'error' is of type 'unknown'.
   ```
   **Fix:** Cast error: `(error as Error).message` or use type guard.

4. **`mint-achievement-nft/index.ts:216,278`** — `receipt` is possibly null
   ```
   TS18047: 'receipt' is possibly 'null'.
   ```
   **Fix:** Add null check: `receipt?.blockNumber`

#### Frontend TypeScript Errors (30+ errors)

5. **`AdminPanel.tsx:470`** — `delete_submission_admin` not in RPC type union
   ```
   TS2345: Argument of type '"delete_submission_admin"' is not assignable to parameter type
   ```
   **Root Cause:** The `types.ts` auto-generated file doesn't include `delete_submission_admin`, `purchase_powerup`, `get_followers`, `get_following` in the Functions type. These functions exist in the DB but the type file is stale.
   **Fix:** Regenerate Supabase types or use `.rpc()` with type assertion.

6. **`DirectChat.tsx` (13 errors)** — `direct_messages` table not recognized by Supabase SDK types
   ```
   TS2589: Type instantiation is excessively deep and possibly infinite.
   TS2769: Argument of type '"direct_messages"' is not assignable to parameter of type 'never'.
   ```
   **Root Cause:** The auto-generated types file has the table defined but the SDK's type inference is failing, likely due to complex type relationships or the SDK version mismatch.
   **Fix:** Use type assertions or restructure queries.

7. **`DailyExercisePopup.tsx:140`** — `daily_exercises` table type mismatch
   **Same root cause as #6.**

8. **`PowerUpShop.tsx:89`** — `purchase_powerup` not in RPC type union
   **Same root cause as #5.**

9. **`useGamification.tsx:163,171,209`** — `SelectQueryError` type leaking into runtime code
   ```
   TS2769: Argument of type '(challenge: Challenge) => boolean' is not assignable...
   ```
   **Root Cause:** Query returning error type union instead of data type. Likely a join/relation issue in the Supabase types.

10. **`useDailyExercise.tsx:45`** — Same `daily_exercises` type issue as #7.

11. **`TeamChatPanel.tsx:58,63`** — `get_followers`/`get_following` not in RPC type union
    **Same root cause as #5.**

### 🟡 Functional Bugs

12. **Hardcoded Supabase URL:** `generate-daily-ai-quests/index.ts:10` and `generate-quest-suggestions/index.ts` hardcode the Supabase URL instead of using `Deno.env.get('SUPABASE_URL')`.

13. **Inconsistent AI API key names:** `ai-photo-verification` uses `GOOGLE_GEMINI_API_KEY` while others use `GEMINI_API_KEY`. If only one is set, the verification function will silently fall back to mock mode.

14. **Service role key in DB functions:** `handle_new_badge()` and `handle_new_achievement()` contain the service role key as a string literal in the function body. **This is a critical security vulnerability** — anyone with DB read access can extract the service role key.

15. **Admin route not role-protected:** Any authenticated user can navigate to `/admin`. The role check only happens inside the component, allowing the page to render before checking.

16. **`shouldShowPopup` type confusion in Home.tsx:64:** Code checks `typeof shouldShowPopup === 'function'` suggesting the hook may return inconsistent types.

17. **Missing `GOOGLE_GEMINI_API_KEY` secret:** The `ai-photo-verification` function references this secret name, but it's not listed in configured secrets (only `GEMINI_API_KEY` is).

18. **Race condition in auth state:** `useAuth` sets up `onAuthStateChange` and then calls `getSession()` separately, which can cause a brief flash where both fire and user state is set twice.

19. **Community.tsx is 837 lines:** Monolithic component that handles posts, comments, likes, shares, filtering, and creation all in one file. Needs decomposition.

20. **`Users` vs `profiles` table confusion:** Both tables exist and store user data. `Users` has `username`, `bio`, `avatar_url`; `profiles` has `username`, `full_name`, `avatar_url`, plus gamification fields. This duplication creates data inconsistency risks.

---

## 11. Security Audit

### 🔴 Critical Issues

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 1 | **Service role key in plaintext** in DB functions `handle_new_badge()` and `handle_new_achievement()` | 🔴 Critical | Database functions |
| 2 | **All storage buckets are public** — user uploads, avatars, quest submissions, community images are all publicly accessible without auth | 🔴 Critical | Storage config |
| 3 | **`ai-photo-verification` has `verify_jwt = false`** — anyone can call this function without auth | 🟠 High | `config.toml` |
| 4 | **Admin page accessible to all authenticated users** — no route-level role guard | 🟠 High | `App.tsx` |
| 5 | **`award-powerup` has `verify_jwt = false`** — anyone can award powerups | 🟠 High | `config.toml` |

### 🟡 Medium Issues

| # | Issue | Location |
|---|-------|----------|
| 6 | Duplicate RLS policies on `ai_logs` (same policies with different names) | RLS policies |
| 7 | `generate-daily-ai-quests` has `verify_jwt = false` — bulk generation can be triggered by anyone | `config.toml` |
| 8 | No rate limiting on any edge functions (except Lovable AI Gateway's built-in limits) | Edge functions |
| 9 | `wallet_private_key_encrypted` stored in `profiles` table — accessible to all authenticated users via SELECT policy | `profiles` RLS |
| 10 | No email verification enforcement — users can sign up with any email without confirming | Auth config |

### 🟢 Good Practices
- Proper RLS on all tables
- `SECURITY DEFINER` functions for cross-table operations
- `has_role()` function for role checks (prevents RLS recursion)
- Foreign key constraints with `ON DELETE CASCADE`
- Separate `user_roles` table (not on profiles — correct pattern)

---

## 12. Performance Analysis

### Frontend Performance Concerns

1. **Large bundle size risk:** 
   - Three.js (0.181.0) imported for animated shader background on auth page only
   - GSAP (3.13.0) imported but usage is minimal
   - Leaflet + plugins loaded even when map page isn't visited
   - Recommend: Code splitting / lazy loading for heavy libraries

2. **No virtualization on long lists:**
   - `virtual-scroll.tsx` component exists but unclear if used in Community feed (837-line component)
   - Leaderboard and quest lists may hit performance issues with many items

3. **Multiple simultaneous Supabase subscriptions:**
   - Realtime subscriptions in notifications, team chat, direct messages
   - No centralized subscription management

4. **Image optimization:**
   - No image resizing/compression on upload
   - All storage buckets are public (CDN caching may help)
   - No lazy loading configured for images in feed

5. **Re-render issues:**
   - `Home.tsx` fetches all quests + AI quests + submissions on every render
   - `trackPageView` removed from dependency array to prevent infinite loop (comment on line 56) — indicates architectural issue

### Backend Performance Concerns

1. **No database indexes mentioned for common queries** (e.g., `submissions.user_id + status`, `follows.follower_id`)
2. **Bulk quest generation (`generate-daily-ai-quests`) processes all users in parallel** — could hit Gemini API rate limits with many users
3. **N+1 query pattern** in `generate-daily-ai-quests`: fetches recent quests for each user individually
4. **No caching layer** — every page load hits the database directly

---

## 13. Pending Tasks & Improvements

### 🔴 P0 — Must Fix (Blocking / Security)

| # | Task | Category |
|---|------|----------|
| 1 | Fix all 36+ TypeScript build errors (edge functions + frontend) | Build |
| 2 | Remove hardcoded service role keys from DB functions | Security |
| 3 | Add `GOOGLE_GEMINI_API_KEY` secret or unify to `GEMINI_API_KEY` | Config |
| 4 | Protect admin route with role check before rendering | Security |
| 5 | Set `verify_jwt = true` for `ai-photo-verification` and `award-powerup` | Security |
| 6 | Review and restrict public storage bucket access | Security |
| 7 | Remove/encrypt `wallet_private_key_encrypted` from public SELECT policy | Security |

### 🟠 P1 — Should Fix (Quality / Stability)

| # | Task | Category |
|---|------|----------|
| 8 | Regenerate Supabase types to include all DB functions | Types |
| 9 | Unify `Users` and `profiles` tables (eliminate duplication) | Database |
| 10 | Decompose `Community.tsx` (837 lines) into smaller components | Code Quality |
| 11 | Decompose `ai-photo-verification/index.ts` (761 lines) | Code Quality |
| 12 | Decompose `generate-daily-ai-quests/index.ts` (348 lines) | Code Quality |
| 13 | Fix `shouldShowPopup` type inconsistency in daily exercises | Bug |
| 14 | Migrate all AI functions to Lovable AI Gateway (consistency) | Architecture |
| 15 | Replace hardcoded Supabase URL in edge functions with env vars | Config |
| 16 | Add error boundaries around major page sections | Reliability |
| 17 | Implement proper loading states for all async operations | UX |
| 18 | Add rate limiting to edge functions | Security |

### 🟡 P2 — Nice to Have (Polish)

| # | Task | Category |
|---|------|----------|
| 19 | Add code splitting / lazy loading for heavy libraries (Three.js, Leaflet) | Performance |
| 20 | Implement image compression on upload | Performance |
| 21 | Add proper image lazy loading in feeds | Performance |
| 22 | Centralize Supabase realtime subscription management | Architecture |
| 23 | Add unit tests for hooks and services | Testing |
| 24 | Add E2E tests for critical flows (auth, quest submission, verification) | Testing |
| 25 | Implement proper SEO (meta tags, Open Graph, JSON-LD) | SEO |
| 26 | Add sitemap.xml generation | SEO |
| 27 | Implement proper 404 handling with suggestions | UX |
| 28 | Add password reset flow (currently missing) | Auth |
| 29 | Add OAuth providers (Google, Apple, GitHub) | Auth |
| 30 | Implement email verification enforcement | Auth |

---

## 14. Upcoming Features

### Near-term (Next 2-4 weeks)

| Feature | Description | Priority |
|---------|-------------|----------|
| Push Notifications | Firebase Cloud Messaging / Web Push API | High |
| Quest Difficulty Scaling | Adaptive difficulty based on user level | High |
| Enhanced Map Features | Route planning, area-based quests, quest trails | Medium |
| Advanced Analytics Dashboard | User engagement metrics, quest completion rates | Medium |
| Content Reporting | Report inappropriate posts/quests | High |
| User Blocking | Block users from messaging/following | Medium |

### Medium-term (1-3 months)

| Feature | Description | Priority |
|---------|-------------|----------|
| Real-time Multiplayer Quests | Collaborative quest completion | High |
| Quest Creation by Users | Community-created quests with moderation | High |
| In-app Currency Store | Purchase cosmetics, themes, power-ups | Medium |
| Seasonal Events System | Holiday-themed quests and rewards | Medium |
| Quest Chains | Multi-step quest storylines | Medium |
| Social Groups/Clubs | Interest-based groups beyond teams/crews | Low |
| AR Integration | Augmented reality quest elements | Low |

### Long-term (3-6 months)

| Feature | Description | Priority |
|---------|-------------|----------|
| Internationalization (i18n) | Multi-language support | High |
| Monetization | Premium subscriptions, in-app purchases | High |
| Advanced Matchmaking | Pair users for social quests | Medium |
| Quest Editor | Visual quest builder for admins/creators | Medium |
| Cross-platform Native App | Full Capacitor build for iOS/Android | Medium |
| Analytics API | Public API for quest/engagement data | Low |
| Marketplace | Trade NFTs, sell quest packs | Low |

---

## 15. Future Tech Stack Recommendations

### Recommended Additions

| Technology | Purpose | Priority | Replaces |
|-----------|---------|----------|----------|
| **Zustand** or **Jotai** | Global client state management | High | Raw Context API |
| **React Suspense + lazy()** | Code splitting for routes | High | Direct imports |
| **TanStack Virtual** | Virtual scrolling for long lists | Medium | Custom virtual-scroll |
| **Sharp** (via Edge Function) | Server-side image processing | Medium | Client-side processing |
| **Sentry** | Error monitoring & tracking | High | Console.error |
| **PostHog** or **Mixpanel** | Product analytics | Medium | Custom useSimpleAnalytics |
| **i18next** | Internationalization | Medium | Hardcoded English |
| **Stripe** | Payments & subscriptions | Medium (for monetization) | None |
| **Firebase Cloud Messaging** | Push notifications | High | In-app only |
| **Upstash Redis** | Caching layer | Medium | Direct DB queries |
| **Zod** (expanded) | API response validation | Medium | Manual type assertions |

### Tech Stack to Consider Removing/Replacing

| Current | Recommendation | Reason |
|---------|---------------|--------|
| Three.js (full) | `@react-three/fiber` or remove | Only used for shader background on auth page; massive bundle impact |
| GSAP | Framer Motion (already used) | Redundant animation library |
| `next-themes` | Custom theme hook | Already have `useThemes` hook; `next-themes` designed for Next.js |
| Multiple AI API direct calls | Lovable AI Gateway only | Simplify to single provider, reduce API key management |

### Architecture Evolution Path
```
Current:                      Recommended:
React SPA                  →  React SPA (code-split)
Direct Supabase calls      →  API layer with caching
Context for global state   →  Zustand for complex state
No error tracking          →  Sentry integration
No testing                 →  Vitest + Playwright
Manual AI integration      →  Unified AI Gateway
Public storage             →  Signed URLs + CDN
No CI/CD                   →  GitHub Actions pipeline
```

---

## 16. AI & Agentic AI Implementation Roadmap

### Current AI Capabilities
1. **Photo Verification** — Multi-modal analysis (vision + geo + metadata)
2. **Quest Generation** — Personalized quests based on location/interests
3. **Content Moderation** — Text/image safety screening
4. **Deepfake Detection** — Synthetic image identification
5. **Natural Language Search** — Semantic quest search
6. **Quest Image Generation** — AI-generated thumbnails

### Proposed Agentic AI Implementations

#### 🤖 Phase 1: AI Quest Master Agent
**Goal:** Autonomous quest creation and management
```
┌─────────────────────────────────────────────┐
│           QUEST MASTER AGENT                │
│                                             │
│  Inputs:                                    │
│  ├── User location (real-time GPS)          │
│  ├── Weather API data                       │
│  ├── Local events calendar                  │
│  ├── User's quest history & preferences     │
│  ├── Time of day / day of week              │
│  └── Social graph (friends' activities)     │
│                                             │
│  Capabilities:                              │
│  ├── Generate contextual quests             │
│  ├── Adjust difficulty dynamically          │
│  ├── Chain quests into storylines           │
│  ├── Create collaborative quests            │
│  ├── Schedule time-limited challenges       │
│  └── Retire stale/unpopular quests          │
│                                             │
│  Tools:                                     │
│  ├── Gemini 2.5 Pro (reasoning)             │
│  ├── Gemini 2.5 Flash (fast generation)     │
│  ├── Weather API                            │
│  ├── Google Places API                      │
│  ├── Supabase DB (read/write)               │
│  └── Push notification service              │
└─────────────────────────────────────────────┘
```

#### 🤖 Phase 2: AI Community Manager Agent
**Goal:** Autonomous content moderation and community health
```
Capabilities:
├── Real-time content moderation (text + images)
├── Spam detection and auto-removal
├── Toxicity scoring and user warnings
├── Trend detection (popular topics/quests)
├── Community health scoring
├── Auto-generate weekly community highlights
├── Detect and flag suspicious accounts
└── Generate engagement prompts during low-activity periods
```

#### 🤖 Phase 3: AI Personal Coach Agent
**Goal:** Personalized guidance and motivation
```
Capabilities:
├── Analyze user's quest patterns and suggest growth areas
├── Provide motivational messages based on streak/engagement
├── Recommend optimal quest times based on user behavior
├── Create personalized challenge progressions
├── Detect burnout patterns and suggest breaks
├── Generate personalized achievement celebrations
├── Adaptive difficulty recommendations
└── Social matching (pair users for collaborative quests)
```

#### 🤖 Phase 4: AI Verification Agent (Enhanced)
**Goal:** Fully autonomous photo verification with appeal handling
```
Current:                           Enhanced:
Single-pass verification     →    Multi-agent verification
Manual admin review          →    AI appeal review agent
Binary verdicts              →    Nuanced scoring with explanations
No learning                  →    Feedback loop from admin overrides
Static thresholds            →    Adaptive confidence thresholds
No cross-reference           →    Cross-reference with similar submissions
```

#### 🤖 Phase 5: Agentic RAG System
**Goal:** Knowledge-enriched quest experience
```
Components:
├── Quest Knowledge Base (RAG)
│   ├── Local history database
│   ├── Geography / nature facts
│   ├── Cultural information
│   └── Safety guidelines
├── Conversational Quest Guide
│   ├── Answer user questions about quests
│   ├── Provide hints when stuck
│   ├── Share interesting facts during quests
│   └── Multi-turn conversation with memory
└── Learning System
    ├── Track which facts users engage with
    ├── Personalize information depth
    └── Generate quiz-style micro-challenges
```

### AI Implementation Architecture
```
┌──────────────────────────────────────────────────────┐
│                 AGENT ORCHESTRATOR                    │
│         (Edge Function / Deno-based)                 │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Quest    │  │Community │  │   Verification   │  │
│  │  Master   │  │ Manager  │  │     Agent        │  │
│  │  Agent    │  │  Agent   │  │                  │  │
│  └────┬─────┘  └────┬─────┘  └────────┬─────────┘  │
│       │              │                  │            │
│  ┌────┴──────────────┴──────────────────┴─────────┐ │
│  │              SHARED TOOL LAYER                  │ │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌─────────┐ │ │
│  │  │Supabase│ │Lovable │ │External│ │Notifica-│ │ │
│  │  │  DB    │ │AI GW   │ │  APIs  │ │  tions  │ │ │
│  │  └────────┘ └────────┘ └────────┘ └─────────┘ │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │              MEMORY LAYER                       │ │
│  │  ├── Short-term: Request context               │ │
│  │  ├── Medium-term: User session history         │ │
│  │  └── Long-term: Supabase DB (persistent)       │ │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### Recommended AI Models by Use Case

| Use Case | Model | Why |
|----------|-------|-----|
| Quest Generation | `google/gemini-3-flash-preview` | Fast, good reasoning, cost-effective |
| Photo Verification | `google/gemini-2.5-pro` | Best multimodal + reasoning |
| Content Moderation | `google/gemini-2.5-flash-lite` | Fast classification, low cost |
| Conversational Guide | `google/gemini-3-pro-preview` | Best conversational quality |
| Image Generation | `google/gemini-2.5-flash-image` | Built-in image generation |
| Complex Reasoning | `openai/gpt-5` | Strongest reasoning for edge cases |
| High-volume Tasks | `openai/gpt-5-nano` | Cost-efficient for simple tasks |

---

## 17. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|:-----------:|:------:|------------|
| Service role key leaked from DB functions | High | Critical | Remove immediately, rotate key |
| Gemini API rate limiting during bulk generation | High | Medium | Implement backoff, batch processing |
| Type errors preventing deployment | Active | High | Fix all TS errors (P0) |
| Data inconsistency between Users & profiles tables | Medium | Medium | Migrate to single table |
| Public storage bucket data exposure | Medium | High | Implement signed URLs |
| No error monitoring in production | High | Medium | Add Sentry |
| No automated testing | High | Medium | Add Vitest + Playwright |
| Single AI provider dependency | Medium | Medium | Already using Lovable AI Gateway (multi-provider) |
| NFT minting on testnet only | Low | Low | Plan mainnet migration when ready |
| Mobile app not built/tested | Medium | Low | Capacitor config exists, needs testing |

---

## 18. Recommendations & Roadmap

### Immediate (This Week)
1. ✅ Fix all 36+ TypeScript build errors
2. ✅ Remove hardcoded service role keys from DB functions
3. ✅ Protect admin route with role guard
4. ✅ Unify AI API key naming
5. ✅ Regenerate Supabase types

### Short-term (2-4 Weeks)
1. Implement code splitting for all routes
2. Add Sentry error monitoring
3. Add password reset flow
4. Decompose large components (Community.tsx, ai-photo-verification)
5. Implement push notifications
6. Add content reporting system
7. Migrate all AI functions to Lovable AI Gateway

### Medium-term (1-3 Months)
1. Implement AI Quest Master Agent (Phase 1)
2. Add OAuth providers (Google, Apple)
3. Build user quest creation with moderation
4. Implement real-time multiplayer quests
5. Add i18n support
6. Set up CI/CD pipeline with automated testing
7. Implement caching layer (Upstash Redis)
8. Build advanced analytics dashboard

### Long-term (3-6 Months)
1. Deploy AI Community Manager Agent (Phase 2)
2. Deploy AI Personal Coach Agent (Phase 3)
3. Implement monetization (Stripe)
4. Build native mobile apps (Capacitor full build)
5. Deploy enhanced AI Verification Agent (Phase 4)
6. Implement Agentic RAG system (Phase 5)
7. Consider marketplace for quest packs and NFT trading
8. Scale to mainnet for NFT minting

---

## Appendix A: Database Functions Summary

| Function | Type | Purpose |
|----------|------|---------|
| `handle_new_user()` | Trigger | Auto-create profile on signup |
| `create_default_notification_preferences()` | Trigger | Auto-create notification prefs on signup |
| `has_role()` | Query | Check user role (SECURITY DEFINER) |
| `add_xp_to_user()` | Mutation | Add XP + auto-level calculation |
| `check_and_unlock_achievement()` | Mutation | Unlock achievement + award XP |
| `activate_powerup()` | Mutation | Activate powerup + set expiry |
| `purchase_powerup()` | Mutation | Buy powerup with shopping_points |
| `toggle_follow()` | Mutation | Follow/unfollow with private account support |
| `get_followers()` | Query | Get follower list with mutual detection |
| `get_following()` | Query | Get following list with mutual detection |
| `get_suggested_users()` | Query | Get user suggestions based on social graph |
| `delete_submission_admin()` | Mutation | Admin delete with cascade |
| `create_notification()` | Mutation | Create in-app notification |
| `track_daily_challenge_progress()` | Trigger | Auto-update challenge progress on submission |
| `track_team_challenge_progress()` | Trigger | Auto-update team challenge progress |
| `award_team_challenge_rewards()` | Trigger | Auto-award team rewards on completion |
| `archive_expired_quests()` | Cron | Deactivate expired limited-time quests |
| `handle_new_badge()` | Trigger | Trigger NFT minting webhook |
| `handle_new_achievement()` | Trigger | Trigger NFT minting webhook |
| `is_verification_in_progress()` | Query | Prevent duplicate NFT minting |
| `update_submissions_updated_at()` | Trigger | Auto-update timestamp |
| `update_ai_verification_timestamp()` | Trigger | Auto-update timestamp |
| `update_updated_at_column()` | Trigger | Generic timestamp update |

## Appendix B: Environment Variables

| Variable | Source | Used In |
|----------|--------|---------|
| `VITE_SUPABASE_URL` | Auto-populated | Frontend Supabase client |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Auto-populated | Frontend Supabase client |
| `VITE_SUPABASE_PROJECT_ID` | Auto-populated | Frontend reference |
| `SUPABASE_URL` | Supabase secret | Edge functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase secret | Edge functions (admin ops) |
| `SUPABASE_ANON_KEY` | Supabase secret | Edge functions (public ops) |
| `GEMINI_API_KEY` | User secret | AI functions |
| `LOVABLE_API_KEY` | Auto-provisioned | Lovable AI Gateway |
| `GROQ_API_KEY` | User secret | Groq analysis |
| `HUGGINGFACE_API_KEY` | User secret | Deepfake detection |
| `HF_TOKEN` | User secret | Deepfake analysis |
| `MINTER_PRIVATE_KEY` | User secret | NFT minting |
| `NFT_CONTRACT_ADDRESS` | User secret | NFT contract ref |
| `OPTIMISM_SEPOLIA_RPC` | User secret | Blockchain RPC |

## Appendix C: Workflows & Data Pipelines

### User Registration Flow
```
1. User fills signup form (email, password, username, full_name)
2. supabase.auth.signUp() called with metadata
3. Supabase creates auth.users record
4. Trigger: handle_new_user() → creates profiles record
5. Trigger: create_default_notification_preferences() → creates prefs
6. User redirected to /home
```

### Quest Completion Flow
```
1. User navigates to /quest/:id
2. User clicks "Start Quest" → navigates to /submit/:id
3. User uploads photo(s) + optional description + geolocation
4. Photo uploaded to quest-submissions bucket
5. Submission record created in Submissions table
6. AI photo verification triggered (ai-photo-verification edge fn)
   ├── EXIF extraction
   ├── Geo-matching
   ├── Scene analysis (Gemini Vision)
   ├── Deepfake check (HuggingFace)
   └── Final verdict stored in ai_verifications
7. If verified → Submission status updated
8. Trigger: track_daily_challenge_progress() fires
9. Trigger: track_team_challenge_progress() fires
10. XP awarded via add_xp_to_user()
11. Achievements checked via check-achievements edge fn
12. If badge earned → User Badges record created
13. Trigger: handle_new_badge() → mint-achievement-nft called
14. NFT minted on Optimism Sepolia (if wallet exists)
```

### AI Quest Generation Flow (Daily Cron)
```
1. Cron triggers generate-daily-ai-quests edge function
2. Fetch all profiles with lat/lng
3. For each user:
   ├── Fetch recent AI quests (last 7 days)
   ├── Build prompt with location, interests, history
   ├── Call Gemini API
   ├── Parse JSON response
   └── Insert into ai_generated_quests
4. Return summary of processed users
```

### Social Interaction Flow
```
Follow: toggle_follow() handles:
├── Self-follow prevention
├── Private account → follow_requests
├── Public account → direct follows insert
├── follower_count / following_count update
└── Unfollow with count decrement

Direct Message: 
├── RLS checks mutual follow OR one-way follow
├── Insert into direct_messages
├── Realtime subscription notifies receiver
└── Read receipts via is_read update
```

### NFT Minting Flow
```
1. Badge earned → User Badges INSERT
2. Trigger: handle_new_badge() fires
3. Check: is_verification_in_progress() → prevent duplicates
4. Check: already minted (verification_ledger status='success')
5. HTTP POST to mint-achievement-nft edge function
6. Edge function:
   ├── Get user's wallet_address from profiles
   ├── If no wallet → create via create-user-wallet
   ├── Prepare NFT metadata
   ├── Call NFT contract on Optimism Sepolia
   ├── Wait for transaction confirmation
   └── Update verification_ledger with tx hash
```

---

*End of Report — Discovery Atlas v2.0-beta*  
*Report generated on 2026-02-21*
