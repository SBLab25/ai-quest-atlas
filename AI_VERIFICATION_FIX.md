# AI Verification Feature - Fixed and Ready

## What Was Fixed

1. ✅ **Enabled Lovable AI** - The AI gateway is now active with the `LOVABLE_API_KEY` configured
2. ✅ **Configured Edge Function** - Added `ai-photo-verification` to `supabase/config.toml`
3. ✅ **Fixed Quest Deletion** - Created SQL script to enable cascade deletion

## What You Need to Do

### Step 1: Run the AI Verification Database Setup

Open your Supabase SQL Editor and run the SQL from `src/utils/setupAIVerification.sql`.

This will create:
- `ai_verifications` table - stores AI analysis results
- `ai_logs` table - stores verification process logs
- RLS policies for secure access
- Performance indexes

### Step 2: Fix Quest Deletion (Optional but Recommended)

Run the SQL from `src/utils/fixQuestDeletion.sql` in your Supabase SQL Editor.

This will allow admins to delete quests even if they have submissions (cascade delete).

## How It Works

When a user submits a quest with a photo:

1. **Photo Upload** → Uploaded to `quest-submissions` storage bucket
2. **Submission Created** → Record created in `Submissions` table with `status: 'pending'`
3. **AI Verification** → Edge function analyzes the photo using Gemini 2.5 Pro
4. **Automatic Decision**:
   - ✅ **Verified** (85%+ confidence) → Auto-approved
   - ⚠️ **Uncertain** (60-85% confidence) → Pending manual review
   - ❌ **Rejected** (<60% confidence) → Auto-rejected

## AI Analysis Criteria

The AI checks:
- **Quest Match** (0-1) - Does photo match quest description?
- **Geolocation Match** (0-1) - Does location make sense?
- **Authenticity** (0-1) - Is it a real photo or AI-generated?
- **Scene Relevance** (0-1) - How relevant is the photo?
- **Final Confidence** (0-1) - Overall confidence score

## Testing

1. Submit a quest with a photo
2. Go to Admin Panel → AI Verifications tab
3. You should see:
   - Verification record with scores and verdict
   - Log entry showing execution time and model used

## Troubleshooting

### No verifications showing up?
- Make sure you ran the database setup SQL
- Check edge function logs for errors
- Verify Lovable AI is enabled (Settings → Integrations)

### Delete still not working?
- Run the `fixQuestDeletion.sql` script
- Verify you have admin role in `user_roles` table

## Current Status

- ✅ Edge function ready and deployed
- ✅ Lovable AI enabled (using Gemini 2.5 Pro - FREE until Oct 13, 2025)
- ⏳ Database tables need to be created (run SQL)
- ⏳ Cascade delete needs to be enabled (run SQL)

Once you run both SQL scripts, everything will be fully operational!
