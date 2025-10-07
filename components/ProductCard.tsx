// components/ProductCard.tsx
"use client";

import { Currency, Product } from "@/types";
import { Card, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Loader2, Package } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { convertToDefaultCurrency, formatPrice } from "@/services/currency";

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  defaultCurrency: string;
  exchangeRates?: Record<string, number>;
}

export default function ProductCard({
  product,
  onEdit,
  onDelete,
  isDeleting,
  defaultCurrency,
  exchangeRates,
}: ProductCardProps) {
  const isSold = product.status === "vendu";
  const quantity = product.quantity || 1;

  const [convertedPrices, setConvertedPrices] = useState({
    purchasePrice: 0,
    sellingPrice: 0,
    loading: true,
  });

  useEffect(() => {
    const convertPrices = async () => {
      try {
        setConvertedPrices((prev) => ({ ...prev, loading: true }));

        const purchasePriceConverted = await convertToDefaultCurrency(
          product.purchase_price || 0,
          product.currency as Currency,
          defaultCurrency as Currency,
          exchangeRates || {}
        );

        const sellingPrice =
          product.selling_price ?? product.estimated_selling_price ?? 0;

        setConvertedPrices({
          purchasePrice: purchasePriceConverted,
          sellingPrice: sellingPrice,
          loading: false,
        });
      } catch (error) {
        console.error("Erreur lors de la conversion des prix:", error);
        setConvertedPrices({
          purchasePrice: product.purchase_price || 0,
          sellingPrice:
            product.selling_price ?? product.estimated_selling_price ?? 0,
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
  ]);

  return (
    <Card
      className={`overflow-hidden rounded-xl shadow-md transition-transform hover:scale-[1.02] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 ${
        isSold ? "opacity-70" : ""
      }`}
    >
      {/* Image ou placeholder */}
      <div className="relative h-32 sm:h-40 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
            width={300}
            height={200}
          />
        ) : (
          <Package className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        )}

        {/* Badge quantité */}
        <Badge
          variant="secondary"
          className="absolute top-2 left-2 bg-blue-500 hover:bg-blue-600 text-white font-bold"
        >
          × {quantity}
        </Badge>

        {/* Badge statut */}
        <Badge
          className={`absolute top-2 right-2 ${
            product.status === "stock"
              ? "bg-green-500 hover:bg-green-600"
              : product.status === "livraison"
              ? "bg-yellow-500 hover:bg-yellow-600"
              : "bg-red-500 hover:bg-red-600"
          }`}
        >
          {product.status === "stock"
            ? "Stock"
            : product.status === "livraison"
            ? "Livraison"
            : "Vendu"}
        </Badge>
      </div>

      <div className="p-3 sm:p-4 flex flex-col justify-between text-sm space-y-1">
        {/* Nom du produit */}
        <div className="flex items-center justify-between">
          <h3 className="text-md sm:text-lg font-semibold truncate flex-1 mr-2 text-gray-900 dark:text-gray-100">
            {product.name}
          </h3>
        </div>

        {/* Description */}
        <p
          title={product.description || "Aucune description"}
          className="text-gray-500 dark:text-gray-400 text-xs truncate h-4"
        >
          {product.description || <span>&nbsp;</span>}
        </p>

        {/* Prix d'achat (devise originale) */}
        <p className="text-gray-500 dark:text-gray-400">
          Achat: {formatPrice(product.purchase_price || 0, product.currency as Currency)}
        </p>

        {/* Prix d'achat converti */}
        {product.currency !== defaultCurrency && (
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            Achat ({defaultCurrency}):{" "}
            {convertedPrices.loading ? (
              <span className="inline-flex items-center">
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                Conversion...
              </span>
            ) : (
              formatPrice(convertedPrices.purchasePrice, defaultCurrency as Currency)
            )}
          </p>
        )}

        {/* Prix de vente */}
        <p className="text-indigo-600 dark:text-indigo-400 font-semibold">
          {isSold ? "Vendu" : "Vente estimée"} ({defaultCurrency}):{" "}
          {formatPrice(convertedPrices.sellingPrice, defaultCurrency as Currency)}
        </p>

        {/* Prix total */}
        {quantity > 1 && (
          <div className="border-t dark:border-gray-700 pt-2 mt-2">
            <p className="text-gray-600 dark:text-gray-400 text-xs">
              Achat total:{" "}
              {formatPrice(
                convertedPrices.purchasePrice * quantity,
                defaultCurrency as Currency
              )}
            </p>
            <p className="text-indigo-600 dark:text-indigo-400 font-medium text-xs">
              Vente totale:{" "}
              {formatPrice(
                convertedPrices.sellingPrice * quantity,
                defaultCurrency as Currency
              )}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between mt-1">
          <Badge
            className={`${
              product.status === "stock"
                ? "bg-green-500 hover:bg-green-600"
                : product.status === "livraison"
                ? "bg-yellow-500 hover:bg-yellow-600"
                : "bg-gray-500 hover:bg-gray-600"
            }`}
          >
            {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
          </Badge>

          {/* Profit si vendu */}
          {isSold && (
            <span className="text-xs font-medium text-green-600 dark:text-green-400">
              Profit:{" "}
              {formatPrice(
                (convertedPrices.sellingPrice - convertedPrices.purchasePrice) *
                  quantity,
                defaultCurrency as Currency
              )}
            </span>
          )}
        </div>
      </div>

      <CardFooter className="pt-2 border-t dark:border-gray-700 flex justify-end gap-2 bg-gray-50 dark:bg-gray-800">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(product)}
          disabled={isDeleting}
          className="rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
        >
          <Edit className="w-5 h-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(product.id)}
          disabled={isDeleting}
          className="rounded-full hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-600 dark:hover:text-red-400 transition"
        >
          {isDeleting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Trash2 className="w-5 h-5" />
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}