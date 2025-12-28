import React from "react";
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";

export interface CalloutProps {
  type: "info" | "success" | "warning" | "error";
  title?: string;
  children: React.ReactNode;
}

const Callout: React.FC<CalloutProps> = ({ type, title, children }) => {
  const config = {
    info: {
      icon: Info,
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-900",
      iconColor: "text-blue-500",
    },
    success: {
      icon: CheckCircle,
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-900",
      iconColor: "text-green-500",
    },
    warning: {
      icon: AlertTriangle,
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-900",
      iconColor: "text-yellow-500",
    },
    error: {
      icon: AlertCircle,
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-900",
      iconColor: "text-red-500",
    },
  }[type];

  const Icon = config.icon;

  return (
    <div
      className={`${config.bg} ${config.border} border-l-4 rounded-r-lg p-4 my-4`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`${config.iconColor} w-5 h-5 flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          {title && (
            <div className={`font-semibold ${config.text} mb-1`}>{title}</div>
          )}
          <div className={config.text}>{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Callout;
