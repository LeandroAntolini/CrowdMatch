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
        if (isAuthenticated) navigate('/');
    }, [isAuthenticated, navigate]);

    return (
        <div className="flex flex-col min-h-screen bg-white p-8 justify-center max-w-sm mx-auto">
            <div className="text-center mb-12">
                <h1 className="text-5xl font-black text-text-primary tracking-tighter mb-2 italic">CrowdMatch</h1>
                <p className="text-text-secondary font-medium">Conecte-se com a vibe do local.</p>
            </div>
            
            <div className="flex mb-8 bg-secondary p-1 rounded-xl">
                <button onClick={() => setView('sign_in')} className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${view === 'sign_in' ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary'}`}>Entrar</button>
                <button onClick={() => setView('sign_up')} className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${view === 'sign_up' ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary'}`}>Cadastrar</button>
            </div>

            {view === 'sign_in' ? (
                <LoginForm />
            ) : (
                <div className="animate-fade-in-up">
                    <div className="flex justify-center mb-6 bg-secondary p-1 rounded-xl">
                        <button onClick={() => setSignUpType('user')} className={`w-1/2 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${signUpType === 'user' ? 'bg-primary text-white shadow-lg' : 'text-text-secondary'}`}>Sou Usuário</button>
                        <button onClick={() => setSignUpType('owner')} className={`w-1/2 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${signUpType === 'owner' ? 'bg-accent text-white shadow-lg' : 'text-text-secondary'}`}>Sou Lojista</button>
                    </div>
                    {signUpType === 'user' ? <SignUpForm /> : <BusinessSignUpForm />}
                </div>
            )}
            
            <p className="text-center text-[10px] text-text-secondary mt-10 uppercase font-bold tracking-widest opacity-40">CrowdMatch &copy; 2024</p>
        </div>
    );
};

export default AuthPage;