// components/DeliveryCalendar.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { Product } from "@/types";
import { Client } from "@/types/client";
import { Calendar, ChevronLeft, ChevronRight, Filter, X, Clock, MapPin, User, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DeliveryCalendarProps {
  clients: Client[];
  products: Product[];
  onDateSelect: (date: string | null) => void;
  selectedDate: string | null;
}

export default function DeliveryCalendar({
  clients,
  products,
  onDateSelect,
  selectedDate,
}: DeliveryCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isExpanded, setIsExpanded] = useState(false);

  // Grouper les livraisons par date
  const deliveriesByDate = useMemo(() => {
    const grouped: Record<string, { clients: Client[]; products: Product[] }> = {};
    
    clients.forEach(client => {
      const product = products.find(p => p.id === client.product_id);
      if (product) {
        if (!grouped[client.delivery_date]) {
          grouped[client.delivery_date] = { clients: [], products: [] };
        }
        grouped[client.delivery_date].clients.push(client);
        grouped[client.delivery_date].products.push(product);
      }
    });

    return grouped;
  }, [clients, products]);

  // Obtenir tous les jours du mois
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    
    // Ajouter les jours vides au début
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Ajouter tous les jours du mois
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const formatMonthYear = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(date);
  };

  const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // mois de 01 à 12
  const day = date.getDate().toString().padStart(2, '0'); // jour de 01 à 31
  return `${year}-${month}-${day}`;
};


  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateClick = (date: Date | null) => {
    if (!date) return;
    const dateKey = formatDateKey(date);
    if (selectedDate === dateKey) {
      onDateSelect(null); // Désélectionner
    } else {
      onDateSelect(dateKey);
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const hasDelivery = (date: Date) => {
    const dateKey = formatDateKey(date);
    return !!deliveriesByDate[dateKey];
  };

  const isSelected = (date: Date) => {
    return selectedDate === formatDateKey(date);
  };

  const getDeliveryCount = (date: Date) => {
    const dateKey = formatDateKey(date);
    return deliveriesByDate[dateKey]?.clients.length || 0;
  };

  // Liste des livraisons pour la date sélectionnée
  const selectedDateDeliveries = selectedDate ? deliveriesByDate[selectedDate] : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-white" />
            <h2 className="text-lg font-bold text-white">Calendrier Livraisons</h2>
          </div>
          
          {selectedDate && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDateSelect(null)}
              className="text-white hover:bg-white/20 rounded-full"
            >
              <X className="w-4 h-4 mr-1" />
              Réinitialiser
            </Button>
          )}
        </div>

        {/* Navigation mois */}
        <div className="flex items-center justify-between">
          <Button
            size="icon"
            variant="ghost"
            onClick={goToPreviousMonth}
            className="text-white hover:bg-white/20 rounded-full h-8 w-8"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <h3 className="text-white font-semibold capitalize">
            {formatMonthYear(currentMonth)}
          </h3>
          
          <Button
            size="icon"
            variant="ghost"
            onClick={goToNextMonth}
            className="text-white hover:bg-white/20 rounded-full h-8 w-8"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Calendrier */}
      <div className="p-4">
        {/* Jours de la semaine */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grille des jours */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dayHasDelivery = hasDelivery(date);
            const dayIsToday = isToday(date);
            const dayIsSelected = isSelected(date);
            const deliveryCount = getDeliveryCount(date);

            return (
              <button
                key={index}
                onClick={() => handleDateClick(date)}
                className={`
                  aspect-square rounded-lg relative flex flex-col items-center justify-center
                  transition-all duration-200 hover:scale-105
                  ${dayIsSelected 
                    ? 'bg-indigo-600 text-white shadow-lg scale-105' 
                    : dayHasDelivery
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                  ${dayIsToday && !dayIsSelected ? 'ring-2 ring-indigo-400 dark:ring-indigo-500' : ''}
                `}
              >
                <span className={`text-sm font-semibold ${dayIsSelected ? 'text-white' : ''}`}>
                  {date.getDate()}
                </span>
                
                {dayHasDelivery && (
                  <div className={`
                    absolute bottom-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
                    ${dayIsSelected 
                      ? 'bg-white text-indigo-600' 
                      : 'bg-indigo-600 text-white'
                    }
                  `}>
                    {deliveryCount}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Détails des livraisons pour la date sélectionnée */}
      {selectedDate && selectedDateDeliveries && (
        <div className="border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="font-semibold text-gray-900 dark:text-white">
                {selectedDateDeliveries.clients.length} livraison(s) ce jour
              </span>
            </div>
            <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </button>

          {isExpanded && (
            <div className="px-4 pb-4 space-y-3 max-h-96 overflow-y-auto">
              {selectedDateDeliveries.clients.map((client, idx) => {
                const product = selectedDateDeliveries.products[idx];
                return (
                  <div
                    key={client.id}
                    className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Produit */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                          {product?.name}
                        </h4>
                        <Badge variant="secondary" className="text-xs">
                          × {product?.quantity || 1}
                        </Badge>
                      </div>
                      <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                        <Clock className="w-3 h-3 mr-1" />
                        {client.delivery_time}
                      </Badge>
                    </div>

                    {/* Client */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{client.client_name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-xs truncate">{client.delivery_address}</span>
                      </div>

                      {client.notes && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 italic mt-2 pl-6">
                          Note: {client.notes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Légende */}
      <div className="border-t dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-indigo-100 dark:bg-indigo-900/30 border-2 border-indigo-400"></div>
            <span className="text-gray-600 dark:text-gray-400">Livraison(s) prévue(s)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-indigo-600 border-2 border-indigo-600"></div>
            <span className="text-gray-600 dark:text-gray-400">Date sélectionnée</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-indigo-400"></div>
            <span className="text-gray-600 dark:text-gray-400">Aujourd'hui</span>
          </div>
        </div>
      </div>
    </div>
  );
}