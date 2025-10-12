import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ModerationRequest {
  content: string;
  contentType: 'post' | 'comment' | 'description';
  userId: string;
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

    const body: ModerationRequest = await req.json();
    console.log('🛡️ Moderating content:', { 
      contentType: body.contentType,
      contentLength: body.content.length,
      userId: user.id 
    });

    const systemPrompt = `You are a content moderation AI for a community-driven quest platform.
Analyze the content and flag if it contains:
- Profanity or offensive language
- Harassment or bullying
- Spam or promotional content
- Personal information (PII)
- Violence or harmful content
- Sexual or inappropriate content

Respond ONLY with valid JSON in this exact format:
{
  "isAllowed": true/false,
  "flagged": true/false,
  "categories": ["category1", "category2"],
  "confidence": 0.0-1.0,
  "reason": "brief explanation if flagged"
}`;

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
          { role: 'user', content: `Moderate this ${body.contentType}:\n\n${body.content}` }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const result = JSON.parse(jsonMatch[0]);

    // Log moderation result
    await supabase.from('moderation_logs').insert({
      user_id: user.id,
      content_type: body.contentType,
      is_allowed: result.isAllowed,
      flagged: result.flagged,
      categories: result.categories,
      confidence: result.confidence,
      reason: result.reason,
    });

    console.log('✅ Moderation completed:', result);

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Moderation error:', error);
    
    return new Response(
      JSON.stringify({
        isAllowed: true,
        flagged: false,
        categories: [],
        confidence: 0,
        reason: `Moderation failed: ${error.message}`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  }
});
