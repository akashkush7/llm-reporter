import React from "react";

export interface Metric {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
}

export interface MetricGridProps {
  metrics: Metric[];
  columns?: 2 | 3 | 4;
}

const MetricGrid: React.FC<MetricGridProps> = ({ metrics, columns = 3 }) => {
  return (
    <div
      className={`grid gap-6 my-6`}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${
          columns === 4 ? "200px" : "250px"
        }, 1fr))`,
      }}
    >
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">
              {metric.label}
            </span>
            {metric.icon && (
              <div className={`${metric.color || "text-blue-500"}`}>
                {metric.icon}
              </div>
            )}
          </div>
          <div className="text-3xl font-bold text-gray-900">{metric.value}</div>
        </div>
      ))}
    </div>
  );
};

export default MetricGrid;
