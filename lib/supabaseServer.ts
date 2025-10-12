import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type Cookie = { name: string; value: string; options?: CookieOptions };

export function createSupabaseServerClient(req: NextRequest, res: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: (): Cookie[] => {
          // ⚠️ NextRequest.cookies ne contient PAS d'options
          return req.cookies.getAll().map((c) => ({
            name: c.name,
            value: c.value,
          }));
        },
        setAll: (cookies: Cookie[]) => {
          cookies.forEach(({ name, value, options }) => {
            // options est typé CookieOptions mais facultatif
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );
}
