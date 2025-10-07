// components/ValueChart.tsx
"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"; 
import { Currency } from "@/types";

interface ChartData {
  date: string; // Nom du produit
  purchaseValue: number;
  estimatedSaleValue: number;
}

interface ValueChartProps {
  data: ChartData[];
  defaultCurrency: Currency;
}

export default function ValueChart({ data, defaultCurrency }: ValueChartProps) {
  
  const formatTooltipValue = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { 
        style: 'currency', 
        currency: defaultCurrency as string,
        minimumFractionDigits: 0,
        maximumFractionDigits: defaultCurrency === "MGA" ? 0 : 2, 
    }).format(value);
  };

  return (
    <div className="bg-white shadow-lg rounded-xl p-4">
      <ResponsiveContainer width="100%" height={300}> 
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 50, left: 0 }}>
          
          {/* Axe X pour les Noms de Produits (Étiquettes inclinées pour la lisibilité) */}
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 10 }}
            angle={-45} // Incliner les étiquettes pour les noms longs
            textAnchor="end" 
            interval={0} 
            height={50} 
          />
          <YAxis tick={{ fontSize: 12 }} />
          
          <Tooltip 
            formatter={formatTooltipValue}
          />
          
          <Legend verticalAlign="top" height={36}/>
          
          {/* Ligne Achat Unitaire */}
          <Line
            type="monotone"
            dataKey="purchaseValue"
            name={`Prix Achat Unitaire (${defaultCurrency})`}
            stroke="#3b82f6" // Bleu
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            animationDuration={500}
          />
          
          {/* Ligne Vente Estimée Unitaire */}
          <Line
            type="monotone"
            dataKey="estimatedSaleValue"
            name={`Prix Vente Est. Unitaire (${defaultCurrency})`}
            stroke="#16a34a" // Vert
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            animationDuration={500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}