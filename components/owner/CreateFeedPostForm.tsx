import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, UploadCloud, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Place } from '../../types';

const CreateFeedPostForm: React.FC = () => {
    const { currentUser, createOwnerFeedPost, ownedPlaceIds, getPlaceById, places } = useAppContext();
    const navigate = useNavigate();
    
    const [selectedPlaceId, setSelectedPlaceId] = useState<string>('');
    const [caption, setCaption] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [fileType, setFileType] = useState<'image' | 'video' | null>(null);
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const ownedPlacesDetails = useMemo(() => {
        return ownedPlaceIds
            .map(id => getPlaceById(id))
            .filter((p): p is Place => p !== undefined);
    }, [ownedPlaceIds, places, getPlaceById]);

    useEffect(() => {
        if (ownedPlacesDetails.length > 0 && !selectedPlaceId) {
            setSelectedPlaceId(ownedPlacesDetails[0].id);
        }
    }, [ownedPlacesDetails, selectedPlaceId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (!selectedFile.type.startsWith('image/') && !selectedFile.type.startsWith('video/')) {
                setError('Por favor, selecione um arquivo de imagem ou vídeo.');
                return;
            }
            if (selectedFile.size > 25 * 1024 * 1024) { // 25MB limit
                setError('O arquivo é muito grande. O limite é de 25MB.');
                return;
            }
            
            setError(null);
            setFile(selectedFile);
            setFileType(selectedFile.type.startsWith('image/') ? 'image' : 'video');
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const removeFile = () => {
        setFile(null);
        setPreview(null);
        setFileType(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !selectedPlaceId || !currentUser) {
            setError('Por favor, selecione um local e um arquivo de mídia.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // 1. Upload file to storage
            const fileExt = file.name.split('.').pop();
            const filePath = `${currentUser.id}/${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('feed_media') // Assuming this bucket exists and is public
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get public URL
            const { data: { publicUrl } } = supabase.storage.from('feed_media').getPublicUrl(filePath);

            if (!publicUrl) throw new Error("Não foi possível obter a URL do arquivo.");

            // 3. Call context function to create post
            await createOwnerFeedPost({
                placeId: selectedPlaceId,
                caption,
                mediaUrl: publicUrl,
                type: fileType!,
            });

            // 4. Success and redirect
            navigate('/owner/feeds');

        } catch (err: any) {
            console.error("Error creating post:", err);
            setError(err.message || "Ocorreu um erro ao criar a postagem.");
        } finally {
            setIsLoading(false);
        }
    };

    if (ownedPlacesDetails.length === 0) {
        return <p className="text-text-secondary">Você precisa registrar um local em seu perfil antes de poder postar.</p>;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-surface p-6 rounded-lg">
            <div>
                <label htmlFor="place" className="block text-sm font-medium text-text-secondary mb-1">Selecione o Local</label>
                <select
                    id="place"
                    value={selectedPlaceId}
                    onChange={(e) => setSelectedPlaceId(e.target.value)}
                    className="w-full px-3 py-2 text-text-primary bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                >
                    {ownedPlacesDetails.map(place => (
                        <option key={place.id} value={place.id}>{place.name}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Mídia (Imagem ou Vídeo)</label>
                {preview ? (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                        {fileType === 'image' ? (
                            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <video src={preview} controls className="w-full h-full" />
                        )}
                        <button type="button" onClick={removeFile} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1">
                            <X size={18} />
                        </button>
                    </div>
                ) : (
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full aspect-video border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-text-secondary cursor-pointer hover:bg-gray-800"
                    >
                        <UploadCloud size={48} />
                        <p className="mt-2">Clique para enviar</p>
                        <p className="text-xs">PNG, JPG, GIF, MP4, MOV até 25MB</p>
                    </div>
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" />
            </div>

            <div>
                <label htmlFor="caption" className="block text-sm font-medium text-text-secondary mb-1">Legenda</label>
                <textarea
                    id="caption"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={4}
                    placeholder="Descreva sua postagem..."
                    className="w-full px-3 py-2 text-text-primary bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
                type="submit"
                disabled={isLoading || !file}
                className="w-full bg-accent text-white font-bold py-3 px-4 rounded-lg hover:bg-pink-600 transition-colors flex items-center justify-center disabled:bg-gray-600"
            >
                {isLoading ? <Loader2 size={20} className="animate-spin mr-2" /> : null}
                {isLoading ? 'Publicando...' : 'Publicar Postagem'}
            </button>
        </form>
    );
};

export default CreateFeedPostForm;