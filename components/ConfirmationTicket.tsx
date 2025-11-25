import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface ConfirmationTicketProps {
    type: 'check-in' | 'going';
    placeName: string;
    timestamp: number;
    order: number;
    qrCodeValue: string;
}

const formatTicketDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const ConfirmationTicket: React.FC<ConfirmationTicketProps> = ({ type, placeName, timestamp, order, qrCodeValue }) => {
    const isCheckIn = type === 'check-in';
    const title = isCheckIn ? 'COMPROVANTE DE CHECK-IN' : 'INTENÇÃO DE IDA';
    const orderLabel = isCheckIn ? 'Você é o nº' : 'Sua ordem é';

    return (
        <div className="bg-gray-100 text-gray-900 p-3 rounded-lg shadow-md w-full max-w-xs mx-auto font-mono text-sm animate-fade-in-up">
            <div className="text-center border-b-2 border-dashed border-gray-400 pb-2">
                <h3 className="font-bold text-base">{title}</h3>
                <p className="text-xs truncate">{placeName}</p>
            </div>
            <div className="flex justify-between items-center my-3">
                <div>
                    <p className="text-gray-600">Data/Hora:</p>
                    <p className="font-semibold">{formatTicketDate(timestamp)}</p>
                </div>
                <div>
                    <p className="text-gray-600">{orderLabel}:</p>
                    <p className="font-bold text-2xl text-right">{String(order).padStart(3, '0')}</p>
                </div>
            </div>
            <div className="flex justify-center items-center bg-white p-2 rounded-md">
                 <QRCodeSVG 
                    value={qrCodeValue} 
                    size={96} 
                    level="H" 
                    bgColor="#FFFFFF"
                    fgColor="#000000"
                />
            </div>
            <p className="text-center text-xs text-gray-500 mt-2">Apresente este código no local.</p>
        </div>
    );
};

export default ConfirmationTicket;