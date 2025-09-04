import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = 'https://afglpoufxxgdxylvgeex.supabase.co';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  location: string;
  latitude: number;
  longitude: number;
  interests: string[];
}

interface QuestGenerationRequest {
  userLocation: string;
  latitude: number;
  longitude: number;
  interests: string[];
  previousQuests: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY!);

    console.log('Starting daily AI quest generation...');

    // Get all users with location data
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, full_name, location, latitude, longitude, interests')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw new Error(`Failed to fetch user profiles: ${profilesError.message}`);
    }

    console.log(`Found ${profiles?.length || 0} users with location data`);

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No users with location data found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const questPromises = profiles.map(async (profile: UserProfile) => {
      try {
        // Get user's recent AI-generated quests to avoid repetition
        const { data: recentQuests } = await supabase
          .from('ai_generated_quests')
          .select('title, description')
          .eq('user_id', profile.id)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(5);

        const previousQuestTitles = recentQuests?.map(q => q.title) || [];

        const questData = await generateQuestWithGemini({
          userLocation: profile.location || `${profile.latitude}, ${profile.longitude}`,
          latitude: profile.latitude,
          longitude: profile.longitude,
          interests: profile.interests || [],
          previousQuests: previousQuestTitles
        });

        if (questData) {
          const { error: insertError } = await supabase
            .from('ai_generated_quests')
            .insert({
              user_id: profile.id,
              title: questData.title,
              description: questData.description,
              quest_type: questData.quest_type,
              difficulty: questData.difficulty,
              location: questData.location,
              latitude: profile.latitude,
              longitude: profile.longitude,
              generated_by: 'gemini',
              generation_prompt: questData.prompt
            });

          if (insertError) {
            console.error(`Failed to insert quest for user ${profile.id}:`, insertError);
          } else {
            console.log(`Generated quest "${questData.title}" for user ${profile.username || profile.id}`);
          }
        }
      } catch (error) {
        console.error(`Error generating quest for user ${profile.id}:`, error);
      }
    });

    await Promise.all(questPromises);

    return new Response(
      JSON.stringify({ 
        message: 'Daily AI quest generation completed successfully',
        usersProcessed: profiles.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-daily-ai-quests:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function generateQuestWithGemini(request: QuestGenerationRequest) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const prompt = `Generate a personalized daily quest for a user located at: ${request.userLocation}

User interests: ${request.interests.join(', ') || 'general exploration'}
Recent quests to avoid repeating: ${request.previousQuests.join(', ') || 'none'}

Create a unique, engaging quest that:
1. Is specific to their geographic location
2. Takes 30-60 minutes to complete
3. Encourages exploration or discovery
4. Is safe and accessible
5. Incorporates their interests when possible
6. Is different from their recent quests

Quest types available: discovery, photography, nature, history, science, community, adventure, culture

Respond with ONLY a valid JSON object in this exact format:
{
  "title": "Quest title (max 60 characters)",
  "description": "Detailed quest description with specific instructions and location guidance (200-400 characters)",
  "quest_type": "one of the available types",
  "difficulty": 2,
  "location": "Specific location or area description"
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
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
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 500,
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      console.error('Invalid Gemini response structure:', data);
      throw new Error('Invalid response from Gemini API');
    }

    const generatedText = data.candidates[0].content.parts[0].text.trim();
    console.log('Generated text from Gemini:', generatedText);

    // Parse the JSON response
    let questData;
    try {
      // Extract JSON from markdown if present
      const jsonMatch = generatedText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : generatedText;
      questData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', generatedText);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Validate required fields
    if (!questData.title || !questData.description || !questData.quest_type || !questData.difficulty || !questData.location) {
      console.error('Missing required fields in quest data:', questData);
      throw new Error('Generated quest is missing required fields');
    }

    // Add the original prompt for reference
    questData.prompt = prompt;

    return questData;

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}