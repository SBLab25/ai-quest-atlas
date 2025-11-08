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
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body - can be called directly or from webhook
    const body = await req.json();
    const userId = body.user_id || body.id || body.record?.id || body.new?.id;

    if (!userId) {
      throw new Error("Missing user_id in request body");
    }

    console.log(`Creating wallet for user: ${userId}`);

    // Check if user already has a wallet
    const { data: existingProfile, error: fetchError } = await supabaseClient
      .from("profiles")
      .select("wallet_address")
      .eq("id", userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
      throw new Error(`Failed to fetch user profile: ${fetchError.message}`);
    }

    if (existingProfile?.wallet_address) {
      console.log(`User ${userId} already has a wallet: ${existingProfile.wallet_address}`);
      return new Response(
        JSON.stringify({
          success: true,
          message: "User already has a wallet",
          wallet_address: existingProfile.wallet_address,
          user_id: userId,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get encryption key from environment
    const encryptionKey = Deno.env.get("WALLET_ENCRYPTION_KEY") || "default-encryption-key-change-me";
    
    // Simple encryption function (XOR cipher - in production, use proper encryption)
    function encryptPrivateKey(privateKey: string, key: string): string {
      const keyBytes = new TextEncoder().encode(key);
      const dataBytes = new TextEncoder().encode(privateKey);
      const encrypted = dataBytes.map((byte, i) => byte ^ keyBytes[i % keyBytes.length]);
      return btoa(String.fromCharCode(...encrypted));
    }

    // Generate a new random Ethereum wallet
    const wallet = ethers.Wallet.createRandom();
    const walletAddress = wallet.address;
    const privateKey = wallet.privateKey;

    // Encrypt the private key
    const encryptedPrivateKey = encryptPrivateKey(privateKey, encryptionKey);

    console.log(`Generated wallet for user ${userId}: ${walletAddress}`);

    // Update user's profile with wallet address and encrypted private key
    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update({
        wallet_address: walletAddress,
        wallet_private_key_encrypted: encryptedPrivateKey,
      })
      .eq("id", userId);

    if (updateError) {
      throw new Error(`Failed to update profile with wallet: ${updateError.message}`);
    }

    console.log(`Successfully created wallet for user ${userId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Wallet created successfully",
        wallet_address: walletAddress,
        user_id: userId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in create-user-wallet function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to create wallet",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

