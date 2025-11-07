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

    // Helper function to get next midnight IST
    const getNextMidnightIST = () => {
      const now = new Date();
      // IST is UTC+5:30
      const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
      const nowIST = new Date(now.getTime() + istOffset);
      
      // Get current date in IST
      const istYear = nowIST.getUTCFullYear();
      const istMonth = nowIST.getUTCMonth();
      const istDate = nowIST.getUTCDate();
      
      // Create midnight IST for today
      const midnightIST = new Date(Date.UTC(istYear, istMonth, istDate, 0, 0, 0, 0));
      const midnightISTTimestamp = midnightIST.getTime() - istOffset;
      
      // If current time is past midnight IST today, use tomorrow's midnight
      const nextMidnight = now.getTime() >= midnightISTTimestamp 
        ? midnightISTTimestamp + 24 * 60 * 60 * 1000
        : midnightISTTimestamp;
      
      return new Date(nextMidnight);
    };

    const startDate = getNextMidnightIST();
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000); // 24 hours later

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
        title: "Complete 1 Quest Today",
        description: "Finish any 1 quest before midnight IST",
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        reward_points: 50,
        reward_xp: 20,
        requirement_type: "quests_completed",
        requirement_value: 1,
        is_active: true,
      },
      {
        type: "daily",
        title: "Earn an AI Verification",
        description: "Get at least one AI-verified submission",
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
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
