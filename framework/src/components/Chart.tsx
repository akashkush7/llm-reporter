import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

export interface ChartProps {
  type: "line" | "bar" | "area" | "pie";
  data: any[];
  dataKey?: string;
  xAxisKey?: string;
  title?: string;
  height?: number;
  colors?: string[];
  showLegend?: boolean;
}

const DEFAULT_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b"];

// Original Recharts version (for client-side React apps)
const Chart: React.FC<ChartProps> = ({
  type,
  data,
  dataKey = "value",
  xAxisKey = "name",
  title,
  height = 300,
  colors = DEFAULT_COLORS,
  showLegend = true,
}) => {
  const renderChart = () => {
    switch (type) {
      case "line":
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey={xAxisKey} stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              }}
            />
            {showLegend && <Legend />}
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={colors[0]}
              strokeWidth={3}
              dot={{ fill: colors[0], r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );

      case "bar":
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey={xAxisKey} stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            {showLegend && <Legend />}
            <Bar dataKey={dataKey} fill={colors[0]} radius={[8, 8, 0, 0]}>
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Bar>
          </BarChart>
        );

      case "area":
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey={xAxisKey} stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            {showLegend && <Legend />}
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={colors[0]}
              fill={colors[0]}
              fillOpacity={0.3}
            />
          </AreaChart>
        );

      case "pie":
        return (
          <PieChart>
            <Pie
              data={data}
              dataKey={dataKey}
              nameKey={xAxisKey}
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            {showLegend && <Legend />}
          </PieChart>
        );

      default:
        return <></>;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 my-6">
      {title && (
        <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};

// SSR-Safe version (for server-side rendering)
export const StaticChart: React.FC<ChartProps> = ({
  type,
  data,
  dataKey = "value",
  xAxisKey = "name",
  title,
  height = 300,
  colors = DEFAULT_COLORS,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 my-6">
        <p className="text-gray-500 text-center">No data available</p>
      </div>
    );
  }

  if (type === "bar") {
    const maxValue = Math.max(...data.map((d) => d[dataKey] || 0));

    return (
      <div className="bg-white rounded-xl shadow-md p-6 my-6">
        {title && (
          <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
        )}
        <div className="space-y-3">
          {data.map((item, idx) => {
            const value = item[dataKey] || 0;
            const percentage = (value / maxValue) * 100;

            return (
              <div key={idx} className="flex items-center gap-4">
                <div
                  className="w-32 text-sm font-medium text-gray-700 truncate"
                  title={item[xAxisKey]}
                >
                  {item[xAxisKey]}
                </div>
                <div className="flex-1 relative">
                  <div className="w-full bg-gray-100 rounded-full h-8">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-8 rounded-full flex items-center justify-end px-3"
                      style={{ width: `${Math.max(percentage, 3)}%` }}
                    >
                      <span className="text-white text-xs font-bold">
                        {value}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (type === "line") {
    const maxValue = Math.max(...data.map((d) => d[dataKey] || 0));
    const minValue = Math.min(...data.map((d) => d[dataKey] || 0));
    const range = maxValue - minValue || 1;
    const chartHeight = height - 60;
    const chartWidth = 800;
    const padding = { top: 20, right: 40, bottom: 40, left: 60 };
    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;

    const points = data.map((item, idx) => {
      const value = item[dataKey] || 0;
      const x =
        padding.left + (idx / Math.max(data.length - 1, 1)) * innerWidth;
      const y =
        padding.top + innerHeight - ((value - minValue) / range) * innerHeight;
      return { x, y, value, label: item[xAxisKey] };
    });

    const pathData = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ");

    return (
      <div className="bg-white rounded-xl shadow-md p-6 my-6">
        {title && (
          <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
        )}
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + innerHeight * (1 - ratio);
            const value = minValue + range * ratio;
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  strokeDasharray="4"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="12"
                  fill="#6b7280"
                >
                  {Math.round(value)}
                </text>
              </g>
            );
          })}
          {/* X-axis labels */}
          {points.map((point, idx) => (
            <text
              key={idx}
              x={point.x}
              y={chartHeight - padding.bottom + 20}
              textAnchor="middle"
              fontSize="12"
              fill="#6b7280"
            >
              {point.label}
            </text>
          ))}
          {/* Line */}
          <path
            d={pathData}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Points */}
          {points.map((point, idx) => (
            <g key={idx}>
              <circle
                cx={point.x}
                cy={point.y}
                r="5"
                fill="#3b82f6"
                stroke="white"
                strokeWidth="2"
              />
              <text
                x={point.x}
                y={point.y - 12}
                textAnchor="middle"
                fontSize="11"
                fontWeight="bold"
                fill="#1f2937"
              >
                {point.value}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  }

  if (type === "pie") {
    const total = data.reduce((sum, item) => sum + (item[dataKey] || 0), 0);

    return (
      <div className="bg-white rounded-xl shadow-md p-6 my-6">
        {title && (
          <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
        )}
        <div className="space-y-2">
          {data.map((item, idx) => {
            const value = item[dataKey] || 0;
            const percentage = ((value / total) * 100).toFixed(1);

            return (
              <div key={idx} className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: colors[idx % colors.length] }}
                />
                <span className="text-sm font-medium text-gray-700 flex-1">
                  {item[xAxisKey]}
                </span>
                <span className="text-sm text-gray-500">
                  {value} ({percentage}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Fallback for unsupported types
  return (
    <div className="bg-white rounded-xl shadow-md p-6 my-6">
      {title && (
        <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
      )}
      <div className="text-gray-600">
        Chart type "{type}" not yet supported for static rendering
      </div>
    </div>
  );
};

export default Chart;
