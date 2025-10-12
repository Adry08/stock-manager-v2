"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";

function Input({
  icon: Icon,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ElementType }) {
  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500" size={18} />}
      <input
        className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl 
        bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
        focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 
        outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
        {...props}
      />
    </div>
  );
}

function Button({
  children,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`w-full px-4 py-2 rounded-xl font-medium text-white 
      bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 
      transition-all flex items-center justify-center gap-2 ${
        disabled ? "opacity-60 cursor-not-allowed" : ""
      }`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export default function LoginPage() {
  const { user, login, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Redirection automatique si connecté
  useEffect(() => {
    if (user) {
      console.log("[LoginPage] Redirection vers dashboard via window.location");
      window.location.href = "/dashboard"; // redirection garantie
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setSubmitting(false);
    }
  };

  // Spinner pendant le chargement ou redirection
  if (loading || user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600 dark:text-blue-400" />
        {user && <p className="mt-2 text-gray-700 dark:text-gray-300">Redirection en cours...</p>}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 transition-colors duration-300">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-6 space-y-5"
      >
        <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100">
          Connexion
        </h1>

        {error && <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>}

        <Input
          icon={Mail}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="relative">
          <Input
            icon={Lock}
            type={showPwd ? "text" : "password"}
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="absolute right-3 top-2.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-transform duration-150 active:scale-90"
          >
            {showPwd ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </div>

        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="animate-spin h-5 w-5" />}
          Se connecter
        </Button>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} – Stock Manager
        </p>
      </form>
    </div>
  );
}
