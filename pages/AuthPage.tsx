import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import SignUpForm from '../components/SignUpForm';
import BusinessSignUpForm from '../components/BusinessSignUpForm';
import LoginForm from '../components/LoginForm';

const AuthPage: React.FC = () => {
    const { isAuthenticated } = useAppContext();
    const navigate = useNavigate();
    const [view, setView] = useState<'sign_in' | 'sign_up'>('sign_in');
    const [signUpType, setSignUpType] = useState<'user' | 'owner'>('user');

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    const activeTabClass = 'border-b-2 border-accent text-text-primary';
    const inactiveTabClass = 'text-text-secondary';

    return (
        <div className="flex flex-col justify-center h-full p-6 max-w-sm mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-primary mb-2">CrowdMatch</h1>
                <p className="text-text-secondary">
                    {view === 'sign_in' ? 'Entre na sua conta' : 'Crie sua conta'}
                </p>
            </div>
            
            <div className="w-full">
                <div className="flex mb-8 border-b border-gray-700">
                    <button
                        onClick={() => setView('sign_in')}
                        className={`flex-1 py-3 text-center font-bold transition-all ${view === 'sign_in' ? activeTabClass : inactiveTabClass}`}
                    >
                        Entrar
                    </button>
                    <button
                        onClick={() => setView('sign_up')}
                        className={`flex-1 py-3 text-center font-bold transition-all ${view === 'sign_up' ? activeTabClass : inactiveTabClass}`}
                    >
                        Cadastrar
                    </button>
                </div>

                {view === 'sign_in' ? (
                    <LoginForm />
                ) : (
                    <div>
                        <div className="flex justify-center mb-6 rounded-lg bg-surface p-1 border border-gray-700">
                            <button
                                onClick={() => setSignUpType('user')}
                                className={`w-1/2 py-2 text-sm font-bold rounded-md transition-all ${signUpType === 'user' ? 'bg-accent text-white shadow-lg' : 'text-text-secondary'}`}
                            >
                                Sou Usuário
                            </button>
                            <button
                                onClick={() => setSignUpType('owner')}
                                className={`w-1/2 py-2 text-sm font-bold rounded-md transition-all ${signUpType === 'owner' ? 'bg-accent text-white shadow-lg' : 'text-text-secondary'}`}
                            >
                                Sou Lojista
                            </button>
                        </div>
                        
                        {signUpType === 'user' ? <SignUpForm /> : <BusinessSignUpForm />}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuthPage;