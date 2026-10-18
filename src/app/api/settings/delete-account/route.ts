import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const userId = user.id;

  // Try RPC first (executes cascading delete from auth.users)
  const { error: rpcError } = await supabase.rpc('delete_user_account');

  if (rpcError) {
    // Fall back to admin client
    try {
      const admin = createAdminClient();
      await admin.auth.admin.deleteUser(userId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete account';
      return NextResponse.json({ error: { code: 'DELETE_FAILED', message } }, { status: 500 });
    }
  }

  // Sign out
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true, message: 'Account and associated data deleted' });
}
