import * as React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppNav } from '@/components/layout/app-nav';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isConfigured = Boolean(
    supabaseUrl && !supabaseUrl.includes('placeholder')
  );

  // If Supabase is fully configured and there is no user session, redirect to login
  if (isConfigured && !user) {
    redirect('/login');
  }

  let displayName: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();
    displayName = profile?.display_name || user.user_metadata?.full_name || null;
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <AppNav
        userEmail={user?.email || 'demo@vaanix.example'}
        displayName={displayName || 'VaaniX User'}
      />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
