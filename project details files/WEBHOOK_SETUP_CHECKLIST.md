# Quick Setup Checklist

## ✅ Step 2: Database Webhook Setup

### Option A: Dashboard Method (Easiest)

- [ ] Go to Supabase Dashboard → Database → Webhooks
- [ ] Click "Create a new webhook"
- [ ] Fill in:
  - [ ] Name: `mint-badge-nft-webhook`
  - [ ] Table: `User Badges` (note: table name has spaces)
  - [ ] Events: ✅ INSERT (checked)
  - [ ] Type: HTTP Request
  - [ ] Method: POST
  - [ ] URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/mint-achievement-nft`
  - [ ] Header: `Authorization` = `Bearer YOUR_SERVICE_ROLE_KEY`
  - [ ] Body: Include new record ✅
- [ ] Click "Save"
- [ ] ✅ Webhook created!

### Option B: SQL Method

- [ ] Open SQL Editor in Supabase Dashboard
- [ ] Open file: `supabase/migrations/setup_nft_webhook.sql`
- [ ] Replace `YOUR_PROJECT_REF` with your project ID
- [ ] Replace `YOUR_SERVICE_ROLE_KEY` with your service role key
- [ ] Run the SQL
- [ ] ✅ Webhook created!

### Finding Your Project Reference ID

1. Go to Project Settings (⚙️ icon)
2. Look for "Reference ID" under General
3. Or check your Supabase URL: `https://[REFERENCE_ID].supabase.co`

### Finding Your Service Role Key

1. Go to Project Settings → API
2. Find "service_role" key (⚠️ Keep secret!)
3. Copy the entire key (starts with `eyJ...`)

---

## ✅ Step 3: Smart Contract ABI Verification

### Check Your Contract

- [ ] Do you know your contract's mint function name?
  - [ ] `mint` → ✅ Already configured
  - [ ] `safeMint` → Need to update
  - [ ] Other → Need to update

- [ ] Do you know your contract's mint function parameters?
  - [ ] `mint(address to, uint256 tokenId)` → ✅ Already configured
  - [ ] `mint(address to)` → Need to update
  - [ ] `mint(address to, uint256 tokenId, string uri)` → Need to update
  - [ ] Other → Need to update

### Update ABI (if needed)

1. Open: `supabase/functions/mint-achievement-nft/index.ts`
2. Find line ~18: `const NFT_CONTRACT_ABI = [...]`
3. Update the function signature to match your contract
4. Update the function call (line ~174) if function name changed
5. Save file

### Verify Contract Address

- [ ] Set contract address secret:
  ```bash
  supabase secrets set NFT_CONTRACT_ADDRESS=0xYourContractAddress
  ```
- [ ] Verify address format:
  - Starts with `0x`
  - 42 characters total
  - Valid hex characters

---

## 🧪 Testing

### Test the Webhook

1. **Insert test badge** (in SQL Editor):
```sql
INSERT INTO public."User Badges" (user_id, badge_id, earned_at)
VALUES ('real-user-uuid', 'real-badge-uuid', NOW());
```

2. **Check function logs**:
   - Go to Edge Functions → mint-achievement-nft → Logs
   - Should see webhook triggered

3. **Check verification_ledger**:
```sql
SELECT * FROM public.verification_ledger 
ORDER BY created_at DESC LIMIT 5;
```

### Expected Results

- ✅ Function receives webhook payload
- ✅ Function connects to blockchain
- ✅ Transaction is sent
- ✅ Transaction hash saved to `verification_ledger`
- ✅ Status = "success"

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Webhook not triggering | Check table name is `user_achievements`, event is INSERT |
| Function not receiving data | Check Authorization header has correct service role key |
| Contract call failing | Verify ABI matches your contract's mint function |
| "execution reverted" | Check minter wallet has permission to mint |
| "insufficient funds" | Add ETH to minter wallet for gas fees |

---

## 📝 Quick Reference

**Webhook URL Format:**
```
https://[PROJECT_REF].supabase.co/functions/v1/mint-achievement-nft
```

**Authorization Header:**
```
Bearer [SERVICE_ROLE_KEY]
```

**Current ABI (Standard ERC721):**
```typescript
"function mint(address to, uint256 tokenId) public"
```

**Required Secrets:**
- `MINTER_PRIVATE_KEY` ✅ (You said this is done)
- `NFT_CONTRACT_ADDRESS` ⚠️ (Set this!)

---

## 🎯 You're Done When:

- [x] Step 1: Secrets configured ✅
- [ ] Step 2: Webhook created and tested
- [ ] Step 3: Contract ABI verified/updated
- [ ] Test mint successful
- [ ] Transaction hash appears in `verification_ledger`

