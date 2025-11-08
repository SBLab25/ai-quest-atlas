import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ethers } from "https://esm.sh/ethers@6.13.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Auth header is optional - function will work with or without it
    // If provided, it will check for admin role (optional security)
    const authHeader = req.headers.get("Authorization");

    // Initialize Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify the user is an admin (optional security check - can be disabled for testing)
    // Set SKIP_AUTH_CHECK=true in secrets to bypass this check
    const skipAuthCheck = Deno.env.get("SKIP_AUTH_CHECK") === "true";
    
    if (!skipAuthCheck && authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
        if (authError || !user) {
          console.warn("Auth check failed, but continuing:", authError);
          // Continue anyway - auth is optional
        } else {
          // Check if user is admin (optional - comment out if you don't use roles)
          try {
            const { data: profile } = await supabaseClient
              .from("profiles")
              .select("current_role")
              .eq("id", user.id)
              .single();
            
            if (profile?.current_role && profile.current_role !== "admin") {
              return new Response(
                JSON.stringify({
                  success: false,
                  error: "Unauthorized - Admin access required",
                }),
                {
                  status: 403,
                  headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
              );
            }
          } catch (roleCheckError) {
            console.warn("Role check failed, proceeding anyway:", roleCheckError);
            // Continue if role check fails
          }
        }
      } catch (authCheckError) {
        console.warn("Auth check failed, proceeding anyway:", authCheckError);
        // Continue if auth check fails (for development/testing)
      }
    }

    // Get encryption key from environment (for encrypting private keys)
    // You should set this as a secret: supabase secrets set WALLET_ENCRYPTION_KEY=your-key-here
    const encryptionKey = Deno.env.get("WALLET_ENCRYPTION_KEY") || "default-encryption-key-change-me";
    
    // Simple encryption function (XOR cipher for simplicity - in production, use proper encryption)
    function encryptPrivateKey(privateKey: string, key: string): string {
      // For production, use proper encryption like AES-256-GCM
      // This is a simple XOR cipher for demonstration
      const keyBytes = new TextEncoder().encode(key);
      const dataBytes = new TextEncoder().encode(privateKey);
      const encrypted = dataBytes.map((byte, i) => byte ^ keyBytes[i % keyBytes.length]);
      return btoa(String.fromCharCode(...encrypted));
    }

    // Get all users without wallet addresses
    const { data: usersWithoutWallets, error: fetchError } = await supabaseClient
      .from("profiles")
      .select("id")
      .is("wallet_address", null)
      .limit(100); // Process in batches of 100

    if (fetchError) {
      throw new Error(`Failed to fetch users: ${fetchError.message}`);
    }

    if (!usersWithoutWallets || usersWithoutWallets.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "All users already have wallet addresses",
          walletsCreated: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Found ${usersWithoutWallets.length} users without wallet addresses`);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Create wallets for each user
    for (const user of usersWithoutWallets) {
      try {
        // Generate a new random wallet
        const wallet = ethers.Wallet.createRandom();
        const walletAddress = wallet.address;
        const privateKey = wallet.privateKey;

        // Encrypt the private key
        const encryptedPrivateKey = encryptPrivateKey(privateKey, encryptionKey);

        // Update user's profile with wallet address and encrypted private key
        const { error: updateError } = await supabaseClient
          .from("profiles")
          .update({
            wallet_address: walletAddress,
            wallet_private_key_encrypted: encryptedPrivateKey,
          })
          .eq("id", user.id);

        if (updateError) {
          console.error(`Failed to update wallet for user ${user.id}:`, updateError);
          errorCount++;
          errors.push(`User ${user.id}: ${updateError.message}`);
        } else {
          console.log(`Created wallet for user ${user.id}: ${walletAddress}`);
          successCount++;
        }
      } catch (error: any) {
        console.error(`Error creating wallet for user ${user.id}:`, error);
        errorCount++;
        errors.push(`User ${user.id}: ${error.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Wallet creation completed. ${successCount} wallets created, ${errorCount} errors.`,
        walletsCreated: successCount,
        errors: errorCount,
        errorDetails: errors.length > 0 ? errors : undefined,
        totalProcessed: usersWithoutWallets.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in create-user-wallets-batch function:", error);
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

