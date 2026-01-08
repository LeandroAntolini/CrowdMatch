import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Minus, FileText, Loader2, Save } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'react-hot-toast';

const TableQRManager: React.FC = () => {
    const { ownedPlaceIds, getPlaceById } = useAppContext();
    const [selectedPlaceId, setSelectedPlaceId] = useState('');
    const [tableCount, setTableCount] = useState(5);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const qrContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (ownedPlaceIds.length > 0 && !selectedPlaceId) {
            setSelectedPlaceId(ownedPlaceIds[0]);
        }
    }, [ownedPlaceIds, selectedPlaceId]);

    const place = getPlaceById(selectedPlaceId);
    const baseUrl = `${window.location.origin}/#/menu/${selectedPlaceId}`;

    const initializeTables = async () => {
        if (!selectedPlaceId) {
            toast.error("Selecione um estabelecimento.");
            return;
        }
        setIsSaving(true);
        try {
            const tableRecords = Array.from({ length: tableCount }, (_, i) => ({
                place_id: selectedPlaceId,
                table_number: i + 1,
            }));

            const { error } = await supabase
                .from('tables')
                .upsert(tableRecords, { onConflict: 'place_id,table_number' });

            if (error) throw error;
            toast.success(`${tableCount} mesas inicializadas no sistema!`);
        } catch (error: any) {
            toast.error("Erro ao salvar mesas: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const generatePDF = async () => {
        if (!qrContainerRef.current || !place) return;
        setIsGenerating(true);
        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const elements = qrContainerRef.current.children;
            const targetWidth = 100; 

            for (let i = 0; i < elements.length; i++) {
                const element = elements[i] as HTMLElement;
                const canvas = await html2canvas(element, {
                    scale: 3, 
                    useCORS: true,
                    backgroundColor: '#ffffff',
                });
                
                const imgData = canvas.toDataURL('image/png');
                const pdfPageWidth = pdf.internal.pageSize.getWidth();
                const pdfPageHeight = pdf.internal.pageSize.getHeight();
                const targetHeight = (canvas.height * targetWidth) / canvas.width;
                
                if (i > 0) pdf.addPage();
                const xPos = (pdfPageWidth - targetWidth) / 2;
                const yPos = (pdfPageHeight - targetHeight) / 2;
                pdf.addImage(imgData, 'PNG', xPos, yPos, targetWidth, targetHeight);
            }
            pdf.save(`QRCodes_${place.name.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            toast.error("Erro ao gerar PDF.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">QR Codes das Mesas</h1>
            
            <div className="bg-surface p-4 rounded-xl mb-8 space-y-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-text-secondary uppercase">Estabelecimento</label>
                    <select 
                        value={selectedPlaceId}
                        onChange={(e) => setSelectedPlaceId(e.target.value)}
                        className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg"
                    >
                        <option value="" disabled>Selecione um local</option>
                        {ownedPlaceIds.map(id => (
                            <option key={id} value={id}>{getPlaceById(id)?.name || id}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">Número de Mesas:</span>
                    <div className="flex items-center bg-gray-800 rounded-lg">
                        <button onClick={() => setTableCount(Math.max(1, tableCount - 1))} className="p-2 text-primary hover:bg-gray-700 rounded-l-lg transition-colors">
                            <Plus size={18} className="rotate-45" />
                        </button>
                        <span className="px-6 font-bold text-lg">{tableCount}</span>
                        <button onClick={() => setTableCount(tableCount + 1)} className="p-2 text-primary hover:bg-gray-700 rounded-r-lg transition-colors">
                            <Plus size={18} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={initializeTables}
                        disabled={isSaving || !selectedPlaceId}
                        className="bg-gray-700 text-white font-bold py-3 rounded-xl flex items-center justify-center hover:bg-gray-600 transition-all disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="animate-spin" /> : <Save className="mr-2" size={18} />}
                        Configurar Mesas
                    </button>
                    <button 
                        onClick={generatePDF}
                        disabled={isGenerating || !selectedPlaceId}
                        className="bg-primary text-background font-bold py-3 rounded-xl flex items-center justify-center hover:bg-primary/90 transition-all disabled:opacity-50"
                    >
                        {isGenerating ? <Loader2 className="animate-spin" /> : <FileText className="mr-2" size={18} />} 
                        Gerar PDF
                    </button>
                </div>
            </div>

            <h2 className="text-sm font-bold text-text-secondary uppercase mb-4">Pré-visualização</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" ref={qrContainerRef}>
                {Array.from({ length: tableCount }, (_, i) => i + 1).map(num => (
                    <div 
                        key={num} 
                        className="bg-white p-6 rounded-xl flex flex-col items-center border border-gray-200 shadow-sm text-black w-full max-w-[280px] mx-auto overflow-hidden"
                    >
                        <div className="text-center mb-4 w-full">
                            <h2 className="text-xl font-black mb-1 leading-tight break-words">{place?.name || 'Local'}</h2>
                            <div className="h-0.5 w-16 mx-auto mb-2" style={{ backgroundColor: '#EC4899' }}></div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Cardápio Digital</p>
                        </div>
                        <div className="p-3 bg-white border-2 border-black rounded-xl">
                            <QRCodeSVG value={`${baseUrl}/${num}`} size={140} level="H" />
                        </div>
                        <div className="mt-4 text-center w-full">
                            <p className="text-[9px] font-medium text-gray-400 mb-2">Escaneie para pedir</p>
                            <div className="bg-black text-white px-5 py-1.5 rounded-lg inline-block font-black text-xl">
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