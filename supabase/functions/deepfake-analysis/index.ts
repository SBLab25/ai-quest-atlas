import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

serve(async (req) => {
  // Handle CORS preflight requests - MUST return 200 status
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
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

    // Download the image once and reuse for both analyses
    console.log("Downloading quest submission image:", photoUrl);
    const imageResponse = await fetch(photoUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.statusText}`);
    }
    const imageBuffer = await imageResponse.arrayBuffer();
    console.log("Image downloaded, size:", imageBuffer.byteLength, "bytes");

    // Step 1: Deepfake Detection using Hugging Face
    // This analyzes the quest submission photo to detect if it's a deepfake
    // The result will be displayed in the "Deepfake Verdict" column
    let deepfakeResult: { label: string; score: number; isDeepfake: boolean; error?: string } | null = null;
    try {
      const hfToken = Deno.env.get("HF_TOKEN");
      if (!hfToken) {
        throw new Error("HF_TOKEN not configured");
      }

      // --- HF deepfake detection (Router + pipeline) ---
      console.log("Starting deepfake detection for quest photo");

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

      deepfakeResult = { label: top.label ?? "Unknown", score, isDeepfake: isAI };

      console.log("Deepfake result:", deepfakeResult);
    } catch (error) {
      console.error("Deepfake detection error:", error);
      deepfakeResult = {
        label: "Error",
        score: 0,
        isDeepfake: false,
        error: error.message,
      };
    }

    // Step 2: Groq Image Analysis
    // This analyzes the quest submission photo using Groq's vision model
    // The analysis report will be displayed in the "Analysis" column
    let analysisReport: string | null = null;
    try {
      const groqApiKey = Deno.env.get("GROQ_API_KEY");
      if (!groqApiKey) {
        throw new Error("GROQ_API_KEY not configured");
      }

      console.log("Starting Groq analysis for quest photo");

      // Helper function to get signed image URL
      async function getSignedImageUrl(supabaseClient: any, photoUrl: string) {
        // If your bucket is public, you can return photoUrl directly.
        // If it's private, turn the storage path into a signed URL.
        // Example when you store the full public URL already:
        return photoUrl;
        // If you store paths like "bucket/path/to/file.jpg", do:
        /*
        const { data, error } = await supabaseClient
          .storage
          .from("your-bucket")
          .createSignedUrl("path/to/file.jpg", 300); // 5 min
        if (error) throw error;
        return data.signedUrl;
        */
      }

      const signedUrl = await getSignedImageUrl(supabaseClient, photoUrl);

      console.log("Using signed URL for Groq analysis:", signedUrl.substring(0, 100) + "...");

      // Build the payload carefully to avoid stack overflow
      const textPrompt = "Analyze this quest submission image. Provide a detailed report on: " +
        "1) Any anomalies or suspicious elements, 2) Image quality and authenticity indicators, " +
        "3) Potential faults or issues, 4) Merits and positive aspects. Be thorough and specific.";

      // Build JSON string manually to avoid any potential issues
      const groqPayloadStr = 
        '{"model":"meta-llama/llama-4-maverick-17b-128e-instruct",' +
        '"messages":[{"role":"user","content":[' +
        '{"type":"text","text":"' + textPrompt.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"},' +
        '{"type":"image_url","image_url":{"url":"' + signedUrl.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"}}' +
        ']}],' +
        '"max_tokens":1000}';

      console.log("Groq payload created, size:", groqPayloadStr.length, "bytes");

      const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          "Content-Type": "application/json",
        },
        body: groqPayloadStr,
      });

      if (!groqResponse.ok) {
        const errorText = await groqResponse.text();
        throw new Error(`Groq API error: ${errorText}`);
      }

      const groqData = await groqResponse.json();
      analysisReport = groqData.choices?.[0]?.message?.content || "Analysis unavailable";
      console.log("Groq analysis completed, report length:", analysisReport?.length || 0);
    } catch (error: any) {
      console.error("Groq analysis error:", error);
      analysisReport = `Analysis error: ${error.message}`;
    }

    // Update verification with results
    const updateData: any = {
      deepfake_verdict: deepfakeResult?.isDeepfake ? "FAKE" : "REAL",
      deepfake_confidence: deepfakeResult?.score || 0,
      analysis_report: analysisReport,
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
        analysisReport,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in deepfake-analysis function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

