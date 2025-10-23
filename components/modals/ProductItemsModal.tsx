// components/modals/ProductItemsModal.tsx - VERSION FINALE (Design Affiné & Bouton Fermer)
"use client";

import { useState, useEffect, useMemo, createElement } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Loader2,
  CheckSquare,
  Square,
  Truck,
  Archive,
  Warehouse,
  Filter,
  X,
  Grid3x3,
  List,
  Tag, // Ajout pour le design
} from "lucide-react";
import { ProductItem, ProductItemsByStatus } from "@/types/productItem";
import { Product } from "@/types";
import { toast } from "sonner";

interface ProductItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  items: ProductItem[];
  onUpdateItems: (itemIds: string[], newStatus: string) => Promise<void>;
  loading?: boolean;
}

const statusOptions = [
  { value: 'stock', label: 'En Stock', icon: Warehouse, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-700' },
  { value: 'livraison', label: 'En Livraison', icon: Truck, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-700' },
  { value: 'vendu', label: 'Vendu', icon: Archive, color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-700' },
];

export default function ProductItemsModal({
  isOpen,
  onClose,
  product,
  items,
  onUpdateItems,
  loading = false,
}: ProductItemsModalProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const getStatusInfo = (status: string) => {
    return statusOptions.find(opt => opt.value === status) || { 
      value: status, 
      label: status, 
      icon: Package, 
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border border-gray-200 dark:border-gray-700' 
    };
  };
  
  const getStatusIcon = (status: string) => getStatusInfo(status).icon;
  const getStatusColor = (status: string) => getStatusInfo(status).color;
  const getStatusLabel = (status: string) => getStatusInfo(status).label;

  const itemsByStatus: ProductItemsByStatus = useMemo(() => ({
    stock: items.filter(item => item.status === 'stock'),
    livraison: items.filter(item => item.status === 'livraison'),
    vendu: items.filter(item => item.status === 'vendu'),
    total: items.length
  }), [items]);

  const filteredItems = useMemo(() => {
    return filterStatus === "all" 
      ? items 
      : items.filter(item => item.status === filterStatus);
  }, [items, filterStatus]);


  useEffect(() => {
    if (isOpen) {
      setSelectedItems(new Set());
      setBulkStatus("");
      setFilterStatus("all");
    }
  }, [isOpen]);

  const handleSelectAll = () => {
    if (filteredItems.length === 0) return;
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    }
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const handleBulkUpdate = async () => {
    if (selectedItems.size === 0) {
      toast.error("Veuillez sélectionner au moins un item");
      return;
    }

    if (!bulkStatus) {
      toast.error("Veuillez choisir un statut");
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdateItems(Array.from(selectedItems), bulkStatus);
      toast.success(`${selectedItems.size} item(s) mis à jour avec succès`);
      setSelectedItems(new Set());
      setBulkStatus("");
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] sm:max-h-[85vh] flex flex-col p-0 sm:p-0 gap-0">
        
        {/* Conteneur pour tous les éléments fixes/sticky */}
        <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 shadow-xl">

            {/* Header fixe */}
            <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 border-b-4 border-indigo-500/10 dark:border-indigo-400/10 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950">
                <DialogTitle className="text-xl sm:text-2xl font-extrabold flex items-start justify-between">
                    <div className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
                        <Tag className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                        <span className="truncate">{product.name}</span>
                    </div>
                    {loading && (
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-500 flex-shrink-0" />
                    )}
                </DialogTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Gérez les items individuels de ce produit. Total: <span className="font-semibold text-gray-800 dark:text-gray-200">{itemsByStatus.total} item{itemsByStatus.total > 1 ? 's' : ''}</span>.
                </p>
            </DialogHeader>

            {/* Statistiques compactes responsive */}
            <div className="px-4 sm:px-6 py-3 border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
                <div className="grid grid-cols-3 gap-3">
                    {Object.entries({
                        stock: { label: 'Stock', count: itemsByStatus.stock.length, icon: Warehouse, bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400' },
                        livraison: { label: 'Transit', count: itemsByStatus.livraison.length, icon: Truck, bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400' },
                        vendu: { label: 'Vendus', count: itemsByStatus.vendu.length, icon: Archive, bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400' },
                    }).map(([key, stat]) => (
                        <div key={key} className={`${stat.bg} rounded-lg p-2 text-center transition-shadow shadow-sm hover:shadow-md`}>
                            {createElement(stat.icon, { className: `w-4 h-4 sm:w-5 sm:h-5 ${stat.text.replace(/700|400/g, '600')} mx-auto mb-1` })}
                            <p className={`text-lg sm:text-xl font-bold ${stat.text}`}>
                                {stat.count}
                            </p>
                            <p className={`text-[10px] sm:text-xs ${stat.text.replace(/700|400/g, '500')} font-medium`}>{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Barre d'actions (Filtres/Vues/Sélection) */}
            <div className="px-4 sm:px-6 py-3 border-b dark:border-gray-800">
                
                <div className="flex flex-wrap items-center gap-2 mb-3">
                    {/* Filtre Statut */}
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-full sm:w-[160px] h-9 text-sm font-medium border-indigo-300 dark:border-indigo-700/50">
                            <Filter className="w-4 h-4 mr-2 text-indigo-500" />
                            <SelectValue placeholder="Filtrer par statut" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous ({itemsByStatus.total})</SelectItem>
                            <SelectItem value="stock">Stock ({itemsByStatus.stock.length})</SelectItem>
                            <SelectItem value="livraison">Transit ({itemsByStatus.livraison.length})</SelectItem>
                            <SelectItem value="vendu">Vendus ({itemsByStatus.vendu.length})</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Mode Vue */}
                    <div className="flex gap-1 border rounded-lg p-1 bg-gray-100 dark:bg-gray-800 ml-auto">
                        {['grid', 'list'].map((mode) => (
                            <Button
                                key={mode}
                                variant="ghost"
                                size="sm"
                                className={`h-7 px-2 transition-colors ${viewMode === mode ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 shadow-sm' : ''}`}
                                onClick={() => setViewMode(mode as "grid" | "list")}
                                aria-label={`Vue ${mode}`}
                            >
                                {mode === 'grid' ? <Grid3x3 className="w-4 h-4" /> : <List className="w-4 h-4" />}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Bouton Tout Sélectionner */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    className="w-full justify-center text-xs h-9 sm:w-auto font-semibold text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                    disabled={filteredItems.length === 0}
                >
                    {selectedItems.size === filteredItems.length && filteredItems.length > 0 ? (
                        <><CheckSquare className="w-4 h-4 mr-1" /> Désélectionner Tout</>
                    ) : (
                        <><Square className="w-4 h-4 mr-1" /> Tout sélectionner ({filteredItems.length})</>
                    )}
                </Button>
            </div>

            {/* Actions en masse - Conditionnel */}
            {selectedItems.size > 0 && (
                <div className="px-4 sm:px-6 py-3 bg-indigo-100 dark:bg-indigo-900/30 border-b border-indigo-300 dark:border-indigo-700 transition-all duration-300 ease-in-out">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <span className="text-sm font-semibold text-indigo-800 dark:text-indigo-300 whitespace-nowrap flex-shrink-0">
                            {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} sélectionné{selectedItems.size > 1 ? 's' : ''}
                        </span>

                        <div className="flex gap-2 flex-1">
                            {/* Sélecteur de statut */}
                            <Select value={bulkStatus} onValueChange={setBulkStatus}>
                                <SelectTrigger className="flex-1 h-9 text-sm bg-white dark:bg-gray-950 border-indigo-400 dark:border-indigo-600">
                                    <SelectValue placeholder="Changer le statut pour..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map(option => (
                                        <SelectItem key={option.value} value={option.value}>
                                            <div className="flex items-center gap-2">
                                                {createElement(option.icon, { className: "w-4 h-4" })}
                                                {option.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Bouton Appliquer */}
                            <Button
                                onClick={handleBulkUpdate}
                                disabled={!bulkStatus || isUpdating}
                                size="sm"
                                className="bg-indigo-600 hover:bg-indigo-700 transition-colors whitespace-nowrap font-bold"
                            >
                                {isUpdating ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    'Appliquer'
                                )}
                            </Button>

                            {/* Bouton Désélectionner */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedItems(new Set())}
                                disabled={isUpdating}
                                className="aspect-square p-0 h-9 w-9 flex-shrink-0 border-indigo-400 dark:border-indigo-600"
                                aria-label="Désélectionner tout"
                            >
                                <X className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>


        {/* Liste des items - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 bg-gray-50 dark:bg-gray-900/50">
          
          {loading && items.length === 0 ? (
             <div className="text-center py-12 flex flex-col items-center">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                    Chargement des items en cours...
                </p>
             </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                Aucun item {filterStatus !== 'all' && `en ${getStatusLabel(filterStatus)}`} trouvé.
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            // Mode Grille
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {filteredItems.map((item, index) => {
                const isSelected = selectedItems.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={`
                      relative p-3 rounded-xl border-2 transition-all duration-150 ease-in-out cursor-pointer h-full flex flex-col justify-between shadow-sm
                      ${isSelected
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-lg ring-4 ring-indigo-500/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md bg-white dark:bg-gray-900'
                      }
                    `}
                    onClick={() => toggleItemSelection(item.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                          ID: <span className="text-indigo-500">#{index + 1}</span>
                        </span>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleItemSelection(item.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4"
                        />
                    </div>
                    <Badge className={`${getStatusColor(item.status)} text-[10px] px-2 py-0.5 w-full justify-center mt-2 font-medium`}>
                      {getStatusLabel(item.status)}
                    </Badge>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-2 text-center">
                      <span className="font-semibold">Créé :</span> {new Date(item.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </div>
                  </div>
              )})}
            </div>
          ) : (
            // Mode Liste
            <div className="space-y-2">
              {filteredItems.map((item, index) => {
                const isSelected = selectedItems.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-150 ease-in-out cursor-pointer shadow-sm
                      ${isSelected
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-900'
                      }
                    `}
                    onClick={() => toggleItemSelection(item.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleItemSelection(item.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300 w-16 flex-shrink-0">
                      Item #{index + 1}
                    </span>
                    <Badge className={`${getStatusColor(item.status)} text-xs font-semibold px-3 py-1 flex items-center justify-center`}>
                      {createElement(getStatusIcon(item.status), { className: "w-4 h-4" })}
                      <span className="ml-2">{getStatusLabel(item.status)}</span>
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto flex-shrink-0 hidden sm:inline">
                      Créé le: {new Date(item.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
              )})}
            </div>
          )}
        </div>

        {/* Footer fixe (Contient le bouton Fermer) */}
        <DialogFooter className="px-4 sm:px-6 py-3 border-t dark:border-gray-800 bg-white dark:bg-gray-900/80 backdrop-blur-sm sticky bottom-0 justify-end">
            <Button 
                variant="outline" 
                onClick={onClose} 
                disabled={isUpdating || loading} 
                className="w-full sm:w-auto font-semibold border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
                Fermer
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}