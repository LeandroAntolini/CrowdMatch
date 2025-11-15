
import React from 'react';
import { MapPin, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const OnboardingPage: React.FC = () => {
    const navigate = useNavigate();
    const { completeOnboarding } = useAppContext();

    const handleGetStarted = () => {
        navigator.geolocation.getCurrentPosition(
            () => {
                completeOnboarding();
                navigate('/auth');
            },
            () => {
                // Handle permission denial
                alert("A permissão de localização é necessária para usar o CrowdMatch. Por favor, ative nas configurações do seu navegador.");
            }
        );
    };

    return (
        <div className="flex flex-col h-full justify-between p-8 text-center bg-background">
            <div>
                <SparklesIcon className="mx-auto h-16 w-16 text-primary" />
                <h1 className="text-4xl font-bold mt-4 text-text-primary">Bem-vindo ao CrowdMatch</h1>
                <p className="text-text-secondary mt-2">Sinta a vibe antes de ir.</p>
            </div>

            <div className="space-y-6 text-left">
                <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                        <MapPin className="h-8 w-8 text-accent" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-text-primary">Veja a Lotação em Tempo Real</h2>
                        <p className="text-text-secondary text-sm">Tenha estimativas em tempo real de quantas pessoas estão em bares, baladas e eventos perto de você.</p>
                    </div>
                </div>
                <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                         <SparklesIcon className="h-8 w-8 text-accent" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-text-primary">Conecte-se com Pessoas no Local</h2>
                        <p className="text-text-secondary text-sm">Fez check-in? Conecte-se com outras pessoas no mesmo estabelecimento.</p>
                    </div>
                </div>
                 <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                        <ShieldCheck className="h-8 w-8 text-accent" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-text-primary">Sua Privacidade é Prioridade</h2>
                        <p className="text-text-secondary text-sm">Usamos sua localização apenas para check-ins. Outros nunca verão sua localização exata.</p>
                    </div>
                </div>
            </div>

            <button
                onClick={handleGetStarted}
                className="w-full bg-accent text-white font-bold py-3 px-4 rounded-lg hover:bg-pink-600 transition-colors duration-300 shadow-lg"
            >
                Começar
            </button>
        </div>
    );
};

const SparklesIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 019.75 22.5a.75.75 0 01-.75-.75v-7.192A4.5 4.5 0 009.315 7.584zM15 15a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" clipRule="evenodd" />
        <path d="M3 18.75a.75.75 0 01.75-.75h6a.75.75 0 010 1.5h-6a.75.75 0 01-.75-.75zM3 15.75a.75.75 0 01.75-.75h6a.75.75 0 010 1.5h-6a.75.75 0 01-.75-.75zM3 12.75a.75.75 0 01.75-.75h6a.75.75 0 010 1.5h-6a.75.75 0 01-.75-.75z" />
    </svg>
);


export default OnboardingPage;
