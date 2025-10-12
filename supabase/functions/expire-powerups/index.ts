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

    console.log("Expiring power-ups...");

    // Deactivate expired power-ups
    const { data, error } = await supabaseClient
      .from("user_powerups")
      .update({ is_active: false })
      .eq("is_active", true)
      .lt("expires_at", new Date().toISOString())
      .select();

    if (error) throw error;

    console.log(`Expired ${data?.length || 0} power-ups`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        expired: data?.length || 0,
        message: `Expired ${data?.length || 0} power-ups` 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error expiring power-ups:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
