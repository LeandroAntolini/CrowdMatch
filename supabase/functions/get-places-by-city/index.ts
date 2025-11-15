import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

// Define o tipo de dados 'Place' para corresponder ao que o aplicativo espera
interface Place {
  id: string;
  name: string;
  address: string;
  category: string;
  rating: number;
  photoUrl: string;
  distance: number;
  isOpen: boolean;
  lat: number;
  lng: number;
  city: string;
  state: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Lida com a requisição de pré-verificação CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { city } = await req.json();
    if (!city) {
      return new Response(JSON.stringify({ error: 'O nome da cidade é obrigatório' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
        return new Response(JSON.stringify({ error: 'A chave da API do Google Maps não está configurada' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }

    // Busca por locais usando a API do Google Places - AGORA INCLUINDO RESTAURANTES
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=bares,%20restaurantes%20e%20baladas%20em%20${encodeURIComponent(city)}&key=${apiKey}&language=pt-BR`;
    
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
        throw new Error(`A busca na API do Google Places falhou: ${searchResponse.statusText}`);
    }
    const searchData = await searchResponse.json();

    // Mapeia os resultados para o nosso formato de dados 'Place'
    const places: Place[] = (searchData.results || []).map((p: any) => {
        const photoRef = p.photos?.[0]?.photo_reference;
        const photoUrl = photoRef
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${apiKey}`
            : 'https://picsum.photos/seed/placeholder/400/300'; // Foto de fallback

        return {
            id: p.place_id,
            name: p.name,
            address: p.formatted_address,
            category: p.types[0] ? p.types[0].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Bar',
            rating: p.rating || 0,
            photoUrl: photoUrl,
            isOpen: p.opening_hours?.open_now || false,
            lat: p.geometry.location.lat,
            lng: p.geometry.location.lng,
            city: city,
            state: '', // O estado pode ser extraído se necessário
            distance: Math.round(Math.random() * 5000), // Distância de exemplo
        };
    });

    return new Response(JSON.stringify(places), {
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