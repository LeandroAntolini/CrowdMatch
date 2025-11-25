import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Place, LivePost } from '../../types';
import { Loader2, Radio } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { supabase } from '@/integrations/supabase/client';

// Componente para o card de preview que será convertido em imagem
const LiveRepostPreview: React.FC<{ place: Place | null; posts: LivePost[] }> = React.forwardRef(({ place, posts }, ref) => {
    if (!place) return null;

    return (
        <div ref={ref as React.RefObject<HTMLDivElement>} className="w-[350px] h-[350px] bg-surface p-6 flex flex-col justify-between font-sans" id="live-repost-card">
            <div>
                <div className="flex items-center mb-4">
                    <img src={place.photoUrl} alt={place.name} className="w-12 h-12 rounded-md object-cover mr-3" />
                    <div>
                        <h2 className="font-bold text-xl text-text-primary">{place.name}</h2>
                        <p className="text-sm text-text-secondary">Comentários Ao Vivo</p>
                    </div>
                </div>
                <div className="space-y-3">
                    {posts.slice(0, 3).map(post => (
                        <div key={post.id} className="flex items-start space-x-2">
                            <img src={post.profiles.photos[0]} alt={post.profiles.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-sm text-text-primary">{post.profiles.name}</p>
                                <p className="text-xs text-text-secondary">{post.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="text-center">
                <p className="text-lg font-bold text-primary flex items-center justify-center">
                    <Radio size={20} className="mr-2" />
                    A Vibe é Essa!
                </p>
                <p className="text-xs text-text-secondary mt-1">Postado via CrowdMatch</p>
            </div>
        </div>
    );
});


const CreateLiveRepostPage: React.FC = () => {
    const { ownedPlaceIds, getPlaceById, places, livePostsByPlace, fetchLivePostsForPlace, createOwnerFeedPost, currentUser } = useAppContext();
    const navigate = useNavigate();
    const [selectedPlaceId, setSelectedPlaceId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const previewRef = useRef<HTMLDivElement>(null);

    const ownedPlacesDetails = useMemo(() => {
        return ownedPlaceIds
            .map(id => getPlaceById(id))
            .filter((p): p is Place => p !== undefined);
    }, [ownedPlaceIds, places, getPlaceById]);

    useEffect(() => {
        if (ownedPlacesDetails.length > 0 && !selectedPlaceId) {
            const firstPlaceId = ownedPlacesDetails[0].id;
            setSelectedPlaceId(firstPlaceId);
            fetchLivePostsForPlace(firstPlaceId);
        }
    }, [ownedPlacesDetails, selectedPlaceId, fetchLivePostsForPlace]);

    const handlePlaceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPlaceId = e.target.value;
        setSelectedPlaceId(newPlaceId);
        fetchLivePostsForPlace(newPlaceId);
    };

    const selectedPlace = useMemo(() => getPlaceById(selectedPlaceId), [selectedPlaceId, getPlaceById]);
    const postsForPlace = useMemo(() => livePostsByPlace[selectedPlaceId] || [], [livePostsByPlace, selectedPlaceId]);

    const dataURLtoFile = (dataurl: string, filename: string) => {
        const arr = dataurl.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        if (!mimeMatch) return null;
        const mime = mimeMatch[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    }

    const handleSubmit = async () => {
        if (!previewRef.current || !selectedPlace || !currentUser) {
            setError("Não foi possível gerar a imagem. Verifique se há um local selecionado.");
            return;
        }
        setIsLoading(true);
        setError(null);

        try {
            // 1. Generate image from component
            const dataUrl = await htmlToImage.toPng(previewRef.current);
            const file = dataURLtoFile(dataUrl, `live-repost-${selectedPlace.id}-${Date.now()}.png`);
            if (!file) throw new Error("Falha ao converter a imagem para arquivo.");

            // 2. Upload file to storage
            const filePath = `${currentUser.id}/live-reposts/${file.name}`;
            const { error: uploadError } = await supabase.storage
                .from('feed_media')
                .upload(filePath, file);
            if (uploadError) throw uploadError;

            // 3. Get public URL
            const { data: { publicUrl } } = supabase.storage.from('feed_media').getPublicUrl(filePath);
            if (!publicUrl) throw new Error("Não foi possível obter a URL do arquivo.");

            // 4. Create feed post
            await createOwnerFeedPost({
                placeId: selectedPlace.id,
                caption: `A vibe está incrível no ${selectedPlace.name}! Veja o que a galera está comentando ao vivo. #CrowdMatch`,
                mediaUrl: publicUrl,
                type: 'image',
            });

            navigate('/owner/feeds');

        } catch (err: any) {
            console.error("Error creating live repost:", err);
            setError(err.message || "Ocorreu um erro ao criar a postagem.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-2">Destaque Ao Vivo</h1>
            <p className="text-text-secondary mb-6">Crie uma imagem com os comentários mais recentes do seu local para postar no feed.</p>

            <div className="space-y-6 bg-surface p-6 rounded-lg">
                <div>
                    <label htmlFor="place" className="block text-sm font-medium text-text-secondary mb-1">Selecione o Local</label>
                    <select
                        id="place"
                        value={selectedPlaceId}
                        onChange={handlePlaceChange}
                        className="w-full px-3 py-2 text-text-primary bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                        {ownedPlacesDetails.map(place => (
                            <option key={place.id} value={place.id}>{place.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Pré-visualização do Card</label>
                    <div className="flex justify-center items-center bg-background p-4 rounded-lg">
                        <LiveRepostPreview ref={previewRef} place={selectedPlace} posts={postsForPlace} />
                    </div>
                    {postsForPlace.length === 0 && (
                        <p className="text-center text-sm text-yellow-400 mt-2">Nenhum comentário ao vivo encontrado para este local.</p>
                    )}
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <button
                    onClick={handleSubmit}
                    disabled={isLoading || postsForPlace.length === 0}
                    className="w-full bg-accent text-white font-bold py-3 px-4 rounded-lg hover:bg-pink-600 transition-colors flex items-center justify-center disabled:bg-gray-600"
                >
                    {isLoading ? <Loader2 size={20} className="animate-spin mr-2" /> : null}
                    {isLoading ? 'Publicando...' : 'Publicar Destaque'}
                </button>
            </div>
        </div>
    );
};

export default CreateLiveRepostPage;