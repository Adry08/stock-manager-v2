// components/MobileCalendarSheet.tsx
"use client";

import { useEffect, useState } from "react";
import { Product } from "@/types";
import { Client } from "@/types/client";
import DeliveryCalendar from "./DeliveryCalendar";
import { X } from "lucide-react";

interface MobileCalendarSheetProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  products: Product[];
  selectedDate: string | null;
  onDateSelect: (date: string | null) => void;
}

export default function MobileCalendarSheet({
  isOpen,
  onClose,
  clients,
  products,
  selectedDate,
  onDateSelect,
}: MobileCalendarSheetProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
    
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen && !isAnimating) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 lg:hidden ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 lg:hidden transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col">
          {/* Handle bar */}
          <div className="flex justify-center py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Calendrier des livraisons
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="p-4">
              <DeliveryCalendar
                clients={clients}
                products={products}
                selectedDate={selectedDate}
                onDateSelect={(date) => {
                  onDateSelect(date);
                  if (date) {
                    // Ne pas fermer automatiquement pour permettre de voir les détails
                    // onClose();
                  }
                }}
              />
            </div>
          </div>

          {/* Footer avec actions */}
          {selectedDate && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onDateSelect(null);
                  }}
                  className="flex-1 py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Réinitialiser
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-colors shadow-lg"
                >
                  Voir les produits
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}