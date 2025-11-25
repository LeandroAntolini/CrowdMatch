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
    const { qrCodeValue } = await req.json();
    if (!qrCodeValue) {
      return new Response(JSON.stringify({ error: 'QR Code data is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const parts = qrCodeValue.split('|');
    
    // Tenta validar como uma Reivindicação de Promoção primeiro
    // Formato: claimId|userId|promotionId|claimedAt
    if (parts.length === 4) {
        const [claimId, userId, promotionId] = parts;
        
        const { data: claim, error: claimError } = await supabaseAdmin
            .from('promotion_claims')
            .select('*, promotions(title, place_id), profiles(name)')
            .eq('id', claimId)
            .eq('user_id', userId)
            .eq('promotion_id', promotionId)
            .single();

        if (!claimError && claim) {
            if (claim.status === 'redeemed') {
                return new Response(JSON.stringify({ 
                    status: 'error', 
                    message: 'Esta promoção já foi resgatada.',
                    data: { type: 'Promoção', user: claim.profiles.name, title: claim.promotions.title }
                }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            const { error: updateError } = await supabaseAdmin
                .from('promotion_claims')
                .update({ status: 'redeemed' })
                .eq('id', claimId);

            if (updateError) throw updateError;

            return new Response(JSON.stringify({ 
                status: 'success', 
                message: 'Promoção resgatada com sucesso!',
                data: { type: 'Promoção', user: claim.profiles.name, title: claim.promotions.title, placeId: claim.promotions.place_id }
            }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
    }

    // Tenta validar como Check-in ou Intenção de Ida
    // Formato: userId|placeId|timestamp|type
    if (parts.length === 4) {
        const [userId, placeId, timestamp, type] = parts;
        const tableName = type === 'check-in' ? 'check_ins' : 'going_intentions';

        const { data: record, error: recordError } = await supabaseAdmin
            .from(tableName)
            .select('*, profiles(name)')
            .eq('user_id', userId)
            .eq('place_id', placeId)
            .single();
        
        if (!recordError && record) {
            return new Response(JSON.stringify({ 
                status: 'success', 
                message: `Validação de '${type === 'check-in' ? 'Check-in' : 'Eu Vou'}' bem-sucedida.`,
                data: { type: type === 'check-in' ? 'Check-in' : 'Eu Vou', user: record.profiles.name, placeId: record.place_id }
            }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
    }

    return new Response(JSON.stringify({ status: 'error', message: 'QR Code inválido ou não encontrado.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})