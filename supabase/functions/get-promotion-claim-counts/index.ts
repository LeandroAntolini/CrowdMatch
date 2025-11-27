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
    // 1. Autenticação (apenas para garantir que a requisição é de um usuário logado)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Acesso não autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    
    const { promotionIds } = await req.json();
    if (!Array.isArray(promotionIds) || promotionIds.length === 0) {
        return new Response(JSON.stringify({ error: 'Lista de IDs de promoção é obrigatória' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. Inicializar o cliente Supabase com Service Role Key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 3. Buscar a contagem total de claims para as promoções fornecidas
    const { data, error } = await supabaseAdmin
        .from('promotion_claims')
        .select('promotion_id', { count: 'exact' })
        .in('promotion_id', promotionIds);
            
    if (error) throw error;
        
    const counts: { [key: string]: number } = {};
    data.forEach((claim: any) => {
        counts[claim.promotion_id] = (counts[claim.promotion_id] || 0) + 1;
    });

    return new Response(JSON.stringify(counts), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Edge Function Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})