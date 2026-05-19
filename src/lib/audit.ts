import { supabase } from './supabase';
import type { UserRole } from '../types/database';

export type AuditAction = 'view' | 'create' | 'update' | 'delete' | 'export' | 'login' | 'logout' | 'password_change';

interface LogAuditParams {
  actorId: string | null;
  actorRole: UserRole | null;
  action: AuditAction;
  resourceType: string;
  resourceId?: string | null;
  targetUserId?: string | null;
  metadata?: Record<string, unknown>;
}

export async function logAudit(params: LogAuditParams): Promise<void> {
  if (!params.actorId) return;
  try {
    await supabase.from('audit_logs').insert({
      actor_id: params.actorId,
      actor_role: params.actorRole,
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId ?? null,
      target_user_id: params.targetUserId ?? null,
      metadata: params.metadata ?? {},
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    });
  } catch (err) {
    console.warn('audit log failed', err);
  }
}
