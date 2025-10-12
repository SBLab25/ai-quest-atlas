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

    console.log("Resetting daily challenges...");

    // Expire old daily challenges
    const { error: expireError } = await supabaseClient
      .from("challenges")
      .update({ is_active: false })
      .eq("type", "daily")
      .lt("end_date", new Date().toISOString());

    if (expireError) throw expireError;

    // Create new daily challenges
    const newChallenges = [
      {
        type: "daily",
        title: "Complete 2 Quests Today",
        description: "Finish any 2 quests before midnight",
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        reward_points: 50,
        reward_xp: 20,
        requirement_type: "quests_completed",
        requirement_value: 2,
        is_active: true,
      },
      {
        type: "daily",
        title: "Earn an AI Verification",
        description: "Get at least one AI-verified submission",
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        reward_points: 30,
        reward_xp: 15,
        requirement_type: "verified_submissions",
        requirement_value: 1,
        is_active: true,
      },
    ];

    const { error: insertError } = await supabaseClient
      .from("challenges")
      .insert(newChallenges);

    if (insertError) throw insertError;

    console.log("Daily challenges reset successfully");

    return new Response(
      JSON.stringify({ success: true, message: "Daily challenges reset" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error resetting daily challenges:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
