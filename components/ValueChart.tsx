// components/ValueChart.tsx (MODIFIÉ)
"use client";

import { 
  AreaChart, 
  Area, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  CartesianGrid 
} from "recharts";
import { Currency } from "@/types";

// La nouvelle structure de données attendue
export interface EvolutionData {
  date: string;       // Le mois, ex: "oct. 25"
  stock: number;      // Quantité cumulée en stock
  livraison: number;  // Quantité cumulée en livraison
  vendu: number;      // Quantité cumulée vendue
  profit: number;     // Bénéfice cumulé
}

interface EvolutionChartProps {
  data: EvolutionData[];
  defaultCurrency: Currency;
}

export default function ValueChart({ data, defaultCurrency }: EvolutionChartProps) {

  // Formateur pour l'axe Y des bénéfices (abrège les grands nombres)
  const formatProfitAxis = (value: number) => {
    if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
  };
  
  // Formateur pour l'infobulle (tooltip)
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: defaultCurrency as string,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
  };

  if (!data || data.length < 2) {
    return (
      <div className="flex items-center justify-center h-[350px] bg-gray-50 rounded-lg">
        <p className="text-gray-500 text-center p-4">Pas assez de données pour afficher l'évolution. Ajoutez plus de produits.</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 350 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart 
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          
          {/* Axe X (Date) : Incliné pour la responsivité mobile */}
          <XAxis 
            dataKey="date" 
            angle={-45}
            textAnchor="end"
            tick={{ fontSize: 12 }}
            height={60}
          />
          
          {/* Axe Y gauche pour les Quantités */}
          <YAxis 
            yAxisId="left" 
            tick={{ fontSize: 12 }} 
            allowDecimals={false}
          />

          {/* Axe Y droit pour le Bénéfice */}
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            tick={{ fontSize: 12 }}
            tickFormatter={formatProfitAxis}
          />

          <Tooltip
            formatter={(value, name) => {
              if (name === 'profit') {
                return [formatCurrency(value as number), 'Bénéfice cumulé'];
              }
              // Renommer pour l'affichage dans le tooltip
              const statusMap: { [key: string]: string } = {
                'stock': 'En Stock',
                'livraison': 'En Livraison',
                'vendu': 'Vendu'
              };
              return [value, statusMap[name as string] || name];
            }}
            contentStyle={{ borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend verticalAlign="top" height={36} />

          {/* Aires empilées pour les statuts */}
          <Area yAxisId="left" type="monotone" dataKey="stock" name="En Stock" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
          <Area yAxisId="left" type="monotone" dataKey="livraison" name="En Livraison" stackId="1" stroke="#f97316" fill="#f97316" fillOpacity={0.6} />
          <Area yAxisId="left" type="monotone" dataKey="vendu" name="Vendu" stackId="1" stroke="#16a34a" fill="#16a34a" fillOpacity={0.6} />
          
          {/* Ligne pour le bénéfice, assignée à l'axe droit */}
          <Line yAxisId="right" type="monotone" dataKey="profit" name="Bénéfice cumulé" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
        
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}