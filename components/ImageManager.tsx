'use client';

import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import Dropzone from '@/components/Dropzone';
import ImageCard, { ImageItem } from '@/components/ImageCard';
import { verifyMagicNumber, createThumbnail } from '@/lib/image-utils';

const CATEGORIES = ['General', 'Landscape', 'Portrait', 'Document', 'Other'];

export default function ImageManager() {
  // Sekillerin siyahisi ve secilmis fayllarin id-leri
  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Sehifeden cixanda yaddasi temizlemek ucun Object URL-leri legv edirik
  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img.thumbnailUrl) URL.revokeObjectURL(img.thumbnailUrl);
      });
    };
  }, []);

  // Secilmis fayllari sira ile emal edirik (browser donmasin deye)
  const processFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgress({ current: 0, total: files.length });

    const newItems: ImageItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      try {
        const { hex, isValid } = await verifyMagicNumber(file);
        const { thumbnailUrl, width, height } = await createThumbnail(file);

        newItems.push({
          id,
          file,
          name: file.name,
          size: file.size,
          width,
          height,
          mimeType: file.type || 'Unknown',
          magicSignature: hex,
          isValidSignature: isValid,
          category: 'General',
          thumbnailUrl,
        });
      } catch (err) {
        newItems.push({
          id,
          file,
          name: file.name,
          size: file.size,
          width: 0,
          height: 0,
          mimeType: file.type || 'Unknown',
          magicSignature: 'UNKNOWN',
          isValidSignature: false,
          category: 'General',
          thumbnailUrl: '',
          error: (err as Error).message || 'Fayl emal oluna bilmedi',
        });
      }

      setProgress({ current: i + 1, total: files.length });
      // Event loop-a vaxt veririk ki UI donmasin
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    setImages((prev) => [...prev, ...newItems]);
    setIsProcessing(false);
  };

  // Hamisini sec ve ya secimi legv et
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredImages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredImages.map((img) => img.id)));
    }
  };

  // Tek bir sekli sec
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Tek sekli sil ve yaddasini temizle
  const handleDelete = (id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target?.thumbnailUrl) URL.revokeObjectURL(target.thumbnailUrl);
      return prev.filter((img) => img.id !== id);
    });
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  // Secilmisleri kutlevi sil
  const handleDeleteSelected = () => {
    setImages((prev) => {
      prev.forEach((img) => {
        if (selectedIds.has(img.id) && img.thumbnailUrl) {
          URL.revokeObjectURL(img.thumbnailUrl);
        }
      });
      return prev.filter((img) => !selectedIds.has(img.id));
    });
    setSelectedIds(new Set());
  };

  // Hamisini temizle
  const handleClearAll = () => {
    images.forEach((img) => {
      if (img.thumbnailUrl) URL.revokeObjectURL(img.thumbnailUrl);
    });
    setImages([]);
    setSelectedIds(new Set());
  };

  // Ad deyisikliyi
  const handleRename = (id: string, newName: string) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, name: newName } : img))
    );
  };

  // Kateqoriya deyisikliyi
  const handleCategoryChange = (id: string, newCategory: string) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, category: newCategory } : img))
    );
  };

  // Kateqoriyaya gore zip papka daxilinde yukle
  const handleDownloadZip = async () => {
    if (images.length === 0) return;

    const zip = new JSZip();
    images.forEach((img) => {
      const folder = zip.folder(img.category) || zip;
      folder.file(img.name, img.file);
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `images_export_${Date.now()}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  // Filterlenmis sekiller
  const filteredImages = images.filter((img) =>
    activeCategoryFilter === 'All' ? true : img.category === activeCategoryFilter
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 text-slate-800">
      <header className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">
          Local Image Manager & Metadata Inspector
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Client-side file verification, thumbnail generation, and ZIP backup.
        </p>
      </header>

      <Dropzone onFilesSelected={processFiles} />

      {/* Screen Reader istifadechileri ucun emal veziyyeti elani (Accessibility) */}
      <div className="sr-only" aria-live="polite">
        {isProcessing
          ? `Processing images: ${progress.current} of ${progress.total} completed.`
          : `${images.length} images currently loaded.`}
      </div>

      {isProcessing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-xs font-semibold text-blue-900">
            <span>Processing files sequentially...</span>
            <span>{progress.current} / {progress.total}</span>
          </div>
          <div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-2 transition-all duration-150 ease-out"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {images.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-100 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.size === filteredImages.length && filteredImages.length > 0}
                onChange={toggleSelectAll}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Select All ({filteredImages.length})</span>
            </label>

            {selectedIds.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition"
              >
                Delete Selected ({selectedIds.size})
              </button>
            )}

            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-300 transition"
            >
              Clear All
            </button>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={activeCategoryFilter}
              onChange={(e) => setActiveCategoryFilter(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Categories ({images.length})</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat} ({images.filter((i) => i.category === cat).length})
                </option>
              ))}
            </select>

            <button
              onClick={handleDownloadZip}
              className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition"
            >
              Download ZIP
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredImages.map((img) => (
          <ImageCard
            key={img.id}
            item={img}
            isSelected={selectedIds.has(img.id)}
            categories={CATEGORIES}
            onToggleSelect={toggleSelect}
            onDelete={handleDelete}
            onRename={handleRename}
            onCategoryChange={handleCategoryChange}
          />
        ))}
      </div>
    </div>
  );
}