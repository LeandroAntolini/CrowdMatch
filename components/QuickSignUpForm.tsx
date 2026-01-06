import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Phone, User as UserIcon, Loader2 } from 'lucide-react';

interface QuickSignUpFormProps {
    onSuccess: () => void;
}

const QuickSignUpForm: React.FC<QuickSignUpFormProps> = ({ onSuccess }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Para simplificar o fluxo de QR Code sem senha complexa no momento de urgência do pedido,
        // criamos uma conta com um email fake baseado no telefone e uma senha padrão.
        // Em produção, isso seria um fluxo de "Auth by Phone" real.
        const fakeEmail = `${phone.replace(/\D/g, '')}@crowdmatch.temp`;
        const defaultPassword = `tempPass123!`;

        const { data, error: signUpError } = await supabase.auth.signUp({
            email: fakeEmail,
            password: defaultPassword,
            options: {
                data: {
                    name: name,
                    phone: phone,
                    is_simplified: true,
                    role: 'user'
                }
            }
        });

        if (signUpError) {
            // Se o usuário já existe, tentamos fazer login
            if (signUpError.message.includes('already registered')) {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: fakeEmail,
                    password: defaultPassword,
                });
                if (signInError) {
                    setError("Erro ao acessar sua conta rápida. Verifique o número.");
                    setLoading(false);
                    return;
                }
                onSuccess();
            } else {
                setError(signUpError.message);
                setLoading(false);
            }
        } else {
            onSuccess();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-surface p-6 rounded-xl border border-accent/30">
            <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-text-primary">Acesso Rápido ao Cardápio</h3>
                <p className="text-sm text-text-secondary">Informe seus dados para abrir sua comanda na mesa.</p>
            </div>

            <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
                <input
                    type="text"
                    placeholder="Seu Nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                />
            </div>

            <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
                <input
                    type="tel"
                    placeholder="Seu Celular (com DDD)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                />
            </div>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent text-white font-bold py-3 rounded-lg flex items-center justify-center disabled:bg-gray-600"
            >
                {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                {loading ? 'Acessando...' : 'Abrir Cardápio'}
            </button>
        </form>
    );
};

export default QuickSignUpForm;