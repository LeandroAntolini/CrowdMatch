import React, { useState, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Minus, FileText, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const TableQRManager: React.FC = () => {
    const { ownedPlaceIds, getPlaceById } = useAppContext();
    const [selectedPlaceId, setSelectedPlaceId] = useState(ownedPlaceIds[0] || '');
    const [tableCount, setTableCount] = useState(5);
    const [isGenerating, setIsGenerating] = useState(false);
    const qrContainerRef = useRef<HTMLDivElement>(null);

    const place = getPlaceById(selectedPlaceId);
    
    // URL base do app. O CrowdMatch usa hash router.
    const baseUrl = `${window.location.origin}/#/menu/${selectedPlaceId}`;

    const generatePDF = async () => {
        if (!qrContainerRef.current || !place) return;
        
        setIsGenerating(true);
        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const elements = qrContainerRef.current.children;
            
            // Definimos um tamanho padrão de 100mm (10cm) para o card no PDF
            const targetWidth = 100; 

            for (let i = 0; i < elements.length; i++) {
                const element = elements[i] as HTMLElement;
                const canvas = await html2canvas(element, {
                    scale: 4, // Alta densidade de pixels para impressão nítida
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff'
                });
                
                const imgData = canvas.toDataURL('image/png');
                const pdfPageWidth = pdf.internal.pageSize.getWidth();
                const pdfPageHeight = pdf.internal.pageSize.getHeight();
                
                // Calcula a altura proporcional ao targetWidth (100mm)
                const targetHeight = (canvas.height * targetWidth) / canvas.width;
                
                if (i > 0) pdf.addPage();
                
                // Centraliza o card de 10cm na página A4
                const xPos = (pdfPageWidth - targetWidth) / 2;
                const yPos = (pdfPageHeight - targetHeight) / 2;
                
                pdf.addImage(imgData, 'PNG', xPos, yPos, targetWidth, targetHeight);
            }
            
            pdf.save(`QRCodes_${place.name.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            alert("Erro ao gerar o arquivo. Tente novamente.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">QR Codes das Mesas</h1>
            
            <div className="bg-surface p-4 rounded-xl mb-8 space-y-4">
                <p className="text-sm text-text-secondary">Gere um PDF com QR Codes de 10cm, perfeitos para displays de mesa.</p>
                
                <div className="space-y-2">
                    <label className="text-xs font-bold text-text-secondary uppercase">Estabelecimento</label>
                    <select 
                        value={selectedPlaceId}
                        onChange={(e) => setSelectedPlaceId(e.target.value)}
                        className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg"
                    >
                        {ownedPlaceIds.map(id => (
                            <option key={id} value={id}>{getPlaceById(id)?.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">Número de Mesas:</span>
                    <div className="flex items-center bg-gray-800 rounded-lg">
                        <button onClick={() => setTableCount(Math.max(1, tableCount - 1))} className="p-2 text-primary hover:bg-gray-700 rounded-l-lg transition-colors">
                            <Minus size={18} />
                        </button>
                        <span className="px-6 font-bold text-lg">{tableCount}</span>
                        <button onClick={() => setTableCount(tableCount + 1)} className="p-2 text-primary hover:bg-gray-700 rounded-r-lg transition-colors">
                            <Plus size={18} />
                        </button>
                    </div>
                </div>

                <button 
                    onClick={generatePDF}
                    disabled={isGenerating || !place}
                    className="w-full bg-primary text-background font-bold py-4 rounded-xl flex items-center justify-center hover:bg-primary/90 transition-all shadow-lg disabled:bg-gray-600 disabled:text-gray-400"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="mr-2 animate-spin" />
                            Gerando PDF...
                        </>
                    ) : (
                        <>
                            <FileText className="mr-2" /> 
                            Gerar Arquivo PDF
                        </>
                    )}
                </button>
            </div>

            <h2 className="text-sm font-bold text-text-secondary uppercase mb-4">Pré-visualização</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" ref={qrContainerRef}>
                {Array.from({ length: tableCount }, (_, i) => i + 1).map(num => (
                    <div key={num} className="bg-white p-6 rounded-xl flex flex-col items-center border border-gray-200 shadow-sm text-black w-full max-w-[280px] mx-auto overflow-hidden">
                        <div className="text-center mb-4 w-full">
                            <h2 className="text-xl font-black mb-1 truncate px-2">{place?.name}</h2>
                            <div className="h-0.5 w-12 bg-accent mx-auto mb-2"></div>
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
                        
                        <div className="mt-4 pt-3 border-t border-gray-50 w-full text-center">
                            <p className="text-gray-300 text-[7px] font-bold uppercase tracking-widest">Powered by CrowdMatch</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TableQRManager;