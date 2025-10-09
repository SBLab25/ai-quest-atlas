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
    
    // Parse request body to check for manual generation
    let requestBody;
    try {
      const text = await req.text();
      requestBody = text ? JSON.parse(text) : {};
    } catch {
      requestBody = {};
    }

    const { manual = false, userId } = requestBody;

    if (manual && userId) {
      // Manual generation for specific user
      console.log(`Generating manual quest for user: ${userId}`);

      // Get specific user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, full_name, location, latitude, longitude, interests')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        throw new Error(`Failed to fetch user profile: ${profileError?.message || 'User not found'}`);
      }

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
        userLocation: profile.location || (profile.latitude && profile.longitude ? `${profile.latitude}, ${profile.longitude}` : 'anywhere'),
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
          throw new Error(`Failed to insert quest: ${insertError.message}`);
        }

        return new Response(
          JSON.stringify({ 
            message: 'Quest generated successfully',
            quest: questData
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        throw new Error('Failed to generate quest');
      }
    }

    // Original bulk generation logic for daily automatic runs
    console.log('Starting daily AI quest generation for all users...');

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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
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

  const prompt = `Generate a personalized and innovative daily quest for a user located at: ${request.userLocation}

User interests: ${request.interests.join(', ') || 'general exploration'}
Recent quests to avoid repeating: ${request.previousQuests.join(', ') || 'none'}

Create a unique, engaging quest that can be one of these types:

LOCATION-BASED QUESTS (30% probability):
- Explore specific places or landmarks
- Photography challenges at locations
- Historical discoveries

SOCIAL INTERACTION QUESTS (40% probability):
- Meet and interact with strangers (ask about local history, directions, recommendations)
- Interview someone about their profession or hobbies
- Ask a local about their favorite hidden spots
- Compliment 3 strangers and document their reactions
- Find someone who shares your interests and have a 5-minute conversation

TRUTH OR DARE STYLE QUESTS (20% probability):
- Truth: Answer deep personal questions and reflect on them
- Dare: Perform safe, creative challenges in public spaces
- Knowledge challenges about yourself, your city, or general topics

CREATIVE CHALLENGES (10% probability):
- Creative writing or storytelling exercises
- Skill-building micro-challenges
- Mindfulness and self-reflection tasks

Guidelines:
1. Should take 30-60 minutes to complete
2. Must be safe and appropriate
3. Encourage personal growth, social interaction, or creative expression
4. Be different from recent quests
5. Include specific, actionable instructions

Quest types available: discovery, photography, nature, history, science, community, adventure, culture, social, truth, dare, knowledge, creative

Respond with ONLY a valid JSON object in this exact format:
{
  "title": "Quest title (max 60 characters)",
  "description": "Detailed quest description with specific instructions (200-400 characters)",
  "quest_type": "one of the available types",
  "difficulty": 2,
  "location": "General area or 'anywhere' for non-location specific quests"
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