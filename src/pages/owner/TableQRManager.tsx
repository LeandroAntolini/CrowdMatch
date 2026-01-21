import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Minus, FileText, Loader2, Save, ChevronLeft } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const TableQRManager: React.FC = () => {
    const { activeOwnedPlaceId, getPlaceById } = useAppContext();
    const [tableCount, setTableCount] = useState(5);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const qrContainerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const place = activeOwnedPlaceId ? getPlaceById(activeOwnedPlaceId) : null;
    const baseUrl = `${window.location.origin}/#/menu/${activeOwnedPlaceId}`;

    const isNightlife = place?.category === 'Boate' || place?.category === 'Casa de Shows' || place?.category === 'Espaço Musical';
    const labelSingular = isNightlife ? 'Comanda' : 'Mesa';
    const labelPlural = isNightlife ? 'Comandas' : 'Mesas';

    const initializeTables = async () => {
        if (!activeOwnedPlaceId) return;
        setIsSaving(true);
        try {
            const tableRecords = Array.from({ length: tableCount }, (_, i) => ({
                place_id: activeOwnedPlaceId,
                table_number: i + 1,
            }));

            const { error } = await supabase
                .from('tables')
                .upsert(tableRecords, { onConflict: 'place_id,table_number' });

            if (error) throw error;
            toast.success(`Estrutura de ${tableCount} ${labelPlural.toLowerCase()} configurada!`);
        } catch (error: any) {
            toast.error("Erro ao configurar.");
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
            toast.success("PDF gerado com sucesso!");
        } catch (error) {
            toast.error("Erro ao gerar PDF.");
        } finally {
            setIsGenerating(false);
        }
    };

    if (!activeOwnedPlaceId) return <div className="p-10 text-center opacity-50">Selecione um local no topo.</div>;

    return (
        <div className="p-6 space-y-8 bg-white min-h-full pb-24">
            <header className="flex items-center px-1">
                <button onClick={() => navigate(-1)} className="mr-4 p-2 bg-secondary rounded-full"><ChevronLeft size={24} /></button>
                <div>
                    <h1 className="text-2xl font-black text-text-primary uppercase tracking-tighter">Gerador de QR Codes</h1>
                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] mt-1">{place?.name}</p>
                </div>
            </header>
            
            <div className="bg-secondary p-6 rounded-3xl border border-border-subtle space-y-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-xs font-black uppercase tracking-widest text-text-primary">Quantidade de {labelPlural}:</span>
                        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-1">Defina o número total no local</p>
                    </div>
                    <div className="flex items-center bg-white rounded-2xl border border-border-subtle p-1 shadow-sm">
                        <button onClick={() => setTableCount(Math.max(1, tableCount - 1))} className="p-3 text-primary hover:bg-secondary rounded-xl transition-colors">
                            <Minus size={20} />
                        </button>
                        <span className="px-6 font-black text-xl text-text-primary">{tableCount}</span>
                        <button onClick={() => setTableCount(tableCount + 1)} className="p-3 text-primary hover:bg-secondary rounded-xl transition-colors">
                            <Plus size={20} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={initializeTables}
                        disabled={isSaving}
                        className="bg-white text-text-primary border border-border-subtle font-black py-4 rounded-2xl flex items-center justify-center uppercase tracking-widest text-[10px] active:scale-95 transition-all shadow-sm"
                    >
                        {isSaving ? <Loader2 className="animate-spin" /> : <Save className="mr-2" size={16} />}
                        Salvar Layout
                    </button>
                    <button 
                        onClick={generatePDF}
                        disabled={isGenerating}
                        className="bg-text-primary text-white font-black py-4 rounded-2xl flex items-center justify-center uppercase tracking-widest text-[10px] active:scale-95 transition-all shadow-xl"
                    >
                        {isGenerating ? <Loader2 className="animate-spin" /> : <FileText className="mr-2" size={16} />} 
                        Baixar PDF
                    </button>
                </div>
            </div>

            <div>
                <h3 className="text-[10px] font-black uppercase text-text-secondary tracking-[0.2em] mb-6 px-1">Pré-visualização da Impressão</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" ref={qrContainerRef}>
                    {Array.from({ length: tableCount }, (_, i) => i + 1).map(num => (
                        <div key={num} className="bg-white p-8 rounded-3xl flex flex-col items-center border border-border-subtle shadow-lg text-black w-full max-w-[280px] mx-auto animate-fade-in-up">
                            <div className="text-center mb-6 w-full">
                                <h2 className="text-xl font-black mb-1 leading-tight tracking-tighter">{place?.name || 'Local'}</h2>
                                <div className="h-0.5 w-12 bg-accent mx-auto mb-2"></div>
                                <p className="text-[9px] font-black text-text-secondary uppercase tracking-[0.3em]">Cardápio Digital</p>
                            </div>
                            <div className="p-4 bg-white border-2 border-text-primary rounded-3xl shadow-inner">
                                <QRCodeSVG value={`${baseUrl}/${num}`} size={160} level="H" />
                            </div>
                            <div className="mt-8 text-center w-full">
                                <p className="text-[9px] font-bold text-text-secondary mb-3 uppercase tracking-widest opacity-50">Escaneie para fazer seu pedido</p>
                                <div className="bg-text-primary text-white px-8 py-3 rounded-2xl inline-block font-black text-2xl tracking-tighter shadow-xl">
                                    {labelSingular} {num}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TableQRManager;