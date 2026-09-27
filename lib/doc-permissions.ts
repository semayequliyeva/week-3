export type AccessLevel = 'Private' | 'Read-only' | 'Editable';
export type DocAction = 'VIEW' | 'RENAME' | 'EDIT_CONTENT' | 'DELETE' | 'DOWNLOAD';
export type UserRole = 'owner' | 'viewer';

export interface UserContext {
  id: string;
  role: UserRole;
}

export interface DocItem {
  id: string;
  name: string;
  size: number;
  type: string;
  accessLevel: AccessLevel;
  content: string;
  createdAt: string;
  fileUrl?: string;
  ownerId: string;
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * MERKEZI ICAZE MODELI:
 * Icazeleri parametr kimi qebul edir ve tam melumat modeli kimi hesblayir.
 * client-side yoxlanis tehlukesizlik deyil, UX ucundur.
 */
export function can(
  user: UserContext,
  action: DocAction,
  doc: DocItem
): PermissionCheckResult {
  const isOwner = user.role === 'owner' || doc.ownerId === user.id;

  // Private senedler kənardan gelen istifadecilere (viewer) tam qapadilir
  if (!isOwner && doc.accessLevel === 'Private') {
    return {
      allowed: false,
      reason: 'This document is Private and cannot be viewed by guest users.',
    };
  }

  switch (action) {
    case 'VIEW':
    case 'DOWNLOAD':
      return { allowed: true };

    case 'RENAME':
    case 'EDIT_CONTENT':
      if (doc.accessLevel === 'Read-only') {
        return {
          allowed: false,
          reason: 'Document is Read-only and cannot be edited.',
        };
      }
      if (!isOwner && doc.accessLevel !== 'Editable') {
        return {
          allowed: false,
          reason: 'Non-editable documents cannot be modified in Share View.',
        };
      }
      return { allowed: true };

    case 'DELETE':
      if (!isOwner) {
        return {
          allowed: false,
          reason: 'Only the document owner can delete files.',
        };
      }
      return { allowed: true };

    default:
      return { allowed: false, reason: 'Action not recognized.' };
  }
}