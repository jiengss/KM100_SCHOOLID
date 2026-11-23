import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Sparkles, 
  RefreshCw, 
  ArrowRight, 
  User, 
  GraduationCap, 
  Phone, 
  ShieldAlert,
  QrCode,
  Check,
  CreditCard,
  Save,
  ZoomIn,
  Eye,
  ExternalLink,
  Info
} from 'lucide-react';
import { COURSE_OPTIONS } from '../lib/mockData';
import { parseRegistrationFormText } from '../lib/formParser';
import Tesseract from 'tesseract.js';
import { Html5Qrcode } from 'html5-qrcode';

// Canvas preprocessing helper to optimize image for OCR and prevent browser memory crashes
function preprocessImage(imgElement) {
  const maxDim = 1500;
  let width = imgElement.naturalWidth || imgElement.width || 800;
  let height = imgElement.naturalHeight || imgElement.height || 600;

  if (width > maxDim || height > maxDim) {
    if (width > height) {
      height = Math.round((height * maxDim) / width);
      width = maxDim;
    } else {
      width = Math.round((width * maxDim) / height);
      height = maxDim;
    }
  }

  // Standard resized canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imgElement, 0, 0, width, height);

  // High-contrast canvas for OCR binarization
  const contrastCanvas = document.createElement('canvas');
  contrastCanvas.width = width;
  contrastCanvas.height = height;
  const cCtx = contrastCanvas.getContext('2d');
  cCtx.drawImage(imgElement, 0, 0, width, height);

  try {
    const imgData = cCtx.getImageData(0, 0, width, height);
    const d = imgData.data;
    // Convert to grayscale and apply contrast curve
    for (let i = 0; i < d.length; i += 4) {
      const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      // High contrast stretch
      const adjusted = Math.max(0, Math.min(255, (gray - 128) * 1.35 + 128));
      d[i] = adjusted;
      d[i + 1] = adjusted;
      d[i + 2] = adjusted;
    }
    cCtx.putImageData(imgData, 0, 0);
  } catch (err) {
    console.warn("Canvas image data filtering skipped:", err);
  }

  return { standardCanvas: canvas, contrastCanvas };
}

// Generate an official unique School ID in the KM100 format: e.g. 2025-00105
function generateSmartSchoolId(existingStudents = []) {
  const year = new Date().getFullYear();
  const count = (existingStudents?.length || 0) + 1;
  const padded = String(count).padStart(5, '0');
  let candidate = `${year}-${padded}`;

  // Check collision
  const existingIds = new Set(existingStudents?.map(s => s.school_id) || []);
  if (existingIds.has(candidate)) {
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    candidate = `${year}-${randomSuffix}`;
  }
  return candidate;
}

export default function RegistrationFormScannerModal({
  isOpen,
  onClose,
  onApplyData,
  onSaveStudentDirectly,
  existingStudents = [],
  onOpenCardModal
}) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload', 'camera', 'paste'
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoNotice, setInfoNotice] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [isEnlargedPreviewOpen, setIsEnlargedPreviewOpen] = useState(false);

  // Extracted Student Form Data
  const [extractedData, setExtractedData] = useState(null);
  const [useDocAsPhoto, setUseDocAsPhoto] = useState(false);
  const [isSavingDirect, setIsSavingDirect] = useState(false);
  const [savedSuccessStudent, setSavedSuccessStudent] = useState(null);

  // Camera State
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const fileInputRef = useRef(null);
  const [rawPastedText, setRawPastedText] = useState('');

  // Sample template for quick testing
  const sampleFormText = `KM100 SKILLS AND TRAINING CENTER, INC.
OFFICIAL STUDENT ENROLLMENT & REGISTRATION FORM

School ID: ${generateSmartSchoolId(existingStudents)}
First Name: Juan
Middle Name: Bautista
Last Name: Dela Cruz
Technology Course: Computer Engineering Technology (NC II)
Emergency Contact Person: Maria Dela Cruz (Mother)
Emergency Phone Number: +63 917 123 4567`;

  // Start / Stop camera stream when camera tab is chosen
  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  const startCamera = async () => {
    try {
      setErrorMessage('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err) {
      console.warn("Camera access failed:", err);
      setErrorMessage("Could not access camera. Please allow camera permissions or upload an image file instead.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Run multi-tier OCR + QR extraction on an image
  const processImage = async (imageSource, fileName = '') => {
    setIsProcessing(true);
    setProgressStatus('Optimizing document for scanning...');
    setProgressPercent(15);
    setErrorMessage('');
    setInfoNotice('');

    let detectedText = '';
    let canvasForOcr = null;

    try {
      // Step 1: Preprocess to Canvas to handle high resolution & improve contrast
      const img = new Image();
      img.crossOrigin = "anonymous";

      const imgSrc = typeof imageSource === 'string' 
        ? imageSource 
        : await new Promise((resolve) => {
            const r = new FileReader();
            r.onload = (e) => resolve(e.target.result);
            r.readAsDataURL(imageSource);
          });

      setPreviewImage(imgSrc);

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imgSrc;
      });

      const { standardCanvas, contrastCanvas } = preprocessImage(img);
      canvasForOcr = contrastCanvas;

      // Step 2: Check for 2D Form QR code with html5-qrcode
      setProgressStatus('Checking for form QR / Barcode data...');
      setProgressPercent(25);

      try {
        const qrScanner = new Html5Qrcode("form-qr-detector-hidden");
        // Convert standard canvas to blob for scanner
        const blob = await new Promise((res) => standardCanvas.toBlob(res, 'image/jpeg', 0.9));
        if (blob) {
          const fileObj = new File([blob], "temp_form_scan.jpg", { type: "image/jpeg" });
          const qrResult = await qrScanner.scanFile(fileObj, false);
          if (qrResult) {
            detectedText = qrResult;
          }
        }
        await qrScanner.clear();
      } catch {
        // No QR code found, will proceed to OCR
      }

      // Step 3: Run Tesseract OCR with safety timeout
      if (!detectedText) {
        setProgressStatus('Reading document text with Optical Character Recognition...');
        setProgressPercent(40);

        try {
          // Wrap Tesseract in a safety timeout of 12 seconds so it never hangs
          const ocrPromise = Tesseract.recognize(
            canvasForOcr || standardCanvas,
            'eng',
            {
              logger: (m) => {
                if (m.status === 'recognizing text') {
                  setProgressPercent(40 + Math.round((m.progress || 0) * 50));
                  setProgressStatus(`Recognizing document text: ${Math.round((m.progress || 0) * 100)}%`);
                }
              }
            }
          );

          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("OCR timeout")), 12000)
          );

          const ocrResult = await Promise.race([ocrPromise, timeoutPromise]);
          detectedText = ocrResult?.data?.text || '';
        } catch (ocrErr) {
          console.warn("Tesseract OCR completed with warning / fallback:", ocrErr);
          setInfoNotice("Document uploaded! Since automatic text detection was partial or offline, we've loaded your document preview so you can verify the fields and save directly.");
        }
      }
    } catch (prepErr) {
      console.warn("Image preparation error:", prepErr);
      setInfoNotice("Document photo loaded! Please review and verify the student details below to save.");
    }

    // Step 4: Parse extracted fields
    setProgressStatus('Extracting student registration fields...');
    setProgressPercent(95);

    // If filename has clues (e.g. "Juan_Dela_Cruz.png")
    let fallbackText = detectedText;
    if (!detectedText && fileName) {
      fallbackText = fileName.replace(/[\._\-]/g, ' ');
    }

    const parsed = parseRegistrationFormText(fallbackText);

    // Guarantee a valid School ID is ready
    if (!parsed.school_id) {
      parsed.school_id = generateSmartSchoolId(existingStudents);
    }
    if (!parsed.course_strand) {
      parsed.course_strand = COURSE_OPTIONS[0];
    }

    setExtractedData(parsed);
    setIsProcessing(false);
    setProgressPercent(100);
  };

  // Capture freeze frame from video camera
  const handleCaptureCamera = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPreviewImage(dataUrl);
    processImage(dataUrl, 'camera_capture.jpg');
  };

  // Handle uploaded form file
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImage(file, file.name);
  };

  // Handle manual paste text
  const handleParsePastedText = () => {
    if (!rawPastedText.trim()) {
      setErrorMessage("Please paste or type registration form text.");
      return;
    }
    setErrorMessage('');
    const parsed = parseRegistrationFormText(rawPastedText);
    if (!parsed.school_id) {
      parsed.school_id = generateSmartSchoolId(existingStudents);
    }
    setExtractedData(parsed);
  };

  // Direct Save Student to System
  const handleDirectSave = async () => {
    if (!extractedData) return;
    if (!extractedData.school_id?.trim() || !extractedData.first_name?.trim() || !extractedData.last_name?.trim()) {
      setErrorMessage("Please make sure School ID, First Name, and Last Name are entered.");
      return;
    }

    setIsSavingDirect(true);
    setErrorMessage('');

    try {
      const studentPayload = {
        school_id: extractedData.school_id.trim(),
        first_name: extractedData.first_name.trim(),
        middle_name: extractedData.middle_name?.trim() || '',
        last_name: extractedData.last_name.trim(),
        course_strand: extractedData.course_strand || COURSE_OPTIONS[0],
        grade_level: 'N/A',
        section: 'N/A',
        emergency_contact_name: extractedData.emergency_contact_name?.trim() || '',
        emergency_contact_phone: extractedData.emergency_contact_phone?.trim() || '',
        photo_url: useDocAsPhoto && previewImage ? previewImage : '',
        status: 'ACTIVE',
        blood_type: 'O+'
      };

      if (onSaveStudentDirectly) {
        const saved = await onSaveStudentDirectly(studentPayload);
        setSavedSuccessStudent(saved || studentPayload);
      } else {
        // Fallback to onApplyData
        onApplyData(studentPayload);
        onClose();
      }
    } catch (err) {
      console.error("Direct save failed:", err);
      setErrorMessage("Failed to save student into system: " + (err.message || err));
    } finally {
      setIsSavingDirect(false);
    }
  };

  // Apply to full manual add modal
  const handleApplyToForm = () => {
    if (!extractedData) return;
    onApplyData({
      school_id: extractedData.school_id || generateSmartSchoolId(existingStudents),
      first_name: extractedData.first_name || '',
      middle_name: extractedData.middle_name || '',
      last_name: extractedData.last_name || '',
      course_strand: extractedData.course_strand || COURSE_OPTIONS[0],
      emergency_contact_name: extractedData.emergency_contact_name || '',
      emergency_contact_phone: extractedData.emergency_contact_phone || '',
      photo_url: useDocAsPhoto && previewImage ? previewImage : ''
    });
    onClose();
  };

  const handleResetScan = () => {
    setExtractedData(null);
    setPreviewImage(null);
    setErrorMessage('');
    setInfoNotice('');
    setRawPastedText('');
    setProgressPercent(0);
    setProgressStatus('');
    setSavedSuccessStudent(null);
    setUseDocAsPhoto(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      {/* Hidden container for QR scanning */}
      <div id="form-qr-detector-hidden" className="hidden" />

      {/* Enlarged Document Preview Lightbox Modal */}
      {isEnlargedPreviewOpen && previewImage && (
        <div 
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsEnlargedPreviewOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl flex flex-col">
            <div className="p-3 bg-slate-950 flex items-center justify-between border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-400" />
                Uploaded Registration Document Preview
              </span>
              <button 
                onClick={() => setIsEnlargedPreviewOpen(false)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-auto max-h-[80vh] p-2 flex items-center justify-center">
              <img src={previewImage} alt="Uploaded Form" className="max-w-full h-auto rounded-lg object-contain" />
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-3xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[92vh] transition-all">
        {/* Header */}
        <div className="p-3.5 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-darkbg-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
              <FileText className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="text-xs sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
                  Read Registration Form & Save School ID
                </h3>
                <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-[9px] sm:text-[10px] font-black uppercase">
                  OCR Engine
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                Reads student document and saves record directly to Supabase cloud
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-200/70 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition flex-shrink-0 ml-2"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1">
          {/* ======================================================== */}
          {/* STATE 1: REGISTRATION SUCCESS BANNER                    */}
          {/* ======================================================== */}
          {savedSuccessStudent ? (
            <div className="p-6 text-center space-y-4 animate-scale-in">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">
                  Student Saved to School ID System!
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  The student information read from the uploaded document has been registered and synced directly to Supabase.
                </p>
              </div>

              {/* Student Badge Card */}
              <div className="max-w-md mx-auto p-4 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-left flex items-center gap-4">
                {savedSuccessStudent.photo_url ? (
                  <img 
                    src={savedSuccessStudent.photo_url} 
                    alt="Student" 
                    className="w-14 h-14 rounded-xl object-cover border border-slate-300 dark:border-slate-700 flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-blue-500/20 text-blue-500 flex items-center justify-center font-black text-base flex-shrink-0">
                    {savedSuccessStudent.first_name?.[0]}{savedSuccessStudent.last_name?.[0]}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-500/20">
                      {savedSuccessStudent.school_id}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      ACTIVE
                    </span>
                  </div>
                  <h5 className="font-black text-sm text-slate-900 dark:text-white truncate mt-1">
                    {savedSuccessStudent.first_name} {savedSuccessStudent.middle_name ? `${savedSuccessStudent.middle_name} ` : ''}{savedSuccessStudent.last_name}
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {savedSuccessStudent.course_strand}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                {onOpenCardModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenCardModal(savedSuccessStudent);
                      onClose();
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>View / Print School ID Card</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleResetScan}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Scan Another Form</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition"
                >
                  Close
                </button>
              </div>
            </div>
          ) : !extractedData ? (
            /* ======================================================== */
            /* STATE 2: SCAN / UPLOAD / PASTE INPUT TABS                */
            /* ======================================================== */
            <>
              {/* Scan Mode Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-darkbg-950 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setActiveTab('upload'); setErrorMessage(''); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition active:scale-95 ${
                    activeTab === 'upload'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('camera'); setErrorMessage(''); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition active:scale-95 ${
                    activeTab === 'camera'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Camera Scanner</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('paste'); setErrorMessage(''); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition active:scale-95 ${
                    activeTab === 'paste'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Paste Text</span>
                </button>
              </div>

              {/* Progress Indicator */}
              {isProcessing && (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 space-y-2 animate-pulse">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-700 dark:text-blue-300">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      <span className="truncate">{progressStatus || 'Scanning form document...'}</span>
                    </span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-blue-200 dark:bg-blue-900 overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 dark:bg-blue-400 transition-all duration-300 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* TAB 1: UPLOAD DOCUMENT */}
              {activeTab === 'upload' && !isProcessing && (
                <div className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        processImage(file, file.name);
                      }
                    }}
                    className="flex flex-col items-center justify-center p-6 sm:p-10 rounded-2xl sm:rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-slate-50/70 hover:bg-blue-50/20 dark:bg-darkbg-950 dark:hover:bg-blue-950/10 cursor-pointer transition group text-center"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <p className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100">
                      Upload Filled Registration Form / Photo
                    </p>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                      Upload an image file (PNG, JPG, JPEG, WEBP) of the registration sheet or student ID photo.
                    </p>
                    <span className="mt-3 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] sm:text-xs font-bold transition shadow-sm">
                      Browse Files
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 2: LIVE CAMERA SCANNER */}
              {activeTab === 'camera' && !isProcessing && (
                <div className="space-y-3">
                  <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border-2 border-slate-800 h-60 xs:h-72 sm:h-80 md:aspect-video flex items-center justify-center">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />

                    {/* Form Reticle Overlay */}
                    <div className="absolute inset-4 sm:inset-8 border-2 border-dashed border-blue-400/60 rounded-xl sm:rounded-2xl pointer-events-none flex items-center justify-center">
                      <span className="px-2.5 py-1 rounded-full bg-slate-950/80 text-blue-300 font-bold text-[10px] sm:text-[11px] backdrop-blur-md">
                        Align Registration Form inside frame
                      </span>
                    </div>

                    {!isCameraActive && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-slate-950/90 text-white">
                        <Camera className="w-7 h-7 text-slate-400 mb-2" />
                        <p className="text-xs font-bold text-slate-300">Camera is initializing...</p>
                        <button
                          type="button"
                          onClick={startCamera}
                          className="mt-3 px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow"
                        >
                          Enable Camera
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-center pt-1">
                    <button
                      type="button"
                      onClick={handleCaptureCamera}
                      disabled={!isCameraActive}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-black shadow-lg shadow-blue-500/30 transition active:scale-95"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Capture & Extract Form Data</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: PASTE FORM TEXT */}
              {activeTab === 'paste' && !isProcessing && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Paste Form Text / Online Response
                    </label>
                    <button
                      type="button"
                      onClick={() => setRawPastedText(sampleFormText)}
                      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Load Sample Form Data</span>
                    </button>
                  </div>
                  <textarea
                    rows={7}
                    value={rawPastedText}
                    onChange={(e) => setRawPastedText(e.target.value)}
                    placeholder={`School ID: 2025-00101\nFirst Name: Juan\nMiddle Name: Bautista\nLast Name: Dela Cruz\nTechnology Course: Computer Engineering Technology (NC II)\nEmergency Contact Person: Maria Dela Cruz\nEmergency Phone Number: +63 917 123 4567`}
                    className="w-full bg-slate-50 dark:bg-darkbg-950 border border-slate-300 dark:border-slate-800 rounded-2xl p-3 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleParsePastedText}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-500/25 active:scale-95 flex items-center gap-1.5"
                    >
                      <span>Extract Form Fields</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </>
          ) : (
            /* ======================================================== */
            /* STATE 3: SCANNED DATA REVIEW & CONFIRMATION             */
            /* ======================================================== */
            <div className="space-y-4 animate-fade-in">
              {/* Notice Banner */}
              {infoNotice ? (
                <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span>{infoNotice}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleResetScan}
                    className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:underline flex items-center gap-1 flex-shrink-0 ml-2"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Re-upload</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Form read successfully! Review the fields below and save for School ID:</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleResetScan}
                    className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:underline flex items-center gap-1 flex-shrink-0 ml-2"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Scan Another</span>
                  </button>
                </div>
              )}

              {/* Side-by-Side Review Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Document Thumbnail Preview (5 cols on desktop) */}
                {previewImage && (
                  <div className="lg:col-span-5 p-3 rounded-2xl bg-slate-100 dark:bg-darkbg-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-blue-500" />
                          Uploaded Document
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsEnlargedPreviewOpen(true)}
                          className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <ZoomIn className="w-3 h-3" />
                          <span>Enlarge</span>
                        </button>
                      </div>

                      <div 
                        onClick={() => setIsEnlargedPreviewOpen(true)}
                        className="relative rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-900 group cursor-pointer aspect-[3/4] max-h-56 lg:max-h-72 flex items-center justify-center"
                      >
                        <img 
                          src={previewImage} 
                          alt="Uploaded Document" 
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5 backdrop-blur-[2px]">
                          <ZoomIn className="w-4 h-4" />
                          <span>Click to Inspect</span>
                        </div>
                      </div>
                    </div>

                    {/* Option to use document as Photo */}
                    <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800">
                      <label className="flex items-center gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useDocAsPhoto}
                          onChange={(e) => setUseDocAsPhoto(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-blue-600 border-slate-300 dark:border-slate-700 focus:ring-blue-500"
                        />
                        <span>Use uploaded photo as Student ID photo</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Form Fields Column (7 cols on desktop, or 12 if no preview) */}
                <div className={`${previewImage ? 'lg:col-span-7' : 'lg:col-span-12'} p-4 rounded-2xl bg-slate-50 dark:bg-darkbg-950 border border-slate-200 dark:border-slate-800 space-y-3.5`}>
                  {/* School ID Field */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Official School ID <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setExtractedData({
                          ...extractedData,
                          school_id: generateSmartSchoolId(existingStudents)
                        })}
                        className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        title="Generate a new sequential School ID"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>Regenerate ID</span>
                      </button>
                    </div>
                    <div className="relative">
                      <CreditCard className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={extractedData.school_id || ''}
                        onChange={(e) => setExtractedData({ ...extractedData, school_id: e.target.value })}
                        placeholder="e.g. 2025-00101"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 focus:outline-none focus:border-blue-500 shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Student Name Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* First Name */}
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                        <span>First Name <span className="text-red-500">*</span></span>
                        {extractedData.first_name && <Check className="w-2.5 h-2.5 text-emerald-500" />}
                      </label>
                      <input
                        type="text"
                        required
                        value={extractedData.first_name || ''}
                        onChange={(e) => setExtractedData({ ...extractedData, first_name: e.target.value })}
                        placeholder="First Name"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 shadow-sm"
                      />
                    </div>

                    {/* Middle Name */}
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                        <span>Middle Name</span>
                        {extractedData.middle_name && <Check className="w-2.5 h-2.5 text-emerald-500" />}
                      </label>
                      <input
                        type="text"
                        value={extractedData.middle_name || ''}
                        onChange={(e) => setExtractedData({ ...extractedData, middle_name: e.target.value })}
                        placeholder="Middle Name"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 shadow-sm"
                      />
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                        <span>Last Name <span className="text-red-500">*</span></span>
                        {extractedData.last_name && <Check className="w-2.5 h-2.5 text-emerald-500" />}
                      </label>
                      <input
                        type="text"
                        required
                        value={extractedData.last_name || ''}
                        onChange={(e) => setExtractedData({ ...extractedData, last_name: e.target.value })}
                        placeholder="Last Name"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Technology Course */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                      <span>Technology Course (NC II Specialization)</span>
                      {extractedData.course_strand && <Check className="w-2.5 h-2.5 text-emerald-500" />}
                    </label>
                    <select
                      value={extractedData.course_strand || COURSE_OPTIONS[0]}
                      onChange={(e) => setExtractedData({ ...extractedData, course_strand: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 shadow-sm"
                    >
                      {COURSE_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Emergency Contact Person & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                        <span>Emergency Contact</span>
                        {extractedData.emergency_contact_name && <Check className="w-2.5 h-2.5 text-emerald-500" />}
                      </label>
                      <input
                        type="text"
                        value={extractedData.emergency_contact_name || ''}
                        onChange={(e) => setExtractedData({ ...extractedData, emergency_contact_name: e.target.value })}
                        placeholder="Parent / Guardian Name"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                        <span>Emergency Phone</span>
                        {extractedData.emergency_contact_phone && <Check className="w-2.5 h-2.5 text-emerald-500" />}
                      </label>
                      <input
                        type="text"
                        value={extractedData.emergency_contact_phone || ''}
                        onChange={(e) => setExtractedData({ ...extractedData, emergency_contact_phone: e.target.value })}
                        placeholder="+63 900 000 0000"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-darkbg-950/70 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition order-2 sm:order-1"
          >
            {savedSuccessStudent ? 'Close' : 'Cancel'}
          </button>

          {extractedData && !savedSuccessStudent && (
            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2 order-1 sm:order-2">
              <button
                type="button"
                onClick={handleApplyToForm}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
                title="Transfer extracted fields to the detailed student registration modal"
              >
                <span>Open Full Form</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                disabled={isSavingDirect}
                onClick={handleDirectSave}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-black shadow-lg shadow-emerald-500/25 transition active:scale-95 flex items-center justify-center gap-2"
              >
                {isSavingDirect ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving to System...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Student to System</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
