import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '../context/AppContext';

const AuthPage: React.FC = () => {
    const { isAuthenticated } = useAppContext();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    return (
        <div className="flex flex-col justify-center h-full p-6">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-primary mb-2">CrowdMatch</h1>
                <p className="text-text-secondary">Entre ou crie sua conta</p>
            </div>
            <div className="w-full max-w-sm mx-auto">
                <Auth
                    supabaseClient={supabase}
                    appearance={{ theme: ThemeSupa }}
                    providers={[]}
                    theme="dark"
                    localization={{
                        variables: {
                            sign_up: {
                                email_label: 'Seu e-mail',
                                password_label: 'Crie uma senha',
                                button_label: 'Cadastrar',
                                social_provider_text: 'Entrar com {{provider}}',
                                link_text: 'Não tem uma conta? Cadastre-se',
                            },
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
                />
            </div>
        </div>
    );
};

export default AuthPage;