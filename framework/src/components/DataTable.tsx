import React from "react";

export interface DataTableProps {
  headers: string[];
  rows: any[][];
  striped?: boolean;
  hoverable?: boolean;
}

const DataTable: React.FC<DataTableProps> = ({
  headers,
  rows,
  striped = true,
  hoverable = true,
}) => {
  return (
    <div className="overflow-x-auto my-6 rounded-xl shadow-md border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gradient-to-r from-blue-500 to-purple-600">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={`
                ${striped && rowIndex % 2 === 1 ? "bg-gray-50" : "bg-white"}
                ${hoverable ? "hover:bg-blue-50 transition-colors" : ""}
              `}
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
