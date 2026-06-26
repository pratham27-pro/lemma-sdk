import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BookOpen, Upload, FileText, Search, Trash2 } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { Empty } from '../components/ui/Empty';
import { getClient } from '../lib/lemma';

const DOCS_DIR = '/product-docs';

interface DocFile {
  id: string;
  name: string;
  size?: number;
  created_at?: string;
}

async function listDocs(): Promise<DocFile[]> {
  const client = getClient();
  const res = await client.files.list({ directoryPath: DOCS_DIR });
  return ((res as { items?: DocFile[] }).items ?? []) as DocFile[];
}

async function uploadDoc(file: File): Promise<void> {
  const client = getClient();
  const blob = new Blob([await file.arrayBuffer()], { type: file.type || 'text/plain' });
  await client.files.upload(blob, { name: file.name, directoryPath: DOCS_DIR });
}

async function deleteDoc(name: string): Promise<void> {
  const client = getClient();
  await client.files.delete(`${DOCS_DIR}/${name}`);
}

export function Docs() {
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');

  const { data: docs = [], isLoading, refetch } = useQuery({
    queryKey: ['docs'],
    queryFn: listDocs,
  });

  const onDrop = useCallback(async (accepted: File[]) => {
    if (!accepted.length) return;
    setUploading(true);
    try {
      await Promise.all(accepted.map(uploadDoc));
      toast.success(`Uploaded ${accepted.length} file${accepted.length > 1 ? 's' : ''}`);
      refetch();
    } catch {
      toast.error('Upload failed. Try again.');
    } finally {
      setUploading(false);
    }
  }, [refetch]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt', '.md'],
      'application/pdf': ['.pdf'],
      'text/html': ['.html'],
    },
    maxSize: 25 * 1024 * 1024,
  });

  const filtered = docs.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));

  function formatSize(bytes?: number) {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function handleDelete(doc: DocFile) {
    try {
      await deleteDoc(doc.name);
      toast.success(`Deleted ${doc.name}`);
      refetch();
    } catch {
      toast.error('Delete failed');
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-screen animate-fade-in">
      <TopBar
        title="Product Docs"
        subtitle="Documents the AI references when drafting support replies"
        actions={
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search docs…"
              className="pl-8 pr-3 h-8 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-accent-400 transition-colors w-48"
            />
          </div>
        }
      />

      <div className="flex-1 p-6 space-y-5">
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-all
            ${isDragActive ? 'border-accent-400 bg-accent-50' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}
            ${uploading ? 'pointer-events-none opacity-60' : ''}
          `}
        >
          <input {...getInputProps()} />
          <Upload size={24} className={`mx-auto mb-3 ${isDragActive ? 'text-accent-500' : 'text-slate-300'}`} />
          <p className="text-sm font-medium text-slate-700 mb-1">
            {uploading ? 'Uploading…' : isDragActive ? 'Drop files here' : 'Upload product documentation'}
          </p>
          <p className="text-xs text-slate-400">.txt · .md · .pdf · .html — the AI uses these when drafting replies</p>
        </div>

        {/* File list */}
        {isLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 bg-slate-100 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/5" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Empty
            icon={<BookOpen size={32} />}
            title={search ? 'No docs match your search' : 'No product docs yet'}
            description={
              search
                ? 'Try a different search term.'
                : 'Upload your FAQs, knowledge base, or product docs. The AI will use them to draft more accurate replies.'
            }
          />
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Size</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Uploaded</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent-50 flex items-center justify-center shrink-0">
                          <FileText size={14} className="text-accent-500" />
                        </div>
                        <span className="text-sm font-medium text-slate-800">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500 font-mono">{formatSize(doc.size)}</td>
                    <td className="px-3 py-3 text-xs text-slate-400">
                      {doc.created_at
                        ? new Date(doc.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })
                        : '—'}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        onClick={() => handleDelete(doc)}
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
