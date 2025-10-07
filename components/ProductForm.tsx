"use client";

import { useState } from "react";
import { Currency, Product, ProductFormData } from "@/types";
import { z } from "zod";
import * as zod from "zod";

import ProductDetailsForm from "./ProductDetailsForm";
import ProductStatusSelector from "./ProductStatusSelector";
import ProductFormActions from "./ProductFormActions";

interface ProductFormProps {
  product?: Product;
  onSubmit: (values: ProductFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  defaultCurrency?: string;
  exchangeRates?: Record<string, number>;
}

const productSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  purchase_price: z
    .number()
    .nonnegative("Le prix d'achat doit être positif")
    .optional(),
  estimated_selling_price: z
    .number()
    .nonnegative("Le prix estimé doit être positif")
    .optional(),
  quantity: z
    .number()
    .positive("La quantité doit être supérieure à 0"), // <-- obligatoire > 0
  currency: z.enum(["MGA", "USD", "EUR", "GBP"]),
  status: z.enum(["stock", "vendu", "livraison"]),
});


export default function ProductForm({
  product,
  onSubmit,
  onCancel,
  loading,
  defaultCurrency = "MGA",
  exchangeRates,
}: ProductFormProps) {
  const getInitialValue = <T extends keyof Product>(
    field: T,
    defaultValue: Product[T] | undefined
  ): Product[T] | undefined => {
    const value = product?.[field];
    if (field === "description") {
      return value === null || value === "" ? undefined : value;
    }
    return value ?? defaultValue;
  };

  const [formData, setFormData] = useState<ProductFormData>({
    name: getInitialValue("name", "") as string,
    description: getInitialValue("description", undefined) as
      | string
      | undefined,
    purchase_price: getInitialValue(
      "purchase_price",
      undefined
    ) as number | undefined,
    estimated_selling_price: getInitialValue(
      "estimated_selling_price",
      undefined
    ) as number | undefined,
    quantity: getInitialValue("quantity", undefined) as number | undefined,
    currency: getInitialValue(
      "currency",
      defaultCurrency as "MGA" | "USD" | "EUR" | "GBP"
    ) as "MGA" | "USD" | "EUR" | "GBP",
    status: getInitialValue("status", "stock") as
      | "stock"
      | "vendu"
      | "livraison",
  });

  const [errors, setErrors] = useState<zod.ZodIssue[]>([]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    let finalValue: string | number | undefined = value;

    if (type === "number") {
      finalValue = value === "" ? undefined : Number(value);
    }

    setFormData((prev) => ({ ...prev, [name]: finalValue }));
    setErrors((prev) => prev.filter((err) => err.path[0] !== name));
  };

  const handleSelectChange = (name: keyof ProductFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => prev.filter((err) => err.path[0] !== name));
  };

  const handleStatusChange = (status: ProductFormData["status"]) => {
    setFormData((prev) => ({ ...prev, status }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = productSchema.safeParse(formData);

    if (result.success) {
      const apiValues: ProductFormData = {
        ...result.data,
        description: result.data.description || undefined,
        image_url: null, // ajout automatique ici
      };

      onSubmit(apiValues).catch((e) => {
        console.error("Erreur d'envoi du formulaire:", e);
      });
    } else {
      setErrors(result.error.issues);
    }
  };

  const getErrorMessage = (fieldName: string) => {
    return errors.find((err) => err.path[0] === fieldName)?.message;
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
      <ProductDetailsForm
        formData={formData}
        handleChange={handleChange}
        handleSelectChange={handleSelectChange}
        getErrorMessage={getErrorMessage}
        defaultCurrency={defaultCurrency as Currency}
        exchangeRates={exchangeRates}
      />

      <ProductStatusSelector
        status={formData.status}
        onStatusChange={handleStatusChange}
      />

      <ProductFormActions
        loading={loading || false}
        isEditMode={!!product}
        onCancel={onCancel}
      />
    </form>
  );
}
