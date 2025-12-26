import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
  color?: "blue" | "green" | "red" | "purple" | "orange";
  subtitle?: string;
}

const colorMap = {
  blue: "from-blue-500 to-blue-600",
  green: "from-green-500 to-green-600",
  red: "from-red-500 to-red-600",
  purple: "from-purple-500 to-purple-600",
  orange: "from-orange-500 to-orange-600",
};

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  changeLabel,
  trend = "neutral",
  icon,
  color = "blue",
  subtitle,
}) => {
  const getTrendIcon = () => {
    if (trend === "up") return <TrendingUp className="w-4 h-4" />;
    if (trend === "down") return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (trend === "up") return "text-green-600 bg-green-50";
    if (trend === "down") return "text-red-600 bg-red-50";
    return "text-gray-600 bg-gray-50";
  };

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
            {title}
          </p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {icon && (
          <div
            className={`p-3 rounded-lg bg-gradient-to-br ${colorMap[color]}`}
          >
            <div className="text-white">{icon}</div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="text-3xl font-bold text-gray-900">{value}</div>

        {change !== undefined && (
          <div
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${getTrendColor()}`}
          >
            {getTrendIcon()}
            <span>{Math.abs(change)}%</span>
            {changeLabel && <span className="text-xs ml-1">{changeLabel}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default KPICard;
