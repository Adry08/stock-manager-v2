//components/SummaryTable.tsx
"use client";

interface SummaryTableProps<T> {
  columns: { key: keyof T; label: string }[];
  data: T[];
}

export default function SummaryTable<T>({ columns, data }: SummaryTableProps<T>) {
  return (
    <div className="bg-white shadow rounded-lg overflow-x-auto">
      <table className="w-full table-auto">
        <thead className="bg-gray-100">
          <tr>
            {columns.map((col) => (
              <th key={String(col.key)} className="px-4 py-2 text-left text-sm text-gray-600">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              {columns.map((col) => (
                <td key={String(col.key)} className="px-4 py-2 text-sm text-gray-700">
                  {String(row[col.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
