import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import exifr from "https://esm.sh/exifr@7.1.3";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

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
    const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY') || '';
    const aiEnabled = !!geminiApiKey;

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
          model_used: 'gemini-2.5-pro',
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
      { geminiApiKey }
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
            model_used: 'gemini-2.5-pro',
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
      // When AI rejects, delete the submission to make quest available for resubmission
      // Get submission details first for cleanup
      const { data: submission } = await supabase
        .from('Submissions')
        .select('photo_url, image_urls')
        .eq('id', body.submissionId)
        .single();

      // Delete associated files from storage
      const keysToRemove: string[] = [];
      const collectKey = (url?: string | null) => {
        if (!url) return;
        try {
          const u = new URL(url);
          const parts = u.pathname.split('/object/public/');
          if (parts[1]) keysToRemove.push(parts[1].replace(/^quest-submissions\//, ''));
        } catch {}
      };
      collectKey(submission?.photo_url);
      (submission?.image_urls || []).forEach((u: string) => collectKey(u));

      if (keysToRemove.length > 0) {
        await supabase.storage.from('quest-submissions').remove(keysToRemove);
      }

      // Delete related records
      await Promise.all([
        supabase.from('post_likes').delete().eq('submission_id', body.submissionId),
        supabase.from('post_comments').delete().eq('submission_id', body.submissionId),
        supabase.from('post_shares').delete().eq('submission_id', body.submissionId)
      ]);

      // Delete the submission - this makes the quest available for resubmission
      await supabase
        .from('Submissions')
        .delete()
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
      model_used: 'gemini-2.5-pro',
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

// Extract EXIF data from image using exifr library
async function extractExifData(imageUrl: string): Promise<{
  latitude?: number;
  longitude?: number;
  timestamp?: string;
  camera?: string;
  hasExif: boolean;
  iso?: number;
  aperture?: number;
  shutterSpeed?: string;
  dimensions?: { width: number; height: number };
}> {
  const extractionStart = Date.now();
  try {
    console.log('📸 Starting EXIF extraction for:', imageUrl.substring(0, 100) + '...');
    
    // Fetch the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      console.warn(`Failed to fetch image: ${imageResponse.status}`);
      return { hasExif: false };
    }

    // Get image buffer
    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Parse EXIF data with exifr
    const exifData = await exifr.parse(imageBuffer, {
      gps: true,
      exif: true,
      tiff: true,
      ifd0: true,
      ifd1: true,
    });

    if (!exifData) {
      console.log('No EXIF data found in image');
      return { hasExif: false };
    }

    console.log('Raw EXIF data extracted:', {
      hasGPS: !!(exifData.latitude && exifData.longitude),
      hasDateTime: !!exifData.DateTimeOriginal,
      hasMake: !!exifData.Make,
      keys: Object.keys(exifData)
    });

    // Extract GPS coordinates (exifr automatically converts to decimal degrees)
    const latitude = exifData.latitude;
    const longitude = exifData.longitude;

    // Extract timestamp (try multiple fields)
    let timestamp: string | undefined;
    if (exifData.DateTimeOriginal) {
      timestamp = new Date(exifData.DateTimeOriginal).toISOString();
    } else if (exifData.DateTime) {
      timestamp = new Date(exifData.DateTime).toISOString();
    } else if (exifData.CreateDate) {
      timestamp = new Date(exifData.CreateDate).toISOString();
    }

    // Extract camera information
    let camera: string | undefined;
    if (exifData.Make && exifData.Model) {
      camera = `${exifData.Make} ${exifData.Model}`.trim();
    } else if (exifData.Model) {
      camera = exifData.Model;
    }

    // Extract technical details for authenticity checking
    const iso = exifData.ISO;
    const aperture = exifData.FNumber || exifData.ApertureValue;
    const shutterSpeed = exifData.ExposureTime || exifData.ShutterSpeedValue;

    // Extract image dimensions
    let dimensions: { width: number; height: number } | undefined;
    if (exifData.ImageWidth && exifData.ImageHeight) {
      dimensions = {
        width: exifData.ImageWidth,
        height: exifData.ImageHeight
      };
    } else if (exifData.ExifImageWidth && exifData.ExifImageHeight) {
      dimensions = {
        width: exifData.ExifImageWidth,
        height: exifData.ExifImageHeight
      };
    }

    const extractionTime = Date.now() - extractionStart;
    console.log(`✅ EXIF extraction completed in ${extractionTime}ms:`, {
      hasGPS: !!(latitude && longitude),
      gps: latitude && longitude ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` : 'N/A',
      timestamp,
      camera,
      iso,
      aperture,
      dimensions
    });

    return {
      latitude,
      longitude,
      timestamp,
      camera,
      hasExif: true,
      iso,
      aperture,
      shutterSpeed: shutterSpeed?.toString(),
      dimensions
    };

  } catch (error: any) {
    const extractionTime = Date.now() - extractionStart;
    console.error(`❌ EXIF extraction error (${extractionTime}ms):`, error.message);
    
    // Return gracefully - missing EXIF is not a critical error
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
  keys: { geminiApiKey?: string }
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
  if (!keys.geminiApiKey) {
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

  // Call Google Gemini 2.5 Pro directly
  if (keys.geminiApiKey) {
    try {
      console.log('🔍 Calling Gemini 2.5 Pro for verification...');
      console.log('📸 Photo URL:', request.photoUrl);
      
      // Fetch image and convert to base64 inline data
      const imgResp = await fetch(request.photoUrl);
      if (!imgResp.ok) {
        throw new Error(`Failed to fetch image: ${imgResp.status} ${imgResp.statusText}`);
      }
      
      const imgBuf = await imgResp.arrayBuffer();
      const b64 = base64Encode(new Uint8Array(imgBuf));
      
      // Detect proper mime type from URL or content-type header
      let mimeType = imgResp.headers.get('content-type') || 'image/jpeg';
      if (request.photoUrl.toLowerCase().endsWith('.png')) {
        mimeType = 'image/png';
      } else if (request.photoUrl.toLowerCase().endsWith('.jpg') || request.photoUrl.toLowerCase().endsWith('.jpeg')) {
        mimeType = 'image/jpeg';
      } else if (request.photoUrl.toLowerCase().endsWith('.webp')) {
        mimeType = 'image/webp';
      }
      
      console.log('📷 Image mime type:', mimeType, 'Size:', imgBuf.byteLength, 'bytes');

      const geminiPayload = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: systemPrompt + "\n\n" + userPrompt },
              { inline_data: { mime_type: mimeType, data: b64 } }
            ]
          }
        ],
        generationConfig: { 
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      };

      console.log('🚀 Sending request to Gemini API...');
      const gemResp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${keys.geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiPayload)
        }
      );

      if (!gemResp.ok) {
        const errorText = await gemResp.text();
        console.error('❌ Gemini API error:', gemResp.status, errorText);
        throw new Error(`Gemini API returned ${gemResp.status}: ${errorText.substring(0, 200)}`);
      }

      const gemJson = await gemResp.json();
      console.log('✅ Gemini response received');
      
      if (!gemJson.candidates || gemJson.candidates.length === 0) {
        console.error('❌ No candidates in Gemini response:', JSON.stringify(gemJson).substring(0, 200));
        throw new Error('Gemini returned no candidates');
      }
      
      const text = gemJson.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || '';
      console.log('📝 Gemini text response:', text.substring(0, 200));
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('❌ No JSON found in Gemini response:', text);
        throw new Error('Gemini response contained no valid JSON');
      }
      
      const result = JSON.parse(jsonMatch[0]);
      console.log('✅ Gemini analysis complete:', result);
      
      return normalizeAndScore(result);
    } catch (e: any) {
      console.error('❌ Gemini verification failed:', e.message);
      console.error('Stack trace:', e.stack);
      throw e;
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
