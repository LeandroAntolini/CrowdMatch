import { FeedPost } from '../types';

// Simulação de alguns posts ao vivo de usuários para usar nos destaques
const mockLivePosts = [
    { id: 'lp1', user_id: 'u1', place_id: 'p1', content: 'A música tá incrível hoje!', created_at: new Date().toISOString(), profiles: { id: 'u1', name: 'Carla', photos: ['https://i.pravatar.cc/150?u=carla'] } },
    { id: 'lp2', user_id: 'u2', place_id: 'p1', content: 'Cheio, mas a energia vale a pena!', created_at: new Date().toISOString(), profiles: { id: 'u2', name: 'Marcos', photos: ['https://i.pravatar.cc/150?u=marcos'] } },
    { id: 'lp3', user_id: 'u3', place_id: 'p1', content: 'Melhor drink da cidade, sem dúvidas.', created_at: new Date().toISOString(), profiles: { id: 'u3', name: 'Juliana', photos: ['https://i.pravatar.cc/150?u=juliana'] } },
];

export const mockFeedData: FeedPost[] = [
    {
        id: 'post1',
        placeId: 'p1',
        placeName: 'The Pub',
        placeLogoUrl: 'https://i.pravatar.cc/150?u=thepub',
        type: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1974&auto=format&fit=crop',
        caption: 'Sexta-feira chegou com tudo por aqui! Nossos mixologistas estão prontos para preparar seu drink favorito. Quem vem?',
        likes: 128,
        comments: [
            { user: 'fernanda_s', text: 'Amo esse lugar! ❤️' },
            { user: 'rodrigo_m', text: 'Hoje eu apareço aí!' },
        ],
        timestamp: '2h atrás',
    },
    {
        id: 'post2',
        placeId: 'p2',
        placeName: 'Restaurante Maré',
        placeLogoUrl: 'https://i.pravatar.cc/150?u=mare',
        type: 'video',
        mediaUrl: 'https://videos.pexels.com/video-files/854123/854123-hd_1920_1080_25fps.mp4',
        caption: 'Nossa moqueca capixaba sendo preparada com todo o carinho. Sinta o cheiro daí!',
        likes: 215,
        comments: [
            { user: 'chef_ana', text: 'Que espetáculo!' },
            { user: 'viajante_gourmet', text: 'Preciso provar isso urgente.' },
        ],
        timestamp: '5h atrás',
    },
    {
        id: 'post3',
        placeId: 'p1',
        placeName: 'The Pub',
        placeLogoUrl: 'https://i.pravatar.cc/150?u=thepub',
        type: 'live-highlight',
        mediaUrl: 'https://images.unsplash.com/photo-1578736641330-3155e6395a44?q=80&w=1974&auto=format&fit=crop',
        caption: 'A noite está só começando e a vibe já está lá em cima! Veja o que estão comentando ao vivo:',
        likes: 97,
        comments: [],
        timestamp: 'agora',
        livePosts: mockLivePosts,
    },
    {
        id: 'post4',
        placeId: 'p3',
        placeName: 'Café do Canto',
        placeLogoUrl: 'https://i.pravatar.cc/150?u=cafedocanto',
        type: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1974&auto=format&fit=crop',
        caption: 'Uma pausa na tarde para um café especial. A combinação perfeita para recarregar as energias.',
        likes: 76,
        comments: [
            { user: 'livros_e_cafe', text: 'Meu cantinho preferido!' },
        ],
        timestamp: 'ontem',
    },
];