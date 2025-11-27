import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

interface Promotion {
  id: string;
  title: string;
  limit_count: number;
  end_date: string;
}

interface PromotionClaim {
  id: string;
  promotion_id: string;
  user_id: string;
  claimed_at: string;
  status: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
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
    const userId = user.id;

    const { promotionId } = await req.json();
    if (!promotionId) {
        return new Response(JSON.stringify({ error: 'ID da promoção é obrigatório' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 1. Fetch promotion details (limit_count)
    const { data: promotion, error: promoError } = await supabaseAdmin
        .from('promotions')
        .select('id, title, limit_count, end_date')
        .eq('id', promotionId)
        .single<Promotion>();

    if (promoError || !promotion) {
        return new Response(JSON.stringify({ error: 'Promoção não encontrada ou inválida.' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    if (new Date(promotion.end_date) < new Date()) {
        return new Response(JSON.stringify({ error: 'Promoção expirada.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. Attempt to insert the claim
    const { data: insertData, error: insertError } = await supabaseAdmin
        .from('promotion_claims')
        .insert({ promotion_id: promotionId, user_id: userId })
        .select('id, claimed_at')
        .single<Pick<PromotionClaim, 'id' | 'claimed_at'>>();

    if (insertError) {
        if (insertError.code === '23505') {
            // User already claimed this promotion. Fetch existing claim data to return
            const { data: existingClaim, error: fetchExistingError } = await supabaseAdmin
                .from('promotion_claims')
                .select('id, claimed_at')
                .eq('promotion_id', promotionId)
                .eq('user_id', userId)
                .single<Pick<PromotionClaim, 'id' | 'claimed_at'>>();

            if (fetchExistingError || !existingClaim) {
                 return new Response(JSON.stringify({ error: 'Falha ao buscar reivindicação existente.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
            
            // Recalculate order for existing claim
            const { count: existingCount, error: countError } = await supabaseAdmin
                .from('promotion_claims')
                .select('id', { count: 'exact' })
                .eq('promotion_id', promotionId)
                .lte('claimed_at', existingClaim.claimed_at);
                
            const existingClaimOrder = existingCount || 0;
            const isWinner = existingClaimOrder > 0 && existingClaimOrder <= promotion.limit_count;

            return new Response(JSON.stringify({ 
                success: false, 
                message: 'Você já reivindicou esta promoção.', 
                claimed: true,
                claimId: existingClaim.id,
                claimOrder: existingClaimOrder,
                isWinner: isWinner
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }
        console.error('Error inserting claim:', insertError);
        return new Response(JSON.stringify({ error: `Falha ao registrar reivindicação: ${insertError.message}` }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
    
    // 3. Determine the user's claim order
    // We query all claims for this promotion that happened BEFORE or AT the user's claimed_at time.
    const { count, error: countError } = await supabaseAdmin
        .from('promotion_claims')
        .select('id', { count: 'exact' })
        .eq('promotion_id', promotionId)
        .lte('claimed_at', insertData.claimed_at);

    if (countError) {
        console.error('Error counting claims:', countError);
        return new Response(JSON.stringify({ error: 'Falha ao verificar a ordem da reivindicação.' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
    
    const claimOrder = count || 0;
    const isWinner = claimOrder > 0 && claimOrder <= promotion.limit_count;
    
    const responseBody = {
        success: true,
        claimed: true,
        claimId: insertData.id, // Retorna o ID da nova reivindicação
        promotionTitle: promotion.title,
        claimOrder: claimOrder,
        limit: promotion.limit_count,
        isWinner: isWinner,
        message: isWinner 
            ? `Parabéns! Você foi o ${claimOrder}º a reivindicar a promoção "${promotion.title}".`
            : `Você reivindicou a promoção, mas o limite de ${promotion.limit_count} já foi atingido. Sua ordem foi ${claimOrder}.`
    };

    return new Response(JSON.stringify(responseBody), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Edge Function Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})