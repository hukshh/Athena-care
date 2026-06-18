import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  Upload, FileText, Brain, CheckCircle, AlertTriangle,
  Pill, Activity, Trash2, Loader, ChevronDown, ChevronUp,
  Zap, XCircle, ShieldCheck, ShieldX, RefreshCw, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import AppLayout from '../../components/layout/AppLayout';
import { reportsAPI } from '../../services/api';

const STATUS_CONFIG = {
  processing: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: Loader, label: 'Analyzing...' },
  analyzed:   { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: ShieldCheck, label: 'Validated' },
  rejected:   { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: ShieldX, label: 'Rejected' },
  failed:     { color: 'text-slate-400', bg: 'bg-slate-800/50 border-slate-700/50', icon: AlertTriangle, label: 'Failed' },
};

const ConfidenceBadge = ({ confidence }) => {
  const pct = Math.round((confidence || 0) * 100);
  const color = pct >= 85 ? 'text-emerald-400' : pct >= 65 ? 'text-amber-400' : 'text-red-400';
  return (
    <span className={`text-xs font-medium ${color}`}>
      {pct}% confidence
    </span>
  );
};

const RejectionBanner = ({ report }) => (
  <motion.div
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
  >
    <div className="flex items-start gap-3">
      <ShieldX className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
      <div>
        <div className="text-red-400 font-semibold text-sm mb-1">
          ⚠ Non-Medical Document Detected
        </div>
        <div className="text-red-300/80 text-xs leading-relaxed">
          {report.rejection_message || 'This file does not appear to be a valid medical report.'}
        </div>
        {report.detected_non_medical_indicators?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            <span className="text-red-500/70 text-xs">Detected:</span>
            {report.detected_non_medical_indicators.slice(0, 4).map((ind, i) => (
              <span key={i} className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full">{ind}</span>
            ))}
          </div>
        )}
        <div className="mt-2 text-red-400/60 text-xs">
          Please upload a valid medical document such as a blood test report, MRI scan, prescription, or discharge summary.
        </div>
      </div>
    </div>
  </motion.div>
);

const ReportCard = ({ report, onDelete, onRefresh }) => {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[report.status] || STATUS_CONFIG.failed;
  const StatusIcon = status.icon;
  const isProcessing = report.status === 'processing';
  const isRejected = report.status === 'rejected';
  const isAnalyzed = report.status === 'analyzed';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card overflow-hidden border ${isRejected ? 'border-red-500/20' : isAnalyzed ? 'border-emerald-500/10' : ''}`}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* File icon */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isRejected ? 'bg-red-500/20' : isAnalyzed ? 'bg-emerald-500/20' : 'bg-sky-500/20'
          }`}>
            {isRejected
              ? <XCircle className="w-5 h-5 text-red-400" />
              : isAnalyzed
              ? <ShieldCheck className="w-5 h-5 text-emerald-400" />
              : <FileText className="w-5 h-5 text-sky-400" />
            }
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-white font-semibold text-sm truncate">{report.original_name || report.name}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {/* Document type badge */}
                  {report.document_type && (
                    <span className={`badge text-xs ${isRejected ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'badge-blue'}`}>
                      {report.document_type}
                    </span>
                  )}
                  <span className="text-slate-500 text-xs">
                    {report.created_at
                      ? new Date(report.created_at).toLocaleDateString()
                      : report.uploadedAt || ''}
                  </span>
                </div>
              </div>

              {/* Status + actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${status.bg} ${status.color}`}>
                  <StatusIcon className={`w-3 h-3 ${isProcessing ? 'animate-spin' : ''}`} />
                  {status.label}
                </div>
                {isProcessing && (
                  <button onClick={() => onRefresh(report.id)} className="text-slate-500 hover:text-sky-400 transition-colors">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => onDelete(report.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Confidence score */}
            {report.classification_confidence > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 bg-slate-800 rounded-full h-1">
                  <div
                    className={`h-1 rounded-full transition-all duration-700 ${isRejected ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.round(report.classification_confidence * 100)}%` }}
                  />
                </div>
                <ConfidenceBadge confidence={report.classification_confidence} />
              </div>
            )}

            {/* Rejection banner */}
            {isRejected && <RejectionBanner report={report} />}

            {/* Medical summary (only for validated reports) */}
            {isAnalyzed && report.summary && (
              <div className="mt-3 p-3 bg-slate-800/50 rounded-xl">
                <p className="text-slate-300 text-xs leading-relaxed">{report.summary}</p>
              </div>
            )}

            {/* Match score (only for validated reports) */}
            {isAnalyzed && (
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                  <span className="text-slate-400 text-xs">
                    AI Match Score: <span className="text-emerald-400 font-semibold">{report.match_score}%</span>
                  </span>
                </div>
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-sky-400 text-xs flex items-center gap-1 hover:text-sky-300 ml-auto"
                >
                  {expanded ? 'Less' : 'Full Analysis'}
                  {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded analysis — ONLY for validated medical reports */}
      <AnimatePresence>
        {expanded && isAnalyzed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-800/50 overflow-hidden"
          >
            <div className="p-5 grid md:grid-cols-3 gap-4">
              {/* Abnormal Values */}
              <div>
                <h4 className="text-red-400 text-xs font-semibold mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Abnormal Values
                </h4>
                {report.abnormal_values?.length > 0 ? (
                  <ul className="space-y-1">
                    {report.abnormal_values.map((item, i) => (
                      <li key={i} className="text-slate-400 text-xs flex items-start gap-1.5">
                        <span className="text-red-400 mt-0.5 flex-shrink-0">•</span> {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-600 text-xs">No abnormal values detected</p>
                )}
              </div>

              {/* Normal Values */}
              <div>
                <h4 className="text-emerald-400 text-xs font-semibold mb-2 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Normal Values
                </h4>
                {report.normal_values?.length > 0 ? (
                  <ul className="space-y-1">
                    {report.normal_values.map((item, i) => (
                      <li key={i} className="text-slate-400 text-xs flex items-start gap-1.5">
                        <span className="text-emerald-400 mt-0.5 flex-shrink-0">•</span> {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-600 text-xs">No normal values extracted</p>
                )}
              </div>

              {/* Medications & Conditions */}
              <div>
                {report.medications?.length > 0 && (
                  <>
                    <h4 className="text-violet-400 text-xs font-semibold mb-2 flex items-center gap-1">
                      <Pill className="w-3 h-3" /> Medications
                    </h4>
                    <ul className="space-y-1 mb-3">
                      {report.medications.map((med, i) => (
                        <li key={i} className="text-slate-400 text-xs flex items-start gap-1.5">
                          <span className="text-violet-400 mt-0.5 flex-shrink-0">•</span> {med}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {report.conditions?.length > 0 && (
                  <>
                    <h4 className="text-amber-400 text-xs font-semibold mb-2 flex items-center gap-1">
                      <Activity className="w-3 h-3" /> Conditions
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {report.conditions.map((c, i) => (
                        <span key={i} className="badge-yellow text-xs">{c}</span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const ReportAnalyzerPage = () => {
  const [reports, setReports] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingReports, setLoadingReports] = useState(true);

  // Load existing reports on mount
  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoadingReports(true);
    try {
      const res = await reportsAPI.getAll();
      setReports(res.data?.reports || []);
    } catch (err) {
      // Backend might not be running — show empty state
      setReports([]);
    } finally {
      setLoadingReports(false);
    }
  };

  const refreshReport = async (reportId) => {
    try {
      const res = await reportsAPI.getById(reportId);
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, ...res.data } : r))
      );
    } catch { /* ignore */ }
  };

  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      toast.error('Invalid file type. Please upload PDF, JPG, PNG, or TIFF files.');
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error('File size must be under 20MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 85) { clearInterval(progressInterval); return 85; }
        return prev + 15;
      });
    }, 200);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await reportsAPI.upload(formData);
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploading(false);
      setAnalyzing(true);

      // Add placeholder to list
      const placeholder = {
        id: res.data.id,
        original_name: file.name,
        status: 'processing',
        created_at: new Date().toISOString(),
        classification_confidence: 0,
      };
      setReports((prev) => [placeholder, ...prev]);

      toast.success('File uploaded. AI validation in progress...');

      // Poll for result
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        try {
          const updated = await reportsAPI.getById(res.data.id);
          const report = updated.data;
          if (report.status !== 'processing') {
            clearInterval(poll);
            setAnalyzing(false);
            setReports((prev) =>
              prev.map((r) => (r.id === res.data.id ? report : r))
            );
            if (report.status === 'analyzed') {
              toast.success(`✅ Medical report validated: ${report.document_type}`);
            } else if (report.status === 'rejected') {
              toast.error(`⚠ Not a medical document: ${report.document_type}`);
            }
          }
        } catch { /* ignore poll errors */ }
        if (attempts >= 20) {
          clearInterval(poll);
          setAnalyzing(false);
        }
      }, 3000);

    } catch (error) {
      clearInterval(progressInterval);
      setUploading(false);
      setAnalyzing(false);
      const msg = error.response?.data?.detail || 'Upload failed. Please try again.';
      toast.error(msg);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/tiff': ['.tiff', '.tif'],
    },
    maxFiles: 1,
    disabled: uploading || analyzing,
  });

  const handleDelete = async (id) => {
    try {
      await reportsAPI.delete(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
      toast.success('Report deleted');
    } catch {
      toast.error('Failed to delete report');
    }
  };

  const validatedCount = reports.filter((r) => r.status === 'analyzed').length;
  const rejectedCount = reports.filter((r) => r.status === 'rejected').length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Medical Report Analyzer</h1>
            <p className="text-slate-400 text-sm mt-1">
              AI-powered OCR + NLP analysis · Only genuine medical documents accepted
            </p>
          </div>
          <div className="flex items-center gap-2">
            {validatedCount > 0 && (
              <span className="badge-green flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> {validatedCount} Validated
              </span>
            )}
            {rejectedCount > 0 && (
              <span className="badge-red flex items-center gap-1">
                <ShieldX className="w-3 h-3" /> {rejectedCount} Rejected
              </span>
            )}
          </div>
        </div>

        {/* Validation Info Banner */}
        <div className="bg-sky-500/5 border border-sky-500/20 rounded-2xl p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sky-400 font-medium text-sm">Intelligent Document Validation</div>
            <div className="text-slate-400 text-xs mt-0.5">
              Our AI classifier validates every upload before analysis. Non-medical documents (invoices, tickets, IDs) are automatically rejected. Only genuine medical reports receive AI analysis.
            </div>
          </div>
        </div>

        {/* Upload Zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
            uploading || analyzing ? 'opacity-50 cursor-not-allowed' :
            isDragActive ? 'border-sky-500 bg-sky-500/10' :
            'border-slate-700 hover:border-sky-500/50 hover:bg-slate-800/30'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
              isDragActive ? 'bg-sky-500/20' : 'bg-slate-800'
            }`}>
              <Upload className={`w-8 h-8 ${isDragActive ? 'text-sky-400' : 'text-slate-500'}`} />
            </div>
            <div>
              <p className="text-white font-semibold text-lg">
                {isDragActive ? 'Drop your medical report here' : 'Upload Medical Report'}
              </p>
              <p className="text-slate-400 text-sm mt-1">
                Drag & drop or click · PDF, JPG, PNG, TIFF · Max 20MB
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {['Blood Reports', 'MRI/CT Scan', 'X-Ray', 'Prescriptions', 'Lab Results', 'Discharge Summary', 'ECG/ECHO', 'Pathology'].map((t) => (
                <span key={t} className="badge-blue text-xs">{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Upload/Analyze Progress */}
        <AnimatePresence>
          {(uploading || analyzing) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-card p-5"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-sky-500/20 rounded-xl flex items-center justify-center">
                  {analyzing
                    ? <Brain className="w-5 h-5 text-sky-400 animate-pulse" />
                    : <Loader className="w-5 h-5 text-sky-400 animate-spin" />
                  }
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium text-sm">
                    {analyzing ? 'AI Validating & Analyzing...' : `Uploading... ${uploadProgress}%`}
                  </div>
                  <div className="text-slate-400 text-xs mt-0.5">
                    {analyzing
                      ? 'Classifying document → Extracting text → Running NLP pipeline...'
                      : 'Securely uploading your file'}
                  </div>
                  {!analyzing && (
                    <div className="mt-2 bg-slate-800 rounded-full h-1.5">
                      <motion.div
                        className="bg-sky-500 h-1.5 rounded-full"
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  )}
                </div>
              </div>
              {analyzing && (
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {['Document Classification', 'OCR Text Extraction', 'Medical NLP Analysis'].map((step, i) => (
                    <div key={step} className="flex items-center gap-2 text-xs text-slate-400">
                      <Loader className="w-3 h-3 text-sky-400 animate-spin" style={{ animationDelay: `${i * 0.3}s` }} />
                      {step}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reports List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">
              Your Reports ({reports.length})
            </h2>
            <button onClick={loadReports} className="btn-ghost text-xs flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>

          {loadingReports ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="glass-card p-5">
                  <div className="flex gap-4">
                    <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-4 w-1/2 rounded" />
                      <div className="skeleton h-3 w-1/3 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-white font-semibold mb-2">No reports yet</h3>
              <p className="text-slate-400 text-sm">Upload your first medical report to get AI-powered analysis.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onDelete={handleDelete}
                  onRefresh={refreshReport}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default ReportAnalyzerPage;
