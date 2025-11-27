import { User, GENDERS, SEXUAL_ORIENTATIONS } from '../types';

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