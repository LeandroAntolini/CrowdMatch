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

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            toast.error(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message);
            setLoading(false);
        } else {
            toast.success('Bem-vindo de volta!');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in-up">
            <div className="space-y-1">
                <label className="text-[10px] font-black text-text-secondary uppercase ml-2 tracking-widest">E-mail</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="exemplo@email.com"
                    className="w-full bg-secondary px-5 py-4 rounded-2xl text-sm font-bold border border-transparent focus:bg-white focus:border-border-subtle outline-none transition-all"
                />
            </div>
            
            <div className="space-y-1">
                <label className="text-[10px] font-black text-text-secondary uppercase ml-2 tracking-widest">Senha</label>
                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full bg-secondary px-5 py-4 rounded-2xl text-sm font-bold border border-transparent focus:bg-white focus:border-border-subtle outline-none transition-all"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 px-4 flex items-center text-text-secondary"
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
            </div>

            <div className="text-right px-2">
                <button type="button" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Esqueci a senha</button>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-text-primary text-white font-black py-4 rounded-2xl flex items-center justify-center shadow-xl active:scale-95 transition-all uppercase tracking-widest text-xs"
            >
                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Entrar'}
            </button>
        </form>
    );
};

export default LoginForm;