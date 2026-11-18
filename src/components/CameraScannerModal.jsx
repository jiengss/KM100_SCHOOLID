import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function CameraScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [scanning, setScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const scannerRef = useRef(null);
  const readerElementId = 'camera-qr-barcode-reader';

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    let isMounted = true;

    // Detect cameras
    Html5Qrcode.getCameras()
      .then(devices => {
        if (!isMounted) return;
        if (devices && devices.length) {
          setCameras(devices);
          // Prefer back/environment camera or first camera
          const backCam = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
          setSelectedCamera(backCam ? backCam.id : devices[0].id);
        } else {
          setErrorMessage('No camera devices found on this device.');
        }
      })
      .catch(err => {
        if (!isMounted) return;
        setErrorMessage('Camera access error: ' + (err.message || 'Permission denied'));
      });

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && selectedCamera) {
      startScanner(selectedCamera);
    }
    return () => {
      stopScanner();
    };
  }, [isOpen, selectedCamera]);

  const startScanner = async (cameraId) => {
    await stopScanner();
    try {
      setErrorMessage('');
      const html5QrCode = new Html5Qrcode(readerElementId);
      scannerRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: { width: 280, height: 180 },
        aspectRatio: 1.333333
      };

      await html5QrCode.start(
        cameraId,
        config,
        (decodedText) => {
          // Success callback
          stopScanner();
          onScanSuccess(decodedText);
          onClose();
        },
        (error) => {
          // ignore continuous scanning attempts
        }
      );
      setScanning(true);
    } catch (err) {
      setErrorMessage('Failed to start camera feed: ' + (err.message || err));
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.warn('Error clearing scanner', err);
      }
      scannerRef.current = null;
      setScanning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2 text-white font-bold">
            <Camera className="w-5 h-5 text-blue-400" />
            <span>Camera ID Scanner</span>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Selector */}
        {cameras.length > 1 && (
          <div className="px-6 py-2.5 bg-slate-950/30 border-b border-slate-800 flex items-center gap-2">
            <label className="text-xs text-slate-400 font-medium">Camera:</label>
            <select
              value={selectedCamera}
              onChange={(e) => setSelectedCamera(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {cameras.map(cam => (
                <option key={cam.id} value={cam.id}>
                  {cam.label || `Camera ${cam.id.slice(0, 5)}...`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Viewport Area */}
        <div className="p-6 flex flex-col items-center justify-center">
          {errorMessage ? (
            <div className="p-6 text-center text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl max-w-sm">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold">{errorMessage}</p>
              <button
                onClick={() => selectedCamera && startScanner(selectedCamera)}
                className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry Camera
              </button>
            </div>
          ) : (
            <div className="relative w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[300px]">
              <div id={readerElementId} className="w-full h-full"></div>
              {scanning && (
                <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center">
                  <div className="w-64 h-32 border-2 border-blue-500/60 rounded-xl relative shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                    {/* Laser scanning line */}
                    <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_#38bdf8] animate-scan" />
                  </div>
                  <span className="mt-3 text-xs font-medium text-slate-300 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-700">
                    Align Barcode or QR Code within the box
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/40 text-center">
          <p className="text-xs text-slate-400">
            Tip: You can also use a physical handheld USB/Bluetooth barcode or RFID card scanner anytime!
          </p>
        </div>
      </div>
    </div>
  );
}
