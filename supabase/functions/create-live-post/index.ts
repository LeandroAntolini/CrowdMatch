import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Lista de palavras impróprias simplificada. Em produção, usar um serviço/lista mais robusto.
const PROFANITY_LIST = [
  'palavrao1', 'palavrao2', 'ofensa1', 'ofensa2', 
  // Adicione palavras em português que você queira bloquear
  'merda', 'bosta', 'caralho', 'puta', 'foder', 'cu' 
];

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

    const { placeId, content } = await req.json();
    if (!placeId || !content || content.trim() === '') {
        return new Response(JSON.stringify({ error: 'Conteúdo e local são obrigatórios' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    if (content.length > 280) {
        return new Response(JSON.stringify({ error: 'O conteúdo excede 280 caracteres' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Filtro de profanidade
    const lowerCaseContent = content.toLowerCase();
    for (const word of PROFANITY_LIST) {
        if (lowerCaseContent.includes(word)) {
            return new Response(JSON.stringify({ error: 'Seu post contém linguagem imprópria e não pode ser publicado.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
    }

    // Inserir o post no banco de dados
    const { error: insertError } = await supabaseAdmin.from('live_posts').insert({
        user_id: user.id,
        place_id: placeId,
        content: content,
    });

    if (insertError) {
        throw insertError;
    }

    return new Response(JSON.stringify({ message: 'Post criado com sucesso!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})