export type AccessAction = 'view' | 'download';

export interface AccessLogEntry {
  id: string;
  docId: string;
  userId: string;
  action: AccessAction;
  at: string; // ISO 8601 formati: '2026-09-24T15:30:00.000Z'
}

export interface TrackedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  maxLimit: number; // Manual deyisdirile bilen yukleme limiti
}

export interface FileStats {
  viewCount: number;
  downloadCount: number;
  totalCount: number;
  maxLimit: number;
  remaining: number;
  isLocked: boolean;
  percentage: number;
}

/**
 * LOG CAPPING:
 * Loglarin sonsuz boyumesinin qarsisini almaq ucun maksimum limit.
 */
export const MAX_LOG_CAP = 100;

/**
 * SINGLE SOURCE OF TRUTH (DERIVED STATE):
 * Fayl uzerinde count saxlanilmir, append-only log-dan hesablanir.
 */
export function getFileStats(
  docId: string,
  logs: AccessLogEntry[],
  maxLimit: number
): FileStats {
  const fileLogs = logs.filter((log) => log.docId === docId);
  const downloadCount = fileLogs.filter((log) => log.action === 'download').length;
  const viewCount = fileLogs.filter((log) => log.action === 'view').length;

  const totalCount = downloadCount;
  const remaining = Math.max(0, maxLimit - totalCount);
  const isLocked = totalCount >= maxLimit;
  const percentage = Math.min(100, Math.round((totalCount / maxLimit) * 100));

  return {
    viewCount,
    downloadCount,
    totalCount,
    maxLimit,
    remaining,
    isLocked,
    percentage,
  };
}

/**
 * ENFORCE LIMIT IN HANDLER:
 * Re-check validation strictly inside the execution handler before appending to log.
 */
export function validateAccess(
  docId: string,
  logs: AccessLogEntry[],
  maxLimit: number,
  action: AccessAction
): { allowed: boolean; reason?: string } {
  const stats = getFileStats(docId, logs, maxLimit);

  if (action === 'download' && stats.isLocked) {
    return {
      allowed: false,
      reason: `Limit exceeded: ${stats.downloadCount} of ${maxLimit} downloads used. File is locked.`,
    };
  }

  return { allowed: true };
}