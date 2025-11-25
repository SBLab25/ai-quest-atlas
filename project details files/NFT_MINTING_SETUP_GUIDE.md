# NFT Minting Setup Guide - Steps 2 & 3

This guide will walk you through setting up the database webhook and verifying your smart contract configuration.

---

## Step 2: Setting Up the Database Webhook

The webhook will automatically trigger your `mint-achievement-nft` function whenever a new badge is earned (a new row is inserted into `User Badges` table).

### Method 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Navigate to Database Webhooks**
   - In the left sidebar, click on **"Database"**
   - Click on **"Webhooks"** (you may need to scroll down or look in the Database section)

3. **Create New Webhook**
   - Click the **"Create a new webhook"** or **"New Webhook"** button
   - You'll see a form to configure the webhook

4. **Configure the Webhook**
   
   **Basic Settings:**
   - **Name**: `mint-badge-nft-webhook` (or any name you prefer)
   - **Table**: Select `User Badges` from the dropdown (note: table name has spaces, so it's in quotes)
   - **Events**: Check **"INSERT"** (this triggers when a new badge is earned)
   - **Type**: Select **"HTTP Request"**

   **HTTP Request Settings:**
   - **Method**: `POST`
   - **URL**: 
     ```
     https://YOUR_PROJECT_REF.supabase.co/functions/v1/mint-achievement-nft
     ```
     Replace `YOUR_PROJECT_REF` with your actual Supabase project reference ID.
     
     To find your project reference:
     - Go to Project Settings (gear icon in left sidebar)
     - Look at the "Reference ID" under "General"
     - Or check your Supabase URL in any API call

   - **HTTP Headers**: Click "Add Header" and add:
     - **Key**: `Authorization`
     - **Value**: `Bearer YOUR_SERVICE_ROLE_KEY`
     
     To find your Service Role Key:
     - Go to Project Settings > API
     - Copy the "service_role" key (⚠️ Keep this secret! It has admin access)
     - The value should look like: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

   - **HTTP Request Body**: 
     - Select **"Include new record"** or **"JSON"**
     - This ensures the new row data is sent to your function

5. **Save the Webhook**
   - Click **"Save"** or **"Create Webhook"**
   - The webhook is now active!

### Method 2: Using SQL (Alternative)

If you prefer SQL or the dashboard method doesn't work, you can create the webhook using SQL:

1. **Open SQL Editor**
   - In Supabase Dashboard, go to **"SQL Editor"** in the left sidebar
   - Click **"New Query"**

2. **Run this SQL** (replace the placeholders):

```sql
-- Create webhook function (if not exists)
CREATE OR REPLACE FUNCTION public.handle_new_badge()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/mint-achievement-nft',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
      ),
      body := jsonb_build_object(
        'record', row_to_json(NEW)
      )
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_badge_earned ON public."User Badges";
CREATE TRIGGER on_badge_earned
  AFTER INSERT ON public."User Badges"
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_badge();
```

**Replace:**
- `YOUR_PROJECT_REF` with your Supabase project reference
- `YOUR_SERVICE_ROLE_KEY` with your service role key

### Testing the Webhook

1. **Test Manually** (using SQL Editor):
```sql
-- Insert a test badge (replace with real UUIDs)
INSERT INTO public."User Badges" (user_id, badge_id, earned_at)
VALUES (
  'YOUR_USER_ID_HERE',  -- Replace with a real user UUID
  'YOUR_BADGE_ID_HERE',  -- Replace with a real badge UUID
  NOW()
);
```

2. **Check Function Logs**:
   - Go to **Edge Functions** in the left sidebar
   - Click on **"mint-achievement-nft"**
   - Click on **"Logs"** tab
   - You should see the webhook being triggered and the function executing

3. **Check Verification Ledger**:
```sql
SELECT * FROM public.verification_ledger 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## Step 3: Verifying/Updating Smart Contract ABI

The ABI (Application Binary Interface) tells the function how to interact with your smart contract. You need to verify that the `mint` function signature matches your contract.

### Step 3.1: Check Your Smart Contract

You need to know:
1. **Your contract's mint function signature**
2. **The contract address** (you mentioned it starts with `0x98C...`)

### Step 3.2: Common Mint Function Signatures

Here are the most common NFT mint function signatures:

#### Option A: Standard Mint (Current in code)
```solidity
function mint(address to, uint256 tokenId) public
```
- **Parameters**: Recipient address + Token ID
- **Current ABI**: ✅ Already configured correctly

#### Option B: Safe Mint
```solidity
function safeMint(address to, uint256 tokenId) public
```
- **Update needed**: Change `mint` to `safeMint` in the ABI

#### Option C: Mint without Token ID
```solidity
function mint(address to) public returns (uint256)
```
- **Update needed**: Remove `tokenId` parameter

#### Option D: Mint with URI
```solidity
function mint(address to, uint256 tokenId, string memory uri) public
```
- **Update needed**: Add `uri` parameter

### Step 3.3: How to Find Your Contract's ABI

**Method 1: From Your Contract Source Code**
- Open your Solidity contract file
- Find the `mint` function
- Note the exact function name and parameters

**Method 2: From Block Explorer**
1. Go to [Optimism Sepolia Block Explorer](https://sepolia-optimism.etherscan.io/)
2. Search for your contract address (the one starting with `0x98C...`)
3. Click on the **"Contract"** tab
4. Look for the **"Contract ABI"** section
5. Find the `mint` function in the ABI JSON

**Method 3: From Your Deployment Script**
- Check your Hardhat/Truffle deployment script
- Look for the contract ABI export

### Step 3.4: Update the ABI in Your Function

1. **Open the function file**:
   ```
   supabase/functions/mint-achievement-nft/index.ts
   ```

2. **Find the ABI constant** (around line 17-20):
   ```typescript
   const NFT_CONTRACT_ABI = [
     "function mint(address to, uint256 tokenId) public",
     "function ownerOf(uint256 tokenId) public view returns (address)",
   ];
   ```

3. **Update based on your contract**:

   **If your contract uses `safeMint`:**
   ```typescript
   const NFT_CONTRACT_ABI = [
     "function safeMint(address to, uint256 tokenId) public",
     "function ownerOf(uint256 tokenId) public view returns (address)",
   ];
   ```
   And update the function call (around line 174):
   ```typescript
   const tx = await contract.safeMint(profile.wallet_address, tokenId);
   ```

   **If your contract doesn't use tokenId:**
   ```typescript
   const NFT_CONTRACT_ABI = [
     "function mint(address to) public returns (uint256)",
     "function ownerOf(uint256 tokenId) public view returns (address)",
   ];
   ```
   And update the function call:
   ```typescript
   const tx = await contract.mint(profile.wallet_address);
   ```

   **If your contract needs a URI:**
   ```typescript
   const NFT_CONTRACT_ABI = [
     "function mint(address to, uint256 tokenId, string memory uri) public",
     "function ownerOf(uint256 tokenId) public view returns (address)",
   ];
   ```
   And update the function call:
   ```typescript
   const tokenURI = `https://your-api.com/nft/${tokenId}`;
   const tx = await contract.mint(profile.wallet_address, tokenId, tokenURI);
   ```

4. **Save the file**

### Step 3.5: Verify Contract Address

Make sure your contract address is set correctly:

1. **Check your secrets**:
   ```bash
   supabase secrets list
   ```
   Look for `NFT_CONTRACT_ADDRESS`

2. **If not set, set it**:
   ```bash
   supabase secrets set NFT_CONTRACT_ADDRESS=0xYourActualContractAddress
   ```

3. **Verify the address format**:
   - Should start with `0x`
   - Should be 42 characters long (0x + 40 hex characters)
   - Example: `0x98C1234567890abcdef1234567890abcdef12345`

### Step 3.6: Test the Contract Connection

You can test if your contract is accessible:

1. **Deploy your function** (if not already):
   ```bash
   supabase functions deploy mint-achievement-nft
   ```

2. **Check function logs** after a webhook trigger to see if:
   - ✅ Contract connection succeeds
   - ✅ Function call succeeds
   - ❌ Any errors about function signature mismatch

---

## Troubleshooting

### Webhook Not Triggering?

1. **Check webhook is enabled**: In Dashboard > Database > Webhooks, verify it's active
2. **Check table name**: Make sure webhook is on `User Badges` table (note: table name has spaces)
3. **Check INSERT events**: Verify "INSERT" is checked
4. **Test manually**: Use the SQL test query above

### Function Not Receiving Data?

1. **Check webhook payload format**: The function expects either:
   - `{ record: { user_id: ..., badge_id: ... } }`
   - `{ new: { user_id: ..., badge_id: ... } }`
   - `{ user_id: ..., badge_id: ... }`

2. **Check function logs**: Look for "Received webhook payload" log entry

### Contract Call Failing?

1. **Check ABI matches**: Verify function name and parameters
2. **Check contract address**: Ensure it's correct and on Optimism Sepolia
3. **Check minter wallet**: Ensure it has ETH for gas fees
4. **Check contract permissions**: Ensure the minter address has permission to mint

### Common Errors:

- **"execution reverted"**: Contract function signature mismatch or permission issue
- **"insufficient funds"**: Minter wallet needs more ETH
- **"invalid address"**: Contract address format is wrong
- **"function not found"**: ABI doesn't match contract

---

## Next Steps After Setup

1. ✅ Webhook is configured
2. ✅ Contract ABI is verified
3. ✅ Secrets are set (MINTER_PRIVATE_KEY, NFT_CONTRACT_ADDRESS)
4. ✅ Function is deployed

**Test the full flow:**
1. Unlock an achievement for a test user
2. Check function logs to see minting process
3. Check `verification_ledger` table for transaction hash
4. Verify NFT on Optimism Sepolia block explorer

---

## Need Help?

If you encounter issues:
1. Check the function logs in Supabase Dashboard
2. Verify all secrets are set correctly
3. Ensure your contract is deployed on Optimism Sepolia
4. Make sure the minter wallet has ETH for gas fees

