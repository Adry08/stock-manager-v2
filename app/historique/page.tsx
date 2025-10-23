// app/historique/page.tsx - UPGRADE avec tracking des items
// 🔄 Conserve toute la logique actuelle
// 🆕 Ajoute l'affichage des mouvements au niveau item

"use client";

import { useAuth } from "@/hooks/useAuth";
import MovementList from "@/components/MovementList";
import { Loader2, Activity, Info } from "lucide-react";

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
          <p className="text-gray-600 dark:text-gray-400">Connexion requise pour voir l'historique</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-full p-4 sm:p-6 lg:p-8 space-y-6 pt-[calc(3rem+env(safe-area-inset-top))] pb-[calc(3rem+env(safe-area-inset-bottom))]">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl">
            <Activity className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Historique des mouvements
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Traçabilité complète de vos produits et items
            </p>
          </div>
        </div>

        {/* 🆕 AJOUT - Info sur le tracking unitaire */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 mt-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-1">
                Tracking au niveau unitaire
              </h3>
              <p className="text-xs text-indigo-700 dark:text-indigo-300">
                Les mouvements affichent maintenant les changements au niveau des items individuels. 
                Chaque item a son propre historique de statut et modifications.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Composant MovementList qui gère tout */}
      <MovementList pageSize={20} />
    </div>
  );
}