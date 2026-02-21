import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = 'https://afglpoufxxgdxylvgeex.supabase.co';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY!);
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Fetch user profile with interests and location
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, location, latitude, longitude, interests')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw new Error(`Failed to fetch profile: ${profileError.message}`);
    }

    // Fetch user's recent quest submissions (last 10)
    const { data: recentSubmissions } = await supabase
      .from('Submissions')
      .select('quest_id, Quests(title, quest_type, difficulty)')
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false })
      .limit(10);

    // Fetch existing suggested quests to avoid duplicates
    const { data: existingSuggestions } = await supabase
      .from('suggested_quests')
      .select('title')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString());

    const existingTitles = existingSuggestions?.map(q => q.title) || [];
    const completedQuestTypes = recentSubmissions?.map(s => (s.Quests as any)?.quest_type).filter(Boolean) || [];
    
    // Generate personalized suggestions using Gemini
    const suggestions = await generateSuggestionsWithGemini({
      interests: profile.interests || [],
      location: profile.location || 'unknown',
      latitude: profile.latitude,
      longitude: profile.longitude,
      recentQuestTypes: completedQuestTypes,
      existingTitles: existingTitles
    });

    // Store suggestions in database
    const insertPromises = suggestions.map(suggestion => 
      supabase.from('suggested_quests').insert({
        user_id: user.id,
        title: suggestion.title,
        description: suggestion.description,
        category: suggestion.category,
        difficulty: suggestion.difficulty,
        estimated_duration: suggestion.estimated_duration,
        quest_type: suggestion.quest_type,
        location: suggestion.location,
        latitude: profile.latitude,
        longitude: profile.longitude,
        generation_context: {
          interests: profile.interests,
          recent_quest_types: completedQuestTypes
        }
      })
    );

    await Promise.all(insertPromises);

    return new Response(
      JSON.stringify({ 
        message: 'Quest suggestions generated successfully',
        count: suggestions.length,
        suggestions
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-quest-suggestions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function generateSuggestionsWithGemini(context: {
  interests: string[];
  location: string;
  latitude: number | null;
  longitude: number | null;
  recentQuestTypes: string[];
  existingTitles: string[];
}) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const prompt = `Generate 5 personalized quest suggestions for a user with the following profile:

Location: ${context.location}
Interests: ${context.interests.join(', ') || 'general exploration'}
Recently completed quest types: ${context.recentQuestTypes.join(', ') || 'none'}
Avoid suggesting quests with these titles: ${context.existingTitles.join(', ') || 'none'}

Create diverse, engaging quests that:
1. Match the user's interests and location
2. Vary in difficulty (mix of levels 1-5)
3. Include different categories: discovery, photography, nature, history, science, community, adventure, culture, social
4. Have realistic estimated durations (15-90 minutes)
5. Are different from their recent quests
6. Are actionable and specific

Respond with ONLY a valid JSON array in this exact format:
[
  {
    "title": "Quest title (max 60 characters)",
    "description": "Detailed description with specific instructions (150-300 characters)",
    "category": "one of the available categories",
    "difficulty": 2,
    "estimated_duration": 45,
    "quest_type": "matching category",
    "location": "Specific area or 'anywhere'"
  }
]`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.9,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2000,
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      console.error('Invalid Gemini response:', data);
      throw new Error('Invalid response from Gemini API');
    }

    const generatedText = data.candidates[0].content.parts[0].text.trim();
    
    // Parse JSON response
    let suggestions;
    try {
      const jsonMatch = generatedText.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : generatedText;
      suggestions = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', generatedText);
      throw new Error('Failed to parse AI response');
    }

    // Validate suggestions
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      throw new Error('Invalid suggestions format');
    }

    return suggestions;

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}
