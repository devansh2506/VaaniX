import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getModelHealth } from '@/lib/model-client';

export async function GET() {
  let dbStatus: 'ok' | 'down' = 'ok';
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('banks').select('id').limit(1);
    if (error && !error.message.includes('placeholder')) {
      dbStatus = 'down';
    }
  } catch {
    dbStatus = 'down';
  }

  let modelStatus: 'ok' | 'offline' | 'stub' = 'offline';
  try {
    const modelHealth = await getModelHealth();
    if (modelHealth && modelHealth.status === 'ok') {
      modelStatus = modelHealth.stub ? 'stub' : 'ok';
    }
  } catch {
    modelStatus = 'offline';
  }

  return NextResponse.json({
    web: 'ok',
    db: dbStatus,
    model: modelStatus,
    timestamp: new Date().toISOString(),
  });
}
