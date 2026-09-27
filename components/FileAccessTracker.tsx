'use client';

import React, { useState } from 'react';
import {
  TrackedFile,
  AccessLogEntry,
  AccessAction,
  getFileStats,
  validateAccess,
  MAX_LOG_CAP,
} from '@/lib/access-tracker';

// Daha real və sadə fayl adları
const INITIAL_FILES: TrackedFile[] = [
  { id: 'f-1', name: 'project-brief.pdf', size: 2450000, type: 'PDF', maxLimit: 3 },
  { id: 'f-2', name: 'design-assets.docx', size: 1120000, type: 'DOCX', maxLimit: 5 },
  { id: 'f-3', name: 'company-guidelines.pdf', size: 3800000, type: 'PDF', maxLimit: 2 },
];

export default function FileAccessTracker() {
  const [files, setFiles] = useState<TrackedFile[]>(INITIAL_FILES);
  const [logs, setLogs] = useState<AccessLogEntry[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAction = (docId: string, action: AccessAction) => {
    const file = files.find((f) => f.id === docId);
    if (!file) return;

    const check = validateAccess(docId, logs, file.maxLimit, action);

    if (!check.allowed) {
      triggerToast(check.reason || 'Action blocked.');
      return;
    }

    const newEntry: AccessLogEntry = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      docId,
      userId: 'user-1',
      action,
      at: new Date().toISOString(),
    };

    setLogs((prev) => {
      const updated = [newEntry, ...prev];
      return updated.slice(0, MAX_LOG_CAP);
    });

    triggerToast(`Recorded ${action} for ${file.name}`);
  };

  const handleLimitChange = (docId: string, newLimit: number) => {
    const val = Math.max(1, newLimit);
    setFiles((prev) =>
      prev.map((f) => (f.id === docId ? { ...f, maxLimit: val } : f))
    );
  };

  const handleResetFileLogs = (docId: string) => {
    setLogs((prev) => prev.filter((log) => log.docId !== docId));
    triggerToast('Access counter reset.');
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 text-slate-800 md:p-8">
      {/* Başlıq sahəsi - Sadələşdirilib */}
      <header className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900">File Limits & Downloads</h1>
        <p className="text-xs text-slate-500">
          Track download limits and view access history for shared files.
        </p>
      </header>

      {toastMessage && (
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs font-medium text-white shadow-md transition">
          {toastMessage}
        </div>
      )}

      {/* Fayl kartları */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {files.map((file) => {
          const stats = getFileStats(file.id, logs, file.maxLimit);

          let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
          let barColor = 'bg-emerald-500';

          if (stats.percentage >= 100) {
            badgeColor = 'bg-red-100 text-red-800 border-red-200';
            barColor = 'bg-red-500';
          } else if (stats.percentage >= 50) {
            badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
            barColor = 'bg-amber-500';
          }

          return (
            <div
              key={file.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                      {file.type}
                    </span>
                    <h3 className="mt-1 font-semibold text-slate-900 text-sm truncate" title={file.name}>
                      {file.name}
                    </h3>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${badgeColor}`}>
                    {stats.isLocked ? 'LOCKED' : `${stats.remaining} Left`}
                  </span>
                </div>

                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Usage</span>
                    <span className="font-semibold text-slate-700">
                      {stats.downloadCount} / {file.maxLimit} used
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full transition-all duration-300 ${barColor}`}
                      style={{ width: `${stats.percentage}%` }}
                    />
                  </div>
                </div>

                <p className="mt-3 text-[11px] text-slate-400">
                  Views: <span className="font-semibold text-slate-600">{stats.viewCount}</span>
                </p>
              </div>

              <div className="space-y-3 border-t border-slate-100 pt-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(file.id, 'view')}
                    className="flex-1 rounded-md border border-slate-300 bg-white py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    View
                  </button>
                  <button
                    disabled={stats.isLocked}
                    onClick={() => handleAction(file.id, 'download')}
                    className={`flex-1 rounded-md py-1.5 text-xs font-semibold text-white transition ${
                      stats.isLocked
                        ? 'cursor-not-allowed bg-slate-300'
                        : 'bg-slate-900 hover:bg-slate-800'
                    }`}
                  >
                    Download
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5">
                    <label className="text-[10px] font-medium text-slate-400">Limit:</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={file.maxLimit}
                      onChange={(e) => handleLimitChange(file.id, parseInt(e.target.value) || 1)}
                      className="w-12 rounded border border-slate-200 px-1.5 py-0.5 text-center text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                  </div>

                  <button
                    onClick={() => handleResetFileLogs(file.id)}
                    className="text-[10px] font-medium text-slate-400 underline hover:text-slate-700"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Log paneli - Sadələşdirilib */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Activity Log ({logs.length})
          </h2>
          {logs.length > 0 && (
            <button
              onClick={() => setLogs([])}
              className="text-xs text-red-600 hover:underline"
            >
              Clear Log
            </button>
          )}
        </div>

        {logs.length === 0 ? (
          <p className="text-xs italic text-slate-400">No activity yet.</p>
        ) : (
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-2">
            {logs.map((log) => {
              const file = files.find((f) => f.id === log.docId);
              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded bg-slate-50 p-2 text-xs font-mono text-slate-600"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                        log.action === 'download'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {log.action.toUpperCase()}
                    </span>
                    <span className="font-semibold text-slate-800">{file?.name || log.docId}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{log.at}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}