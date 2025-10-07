// components/MovementList.tsx
"use client";

import { useState, useEffect } from "react";
import { Movement, Product } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MovementCard } from "./MovementCard";
import { getMovements, getMovementsByProduct } from "@/services/movements";
import { getProducts } from "@/services/products";
import {
  Activity,
  Search,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface MovementListProps {
  productId?: string;
  pageSize?: number;
}

export default function MovementList({
  productId,
  pageSize = 20,
}: MovementListProps) {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Charger les mouvements
        const movementsData = productId
          ? await getMovementsByProduct(productId)
          : await getMovements();

        setMovements(movementsData);

        // Charger les produits pour l'affichage
        if (!productId) {
          const productsData = await getProducts();
          setProducts(productsData);
        }
      } catch (err) {
        console.error("Erreur chargement mouvements:", err);
        setError("Impossible de charger les mouvements");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId]);

  // 🔥 CORRECTION: Filtrer avec gestion des product_id null
  const filteredMovements = movements.filter((movement) => {
    // Trouver le produit (peut être undefined si product_id est null)
    const product = movement.product_id 
      ? products.find((p) => p.id === movement.product_id)
      : undefined;

    // Recherche
    const matchesSearch =
      !searchTerm ||
      (product?.name && product.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (movement.field_changed && movement.field_changed.toLowerCase().includes(searchTerm.toLowerCase())) ||
      // Recherche dans old_value pour les produits supprimés
      (movement.field_changed === 'delete' && 
       movement.old_value && 
       typeof movement.old_value === 'object' && 
       'name' in movement.old_value &&
       String(movement.old_value.name).toLowerCase().includes(searchTerm.toLowerCase()));

    // Filtre par action
    const matchesAction =
      filterAction === "all" || movement.field_changed === filterAction;

    return matchesSearch && matchesAction;
  });

  // Pagination
  const totalPages = Math.ceil(filteredMovements.length / pageSize);
  const paginatedMovements = filteredMovements.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header avec filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Historique des mouvements
            {filteredMovements.length > 0 && (
              <span className="text-sm font-normal text-gray-500">
                ({filteredMovements.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3">
            {/* Recherche */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtre par action */}
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Type d'action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les actions</SelectItem>
                <SelectItem value="insert">Création</SelectItem>
                <SelectItem value="update">Modification</SelectItem>
                <SelectItem value="status">Changement statut</SelectItem>
                <SelectItem value="quantity">Modification quantité</SelectItem>
                <SelectItem value="delete">Suppression</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des mouvements */}
      {paginatedMovements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-500">Aucun mouvement trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {paginatedMovements.map((movement) => (
            <MovementCard
              key={movement.id}
              movement={movement}
              product={movement.product_id ? products.find((p) => p.id === movement.product_id) : undefined}
              showProductName={!productId}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Précédent
          </Button>

          <span className="text-sm text-gray-600">
            Page {currentPage + 1} sur {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))
            }
            disabled={currentPage >= totalPages - 1}
          >
            Suivant
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}