import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { User, GENDERS, SEXUAL_ORIENTATIONS, MatchPreferences } from '../types';
import { Plus, X, Loader2 } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { brazilianStates, citiesByState } from '../data/locations';
import { supabase } from '@/integrations/supabase/client';
import DeleteAccountModal from '../components/DeleteAccountModal';

const ProfilePage: React.FC = () => {
    const { currentUser, updateUserProfile, logout } = useAppContext();
    const [user, setUser] = useState<User | null>(null);
    const [availableCities, setAvailableCities] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (currentUser) {
            const userCopy = JSON.parse(JSON.stringify(currentUser));
            if (!userCopy.matchPreferences) {
                userCopy.matchPreferences = { genders: [], sexualOrientations: [] };
            }
            setUser(userCopy);
            if (userCopy.state) {
                setAvailableCities(citiesByState[userCopy.state] || []);
            }
        }
    }, [currentUser]);

    if (!user) {
        return <LoadingSpinner message="Carregando perfil..." />;
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setUser(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newState = e.target.value;
        const newCities = citiesByState[newState] || [];
        setAvailableCities(newCities);
        setUser(prev => prev ? { ...prev, state: newState, city: newCities[0] || '' } : null);
    };

    const handlePreferenceChange = (category: keyof MatchPreferences, value: string) => {
        setUser(prevUser => {
            if (!prevUser) return null;
            const currentPrefs = prevUser.matchPreferences[category];
            const newPrefs = currentPrefs.includes(value) ? currentPrefs.filter(item => item !== value) : [...currentPrefs, value];
            return { ...prevUser, matchPreferences: { ...prevUser.matchPreferences, [category]: newPrefs } };
        });
    };
    
    const handleToggleAvailability = () => {
        setUser(prev => prev ? { ...prev, isAvailableForMatch: !prev.isAvailableForMatch } : null);
    };

    const handleSave = async () => {
        if (user) {
            setIsSaving(true);
            const result = await updateUserProfile(user);
            setIsSaving(false);
            if (result.success) {
                alert("Perfil salvo com sucesso!");
            } else {
                alert(`Erro ao salvar o perfil: ${result.error?.message || 'Tente novamente.'}`);
            }
        }
    };

    const handleSetMainPhoto = async (indexToMakeMain: number) => {
        if (!user || indexToMakeMain < 0 || indexToMakeMain >= user.photos.length) return;

        const newPhotos = [...user.photos];
        const [selectedPhoto] = newPhotos.splice(indexToMakeMain, 1);
        newPhotos.unshift(selectedPhoto);
        
        setUser({ ...user, photos: newPhotos });
        await updateUserProfile({ photos: newPhotos });
    };

    const handleDeletePhoto = async (indexToDelete: number) => {
        if (!user) return;

        if (user.photos.length <= 1) {
            alert("Você precisa ter pelo menos uma foto.");
            return;
        }

        const photoUrlToDelete = user.photos[indexToDelete];
        const newPhotos = user.photos.filter((_, i) => i !== indexToDelete);

        const originalUser = { ...user };
        setUser({ ...user, photos: newPhotos });

        try {
            const url = new URL(photoUrlToDelete);
            const pathParts = url.pathname.split('/profile-photos/');
            const filePath = pathParts.length > 1 ? pathParts[1] : null;
            
            if (filePath) {
                const { error: removeError } = await supabase.storage
                    .from('profile-photos')
                    .remove([filePath]);

                if (removeError) {
                    throw new Error(removeError.message);
                }
            }

            await updateUserProfile({ photos: newPhotos });

        } catch (error: any) {
            console.error("Error deleting photo:", error);
            alert(`Não foi possível excluir a foto: ${error.message}`);
            setUser(originalUser);
        }
    };

    const handleAddPhotoClick = () => {
        if (user && user.photos.length >= 5) {
            alert("Você pode enviar no máximo 5 fotos.");
            return;
        }
        fileInputRef.current?.click();
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !currentUser || !user) return;

        const file = e.target.files[0];
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecione um arquivo de imagem.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert('O arquivo é muito grande. O limite é de 5MB.');
            return;
        }

        const fileExt = file.name.split('.').pop();
        const filePath = `${currentUser.id}/${Date.now()}.${fileExt}`;

        setIsUploading(true);

        const { error: uploadError } = await supabase.storage
            .from('profile-photos')
            .upload(filePath, file);

        if (uploadError) {
            console.error('Error uploading file:', uploadError);
            alert(`Erro ao enviar a foto: ${uploadError.message}.`);
            setIsUploading(false);
            return;
        }

        const { data } = supabase.storage.from('profile-photos').getPublicUrl(filePath);
        setIsUploading(false);

        if (data?.publicUrl) {
            const newPhotos = [...user.photos, data.publicUrl];
            setUser({ ...user, photos: newPhotos });
            
            await updateUserProfile({ photos: newPhotos });
            alert("Foto enviada e perfil atualizado com sucesso!");
        } else {
             alert("Erro ao obter o URL público da foto.");
        }
        if (e.target) e.target.value = '';
    };

    return (
        <div className="p-4 space-y-6">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/png, image/jpeg" disabled={isUploading} />
            <div className="space-y-3">
                 <div className="relative w-full aspect-[4/5] bg-surface rounded-xl overflow-hidden shadow-lg">
                    <img src={user.photos[0]} alt="Foto principal do perfil" className="w-full h-full object-cover" />
                     <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
                        <h1 className="text-3xl font-bold">{user.name}, {user.age}</h1>
                        <p className="text-sm opacity-90">{user.email}</p>
                    </div>
                </div>
                <div className="grid grid-cols-5 gap-2">
                     {user.photos.map((photo, index) => (
                        <div key={photo + index} className="relative aspect-square group">
                            <img src={photo} alt={`Miniatura ${index + 1}`} onClick={() => handleSetMainPhoto(index)} className={`w-full h-full object-cover rounded-lg cursor-pointer transition-all duration-200 ${index === 0 ? 'ring-2 ring-accent ring-offset-2 ring-offset-background' : 'opacity-75 hover:opacity-100'}`} />
                            {user.photos.length > 1 && (
                                <button onClick={(e) => { e.stopPropagation(); handleDeletePhoto(index); }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100" aria-label={`Excluir foto ${index + 1}`}><X size={12} /></button>
                            )}
                        </div>
                    ))}
                    {user.photos.length < 5 && (
                        <button onClick={handleAddPhotoClick} disabled={isUploading} className="aspect-square bg-surface rounded-lg flex items-center justify-center text-text-secondary disabled:opacity-50" aria-label="Adicionar nova foto">
                            {isUploading ? <Loader2 size={24} className="animate-spin" /> : <Plus size={24} />}
                        </button>
                    )}
                </div>
            </div>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-text-secondary">Nome</label>
                    <input type="text" name="name" value={user.name} onChange={handleInputChange} className="mt-1 w-full px-3 py-2 text-text-primary bg-surface border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <div className="flex gap-4">
                    <div className="w-1/2">
                        <label className="block text-sm font-medium text-text-secondary">Idade</label>
                        <input type="number" name="age" value={user.age} onChange={handleInputChange} className="mt-1 w-full px-3 py-2 text-text-primary bg-surface border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" />
                    </div>
                    <div className="w-1/2">
                        <label className="block text-sm font-medium text-text-secondary">Gênero</label>
                        <select name="gender" value={user.gender} onChange={handleInputChange} className="mt-1 w-full px-3 py-2 text-text-primary bg-surface border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent">
                            {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary">Bio</label>
                    <textarea name="bio" value={user.bio} onChange={handleInputChange} rows={3} className="mt-1 w-full px-3 py-2 text-text-primary bg-surface border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <div className="flex gap-4">
                    <div className="w-1/2">
                        <label className="block text-sm font-medium text-text-secondary">Estado</label>
                        <select name="state" value={user.state || ''} onChange={handleStateChange} className="mt-1 w-full px-3 py-2 text-text-primary bg-surface border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent">
                            <option value="">Selecione...</option>
                            {brazilianStates.map(s => <option key={s.abbr} value={s.abbr}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="w-1/2">
                        <label className="block text-sm font-medium text-text-secondary">Cidade</label>
                        <select name="city" value={user.city || ''} onChange={handleInputChange} disabled={!user.state} className="mt-1 w-full px-3 py-2 text-text-primary bg-surface border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent disabled:bg-gray-800">
                            <option value="">Selecione...</option>
                            {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary">Orientação Sexual</label>
                    <select name="sexualOrientation" value={user.sexualOrientation} onChange={handleInputChange} className="mt-1 w-full px-3 py-2 text-text-primary bg-surface border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent">
                        {SEXUAL_ORIENTATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-text-secondary">Interesses (separados por vírgula)</label>
                    <input type="text" value={user.interests.join(', ')} onChange={(e) => setUser(prev => prev ? { ...prev, interests: e.target.value.split(',').map(s => s.trim()) } : null)} className="mt-1 w-full px-3 py-2 text-text-primary bg-surface border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
            </div>

            <div className="space-y-4 p-4 bg-surface rounded-lg">
                <h2 className="font-semibold text-text-primary">Quem você quer encontrar?</h2>
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Gênero</label>
                    <div className="flex flex-wrap gap-2">
                        {GENDERS.map(gender => (
                            <label key={gender} className="flex items-center space-x-2">
                                <input type="checkbox" checked={user.matchPreferences.genders.includes(gender)} onChange={() => handlePreferenceChange('genders', gender)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-accent focus:ring-accent" />
                                <span>{gender}</span>
                            </label>
                        ))}
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Orientação Sexual</label>
                    <div className="flex flex-wrap gap-2">
                        {SEXUAL_ORIENTATIONS.map(orientation => (
                            <label key={orientation} className="flex items-center space-x-2">
                                <input type="checkbox" checked={user.matchPreferences.sexualOrientations.includes(orientation)} onChange={() => handlePreferenceChange('sexualOrientations', orientation)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-accent focus:ring-accent" />
                                <span>{orientation}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between bg-surface p-3 rounded-lg">
                <span id="availability-label" className="font-medium">Disponível para Match</span>
                <button onClick={handleToggleAvailability} role="switch" aria-checked={user.isAvailableForMatch} aria-labelledby="availability-label" className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${user.isAvailableForMatch ? 'bg-accent' : 'bg-gray-600'}`}>
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${user.isAvailableForMatch ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>
            
            <div className="space-y-2">
                <button onClick={handleSave} disabled={isSaving} className="w-full bg-accent text-white font-bold py-3 px-4 rounded-lg hover:bg-pink-600 flex items-center justify-center disabled:bg-gray-600">
                    {isSaving ? <Loader2 size={20} className="animate-spin" /> : 'Salvar Alterações'}
                </button>
                <button onClick={logout} className="w-full bg-surface text-text-primary font-bold py-3 px-4 rounded-lg hover:bg-gray-700">Sair</button>
                <button onClick={() => setIsDeleteModalOpen(true)} className="w-full text-red-500 text-sm mt-2">Excluir Conta</button>
            </div>
            
            <DeleteAccountModal 
                isOpen={isDeleteModalOpen} 
                onClose={() => setIsDeleteModalOpen(false)} 
            />
        </div>
    );
};

export default ProfilePage;