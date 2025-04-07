'use client';

import React from 'react';
import QRCode from 'react-qr-code';
import { Card } from './Card';

interface QRCodeTicketProps {
  ticketData: {
    orderId: string;
    movieTitle: string;
    theaterName: string;
    startTime: string;
    seats: string[];
  };
  showBorder?: boolean;
  size?: number;
}

const QRCodeTicket: React.FC<QRCodeTicketProps> = ({ 
  ticketData, 
  showBorder = true,
  size = 150 
}) => {
  // 将票据数据转换为JSON字符串
  const qrCodeValue = JSON.stringify({
    ...ticketData,
    timestamp: new Date().toISOString() // 添加时间戳以确保每次渲染的QR码都是唯一的
  });

  return (
    <div className="flex flex-col items-center">
      <div className={`bg-white p-4 ${showBorder ? 'border border-slate-200 shadow-sm' : ''} rounded-md`}>
        <QRCode value={qrCodeValue} size={size} />
      </div>
      <div className="text-xs text-slate-500 mt-3 text-center">
        <div>电影票：{ticketData.orderId}</div>
        <div>请向工作人员出示此二维码</div>
      </div>
    </div>
  );
};

export default QRCodeTicket; 