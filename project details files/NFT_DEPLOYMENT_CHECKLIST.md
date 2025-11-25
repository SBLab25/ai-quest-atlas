# NFT Minting Deployment Checklist

Now that wallets are created, follow these steps to complete the NFT minting setup:

---

## ✅ Step 1: Deploy the Edge Function

### Deploy `mint-achievement-nft` function:

```bash
# From your project root directory
supabase functions deploy mint-achievement-nft
```

**Expected output:**
```
Deploying function mint-achievement-nft...
Function deployed successfully!
```

---

## ✅ Step 2: Set Edge Function Secrets

You need to set these secrets in Supabase for the edge function to work:

### Required Secrets:

1. **MINTER_PRIVATE_KEY**
   - Your wallet's private key that will mint the NFTs
   - Format: `0x...` (64 hex characters)
   - ⚠️ **Keep this secret!** Never commit it to git.

2. **NFT_CONTRACT_ADDRESS**
   - Your deployed ERC721 NFT contract address on Optimism Sepolia
   - Format: `0x...` (42 characters, starts with 0x)
   - Example: `0x1234567890abcdef1234567890abcdef12345678`

3. **OPTIMISM_SEPOLIA_RPC** (Optional)
   - Custom RPC endpoint for Optimism Sepolia
   - Default: `https://sepolia.optimism.io`
   - You can use a custom RPC from Alchemy, Infura, etc. for better reliability

### How to Set Secrets:

**Option A: Using Supabase CLI**
```bash
# Set each secret
supabase secrets set MINTER_PRIVATE_KEY=your_private_key_here
supabase secrets set NFT_CONTRACT_ADDRESS=your_contract_address_here
supabase secrets set OPTIMISM_SEPOLIA_RPC=https://sepolia.optimism.io
```

**Option B: Using Supabase Dashboard**
1. Go to **Project Settings** → **Edge Functions**
2. Click on **"Secrets"** tab
3. Click **"Add Secret"**
4. Add each secret:
   - **Name**: `MINTER_PRIVATE_KEY`
   - **Value**: Your private key (starts with `0x`)
   - Click **"Save"**
5. Repeat for `NFT_CONTRACT_ADDRESS` and `OPTIMISM_SEPOLIA_RPC`

---

## ✅ Step 3: Set Up Database Webhook

The webhook automatically triggers NFT minting when a user earns a badge.

### Method 1: Using SQL (Recommended)

1. **Open Supabase SQL Editor**
   - Go to your Supabase Dashboard
   - Click **"SQL Editor"** in the left sidebar
   - Click **"New Query"**

2. **Get your project details:**
   - **Project Reference**: Go to **Project Settings** → **General** → Copy "Reference ID"
   - **Service Role Key**: Go to **Project Settings** → **API** → Copy "service_role" key

3. **Run this SQL** (replace placeholders):

```sql
-- Replace YOUR_PROJECT_REF with your project reference ID
-- Replace YOUR_SERVICE_ROLE_KEY with your service role key

CREATE OR REPLACE FUNCTION public.handle_new_badge()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  webhook_url TEXT;
  service_key TEXT;
BEGIN
  -- Update this URL with your project reference
  webhook_url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/mint-achievement-nft';
  
  -- Update this with your service role key
  service_key := 'YOUR_SERVICE_ROLE_KEY';
  
  -- Make HTTP POST request to edge function
  PERFORM
    net.http_post(
      url := webhook_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body := jsonb_build_object(
        'record', row_to_json(NEW)
      )
    );
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_badge_earned ON public."User Badges";

CREATE TRIGGER on_badge_earned
  AFTER INSERT ON public."User Badges"
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_badge();

-- Verify the trigger was created
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'User Badges'
  AND trigger_name = 'on_badge_earned';
```

### Method 2: Using Supabase Dashboard

1. Go to **Database** → **Webhooks**
2. Click **"Create a new webhook"**
3. Configure:
   - **Name**: `mint-badge-nft-webhook`
   - **Table**: `User Badges`
   - **Events**: Check **"INSERT"**
   - **Type**: **HTTP Request**
   - **Method**: `POST`
   - **URL**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/mint-achievement-nft`
   - **Headers**: Add `Authorization: Bearer YOUR_SERVICE_ROLE_KEY`
   - **Body**: Select **"Include new record"**
4. Click **"Save"**

---

## ✅ Step 4: Verify Smart Contract ABI

Make sure your NFT contract has these functions:

```solidity
function mint(address to, uint256 tokenId) public;
function ownerOf(uint256 tokenId) public view returns (address);
```

The edge function uses this ABI. If your contract has different function signatures, you'll need to update the ABI in `supabase/functions/mint-achievement-nft/index.ts`.

---

## ✅ Step 5: Test the Setup

### Test 1: Manual Function Test

Test the edge function directly:

```bash
# Get your access token
supabase functions invoke mint-achievement-nft \
  --body '{"user_id": "YOUR_USER_ID", "badge_id": "YOUR_BADGE_ID"}' \
  --header "Authorization: Bearer YOUR_ANON_KEY"
```

### Test 2: Earn a Badge

1. In your app, have a user earn a badge
2. Check the `verification_ledger` table:
   ```sql
   SELECT * FROM public.verification_ledger 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```
3. You should see a new entry with:
   - `user_id`: The user who earned the badge
   - `badge_id`: The badge that was earned
   - `status`: `pending`, `success`, or `failed`
   - `transaction_hash`: The blockchain transaction hash (if successful)

### Test 3: Check Edge Function Logs

1. Go to **Edge Functions** → **mint-achievement-nft**
2. Click **"Logs"** tab
3. Look for:
   - ✅ Success messages: "NFT minted successfully"
   - ❌ Error messages: Check what went wrong

---

## ✅ Step 6: Verify on Blockchain

Once a badge is minted successfully:

1. **Get the transaction hash** from `verification_ledger` table
2. **View on Optimism Sepolia Explorer**:
   ```
   https://sepolia-optimism.etherscan.io/tx/YOUR_TRANSACTION_HASH
   ```
3. **Verify the NFT**:
   - Check that the NFT was minted to the correct user wallet
   - Verify the token ID matches the expected format

---

## 🔍 Troubleshooting

### Issue: "MINTER_PRIVATE_KEY not found"
- **Solution**: Set the secret using `supabase secrets set MINTER_PRIVATE_KEY=...`

### Issue: "NFT_CONTRACT_ADDRESS not found"
- **Solution**: Set the secret using `supabase secrets set NFT_CONTRACT_ADDRESS=...`

### Issue: "User does not have a wallet address"
- **Solution**: Run the "Create User Wallets" function in the admin panel

### Issue: "Webhook not triggering"
- **Check**: Verify the trigger exists:
  ```sql
  SELECT * FROM information_schema.triggers 
  WHERE trigger_name = 'on_badge_earned';
  ```
- **Check**: Verify the webhook URL and service key are correct
- **Check**: Look at edge function logs for incoming requests

### Issue: "Transaction failed on blockchain"
- **Check**: Ensure the minter wallet has enough ETH for gas fees
- **Check**: Verify the contract address is correct
- **Check**: Ensure the contract's `mint()` function is public and callable
- **Check**: Verify the token ID isn't already minted (duplicate prevention)

---

## 📋 Quick Reference

### Edge Function Secrets:
- `MINTER_PRIVATE_KEY` - Required
- `NFT_CONTRACT_ADDRESS` - Required
- `OPTIMISM_SEPOLIA_RPC` - Optional (defaults to `https://sepolia.optimism.io`)

### Database Tables:
- `profiles` - Stores user wallet addresses
- `User Badges` - Tracks earned badges (triggers webhook)
- `verification_ledger` - Stores NFT minting records

### Important URLs:
- **Optimism Sepolia Explorer**: `https://sepolia-optimism.etherscan.io`
- **Edge Function**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/mint-achievement-nft`

---

## 🎉 Next Steps After Setup

Once everything is working:

1. **Monitor minting**: Check `verification_ledger` regularly
2. **Handle errors**: Set up alerts for failed mints
3. **Optimize gas**: Consider batching mints if you have many users
4. **User experience**: Show verification links in the badge gallery (already implemented!)

---

**Status**: ✅ Wallets Created → 🔄 **Next: Deploy Edge Function & Set Secrets**

