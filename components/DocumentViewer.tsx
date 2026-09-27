'use client';

import React, { useState, useEffect } from 'react';
import { DocItem, AccessLevel, UserContext, can } from '@/lib/doc-permissions';

export default function DocumentViewer() {
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [user, setUser] = useState<UserContext>({ id: 'owner-1', role: 'owner' });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Form state-leri
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [selectedPermission, setSelectedPermission] = useState<AccessLevel>('Editable');
  const [mockContent, setMockContent] = useState<string>('');

  // Redakte state-leri
  const [isRenaming, setIsRenaming] = useState<boolean>(false);
  const [renameValue, setRenameValue] = useState<string>('');
  const [isEditingContent, setIsEditingContent] = useState<boolean>(false);
  const [contentValue, setContentValue] = useState<string>('');

  useEffect(() => {
    return () => {
      documents.forEach((doc) => {
        if (doc.fileUrl) URL.revokeObjectURL(doc.fileUrl);
      });
    };
  }, [documents]);

  // Rejim kecidlerinde icaze simulyasiya yuklenmesi (Loading state)
  const handleRoleSwitch = (newRole: 'owner' | 'viewer') => {
    setIsLoading(true);
    setUser({ id: newRole === 'owner' ? 'owner-1' : 'viewer-1', role: newRole });
    
    // Switch zamani redakte modlarini baglayiriq
    setIsRenaming(false);
    setIsEditingContent(false);

    setTimeout(() => {
      setIsLoading(false);
    }, 250);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setPendingFile(e.target.files[0]);
    }
    e.target.value = '';
  };

  const handleUpload = () => {
    if (!pendingFile) return;

    const fileUrl = URL.createObjectURL(pendingFile);
    const newDoc: DocItem = {
      id: Date.now().toString(),
      name: pendingFile.name,
      size: pendingFile.size,
      type: pendingFile.type || 'application/pdf',
      accessLevel: selectedPermission,
      content: mockContent || `Sample content for ${pendingFile.name}`,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fileUrl,
      ownerId: 'owner-1',
    };

    setDocuments((prev) => [...prev, newDoc]);
    setSelectedDocId(newDoc.id);
    setPendingFile(null);
    setMockContent('');
  };

  const activeDoc = documents.find((doc) => doc.id === selectedDocId);

  // Merkezi icaze hesablamalari
  const renamePerm = activeDoc ? can(user, 'RENAME', activeDoc) : { allowed: false };
  const editContentPerm = activeDoc ? can(user, 'EDIT_CONTENT', activeDoc) : { allowed: false };
  const viewPerm = activeDoc ? can(user, 'VIEW', activeDoc) : { allowed: false };

  const handleSaveRename = () => {
    if (!activeDoc || !renameValue.trim()) return;
    setDocuments((prev) =>
      prev.map((d) => (d.id === activeDoc.id ? { ...d, name: renameValue.trim() } : d))
    );
    setIsRenaming(false);
  };

  const handleSaveContent = () => {
    if (!activeDoc) return;
    setDocuments((prev) =>
      prev.map((d) => (d.id === activeDoc.id ? { ...d, content: contentValue } : d))
    );
    setIsEditingContent(false);
  };

  const handleDelete = (id: string) => {
    setDocuments((prev) => {
      const target = prev.find((d) => d.id === id);
      if (target?.fileUrl) URL.revokeObjectURL(target.fileUrl);
      return prev.filter((d) => d.id !== id);
    });
    if (selectedDocId === id) setSelectedDocId(null);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 text-slate-800 md:p-8">
      {/* Basliq ve Rejim Secimi */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Document Management</h1>
          <p className="text-xs text-slate-500">Local permission control and simulation</p>
        </div>

        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          <button
            onClick={() => handleRoleSwitch('owner')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              user.role === 'owner' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Owner View
          </button>
          <button
            onClick={() => handleRoleSwitch('viewer')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              user.role === 'viewer' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Share View
          </button>
        </div>
      </header>

      {user.role === 'viewer' && (
        <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-3 text-xs text-indigo-900">
          <span className="font-semibold">Simulated Share View:</span> You are viewing documents as an external user. Private documents are hidden or inaccessible.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sol Panel: Fayl Yukleme ve Siyahı */}
        <div className="space-y-6">
          {user.role === 'owner' && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Upload Document</h2>
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
              />

              {pendingFile && (
                <div className="space-y-3 border-t border-slate-100 pt-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Access Level</label>
                    <select
                      value={selectedPermission}
                      onChange={(e) => setSelectedPermission(e.target.value as AccessLevel)}
                      className="w-full rounded-md border border-slate-300 bg-white p-2 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
                    >
                      <option value="Editable">Editable</option>
                      <option value="Read-only">Read-only</option>
                      <option value="Private">Private</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Initial Content</label>
                    <textarea
                      value={mockContent}
                      onChange={(e) => setMockContent(e.target.value)}
                      placeholder="Optional text..."
                      rows={2}
                      className="w-full rounded-md border border-slate-300 bg-white p-2 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                  </div>

                  <button
                    onClick={handleUpload}
                    className="w-full rounded-md bg-slate-900 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                  >
                    Add Document
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Siyahı */}
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Files ({documents.length})
            </h2>

            {documents.length === 0 ? (
              <p className="text-xs italic text-slate-400">No files available.</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => {
                  const deleteCheck = can(user, 'DELETE', doc);
                  const isPrivateInShare = user.role === 'viewer' && doc.accessLevel === 'Private';

                  return (
                    <div
                      key={doc.id}
                      onClick={() => !isPrivateInShare && setSelectedDocId(doc.id)}
                      className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition ${
                        selectedDocId === doc.id
                          ? 'border-slate-800 bg-slate-50'
                          : 'border-slate-200 hover:border-slate-300'
                      } ${isPrivateInShare ? 'cursor-not-allowed bg-slate-50 opacity-40' : ''}`}
                    >
                      <div className="truncate pr-2">
                        <p className="truncate text-xs font-semibold text-slate-800">{doc.name}</p>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          {(doc.size / 1024).toFixed(1)} KB • {doc.createdAt}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          {doc.accessLevel}
                        </span>

                        {deleteCheck.allowed && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(doc.id);
                            }}
                            className="p-1 text-slate-400 hover:text-red-600"
                            title="Delete document"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sağ Panel: Baxış sahəsi */}
        <div className="flex min-h-[400px] flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          {isLoading ? (
            <div className="my-auto flex flex-col items-center justify-center space-y-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800" />
              <p className="text-xs text-slate-400">Evaluating permissions...</p>
            </div>
          ) : activeDoc ? (
            !viewPerm.allowed ? (
              <div className="my-auto flex flex-col items-center justify-center space-y-3 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Access Denied</h3>
                <p className="max-w-xs text-xs text-slate-500">{viewPerm.reason}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Sənəd Başlığı və Ad Dəyişmə */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="mr-4 flex-1">
                    {isRenaming ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                          autoFocus
                        />
                        <button
                          onClick={handleSaveRename}
                          className="rounded bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setIsRenaming(false)}
                          className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900">{activeDoc.name}</h2>
                        <button
                          disabled={!renamePerm.allowed}
                          onClick={() => {
                            setRenameValue(activeDoc.name);
                            setIsRenaming(true);
                          }}
                          title={renamePerm.reason || 'Rename document'}
                          className={`p-1 text-xs transition ${
                            renamePerm.allowed
                              ? 'text-slate-400 hover:text-slate-800'
                              : 'cursor-not-allowed text-slate-300'
                          }`}
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  <span className="rounded bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {activeDoc.accessLevel}
                  </span>
                </div>

                {/* Sənəd Məzmunu */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Document Content
                    </span>

                    <button
                      disabled={!editContentPerm.allowed}
                      onClick={() => {
                        setContentValue(activeDoc.content);
                        setIsEditingContent(!isEditingContent);
                      }}
                      title={editContentPerm.reason || 'Edit content'}
                      className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                        editContentPerm.allowed
                          ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                          : 'cursor-not-allowed bg-slate-50 text-slate-400'
                      }`}
                    >
                      {isEditingContent ? 'Cancel' : 'Edit'}
                    </button>
                  </div>

                  {!editContentPerm.allowed && (
                    <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50/60 p-2 text-[11px] text-amber-800">
                      <svg className="h-3.5 w-3.5 shrink-0 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>{editContentPerm.reason}</span>
                    </div>
                  )}

                  {isEditingContent ? (
                    <div className="space-y-2">
                      <textarea
                        value={contentValue}
                        onChange={(e) => setContentValue(e.target.value)}
                        rows={6}
                        className="w-full rounded-lg border border-slate-300 p-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-slate-400"
                      />
                      <button
                        onClick={handleSaveContent}
                        className="rounded bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                      >
                        Save Changes
                      </button>
                    </div>
                  ) : (
                    /* Sadece icazesi olduqda DOM-a render olunur */
                    <div className="min-h-[160px] whitespace-pre-wrap rounded-lg border border-slate-100 bg-slate-50/80 p-4 text-xs font-mono text-slate-700">
                      {activeDoc.content}
                    </div>
                  )}
                </div>
              </div>
            )
          ) : (
            <div className="my-auto flex flex-col items-center justify-center space-y-2 text-center">
              <svg className="h-8 w-8 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-xs text-slate-400">Select a document from the list on the left to view.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}