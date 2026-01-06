import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Plus, Minus, Download } from 'lucide-react';

const TableQRManager: React.FC = () => {
    const { ownedPlaceIds, getPlaceById } = useAppContext();
    const [selectedPlaceId, setSelectedPlaceId] = useState(ownedPlaceIds[0] || '');
    const [tableCount, setTableCount] = useState(5);

    const place = getPlaceById(selectedPlaceId);
    
    // URL base do app. O CrowdMatch usa hash router.
    const baseUrl = `${window.location.origin}/#/menu/${selectedPlaceId}`;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">QR Codes das Mesas</h1>
            
            <div className="bg-surface p-4 rounded-xl mb-8 space-y-4 no-print">
                <p className="text-sm text-text-secondary">Defina quantas mesas seu local possui para gerar os códigos.</p>
                <select 
                    value={selectedPlaceId}
                    onChange={(e) => setSelectedPlaceId(e.target.value)}
                    className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg"
                >
                    {ownedPlaceIds.map(id => (
                        <option key={id} value={id}>{getPlaceById(id)?.name}</option>
                    ))}
                </select>

                <div className="flex items-center space-x-4">
                    <span className="text-sm font-bold">Número de Mesas:</span>
                    <div className="flex items-center bg-gray-800 rounded-lg">
                        <button onClick={() => setTableCount(Math.max(1, tableCount - 1))} className="p-2"><Minus size={18} /></button>
                        <span className="px-4 font-bold">{tableCount}</span>
                        <button onClick={() => setTableCount(tableCount + 1)} className="p-2"><Plus size={18} /></button>
                    </div>
                </div>

                <button 
                    onClick={handlePrint}
                    className="w-full bg-primary text-background font-bold py-3 rounded-lg flex items-center justify-center"
                >
                    <Printer className="mr-2" /> Imprimir Todos os QRs
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 print:block">
                {Array.from({ length: tableCount }, (_, i) => i + 1).map(num => (
                    <div key={num} className="bg-white p-8 rounded-2xl flex flex-col items-center border-2 border-gray-200 shadow-xl break-inside-avoid mb-8">
                        <div className="text-black text-center mb-6">
                            <h2 className="text-3xl font-black mb-1">{place?.name}</h2>
                            <p className="text-xl font-bold text-accent uppercase tracking-widest">Cardápio Digital</p>
                        </div>
                        
                        <div className="p-4 bg-white border-4 border-black rounded-xl">
                            <QRCodeSVG value={`${baseUrl}/${num}`} size={200} />
                        </div>

                        <div className="mt-6 text-black text-center">
                            <p className="text-sm font-medium">Escaneie para fazer seu pedido</p>
                            <div className="bg-black text-white px-6 py-2 rounded-full mt-2 font-black text-2xl">
                                MESA {num}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TableQRManager;