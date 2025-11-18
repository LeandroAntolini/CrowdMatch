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

// Mapeamento mais inteligente e priorizado dos tipos do Google para nossas categorias
const mapGoogleTypeToCategory = (types: string[]): string => {
    if (!types || types.length === 0) return 'Ponto de Interesse';

    const categoryMap: { [key: string]: string } = {
        'night_club': 'Boate',
        'bar': 'Bar',
        'pub': 'Pub',
        'restaurant': 'Restaurante',
        'cafe': 'Café',
        'lounge': 'Lounge',
        'concert_hall': 'Casa de Shows',
        'music_venue': 'Espaço Musical',
        'stadium': 'Estádio',
        'event_venue': 'Local de Eventos',
        'wedding_venue': 'Cerimonial',
    };

    // Itera sobre os tipos fornecidos pelo Google e retorna a primeira correspondência encontrada no nosso mapa
    for (const type of types) {
        if (categoryMap[type]) {
            return categoryMap[type];
        }
    }
    
    return 'Ponto de Interesse'; // Fallback para qualquer outra coisa
};

serve(async (req) => {
  // Lida com a requisição de pré-verificação CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { city, state, query: userQuery } = await req.json();
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

    // Determina a query de busca: usa a query do usuário ou a query padrão
    const query = userQuery && userQuery.trim() !== ''
        ? `${userQuery} em ${city}, ${state}`
        : `bares, restaurantes e vida noturna em ${city}, ${state}`;
        
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