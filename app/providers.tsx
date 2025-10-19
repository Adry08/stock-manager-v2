// app/providers.tsx
"use client";

import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ThemeProvider as NextThemeProvider } from "next-themes";
import { supabase } from "@/lib/supabaseClient";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 30 * 60 * 1000,
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            retry: 2,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            retry: 1,
            onError: (error) => console.error("Mutation error:", error),
          },
        },
      })
  );

  // Vérification UNE SEULE FOIS au montage
  useEffect(() => {
    let isMounted = true;
    let hasRun = false; // Pour s'assurer que ça ne tourne qu'une fois

    const cleanupExpiredCache = async () => {
      if (hasRun || !isMounted) return;
      hasRun = true;

      try {
        console.log("🧹 Vérification initiale de la session...");

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Erreur récupération session:", error);
          return;
        }

        // Vérifier si la session est expirée
        const isSessionExpired = session?.expires_at 
          ? Date.now() >= session.expires_at * 1000
          : !session;

        if (!session || isSessionExpired) {
          console.log("⏳ Session absente ou expirée, tentative de refresh...");
          const { data, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.warn("Impossible de régénérer la session:", refreshError.message);
          } else if (data.session) {
            console.log("✅ Session régénérée avec succès");
            queryClient.invalidateQueries({ queryKey: ['auth'] });
          }
        } else {
          console.log("✅ Session valide - pas d'action nécessaire");
        }

      } catch (err) {
        console.error("Erreur lors de la vérification de session:", err);
      } finally {
        if (isMounted) {
          setIsInitialized(true);
        }
      }
    };

    // Exécuter une seule fois après un court délai
    const timeoutId = setTimeout(cleanupExpiredCache, 500);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [queryClient]); // Pas de dépendances qui causent des re-rendus

  // Écouter les changements de session via Supabase Auth State
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      console.log(`🔐 Changement d'état auth: ${event}`);
      
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        // Invalider le cache lié à l'authentification
        queryClient.invalidateQueries({ queryKey: ['auth'] });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  // Gestion de la connectivité
  useEffect(() => {
    const handleOnline = () => {
      console.log("🌐 Connexion rétablie - revalidation des données");
      queryClient.invalidateQueries();
    };

    const handleOffline = () => {
      console.log("📵 Mode hors ligne");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [queryClient]);

  // Afficher un loader pendant l'initialisation si nécessaire
  if (!isInitialized) {
    return (
      <QueryClientProvider client={queryClient}>
        <NextThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <ThemeProvider>
            <div className="flex items-center justify-center min-h-screen">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </ThemeProvider>
        </NextThemeProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <NextThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <ThemeProvider>{children}</ThemeProvider>
      </NextThemeProvider>
      {process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}