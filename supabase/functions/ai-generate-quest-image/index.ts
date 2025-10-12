import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImageRequest {
  questTitle: string;
  questDescription: string;
  questType: string;
  questId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('AI service not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) throw new Error('Unauthorized');

    const body: ImageRequest = await req.json();
    console.log('🎨 Generating quest image:', { 
      questTitle: body.questTitle,
      questType: body.questType 
    });

    // Create image prompt based on quest
    const imagePrompt = `Create a beautiful, thematic cover image for this quest:
Title: ${body.questTitle}
Type: ${body.questType}
Description: ${body.questDescription}

Style: Vibrant, engaging, adventure-themed illustration. 16:9 aspect ratio. High quality.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: imagePrompt
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!response.ok) {
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const imageData = aiResponse.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageData) {
      throw new Error('No image generated');
    }

    // Convert base64 to buffer
    const base64Data = imageData.split(',')[1];
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Upload to Supabase Storage
    const fileName = `quest-images/${body.questId}-${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from('quest-submissions')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('quest-submissions')
      .getPublicUrl(fileName);

    console.log('✅ Image generated and uploaded:', publicUrl);

    return new Response(
      JSON.stringify({
        imageUrl: publicUrl,
        storagePath: fileName
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Image generation error:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
