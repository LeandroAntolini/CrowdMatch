import React from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '../context/AppContext';

interface DeleteAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ isOpen, onClose }) => {
    const { logout } = useAppContext();
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    if (!isOpen) return null;

    const handleDelete = async () => {
        setLoading(true);
        setError(null);

        // Supabase Auth não tem uma função direta para 'delete user'.
        // A exclusão de um usuário deve ser feita por um Service Role Key (servidor)
        // ou através de uma Edge Function para manter a segurança.
        // Como estamos no cliente, a maneira mais segura é usar uma Edge Function.
        
        // Para simplificar e seguir o fluxo de deleção de dados do usuário,
        // vamos simular a exclusão do usuário e forçar o logout.
        // Em um ambiente de produção, isso DEVE ser feito via Edge Function.
        
        // Tentativa de exclusão (requer Service Role Key, que não temos no cliente)
        // const { error: deleteError } = await supabase.auth.admin.deleteUser(
        //     supabase.auth.user()?.id!
        // );

        // Simulação de exclusão segura (requer Edge Function)
        // Vamos simular o sucesso e forçar o logout, pois a exclusão real
        // do perfil e do usuário Auth é complexa no lado do cliente.
        
        // Para o propósito deste exercício, vamos apenas forçar o logout
        // e confiar que o usuário será excluído pelo administrador.
        // Se o usuário for excluído, o RLS e ON DELETE CASCADE cuidarão do perfil.
        
        // Se o usuário quiser realmente excluir a conta, ele deve ser capaz de fazê-lo.
        // Vamos usar uma Edge Function para isso.

        try {
            // 1. Invocar Edge Function para exclusão segura
            const { error: invokeError } = await supabase.functions.invoke('delete-user-account', {
                method: 'POST',
            });

            if (invokeError) {
                throw new Error(invokeError.message);
            }

            // 2. Forçar logout após a exclusão bem-sucedida
            await logout();
            onClose();

        } catch (e: any) {
            console.error("Erro ao excluir conta:", e);
            setError(`Falha ao excluir conta: ${e.message}. Verifique a Edge Function.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="relative bg-surface rounded-2xl w-full max-w-sm text-center p-8 animate-fade-in-up">
                <button onClick={onClose} className="absolute top-2 right-2 text-text-secondary hover:text-white">
                    <X size={24} />
                </button>
                
                <AlertTriangle className="mx-auto h-16 w-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-text-primary mb-2">Excluir Conta</h2>
                <p className="text-text-secondary mb-6">Tem certeza que deseja excluir sua conta? Esta ação é irreversível e todos os seus dados (perfil, matches, mensagens) serão permanentemente apagados.</p>

                {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

                <div className="space-y-3">
                    <button
                        onClick={handleDelete}
                        disabled={loading}
                        className="w-full bg-red-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center disabled:bg-gray-600"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin mr-2" /> : 'Sim, Excluir Permanentemente'}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="w-full bg-gray-600 text-text-primary font-bold py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteAccountModal;