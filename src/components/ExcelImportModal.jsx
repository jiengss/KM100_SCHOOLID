import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Download, 
  RefreshCw, 
  Check, 
  ArrowRight, 
  Users, 
  Database, 
  Trash2, 
  Search, 
  Sparkles,
  FileText,
  Table,
  Eye,
  Edit2,
  CheckSquare,
  Square,
  Layers,
  ChevronDown,
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react';
import { parseExcelStudentFile, downloadSampleExcelTemplate } from '../lib/excelService';
import { generateSmartSchoolId, generateSmartRfidUid, isValidSchoolId } from '../lib/idGenerator';
import { COURSE_OPTIONS } from '../lib/mockData';
import confetti from 'canvas-confetti';

export default function ExcelImportModal({
  isOpen,
  onClose,
  onBatchAddStudents,
  existingStudents = [],
  isSupabaseConfigured = false
}) {
  const [file, setFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [activeViewMode, setActiveViewMode] = useState('mapped'); // 'mapped' | 'raw'
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndices, setSelectedIndices] = useState(new Set());
  
  // Inline editing state for preview
  const [editingIndex, setEditingIndex] = useState(null);
  const [editRowData, setEditRowData] = useState({});

  // Import Execution State
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatusText, setImportStatusText] = useState('');
  const [importSuccessCount, setImportSuccessCount] = useState(null);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleProcessFile = async (uploadedFile, targetSheet = null) => {
    if (!uploadedFile) return;
    const name = uploadedFile.name.toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls') && !name.endsWith('.csv')) {
      setErrorMessage('Please upload a valid Excel spreadsheet (.xlsx, .xls, or .csv).');
      return;
    }

    setErrorMessage('');
    setIsParsing(true);
    setFile(uploadedFile);

    try {
      const result = await parseExcelStudentFile(uploadedFile, existingStudents, targetSheet);
      if (!result.students || result.students.length === 0) {
        setErrorMessage('No student records could be identified in this Excel sheet. Please make sure columns for Student Name or First Name and Last Name are present.');
        setParsedData(null);
      } else {
        setParsedData(result);
        setSelectedIndices(new Set(result.students.map((_, i) => i)));
      }
    } catch (err) {
      console.error('Error parsing Excel:', err);
      setErrorMessage('Failed to read Excel file: ' + (err.message || 'Corrupted or unsupported format.'));
      setParsedData(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) handleProcessFile(f);
  };

  const handleSheetChange = (sheetName) => {
    if (file && sheetName) {
      handleProcessFile(file, sheetName);
    }
  };

  const handleToggleSelectAll = () => {
    if (!parsedData) return;
    if (selectedIndices.size === parsedData.students.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(parsedData.students.map((_, i) => i)));
    }
  };

  const handleToggleRow = (index) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleStartEdit = (index, student) => {
    setEditingIndex(index);
    setEditRowData({ ...student });
  };

  const handleSaveEdit = (index) => {
    if (!parsedData) return;
    const updated = [...parsedData.students];
    updated[index] = { ...editRowData };
    setParsedData({ ...parsedData, students: updated });
    setEditingIndex(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditRowData({});
  };

  const handleExecuteImport = async () => {
    if (!parsedData || selectedIndices.size === 0) return;
    const studentsToImport = parsedData.students.filter((_, i) => selectedIndices.has(i));

    setIsImporting(true);
    setImportProgress(0);
    setErrorMessage('');

    try {
      let importedCount = 0;
      const total = studentsToImport.length;

      for (let i = 0; i < total; i++) {
        const student = studentsToImport[i];
        setImportStatusText(`Saving ${student.first_name} ${student.last_name} (${i + 1}/${total})...`);
        
        let schoolId = student.school_id?.trim() || '';
        if (!isValidSchoolId(schoolId)) {
          schoolId = generateSmartSchoolId(existingStudents, i);
        }
        let rfidUid = student.rfid_uid?.trim() || '';
        if (!rfidUid || rfidUid.length > 50) {
          rfidUid = generateSmartRfidUid(existingStudents, i);
        }

        if (onBatchAddStudents) {
          await onBatchAddStudents({
            school_id: schoolId,
            first_name: student.first_name,
            middle_name: student.middle_name,
            last_name: student.last_name,
            course_strand: student.course_strand,
            grade_level: student.grade_level || 'N/A',
            section: student.section || 'N/A',
            emergency_contact_name: student.emergency_contact_name || '',
            emergency_contact_phone: student.emergency_contact_phone || '',
            rfid_uid: rfidUid,
            blood_type: student.blood_type || 'O+',
            status: student.status || 'ACTIVE',
            photo_url: student.photo_url || ''
          });
        }

        importedCount++;
        setImportProgress(Math.round(((i + 1) / total) * 100));
      }

      setImportSuccessCount(importedCount);
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch {}
    } catch (err) {
      console.error('Import error:', err);
      setErrorMessage('Import was interrupted: ' + (err.message || err));
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedData(null);
    setErrorMessage('');
    setSelectedIndices(new Set());
    setImportProgress(0);
    setImportStatusText('');
    setImportSuccessCount(null);
    setEditingIndex(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Filtered rows for mapped preview search
  const filteredStudents = parsedData?.students.map((s, originalIndex) => ({ s, originalIndex }))
    .filter(({ s }) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        s.first_name?.toLowerCase().includes(term) ||
        s.last_name?.toLowerCase().includes(term) ||
        s.school_id?.toLowerCase().includes(term) ||
        s.course_strand?.toLowerCase().includes(term) ||
        s.raw_course?.toLowerCase().includes(term)
      );
    }) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-5xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[92vh] transition-all">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-darkbg-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 flex-shrink-0">
              <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
                  Import Students from Excel File
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase">
                  Accurate Excel Reader
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                Detects title blocks, extracts exact file contents, and imports records into KM100
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-200/70 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition flex-shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* ======================================================== */}
          {/* STATE 1: SUCCESSFUL IMPORT SUMMARY                       */}
          {/* ======================================================== */}
          {importSuccessCount !== null ? (
            <div className="p-6 text-center space-y-4 animate-scale-in">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">
                  Successfully Imported {importSuccessCount} Students!
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  All records from <span className="font-bold text-slate-700 dark:text-slate-300">{parsedData?.fileName}</span> have been saved into the database with official School IDs.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-500/25 transition flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  <span>View Student Directory</span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Import Another File</span>
                </button>
              </div>
            </div>
          ) : !parsedData ? (
            /* ======================================================== */
            /* STATE 2: UPLOAD EXCEL FILE & TEMPLATE DOWNLOAD           */
            /* ======================================================== */
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Upload Drop Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleProcessFile(f);
                }}
                className="flex flex-col items-center justify-center p-8 sm:p-12 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-slate-50/70 hover:bg-emerald-50/20 dark:bg-darkbg-950 dark:hover:bg-emerald-950/10 cursor-pointer transition group text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  Select or Drag & Drop Excel File
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                  Upload <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">.xlsx</span>, <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">.xls</span>, or <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">.csv</span>. Title blocks and custom header rows are automatically detected!
                </p>
                <span className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Browse Excel Files</span>
                </span>
              </div>

              {isParsing && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-3 text-xs font-bold text-emerald-700 dark:text-emerald-300 animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>Scanning Excel worksheets, detecting header rows, and extracting photos...</span>
                </div>
              )}

              {/* Template Download Card */}
              <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-darkbg-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      Need the standard KM100 Excel Template?
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Download our pre-formatted spreadsheet template with NC II course names and Google Drive photo columns.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={downloadSampleExcelTemplate}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-blue-500" />
                  <span>Download .XLSX Template</span>
                </button>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          ) : (
            /* ======================================================== */
            /* STATE 3: PREVIEW & EXACT FILE DISPLAY                    */
            /* ======================================================== */
            <div className="space-y-4 animate-fade-in">
              {/* File Summary & Sheet Switcher */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-slate-900 dark:text-white truncate max-w-xs">
                        {parsedData.fileName}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-black">
                        {parsedData.students.length} Students Detected
                      </span>
                      {parsedData.embeddedImages && parsedData.embeddedImages.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[10px] font-black flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />
                          <span>{parsedData.embeddedImages.length} Embedded Photos</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>Header row: Line {parsedData.headerRowIndex}</span>
                      <span>•</span>
                      <span>{selectedIndices.size} selected for import</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Worksheet Selector if file has multiple sheets */}
                  {parsedData.sheetNames && parsedData.sheetNames.length > 1 && (
                    <div className="relative">
                      <select
                        value={parsedData.selectedSheetName}
                        onChange={(e) => handleSheetChange(e.target.value)}
                        className="appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-3 pr-7 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                      >
                        {parsedData.sheetNames.map((sheet) => (
                          <option key={sheet} value={sheet}>
                            Sheet: {sheet}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-50 transition"
                  >
                    {selectedIndices.size === parsedData.students.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold hover:text-slate-900 dark:hover:text-white transition"
                  >
                    Change File
                  </button>
                </div>
              </div>

              {/* View Mode Tabs: Mapped System Records vs Exact Raw File Content */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-darkbg-950 rounded-xl border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveViewMode('mapped')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      activeViewMode === 'mapped'
                        ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Mapped Student Directory ({parsedData.students.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveViewMode('raw')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      activeViewMode === 'raw'
                        ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>Exact Raw File ({parsedData.rawHeaders.length} Columns)</span>
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search file by name, ID, or course..."
                    className="w-full bg-slate-50 dark:bg-darkbg-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Progress Bar during Batch Import */}
              {isImporting && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                      <span>{importStatusText || 'Importing students into database...'}</span>
                    </span>
                    <span>{importProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-emerald-200 dark:bg-emerald-900 overflow-hidden">
                    <div 
                      className="h-full bg-emerald-600 transition-all duration-200 rounded-full"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* VIEW 1: MAPPED SYSTEM PREVIEW TABLE */}
              {activeViewMode === 'mapped' && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-80 sm:max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 sticky top-0 z-10 text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIndices.size === parsedData.students.length}
                            onChange={handleToggleSelectAll}
                            className="w-3.5 h-3.5 rounded text-emerald-600"
                          />
                        </th>
                        <th className="p-3 w-12 text-center">Photo</th>
                        <th className="p-3">School ID</th>
                        <th className="p-3">Student Name</th>
                        <th className="p-3">Technology Course (NC II)</th>
                        <th className="p-3">Emergency Contact</th>
                        <th className="p-3 w-12 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {filteredStudents.map(({ s, originalIndex }) => {
                        const isSelected = selectedIndices.has(originalIndex);
                        const isEditingThis = editingIndex === originalIndex;

                        if (isEditingThis) {
                          return (
                            <tr key={originalIndex} className="bg-blue-50/50 dark:bg-blue-950/20">
                              <td className="p-3 text-center">
                                <span className="text-[10px] font-bold text-slate-400">#{s.row_index}</span>
                              </td>
                              <td className="p-2 text-center">
                                {editRowData.photo_url ? (
                                  <img src={editRowData.photo_url} alt="" className="w-8 h-8 rounded-lg object-cover mx-auto" />
                                ) : (
                                  <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 text-[10px] font-bold flex items-center justify-center mx-auto">Photo</div>
                                )}
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={editRowData.school_id}
                                  onChange={(e) => setEditRowData({ ...editRowData, school_id: e.target.value })}
                                  className="w-24 bg-white dark:bg-slate-900 border rounded px-2 py-1 text-xs font-mono font-bold"
                                />
                              </td>
                              <td className="p-2">
                                <div className="flex gap-1">
                                  <input
                                    type="text"
                                    value={editRowData.first_name}
                                    placeholder="First Name"
                                    onChange={(e) => setEditRowData({ ...editRowData, first_name: e.target.value })}
                                    className="w-24 bg-white dark:bg-slate-900 border rounded px-1.5 py-1 text-xs"
                                  />
                                  <input
                                    type="text"
                                    value={editRowData.last_name}
                                    placeholder="Last Name"
                                    onChange={(e) => setEditRowData({ ...editRowData, last_name: e.target.value })}
                                    className="w-24 bg-white dark:bg-slate-900 border rounded px-1.5 py-1 text-xs font-bold"
                                  />
                                </div>
                              </td>
                              <td className="p-2">
                                <select
                                  value={editRowData.course_strand}
                                  onChange={(e) => setEditRowData({ ...editRowData, course_strand: e.target.value })}
                                  className="bg-white dark:bg-slate-900 border rounded px-2 py-1 text-xs"
                                >
                                  {COURSE_OPTIONS.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={editRowData.emergency_contact_name}
                                  placeholder="Emergency Contact"
                                  onChange={(e) => setEditRowData({ ...editRowData, emergency_contact_name: e.target.value })}
                                  className="w-32 bg-white dark:bg-slate-900 border rounded px-1.5 py-1 text-xs"
                                />
                              </td>
                              <td className="p-2 text-center">
                                <div className="flex items-center gap-1 justify-center">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEdit(originalIndex)}
                                    className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-500"
                                    title="Save"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="p-1 rounded bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                                    title="Cancel"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr 
                            key={originalIndex}
                            onClick={() => handleToggleRow(originalIndex)}
                            className={`cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                              isSelected ? 'bg-emerald-500/5' : 'opacity-60'
                            }`}
                          >
                            <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleRow(originalIndex)}
                                className="w-3.5 h-3.5 rounded text-emerald-600 cursor-pointer"
                              />
                            </td>
                            <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                              {s.photo_url ? (
                                <div className="relative inline-block">
                                  <img
                                    src={s.photo_url}
                                    alt="Student"
                                    className="w-8 h-8 rounded-lg object-cover mx-auto border border-slate-300 dark:border-slate-700 shadow-sm"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                  {s.photo_source_type === 'excel_embedded' && (
                                    <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-white dark:border-slate-900" title="Embedded in Excel" />
                                  )}
                                  {s.photo_source_type === 'gdrive' && (
                                    <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border border-white dark:border-slate-900" title="Google Drive Link" />
                                  )}
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center text-[10px] font-bold mx-auto border border-slate-300 dark:border-slate-700">
                                  {s.first_name?.[0]}{s.last_name?.[0]}
                                </div>
                              )}
                            </td>
                            <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span>{s.school_id}</span>
                                {s.is_id_generated && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-500/10 text-blue-500 border border-blue-500/20 font-sans font-medium">
                                    Auto
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                              {s.first_name} {s.middle_name ? `${s.middle_name} ` : ''}{s.last_name}
                            </td>
                            <td className="p-3 text-slate-700 dark:text-slate-300 max-w-xs">
                              <div>
                                <span className="font-semibold">{s.course_strand}</span>
                                {s.raw_course && s.raw_course !== s.course_strand && (
                                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 truncate" title={`Original Excel value: ${s.raw_course}`}>
                                    File: {s.raw_course}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              {s.emergency_contact_name || s.emergency_contact_phone ? (
                                <div>
                                  <span className="font-medium text-slate-800 dark:text-slate-200">{s.emergency_contact_name}</span>
                                  {s.emergency_contact_phone && (
                                    <span className="block text-[10px] font-mono text-slate-500">{s.emergency_contact_phone}</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">None</span>
                              )}
                            </td>
                            <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => handleStartEdit(originalIndex, s)}
                                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-800 dark:hover:text-white transition"
                                title="Edit this row before importing"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* VIEW 2: EXACT RAW FILE SPREADSHEET TABLE */}
              {activeViewMode === 'raw' && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-80 sm:max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 sticky top-0 z-10 text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-3 w-10 text-center font-mono">#</th>
                        {parsedData.rawHeaders.map((header, hIdx) => (
                          <th key={hIdx} className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-[11px]">
                      {parsedData.rawRows.map((rowObj, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-2.5 text-center text-slate-400 font-bold bg-slate-50 dark:bg-darkbg-950/40">
                            {rIdx + 1}
                          </td>
                          {parsedData.rawHeaders.map((header, cIdx) => (
                            <td key={cIdx} className="p-2.5 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                              {rowObj[header] !== undefined && rowObj[header] !== '' ? (
                                isGoogleDriveUrl(String(rowObj[header])) ? (
                                  <span className="text-blue-500 underline flex items-center gap-1">
                                    <span>Google Drive Link</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </span>
                                ) : (
                                  String(rowObj[header])
                                )
                              ) : (
                                <span className="text-slate-400/50 italic">—</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

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
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-darkbg-950/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition order-2 sm:order-1"
          >
            {importSuccessCount !== null ? 'Done' : 'Cancel'}
          </button>

          {parsedData && importSuccessCount === null && (
            <div className="w-full sm:w-auto flex items-center justify-end gap-2 order-1 sm:order-2">
              <button
                type="button"
                disabled={isImporting || selectedIndices.size === 0}
                onClick={handleExecuteImport}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-black shadow-lg shadow-emerald-500/25 transition active:scale-95 flex items-center justify-center gap-2"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Importing into Database...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    <span>Import {selectedIndices.size} Students to System</span>
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
