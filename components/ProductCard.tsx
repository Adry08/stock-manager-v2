"use client";

import { Currency, Product } from "@/types";
import { Card, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Loader2, Package, UserCircle, Settings2 } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { convertToDefaultCurrency, formatPrice } from "@/services/currency";

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onClientClick?: (product: Product) => void;
  onManageItems?: (product: Product) => void; // 🆕 NOUVEAU
  isDeleting: boolean;
  defaultCurrency: string;
  exchangeRates?: Record<string, number>;
  hasClient?: boolean;
}

export default function ProductCard({
  product,
  onEdit,
  onDelete,
  onClientClick,
  onManageItems, // 🆕 NOUVEAU
  isDeleting,
  defaultCurrency,
  exchangeRates,
  hasClient = false,
}: ProductCardProps) {
  const isSold = product.status === "vendu";
  const isDelivery = product.status === "livraison";
  const showClientIcon = isDelivery || isSold;
  const quantity = product.quantity || 1;

  const [convertedPrices, setConvertedPrices] = useState({
    purchasePrice: 0,
    sellingPrice: 0,
    loading: true,
  });

  useEffect(() => {
    const convertPrices = async () => {
      setConvertedPrices((prev) => ({ ...prev, loading: true }));

      try {
        const purchasePriceConverted = await convertToDefaultCurrency(
          product.purchase_price || 0,
          product.currency as Currency,
          defaultCurrency as Currency,
          exchangeRates || {}
        );

        const sellingPrice =
          isDelivery
            ? 0
            : product.selling_price ?? product.estimated_selling_price ?? 0;

        setConvertedPrices({
          purchasePrice: purchasePriceConverted,
          sellingPrice,
          loading: false,
        });
      } catch (error) {
        console.error("Erreur lors de la conversion des prix:", error);
        setConvertedPrices({
          purchasePrice: product.purchase_price || 0,
          sellingPrice: isDelivery ? 0 : product.selling_price ?? product.estimated_selling_price ?? 0,
          loading: false,
        });
      }
    };

    convertPrices();
  }, [
    product.purchase_price,
    product.currency,
    product.selling_price,
    product.estimated_selling_price,
    defaultCurrency,
    exchangeRates,
    isDelivery,
  ]);

  return (
    <Card className={`flex flex-col h-full overflow-hidden rounded-2xl shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 ${isSold ? "opacity-90" : ""}`}>
      
      {/* Image et badges */}
      <div className="relative h-44 sm:h-52 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center overflow-hidden rounded-t-2xl">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
            width={400}
            height={300}
          />
        ) : (
          <Package className="w-12 h-12 text-gray-400 dark:text-gray-500" />
        )}

        <Badge className="absolute top-3 left-3 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg px-3 py-1">
          × {quantity}
        </Badge>

        <Badge
          className={`absolute top-3 right-3 font-semibold shadow-lg px-3 py-1 ${
            product.status === "stock"
              ? "bg-green-600 hover:bg-green-700"
              : product.status === "livraison"
              ? "bg-amber-500 hover:bg-amber-600"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {product.status === "stock" ? "En Stock" : product.status === "livraison" ? "Livraison" : "Vendu"}
        </Badge>

        {/* Bouton client */}
        {showClientIcon && onClientClick && (
          <button
            onClick={() => onClientClick(product)}
            className={`absolute bottom-3 right-3 p-2 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 ${
              hasClient
                ? "bg-green-500 hover:bg-green-600 text-white"
                : "bg-white hover:bg-gray-100 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
            }`}
            title={hasClient ? "Voir/Modifier le client" : "Ajouter un client"}
          >
            <UserCircle className="w-6 h-6" />
          </button>
        )}

        {/* 🆕 NOUVEAU - Bouton gérer les items (en bas à gauche) */}
        {onManageItems && quantity > 1 && (
          <button
            onClick={() => onManageItems(product)}
            className="absolute bottom-3 left-3 p-2 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 bg-indigo-500 hover:bg-indigo-600 text-white"
            title="Gérer les items unitaires"
          >
            <Settings2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Contenu du produit */}
      <div className="p-4 flex-1 flex flex-col space-y-3">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
          {product.name}
        </h3>

        <p
          title={product.description || "Aucune description"}
          className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 min-h-[2.5rem]"
        >
          {product.description || "Aucune description"}
        </p>

        <div className="border-t dark:border-gray-700 pt-3 space-y-2 flex-1">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400">Prix d'achat:</span>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {formatPrice(product.purchase_price || 0, product.currency as Currency)}
            </span>
          </div>

          {product.currency !== defaultCurrency && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Achat ({defaultCurrency}):
              </span>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {convertedPrices.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : formatPrice(convertedPrices.purchasePrice, defaultCurrency as Currency)}
              </span>
            </div>
          )}

          {isSold && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">Prix vendu:</span>
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                {convertedPrices.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : formatPrice(convertedPrices.sellingPrice, defaultCurrency as Currency)}
              </span>
            </div>
          )}

          {quantity > 1 && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-2 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 dark:text-gray-400">Total achat:</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {formatPrice(convertedPrices.purchasePrice * quantity, defaultCurrency as Currency)}
                </span>
              </div>
              {isSold && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Total vente:</span>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {formatPrice(convertedPrices.sellingPrice * quantity, defaultCurrency as Currency)}
                  </span>
                </div>
              )}
            </div>
          )}

          {isSold && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-green-700 dark:text-green-400">Profit total:</span>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  {formatPrice((convertedPrices.sellingPrice - convertedPrices.purchasePrice) * quantity, defaultCurrency as Currency)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer avec boutons */}
      <CardFooter className="p-4 flex justify-between items-center mt-auto border-t dark:border-gray-700">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(product)}
            disabled={isDeleting}
            className="rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
          >
            <Edit className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(product.id)}
            disabled={isDeleting}
            className="rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-all"
          >
            {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}