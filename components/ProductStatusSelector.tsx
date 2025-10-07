// components/ProductStatusSelector.tsx
"use client";

import { ProductFormData } from "@/types";
import { Button } from "@/components/ui/button";
import { CheckCircle, DollarSign, Truck, Tag } from "lucide-react"; 
import { Label } from "@/components/ui/label"; // Label UI component

interface ProductStatusSelectorProps {
  status: ProductFormData["status"];
  onStatusChange: (status: "stock" | "vendu" | "livraison") => void;
}

export default function ProductStatusSelector({ status, onStatusChange }: ProductStatusSelectorProps) {
  return (
    <div className="px-6">
      <Label htmlFor="status" className="flex items-center text-sm font-medium mb-2">
        <Tag className="w-4 h-4 mr-1 text-primary"/> Statut du Produit
      </Label>
      <div className="flex flex-col sm:flex-row sm:space-x-2 sm:space-y-0 mt-1 space-y-2">
        <Button
          type="button"
          variant={status === "stock" ? "default" : "outline"}
          onClick={() => onStatusChange("stock")}
          className={`flex-1 transition-all ${
            status === "stock"
              ? "bg-green-500 text-white hover:bg-green-600"
              : ""
          }`}
        >
          <CheckCircle className="w-4 h-4 mr-1" /> En stock
        </Button>
        <Button
          type="button"
          variant={status === "vendu" ? "default" : "outline"}
          onClick={() => onStatusChange("vendu")}
          className={`flex-1 transition-all ${
            status === "vendu"
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : ""
          }`}
        >
          <DollarSign className="w-4 h-4 mr-1" /> Vendu
        </Button>
        <Button
          type="button"
          variant={status === "livraison" ? "default" : "outline"}
          onClick={() => onStatusChange("livraison")}
          className={`flex-1 transition-all ${
            status === "livraison"
              ? "bg-yellow-500 text-white hover:bg-yellow-600"
              : ""
          }`}
        >
          <Truck className="w-4 h-4 mr-1" /> En Livraison
        </Button>
      </div>
    </div>
  );
}