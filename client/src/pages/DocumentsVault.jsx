import React, { useState, useEffect } from 'react';
import { 
  FolderDown, 
  UploadCloud, 
  FileText, 
  FileCode, 
  Image, 
  File, 
  Download, 
  Trash2, 
  Eye, 
  Plus, 
  Search, 
  X, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function DocumentsVault({ subjects }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [search, setSearch] = useState('');
  
  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [uploadSubject, setUploadSubject] = useState('');
  const [uploadTopic, setUploadTopic] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Preview modal
  const [previewDoc, setPreviewDoc] = useState(null);

  const fetchDocs = async () => {
    try {
      const data = await api.getDocuments(selectedSubject);
      setDocuments(data);
    } catch (err) {
      console.error('Error fetching documents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [selectedSubject]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      if (!uploadTopic) {
        setUploadTopic(f.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!file) {
      setErrorMsg('Please select a file to upload.');
      return;
    }

    if (!uploadSubject.trim()) {
      setErrorMsg('Please specify which subject this document belongs to.');
      return;
    }

    const formData = new FormData();
    formData.append('document', file);
    formData.append('subject', uploadSubject.trim());
    formData.append('topic', uploadTopic.trim());
    formData.append('notes', uploadNotes.trim());

    setUploading(true);
    try {
      await api.uploadDocument(formData);
      setSuccessMsg(`Document uploaded successfully to ${uploadSubject}!`);
      setFile(null);
      setUploadTopic('');
      setUploadNotes('');
      setIsUploadOpen(false);
      fetchDocs();
    } catch (err) {
      setErrorMsg(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this study document?')) return;
    try {
      await api.deleteDocument(id);
      setDocuments(docs => docs.filter(d => d.id !== id));
    } catch (err) {
      alert('Failed to delete document: ' + err.message);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName, fileType) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (['c', 'cpp', 'py', 'js', 'html', 'css', 'json'].includes(ext)) {
      return <FileCode className="w-5 h-5 text-amber-400" />;
    }
    if (['png', 'jpg', 'jpeg', 'svg', 'gif'].includes(ext)) {
      return <Image className="w-5 h-5 text-emerald-400" />;
    }
    if (['pdf'].includes(ext)) {
      return <FileText className="w-5 h-5 text-rose-400" />;
    }
    return <FileText className="w-5 h-5 text-indigo-400" />;
  };

  const allSubjects = Array.from(new Set(['Operating Systems', 'Data Structures', 'Computer Networks', 'Mathematics', ...subjects]));

  const filteredDocs = documents.filter((doc) => {
    const query = search.toLowerCase();
    const matchesSearch = 
      doc.originalName?.toLowerCase().includes(query) ||
      doc.topic?.toLowerCase().includes(query) ||
      doc.subject?.toLowerCase().includes(query);
    return matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Subject Documents Vault</h2>
          <p className="text-xs text-slate-400 mt-1">
            Upload and organize study notes, PDFs, cheatsheets, and slides tied to each specific subject.
          </p>
        </div>

        <button
          onClick={() => {
            setUploadSubject(selectedSubject !== 'All' ? selectedSubject : allSubjects[0] || 'Operating Systems');
            setIsUploadOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all transform active:scale-95"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Subject Document</span>
        </button>
      </div>

      {/* Subject Filter Pills & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full pb-1">
          <button
            onClick={() => setSelectedSubject('All')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedSubject === 'All'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Subjects ({documents.length})
          </button>
          {allSubjects.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSubject(s)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedSubject === s
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            className="glass-card rounded-2xl p-5 border border-slate-800/80 flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                  {getFileIcon(doc.originalName, doc.fileType)}
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  {doc.subject}
                </span>
              </div>

              <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition truncate" title={doc.topic || doc.originalName}>
                {doc.topic || doc.originalName}
              </h4>
              <p className="text-xs text-slate-400 font-mono truncate mt-0.5" title={doc.originalName}>
                {doc.originalName}
              </p>

              {doc.previewContent && (
                <div className="mt-3 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] font-mono text-slate-300 line-clamp-3 whitespace-pre-line">
                  {doc.previewContent}
                </div>
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[11px]">{formatFileSize(doc.size)}</span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewDoc(doc)}
                  title="Quick Preview"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition"
                >
                  <Eye className="w-4 h-4" />
                </button>

                <a
                  href={`/api/documents/${doc.id}/download`}
                  download={doc.originalName}
                  title="Download File"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-slate-800 transition"
                >
                  <Download className="w-4 h-4" />
                </a>

                <button
                  onClick={() => handleDelete(doc.id)}
                  title="Delete Document"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredDocs.length === 0 && (
        <div className="glass-panel rounded-3xl p-12 text-center border border-slate-800">
          <FolderDown className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <h4 className="text-base font-bold text-white">No documents found</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Upload study resources, lecture notes, textbook solutions, or code files for your subjects.
          </p>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition"
          >
            + Upload Document Now
          </button>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setIsUploadOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">Upload Subject Document</h3>
            <p className="text-xs text-slate-400 mb-6">
              Attach study resources, PDFs, notes, or code to a specific subject.
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Subject</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Enter or select subject..."
                    value={uploadSubject}
                    onChange={(e) => setUploadSubject(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <select
                    onChange={(e) => setUploadSubject(e.target.value)}
                    className="px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="">Presets</option>
                    {allSubjects.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Document Title / Topic</label>
                <input
                  type="text"
                  placeholder="e.g. Chapter 2 Notes, Cheat Sheet, Exam Solutions"
                  value={uploadTopic}
                  onChange={(e) => setUploadTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* File Drop Area */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">File</label>
                <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-2xl p-6 text-center bg-slate-850/50 cursor-pointer transition">
                  <input
                    type="file"
                    id="docFile"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="docFile" className="cursor-pointer flex flex-col items-center">
                    <UploadCloud className="w-8 h-8 text-indigo-400 mb-2" />
                    {file ? (
                      <div>
                        <p className="text-sm font-semibold text-white">{file.name}</p>
                        <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-semibold text-slate-300">
                          Click to browse or drop your document here
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Supports PDF, DOCX, TXT, MD, C/C++, Python, images (up to 50MB)
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition"
                >
                  {uploading ? 'Uploading...' : 'Confirm Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-2xl max-h-[85vh] rounded-3xl bg-slate-900 border border-slate-800 p-6 flex flex-col shadow-2xl relative">
            <button
              onClick={() => setPreviewDoc(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                {getFileIcon(previewDoc.originalName, previewDoc.fileType)}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{previewDoc.topic || previewDoc.originalName}</h3>
                <p className="text-xs text-indigo-400 font-semibold">{previewDoc.subject} • {previewDoc.originalName}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 rounded-2xl bg-slate-950 border border-slate-800/80 mb-4 text-xs font-mono text-slate-200 whitespace-pre-wrap">
              {previewDoc.previewContent ? (
                previewDoc.previewContent
              ) : previewDoc.fileUrl ? (
                <div className="text-center py-12">
                  <p className="text-sm font-semibold text-slate-300">File attached and saved in vault.</p>
                  <p className="text-xs text-slate-500 mt-1">Binary or multi-page document ready for download.</p>
                </div>
              ) : (
                'No preview available.'
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-slate-400">{formatFileSize(previewDoc.size)}</span>
              <a
                href={`/api/documents/${previewDoc.id}/download`}
                download={previewDoc.originalName}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition"
              >
                <Download className="w-4 h-4" />
                <span>Download Document</span>
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
