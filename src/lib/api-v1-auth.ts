import { hashApiKey, hasScope, type ApiScope } from '@/lib/api-keys';
import { createAdminClient } from '@/lib/supabase/admin';

export interface ApiClientRecord {
  id: string;
  owner_user_id: string;
  name: string;
  scopes: string[];
}

export type AuthResult =
  | { authenticated: true; client: ApiClientRecord }
  | { authenticated: false; error: { code: string; message: string }; status: number };

/**
 * Authenticate incoming HTTP request using Bearer API key.
 * Validates key exists, is not revoked, and holds required scope.
 */
export async function authenticateApiKey(
  request: Request,
  requiredScope?: ApiScope
): Promise<AuthResult> {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authenticated: false,
      error: { code: 'UNAUTHORIZED', message: 'Missing or malformed Authorization header (Bearer token required)' },
      status: 401,
    };
  }

  const rawKey = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!rawKey) {
    return {
      authenticated: false,
      error: { code: 'UNAUTHORIZED', message: 'Empty API key provided' },
      status: 401,
    };
  }

  const keyHash = hashApiKey(rawKey);
  const admin = createAdminClient();

  const { data: client, error } = await admin
    .from('api_clients')
    .select('id, owner_user_id, name, scopes, revoked_at, request_count')
    .eq('key_hash', keyHash)
    .single();

  if (error || !client) {
    return {
      authenticated: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid API key' },
      status: 401,
    };
  }

  if (client.revoked_at) {
    return {
      authenticated: false,
      error: { code: 'KEY_REVOKED', message: 'This API key has been revoked' },
      status: 401,
    };
  }

  if (requiredScope && !hasScope(client.scopes, requiredScope)) {
    return {
      authenticated: false,
      error: {
        code: 'FORBIDDEN',
        message: `API key lacks required scope: '${requiredScope}'`,
      },
      status: 403,
    };
  }

  // Update last_used_at and increment request_count asynchronously
  const count = typeof client.request_count === 'number' ? client.request_count + 1 : 1;
  void admin
    .from('api_clients')
    .update({
      last_used_at: new Date().toISOString(),
      request_count: count,
    })
    .eq('id', client.id);

  return {
    authenticated: true,
    client: {
      id: client.id,
      owner_user_id: client.owner_user_id,
      name: client.name,
      scopes: client.scopes,
    },
  };
}
