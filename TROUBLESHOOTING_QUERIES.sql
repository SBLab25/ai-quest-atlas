-- ============================================
-- TROUBLESHOOTING QUERIES FOR NFT MINTING
-- ============================================
-- Use these queries to debug and monitor NFT minting
-- ============================================

-- 1. View recent verification ledger entries with user and badge info
SELECT 
  vl.id,
  vl.user_id,
  vl.badge_id,
  vl.status,
  vl.transaction_hash,
  vl.error_message,
  vl.created_at,
  p.username,
  p.wallet_address,
  b.name as badge_name
FROM verification_ledger vl
LEFT JOIN profiles p ON p.id = vl.user_id
LEFT JOIN "Badges" b ON b.id = vl.badge_id
ORDER BY vl.created_at DESC
LIMIT 20;

-- 2. Check for duplicate verifications (same user + badge)
SELECT 
  user_id,
  badge_id,
  COUNT(*) as verification_count,
  STRING_AGG(status, ', ') as statuses,
  STRING_AGG(transaction_hash::text, ', ') as transaction_hashes
FROM verification_ledger
GROUP BY user_id, badge_id
HAVING COUNT(*) > 1
ORDER BY verification_count DESC;

-- 3. Find pending verifications
SELECT 
  vl.id,
  vl.user_id,
  vl.badge_id,
  vl.status,
  vl.error_message,
  vl.created_at,
  p.username,
  b.name as badge_name
FROM verification_ledger vl
LEFT JOIN profiles p ON p.id = vl.user_id
LEFT JOIN "Badges" b ON b.id = vl.badge_id
WHERE vl.status = 'pending'
ORDER BY vl.created_at DESC;

-- 4. Find failed verifications
SELECT 
  vl.id,
  vl.user_id,
  vl.badge_id,
  vl.status,
  vl.error_message,
  vl.transaction_hash,
  vl.created_at,
  p.username,
  b.name as badge_name
FROM verification_ledger vl
LEFT JOIN profiles p ON p.id = vl.user_id
LEFT JOIN "Badges" b ON b.id = vl.badge_id
WHERE vl.status = 'failed'
ORDER BY vl.created_at DESC;

-- 5. Find successful verifications
SELECT 
  vl.id,
  vl.user_id,
  vl.badge_id,
  vl.transaction_hash,
  vl.created_at,
  p.username,
  b.name as badge_name,
  'https://sepolia-optimism.etherscan.io/tx/' || vl.transaction_hash as explorer_link
FROM verification_ledger vl
LEFT JOIN profiles p ON p.id = vl.user_id
LEFT JOIN "Badges" b ON b.id = vl.badge_id
WHERE vl.status = 'success'
ORDER BY vl.created_at DESC
LIMIT 20;

-- 6. Check users without wallets (should be 0 after wallet creation)
SELECT 
  id,
  username,
  email,
  wallet_address,
  created_at
FROM profiles
WHERE wallet_address IS NULL OR wallet_address = ''
ORDER BY created_at DESC;

-- 7. Count verifications by status
SELECT 
  status,
  COUNT(*) as count,
  COUNT(CASE WHEN transaction_hash IS NOT NULL THEN 1 END) as with_transaction_hash
FROM verification_ledger
GROUP BY status
ORDER BY count DESC;

-- 8. Find verifications for a specific user (replace USER_UUID)
-- Example: WHERE vl.user_id = '123e4567-e89b-12d3-a456-426614174000'
SELECT 
  vl.id,
  vl.badge_id,
  vl.status,
  vl.transaction_hash,
  vl.error_message,
  vl.created_at,
  b.name as badge_name,
  CASE 
    WHEN vl.transaction_hash IS NOT NULL 
    THEN 'https://sepolia-optimism.etherscan.io/tx/' || vl.transaction_hash 
    ELSE NULL 
  END as explorer_link
FROM verification_ledger vl
LEFT JOIN "Badges" b ON b.id = vl.badge_id
WHERE vl.user_id = 'REPLACE_WITH_USER_UUID'
ORDER BY vl.created_at DESC;

-- 9. Find verifications for a specific badge (replace BADGE_UUID)
-- Example: WHERE vl.badge_id = '123e4567-e89b-12d3-a456-426614174000'
SELECT 
  vl.id,
  vl.user_id,
  vl.status,
  vl.transaction_hash,
  vl.error_message,
  vl.created_at,
  p.username,
  p.wallet_address,
  CASE 
    WHEN vl.transaction_hash IS NOT NULL 
    THEN 'https://sepolia-optimism.etherscan.io/tx/' || vl.transaction_hash 
    ELSE NULL 
  END as explorer_link
FROM verification_ledger vl
LEFT JOIN profiles p ON p.id = vl.user_id
WHERE vl.badge_id = 'REPLACE_WITH_BADGE_UUID'
ORDER BY vl.created_at DESC;

-- 10. Check webhook trigger status
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'User Badges'
  AND trigger_name = 'on_badge_earned';

-- 11. View recent badge earnings (what triggers the webhook)
SELECT 
  ub.id,
  ub.user_id,
  ub.badge_id,
  ub.earned_at,
  p.username,
  b.name as badge_name
FROM "User Badges" ub
LEFT JOIN profiles p ON p.id = ub.user_id
LEFT JOIN "Badges" b ON b.id = ub.badge_id
ORDER BY ub.earned_at DESC
LIMIT 20;

-- 12. Compare badge earnings vs verifications (find missing verifications)
SELECT 
  ub.user_id,
  ub.badge_id,
  ub.earned_at as badge_earned_at,
  vl.status as verification_status,
  vl.transaction_hash,
  vl.created_at as verification_created_at,
  p.username,
  b.name as badge_name
FROM "User Badges" ub
LEFT JOIN verification_ledger vl ON vl.user_id = ub.user_id AND vl.badge_id = ub.badge_id
LEFT JOIN profiles p ON p.id = ub.user_id
LEFT JOIN "Badges" b ON b.id = ub.badge_id
WHERE vl.id IS NULL OR vl.status IN ('pending', 'failed')
ORDER BY ub.earned_at DESC
LIMIT 20;

