import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';

const LoginForm: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            toast.error(error.message === 'Invalid login credentials' 
                ? 'E-mail ou senha incorretos.' 
                : error.message);
            setLoading(false);
        } else {
            toast.success('Bem-vindo de volta!');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in-up">
            <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">E-mail</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="seu@email.com"
                        className="w-full pl-10 pr-4 py-2 text-text-primary bg-surface border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                </div>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Senha</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full pl-10 pr-12 py-2 text-text-primary bg-surface border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 px-3 flex items-center text-text-secondary hover:text-accent transition-colors"
                        aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
            </div>

            <div className="text-right">
                <button 
                    type="button"
                    onClick={() => toast.error("Funcionalidade em desenvolvimento.")}
                    className="text-xs text-accent hover:underline"
                >
                    Esqueceu a senha?
                </button>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent text-white font-bold py-3 px-4 rounded-lg hover:bg-pink-600 transition-colors flex items-center justify-center disabled:bg-gray-600"
            >
                {loading ? (
                    <>
                        <Loader2 size={20} className="animate-spin mr-2" />
                        Entrando...
                    </>
                ) : 'Entrar'}
            </button>
        </form>
    );
};

export default LoginForm;