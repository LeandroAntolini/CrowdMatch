import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { MenuItem, Order } from '../types';
import { Utensils, ShoppingBag, Plus, Minus, ChevronLeft, Loader2, QrCode, Receipt, Info } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';
import QuickSignUpForm from '../components/QuickSignUpForm';
import ComandaOverlay from '../components/ComandaOverlay';
import { toast } from 'react-hot-toast';

const MenuPage: React.FC = () => {
  const { placeId, tableNumber } = useParams<{ placeId: string; tableNumber: string }>();
  const navigate = useNavigate();
  const { getPlaceById, isAuthenticated, checkInUser, currentUser } = useAppContext();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [isComandaOpen, setIsComandaOpen] = useState(false);

  const place = useMemo(() => (placeId ? getPlaceById(placeId) : null), [placeId, getPlaceById]);
  const isPlaceOpen = place?.isOpen ?? true;

  const isNightlife =
    place?.category === 'Boate' || place?.category === 'Casa de Shows' || place?.category === 'Espaço Musical';
  const labelSingular = isNightlife ? 'Comanda' : 'Mesa';

  const fetchOrders = useCallback(async () => {
    if (!placeId) return;
    try {
      let query = supabase
        .from('orders')
        .select('*, order_items(*, menu_items(*))')
        .eq('place_id', placeId)
        .order('created_at', { ascending: false });

      if (tableNumber) {
        query = query.eq('table_number', parseInt(tableNumber, 10));
      } else if (currentUser?.id) {
        query = query.eq('user_id', currentUser.id);
      } else {
        setUserOrders([]);
        return;
      }

      const { data, error } = await query;
      if (error) throw error;
      setUserOrders((data as unknown as Order[]) || []);
    } catch (e: any) {
      console.error('Erro ao buscar pedidos:', e);
    }
  }, [placeId, tableNumber, currentUser?.id]);

  // Efeito para carregar itens do cardápio
  useEffect(() => {
    if (!placeId) return;
    const fetchMenu = async () => {
        const { data } = await supabase.from('menu_items').select('*').eq('place_id', placeId).eq('is_available', true);
        setMenuItems(data || []);
        setLoading(false);
    };
    fetchMenu();
  }, [placeId]);

  // EFEITO CRÍTICO: Registra ocupação da mesa e faz check-in assim que o usuário estiver logado
  useEffect(() => {
    if (isAuthenticated && currentUser && placeId && tableNumber) {
        const registerTableOccupation = async () => {
            try {
                // 1. Garante o check-in (para aparecer na lotação)
                await checkInUser(placeId);
                
                // 2. Registra o usuário na mesa (para o lojista ver como 'Ativa')
                await supabase.from('tables').upsert({ 
                    place_id: placeId, 
                    table_number: parseInt(tableNumber, 10), 
                    current_user_id: currentUser.id, 
                    last_activity: new Date().toISOString() 
                }, { onConflict: 'place_id,table_number' });
                
                console.log("Mesa registrada com sucesso.");
                fetchOrders(); // Carrega pedidos existentes desta mesa/sessão
            } catch (err) {
                console.error("Erro ao registrar ocupação:", err);
            }
        };
        registerTableOccupation();
    } else if (isAuthenticated && currentUser && placeId) {
        fetchOrders();
    }
  }, [isAuthenticated, currentUser, placeId, tableNumber, checkInUser, fetchOrders]);

  const addToCart = (id: string) => {
    if (!isPlaceOpen) return toast.error('Local fechado.');
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromCart = (id: string) =>
    setCart((prev) => {
      const next = { ...prev };
      if (next[id] > 1) next[id]--;
      else delete next[id];
      return next;
    });

  const cartTotal = useMemo(() => {
    return Object.entries(cart).reduce((total, [id, qty]) => {
      const item = menuItems.find((i) => i.id === id);
      return total + (item?.price || 0) * qty;
    }, 0);
  }, [cart, menuItems]);

  const handlePlaceOrder = async () => {
    if (!placeId || !tableNumber || !currentUser?.id) return;
    setOrdering(true);
    try {
      const { data: orderData, error: orderError } = await supabase.from('orders').insert({
          place_id: placeId, user_id: currentUser.id, table_number: parseInt(tableNumber, 10),
          total_price: cartTotal, status: 'pending',
      }).select().single();

      if (orderError) throw orderError;

      const itemsToInsert = Object.entries(cart).map(([itemId, qty]) => ({
          order_id: orderData.id, menu_item_id: itemId, quantity: qty,
          unit_price: menuItems.find((i) => i.id === itemId)?.price || 0,
      }));

      await supabase.from('order_items').insert(itemsToInsert);
      toast.success('Pedido enviado!');
      setCart({});
      await fetchOrders();
    } catch (error: any) {
      toast.error('Erro ao enviar pedido.');
    } finally {
      setOrdering(false);
    }
  };

  if (loading) return <LoadingSpinner message="Preparando o cardápio..." />;

  if (!isAuthenticated && tableNumber)
    return (
      <div className="h-screen bg-white p-8 flex flex-col justify-center max-w-sm mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-text-primary tracking-tighter italic mb-4">CrowdMatch</h1>
          <p className="text-text-secondary font-medium">Você está na <strong>{labelSingular} {tableNumber}</strong>.</p>
          <p className="text-xs text-text-secondary mt-2">Identifique-se para começar a pedir.</p>
        </div>
        <QuickSignUpForm onSuccess={() => {}} />
      </div>
    );

  const categories = Array.from(new Set(menuItems.map((i) => i.category)));

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="p-4 bg-white border-b border-border-subtle sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="mr-2 p-2 hover:bg-secondary rounded-full"><ChevronLeft size={24} /></button>
          <div>
            <h1 className="text-lg font-black text-text-primary tracking-tighter leading-tight">{place?.name}</h1>
            <p className="text-[10px] text-accent font-black uppercase tracking-widest">{tableNumber ? `${labelSingular} ${tableNumber}` : 'Cardápio Digital'}</p>
          </div>
        </div>
        <button onClick={() => setIsComandaOpen(true)} className="p-3 bg-secondary rounded-2xl relative">
          <Receipt size={22} className="text-text-primary" />
          {userOrders.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-[10px] font-black text-white flex items-center justify-center rounded-full border-2 border-white">{userOrders.length}</span>}
        </button>
      </header>

      <div className="flex-grow overflow-y-auto p-4 pb-40">
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
                      {tableNumber && (
                        <div className="flex items-center bg-secondary rounded-xl p-1 border border-border-subtle">
                          {cart[item.id] && (
                            <div className="flex items-center">
                              <button onClick={() => removeFromCart(item.id)} className="p-1.5 text-text-primary"><Minus size={14} /></button>
                              <span className="px-3 text-xs font-black">{cart[item.id]}</span>
                            </div>
                          )}
                          <button onClick={() => addToCart(item.id)} className="p-1.5 text-primary"><Plus size={14} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {cartTotal > 0 && (
        <div className="fixed bottom-6 left-4 right-4 bg-text-primary p-5 rounded-3xl shadow-2xl z-[60] animate-fade-in-up">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Meu Carrinho</p>
              <p className="text-2xl font-black text-white">R$ {cartTotal.toFixed(2)}</p>
            </div>
            <div className="bg-white/10 px-3 py-1 rounded-lg text-[10px] font-black text-white uppercase">{Object.values(cart).reduce((a, b) => a + b, 0)} Itens</div>
          </div>
          <button onClick={handlePlaceOrder} disabled={ordering} className="w-full bg-white text-text-primary font-black py-4 rounded-2xl flex items-center justify-center uppercase tracking-widest text-xs active:scale-95 transition-transform">
            {ordering ? <Loader2 size={20} className="animate-spin" /> : 'Confirmar Pedido'}
          </button>
        </div>
      )}

      <ComandaOverlay isOpen={isComandaOpen} onClose={() => setIsComandaOpen(false)} orders={userOrders} />
    </div>
  );
};

export default MenuPage;