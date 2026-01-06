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
            
            for (let i = 0; i < elements.length; i++) {
                const element = elements[i] as HTMLElement;
                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff'
                });
                
                const imgData = canvas.toDataURL('image/png');
                const imgProps = pdf.getImageProperties(imgData);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                
                if (i > 0) pdf.addPage();
                
                // Centraliza o card no PDF
                const yPos = (pdf.internal.pageSize.getHeight() - pdfHeight) / 2;
                pdf.addImage(imgData, 'PNG', 0, yPos, pdfWidth, pdfHeight);
            }
            
            pdf.save(`QRCodes_${place.name.replace(/\s+/g, '_')}.pdf`);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">QR Codes das Mesas</h1>
            
            <div className="bg-surface p-4 rounded-xl mb-8 space-y-4">
                <p className="text-sm text-text-secondary">Defina a quantidade de mesas e gere um PDF com todos os QR Codes para impressão posterior.</p>
                
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

            {/* Container Invisível na Interface, mas usado para capturar o PDF */}
            <div className="space-y-8" ref={qrContainerRef}>
                {Array.from({ length: tableCount }, (_, i) => i + 1).map(num => (
                    <div key={num} className="bg-white p-12 rounded-none flex flex-col items-center border border-gray-100 w-[210mm] mx-auto overflow-hidden">
                        <div className="text-black text-center mb-10 w-full">
                            <h2 className="text-5xl font-black mb-2 tracking-tight">{place?.name}</h2>
                            <div className="h-1 w-32 bg-accent mx-auto mb-4"></div>
                            <p className="text-2xl font-bold text-gray-800 uppercase tracking-widest">Cardápio Digital</p>
                        </div>
                        
                        <div className="p-8 bg-white border-[6px] border-black rounded-3xl shadow-sm">
                            <QRCodeSVG value={`${baseUrl}/${num}`} size={300} level="H" />
                        </div>

                        <div className="mt-12 text-black text-center w-full">
                            <p className="text-lg font-medium text-gray-600 mb-4">Escaneie com a câmera do seu celular para pedir</p>
                            <div className="bg-black text-white px-12 py-4 rounded-2xl inline-block font-black text-5xl shadow-xl">
                                MESA {num}
                            </div>
                        </div>
                        
                        <div className="mt-12 pt-8 border-t border-gray-100 w-full text-center">
                            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Powered by CrowdMatch</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TableQRManager;