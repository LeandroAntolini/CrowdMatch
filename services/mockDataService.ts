
import { GoogleGenAI, Type } from "@google/genai";
import { Place, User, GENDERS, SEXUAL_ORIENTATIONS } from '../types';

const FAKE_USER_ID = 'user_0';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    console.warn("API_KEY environment variable not set. Mock data generation will fail.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

const userSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "Um primeiro nome brasileiro comum." },
        age: { type: Type.INTEGER, description: "Uma idade entre 18 e 35 anos." },
        bio: { type: Type.STRING, description: "Uma bio curta e interessante, com cerca de 20-30 palavras, em português." },
        interests: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Um array de 3 a 5 interesses ou hobbies como strings curtas (ex: 'Trilhas', 'Música ao Vivo'), em português."
        },
        gender: { type: Type.STRING, description: `Um gênero da seguinte lista: [${GENDERS.join(", ")}]` },
        sexualOrientation: { type: Type.STRING, description: `Uma orientação sexual da seguinte lista: [${SEXUAL_ORIENTATIONS.join(", ")}]` },
    },
    required: ["name", "age", "bio", "interests", "gender", "sexualOrientation"]
};


export const generateMockUsers = async (count: number): Promise<User[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Gere uma lista diversificada de ${count} perfis de usuário para um aplicativo de relacionamento social, em português do Brasil. Inclua nomes brasileiros comuns e informações de gênero e orientação sexual.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        users: {
                            type: Type.ARRAY,
                            items: userSchema,
                        }
                    }
                }
            }
        });
        
        const jsonResponse = JSON.parse(response.text);
        const usersFromAI = jsonResponse.users;

        return usersFromAI.map((profile: any, index: number) => ({
            id: index === 0 ? FAKE_USER_ID : `user_${index}`,
            name: profile.name,
            age: profile.age,
            bio: profile.bio,
            interests: profile.interests,
            photos: Array.from({ length: 3 }, (_, i) => `https://picsum.photos/seed/${profile.name}${i}/400/600`),
            isAvailableForMatch: true,
            gender: profile.gender,
            sexualOrientation: profile.sexualOrientation,
            matchPreferences: { // Set some default realistic preferences for mocks
                genders: GENDERS.filter(g => g !== 'Outro'),
                sexualOrientations: SEXUAL_ORIENTATIONS.filter(s => s !== 'Outro'),
            }
        }));
    } catch (e) {
        console.error("Error generating mock users:", e);
        throw new Error("Falha ao gerar dados de usuários falsos da API Gemini.");
    }
};

const predefinedPlaces = [
    { name: "Velvet Lounge", category: "Boate", lat: -23.5505, lng: -46.6333 },
    { name: "Bar Neon Cactus", category: "Bar", lat: -23.5515, lng: -46.6345 },
    { name: "Casa de Shows Starlight", category: "Casa de Show", lat: -23.5495, lng: -46.6320 },
    { name: "Pub O Alquimista", category: "Pub", lat: -23.5525, lng: -46.6350 },
    { name: "Rooftop 360", category: "Bar no Terraço", lat: -23.5480, lng: -46.6360 },
];

export const generateMockPlaces = async (): Promise<Place[]> => {
    return predefinedPlaces.map((place, index) => ({
        id: `place_${index}`,
        name: place.name,
        address: `Rua Augusta, ${100 + index * 5}, São Paulo, SP`,
        category: place.category,
        rating: 4.0 + (Math.random()),
        photoUrl: `https://picsum.photos/seed/${place.name}/400/300`,
        distance: Math.round(Math.random() * 1500),
        isOpen: Math.random() > 0.2,
        lat: place.lat,
        lng: place.lng,
    })).sort((a, b) => a.distance - b.distance);
};
