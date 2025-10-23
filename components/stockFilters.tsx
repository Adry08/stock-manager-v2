// components/StockFilters.tsx - Filtres avancés pour Stock
"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export interface StockFiltersState {
  searchTerm: string;
  sortBy: 'name' | 'quantity' | 'purchase_price' | 'estimated_selling_price' | 'created_at';
  sortDirection: 'asc' | 'desc';
  minQuantity: string;
  maxQuantity: string;
  minPrice: string;
  maxPrice: string;
  currency: string;
}

interface StockFiltersProps {
  filters: StockFiltersState;
  onFiltersChange: (filters: StockFiltersState) => void;
  onReset: () => void;
  availableCurrencies: string[];
}

export default function StockFilters({
  filters,
  onFiltersChange,
  onReset,
  availableCurrencies,
}: StockFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters = 
    filters.minQuantity || 
    filters.maxQuantity || 
    filters.minPrice || 
    filters.maxPrice || 
    filters.currency !== 'all';

  const handleReset = () => {
    onReset();
    setIsOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Barre de recherche et tri rapide */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Rechercher par nom, description..."
            value={filters.searchTerm}
            onChange={(e) => onFiltersChange({ ...filters, searchTerm: e.target.value })}
            className="pl-10 pr-10"
          />
          {filters.searchTerm && (
            <button
              onClick={() => onFiltersChange({ ...filters, searchTerm: '' })}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tri rapide */}
        <div className="flex gap-2">
          <Select
            value={filters.sortBy}
            onValueChange={(value: any) => onFiltersChange({ ...filters, sortBy: value })}
          >
            <SelectTrigger className="w-[180px]">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nom</SelectItem>
              <SelectItem value="quantity">Quantité</SelectItem>
              <SelectItem value="purchase_price">Prix d'achat</SelectItem>
              <SelectItem value="estimated_selling_price">Prix de vente</SelectItem>
              <SelectItem value="created_at">Date d'ajout</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => onFiltersChange({
              ...filters,
              sortDirection: filters.sortDirection === 'asc' ? 'desc' : 'asc'
            })}
            title={filters.sortDirection === 'asc' ? 'Croissant' : 'Décroissant'}
          >
            <ArrowUpDown className={`w-4 h-4 ${filters.sortDirection === 'desc' ? 'rotate-180' : ''}`} />
          </Button>

          {/* Filtres avancés (mobile) */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="relative">
                <SlidersHorizontal className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Filtres</span>
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-600 rounded-full" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Filtres avancés</SheetTitle>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {/* Filtres de quantité */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                    Quantité en stock
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                        Min
                      </label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={filters.minQuantity}
                        onChange={(e) => onFiltersChange({ ...filters, minQuantity: e.target.value })}
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                        Max
                      </label>
                      <Input
                        type="number"
                        placeholder="∞"
                        value={filters.maxQuantity}
                        onChange={(e) => onFiltersChange({ ...filters, maxQuantity: e.target.value })}
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Filtres de prix */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                    Prix estimé de vente
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                        Min
                      </label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={filters.minPrice}
                        onChange={(e) => onFiltersChange({ ...filters, minPrice: e.target.value })}
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                        Max
                      </label>
                      <Input
                        type="number"
                        placeholder="∞"
                        value={filters.maxPrice}
                        onChange={(e) => onFiltersChange({ ...filters, maxPrice: e.target.value })}
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Filtre par devise */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                    Devise d'achat
                  </h3>
                  <Select
                    value={filters.currency}
                    onValueChange={(value) => onFiltersChange({ ...filters, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les devises</SelectItem>
                      {availableCurrencies.map((curr) => (
                        <SelectItem key={curr} value={curr}>
                          {curr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Boutons d'action */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="flex-1"
                    disabled={!hasActiveFilters}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Réinitialiser
                  </Button>
                  <Button
                    onClick={() => setIsOpen(false)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  >
                    Appliquer
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Tags des filtres actifs */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.minQuantity && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Qté min: {filters.minQuantity}
              <button
                onClick={() => onFiltersChange({ ...filters, minQuantity: '' })}
                className="ml-1 hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.maxQuantity && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Qté max: {filters.maxQuantity}
              <button
                onClick={() => onFiltersChange({ ...filters, maxQuantity: '' })}
                className="ml-1 hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.minPrice && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Prix min: {filters.minPrice}
              <button
                onClick={() => onFiltersChange({ ...filters, minPrice: '' })}
                className="ml-1 hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.maxPrice && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Prix max: {filters.maxPrice}
              <button
                onClick={() => onFiltersChange({ ...filters, maxPrice: '' })}
                className="ml-1 hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.currency !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Devise: {filters.currency}
              <button
                onClick={() => onFiltersChange({ ...filters, currency: 'all' })}
                className="ml-1 hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

// Import Badge si manquant
import { Badge } from "@/components/ui/badge";