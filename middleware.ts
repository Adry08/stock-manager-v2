// /middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  console.log("[Middleware] Vérification de la session...");

  const res = NextResponse.next();

  // ✅ nouveau client middleware officiel
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.warn("[Middleware] Erreur auth.getUser:", error.message);
  }

  const { pathname } = req.nextUrl;
  const isLoginPage = pathname === "/";

  // 🔒 Pas connecté → redirige vers login
  if (!user && !isLoginPage) {
    console.log("[Middleware] Aucun utilisateur, redirection vers /");
    return NextResponse.redirect(new URL("/", req.url));
  }

  // ✅ Connecté et sur login → redirige vers dashboard
  if (user && isLoginPage) {
    console.log("[Middleware] Déjà connecté, redirection vers /dashboard");
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  console.log("[Middleware] Accès autorisé :", pathname);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
