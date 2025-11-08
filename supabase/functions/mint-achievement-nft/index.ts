import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ethers } from "https://esm.sh/ethers@6.13.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

// Optimism Sepolia Testnet Configuration
// You can also use a custom RPC endpoint via environment variable: OPTIMISM_SEPOLIA_RPC
const OPTIMISM_SEPOLIA_RPC = Deno.env.get("OPTIMISM_SEPOLIA_RPC") || "https://sepolia.optimism.io";
const OPTIMISM_SEPOLIA_CHAIN_ID = 11155420;

// Simple ERC721-like ABI for minting
const NFT_CONTRACT_ABI = [
  "function mint(address to, uint256 tokenId) public",
  "function ownerOf(uint256 tokenId) public view returns (address)",
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Initialize Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Parse webhook payload (from database webhook)
    const webhookPayload = await req.json();
    console.log("Received webhook payload:", JSON.stringify(webhookPayload, null, 2));

    // Extract data from webhook - webhook sends the new row in different formats
    // Handle both direct row data and nested 'record' or 'new' format
    let userBadgeData = webhookPayload.record || webhookPayload.new || webhookPayload;
    
    const userId = userBadgeData.user_id;
    const badgeId = userBadgeData.badge_id;

    if (!userId || !badgeId) {
      throw new Error("Missing user_id or badge_id in webhook payload");
    }

    console.log(`Processing NFT mint for user ${userId}, badge ${badgeId}`);

    // Get user's wallet address from profiles table
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("wallet_address")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      throw new Error(`Failed to fetch user profile: ${profileError?.message || "Profile not found"}`);
    }

    if (!profile.wallet_address) {
      throw new Error(`User ${userId} does not have a wallet address. Please ensure create-user-wallet function has run.`);
    }

    console.log(`User wallet address: ${profile.wallet_address}`);

    // IDEMPOTENCY CHECK: Check if this badge has already been processed for this user
    // This prevents duplicate webhook calls from processing the same badge multiple times
    const { data: existingVerification } = await supabaseClient
      .from("verification_ledger")
      .select("id, status, transaction_hash, created_at")
      .eq("user_id", userId)
      .eq("badge_id", badgeId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // If a successful verification exists, return immediately
    if (existingVerification && existingVerification.status === "success" && existingVerification.transaction_hash) {
      console.log(`NFT already minted for this badge. Transaction: ${existingVerification.transaction_hash}`);
      return new Response(
        JSON.stringify({
          success: true,
          message: "NFT already minted for this badge",
          transactionHash: existingVerification.transaction_hash,
          ledgerId: existingVerification.id,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // If a pending verification exists (created within last 5 minutes), skip to prevent duplicate processing
    if (existingVerification && existingVerification.status === "pending") {
      const createdAt = new Date(existingVerification.created_at);
      const now = new Date();
      const minutesSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60);
      
      if (minutesSinceCreation < 5) {
        console.log(`Verification already in progress for this badge (created ${minutesSinceCreation.toFixed(1)} minutes ago). Skipping duplicate webhook call.`);
        return new Response(
          JSON.stringify({
            success: false,
            message: "Verification already in progress. Please wait.",
            ledgerId: existingVerification.id,
            status: "pending",
          }),
          {
            status: 200, // Return 200 to acknowledge webhook, but indicate it's a duplicate
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } else {
        // Pending verification is old (>5 minutes), might be stuck, allow retry
        console.log(`Found old pending verification (${minutesSinceCreation.toFixed(1)} minutes old). Allowing retry.`);
      }
    }

    // Get MINTER_PRIVATE_KEY from environment variable
    // Note: In Supabase, you can set this as an edge function secret via:
    // supabase secrets set MINTER_PRIVATE_KEY=your_private_key_here
    // Or via the Supabase Dashboard: Project Settings > Edge Functions > Secrets
    const minterPrivateKey = Deno.env.get("MINTER_PRIVATE_KEY");
    
    if (!minterPrivateKey) {
      throw new Error(
        "MINTER_PRIVATE_KEY not found. Please set it as an edge function secret:\n" +
        "supabase secrets set MINTER_PRIVATE_KEY=your_private_key_here"
      );
    }

    // Get contract address from environment variable
    // Set this via: supabase secrets set NFT_CONTRACT_ADDRESS=0xYourContractAddress
    const contractAddress = Deno.env.get("NFT_CONTRACT_ADDRESS");
    
    if (!contractAddress) {
      throw new Error(
        "NFT_CONTRACT_ADDRESS not found. Please set it as an edge function secret:\n" +
        "supabase secrets set NFT_CONTRACT_ADDRESS=0xYourContractAddress"
      );
    }

    // Validate contract address format
    if (!ethers.isAddress(contractAddress)) {
      throw new Error(`Invalid contract address format: ${contractAddress}`);
    }

    // Create a record in verification_ledger with 'pending' status
    const { data: ledgerEntry, error: ledgerError } = await supabaseClient
      .from("verification_ledger")
      .insert({
        user_id: userId,
        badge_id: badgeId,
        status: "pending",
      })
      .select()
      .single();

    if (ledgerError) {
      throw new Error(`Failed to create verification ledger entry: ${ledgerError.message}`);
    }

    console.log(`Created verification ledger entry: ${ledgerEntry.id}`);

    try {
      // Connect to Optimism Sepolia
      const provider = new ethers.JsonRpcProvider(OPTIMISM_SEPOLIA_RPC);
      const wallet = new ethers.Wallet(minterPrivateKey, provider);

      // Verify we're on the correct network
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== OPTIMISM_SEPOLIA_CHAIN_ID) {
        throw new Error(`Wrong network. Expected ${OPTIMISM_SEPOLIA_CHAIN_ID}, got ${network.chainId}`);
      }

      console.log(`Connected to Optimism Sepolia. Minter address: ${wallet.address}`);

      // Create contract instance
      const contract = new ethers.Contract(contractAddress, NFT_CONTRACT_ABI, wallet);

      // Convert badge_id (UUID) to a deterministic numeric tokenId
      // We use a hash of userId + badgeId to ensure uniqueness and determinism
      // This ensures the same badge for the same user always gets the same tokenId
      const hashInput = `${userId}-${badgeId}`;
      const hash = ethers.keccak256(ethers.toUtf8Bytes(hashInput));
      // Convert hash to BigInt for tokenId (uint256 can hold the full hash)
      const tokenId = BigInt(hash);

      console.log(`Minting NFT with tokenId: ${tokenId.toString()} to address: ${profile.wallet_address}`);

      // Call mint function
      let tx;
      let transactionHash: string;
      let receipt: ethers.TransactionReceipt | null = null;
      
      try {
        tx = await contract.mint(profile.wallet_address, tokenId);
        transactionHash = tx.hash;
        console.log(`Transaction sent: ${transactionHash}`);
        
        // Wait for transaction confirmation
        console.log("Waiting for transaction confirmation...");
        receipt = await tx.wait();
        console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
      } catch (sendError: any) {
        // Log the full error for debugging
        console.error("Transaction send error details:", JSON.stringify({
          code: sendError?.code,
          message: sendError?.message,
          errorCode: sendError?.error?.code,
          errorMessage: sendError?.error?.message,
          shortMessage: sendError?.shortMessage,
        }, null, 2));
        
        // Handle "already known" error - transaction was already submitted to mempool
        // Check multiple possible error formats
        const errorMessage = sendError?.error?.message || sendError?.message || "";
        const errorCode = sendError?.error?.code || sendError?.code;
        const isAlreadyKnownError = 
          errorMessage === "already known" || 
          errorMessage.includes("already known") ||
          (sendError?.code === "UNKNOWN_ERROR" && errorMessage === "already known") ||
          (errorCode === -32000 && errorMessage === "already known");
        
        console.log(`Is already known error: ${isAlreadyKnownError}, errorMessage: ${errorMessage}`);
        
        if (isAlreadyKnownError) {
          console.warn("Transaction already submitted to mempool. This usually means the transaction was already broadcast.");
          console.warn("Checking for pending transaction or waiting for confirmation...");
          
          // Check if we have a transaction hash from a previous attempt
          // First check the current ledger entry (might have been created in a previous run)
          const { data: currentLedger } = await supabaseClient
            .from("verification_ledger")
            .select("transaction_hash, status")
            .eq("id", ledgerEntry.id)
            .single();
          
          // Also check for any existing verification for this user/badge
          const { data: existingLedger } = await supabaseClient
            .from("verification_ledger")
            .select("transaction_hash, status")
            .eq("user_id", userId)
            .eq("badge_id", badgeId)
            .not("transaction_hash", "is", null)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          
          // Use current ledger entry first, then fall back to existing
          const ledgerWithHash = currentLedger?.transaction_hash ? currentLedger : existingLedger;
          
          if (ledgerWithHash?.transaction_hash) {
            transactionHash = ledgerWithHash.transaction_hash;
            console.log(`Found existing transaction hash: ${transactionHash}`);
            
            // Check if transaction is already confirmed
            try {
              receipt = await provider.getTransactionReceipt(transactionHash);
              if (receipt) {
                console.log(`Transaction already confirmed in block ${receipt.blockNumber}`);
              } else {
                // Transaction is pending, wait for it
                console.log("Transaction is pending, waiting for confirmation...");
                receipt = await provider.waitForTransaction(transactionHash, 1, 60000); // Wait up to 60 seconds
                console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
              }
            } catch (receiptError: any) {
              console.warn("Could not get transaction receipt:", receiptError.message);
              // The transaction might still be pending, but we'll treat it as a warning
              // and let the normal flow continue
              throw new Error(`Transaction was already submitted but receipt unavailable: ${receiptError.message}`);
            }
          } else {
            // No existing transaction hash found - try to extract from raw transaction or check pending
            console.warn("Transaction 'already known' but no hash found in ledger. This might be a duplicate nonce issue.");
            console.warn("The transaction may still be processing. Marking as pending and will retry later.");
            
            // Update ledger to indicate we're aware of the issue
            await supabaseClient
              .from("verification_ledger")
              .update({
                status: "pending",
                error_message: "Transaction already in mempool but hash not available. May need manual check.",
              })
              .eq("id", ledgerEntry.id);
            
            // Return a response indicating the transaction is pending
            return new Response(
              JSON.stringify({
                success: false,
                message: "Transaction already submitted to mempool but hash not available. Please check blockchain explorer or retry later.",
                ledgerId: ledgerEntry.id,
                status: "pending",
              }),
              {
                status: 202, // Accepted but not completed
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
        } else {
          // Not an "already known" error, rethrow
          throw sendError;
        }
      }

      // Ensure we have a transaction hash
      if (!transactionHash) {
        throw new Error("Transaction hash not available after mint attempt");
      }

      // Update verification_ledger with success status and transaction hash
      const { error: updateError } = await supabaseClient
        .from("verification_ledger")
        .update({
          status: "success",
          transaction_hash: transactionHash,
        })
        .eq("id", ledgerEntry.id);

      if (updateError) {
        console.error("Failed to update verification ledger:", updateError);
        // Don't throw - the mint was successful
      }

      // Get block number from receipt
      const blockNumber = receipt?.blockNumber || null;

      return new Response(
        JSON.stringify({
          success: true,
          message: "NFT minted successfully",
          transactionHash: transactionHash,
          tokenId: tokenId.toString(),
          blockNumber: blockNumber,
          ledgerId: ledgerEntry.id,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (blockchainError: any) {
      console.error("Blockchain error:", blockchainError);

      // Update verification_ledger with failed status
      const errorMessage = blockchainError.message || "Unknown blockchain error";
      await supabaseClient
        .from("verification_ledger")
        .update({
          status: "failed",
          error_message: errorMessage,
        })
        .eq("id", ledgerEntry.id);

      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to mint NFT",
          message: errorMessage,
          ledgerId: ledgerEntry.id,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error: any) {
    console.error("Error in mint-badge-nft function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

