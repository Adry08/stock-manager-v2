// components/modals/ClientModal.tsx
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Phone, MapPin, Calendar, Clock, Save, Trash2, Loader2 } from "lucide-react";
import { Client, ClientFormData } from "@/types/client";
import { toast } from "sonner";

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ClientFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
  client?: Client | null;
  productName: string;
}

export default function ClientModal({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  client,
  productName,
}: ClientModalProps) {
  const [formData, setFormData] = useState<ClientFormData>({
    client_name: "",
    contact_number: "",
    delivery_address: "",
    delivery_date: "",
    delivery_time: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData({
        client_name: client.client_name,
        contact_number: client.contact_number,
        delivery_address: client.delivery_address,
        delivery_date: client.delivery_date,
        delivery_time: client.delivery_time,
        notes: client.notes || "",
      });
    } else {
      setFormData({
        client_name: "",
        contact_number: "",
        delivery_address: "",
        delivery_date: "",
        delivery_time: "",
        notes: "",
      });
    }
  }, [client, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_name.trim()) {
      toast.error("Le nom du client est requis");
      return;
    }
    
    if (!formData.contact_number.trim()) {
      toast.error("Le numéro de contact est requis");
      return;
    }
    
    if (!formData.delivery_address.trim()) {
      toast.error("L'adresse de livraison est requise");
      return;
    }
    
    if (!formData.delivery_date) {
      toast.error("La date de livraison est requise");
      return;
    }
    
    if (!formData.delivery_time) {
      toast.error("L'heure de livraison est requise");
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !client) return;
    
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
      return;
    }

    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <User className="w-6 h-6 text-indigo-600" />
            {client ? "Modifier le client" : "Ajouter un client"}
          </DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Pour le produit: <span className="font-semibold">{productName}</span>
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Nom du client */}
          <div className="space-y-2">
            <Label htmlFor="client_name" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Nom du client *
            </Label>
            <Input
              id="client_name"
              value={formData.client_name}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              placeholder="Jean Dupont"
              required
              className="text-base"
            />
          </div>

          {/* Numéro de contact */}
          <div className="space-y-2">
            <Label htmlFor="contact_number" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Numéro de contact *
            </Label>
            <Input
              id="contact_number"
              type="tel"
              value={formData.contact_number}
              onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
              placeholder="+261 34 00 000 00"
              required
              className="text-base"
            />
          </div>

          {/* Adresse de livraison */}
          <div className="space-y-2">
            <Label htmlFor="delivery_address" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Adresse de livraison *
            </Label>
            <Textarea
              id="delivery_address"
              value={formData.delivery_address}
              onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
              placeholder="Rue, quartier, ville..."
              required
              rows={3}
              className="text-base resize-none"
            />
          </div>

          {/* Date et heure de livraison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="delivery_date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date de livraison *
              </Label>
              <Input
                id="delivery_date"
                type="date"
                value={formData.delivery_date}
                onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                required
                className="text-base"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_time" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Heure de livraison *
              </Label>
              <Input
                id="delivery_time"
                type="time"
                value={formData.delivery_time}
                onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
                required
                className="text-base"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes supplémentaires</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Informations complémentaires..."
              rows={3}
              className="text-base resize-none"
            />
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            {client && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading || deleting}
                className="w-full sm:w-auto sm:mr-auto"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </>
                )}
              </Button>
            )}
            
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading || deleting}
            >
              Annuler
            </Button>
            
            <Button
              type="submit"
              disabled={loading || deleting}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {client ? "Modifier" : "Ajouter"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}