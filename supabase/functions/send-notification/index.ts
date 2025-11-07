import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Max-Age': '86400',
};

interface NotificationRequest {
  user_id: string;
  type: string;
  title: string;
  message: string;
  related_id?: string;
  related_type?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests - MUST return 200 status
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const notificationData: NotificationRequest = await req.json();
    console.log('Creating notification:', notificationData);

    // Check user's notification preferences
    const { data: preferences, error: prefError } = await supabaseClient
      .from('notification_preferences')
      .select('*')
      .eq('user_id', notificationData.user_id)
      .single();

    if (prefError) {
      console.log('No preferences found, creating defaults');
    }

    // Check if user has this type of notification enabled
    const shouldSend = !preferences || checkPreferences(preferences, notificationData.type);

    if (!shouldSend) {
      console.log('Notification blocked by user preferences');
      return new Response(
        JSON.stringify({ message: 'Notification blocked by preferences' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Create the notification
    const { data, error } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: notificationData.user_id,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        related_id: notificationData.related_id,
        related_type: notificationData.related_type,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      throw error;
    }

    console.log('Notification created successfully:', data);

    return new Response(
      JSON.stringify({ success: true, notification: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in send-notification function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, success: false }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});

function checkPreferences(preferences: any, notificationType: string): boolean {
  // Map notification types to preference settings
  const typeMapping: Record<string, keyof typeof preferences> = {
    'quest_approved': 'quest_updates',
    'quest_rejected': 'quest_updates',
    'badge_earned': 'quest_updates',
    'comment_received': 'social_interactions',
    'like_received': 'social_interactions',
    'team_invite': 'team_activities',
    'challenge_completed': 'quest_updates',
    'daily_challenge_reset': 'quest_updates',
  };

  const preferenceKey = typeMapping[notificationType];
  return preferenceKey ? preferences[preferenceKey] !== false : true;
}
