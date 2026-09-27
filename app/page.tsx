'use client';

import React, { useState } from 'react';
import ImageManager from '@/components/ImageManager';
import DocumentViewer from '@/components/DocumentViewer';
import FileAccessTracker from '@/components/FileAccessTracker';

export default function Home() {
  // Modullar arasi kecid state-i
  const [activeTab, setActiveTab] = useState<'images' | 'documents' | 'tracker'>('images');

  return (
    <main className="min-h-screen bg-slate-50 py-6">
      {/* Modul secim duymeleri */}
      <div className="mx-auto max-w-7xl px-4 mb-6 md:px-8">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('images')}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeTab === 'images'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            Images
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeTab === 'documents'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            Documents
          </button>
          <button
            onClick={() => setActiveTab('tracker')}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeTab === 'tracker'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            File Limits
          </button>
        </div>
      </div>

      {/* Aktiv modulun gosterilmesi */}
      {activeTab === 'images' && <ImageManager />}
      {activeTab === 'documents' && <DocumentViewer />}
      {activeTab === 'tracker' && <FileAccessTracker />}
    </main>
  );
}