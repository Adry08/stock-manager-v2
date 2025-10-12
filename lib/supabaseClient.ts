// lib/supabaseClient.ts
'use client';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/database'; // ton type Database

export const supabase = createPagesBrowserClient<Database>();
