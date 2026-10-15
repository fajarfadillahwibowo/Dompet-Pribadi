import { type NextRequest, NextResponse } from 'next/server';
import { supabaseProxy } from './lib/supabase/proxy';
import { ENVIRONMENT } from './config/environment';

export async function proxy(request: NextRequest) {
  if (ENVIRONMENT.supabaseUrl && ENVIRONMENT.supabaseKey) {
    return await supabaseProxy(request);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
