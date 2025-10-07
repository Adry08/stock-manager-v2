// components/MovementCard.tsx
"use client";

import { Movement, Product } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Calendar,
  User,
  Package,
  Edit,
  Trash2,
  Plus,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { formatMovementAction, formatMovementChange } from "@/services/movements";

interface MovementCardProps {
  movement: Movement;
  product?: Product;
  showProductName?: boolean;
}

export function MovementCard({
  movement,
  product,
  showProductName = true,
}: MovementCardProps) {
  const actionLabel = formatMovementAction(movement);
  const changeLabel = formatMovementChange(movement);

  // 🔥 CORRECTION: Gérer les produits supprimés
  const getProductName = (): string => {
    if (product) {
      return product.name;
    }
    
    // Si le produit est supprimé, essayer de récupérer le nom depuis old_value
    if (movement.field_changed === 'delete' && movement.old_value) {
      const oldValue = movement.old_value as any;
      if (oldValue && typeof oldValue === 'object' && 'name' in oldValue) {
        return `${oldValue.name} (supprimé)`;
      }
    }
    
    return "Produit supprimé";
  };

  const getActionIcon = () => {
    switch (movement.field_changed) {
      case "insert":
        return <Plus className="w-5 h-5 text-green-600" />;
      case "delete":
        return <Trash2 className="w-5 h-5 text-red-600" />;
      case "status":
        return <ArrowRight className="w-5 h-5 text-blue-600" />;
      default:
        return <Edit className="w-5 h-5 text-indigo-600" />;
    }
  };

  const getActionColor = () => {
    switch (movement.field_changed) {
      case "insert":
        return "bg-green-100";
      case "delete":
        return "bg-red-100";
      case "status":
        return "bg-blue-100";
      default:
        return "bg-indigo-100";
    }
  };

  // Vérifier si le produit est supprimé (product_id existe mais product est undefined)
  const isProductDeleted = movement.product_id && !product;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icône de l'action */}
          <div className={`p-2 ${getActionColor()} rounded-lg shrink-0`}>
            {getActionIcon()}
          </div>

          {/* Contenu */}
          <div className="flex-1 min-w-0">
            {/* En-tête */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                {showProductName && (
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className={`font-semibold truncate ${isProductDeleted ? 'text-gray-500 italic' : ''}`}>
                      {getProductName()}
                    </span>
                    {isProductDeleted && (
                      <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
                    )}
                  </div>
                )}
                <p className="text-sm text-gray-600">{actionLabel}</p>
              </div>

              <Badge variant="outline" className="shrink-0">
                Qté: {movement.quantity}
              </Badge>
            </div>

            {/* Détails du changement */}
            {movement.field_changed !== "insert" &&
              movement.field_changed !== "delete" && (
                <div className="bg-gray-50 rounded p-2 mb-2">
                  <p className="text-sm font-mono text-gray-700">
                    {changeLabel}
                  </p>
                </div>
              )}

            {/* Métadonnées */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>
                  {new Date(movement.created_at).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {movement.user_id && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span className="truncate">
                    {movement.user_id.substring(0, 8)}...
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}