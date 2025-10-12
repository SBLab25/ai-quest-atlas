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
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error("Not authenticated");
    }

    console.log("Checking achievements for user:", user.id);

    // Get all achievements
    const { data: achievements, error: achievementsError } = await supabaseClient
      .from("achievements")
      .select("*");

    if (achievementsError) throw achievementsError;

    // Get user's current stats
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const { data: submissions } = await supabaseClient
      .from("Submissions")
      .select("id, verified_by_ai, location")
      .eq("user_id", user.id);

    const { data: streak } = await supabaseClient
      .from("streaks")
      .select("current_streak")
      .eq("user_id", user.id)
      .single();

    const { data: followers } = await supabaseClient
      .from("followers")
      .select("id")
      .eq("following_id", user.id);

    const unlockedAchievements = [];

    // Check each achievement
    for (const achievement of achievements || []) {
      let meetsRequirement = false;

      switch (achievement.requirement_type) {
        case "quests_completed":
          meetsRequirement = (submissions?.length || 0) >= achievement.requirement_value;
          break;
        case "verified_photos":
          const verifiedCount = submissions?.filter(s => s.verified_by_ai).length || 0;
          meetsRequirement = verifiedCount >= achievement.requirement_value;
          break;
        case "streak_days":
          meetsRequirement = (streak?.current_streak || 0) >= achievement.requirement_value;
          break;
        case "followers":
          meetsRequirement = (followers?.length || 0) >= achievement.requirement_value;
          break;
        case "locations_visited":
          // Count unique locations from submissions
          const uniqueLocations = new Set(submissions?.map(s => s.location || "").filter(Boolean));
          meetsRequirement = uniqueLocations.size >= achievement.requirement_value;
          break;
      }

      if (meetsRequirement) {
        // Try to unlock achievement
        const { data: unlocked, error: unlockError } = await supabaseClient
          .rpc("check_and_unlock_achievement", {
            p_user_id: user.id,
            p_achievement_id: achievement.id,
          });

        if (!unlockError && unlocked) {
          unlockedAchievements.push(achievement);
          console.log("Unlocked achievement:", achievement.title);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        unlockedAchievements,
        message: unlockedAchievements.length > 0 
          ? `Unlocked ${unlockedAchievements.length} new achievement(s)!`
          : "No new achievements unlocked"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error checking achievements:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
