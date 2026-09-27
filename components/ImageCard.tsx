'use client';

import React, { useState } from 'react';
import { formatBytes } from '@/lib/image-utils';

export interface ImageItem {
  id: string;
  file: File;
  name: string;
  size: number;
  width: number;
  height: number;
  mimeType: string;
  magicSignature: string;
  isValidSignature: boolean;
  category: string;
  thumbnailUrl: string;
  error?: string;
}

interface ImageCardProps {
  item: ImageItem;
  isSelected: boolean;
  categories: string[];
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onCategoryChange: (id: string, newCategory: string) => void;
}

export default function ImageCard({
  item,
  isSelected,
  categories,
  onToggleSelect,
  onDelete,
  onRename,
  onCategoryChange,
}: ImageCardProps) {
  // Fayl adini deyismek ucun lokal state
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(item.name);

  // Ad deyisikliyni yadda saxlayiriq
  const handleSaveName = () => {
    if (editedName.trim()) {
      onRename(item.id, editedName.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      className={`bg-white rounded-xl border transition-all overflow-hidden flex flex-col justify-between ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
          : 'border-slate-200 shadow-sm hover:shadow-md'
      }`}
    >
      {/* Kartin ust hissesi: Secim checkbox-u ve silme duymesi */}
      <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(item.id)}
          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
        <button
          onClick={() => onDelete(item.id)}
          className="text-slate-400 hover:text-red-600 transition p-1"
          aria-label="Delete image"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Canvas terefinden hazirlanmis kicik thumbnail sahesi */}
      <div className="relative h-44 bg-slate-900/5 flex items-center justify-center p-2 overflow-hidden">
        {item.error ? (
          <div className="text-center p-4">
            <span className="text-xs font-semibold text-red-600">{item.error}</span>
          </div>
        ) : (
          <img
            src={item.thumbnailUrl}
            alt={item.name}
            className="max-h-full max-w-full object-contain rounded"
          />
        )}
      </div>

      {/* Metadata melumatlari ve kateqoriya secimi */}
      <div className="p-4 space-y-3 text-xs">
        <div className="flex items-center justify-between gap-2">
          {isEditing ? (
            <div className="flex items-center gap-1 w-full">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-500"
                autoFocus
              />
              <button
                onClick={handleSaveName}
                className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="font-semibold text-slate-800 truncate" title={item.name}>
                {item.name}
              </span>
              <button
                onClick={() => setIsEditing(true)}
                className="text-slate-400 hover:text-blue-600 ml-1 p-0.5"
                title="Edit name"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Seklin fayl parametrleri */}
        <div className="grid grid-cols-2 gap-2 text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          <div>
            <span className="block text-[10px] text-slate-400 uppercase font-bold">Size</span>
            <span className="font-medium">{formatBytes(item.size)}</span>
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 uppercase font-bold">Dimensions</span>
            <span className="font-medium">{item.width > 0 ? `${item.width}×${item.height}` : 'N/A'}</span>
          </div>
          <div className="col-span-2">
            <span className="block text-[10px] text-slate-400 uppercase font-bold">MIME Type</span>
            <code className="text-[11px] font-mono text-slate-700 bg-slate-200/60 px-1 rounded">
              {item.mimeType}
            </code>
          </div>
          <div className="col-span-2">
            <span className="block text-[10px] text-slate-400 uppercase font-bold">Signature</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <code className="text-[11px] font-mono text-slate-700 bg-slate-200/60 px-1 rounded">
                0x{item.magicSignature}
              </code>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  item.isValidSignature
                    ? 'text-emerald-700 bg-emerald-100'
                    : 'text-red-700 bg-red-100'
                }`}
              >
                {item.isValidSignature ? 'Valid' : 'Mismatch'}
              </span>
            </div>
          </div>
        </div>

        {/* Kateqoriya menyusu */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-slate-500 font-medium text-[11px]">Category:</span>
          <select
            value={item.category}
            onChange={(e) => onCategoryChange(item.id, e.target.value)}
            className="text-xs bg-slate-100 border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}