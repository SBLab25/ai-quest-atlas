import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const body = await req.json();
    const { verificationId, photoUrl } = body;

    if (!verificationId || !photoUrl) {
      return new Response(
        JSON.stringify({ error: "verificationId and photoUrl are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Download the image
    console.log("Downloading quest submission image:", photoUrl);
    const imageResponse = await fetch(photoUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.statusText}`);
    }
    const imageBuffer = await imageResponse.arrayBuffer();
    console.log("Image downloaded, size:", imageBuffer.byteLength, "bytes");

    // --- HF deepfake detection (Router + pipeline) ---
    console.log("Starting deepfake detection for quest photo");

    const hfToken = Deno.env.get("HF_TOKEN");
    if (!hfToken) {
      throw new Error("HF_TOKEN not configured");
    }

    const modelId = "Ateeqq/ai-vs-human-image-detector";

    const hfUrl = `https://router.huggingface.co/hf-inference/models/${modelId}/pipeline/image-classification`;

    const hfResponse = await fetch(hfUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfToken}`,
        "Content-Type": "application/octet-stream",
        Accept: "application/json",
        "X-Wait-For-Model": "true",        // cold starts
      },
      body: new Uint8Array(imageBuffer),
      redirect: "manual",                  // don't follow to HTML
    });

    const status = hfResponse.status;
    const location = hfResponse.headers.get("location");
    const ct = hfResponse.headers.get("content-type") ?? "";

    const text = await hfResponse.text();

    // If the router tries to send you to a web page, fail clearly:
    if (status >= 300 && status < 400) {
      throw new Error(`HF redirected (${status}) to ${location || "unknown"} — model not served by HF Inference.`);
    }

    if (!hfResponse.ok || ct.includes("text/html") || text.trim().startsWith("<!")) {
      throw new Error(`Hugging Face API error ${status}: ${text.slice(0, 500)}`);
    }

    const hfData = JSON.parse(text);  // [{label, score}, ...]

    if (!Array.isArray(hfData) || hfData.length === 0) {
      throw new Error(`Unexpected HF format: ${text.slice(0, 200)}`);
    }

    const top = hfData.reduce((a: any, b: any) => (b.score > a.score ? b : a));
    const lbl = (top.label ?? "Unknown").toLowerCase();
    const score = top.score ?? 0;
    const isAI = ["fake", "deepfake", "ai"].some(k => lbl.includes(k));

    const deepfakeResult = { label: top.label ?? "Unknown", score, isDeepfake: isAI };

    console.log("Deepfake result:", deepfakeResult);

    // Update verification with deepfake result only
    const updateData: any = {
      deepfake_verdict: deepfakeResult.isDeepfake ? "FAKE" : "REAL",
      deepfake_confidence: deepfakeResult.score || 0,
      analyzed_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabaseClient
      .from("ai_verifications")
      .update(updateData)
      .eq("id", verificationId);

    if (updateError) {
      console.error("Error updating verification:", updateError);
      // Continue anyway to return the results
    }

    return new Response(
      JSON.stringify({
        success: true,
        deepfakeResult,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in deepfake-detection function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

