import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  query: string;
  userId: string;
  location?: { lat: number; lng: number };
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

    const body: SearchRequest = await req.json();
    console.log('🔍 Processing NLP search:', { 
      query: body.query,
      userId: user.id 
    });

    // Fetch all quests
    const { data: allQuests, error: questsError } = await supabase
      .from('Quests')
      .select('*')
      .limit(100);

    if (questsError) throw questsError;

    const systemPrompt = `You are a quest search AI. Analyze the user's natural language query and extract:
- Quest type/category (nature, history, photography, science, community)
- Difficulty preference (easy, medium, hard)
- Location hints
- Keywords

Then match to the provided quests and return the most relevant ones.

Respond ONLY with valid JSON:
{
  "interpretation": "brief explanation of what user is looking for",
  "filters": {
    "types": ["type1", "type2"],
    "difficulty": 1-5 or null,
    "keywords": ["keyword1", "keyword2"]
  },
  "matchedQuestIds": ["id1", "id2", "id3"]
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
          { 
            role: 'user', 
            content: `User query: "${body.query}"\n\nAvailable quests:\n${JSON.stringify(allQuests?.map(q => ({
              id: q.id,
              title: q.title,
              description: q.description,
              quest_type: q.quest_type,
              difficulty: q.difficulty,
              location: q.location
            })))}`
          }
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

    // Get matched quests
    const matchedQuests = allQuests?.filter(q => 
      result.matchedQuestIds?.includes(q.id)
    ) || [];

    console.log('✅ Search completed:', {
      interpretation: result.interpretation,
      matchedCount: matchedQuests.length
    });

    return new Response(
      JSON.stringify({
        quests: matchedQuests,
        interpretation: result.interpretation,
        confidence: 0.85
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Search error:', error);
    
    return new Response(
      JSON.stringify({
        quests: [],
        interpretation: 'Search failed',
        confidence: 0,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
