import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { userId, questDifficulty, reason } = await req.json();

    if (!userId) {
      throw new Error("User ID is required");
    }

    console.log(`Awarding power-up to user ${userId}, reason: ${reason}`);

    // Define drop rates based on quest difficulty
    const dropRates: Record<string, { chance: number; rarityWeights: Record<string, number> }> = {
      easy: { chance: 0.05, rarityWeights: { common: 1.0, rare: 0, epic: 0, legendary: 0 } },
      medium: { chance: 0.15, rarityWeights: { common: 0.7, rare: 0.3, epic: 0, legendary: 0 } },
      hard: { chance: 0.30, rarityWeights: { common: 0.4, rare: 0.5, epic: 0.1, legendary: 0 } },
      epic: { chance: 0.60, rarityWeights: { common: 0, rare: 0.5, epic: 0.4, legendary: 0.1 } },
    };

    // Check if power-up should be awarded
    const difficulty = questDifficulty || 'easy';
    const dropConfig = dropRates[difficulty] || dropRates.easy;
    const shouldAward = Math.random() < dropConfig.chance;

    if (!shouldAward && reason !== 'achievement' && reason !== 'daily_login') {
      console.log("Power-up not awarded (RNG)");
      return new Response(
        JSON.stringify({ success: true, awarded: false, message: "No power-up this time" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Select rarity based on weights
    let selectedRarity = 'common';
    if (reason === 'achievement' || reason === 'daily_login') {
      selectedRarity = reason === 'achievement' ? 'rare' : 'common';
    } else {
      const rand = Math.random();
      let cumulative = 0;
      for (const [rarity, weight] of Object.entries(dropConfig.rarityWeights)) {
        cumulative += weight;
        if (rand <= cumulative) {
          selectedRarity = rarity;
          break;
        }
      }
    }

    console.log(`Selected rarity: ${selectedRarity}`);

    // Fetch available power-ups of selected rarity
    const { data: powerups, error: powerupError } = await supabaseClient
      .from('powerups')
      .select('*')
      .eq('rarity', selectedRarity);

    if (powerupError || !powerups || powerups.length === 0) {
      throw new Error(`No power-ups found for rarity: ${selectedRarity}`);
    }

    // Select random power-up
    const selectedPowerup = powerups[Math.floor(Math.random() * powerups.length)];
    console.log(`Awarding power-up: ${selectedPowerup.name}`);

    // Award power-up to user
    const { error: insertError } = await supabaseClient
      .from('user_powerups')
      .insert({
        user_id: userId,
        powerup_id: selectedPowerup.id,
        is_active: false,
      });

    if (insertError) throw insertError;

    console.log(`Successfully awarded ${selectedPowerup.name} to user ${userId}`);

    return new Response(
      JSON.stringify({
        success: true,
        awarded: true,
        powerup: {
          id: selectedPowerup.id,
          name: selectedPowerup.name,
          rarity: selectedPowerup.rarity,
          effect_type: selectedPowerup.effect_type,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error awarding power-up:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
