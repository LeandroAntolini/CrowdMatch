// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Autenticação do usuário
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const token = authHeader.replace('Bearer ', '')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: { user: authUser }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !authUser) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const currentUserId = authUser.id;

    // 2. Obter dados da requisição
    const { placeId } = await req.json();
    if (!placeId) {
      return new Response(JSON.stringify({ error: 'placeId is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 3. Buscar perfil do usuário atual para as preferências
    const { data: currentUserProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('gender, sexual_orientation, match_preferences')
      .eq('id', currentUserId)
      .single();

    if (profileError || !currentUserProfile) {
      return new Response(JSON.stringify({ error: 'Could not find current user profile' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 4. Obter IDs de usuários no local (check-ins e intenções)
    const { data: checkIns, error: checkInError } = await supabaseAdmin.from('check_ins').select('user_id').eq('place_id', placeId);
    const { data: goingIntentions, error: goingError } = await supabaseAdmin.from('going_intentions').select('user_id').eq('place_id', placeId);
    if (checkInError || goingError) throw checkInError || goingError;
    
    const userIdsAtPlace = [...new Set([...(checkIns || []).map(c => c.user_id), ...(goingIntentions || []).map(g => g.user_id)])];
    if (userIdsAtPlace.length === 0) {
        return new Response(JSON.stringify([]), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 5. Obter IDs de usuários já interagidos (swipes e matches)
    const { data: swipes, error: swipeError } = await supabaseAdmin.from('swipes').select('swiped_id').eq('swiper_id', currentUserId);
    const { data: matches, error: matchError } = await supabaseAdmin.from('matches').select('user1_id, user2_id').or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`);
    if (swipeError || matchError) throw swipeError || matchError;

    const swipedIds = new Set((swipes || []).map(s => s.swiped_id));
    const matchedIds = new Set((matches || []).flatMap(m => [m.user1_id, m.user2_id]));
    const excludedIds = new Set([currentUserId, ...swipedIds, ...matchedIds]);

    // 6. Construir a query principal para buscar perfis
    let query = supabaseAdmin
      .from('profiles')
      .select('*')
      .in('id', userIdsAtPlace)
      .not('id', 'in', `(${Array.from(excludedIds).map(id => `'${id}'`).join(',')})`)
      .eq('is_available_for_match', true);

    // Filtrar pelos gostos do usuário atual
    if (currentUserProfile.match_preferences?.genders?.length > 0) {
      query = query.in('gender', currentUserProfile.match_preferences.genders);
    }
    if (currentUserProfile.match_preferences?.sexualOrientations?.length > 0) {
      query = query.in('sexual_orientation', currentUserProfile.match_preferences.sexualOrientations);
    }

    const { data: potentialMatches, error: potentialMatchesError } = await query;
    if (potentialMatchesError) throw potentialMatchesError;

    // 7. Filtrar final: verificar se o usuário atual corresponde às preferências dos outros
    const finalMatches = potentialMatches.filter(otherUser => {
      if (!otherUser.match_preferences?.genders || !otherUser.match_preferences?.sexualOrientations) return false;
      const iMatchOtherUserPrefs =
        otherUser.match_preferences.genders.includes(currentUserProfile.gender) &&
        otherUser.match_preferences.sexualOrientations.includes(currentUserProfile.sexual_orientation);
      return iMatchOtherUserPrefs;
    });

    return new Response(JSON.stringify(finalMatches), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in get-potential-matches function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})