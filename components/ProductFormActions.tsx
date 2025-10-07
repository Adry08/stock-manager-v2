// components/ProductFormActions.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Plus, Edit3 } from "lucide-react";

interface ProductFormActionsProps {
  loading: boolean;
  isEditMode: boolean;
  onCancel: () => void;
}

export default function ProductFormActions({
  loading,
  isEditMode,
  onCancel,
}: ProductFormActionsProps) {
  return (
    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm z-10"> 
      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Annuler
        </Button>
        <Button 
          type="submit" 
          disabled={loading} 
          className="min-w-[120px] bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : isEditMode ? (
            <Edit3 className="w-4 h-4 mr-2" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          {loading ? "Sauvegarde..." : isEditMode ? "Modifier" : "Ajouter"}
        </Button>
      </div>
    </div>
  );
}