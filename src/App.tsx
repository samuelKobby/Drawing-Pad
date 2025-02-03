import React, { useEffect, useRef, useState } from 'react';
import { Peer } from 'peerjs';
import QRCode from 'qrcode.react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const peerRef = useRef<Peer>();
  const connRef = useRef<any>();
  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState<'phone' | 'computer'>('computer');
  const [connectionId, setConnectionId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    if (mode === 'computer') {
      peerRef.current = new Peer();
      
      peerRef.current.on('open', (id) => {
        setConnectionId(id);
      });

      peerRef.current.on('connection', (conn) => {
        connRef.current = conn;
        setIsConnected(true);

        conn.on('data', (data: { x: number; y: number; isStarting: boolean }) => {
          const canvas = canvasRef.current;
          if (!canvas) return;

          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          if (data.isStarting) {
            ctx.beginPath();
            ctx.moveTo(data.x, data.y);
          } else {
            ctx.lineTo(data.x, data.y);
            ctx.stroke();
          }
        });
      });
    }

    return () => {
      peerRef.current?.disconnect();
    };
  }, [mode]);

  useEffect(() => {
    if (mode === 'phone' && connectionId) {
      peerRef.current = new Peer();
      const conn = peerRef.current.connect(connectionId);
      connRef.current = conn;

      conn.on('open', () => {
        setIsConnected(true);
      });
    }
  }, [mode, connectionId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.8;

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  }, []);

  const handleStartDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);

    if (mode === 'phone' && connRef.current) {
      connRef.current.send({ x, y, isStarting: true });
    }
  };

  const handleDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();

    if (mode === 'phone' && connRef.current) {
      connRef.current.send({ x, y, isStarting: false });
    }
  };

  const handleEndDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const toggleMode = () => {
    setMode(mode === 'computer' ? 'phone' : 'computer');
    setIsConnected(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Drawing Pad</h1>
            <div className="space-x-4">
              <button
                onClick={toggleMode}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Switch to {mode === 'computer' ? 'Phone' : 'Computer'} Mode
              </button>
              <button
                onClick={clearCanvas}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Clear
              </button>
            </div>
          </div>

          {mode === 'computer' && (
            <div className="mb-6 text-center">
              <p className="mb-4">Connection ID: {connectionId}</p>
              {connectionId && (
                <div className="inline-block p-4 bg-white rounded-lg shadow">
                  <QRCode value={connectionId} size={200} />
                </div>
              )}
              <p className="mt-4 text-sm text-gray-600">
                {isConnected ? 'Phone connected!' : 'Waiting for phone to connect...'}
              </p>
            </div>
          )}

          {mode === 'phone' && !isConnected && (
            <div className="mb-6 text-center">
              <input
                type="text"
                value={connectionId}
                onChange={(e) => setConnectionId(e.target.value)}
                placeholder="Enter connection ID"
                className="border p-2 rounded"
              />
            </div>
          )}

          <canvas
            ref={canvasRef}
            className="border-2 border-gray-300 rounded-lg touch-none"
            onMouseDown={handleStartDrawing}
            onMouseMove={handleDrawing}
            onMouseUp={handleEndDrawing}
            onMouseLeave={handleEndDrawing}
            onTouchStart={handleStartDrawing}
            onTouchMove={handleDrawing}
            onTouchEnd={handleEndDrawing}
          />
        </div>
      </div>
    </div>
  );
}