# Wallet Creation for Existing Users

This guide explains how to create blockchain wallets for existing users who don't have wallet addresses yet.

## Problem

When users earn badges, the NFT minting function requires them to have a wallet address. Existing users who signed up before the wallet system was implemented don't have wallet addresses, causing the minting to fail.

## Solution

A batch wallet creation system has been implemented:

1. **Edge Function**: `create-user-wallets-batch` - Creates wallets for users without wallet addresses
2. **Admin Panel Component**: `CreateUserWallets` - UI button in admin panel to trigger wallet creation

## Files Created

### 1. Edge Function
- **Location**: `supabase/functions/create-user-wallets-batch/index.ts`
- **Purpose**: Batch creates Optimism Sepolia wallets for users without wallet addresses
- **Features**:
  - Processes up to 100 users at a time
  - Generates random wallets using ethers.js
  - Encrypts private keys before storing
  - Updates user profiles with wallet address and encrypted private key

### 2. Admin Panel Component
- **Location**: `src/components/admin/CreateUserWallets.tsx`
- **Purpose**: Provides UI for admins to create wallets for users
- **Features**:
  - Shows statistics (total users, users with/without wallets)
  - One-click button to create wallets for all users without wallets
  - Progress feedback and error handling

## Setup Instructions

### Step 1: Deploy the Edge Function

```bash
supabase functions deploy create-user-wallets-batch
```

### Step 2: Set Encryption Key (Optional but Recommended)

For better security, set a custom encryption key:

```bash
supabase secrets set WALLET_ENCRYPTION_KEY=your-secure-random-key-here
```

**Note**: If you don't set this, a default key will be used (not recommended for production).

### Step 3: Use the Admin Panel

1. Go to Admin Panel → Users tab
2. You'll see the "Create User Wallets" card at the top
3. It shows:
   - Total users
   - Users with wallets
   - Users without wallets
4. Click "Create Wallets for All Users" button
5. Wait for the process to complete (shows success/error message)

## How It Works

1. **Finds Users**: Queries `profiles` table for users where `wallet_address` is NULL
2. **Generates Wallets**: Creates a new random Ethereum wallet for each user using `ethers.Wallet.createRandom()`
3. **Encrypts Keys**: Encrypts the private key using the encryption key
4. **Saves to Database**: Updates the user's profile with:
   - `wallet_address`: The public wallet address (e.g., `0x1234...`)
   - `wallet_private_key_encrypted`: The encrypted private key

## Security Notes

⚠️ **Important Security Considerations**:

1. **Encryption**: The current implementation uses a simple XOR cipher. For production, consider:
   - Using AES-256-GCM encryption
   - Storing encryption keys in Supabase Vault
   - Using a proper encryption library

2. **Private Keys**: 
   - Private keys are encrypted before storage
   - Users never see or need to manage these keys
   - The system handles all blockchain operations automatically

3. **Access Control**:
   - Only admins can trigger wallet creation
   - The edge function uses service role key for database access

## Batch Processing

- The function processes **100 users at a time** to avoid timeouts
- If you have more than 100 users without wallets, run the function multiple times
- Each run will process the next batch of users

## Testing

### Test the Function Directly

```bash
# Using Supabase CLI
supabase functions invoke create-user-wallets-batch
```

### Test via Admin Panel

1. Go to Admin Panel → Users tab
2. Click "Refresh Stats" to see current wallet status
3. Click "Create Wallets for All Users"
4. Check the success message for number of wallets created

### Verify Wallets Were Created

```sql
-- Check users with wallets
SELECT id, wallet_address, created_at 
FROM profiles 
WHERE wallet_address IS NOT NULL
ORDER BY created_at DESC;

-- Check users still without wallets
SELECT COUNT(*) 
FROM profiles 
WHERE wallet_address IS NULL;
```

## Troubleshooting

### Issue: "Function not found"
- **Solution**: Deploy the function: `supabase functions deploy create-user-wallets-batch`

### Issue: "Permission denied"
- **Solution**: Ensure you're logged in as an admin user

### Issue: "No users found"
- **Solution**: All users already have wallets, or check the query in the function

### Issue: "Some wallets failed to create"
- **Solution**: Check the error details in the response. Common causes:
  - Database connection issues
  - RLS policies blocking updates
  - Invalid user IDs

## Next Steps

After creating wallets:

1. ✅ All users have wallet addresses
2. ✅ Badge NFT minting will work automatically
3. ✅ Users can verify their NFTs on Optimism Sepolia block explorer

## Future Improvements

Consider implementing:

1. **Better Encryption**: Use AES-256-GCM or similar
2. **Automatic Wallet Creation**: Create wallets when users sign up (via database trigger)
3. **Wallet Recovery**: System to recover/regenerate wallets if needed
4. **Batch Size Configuration**: Make batch size configurable
5. **Progress Tracking**: Show real-time progress for large batches

