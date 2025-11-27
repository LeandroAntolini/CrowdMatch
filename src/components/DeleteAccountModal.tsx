import React from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '../integrations/supabase/client'; // Caminho atualizado
import { useAppContext } from '../context/AppContext';
import { showSuccess, showError, showLoading, dismissToast } from '../utils/toast'; // Importar toasts

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
        const toastId = showLoading('Excluindo sua conta...');

        try {
            const { error: invokeError } = await supabase.functions.invoke('delete-user-account', {
                method: 'POST',
            });

            if (invokeError) {
                throw new Error(invokeError.message);
            }

            await logout();
            dismissToast(toastId);
            showSuccess('Sua conta foi excluída com sucesso!');
            onClose();

        } catch (e: any) {
            console.error("Erro ao excluir conta:", e);
            const errorMessage = `Falha ao excluir conta: ${e.message}. Verifique a Edge Function.`;
            setError(errorMessage);
            updateToast(toastId, 'error', errorMessage);
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