"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation"; 
import { createBrowserClient } from '@supabase/ssr'
import { User } from "@supabase/supabase-js";
import { Profile } from "@/types";
import { getProfile } from "@/services/api";
import { Loader2 } from "lucide-react"; 

interface AuthContextType {
  user: Profile | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  supabase: ReturnType<typeof createBrowserClient>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const router = useRouter();
  const pathname = usePathname(); 
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // Créer le client Supabase avec gestion automatique des cookies
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    let mounted = true;
    let redirectTimeout: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        // Vérifier et rafraîchir la session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        // Si erreur de session, nettoyer et rediriger
        if (sessionError) {
          console.error("Session error:", sessionError);
          await supabase.auth.signOut();
          setUser(null);
          setLoading(false);
          setInitialCheckDone(true);
          if (pathname !== "/") {
            router.push("/");
          }
          return;
        }
        
        if (session?.user && mounted) {
          try {
            // Timeout pour éviter le chargement infini
            const profilePromise = getProfile(session.user.id);
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
            );
            
            const profile = await Promise.race([profilePromise, timeoutPromise]) as Profile;
            
            if (mounted) {
              setUser(profile);
              setLoading(false);
              setInitialCheckDone(true);
              
              if (pathname === "/") { 
                redirectTimeout = setTimeout(() => router.push("/dashboard"), 100);
              }
            }
          } catch (error) {
            console.error("Error fetching profile:", error);
            // En cas d'erreur, déconnecter proprement
            await supabase.auth.signOut();
            if (mounted) {
              setUser(null);
              setLoading(false);
              setInitialCheckDone(true);
              router.push("/");
            }
          }
        } else if (mounted) {
          setUser(null);
          setLoading(false);
          setInitialCheckDone(true);
          
          if (pathname !== "/" && !pathname.startsWith("/_next")) {
            redirectTimeout = setTimeout(() => router.push("/"), 100);
          }
        }
      } catch (error) {
        console.error("Error during auth initialization:", error);
        if (mounted) {
          setUser(null);
          setLoading(false);
          setInitialCheckDone(true);
        }
      }
    };

    initializeAuth();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted || !initialCheckDone) return;
        
        console.log('Auth event:', event);
        
        // Gérer le rafraîchissement du token
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
          return; // Ne pas recharger le profil
        }
        
        // Gérer la déconnexion
        if (event === 'SIGNED_OUT') {
          setUser(null);
          router.push("/");
          return;
        }
        
        const supabaseUser: User | null = session?.user ?? null;
        
        if (supabaseUser && event === 'SIGNED_IN') {
          try {
            const profile = await getProfile(supabaseUser.id);
            setUser(profile);
            
            if (pathname === "/") { 
              redirectTimeout = setTimeout(() => router.push("/dashboard"), 100);
            }
          } catch (error) {
            console.error("Error fetching profile:", error);
            setUser(null);
            await supabase.auth.signOut();
            router.push("/");
          }
        } else if (!supabaseUser && event !== 'INITIAL_SESSION') {
          setUser(null);
          if (pathname !== "/") {
            router.push("/"); 
          }
        }
      }
    );

    return () => {
      mounted = false;
      if (redirectTimeout) clearTimeout(redirectTimeout);
      subscription.unsubscribe();
    };
  }, [router, pathname, supabase]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      if (error) throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    login,
    logout,
    loading,
    supabase,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="animate-spin h-10 w-10 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};