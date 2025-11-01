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
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY') || '';
    const groqApiKey = Deno.env.get('GROQ_API_KEY') || '';
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY') || '';
    const aiEnabled = !!(geminiApiKey || groqApiKey || lovableApiKey);

    if (!aiEnabled) {
      console.error('No AI keys configured - running heuristic-only verification');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (!authError && user) userId = user.id;
      } catch (e) {
        console.warn('Auth lookup failed, proceeding anonymously');
      }
    } else {
      console.warn('No Authorization header, proceeding anonymously');
    }

    const body: VerificationRequest = await req.json();
    console.log('🔍 Verification request:', { 
      submissionId: body.submissionId, 
      photoUrl: body.photoUrl?.substring(0, 50) + '...',
      userId: userId,
      questTitle: body.questTitle,
      questDescription: body.questDescription?.substring(0, 50) + '...'
    });

    // Create initial log entry (only if we have a user)
    if (userId) {
      const { data: logEntry, error: logError } = await supabase
        .from('ai_logs')
        .insert({
          user_id: userId,
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
    }

    // Perform AI verification using configured providers
    console.log('Starting AI verification...');
    const verificationResult = await performAIVerification(
      body,
      { geminiApiKey, groqApiKey, lovableApiKey }
    );
    console.log('AI verification completed:', verificationResult.verdict);

    const executionTime = Date.now() - startTime;

    // Store verification results (graceful if table is missing)
    let verification: any = null;
    try {
      if (userId) {
        const insertRes = await supabase
          .from('ai_verifications')
          .insert({
            user_id: userId,
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
          .maybeSingle();

        if (insertRes.error) {
          console.error('Error inserting verification (continuing without DB persistence):', insertRes.error);
        } else {
          verification = insertRes.data;
        }
      } else {
        console.warn('Skipping ai_verifications insert: anonymous request');
      }
    } catch (e) {
      console.error('Insert verification threw (continuing):', e);
    }

    // Update log with execution time and (optional) verification ID
    if (logId) {
      const updatePayload: any = {
        confidence_score: verificationResult.final_confidence,
        execution_time_ms: executionTime,
      };
      if (verification?.id) updatePayload.verification_id = verification.id;
      await supabase
        .from('ai_logs')
        .update(updatePayload)
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

    const responseVerification = verification ? {
      ...verification,
      execution_time_ms: executionTime,
    } : {
      id: crypto.randomUUID?.() || `${Date.now()}`,
      quest_match_score: verificationResult.quest_match,
      geolocation_match_score: verificationResult.geolocation_match,
      authenticity_score: verificationResult.authenticity_score,
      scene_relevance_score: verificationResult.scene_relevance,
      final_confidence: verificationResult.final_confidence,
      verdict: verificationResult.verdict,
      reason: verificationResult.reason,
      model_used: 'google/gemini-2.5-flash',
      execution_time_ms: executionTime,
    } as any;

    return new Response(
      JSON.stringify({
        success: true,
        verification: responseVerification,
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
      try {
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
      } catch (e) {
        console.warn('Failed to update ai_logs in catch:', e);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        verification: {
          id: crypto.randomUUID?.() || `${Date.now()}`,
          quest_match_score: 0.5,
          geolocation_match_score: 0.5,
          authenticity_score: 0.5,
          scene_relevance_score: 0.5,
          final_confidence: 0.5,
          verdict: 'uncertain',
          reason: `Verification failed: ${error.message || 'unknown error'}. Manual review required.`,
          model_used: 'fallback',
          execution_time_ms: executionTime,
        },
        warning: 'Returned fallback result to avoid 500 response.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  }
});

// Haversine distance calculation (in meters)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Extract EXIF data from image (placeholder - requires exif-reader library)
async function extractExifData(imageUrl: string): Promise<{
  latitude?: number;
  longitude?: number;
  timestamp?: string;
  camera?: string;
  hasExif: boolean;
}> {
  try {
    console.log('📸 EXIF extraction requested but not implemented (requires exif-reader library)');
    // TODO: Implement EXIF extraction when exif-reader is properly configured for Deno
    // For now, return empty EXIF data
    return { hasExif: false };
  } catch (error) {
    console.error('EXIF extraction error:', error);
    return { hasExif: false };
  }
}

// Geofence validation
function validateGeofence(
  questLat?: number,
  questLon?: number,
  exifLat?: number,
  exifLon?: number,
  userLat?: number,
  userLon?: number,
  maxDistanceMeters: number = 500
): {
  score: number;
  distance: number | null;
  withinFence: boolean;
  reason: string;
} {
  // Try EXIF coordinates first, fallback to user-reported
  const photoLat = exifLat || userLat;
  const photoLon = exifLon || userLon;

  if (!questLat || !questLon || !photoLat || !photoLon) {
    return {
      score: 0.5,
      distance: null,
      withinFence: false,
      reason: 'Missing GPS coordinates'
    };
  }

  const distance = calculateDistance(questLat, questLon, photoLat, photoLon);
  const withinFence = distance <= maxDistanceMeters;

  // Score based on distance (1.0 at 0m, 0.0 at maxDistance+)
  const score = withinFence ? 
    Math.max(0, 1 - (distance / maxDistanceMeters)) : 
    Math.max(0, 0.3 - (distance / (maxDistanceMeters * 10))); // Gentle falloff beyond fence

  return {
    score,
    distance: Math.round(distance),
    withinFence,
    reason: withinFence ? 
      `Within ${Math.round(distance)}m of quest location` :
      `${Math.round(distance)}m away (threshold: ${maxDistanceMeters}m)`
  };
}

// Anti-spoofing checks
function performAntiSpoofingChecks(
  exifData: { hasExif: boolean; timestamp?: string; camera?: string },
  timestamp: Date
): {
  score: number;
  flags: string[];
} {
  const flags: string[] = [];
  let score = 1.0;

  // Check 1: EXIF presence (AI images often lack EXIF)
  if (!exifData.hasExif) {
    flags.push('No EXIF data');
    score -= 0.3;
  }

  // Check 2: Timestamp reasonableness (within 7 days)
  if (exifData.timestamp) {
    try {
      const exifTime = new Date(exifData.timestamp);
      const daysDiff = Math.abs(timestamp.getTime() - exifTime.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysDiff > 7) {
        flags.push('Old photo (>7 days)');
        score -= 0.2;
      } else if (daysDiff > 1) {
        flags.push('Photo not recent (>1 day)');
        score -= 0.1;
      }
    } catch (e) {
      flags.push('Invalid timestamp');
      score -= 0.1;
    }
  }

  // Check 3: Camera info (stock photos often have generic camera data)
  if (!exifData.camera) {
    flags.push('No camera info');
    score -= 0.1;
  }

  return {
    score: Math.max(0, Math.min(1, score)),
    flags
  };
}

async function performAIVerification(
  request: VerificationRequest,
  keys: { geminiApiKey?: string; groqApiKey?: string; lovableApiKey?: string }
): Promise<AIVerificationResult> {
  const startTime = Date.now();

  // Step 1: Extract EXIF data
  const exifData = await extractExifData(request.photoUrl);

  // Step 2: Geofence validation
  const geofenceResult = validateGeofence(
    request.questLatitude,
    request.questLongitude,
    exifData.latitude,
    exifData.longitude,
    request.userLatitude,
    request.userLongitude
  );

  // Step 3: Anti-spoofing checks
  const antispoofResult = performAntiSpoofingChecks(exifData, new Date());

  console.log('🔒 Security checks:', {
    geofence: geofenceResult,
    antispoof: antispoofResult,
    exif: exifData
  });

  // Helper to normalize results and compute final verdict
  function normalizeAndScore(raw: {
    quest_match?: number;
    visual_scene_match?: number;
    ai_authenticity?: number;
    scene_relevance?: number;
    reason?: string;
  }): AIVerificationResult {
    const questMatch = Math.max(0, Math.min(1, raw.quest_match ?? 0));
    const visualSceneMatch = Math.max(0, Math.min(1, raw.visual_scene_match ?? 0));
    const aiAuthenticity = Math.max(0, Math.min(1, raw.ai_authenticity ?? 0));
    const sceneRelevance = Math.max(0, Math.min(1, raw.scene_relevance ?? 0));

    const finalConfidence = (
      geofenceResult.score * 0.30 +
      antispoofResult.score * 0.25 +
      visualSceneMatch * 0.20 +
      questMatch * 0.15 +
      sceneRelevance * 0.10
    );

    let verdict: 'verified' | 'uncertain' | 'rejected';
    if (finalConfidence >= 0.85) verdict = 'verified';
    else if (finalConfidence >= 0.60) verdict = 'uncertain';
    else verdict = 'rejected';

    const reasons = [raw.reason ?? ''];
    if (geofenceResult.distance !== null) reasons.push(geofenceResult.reason);
    if (antispoofResult.flags.length > 0) reasons.push(`Security: ${antispoofResult.flags.join(', ')}`);

    return {
      quest_match: questMatch,
      geolocation_match: geofenceResult.score,
      authenticity_score: antispoofResult.score,
      scene_relevance: sceneRelevance,
      final_confidence: finalConfidence,
      verdict,
      reason: reasons.filter(Boolean).join(' | '),
      exif_data: exifData.hasExif ? {
        latitude: exifData.latitude,
        longitude: exifData.longitude,
        timestamp: exifData.timestamp
      } : undefined
    };
  }

  // Heuristic-only when no AI keys configured
  if (!keys.geminiApiKey && !keys.groqApiKey && !keys.lovableApiKey) {
    const finalConfidence = geofenceResult.score * 0.6 + antispoofResult.score * 0.4;
    let verdict: 'verified' | 'uncertain' | 'rejected';
    if (finalConfidence >= 0.85) verdict = 'verified';
    else if (finalConfidence >= 0.6) verdict = 'uncertain';
    else verdict = 'rejected';

    const reasons: string[] = [];
    if (geofenceResult.distance !== null) reasons.push(geofenceResult.reason);
    if (antispoofResult.flags.length > 0) reasons.push(`Security: ${antispoofResult.flags.join(', ')}`);

    const normalizedResult: AIVerificationResult = {
      quest_match: 0.5,
      geolocation_match: geofenceResult.score,
      authenticity_score: antispoofResult.score,
      scene_relevance: 0.5,
      final_confidence: finalConfidence,
      verdict,
      reason: reasons.join(' | ') || 'Heuristic verification (no AI key configured)',
      exif_data: exifData.hasExif ? {
        latitude: exifData.latitude,
        longitude: exifData.longitude,
        timestamp: exifData.timestamp
      } : undefined
    };

    console.warn('AI disabled - returning heuristic verification:', normalizedResult);
    return normalizedResult;
  }

  // Build prompts once
  const systemPrompt = `You are an AI photo verification system for a real-world discovery game.
Your task is to analyze photos submitted by users as proof of completing quests.

SECURITY CONTEXT:
- EXIF GPS: ${exifData.latitude && exifData.longitude ? `${exifData.latitude}, ${exifData.longitude}` : 'Not available'}
- Geofence Check: ${geofenceResult.reason}
- Anti-spoofing Flags: ${antispoofResult.flags.join(', ') || 'None'}

Analyze the image based on these criteria:
1. **Context Match**: Does the photo content match the quest theme and description?
2. **Visual Scene Match**: Does the visual scene align with the claimed location?
3. **Authenticity**: Is this a real photo? Look for AI generation artifacts, stock photo characteristics.
4. **Scene Relevance**: How relevant is the photo to the quest objectives?

Respond ONLY with valid JSON in this exact format:
{
  "quest_match": 0.0-1.0,
  "visual_scene_match": 0.0-1.0,
  "ai_authenticity": 0.0-1.0,
  "scene_relevance": 0.0-1.0,
  "reason": "brief explanation"
}`;

  const userPrompt = `Quest Title: "${request.questTitle}"
Quest Description: "${request.questDescription}"
Quest Location: "${request.questLocation}"
${request.questLatitude && request.questLongitude ? `Quest Coordinates: ${request.questLatitude}, ${request.questLongitude}` : ''}
${request.userLatitude && request.userLongitude ? `User Coordinates: ${request.userLatitude}, ${request.userLongitude}` : ''}

Photo URL is attached. Analyze this photo and determine if it's valid proof of quest completion.`;

  // Provider 1: Gemini
  if (keys.geminiApiKey) {
    try {
      console.log('Calling Gemini for verification...');
      // Fetch image and convert to base64 inline data (Gemini prefers inline)
      const imgResp = await fetch(request.photoUrl);
      const imgBuf = await imgResp.arrayBuffer();
      const b64 = btoa(String.fromCharCode(...new Uint8Array(imgBuf)));

      const gemResp = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + keys.geminiApiKey,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: systemPrompt + "\n\n" + userPrompt },
                  { inline_data: { mime_type: 'image/jpeg', data: b64 } }
                ]
              }
            ],
            generationConfig: { temperature: 0.2 }
          })
        }
      );

      if (!gemResp.ok) {
        const t = await gemResp.text();
        throw new Error(`Gemini HTTP ${gemResp.status}: ${t}`);
      }

      const gemJson = await gemResp.json();
      const text = gemJson.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Gemini: no JSON in response');
      const result = JSON.parse(jsonMatch[0]);

      return normalizeAndScore(result);
    } catch (e) {
      console.error('Gemini call failed:', e);
    }
  }

  // Provider 2: Groq vision
  if (keys.groqApiKey) {
    try {
      console.log('Calling Groq vision for verification...');
      const groqResp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${keys.groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.2-11b-vision-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: [
                { type: 'text', text: userPrompt },
                { type: 'image_url', image_url: { url: request.photoUrl } }
              ]
            }
          ]
        })
      });

      if (!groqResp.ok) {
        const t = await groqResp.text();
        throw new Error(`Groq HTTP ${groqResp.status}: ${t}`);
      }

      const groqJson = await groqResp.json();
      const content: string = groqJson.choices?.[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Groq: no JSON in response');
      const result = JSON.parse(jsonMatch[0]);

      return normalizeAndScore(result);
    } catch (e) {
      console.error('Groq call failed:', e);
    }
  }

  // Provider 3: Lovable AI gateway (fallback)
  if (keys.lovableApiKey) {
    try {
      console.log('Calling Lovable AI Gateway for verification...');
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${keys.lovableApiKey}`,
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
        throw new Error(`AI Gateway returned ${response.status}: ${errorText}`);
      }

      const aiResponse = await response.json();
      const content = aiResponse.choices?.[0]?.message?.content;
      if (!content) throw new Error('No content in AI response');
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in AI response');
      const result = JSON.parse(jsonMatch[0]);

      return normalizeAndScore(result);
    } catch (e) {
      console.error('Lovable AI call failed:', e);
    }
  }

  // Final safety: return uncertain verdict
  console.warn('All AI providers failed. Returning fallback uncertain verdict.');
  return {
    quest_match: 0.5,
    geolocation_match: geofenceResult.score,
    authenticity_score: antispoofResult.score,
    scene_relevance: 0.5,
    final_confidence: 0.5,
    verdict: 'uncertain',
    reason: 'All AI providers failed. Manual review required.',
    exif_data: exifData.hasExif ? {
      latitude: exifData.latitude,
      longitude: exifData.longitude,
      timestamp: exifData.timestamp
    } : undefined
  };
}
