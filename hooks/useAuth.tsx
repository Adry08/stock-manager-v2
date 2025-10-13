"use client";

import { useState, useEffect, createContext, useContext, ReactNode, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getProfile } from "@/services/api";
import { Profile } from "@/types";
import { createPagesBrowserClient, SupabaseClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/database";

interface AuthContextType {
  user: Profile | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  supabase: SupabaseClient<Database>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const supabase = useMemo(() => createPagesBrowserClient<Database>(), []);

  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      console.log("[AuthProvider] Initialisation de la session...");
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) console.error("[AuthProvider] getSession error:", error);

      if (session?.user && mounted) {
        try {
          const profile = await getProfile(session.user.id);
          setUser(profile);
          console.log("[AuthProvider] Profil récupéré :", profile);
        } catch (err) {
          console.error("[AuthProvider] Impossible de récupérer le profil :", err);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      if (mounted) setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const supabaseUser = session?.user ?? null;
      if (supabaseUser) {
        try {
          const profile = await getProfile(supabaseUser.id);
          setUser(profile);
          console.log("[AuthProvider] Profil mis à jour :", profile);
        } catch (err) {
          console.log(err);
          
          setUser(null);
        }
      } else {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data.user) {
        const profile = await getProfile(data.user.id);
        setUser(profile);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.error(error);
      setUser(null);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, supabase }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be utilisé dans AuthProvider");
  return context;
};
