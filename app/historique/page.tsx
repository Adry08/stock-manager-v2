// app/history/page.tsx
"use client";

import { useAuth } from "@/hooks/useAuth";
import MovementList from "@/components/MovementList";
import { Loader2 } from "lucide-react";

export default function HistoryPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="container mx-auto max-w-full p-4 sm:p-6 lg:p-8 pt-[calc(3rem+env(safe-area-inset-top))] pb-[calc(3rem+env(safe-area-inset-bottom))]">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-full p-4 sm:p-6 lg:p-8 pt-[calc(3rem+env(safe-area-inset-top))] pb-[calc(3rem+env(safe-area-inset-bottom))]">
        <div className="text-center py-12">
          <p className="text-gray-600">Connexion requise pour voir l'historique</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-full p-4 sm:p-6 lg:p-8 space-y-6 pt-[calc(3rem+env(safe-area-inset-top))] pb-[calc(3rem+env(safe-area-inset-bottom))]">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 sm:mb-8 border-b pb-3 sm:pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Historique des mouvements
        </h1>
      </div>

      {/* Composant MovementList qui gère tout */}
      <MovementList pageSize={20} />
    </div>
  );
}