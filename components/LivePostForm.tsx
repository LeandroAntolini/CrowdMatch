import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface LivePostFormProps {
    onSubmit: (content: string) => Promise<void>;
}

const LivePostForm: React.FC<LivePostFormProps> = ({ onSubmit }) => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const charLimit = 280;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || loading) return;

        setLoading(true);
        setError(null);
        try {
            await onSubmit(content);
            setContent('');
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro ao postar.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-surface p-4 rounded-lg mb-6">
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Como está a vibe aí?"
                maxLength={charLimit}
                className="w-full bg-gray-800 text-text-primary p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                rows={3}
            />
            <div className="flex justify-between items-center mt-2">
                <p className={`text-sm ${content.length > charLimit ? 'text-red-500' : 'text-text-secondary'}`}>
                    {content.length} / {charLimit}
                </p>
                <button type="submit" disabled={loading || !content.trim()} className="bg-accent text-white font-bold py-2 px-4 rounded-lg flex items-center disabled:bg-gray-600">
                    {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={18} className="mr-2" />}
                    Postar
                </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </form>
    );
};

export default LivePostForm;