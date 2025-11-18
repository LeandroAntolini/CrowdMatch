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

const mapGoogleTypeToCategory = (types: string[]): string => {
    <think>**Optimizing the Request**

I'm now investigating a more refined approach to the Google Maps API query. I've realized the API's behavior favors more general searches, so simplifying the query to focus on "bares, restaurantes e vida noturna" is a good step. This should provide a more balanced set of results, including more restaurants, as I believe the original query was too specific.


</think>if (!types || types.length === 0) return 'Ponto de Interesse';

    if (types.includes('night_club')) return 'Boates';
    if (types.includes('pub')) return 'Pubs';
    if (types.includes('bar')) return 'Bares';
    if (types.includes('restaurant')) return 'Restaurantes';
    if (types.includes('concert_hall') || types.includes('music_venue')) return 'Casa de Shows';
    if (types.includes('wedding_venue')) return 'Cerimoniais';
    if (types.some(t => t.includes('event_venue'))) return 'Locais de Eventos';
    
    return 'Ponto de Interesse'; // Fallback for anything else
};

serve(async (req) => {
  // Lida com a requisição de pré-verificação CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { city, state } = await req.json();
    if (!city || !state) {
      return new Response(JSON.stringify({ error: 'Cidade e estado são obrigatórios' }), {
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

    // Query mais balanceada para obter melhores resultados
    const query = `bares, restaurantes e vida noturna em ${city}, ${state}`;
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}&language=pt-BR`;
    
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
            category: mapGoogleTypeToCategory(p.types),
            rating: p.rating || 0,
            photoUrl: photoUrl,
            isOpen: p.opening_hours?.open_now || false,
            lat: p.geometry.location.lat,
            lng: p.geometry.location.lng,
            city: city,
            state: state,
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