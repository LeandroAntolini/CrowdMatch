import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PROFANITY_LIST = ['merda', 'bosta', 'caralho', 'puta', 'foder', 'cu'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Acesso não autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const token = authHeader.replace('Bearer ', '')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { postId, content } = await req.json();
    if (!postId || !content || content.trim() === '') {
        return new Response(JSON.stringify({ error: 'ID do post e conteúdo são obrigatórios' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    if (content.length > 280) {
        return new Response(JSON.stringify({ error: 'O conteúdo excede 280 caracteres' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Filtro de profanidade
    const lowerCaseContent = content.toLowerCase();
    for (const word of PROFANITY_LIST) {
        if (lowerCaseContent.includes(word)) {
            return new Response(JSON.stringify({ error: 'Seu post contém linguagem imprópria.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
    }

    // Atualiza o post, garantindo que o usuário é o dono
    const { error: updateError } = await supabaseAdmin
        .from('live_posts')
        .update({ content: content })
        .eq('id', postId)
        .eq('user_id', user.id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ message: 'Post atualizado com sucesso!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})