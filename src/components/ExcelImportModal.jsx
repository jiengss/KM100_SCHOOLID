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
  FileText
} from 'lucide-react';
import { parseExcelStudentFile, downloadSampleExcelTemplate } from '../lib/excelService';
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
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndices, setSelectedIndices] = useState(new Set());
  
  // Import Execution State
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatusText, setImportStatusText] = useState('');
  const [importSuccessCount, setImportSuccessCount] = useState(null);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleProcessFile = async (uploadedFile) => {
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
      const result = await parseExcelStudentFile(uploadedFile, existingStudents);
      if (!result.students || result.students.length === 0) {
        setErrorMessage('No student records could be identified in this Excel sheet. Please make sure columns for First Name and Last Name are present.');
        setParsedData(null);
      } else {
        setParsedData(result);
        // By default select all valid parsed students
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
        
        if (onBatchAddStudents) {
          await onBatchAddStudents(student);
        }

        importedCount++;
        setImportProgress(Math.round(((i + 1) / total) * 100));
      }

      setImportSuccessCount(importedCount);
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch {
        // Confetti optional
      }
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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Filtered rows for preview search
  const filteredStudents = parsedData?.students.map((s, originalIndex) => ({ s, originalIndex }))
    .filter(({ s }) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        s.first_name?.toLowerCase().includes(term) ||
        s.last_name?.toLowerCase().includes(term) ||
        s.school_id?.toLowerCase().includes(term) ||
        s.course_strand?.toLowerCase().includes(term)
      );
    }) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-4xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[92vh] transition-all">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-darkbg-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 flex-shrink-0">
              <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
                  Import Students from Excel Spreadsheet
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase">
                  .XLSX • .XLS • .CSV
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                Reads student rosters and saves them directly to the KM100 database
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
                  All records from <span className="font-bold text-slate-700 dark:text-slate-300">{parsedData?.fileName}</span> have been saved and assigned School IDs in the system.
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
                  Upload <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">.xlsx</span>, <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">.xls</span>, or <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">.csv</span> containing student enrollment rosters.
                </p>
                <span className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Browse Excel Files</span>
                </span>
              </div>

              {isParsing && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-3 text-xs font-bold text-emerald-700 dark:text-emerald-300 animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>Reading Excel worksheets and mapping student columns...</span>
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
                      Download our pre-formatted spreadsheet template with official NC II course columns.
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
            /* STATE 3: PREVIEW & CONFIRM IMPORT DATA                   */
            /* ======================================================== */
            <div className="space-y-4 animate-fade-in">
              {/* Summary Bar */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900 dark:text-white truncate max-w-xs">
                        {parsedData.fileName}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-black">
                        {parsedData.students.length} Students Detected
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      {selectedIndices.size} of {parsedData.students.length} selected for import
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
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

              {/* Search Within Preview */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter preview by student name, ID, or course..."
                  className="w-full bg-slate-50 dark:bg-darkbg-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
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

              {/* Preview Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-72 sm:max-h-80 overflow-y-auto">
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
                      <th className="p-3">School ID</th>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Technology Course</th>
                      <th className="p-3">Emergency Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredStudents.map(({ s, originalIndex }) => {
                      const isSelected = selectedIndices.has(originalIndex);
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
                          <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            {s.school_id}
                          </td>
                          <td className="p-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            {s.first_name} {s.middle_name ? `${s.middle_name} ` : ''}{s.last_name}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                            {s.course_strand}
                          </td>
                          <td className="p-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {s.emergency_contact_name || s.emergency_contact_phone ? (
                              <span>{s.emergency_contact_name} {s.emergency_contact_phone ? `(${s.emergency_contact_phone})` : ''}</span>
                            ) : (
                              <span className="text-slate-400 italic">None provided</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
