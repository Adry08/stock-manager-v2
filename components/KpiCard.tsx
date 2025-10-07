// src/components/KpiCard.tsx
import { ReactNode, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

type KpiCardProps = {
  title: string;
  value: string | number;
  icon?: ReactNode;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray' | 'orange' | 'indigo';
  unit?: string;
  expandable?: boolean;
  fullValue?: string | number;
};

const colorClasses = {
  blue: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400" },
  green: { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-600 dark:text-green-400" },
  red: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-600 dark:text-red-400" },
  yellow: { bg: "bg-yellow-50 dark:bg-yellow-900/20", text: "text-yellow-600 dark:text-yellow-400" },
  purple: { bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-600 dark:text-purple-400" },
  gray: { bg: "bg-gray-50 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400" },
  orange: { bg: "bg-orange-50 dark:bg-orange-900/20", text: "text-orange-600 dark:text-orange-400" },
  indigo: { bg: "bg-indigo-50 dark:bg-indigo-900/20", text: "text-indigo-600 dark:text-indigo-400" },
};

const formatCompactValue = (num: number): string => {
  const negative = num < 0;
  const absNum = Math.abs(num);

  if (absNum >= 1_000_000) return (negative ? '-' : '') + (absNum / 1_000_000).toFixed(1).replace('.', ',') + 'M';
  if (absNum >= 1_000) return (negative ? '-' : '') + (absNum / 1_000).toFixed(1).replace('.', ',') + 'K';
  return (negative ? '-' : '') + absNum.toLocaleString('fr-FR');
};

const parseToNumber = (val: string | number): number | null => {
  if (typeof val === 'number') return val;

  const cleaned = val
    .replace(/−/g, '-')
    .replace(/\s/g, '')
    .replace(/[^0-9.-]/g, '')
    .replace(',', '.');

  const num = Number(cleaned);
  return isNaN(num) ? null : num;
};

export default function KpiCard({ 
  title, 
  value, 
  icon, 
  color = 'blue', 
  unit, 
  expandable = false,
  fullValue 
}: KpiCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const colors = colorClasses[color] || colorClasses.blue;

  const numericValue = parseToNumber(value);
  const numericFullValue = fullValue !== undefined ? parseToNumber(fullValue) : null;

  const shouldUseCompact = !isExpanded || fullValue === undefined;
  
  let displayValue: string;
  
  if (shouldUseCompact && numericValue !== null) {
    displayValue = formatCompactValue(numericValue);
  } else if (isExpanded && fullValue !== undefined) {
    if (numericFullValue !== null) {
      displayValue = numericFullValue.toLocaleString('fr-FR');
    } else {
      displayValue = String(fullValue);
    }
  } else {
    displayValue = String(value);
  }
  
  const finalDisplayValue = unit && !displayValue.includes('%') ? `${displayValue} ${unit}` : displayValue;

  const handleClick = () => {
    if (expandable) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div 
      className={`bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 flex items-center transition-all duration-300 ease-in-out hover:shadow-lg hover:border-gray-200 dark:hover:border-gray-600 w-full ${
        expandable ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''
      } ${isExpanded ? 'ring-2 ring-blue-200 dark:ring-blue-700 shadow-xl' : ''}`}
      onClick={handleClick}
    >
      {icon && (
        <div
          className={`mr-3 sm:mr-4 p-2 sm:p-2.5 rounded-full ${colors.bg} ${colors.text} flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 shrink-0`}
        >
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest truncate">{title}</p>
          {expandable && (
            <div className="ml-2 shrink-0">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              )}
            </div>
          )}
        </div>
        <p className={`text-lg sm:text-2xl font-extrabold text-gray-900 dark:text-gray-100 mt-1 ${
          isExpanded ? 'break-words overflow-wrap-anywhere' : 'truncate'
        }`}>
          {finalDisplayValue}
        </p>
      </div>
    </div>
  );
}