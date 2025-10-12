# 🧠 AI Photo Verification - Setup Guide

Your AI photo verification system is ready! Follow these steps to activate it.

## 📋 Quick Setup (5 minutes)

### Step 1: Run the Database Migration

1. Open your **Supabase Dashboard** → Go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `src/utils/setupAIVerification.sql`
4. Paste into the SQL Editor
5. Click **Run** (or press `Ctrl/Cmd + Enter`)

You should see: ✅ Success message

### Step 2: Verify Setup

1. Go to your app's **Admin Panel**
2. Click on **AI Verifications** tab
3. You should see the verification dashboard (no longer showing setup warning)

### Step 3: Test It!

1. Go to any quest in your app
2. Click "Submit Quest"
3. Upload a photo
4. Fill in the description
5. Submit!

The AI will automatically:
- ✅ Analyze photo authenticity
- ✅ Validate geolocation (if provided)
- ✅ Detect AI-generated/fake images
- ✅ Compute confidence score
- ✅ Auto-approve or reject based on results

### Step 4: Monitor Results

Go to **Admin Panel → AI Verifications** to:
- View all verification results
- See confidence scores
- Override AI decisions if needed
- Review uncertain submissions

---

## 🎯 How It Works

When a user submits a photo:

1. **Photo Upload** → Stored in Supabase Storage
2. **AI Analysis** → Gemini 2.5 Pro analyzes:
   - Does it match quest description?
   - Is location valid?
   - Is it authentic (not AI-generated)?
   - Scene relevance score
3. **Verdict Generation**:
   - ✅ **Verified** (≥85% confidence) → Auto-approved
   - ⚠️ **Uncertain** (60-84%) → Needs manual review
   - ❌ **Rejected** (<60%) → Auto-rejected
4. **Results Logged** → All decisions tracked in database

---

## 🔧 Troubleshooting

### "Failed to load verification data"

**Fix**: You haven't run the SQL migration yet. Go back to Step 1.

### No verifications showing up

**Possible causes**:
1. No one has submitted photos yet
2. SQL migration not completed
3. Edge function not deployed (it deploys automatically)

**Check**:
- Submit a test quest with a photo
- Wait 3-5 seconds for AI processing
- Refresh the Admin Panel

### Verification fails silently

**Check the logs**:
1. Open Supabase Dashboard
2. Go to **Edge Functions** → `ai-photo-verification`
3. Click **Logs**
4. Look for error messages

Common issues:
- `LOVABLE_API_KEY not configured` → Contact support
- `429 Rate limit exceeded` → Too many requests, wait a bit
- `Unauthorized` → RLS policy issue

---

## 📊 What Gets Stored

### `ai_verifications` table
- User ID, Quest ID, Submission ID
- Photo URL
- 4 AI scores (quest match, geolocation, authenticity, scene relevance)
- Final confidence score (0-1)
- Verdict (verified/uncertain/rejected)
- Reason (AI explanation)
- EXIF data (latitude, longitude, timestamp if available)
- Admin override capability

### `ai_logs` table
- Every verification attempt
- Model used (Gemini 2.5 Pro)
- Confidence score
- Execution time
- Status (success/error/timeout)
- Error messages for debugging

---

## 🎨 Admin Features

### View Verifications
- See all photo submissions
- Filter by verdict (verified/uncertain/rejected)
- View confidence scores
- See user details

### Manual Override
- Click "Override" on any verification
- Provide reason for override
- Approve or reject manually
- Tracks who made the override

### Analytics Dashboard
- Total verifications
- Success rate
- Average confidence score
- Flagged submissions needing review

---

## 🚀 Next Steps

Your AI verification system is now production-ready!

**Recommendations**:
1. Test with various photo types (real locations, stock images, AI-generated)
2. Review first 10-20 verifications to ensure accuracy
3. Adjust thresholds in code if needed (currently 85% for verified, 60% for uncertain)
4. Set up admin notifications for uncertain submissions

**Advanced**:
- Customize AI prompts in `supabase/functions/ai-photo-verification/index.ts`
- Add additional checks (face detection, object recognition, etc.)
- Integrate with blockchain/NFT minting after verification
- Add webhooks for real-time notifications

---

## 📞 Support

If you encounter issues:
1. Check Supabase Edge Function logs
2. Verify RLS policies are active
3. Ensure LOVABLE_API_KEY is set (it should be automatic)
4. Check your Lovable AI usage limits

**Need help?** Check the logs in:
- Supabase Dashboard → Database → Tables → `ai_logs`
- Edge Functions → `ai-photo-verification` → Logs

---

## ✅ Verification Complete!

You now have:
- ✅ Automatic photo verification
- ✅ AI-powered fraud detection
- ✅ Admin oversight dashboard
- ✅ Complete audit trail
- ✅ Scalable verification pipeline

Happy verifying! 🎉
