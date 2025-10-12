import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerificationRequest {
  submissionId: string;
  photoUrl: string;
  questTitle: string;
  questDescription: string;
  questLocation: string;
  questLatitude?: number;
  questLongitude?: number;
  userLatitude?: number;
  userLongitude?: number;
}

interface AIVerificationResult {
  quest_match: number;
  geolocation_match: number;
  authenticity_score: number;
  scene_relevance: number;
  final_confidence: number;
  verdict: 'verified' | 'uncertain' | 'rejected';
  reason: string;
  exif_data?: {
    latitude?: number;
    longitude?: number;
    timestamp?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let logId: string | null = null;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('AI service not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Unauthorized');
    }

    const body: VerificationRequest = await req.json();
    console.log('🔍 Verification request:', { 
      submissionId: body.submissionId, 
      photoUrl: body.photoUrl?.substring(0, 50) + '...',
      userId: user.id,
      questTitle: body.questTitle,
      questDescription: body.questDescription?.substring(0, 50) + '...'
    });

    // Create initial log entry
    const { data: logEntry, error: logError } = await supabase
      .from('ai_logs')
      .insert({
        user_id: user.id,
        submission_id: body.submissionId,
        model_used: 'google/gemini-2.5-flash',
        status: 'success',
      })
      .select()
      .single();

    if (logError) {
      console.error('Error creating log entry:', logError);
    }

    logId = logEntry?.id || null;

    // Perform AI verification using Gemini 2.5 Pro
    console.log('Starting AI verification...');
    const verificationResult = await performAIVerification(
      body,
      lovableApiKey || ''
    );
    console.log('AI verification completed:', verificationResult.verdict);

    const executionTime = Date.now() - startTime;

    // Store verification results
    const { data: verification, error: insertError } = await supabase
      .from('ai_verifications')
      .insert({
        user_id: user.id,
        quest_id: null, // Will be populated if quest exists
        submission_id: body.submissionId,
        photo_url: body.photoUrl,
        quest_match_score: verificationResult.quest_match,
        geolocation_match_score: verificationResult.geolocation_match,
        authenticity_score: verificationResult.authenticity_score,
        scene_relevance_score: verificationResult.scene_relevance,
        final_confidence: verificationResult.final_confidence,
        verdict: verificationResult.verdict,
        reason: verificationResult.reason,
        exif_latitude: verificationResult.exif_data?.latitude,
        exif_longitude: verificationResult.exif_data?.longitude,
        exif_timestamp: verificationResult.exif_data?.timestamp,
        model_used: 'google/gemini-2.5-flash',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting verification:', insertError);
      throw insertError;
    }

    // Update log with execution time and verification ID
    if (logId) {
      await supabase
        .from('ai_logs')
        .update({
          verification_id: verification.id,
          confidence_score: verificationResult.final_confidence,
          execution_time_ms: executionTime,
        })
        .eq('id', logId);
    }

    // Auto-approve or reject submission based on verdict
    if (verificationResult.verdict === 'verified') {
      await supabase
        .from('Submissions')
        .update({ status: 'approved' })
        .eq('id', body.submissionId);
    } else if (verificationResult.verdict === 'rejected') {
      await supabase
        .from('Submissions')
        .update({ status: 'rejected' })
        .eq('id', body.submissionId);
    }
    // Leave 'uncertain' as 'pending' for manual review

    console.log('Verification completed:', {
      verdict: verificationResult.verdict,
      confidence: verificationResult.final_confidence,
      executionTime,
    });

    return new Response(
      JSON.stringify({
        success: true,
        verification: {
          ...verification,
          execution_time_ms: executionTime,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('AI verification error:', error);

    const executionTime = Date.now() - startTime;

    // Log error
    if (logId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      await supabase
        .from('ai_logs')
        .update({
          status: 'error',
          error_message: error.message,
          execution_time_ms: executionTime,
        })
        .eq('id', logId);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Verification failed',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function performAIVerification(
  request: VerificationRequest,
  lovableApiKey: string
): Promise<AIVerificationResult> {
  const startTime = Date.now();

  // Build AI prompt for Gemini 2.5 Pro Vision
  const systemPrompt = `You are an AI photo verification system for a real-world discovery game.
Your task is to analyze photos submitted by users as proof of completing quests.

Analyze the image based on these criteria:
1. **Context Match**: Does the photo content match the quest theme and description?
2. **Geolocation**: Does the visual scene match the claimed location?
3. **Authenticity**: Is this a real photo or AI-generated/stock image?
4. **Scene Relevance**: How relevant is the photo to the quest objectives?

Respond ONLY with valid JSON in this exact format:
{
  "quest_match": 0.0-1.0,
  "geolocation_match": 0.0-1.0,
  "authenticity_score": 0.0-1.0,
  "scene_relevance": 0.0-1.0,
  "final_confidence": 0.0-1.0,
  "verdict": "verified|uncertain|rejected",
  "reason": "brief explanation"
}`;

  const userPrompt = `Quest Title: "${request.questTitle}"
Quest Description: "${request.questDescription}"
Quest Location: "${request.questLocation}"
${request.questLatitude && request.questLongitude ? `Quest Coordinates: ${request.questLatitude}, ${request.questLongitude}` : ''}
${request.userLatitude && request.userLongitude ? `User Coordinates: ${request.userLatitude}, ${request.userLongitude}` : ''}

Photo URL: ${request.photoUrl}

Analyze this photo and determine if it's valid proof of quest completion.`;

  try {
    console.log('Calling Lovable AI Gateway for verification...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              { type: 'image_url', image_url: { url: request.photoUrl } }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway returned ${response.status}: ${errorText}`);
    }

    const aiResponse = await response.json();
    console.log('AI response received:', aiResponse);

    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const result = JSON.parse(jsonMatch[0]);

    // Validate and normalize scores
    const normalizedResult: AIVerificationResult = {
      quest_match: Math.max(0, Math.min(1, result.quest_match || 0)),
      geolocation_match: Math.max(0, Math.min(1, result.geolocation_match || 0)),
      authenticity_score: Math.max(0, Math.min(1, result.authenticity_score || 0)),
      scene_relevance: Math.max(0, Math.min(1, result.scene_relevance || 0)),
      final_confidence: Math.max(0, Math.min(1, result.final_confidence || 0)),
      verdict: result.verdict || (result.final_confidence >= 0.85 ? 'verified' : result.final_confidence >= 0.60 ? 'uncertain' : 'rejected'),
      reason: result.reason || 'AI analysis completed',
    };

    console.log('Verification result:', normalizedResult);
    console.log(`Verification took ${Date.now() - startTime}ms`);

    return normalizedResult;

  } catch (error: any) {
    console.error('AI verification error:', error);
    
    // Return a fallback uncertain verdict on error
    return {
      quest_match: 0.5,
      geolocation_match: 0.5,
      authenticity_score: 0.5,
      scene_relevance: 0.5,
      final_confidence: 0.5,
      verdict: 'uncertain',
      reason: `Verification failed: ${error.message}. Manual review required.`,
    };
  }
}
