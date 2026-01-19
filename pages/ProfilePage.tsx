import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { User, GENDERS, SEXUAL_ORIENTATIONS, MatchPreferences } from '../types';
import { Plus, X, Loader2, Camera, MapPin, LogOut, ChevronRight, Heart } from 'lucide-react';
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

    if (!user) return <LoadingSpinner message="Carregando perfil..." />;

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

    const handleSave = async () => {
        if (user) {
            setIsSaving(true);
            try {
                await updateUserProfile(user);
                alert("Perfil salvo com sucesso!");
            } catch (error: any) {
                alert(error.message || "Erro ao salvar.");
            } finally {
                setIsSaving(false);
            }
        }
    };

    return (
        <div className="min-h-full bg-white pb-20">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
            
            {/* Header / Top Info */}
            <div className="p-6 flex items-center space-x-6">
                <div className="relative group">
                    <img 
                        src={user.photos[0] || 'https://i.pravatar.cc/150'} 
                        className="w-24 h-24 rounded-full object-cover border border-border-subtle ring-4 ring-secondary" 
                        alt="Avatar"
                    />
                    <button className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full border-2 border-white">
                        <Camera size={14} />
                    </button>
                </div>
                <div className="flex-grow">
                    <h1 className="text-2xl font-black text-text-primary tracking-tighter">{user.name}, {user.age}</h1>
                    <p className="text-text-secondary text-sm font-medium flex items-center">
                        <MapPin size={12} className="mr-1" /> {user.city}, {user.state}
                    </p>
                    <div className="mt-2 flex space-x-4">
                        <div className="text-center">
                            <p className="text-sm font-black">12</p>
                            <p className="text-[10px] text-text-secondary uppercase font-bold tracking-widest">Matches</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-black">28</p>
                            <p className="text-[10px] text-text-secondary uppercase font-bold tracking-widest">Check-ins</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Photos Grid */}
            <div className="px-4 mb-8">
                <h3 className="text-[10px] font-black uppercase text-text-secondary mb-3 tracking-[0.2em]">Minhas Fotos</h3>
                <div className="grid grid-cols-3 gap-1">
                    {user.photos.map((photo, idx) => (
                        <div key={idx} className="relative aspect-square bg-secondary rounded-sm overflow-hidden">
                            <img src={photo} className="w-full h-full object-cover" alt={`Photo ${idx}`} />
                        </div>
                    ))}
                    {user.photos.length < 5 && (
                        <button className="aspect-square bg-secondary rounded-sm flex items-center justify-center text-text-secondary border border-dashed border-border-subtle hover:bg-border-subtle transition-colors">
                            <Plus size={24} />
                        </button>
                    )}
                </div>
            </div>

            {/* Form Sections */}
            <div className="px-4 space-y-8">
                <section>
                    <h3 className="text-[10px] font-black uppercase text-text-secondary mb-4 tracking-[0.2em]">Bio & Vibe</h3>
                    <textarea 
                        name="bio"
                        value={user.bio}
                        onChange={handleInputChange}
                        placeholder="Escreva algo sobre você..."
                        className="w-full bg-secondary p-4 rounded-2xl text-sm text-text-primary focus:ring-1 focus:ring-primary outline-none border border-transparent"
                        rows={3}
                    />
                </section>

                <section className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-text-secondary mb-4 tracking-[0.2em]">Informações Pessoais</h3>
                    
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-text-secondary uppercase ml-2">Nome Completo</label>
                        <input 
                            name="name"
                            value={user.name}
                            onChange={handleInputChange}
                            className="w-full bg-secondary px-4 py-3 rounded-xl text-sm font-bold border border-transparent"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-text-secondary uppercase ml-2">Idade</label>
                            <input 
                                type="number"
                                name="age"
                                value={user.age}
                                onChange={handleInputChange}
                                className="w-full bg-secondary px-4 py-3 rounded-xl text-sm font-bold"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-text-secondary uppercase ml-2">Gênero</label>
                            <select 
                                name="gender"
                                value={user.gender}
                                onChange={handleInputChange}
                                className="w-full bg-secondary px-4 py-3 rounded-xl text-sm font-bold appearance-none"
                            >
                                {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                    </div>
                </section>

                {/* Match Toggle */}
                <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center">
                        <Heart size={20} className="text-primary mr-3 fill-primary" />
                        <div>
                            <p className="text-sm font-black text-text-primary uppercase tracking-tighter">Match Mode</p>
                            <p className="text-[10px] text-text-secondary font-bold">Ficar visível nos locais para outras pessoas</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => updateUserProfile({ isAvailableForMatch: !user.isAvailableForMatch })}
                        className={`w-12 h-6 rounded-full relative transition-colors ${user.isAvailableForMatch ? 'bg-primary' : 'bg-border-subtle'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${user.isAvailableForMatch ? 'right-1' : 'left-1'}`} />
                    </button>
                </div>

                <div className="pt-6 space-y-3">
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full bg-text-primary text-white font-black py-4 rounded-2xl flex items-center justify-center shadow-xl active:scale-95 transition-all"
                    >
                        {isSaving ? <Loader2 size={20} className="animate-spin" /> : 'SALVAR ALTERAÇÕES'}
                    </button>

                    <button 
                        onClick={logout}
                        className="w-full bg-white border border-border-subtle text-text-primary font-black py-4 rounded-2xl flex items-center justify-center active:scale-95 transition-all"
                    >
                        <LogOut size={18} className="mr-2" /> SAIR DA CONTA
                    </button>

                    <button onClick={() => setIsDeleteModalOpen(true)} className="w-full py-4 text-red-500 font-black text-[10px] tracking-[0.2em] uppercase">
                        Excluir Minha Conta
                    </button>
                </div>
            </div>

            <DeleteAccountModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} />
        </div>
    );
};

export default ProfilePage;