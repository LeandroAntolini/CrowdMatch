import React from 'react';
import { X, Clock, Utensils, Send, CheckCircle2, User as UserIcon, Receipt } from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'react-hot-toast';

interface OwnerOrderDetailsModalProps {
    tableNumber: number;
    customerName: string;
    orders: Order[];
    onClose: () => void;
    onUpdate: () => void;
}

const OwnerOrderDetailsModal: React.FC<OwnerOrderDetailsModalProps> = ({ tableNumber, customerName, orders, onClose, onUpdate }) => {
    const totalConsumo = orders.reduce((sum, o) => sum + o.total_price, 0);

    const updateStatus = async (orderId: string, status: OrderStatus) => {
        const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
        if (error) {
            toast.error("Falha ao atualizar status.");
        } else {
            onUpdate();
        }
    };

    const finalizeAccount = async () => {
        if (!window.confirm(`Finalizar conta da Mesa ${tableNumber} - ${customerName}?`)) return;
        const ids = orders.map(o => o.id);
        const { error } = await supabase.from('orders').update({ status: 'paid' }).in('id', ids);
        if (!error) {
            toast.success("Conta finalizada!");
            onClose();
            onUpdate();
        }
    };

    const getStatusConfig = (status: OrderStatus) => {
        switch (status) {
            case 'pending': return { label: 'Recebido', color: 'bg-yellow-500', next: 'preparing', nextLabel: 'Preparar' };
            case 'preparing': return { label: 'Preparando', color: 'bg-blue-500', next: 'delivering', nextLabel: 'Indo para a mesa' };
            case 'delivering': return { label: 'Indo para a mesa', color: 'bg-orange-500', next: 'delivered', nextLabel: 'Na mesa' };
            case 'delivered': return { label: 'Na mesa', color: 'bg-green-500', next: 'paid', nextLabel: 'Finalizar' };
            default: return { label: status, color: 'bg-gray-500' };
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[150] flex items-center justify-center p-4">
            <div className="bg-surface w-full max-w-md rounded-2xl flex flex-col max-h-[90vh] overflow-hidden">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
                    <div className="flex items-center">
                        <div className="bg-primary text-background font-black px-3 py-1 rounded-lg mr-3">MESA {tableNumber}</div>
                        <h2 className="font-bold text-lg">{customerName}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full"><X size={24} /></button>
                </div>

                <div className="flex-grow overflow-y-auto p-4 space-y-6">
                    {orders.map((order, idx) => (
                        <div key={order.id} className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-[10px] font-bold text-gray-500 uppercase">PEDIDO #{orders.length - idx}</span>
                                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${getStatusConfig(order.status).color} text-white`}>
                                    {getStatusConfig(order.status).label}
                                </span>
                            </div>

                            <div className="space-y-2 mb-4">
                                {order.order_items?.map(item => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                        <span className="text-text-secondary font-medium">{item.quantity}x {item.menu_item?.name}</span>
                                        <span className="font-bold">R$ {(item.quantity * item.unit_price).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                {order.status !== 'paid' && order.status !== 'delivered' && (
                                    <button 
                                        onClick={() => updateStatus(order.id, getStatusConfig(order.status).next as OrderStatus)}
                                        className="flex-1 bg-accent text-white font-bold py-2 rounded-lg text-xs uppercase"
                                    >
                                        {getStatusConfig(order.status).nextLabel}
                                    </button>
                                )}
                                {order.status === 'delivered' && (
                                    <button 
                                        onClick={() => updateStatus(order.id, 'paid')}
                                        className="flex-1 bg-green-600 text-white font-bold py-2 rounded-lg text-xs uppercase"
                                    >
                                        Marcar como Pago
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-6 bg-gray-900 border-t border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <span className="font-bold text-text-secondary">Subtotal Mesa</span>
                        <span className="text-2xl font-black text-primary">R$ {totalConsumo.toFixed(2)}</span>
                    </div>
                    <button 
                        onClick={finalizeAccount}
                        className="w-full bg-primary text-background font-black py-4 rounded-xl flex items-center justify-center hover:bg-primary/90 transition-all"
                    >
                        <Receipt size={20} className="mr-2" />
                        FECHAR CONTA E FINALIZAR
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OwnerOrderDetailsModal;