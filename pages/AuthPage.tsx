import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '../context/AppContext';
import SignUpForm from '../components/SignUpForm';

const AuthPage: React.FC = () => {
    const { isAuthenticated } = useAppContext();
    const navigate = useNavigate();
    const [view, setView] = useState<'sign_in' | 'sign_up'>('sign_in');

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    const activeTabClass = 'border-b-2 border-accent text-text-primary';
    const inactiveTabClass = 'text-text-secondary';

    return (
        <div className="flex flex-col justify-center h-full p-6">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-primary mb-2">CrowdMatch</h1>
                <p className="text-text-secondary">
                    {view === 'sign_in' ? 'Entre na sua conta' : 'Crie sua conta'}
                </p>
            </div>
            <div className="w-full max-w-sm mx-auto">
                <div className="flex mb-6 border-b border-gray-700">
                    <button
                        onClick={() => setView('sign_in')}
                        className={`flex-1 py-2 text-center font-semibold transition-colors ${view === 'sign_in' ? activeTabClass : inactiveTabClass}`}
                    >
                        Entrar
                    </button>
                    <button
                        onClick={() => setView('sign_up')}
                        className={`flex-1 py-2 text-center font-semibold transition-colors ${view === 'sign_up' ? activeTabClass : inactiveTabClass}`}
                    >
                        Cadastrar
                    </button>
                </div>

                {view === 'sign_in' ? (
                    <Auth
                        supabaseClient={supabase}
                        view="sign_in"
                        appearance={{ theme: ThemeSupa }}
                        providers={[]}
                        theme="dark"
                        localization={{
                            variables: {
                                sign_in: {
                                    email_label: 'Seu e-mail',
                                    password_label: 'Sua senha',
                                    button_label: 'Entrar',
                                    social_provider_text: 'Entrar com {{provider}}',
                                    link_text: 'Já tem uma conta? Entre',
                                },
                                forgotten_password: {
                                    email_label: 'Seu e-mail',
                                    password_label: 'Sua senha',
                                    button_label: 'Enviar instruções',
                                    link_text: 'Esqueceu sua senha?',
                                },
                            },
                        }}
                        showLinks={false}
                    />
                ) : (
                    <SignUpForm />
                )}
            </div>
        </div>
    );
};

export default AuthPage;