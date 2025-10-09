import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const SUPABASE_URL = 'https://afglpoufxxgdxylvgeex.supabase.co';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface AdminActionBody {
  action: 'create' | 'update' | 'delete';
  id?: string;
  quest?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!SERVICE_ROLE_KEY) {
      throw new Error('Service role key not configured');
    }

    const token = req.headers.get('Authorization')?.replace('Bearer ', '') || '';
    const supabaseService = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Verify requester is admin via user_roles table
    let requesterId: string | null = null;
    if (token) {
      const { data: userRes } = await supabaseService.auth.getUser(token);
      requesterId = userRes?.user?.id ?? null;
    }

    if (!requesterId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: roleRows, error: roleErr } = await supabaseService
      .from('user_roles')
      .select('role')
      .eq('user_id', requesterId)
      .limit(1)
      .maybeSingle();

    if (roleErr) throw roleErr;
    const isAdmin = roleRows?.role === 'admin';

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = (await req.json()) as AdminActionBody;

    switch (body.action) {
      case 'create': {
        if (!body.quest) throw new Error('Missing quest payload');
        const { error } = await supabaseService.from('ai_generated_quests').insert([body.quest]);
        if (error) throw error;
        return new Response(JSON.stringify({ message: 'created' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      case 'update': {
        if (!body.quest || typeof body.quest !== 'object' || !('id' in body.quest)) {
          throw new Error('Missing quest payload with id');
        }
        const { id, ...updates } = body.quest as { id: string } & Record<string, unknown>;
        const { error } = await supabaseService
          .from('ai_generated_quests')
          .update(updates)
          .eq('id', id as string);
        if (error) throw error;
        return new Response(JSON.stringify({ message: 'updated' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      case 'delete': {
        if (!body.id) throw new Error('Missing id');
        const { error } = await supabaseService.from('ai_generated_quests').delete().eq('id', body.id);
        if (error) throw error;
        return new Response(JSON.stringify({ message: 'deleted' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  } catch (error: any) {
    console.error('admin-ai-quests error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});