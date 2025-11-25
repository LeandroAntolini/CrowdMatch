import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

interface Place {
  id: string;
  name: string;
  address: string;
  category: string;
  rating: number;
  photoUrl: string;
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
    if (!types || types.length === 0) return 'Ponto de Interesse';
    const categoryMap: { [key: string]: string } = {
        'night_club': 'Boate', 'bar': 'Bar', 'pub': 'Pub', 'restaurant': 'Restaurante',
        'cafe': 'Café', 'lounge': 'Lounge', 'concert_hall': 'Casa de Shows',
        'music_venue': 'Espaço Musical', 'stadium': 'Estádio', 'event_venue': 'Local de Eventos',
        'wedding_venue': 'Cerimonial',
    };
    for (const type of types) {
        if (categoryMap[type]) return categoryMap[type];
    }
    return 'Ponto de Interesse';
};

const mapGoogleResultToPlace = (result: any, apiKey: string): Place | null => {
    if (!result) return null;
    const photoRef = result.photos?.[0]?.photo_reference;
    const photoUrl = photoRef
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${apiKey}`
        : 'https://picsum.photos/seed/placeholder/400/300';

    const addressComponents = result.address_components;
    const getAddressComponent = (type: string) => addressComponents?.find((c: any) => c.types.includes(type))?.long_name || '';

    return {
        id: result.place_id,
        name: result.name,
        address: result.formatted_address,
        category: mapGoogleTypeToCategory(result.types),
        rating: result.rating || 0,
        photoUrl: photoUrl,
        isOpen: result.opening_hours?.open_now || false,
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        city: getAddressComponent('administrative_area_level_2'),
        state: getAddressComponent('administrative_area_level_1'),
        distance: 0, // Distance is not relevant here
    };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { placeIds } = await req.json();
    if (!Array.isArray(placeIds) || placeIds.length === 0) {
      return new Response(JSON.stringify({ error: 'Um array de placeIds é obrigatório' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
        throw new Error('A chave da API do Google Maps não está configurada');
    }

    const detailPromises = placeIds.map(id => {
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${id}&key=${apiKey}&language=pt-BR&fields=place_id,name,formatted_address,types,rating,opening_hours,geometry,photos,address_components`;
        return fetch(url).then(res => res.json());
    });

    const results = await Promise.all(detailPromises);

    const places = results
        .map(data => mapGoogleResultToPlace(data.result, apiKey))
        .filter((p): p is Place => p !== null);

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