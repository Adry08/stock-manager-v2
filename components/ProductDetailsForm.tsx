// components/ProductDetailsForm.tsx
"use client";

import { ProductFormData, Currency } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { convertToDefaultCurrency, formatPrice } from "@/services/currency";

interface ProductDetailsFormProps {
  formData: ProductFormData;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleSelectChange: (name: keyof ProductFormData, value: Currency) => void;
  getErrorMessage: (fieldName: string) => string | undefined;
  defaultCurrency: Currency;
  exchangeRates?: Record<string, number>;
}

const currencyOptions: Currency[] = ["MGA", "USD", "EUR", "GBP"];

export default function ProductDetailsForm({
  formData,
  handleChange,
  handleSelectChange,
  getErrorMessage,
  defaultCurrency,
  exchangeRates,
}: ProductDetailsFormProps) {
  const [convertedPurchasePrice, setConvertedPurchasePrice] = useState<number | null>(null);
  const [conversionLoading, setConversionLoading] = useState(false);

  const handleSelectChangeSafe = (name: keyof ProductFormData, value: string) => {
    handleSelectChange(name, value as Currency);
  };

  useEffect(() => {
    const convertPurchasePrice = async () => {
      if (!formData.purchase_price || formData.purchase_price <= 0) {
        setConvertedPurchasePrice(null);
        return;
      }

      if (!formData.currency || formData.currency === defaultCurrency) {
        setConvertedPurchasePrice(formData.purchase_price);
        return;
      }

      setConversionLoading(true);
      try {
        const converted = await convertToDefaultCurrency(
          formData.purchase_price,
          formData.currency,
          defaultCurrency,
          (exchangeRates as Record<Currency, number>) || {}
        );
        setConvertedPurchasePrice(converted);
      } catch (error) {
        console.error("Erreur de conversion:", error);
        setConvertedPurchasePrice(null);
      } finally {
        setConversionLoading(false);
      }
    };

    convertPurchasePrice();
  }, [formData.purchase_price, formData.currency, defaultCurrency, exchangeRates]);

  return (
    <div className="flex-1 overflow-y-auto px-6 pt-4 pb-1">
      <div className="space-y-6">
        {/* Section 1: Nom, Quantité et Description courte */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">Nom du produit ✨</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nom du produit"
            />
            {getErrorMessage("name") && (
              <p className="text-red-500 text-sm mt-1">{getErrorMessage("name")}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Qté. 🔢</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              value={formData.quantity ?? ""}
              onChange={handleChange}
              placeholder="1"
            />
            {getErrorMessage("quantity") && (
              <p className="text-red-500 text-sm mt-1">{getErrorMessage("quantity")}</p>
            )}
          </div>

          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="description">Description courte 🏷️</Label>
            <Input
              id="description"
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              placeholder="Ex: 'Édition limitée', 'Couleur Rouge Vif'"
            />
          </div>
        </div>

        {/* Section 2: Prix & Coûts */}
        <div className="space-y-3 pt-3 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center">
            💰 Prix & Coûts
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Prix d'achat & Devise */}
            <div className="space-y-2 p-3 border border-red-100 rounded-lg md:col-span-2">
              <Label htmlFor="purchase_price" className="text-xs font-medium text-red-700 flex items-center">
                Prix Achat 📉
              </Label>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  id="purchase_price"
                  name="purchase_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.purchase_price ?? ""}
                  onChange={handleChange}
                  placeholder="0.00"
                />

                <Select
                  value={formData.currency}
                  onValueChange={(value) => handleSelectChangeSafe("currency", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Devise" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencyOptions.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.currency !== defaultCurrency &&
                formData.purchase_price &&
                formData.purchase_price > 0 && (
                  <div className="bg-red-100 border-l-2 border-red-500 p-1.5 text-xs mt-2">
                    <div className="flex items-center justify-between text-red-900">
                      <span className="font-medium flex items-center">
                        <ArrowRight className="w-3 h-3 mr-1" /> Équiv. {defaultCurrency}:
                      </span>
                      <span className="font-semibold">
                        {conversionLoading
                          ? "⏳"
                          : convertedPurchasePrice !== null
                          ? formatPrice(convertedPurchasePrice, defaultCurrency)
                          : "❌ Erreur"}
                      </span>
                    </div>
                  </div>
                )}
              {getErrorMessage("purchase_price") && (
                <p className="text-red-500 text-sm mt-1">
                  {getErrorMessage("purchase_price")}
                </p>
              )}
            </div>

            {/* Prix de vente estimé */}
            <div className="space-y-2 p-3 border border-green-100 rounded-lg">
              <Label
                htmlFor="estimated_selling_price"
                className="text-xs font-medium text-green-700 flex items-center"
              >
                Prix Vente Est. 🚀 ({defaultCurrency})
              </Label>

              <Input
                id="estimated_selling_price"
                name="estimated_selling_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.estimated_selling_price ?? ""}
                onChange={handleChange}
                placeholder={`Montant ${defaultCurrency}`}
              />
              {getErrorMessage("estimated_selling_price") && (
                <p className="text-red-500 text-sm mt-1">
                  {getErrorMessage("estimated_selling_price")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
