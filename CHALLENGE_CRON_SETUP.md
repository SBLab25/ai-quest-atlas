# Challenge System Cron Setup

## Overview
The challenge system requires two cron jobs to automatically reset daily and weekly challenges.

## Prerequisites
1. Access to Supabase SQL Editor
2. `pg_cron` and `pg_net` extensions enabled in your project

## Enable Required Extensions

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable pg_cron extension for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;
```

## Set Up Daily Challenge Reset

Run this SQL to schedule daily challenge resets at midnight IST (18:30 UTC):

```sql
SELECT cron.schedule(
  'reset-daily-challenges',
  '30 18 * * *', -- Every day at 18:30 UTC (midnight IST)
  $$
  SELECT
    net.http_post(
      url:='https://afglpoufxxgdxylvgeex.supabase.co/functions/v1/reset-daily-challenges',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmZ2xwb3VmeHhnZHh5bHZnZWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNDc3ODQsImV4cCI6MjA2OTYyMzc4NH0.zS-liSt8emGixeRJUTDgl7RR0767fcNSlzDPC8kzUUs"}'::jsonb,
      body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);
```

## Set Up Weekly Challenge Reset

Run this SQL to schedule weekly challenge resets every Monday at midnight IST (18:30 UTC previous day):

```sql
SELECT cron.schedule(
  'reset-weekly-challenges',
  '30 18 * * 0', -- Every Sunday at 18:30 UTC (Monday midnight IST)
  $$
  SELECT
    net.http_post(
      url:='https://afglpoufxxgdxylvgeex.supabase.co/functions/v1/reset-weekly-challenges',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmZ2xwb3VmeHhnZHh5bHZnZWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNDc3ODQsImV4cCI6MjA2OTYyMzc4NH0.zS-liSt8emGixeRJUTDgl7RR0767fcNSlzDPC8kzUUs"}'::jsonb,
      body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);
```

## Verify Cron Jobs

Check that your cron jobs are scheduled correctly:

```sql
SELECT * FROM cron.job;
```

You should see two entries: `reset-daily-challenges` and `reset-weekly-challenges`.

## Manually Trigger for Testing

You can manually trigger the functions to test them:

```sql
-- Test daily challenges
SELECT
  net.http_post(
    url:='https://afglpoufxxgdxylvgeex.supabase.co/functions/v1/reset-daily-challenges',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmZ2xwb3VmeHhnZHh5bHZnZWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNDc3ODQsImV4cCI6MjA2OTYyMzc4NH0.zS-liSt8emGixeRJUTDgl7RR0767fcNSlzDPC8kzUUs"}'::jsonb,
    body:='{"time": "manual-test"}'::jsonb
  ) as request_id;

-- Test weekly challenges
SELECT
  net.http_post(
    url:='https://afglpoufxxgdxylvgeex.supabase.co/functions/v1/reset-weekly-challenges',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmZ2xwb3VmeHhnZHh5bHZnZWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNDc3ODQsImV4cCI6MjA2OTYyMzc4NH0.zS-liSt8emGixeRJUTDgl7RR0767fcNSlzDPC8kzUUs"}'::jsonb,
    body:='{"time": "manual-test"}'::jsonb
  ) as request_id;
```

## Delete/Update Cron Jobs

If you need to remove or update a cron job:

```sql
-- Delete a cron job
SELECT cron.unschedule('reset-daily-challenges');
SELECT cron.unschedule('reset-weekly-challenges');

-- Then you can recreate them with the SQL above
```

## Monitoring

Check the Edge Function logs in Supabase Dashboard → Edge Functions to see when challenges are reset and if there are any errors.

## Features Implemented

### Daily Challenges
- Auto-reset every day at midnight IST (18:30 UTC)
- 2 challenges: Complete 1 Quest Today, Earn an AI Verification
- Rewards: 30-50 points, 15-20 XP
- Duration: 24 hours from midnight IST

### Weekly Challenges
- Auto-reset every Monday at midnight IST (Sunday 18:30 UTC)
- 2-3 challenges selected randomly from pool
- Rewards: 200-350 points, 100-175 XP
- Duration: 7 days (168 hours) from Monday midnight IST
- Types:
  - Complete 7 quests
  - Visit 8 locations
  - Earn 500 points
  - Maintain 7-day streak
  - Upload 10 verified photos

### UI Enhancements
- Countdown timers for both daily and weekly resets
- Challenge completion stats (this week/month)
- "Claim Reward" button with sparkle animation
- Separate sections for daily vs weekly challenges
- Visual feedback for completed/expired challenges
- Progress tracking with percentages
