import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { MenuItem } from '../types';
import { Utensils, ChevronLeft } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';

const MenuPage: React.FC = () => {
  const { placeId, tableNumber } = useParams<{ placeId: string; tableNumber: string }>();
  const navigate = useNavigate();
  const { getPlaceById } = useAppContext();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const place = useMemo(() => (placeId ? getPlaceById(placeId) : null), [placeId, getPlaceById]);

  useEffect(() => {
    if (!placeId) return;
    const fetchMenu = async () => {
        const { data } = await supabase.from('menu_items').select('*').eq('place_id', placeId).eq('is_available', true);
        setMenuItems(data || []);
        setLoading(false);
    };
    fetchMenu();
  }, [placeId]);

  if (loading) return <LoadingSpinner message="Abrindo o cardápio..." />;

  const categories = Array.from(new Set(menuItems.map((i) => i.category)));

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="p-4 bg-white border-b border-border-subtle sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="mr-2 p-2 hover:bg-secondary rounded-full"><ChevronLeft size={24} /></button>
          <div>
            <h1 className="text-lg font-black text-text-primary tracking-tighter leading-tight">{place?.name}</h1>
            <p className="text-[10px] text-accent font-black uppercase tracking-widest">Cardápio Digital</p>
          </div>
        </div>
      </header>

      <div className="flex-grow overflow-y-auto p-4 pb-10">
        {categories.length === 0 ? (
            <div className="text-center py-20 opacity-30">
                <Utensils size={48} className="mx-auto mb-4" />
                <p>Nenhum item disponível no momento.</p>
            </div>
        ) : categories.map((cat) => (
          <section key={cat} className="mb-10 animate-fade-in-up">
            <h2 className="text-xs font-black uppercase text-text-primary mb-5 tracking-[0.2em] flex items-center">
              <span className="w-8 h-px bg-border-subtle mr-3"></span> {cat}
            </h2>
            <div className="space-y-6">
              {menuItems.filter((i) => i.category === cat).map((item) => (
                <div key={item.id} className="flex items-start space-x-4">
                  <div className="relative flex-shrink-0">
                    <img src={item.image_url || 'https://picsum.photos/seed/food/100/100'} className="w-20 h-20 rounded-2xl object-cover border border-border-subtle shadow-sm" alt={item.name} />
                  </div>
                  <div className="flex-grow min-w-0">
                    <h3 className="font-bold text-sm text-text-primary mb-1">{item.name}</h3>
                    <p className="text-[10px] text-text-secondary leading-relaxed mb-2 line-clamp-2">{item.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-base font-black text-text-primary tracking-tight">R$ {item.price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default MenuPage;