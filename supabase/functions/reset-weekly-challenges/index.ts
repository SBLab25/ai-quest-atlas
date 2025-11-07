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

    console.log("Resetting weekly challenges...");

    // Helper function to get next Monday midnight IST
    const getNextMondayMidnightIST = () => {
      const now = new Date();
      // IST is UTC+5:30
      const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
      const nowIST = new Date(now.getTime() + istOffset);
      
      // Get current day of week in IST (0 = Sunday, 1 = Monday, etc.)
      const currentDay = nowIST.getUTCDay();
      
      // Calculate days until next Monday (1 = Monday)
      let daysUntilMonday = (8 - currentDay) % 7;
      if (daysUntilMonday === 0) {
        // If it's already Monday, check if we're past midnight
        const istYear = nowIST.getUTCFullYear();
        const istMonth = nowIST.getUTCMonth();
        const istDate = nowIST.getUTCDate();
        const midnightIST = new Date(Date.UTC(istYear, istMonth, istDate, 0, 0, 0, 0));
        const midnightISTTimestamp = midnightIST.getTime() - istOffset;
        
        if (now.getTime() >= midnightISTTimestamp) {
          // Already past Monday midnight, use next Monday
          daysUntilMonday = 7;
        }
      }
      
      // Get the date for next Monday in IST
      const nextMondayIST = new Date(nowIST);
      nextMondayIST.setUTCDate(nowIST.getUTCDate() + daysUntilMonday);
      const nextMondayYear = nextMondayIST.getUTCFullYear();
      const nextMondayMonth = nextMondayIST.getUTCMonth();
      const nextMondayDate = nextMondayIST.getUTCDate();
      
      // Create midnight IST for next Monday
      const midnightIST = new Date(Date.UTC(nextMondayYear, nextMondayMonth, nextMondayDate, 0, 0, 0, 0));
      const midnightISTTimestamp = midnightIST.getTime() - istOffset;
      
      return new Date(midnightISTTimestamp);
    };

    const startDate = getNextMondayMidnightIST();
    const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days (168 hours) later

    // Expire old weekly challenges
    const { error: expireError } = await supabaseClient
      .from("challenges")
      .update({ is_active: false })
      .eq("type", "weekly")
      .lt("end_date", new Date().toISOString());

    if (expireError) throw expireError;

    // Create new weekly challenges with variety
    const challengePool = [
      {
        title: "Weekly Quest Master",
        description: "Complete 7 quests this week",
        requirement_type: "quests_completed",
        requirement_value: 7,
        reward_points: 200,
        reward_xp: 100,
      },
      {
        title: "Location Explorer",
        description: "Visit 8 different locations this week",
        requirement_type: "locations_visited",
        requirement_value: 8,
        reward_points: 250,
        reward_xp: 120,
      },
      {
        title: "Point Collector",
        description: "Earn 500 points this week",
        requirement_type: "points_earned",
        requirement_value: 500,
        reward_points: 300,
        reward_xp: 150,
      },
      {
        title: "Streak Champion",
        description: "Maintain your daily streak all week (7 days)",
        requirement_type: "streak_maintained",
        requirement_value: 7,
        reward_points: 350,
        reward_xp: 175,
      },
      {
        title: "Photo Pro",
        description: "Upload 10 verified photos this week",
        requirement_type: "verified_photos",
        requirement_value: 10,
        reward_points: 280,
        reward_xp: 140,
      },
    ];

    // Select 2-3 random challenges from the pool
    const shuffled = challengePool.sort(() => 0.5 - Math.random());
    const selectedChallenges = shuffled.slice(0, 2 + Math.floor(Math.random() * 2));

    const newChallenges = selectedChallenges.map(challenge => ({
      type: "weekly",
      title: challenge.title,
      description: challenge.description,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      reward_points: challenge.reward_points,
      reward_xp: challenge.reward_xp,
      requirement_type: challenge.requirement_type,
      requirement_value: challenge.requirement_value,
      is_active: true,
    }));

    const { error: insertError } = await supabaseClient
      .from("challenges")
      .insert(newChallenges);

    if (insertError) throw insertError;

    console.log(`Weekly challenges reset successfully. Created ${newChallenges.length} new challenges.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Weekly challenges reset",
        challengesCreated: newChallenges.length 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error resetting weekly challenges:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
