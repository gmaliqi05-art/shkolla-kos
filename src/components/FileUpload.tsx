import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Upload, X, Image as ImageIcon, FileText } from 'lucide-react';

interface FileUploadProps {
  bucket: 'school-assets' | 'avatars' | 'documents' | 'portfolio';
  folder?: string; // sub-folder inside bucket (e.g., user id)
  accept?: string; // accept attribute
  maxSizeMB?: number;
  currentUrl?: string | null;
  onUploaded: (publicUrl: string, path: string) => void;
  onRemoved?: () => void;
  label?: string;
  preview?: boolean; // show image preview
  buttonOnly?: boolean; // just a button, no preview area
}

export default function FileUpload({
  bucket,
  folder,
  accept = 'image/*',
  maxSizeMB = 5,
  currentUrl,
  onUploaded,
  onRemoved,
  label = 'Ngarko skedar',
  preview = true,
  buttonOnly = false,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError('');
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Skedari është më i madh se ${maxSizeMB} MB`);
      return;
    }
    setUploading(true);

    const ext = file.name.split('.').pop() || 'bin';
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const fileName = `${timestamp}-${random}.${ext}`;
    const path = folder ? `${folder}/${fileName}` : fileName;

    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(path, file, { cacheControl: '3600', upsert: false });

    if (upErr) {
      setError(upErr.message);
      setUploading(false);
      return;
    }

    // Get public URL (for public buckets) or signed URL (for private)
    let publicUrl = '';
    if (bucket === 'school-assets' || bucket === 'avatars') {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      publicUrl = data.publicUrl;
    } else {
      const { data, error: sErr } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year
      if (sErr) {
        setError(sErr.message);
        setUploading(false);
        return;
      }
      publicUrl = data?.signedUrl || '';
    }

    onUploaded(publicUrl, path);
    setUploading(false);
  };

  const handleRemove = () => {
    if (onRemoved) onRemoved();
  };

  const isImage = accept.includes('image');

  if (buttonOnly) {
    return (
      <>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {label}
        </button>
        {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
      </>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="hidden"
      />
      {preview && currentUrl ? (
        <div className="flex items-start gap-3">
          {isImage ? (
            <img src={currentUrl} alt="Preview" className="w-20 h-20 object-contain rounded-xl border border-slate-200 bg-white" />
          ) : (
            <div className="w-20 h-20 flex items-center justify-center bg-slate-100 rounded-xl border border-slate-200">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium"
            >
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              Ndrysho
            </button>
            {onRemoved && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={uploading}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-medium"
              >
                <X className="w-3 h-3" />
                Hiq
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full px-4 py-6 border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 rounded-xl flex flex-col items-center gap-2 text-slate-500 hover:text-blue-700 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : isImage ? (
            <ImageIcon className="w-6 h-6" />
          ) : (
            <Upload className="w-6 h-6" />
          )}
          <span className="text-sm font-medium">{uploading ? 'Duke ngarkuar...' : label}</span>
          <span className="text-xs text-slate-400">max {maxSizeMB} MB</span>
        </button>
      )}
      {error && <p className="text-xs text-rose-600 mt-2">{error}</p>}
    </div>
  );
}
