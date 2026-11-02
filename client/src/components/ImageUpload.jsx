import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Camera, X, Eye, Sparkles } from 'lucide-react';

export default function ImageUpload({ images, onImagesChange, disabled }) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(null);

  // Resize / compress image before turning to Base64 to optimize API latency
  const processImageFile = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1920; // High resolution enough for handwriting
          let width = img.width;
          let height = img.height;

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
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          resolve({
            dataUrl,
            name: file.name,
            size: Math.round(dataUrl.length * 0.75 / 1024) + ' KB',
          });
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    const newImages = [...images];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const processed = await processImageFile(file);
        newImages.push(processed);
      }
    }
    onImagesChange(newImages);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (index) => {
    const updated = images.filter((_, i) => i !== index);
    onImagesChange(updated);
  };

  return (
    <div className="space-y-3">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled}
      />

      {/* Dropzone Area */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer group ${
          dragActive
            ? 'border-indigo-600 bg-indigo-50/70 scale-[0.99]'
            : 'border-slate-300 hover:border-indigo-500 bg-slate-50/70 hover:bg-indigo-50/30'
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 group-hover:bg-indigo-200 text-indigo-600 flex items-center justify-center transition shadow-xs">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Drag & Drop your homework photo here, or <span className="text-indigo-600 underline">browse</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports handwritten notebook photos, textbook snapshots, typed PDFs, JPG, PNG
            </p>
          </div>

          {/* Quick buttons inside dropzone */}
          <div className="flex items-center gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-slate-200 shadow-2xs hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition"
            >
              <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>Upload Photos</span>
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-slate-200 shadow-2xs hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-600" />
              <span>Take Photo</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400 italic">
            Tip: You can also paste copied screenshots directly anywhere with <kbd className="px-1 py-0.5 bg-slate-200 rounded font-sans text-slate-700">Ctrl+V</kbd>
          </p>
        </div>
      </div>

      {/* Image Previews Grid */}
      {images.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
            <span>Attached Photos ({images.length})</span>
            <button
              type="button"
              onClick={() => onImagesChange([])}
              className="text-rose-600 hover:underline"
            >
              Clear all
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="relative group rounded-xl overflow-hidden border border-slate-200 shadow-xs bg-slate-900 aspect-square"
              >
                <img
                  src={img.dataUrl}
                  alt={img.name || `Homework photo ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                />
                
                {/* Badge Number */}
                <div className="absolute top-1.5 left-1.5 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                  #{idx + 1}
                </div>

                {/* Overlay actions */}
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(img.dataUrl)}
                    className="p-1.5 bg-white/90 hover:bg-white rounded-lg text-slate-800 transition"
                    title="Zoom in"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="p-1.5 bg-rose-500 hover:bg-rose-600 rounded-lg text-white transition"
                    title="Remove"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal for Zooming in image preview */}
      {previewZoom && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewZoom(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-xl bg-slate-900">
            <button
              onClick={() => setPreviewZoom(null)}
              className="absolute top-3 right-3 p-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full transition z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewZoom}
              alt="Zoomed Homework"
              className="max-w-full max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}

