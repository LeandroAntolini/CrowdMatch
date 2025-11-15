import { Place, User, GENDERS, SEXUAL_ORIENTATIONS } from '../types';

const FAKE_USER_ID = 'user_0';

// Lista de usuários pré-definidos para substituir a chamada à API Gemini
const predefinedUsers: Omit<User, 'id' | 'photos' | 'email' | 'isAvailableForMatch' | 'matchPreferences'>[] = [
    { name: "Lucas", age: 28, bio: "Engenheiro de software que adora trilhas e um bom café.", interests: ["Trilhas", "Café", "Tecnologia"], gender: "Homem", sexualOrientation: "Heterossexual", city: "Vila Velha", state: "ES" },
    { name: "Juliana", age: 25, bio: "Designer apaixonada por arte, música ao vivo e novas comidas.", interests: ["Arte", "Música ao Vivo", "Gastronomia"], gender: "Mulher", sexualOrientation: "Bissexual", city: "Vitória", state: "ES" },
    { name: "Fernando", age: 31, bio: "Músico nas horas vagas, advogado no resto do tempo.", interests: ["Música", "Sinuca", "Cinema"], gender: "Homem", sexualOrientation: "Homossexual", city: "Vila Velha", state: "ES" },
    { name: "Beatriz", age: 22, bio: "Estudante de veterinária e mãe de dois cachorros.", interests: ["Animais", "Praia", "Séries"], gender: "Mulher", sexualOrientation: "Heterossexual", city: "Serra", state: "ES" },
    { name: "Rafael", age: 29, bio: "Fotógrafo que vê beleza nas pequenas coisas.", interests: ["Fotografia", "Exploração Urbana", "Cultura Pop"], gender: "Homem", sexualOrientation: "Pansexual", city: "Vitória", state: "ES" },
    { name: "Carla", age: 27, bio: "Chef de cozinha que acredita que a vida é curta demais para não comer sobremesa.", interests: ["Culinária", "Vinho", "Amigos"], gender: "Mulher", sexualOrientation: "Heterossexual", city: "Vila Velha", state: "ES" },
    { name: "Leo", age: 24, bio: "Atleta amador, viciado em corrida e vida saudável.", interests: ["Corrida", "Fitness", "Pizza"], gender: "Não-binário", sexualOrientation: "Bissexual", city: "Cariacica", state: "ES" },
    { name: "Mariana", age: 30, bio: "Jornalista curiosa sobre o mundo. Adoro viajar e aprender.", interests: ["Viagens", "Idiomas", "Documentários"], gender: "Mulher", sexualOrientation: "Homossexual", city: "Vitória", state: "ES" },
    { name: "Thiago", age: 26, bio: "Gamer, fã de ficção científica e de montar Legos.", interests: ["Games", "Ficção Científica", "Lego"], gender: "Homem", sexualOrientation: "Assexual", city: "Vila Velha", state: "ES" },
    { name: "Amanda", age: 23, bio: "Amante de ioga, meditação e tudo que traz paz.", interests: ["Ioga", "Meditação", "Natureza"], gender: "Mulher", sexualOrientation: "Pansexual", city: "Serra", state: "ES" },
    { name: "Daniel", age: 32, bio: "Empreendedor com grandes sonhos. Gosto de conversar sobre negócios e inovação.", interests: ["Empreendedorismo", "Inovação", "Tecnologia"], gender: "Homem", sexualOrientation: "Heterossexual", city: "Vitória", state: "ES" },
    { name: "Sofia", age: 28, bio: "Dançarina que ama expressar-se através do movimento.", interests: ["Dança", "Teatro", "Música Latina"], gender: "Mulher", sexualOrientation: "Bissexual", city: "Vila Velha", state: "ES" },
    { name: "Gabriel", age: 21, bio: "Universitário tentando equilibrar os estudos com a vida social.", interests: ["Festas", "Amigos", "Música Eletrônica"], gender: "Homem", sexualOrientation: "Heterossexual", city: "Vitória", state: "ES" },
    { name: "Isabela", age: 29, bio: "Arquiteta que adora design, gatos e um bom filme de suspense.", interests: ["Design", "Gatos", "Filmes de Suspense"], gender: "Mulher", sexualOrientation: "Homossexual", city: "Vila Velha", state: "ES" },
    { name: "Matheus", age: 27, bio: "Aventureiro, sempre planejando a próxima viagem de moto.", interests: ["Motos", "Viagens", "Rock Clássico"], gender: "Homem", sexualOrientation: "Heterossexual", city: "Serra", state: "ES" },
];

export const generateMockUsers = async (count: number): Promise<User[]> => {
    // A contagem não é mais necessária, mas mantemos a assinatura da função
    return predefinedUsers.map((profile, index) => ({
        id: index === 0 ? FAKE_USER_ID : `user_${index}`,
        ...profile,
        email: `user${index}@example.com`,
        photos: Array.from({ length: 3 }, (_, i) => `https://picsum.photos/seed/${profile.name}${i}/400/600`),
        isAvailableForMatch: true,
        matchPreferences: {
            genders: GENDERS.filter(g => g !== 'Outro'),
            sexualOrientations: SEXUAL_ORIENTATIONS.filter(s => s !== 'Outro'),
        }
    }));
};

const predefinedPlaces = [
    { name: "Velvet Lounge", category: "Boate", lat: -23.5505, lng: -46.6333, city: "Vitória", state: "ES" },
    { name: "Bar Neon Cactus", category: "Bar", lat: -23.5515, lng: -46.6345, city: "Vila Velha", state: "ES" },
    { name: "Casa de Shows Starlight", category: "Casa de Show", lat: -23.5495, lng: -46.6320, city: "Vitória", state: "ES" },
    { name: "Pub O Alquimista", category: "Pub", lat: -23.5525, lng: -46.6350, city: "Vila Velha", state: "ES" },
    { name: "Rooftop 360", category: "Bar no Terraço", lat: -23.5480, lng: -46.6360, city: "Serra", state: "ES" },
];

export const generateMockPlaces = async (): Promise<Place[]> => {
    return predefinedPlaces.map((place, index) => ({
        id: `place_${index}`,
        name: place.name,
        address: `Rua Fictícia, ${100 + index * 5}, ${place.city}, ${place.state}`,
        category: place.category,
        rating: 4.0 + (Math.random()),
        photoUrl: `https://picsum.photos/seed/${place.name}/400/300`,
        distance: Math.round(Math.random() * 1500),
        isOpen: Math.random() > 0.2,
        lat: place.lat,
        lng: place.lng,
        city: place.city,
        state: place.state,
    })).sort((a, b) => a.distance - b.distance);
};