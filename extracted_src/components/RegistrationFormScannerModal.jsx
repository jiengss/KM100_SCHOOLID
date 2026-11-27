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
  Info,
  Cpu,
  Cloud,
  ChevronLeft,
  ChevronRight,
  Users
} from 'lucide-react';
import { COURSE_OPTIONS } from '../lib/mockData';
import { parseRegistrationFormText } from '../lib/formParser';
import { extractRegistrationFormWithGemini } from '../lib/geminiService';
import { parseExcelStudentFile } from '../lib/excelService';
import { convertToGoogleDriveDirectImageUrl, isGoogleDriveUrl } from '../lib/driveHelper';
import { generateSmartSchoolId, generateSmartRfidUid, isValidSchoolId } from '../lib/idGenerator';
import { Html5Qrcode } from 'html5-qrcode';

// Canvas preprocessing helper to optimize image for Gemini Vision and prevent memory limits
function preprocessImageForVision(imgElement) {
  const maxDim = 1600;
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

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imgElement, 0, 0, width, height);

  return canvas;
}

// Convert base64 data URL to Blob synchronously without fetch
function dataUrlToBlob(dataUrl) {
  try {
    if (!dataUrl || typeof dataUrl !== 'string') return null;
    const parts = dataUrl.split(',');
    if (parts.length < 2) return null;
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch {
    return null;
  }
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
  const [useDocAsPhoto, setUseDocAsPhoto] = useState(true);
  const [isSavingDirect, setIsSavingDirect] = useState(false);
  const [savedSuccessStudent, setSavedSuccessStudent] = useState(null);
  const [extractedByGemini, setExtractedByGemini] = useState(false);
  const [gdriveInputUrl, setGdriveInputUrl] = useState('');

  // Multi-Student Navigation (for Excel spreadsheets)
  const [excelStudentsList, setExcelStudentsList] = useState([]);
  const [currentExcelStudentIndex, setCurrentExcelStudentIndex] = useState(0);

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

  // Run Gemini Vision AI extraction on the uploaded image
  const processImageWithGemini = async (imageSource, fileName = '') => {
    setIsProcessing(true);
    setProgressStatus('Preparing document for Gemini Vision AI...');
    setProgressPercent(20);
    setErrorMessage('');
    setInfoNotice('');
    setExtractedByGemini(false);

    try {
      // Step 1: Convert input to base64 Data URL
      let imgSrc = '';
      if (typeof imageSource === 'string') {
        imgSrc = imageSource;
      } else if (imageSource instanceof Blob) {
        imgSrc = await new Promise((resolve, reject) => {
          const r = new FileReader();
          r.onload = (e) => resolve(e.target?.result || '');
          r.onerror = (e) => reject(e);
          r.readAsDataURL(imageSource);
        });
      }

      setPreviewImage(imgSrc);

      // Step 2: Preprocess to Canvas to normalize image size & format if possible
      let optimizedDataUrl = imgSrc;
      try {
        const img = new Image();
        // ONLY set crossOrigin on external http/https URLs, NEVER on data: or blob: URLs
        if (typeof imgSrc === 'string' && (imgSrc.startsWith('http://') || imgSrc.startsWith('https://'))) {
          img.crossOrigin = "anonymous";
        }

        await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            console.warn("Canvas preload timed out, proceeding with direct image source");
            resolve();
          }, 2500);

          img.onload = () => {
            clearTimeout(timeout);
            resolve();
          };
          img.onerror = (e) => {
            clearTimeout(timeout);
            console.warn("Canvas preload warning, proceeding with direct image source:", e);
            resolve(); // Proceed with raw image data, do not abort!
          };
          img.src = imgSrc;
        });

        if (img.width && img.height) {
          const processedCanvas = preprocessImageForVision(img);
          optimizedDataUrl = processedCanvas.toDataURL('image/jpeg', 0.88);
        }
      } catch (canvasErr) {
        console.warn("Canvas preprocessing skipped, using raw image data URL:", canvasErr);
        optimizedDataUrl = imgSrc;
      }

      // Step 3: Send to Gemini Vision API (Google Gemini 3.5 Flash)
      setProgressStatus('Analyzing document with Google Gemini 3.5 Vision AI...');
      setProgressPercent(55);

      try {
        const geminiResult = await extractRegistrationFormWithGemini(optimizedDataUrl || imgSrc, existingStudents);
        setProgressStatus('Gemini AI successfully extracted student information...');
        setProgressPercent(95);

        // Ensure School ID is populated and valid (never a URL)
        if (!geminiResult.school_id || !isValidSchoolId(geminiResult.school_id)) {
          geminiResult.school_id = generateSmartSchoolId(existingStudents);
        }

        // Ensure RFID UID is automatically assigned
        if (!geminiResult.rfid_uid || geminiResult.rfid_uid.length > 50) {
          geminiResult.rfid_uid = generateSmartRfidUid(existingStudents);
        }

        // Ensure Photo URL is attached directly
        if (!geminiResult.photo_url) {
          geminiResult.photo_url = imgSrc;
        }

        setExtractedData(geminiResult);
        setUseDocAsPhoto(true);
        setExtractedByGemini(true);
        setIsProcessing(false);
        setProgressPercent(100);
        return;
      } catch (geminiErr) {
        console.warn("Gemini API scan warning:", geminiErr);
        // Fallback: Check for QR Code on the document
        setProgressStatus('Checking for form QR data...');
        setProgressPercent(75);

        let qrText = '';
        try {
          const qrScanner = new Html5Qrcode("form-qr-detector-hidden");
          const blob = dataUrlToBlob(optimizedDataUrl || imgSrc);
          if (blob) {
            const fileObj = new File([blob], "temp_form.jpg", { type: "image/jpeg" });
            qrText = await qrScanner.scanFile(fileObj, false);
          }
          await qrScanner.clear();
        } catch {
          // No QR code found
        }

        const parsed = parseRegistrationFormText(qrText || fileName);
        if (!parsed.school_id || !isValidSchoolId(parsed.school_id)) {
          parsed.school_id = generateSmartSchoolId(existingStudents);
        }
        if (!parsed.rfid_uid) {
          parsed.rfid_uid = generateSmartRfidUid(existingStudents);
        }
        if (!parsed.course_strand) {
          parsed.course_strand = COURSE_OPTIONS[0];
        }
        parsed.photo_url = imgSrc;

        setExtractedData(parsed);
        setUseDocAsPhoto(true);
        setInfoNotice("Document photo loaded! Please review and confirm the student information below to save for School ID.");
        setIsProcessing(false);
        setProgressPercent(100);
      }
    } catch (err) {
      console.warn("Image file reading fallback:", err);
      // Even if file reader had a glitch, open review view with uploaded document if available
      const fallbackParsed = parseRegistrationFormText(fileName || '');
      if (!fallbackParsed.school_id || !isValidSchoolId(fallbackParsed.school_id)) {
        fallbackParsed.school_id = generateSmartSchoolId(existingStudents);
      }
      if (!fallbackParsed.rfid_uid) {
        fallbackParsed.rfid_uid = generateSmartRfidUid(existingStudents);
      }
      if (!fallbackParsed.course_strand) {
        fallbackParsed.course_strand = COURSE_OPTIONS[0];
      }
      fallbackParsed.photo_url = previewImage || '';
      setExtractedData(fallbackParsed);
      setUseDocAsPhoto(true);
      setInfoNotice("Document photo loaded! Please review and verify the student details below to save.");
      setIsProcessing(false);
    }
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
    processImageWithGemini(dataUrl, 'camera_capture.jpg');
  };

  // Handle uploaded Excel spreadsheet
  const handleProcessExcelFile = async (file) => {
    setIsProcessing(true);
    setProgressStatus('Reading Excel file data...');
    setProgressPercent(35);
    setErrorMessage('');
    setInfoNotice('');

    try {
      const result = await parseExcelStudentFile(file, existingStudents);
      if (!result.students || result.students.length === 0) {
        setErrorMessage('No student records found in this Excel sheet. Please make sure First Name and Last Name columns are present.');
        setIsProcessing(false);
        return;
      }

      setProgressStatus('Extracted student records from Excel...');
      setProgressPercent(90);

      // Sanitize each student: ensure valid School ID (never a URL) and automatically create RFID UID
      result.students.forEach((st, idx) => {
        if (!isValidSchoolId(st.school_id)) {
          if (st.school_id && (isGoogleDriveUrl(st.school_id) || st.school_id.startsWith('http'))) {
            if (!st.photo_url) {
              st.photo_url = isGoogleDriveUrl(st.school_id) ? convertToGoogleDriveDirectImageUrl(st.school_id, 800) : st.school_id;
            }
          }
          st.school_id = generateSmartSchoolId(existingStudents, idx);
        }
        if (!st.rfid_uid || st.rfid_uid.length > 50) {
          st.rfid_uid = generateSmartRfidUid(existingStudents, idx);
        }
      });

      setExcelStudentsList(result.students);
      setCurrentExcelStudentIndex(0);

      const firstStudent = result.students[0];
      setExtractedData(firstStudent);
      setExtractedByGemini(false);

      // If the Excel file contains embedded images (e.g. 2x2 photos or document scans), load the photo!
      if (firstStudent.photo_url) {
        setPreviewImage(firstStudent.photo_url);
        setUseDocAsPhoto(true);
      } else if (result.embeddedImages && result.embeddedImages.length > 0) {
        setPreviewImage(result.embeddedImages[0].dataUrl);
        setUseDocAsPhoto(true);
      }

      if (result.students.length > 1) {
        setInfoNotice(`Read Excel file "${result.fileName}" successfully! Loaded student 1 of ${result.students.length} found (with ${result.embeddedImages?.length || 0} embedded images). You can use Prev/Next to review each or save them directly.`);
      } else {
        setInfoNotice(`Read Excel file "${result.fileName}" successfully! Review fields and save.`);
      }

      setIsProcessing(false);
      setProgressPercent(100);
    } catch (err) {
      console.error('Excel parse failed:', err);
      setErrorMessage('Could not read Excel file: ' + (err.message || err));
      setIsProcessing(false);
    }
  };

  // Switch between students when Excel workbook has multiple rows
  const handleSelectExcelStudent = (index) => {
    if (index >= 0 && index < excelStudentsList.length) {
      setCurrentExcelStudentIndex(index);
      const student = excelStudentsList[index];
      setExtractedData(student);
      if (student.photo_url) {
        setPreviewImage(student.photo_url);
        setUseDocAsPhoto(true);
      }
    }
  };

  // Handle Google Drive file link scanning
  const handleScanGoogleDriveUrl = () => {
    if (!gdriveInputUrl.trim()) return;
    setErrorMessage('');
    const cleanUrl = gdriveInputUrl.trim();
    if (!isGoogleDriveUrl(cleanUrl)) {
      setErrorMessage("Please enter a valid Google Drive file URL (e.g. https://drive.google.com/file/d/... or drive.google.com/open?id=...)");
      return;
    }
    const directImageUrl = convertToGoogleDriveDirectImageUrl(cleanUrl, 1400);
    setPreviewImage(directImageUrl);
    processImageWithGemini(directImageUrl, 'gdrive_document.jpg');
  };

  // Handle uploaded form file
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const name = file.name.toLowerCase();
    if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) {
      handleProcessExcelFile(file);
    } else {
      processImageWithGemini(file, file.name);
    }
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

  // Direct Save Student to System (with optional advance to next student)
  const handleDirectSave = async (andAdvanceNext = false) => {
    if (!extractedData) return;
    if (!extractedData.school_id?.trim() || !extractedData.first_name?.trim() || !extractedData.last_name?.trim()) {
      setErrorMessage("Please make sure School ID, First Name, and Last Name are entered.");
      return;
    }

    setIsSavingDirect(true);
    setErrorMessage('');

    try {
      const resolvedPhoto = extractedData.photo_url || previewImage || '';

      let cleanSchoolId = extractedData.school_id?.trim() || '';
      if (!isValidSchoolId(cleanSchoolId)) {
        cleanSchoolId = generateSmartSchoolId(existingStudents);
      }

      let cleanRfidUid = extractedData.rfid_uid?.trim() || '';
      if (!cleanRfidUid || cleanRfidUid.length > 50) {
        cleanRfidUid = generateSmartRfidUid(existingStudents);
      }

      const studentPayload = {
        school_id: cleanSchoolId,
        rfid_uid: cleanRfidUid,
        first_name: extractedData.first_name.trim(),
        middle_name: extractedData.middle_name?.trim() || '',
        last_name: extractedData.last_name.trim(),
        course_strand: extractedData.course_strand || COURSE_OPTIONS[0],
        grade_level: 'N/A',
        section: 'N/A',
        emergency_contact_name: extractedData.emergency_contact_name?.trim() || '',
        emergency_contact_phone: extractedData.emergency_contact_phone?.trim() || '',
        photo_url: resolvedPhoto,
        status: 'ACTIVE',
        blood_type: 'O+'
      };

      if (onSaveStudentDirectly) {
        const saved = await onSaveStudentDirectly(studentPayload);
        if (andAdvanceNext && currentExcelStudentIndex < excelStudentsList.length - 1) {
          // Advance to next student
          handleSelectExcelStudent(currentExcelStudentIndex + 1);
          setInfoNotice(`Saved "${studentPayload.first_name} ${studentPayload.last_name}"! Now reviewing Student ${currentExcelStudentIndex + 2} of ${excelStudentsList.length}.`);
        } else {
          setSavedSuccessStudent(saved || studentPayload);
        }
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
    const resolvedPhoto = extractedData.photo_url || previewImage || '';

    let cleanSchoolId = extractedData.school_id?.trim() || '';
    if (!isValidSchoolId(cleanSchoolId)) {
      cleanSchoolId = generateSmartSchoolId(existingStudents);
    }

    let cleanRfidUid = extractedData.rfid_uid?.trim() || '';
    if (!cleanRfidUid || cleanRfidUid.length > 50) {
      cleanRfidUid = generateSmartRfidUid(existingStudents);
    }

    onApplyData({
      school_id: cleanSchoolId,
      rfid_uid: cleanRfidUid,
      first_name: extractedData.first_name || '',
      middle_name: extractedData.middle_name || '',
      last_name: extractedData.last_name || '',
      course_strand: extractedData.course_strand || COURSE_OPTIONS[0],
      emergency_contact_name: extractedData.emergency_contact_name || '',
      emergency_contact_phone: extractedData.emergency_contact_phone || '',
      photo_url: resolvedPhoto
    });
    onClose();
  };

  const handleResetScan = () => {
    setExtractedData(null);
    setPreviewImage(null);
    setExcelStudentsList([]);
    setCurrentExcelStudentIndex(0);
    setErrorMessage('');
    setInfoNotice('');
    setRawPastedText('');
    setProgressPercent(0);
    setProgressStatus('');
    setSavedSuccessStudent(null);
    setUseDocAsPhoto(true);
    setExtractedByGemini(false);
    setGdriveInputUrl('');
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
                <Eye className="w-4 h-4 text-purple-400" />
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
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/25 flex-shrink-0">
              <Sparkles className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="text-xs sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
                  Scan Registration Form
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400 text-[9px] sm:text-[10px] font-black uppercase">
                  <Cpu className="w-3 h-3 text-purple-500" />
                  Gemini 3.5 AI Vision
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                Powered by Google Gemini 3.5 Flash for high-accuracy document & handwriting recognition
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
                  Student information parsed by Gemini AI has been registered and synced directly to Supabase cloud.
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
                  <div className="w-14 h-14 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black text-base flex-shrink-0">
                    {savedSuccessStudent.first_name?.[0]}{savedSuccessStudent.last_name?.[0]}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-500/20">
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
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-black shadow-lg shadow-purple-500/25 transition flex items-center justify-center gap-2"
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
                      ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm'
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
                      ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Camera</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('gdrive'); setErrorMessage(''); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition active:scale-95 ${
                    activeTab === 'gdrive'
                      ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <Cloud className="w-3.5 h-3.5 text-blue-500" />
                  <span>Google Drive</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('paste'); setErrorMessage(''); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition active:scale-95 ${
                    activeTab === 'paste'
                      ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Paste Text</span>
                </button>
              </div>

              {/* Progress Indicator */}
              {isProcessing && (
                <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 space-y-2.5 animate-pulse">
                  <div className="flex items-center justify-between text-xs font-bold text-purple-700 dark:text-purple-300">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600 animate-spin" />
                      <span className="truncate">{progressStatus || 'Analyzing document with Gemini AI...'}</span>
                    </span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-purple-200 dark:bg-purple-900 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all duration-300 rounded-full"
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
                    accept="image/*, .xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
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
                        const name = file.name.toLowerCase();
                        if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) {
                          handleProcessExcelFile(file);
                        } else {
                          processImageWithGemini(file, file.name);
                        }
                      }
                    }}
                    className="flex flex-col items-center justify-center p-6 sm:p-10 rounded-2xl sm:rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 bg-slate-50/70 hover:bg-purple-50/20 dark:bg-darkbg-950 dark:hover:bg-purple-950/10 cursor-pointer transition group text-center"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                      <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <p className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100">
                      Upload Registration Form, Photo, or Excel File
                    </p>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                      Upload an image file (PNG, JPG, WEBP) or an Excel spreadsheet (.XLSX, .XLS, .CSV). Gemini Vision AI & Excel parser will automatically read the fields.
                    </p>
                    <span className="mt-3 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[11px] sm:text-xs font-bold transition shadow-sm">
                      Browse Files (.PNG, .JPG, .XLSX, .CSV)
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
                    <div className="absolute inset-4 sm:inset-8 border-2 border-dashed border-purple-400/60 rounded-xl sm:rounded-2xl pointer-events-none flex items-center justify-center">
                      <span className="px-2.5 py-1 rounded-full bg-slate-950/80 text-purple-300 font-bold text-[10px] sm:text-[11px] backdrop-blur-md flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-purple-400" />
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
                          className="mt-3 px-3.5 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold shadow"
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
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-black shadow-lg shadow-purple-500/30 transition active:scale-95"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Capture & Analyze with Gemini AI</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: GOOGLE DRIVE LINK */}
              {activeTab === 'gdrive' && !isProcessing && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-start gap-3">
                    <Cloud className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Scan Registration Form or Photo from Google Drive
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Paste a shareable Google Drive link to a student's enrollment form, document scan, or 2x2 ID photo. Google Gemini 3.5 AI Vision will fetch and extract the student details automatically.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Google Drive File Link
                    </label>
                    <div className="relative">
                      <ExternalLink className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="url"
                        value={gdriveInputUrl}
                        onChange={(e) => setGdriveInputUrl(e.target.value)}
                        placeholder="e.g. https://drive.google.com/file/d/1A2B3C4D5E.../view?usp=sharing"
                        className="w-full bg-slate-50 dark:bg-darkbg-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      Tip: Ensure the Google Drive file permission is set to "Anyone with the link can view".
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      disabled={!gdriveInputUrl.trim()}
                      onClick={handleScanGoogleDriveUrl}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-md shadow-blue-500/25 active:scale-95 flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Fetch & Scan with Gemini AI</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: PASTE FORM TEXT */}
              {activeTab === 'paste' && !isProcessing && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Paste Form Text / Online Response
                    </label>
                    <button
                      type="button"
                      onClick={() => setRawPastedText(sampleFormText)}
                      className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
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
                    className="w-full bg-slate-50 dark:bg-darkbg-950 border border-slate-300 dark:border-slate-800 rounded-2xl p-3 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleParsePastedText}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-md shadow-purple-500/25 active:scale-95 flex items-center gap-1.5"
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
                <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    <span>{extractedByGemini ? "Form successfully analyzed by Gemini 3.5 AI Vision!" : "Form read successfully! Review and save for School ID:"}</span>
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

              {/* Multi-Student Navigation Bar (when Excel sheet contains multiple students) */}
              {excelStudentsList.length > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 gap-2.5">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <span className="text-xs font-bold">
                      Student {currentExcelStudentIndex + 1} of {excelStudentsList.length} from Excel File
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 font-black">
                      {extractedData?.first_name} {extractedData?.last_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentExcelStudentIndex === 0}
                      onClick={() => handleSelectExcelStudent(currentExcelStudentIndex - 1)}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 disabled:opacity-40 text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1 hover:bg-slate-50 transition shadow-sm"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev Student</span>
                    </button>
                    <button
                      type="button"
                      disabled={currentExcelStudentIndex >= excelStudentsList.length - 1}
                      onClick={() => handleSelectExcelStudent(currentExcelStudentIndex + 1)}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 disabled:opacity-40 text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1 hover:bg-slate-50 transition shadow-sm"
                    >
                      <span>Next Student</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
                          <Eye className="w-3.5 h-3.5 text-purple-500" />
                          Uploaded Document
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsEnlargedPreviewOpen(true)}
                          className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
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
                          className="w-3.5 h-3.5 rounded text-purple-600 border-slate-300 dark:border-slate-700 focus:ring-purple-500"
                        />
                        <span>Use uploaded photo as Student ID photo</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Form Fields Column (7 cols on desktop, or 12 if no preview) */}
                <div className={`${previewImage ? 'lg:col-span-7' : 'lg:col-span-12'} p-4 rounded-2xl bg-slate-50 dark:bg-darkbg-950 border border-slate-200 dark:border-slate-800 space-y-3.5`}>
                  {/* School ID & RFID UID Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* School ID Field */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Official School ID <span className="text-red-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setExtractedData({
                            ...extractedData,
                            school_id: generateSmartSchoolId(existingStudents)
                          })}
                          className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                          title="Generate a new sequential School ID"
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                          <span>Regenerate</span>
                        </button>
                      </div>
                      <div className="relative">
                        <CreditCard className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={extractedData.school_id || ''}
                          onChange={(e) => setExtractedData({ ...extractedData, school_id: e.target.value })}
                          placeholder="e.g. 2026-00001"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs font-mono font-bold text-purple-600 dark:text-purple-400 focus:outline-none focus:border-purple-500 shadow-sm"
                        />
                      </div>
                    </div>

                    {/* Assigned RFID UID Field */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Assigned RFID UID
                        </label>
                        <button
                          type="button"
                          onClick={() => setExtractedData({
                            ...extractedData,
                            rfid_uid: generateSmartRfidUid(existingStudents)
                          })}
                          className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                          title="Generate a new RFID UID"
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                          <span>Regenerate</span>
                        </button>
                      </div>
                      <div className="relative">
                        <QrCode className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={extractedData.rfid_uid || ''}
                          onChange={(e) => setExtractedData({ ...extractedData, rfid_uid: e.target.value })}
                          placeholder="e.g. RFID-2026-00001"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none focus:border-indigo-500 shadow-sm"
                        />
                      </div>
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
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 shadow-sm"
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
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 shadow-sm"
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
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 shadow-sm"
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
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 shadow-sm"
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
                        <span>Parent / Guardian Name</span>
                        {extractedData.emergency_contact_name && <Check className="w-2.5 h-2.5 text-emerald-500" />}
                      </label>
                      <input
                        type="text"
                        value={extractedData.emergency_contact_name || ''}
                        onChange={(e) => setExtractedData({ ...extractedData, emergency_contact_name: e.target.value })}
                        placeholder="e.g. Helen"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                        <span>Emergency Contact Number</span>
                        {extractedData.emergency_contact_phone && <Check className="w-2.5 h-2.5 text-emerald-500" />}
                      </label>
                      <input
                        type="text"
                        value={extractedData.emergency_contact_phone || ''}
                        onChange={(e) => setExtractedData({ ...extractedData, emergency_contact_phone: e.target.value })}
                        placeholder="e.g. 12345678891"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 shadow-sm"
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

              {excelStudentsList.length > 1 && currentExcelStudentIndex < excelStudentsList.length - 1 && (
                <button
                  type="button"
                  disabled={isSavingDirect}
                  onClick={() => handleDirectSave(true)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/20 active:scale-95"
                  title="Save current student and load the next student from Excel"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save & Next Student</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                disabled={isSavingDirect}
                onClick={() => handleDirectSave(false)}
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
