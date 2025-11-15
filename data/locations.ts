export const brazilianStates = [
    { abbr: "ES", name: "Espírito Santo" },
    { abbr: "MG", name: "Minas Gerais" },
    { abbr: "RJ", name: "Rio de Janeiro" },
    { abbr: "SP", name: "São Paulo" },
    // Adicione outros estados conforme necessário
];

export const citiesByState: { [key: string]: string[] } = {
    "ES": ["Vitória", "Vila Velha", "Serra", "Cariacica", "Guarapari"],
    "MG": ["Belo Horizonte", "Uberlândia", "Contagem"],
    "RJ": ["Rio de Janeiro", "Niterói", "São Gonçalo"],
    "SP": ["São Paulo", "Guarulhos", "Campinas"],
};