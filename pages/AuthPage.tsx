
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { GENDERS, SEXUAL_ORIENTATIONS } from '../types';

const AuthPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [gender, setGender] = useState(GENDERS[0]);
    const [sexualOrientation, setSexualOrientation] = useState(SEXUAL_ORIENTATIONS[0]);
    const { login } = useAppContext();
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            login(email, gender, sexualOrientation);
            navigate('/');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full p-6">
            <h1 className="text-4xl font-bold text-primary mb-2">CrowdMatch</h1>
            <p className="text-text-secondary mb-8">Crie sua conta para começar</p>
            
            <form onSubmit={handleLogin} className="w-full max-w-sm">
                <div className="mb-4">
                    <label className="block text-text-secondary text-sm font-bold mb-2" htmlFor="email">
                        E-mail
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="voce@exemplo.com"
                        className="w-full px-3 py-2 text-text-primary bg-surface border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-text-secondary text-sm font-bold mb-2" htmlFor="password">
                        Senha
                    </label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="******************"
                        className="w-full px-3 py-2 text-text-primary bg-surface border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-text-secondary text-sm font-bold mb-2" htmlFor="gender">
                        Gênero
                    </label>
                    <select
                        id="gender"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-3 py-2 text-text-primary bg-surface border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                        {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                </div>
                <div className="mb-6">
                    <label className="block text-text-secondary text-sm font-bold mb-2" htmlFor="sexualOrientation">
                        Orientação Sexual
                    </label>
                    <select
                        id="sexualOrientation"
                        value={sexualOrientation}
                        onChange={(e) => setSexualOrientation(e.target.value)}
                        className="w-full px-3 py-2 text-text-primary bg-surface border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                        {SEXUAL_ORIENTATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <button
                    type="submit"
                    className="w-full bg-accent text-white font-bold py-3 px-4 rounded-lg hover:bg-pink-600 transition-colors duration-300"
                >
                    Entrar / Cadastrar
                </button>
            </form>
            <div className="text-center mt-4 text-xs text-gray-500">
                <p>Este é um protótipo. Qualquer e-mail/senha funcionará para criar uma conta.</p>
            </div>
        </div>
    );
};

export default AuthPage;
