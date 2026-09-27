'use client';

import React, { useRef, useState, useEffect } from 'react';

interface DropzoneProps {
  onFilesSelected: (files: FileList | File[]) => void;
}

export default function Dropzone({ onFilesSelected }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sehifenin kenarinda sehven sekil buraxilarsa brauzerin sehifeni deyismemesini temin edirik
  useEffect(() => {
    const preventGlobalDrop = (e: DragEvent) => {
      e.preventDefault();
    };
    window.addEventListener('dragover', preventGlobalDrop);
    window.addEventListener('drop', preventGlobalDrop);

    return () => {
      window.removeEventListener('dragover', preventGlobalDrop);
      window.removeEventListener('drop', preventGlobalDrop);
    };
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
    }
    // Eyni fayli ard-arda sechende event-in yeniden tetiklenmesi ucun inputu sifirlayiriq
    e.target.value = '';
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
        isDragging
          ? 'border-blue-500 bg-blue-50/50'
          : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleInputChange}
        className="sr-only" // Accessibility tree-de qalir, amma vizual olaraq gizledilir (display:none edilmir)
        aria-label="Upload image files"
      />
      <div className="flex flex-col items-center justify-center space-y-2">
        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
        </svg>
        <p className="text-sm font-medium text-slate-700">
          Drag and drop images here, or click to browse
        </p>
        <p className="text-xs text-slate-400">
          PNG, JPEG, WEBP, GIF formats supported
        </p>
      </div>
    </div>
  );
}