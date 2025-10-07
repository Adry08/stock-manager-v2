// components/modals/ProductFormModal.tsx
"use client";

import { useState, useEffect } from "react";
import { Product, ProductFormData } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import ProductForm from "../ProductForm";

const useIsMobile = (breakpoint: number = 768) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth < breakpoint);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [breakpoint]);

  return isMobile;
};

interface ProductFormModalProps {
  product?: Product;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: ProductFormData) => Promise<void>;
  defaultCurrency?: string;
  exchangeRates?: Record<string, number>;
}

export default function ProductFormModal({
  product,
  isOpen,
  onClose,
  onSubmit,
  defaultCurrency = "MGA",
  exchangeRates,
}: ProductFormModalProps) {
  const [loading, setLoading] = useState(false);
  const isEditMode = !!product;

  const isMobile = useIsMobile();
  const title = isEditMode ? "Modifier le produit" : "Ajouter un produit";

  const handleSubmit = async (values: ProductFormData) => {
    setLoading(true);
    try {
      await onSubmit(values);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const FormContent = (
    <ProductForm
      product={product}
      onSubmit={handleSubmit}
      onCancel={onClose}
      loading={loading}
      defaultCurrency={defaultCurrency}
      exchangeRates={exchangeRates}
    />
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent
          side="bottom"
          className="h-full max-h-[95vh] rounded-t-xl overflow-y-auto p-0 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
        >
          <SheetHeader className="px-6 pt-6 pb-2 border-b dark:border-gray-700 sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-10">
            <SheetTitle className="text-gray-900 dark:text-gray-100">{title}</SheetTitle>
          </SheetHeader>
          {FormContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col p-0 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <DialogHeader className="px-6 pt-6 pb-2 border-b dark:border-gray-700 flex-shrink-0">
          <DialogTitle className="text-gray-900 dark:text-gray-100">{title}</DialogTitle>
        </DialogHeader>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">{FormContent}</div>
      </DialogContent>
    </Dialog>
  );
}