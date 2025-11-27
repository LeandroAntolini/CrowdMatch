import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { LivePost } from '../context/AppContext';

interface EditLivePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (newContent: string) => Promise<void>;
    post: LivePost | null;
}

const EditLivePostModal: React.FC<EditLivePostModalProps> = ({ isOpen, onClose, onSave, post }) => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const charLimit = 280;

    useEffect(() => {
        if (post) {
            setContent(post.content);
        }
    }, [post]);

    if (!isOpen || !post) return null;

    const handleSave = async () => {
        if (!content.trim() || loading) return;
        setLoading(true);
        try {
            await onSave(content);
            onClose();
        } catch (err) {
            // O erro será tratado no componente pai
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="relative bg-surface rounded-2xl w-full max-w-sm p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-text-primary">Editar Post</h2>
                    <button onClick={onClose} className="text-text-secondary hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    maxLength={charLimit}
                    className="w-full bg-gray-800 text-text-primary p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                    rows={4}
                />
                <p className={`text-right text-sm mt-1 ${content.length > charLimit ? 'text-red-500' : 'text-text-secondary'}`}>
                    {content.length} / {charLimit}
                </p>
                <div className="flex justify-end gap-3 mt-4">
                    <button onClick={onClose} className="bg-gray-600 text-text-primary font-bold py-2 px-4 rounded-lg hover:bg-gray-700">
                        Cancelar
                    </button>
                    <button onClick={handleSave} disabled={loading || !content.trim()} className="bg-accent text-white font-bold py-2 px-4 rounded-lg flex items-center disabled:bg-gray-600">
                        {loading && <Loader2 size={18} className="animate-spin mr-2" />}
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditLivePostModal;