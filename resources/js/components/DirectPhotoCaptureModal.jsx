import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle } from 'lucide-react';

export default function DirectPhotoCaptureModal({ isOpen, onClose, onCapture, title = "Capture ID Photo" }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    navigator.mediaDevices?.enumerateDevices()
      .then(devices => {
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        setCameras(videoDevices);
        if (videoDevices.length > 0) {
          const userFacing = videoDevices.find(d => d.label.toLowerCase().includes('front') || d.label.toLowerCase().includes('user'));
          setSelectedCameraId(userFacing ? userFacing.deviceId : videoDevices[0].deviceId);
        } else {
          startCamera();
        }
      })
      .catch(() => {
        startCamera();
      });

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && selectedCameraId) {
      startCamera(selectedCameraId);
    }
  }, [isOpen, selectedCameraId]);

  const startCamera = async (deviceId) => {
    stopCamera();
    setErrorMessage('');
    setIsCameraReady(false);

    try {
      const constraints = {
        video: deviceId 
          ? { deviceId: { exact: deviceId }, width: { ideal: 960 }, height: { ideal: 720 } }
          : { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 720 } }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraReady(true);
    } catch (err) {
      console.warn("Camera start error:", err);
      setErrorMessage("Could not start camera. Please ensure permissions are allowed.");
      setIsCameraReady(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraReady(false);
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;

      // Crop center square/portrait
      const size = Math.min(width, height);
      const startX = (width - size) / 2;
      const startY = (height - size) / 2;

      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, startX, startY, size, size, 0, 0, 400, 400);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      stopCamera();
      onCapture(dataUrl);
      onClose();
    } catch (err) {
      console.error("Capture error:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-darkbg-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-darkbg-900/50">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-orange-500" />
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">
              {title}
            </h3>
          </div>
          <button
            onClick={() => { stopCamera(); onClose(); }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder */}
        <div className="p-5 flex flex-col items-center">
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-2xl overflow-hidden bg-black border-2 border-orange-500/50 shadow-inner flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Face Oval Guide */}
            <div className="absolute inset-4 border-2 border-dashed border-orange-400/60 rounded-full pointer-events-none" />

            {!isCameraReady && !errorMessage && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-slate-300">
                <RefreshCw className="w-6 h-6 animate-spin text-orange-400 mb-2" />
                <span className="text-xs font-semibold">Starting camera...</span>
              </div>
            )}

            {errorMessage && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-black/80 text-center text-red-400">
                <AlertCircle className="w-8 h-8 mb-2" />
                <span className="text-xs">{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Switch Camera if multiple */}
          {cameras.length > 1 && (
            <div className="mt-3 flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Camera:</label>
              <select
                value={selectedCameraId}
                onChange={(e) => setSelectedCameraId(e.target.value)}
                className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200"
              >
                {cameras.map(c => (
                  <option key={c.deviceId} value={c.deviceId}>{c.label || 'Camera'}</option>
                ))}
              </select>
            </div>
          )}

          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 text-center">
            Position face in the guide and click Capture. Image will be placed directly into the record.
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-darkbg-900/50 flex items-center justify-between">
          <button
            type="button"
            onClick={() => { stopCamera(); onClose(); }}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCapture}
            disabled={!isCameraReady}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 disabled:opacity-50 text-white font-black text-xs shadow-lg shadow-orange-500/25 transition active:scale-95"
          >
            <Camera className="w-4 h-4" />
            <span>Capture & Use Photo Directly</span>
          </button>
        </div>
      </div>
    </div>
  );
}
