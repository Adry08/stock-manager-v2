"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
// Importation de usePathname pour l'App Router
import { useRouter, usePathname } from "next/navigation"; 
import { createClient, SupabaseClient, User } from "@supabase/supabase-js";
import { Profile } from "@/types"; // Assurez-vous que ce chemin est correct
import { getProfile } from "@/services/api"; // Assurez-vous que ce chemin est correct
import { Loader2 } from "lucide-react"; 

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

interface AuthContextType {
  user: Profile | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  supabase: SupabaseClient;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const router = useRouter();
  // Récupérer le chemin actuel avec usePathname
  const pathname = usePathname(); 
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        
        const supabaseUser: User | null = session?.user ?? null;
        
        if (supabaseUser) {
          try {
            // Utilisateur connecté
            const profile = await getProfile(supabaseUser.id);
            setUser(profile);
            
            // Rediriger vers /dashboard si l'utilisateur est sur la page de login ("/")
            if (pathname === "/") { 
              router.push("/dashboard"); 
            }
          } catch (error) {
            console.error("Error fetching profile:", error);
            setUser(null);
            // Déconnexion forcée si le profil n'a pas pu être chargé
            await supabase.auth.signOut(); 
            router.push("/");
          }
        } else {
          // Utilisateur déconnecté ou session expirée
          setUser(null);
          
          // Rediriger vers la page de login ("/") si l'utilisateur est sur une page protégée
          if (pathname !== "/") {
            router.push("/"); 
          }
        }
        
        // S'assurer que loading est désactivé après le premier check
        if (loading) {
          setLoading(false);
        }
      }
    );

    // Vérification initiale pour gérer le premier chargement
    const initialCheck = async () => {
      try {
        await supabase.auth.getSession();
        // Le listener onAuthStateChange va prendre le relai et définir l'état
      } catch (error) {
        console.error("Error during initial session check:", error);
        if (mounted) setLoading(false);
      }
    }

    initialCheck();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, pathname]); // Ajout de pathname et router aux dépendances

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading,
    supabase,
  };

  // Loader moderne lorsque l'application charge l'état initial
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
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