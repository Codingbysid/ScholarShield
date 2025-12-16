"use client";

import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";

interface BillData {
  TotalAmount?: number;
  DueDate?: string;
  VendorName?: string;
  InvoiceId?: string;
}

interface RiskMeterProps {
  riskLevel: "safe" | "warning" | "critical";
  billData: BillData | null;
}

export default function RiskMeter({ riskLevel, billData }: RiskMeterProps) {
  const getRiskConfig = () => {
    switch (riskLevel) {
      case "critical":
        return {
          color: "bg-red-500",
          bgColor: "bg-red-50",
          borderColor: "border-red-300",
          textColor: "text-red-800",
          icon: AlertCircle,
          label: "Critical Risk",
          description: "Immediate action required",
          percentage: 100,
        };
      case "warning":
        return {
          color: "bg-yellow-500",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-300",
          textColor: "text-yellow-800",
          icon: AlertTriangle,
          label: "Warning",
          description: "Action recommended soon",
          percentage: 60,
        };
      default:
        return {
          color: "bg-green-500",
          bgColor: "bg-green-50",
          borderColor: "border-green-300",
          textColor: "text-green-800",
          icon: CheckCircle,
          label: "Safe",
          description: "No immediate concerns",
          percentage: 20,
        };
    }
  };

  const config = getRiskConfig();
  const Icon = config.icon;

  if (!billData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Financial Risk Level
        </h2>
        <div className="text-center text-gray-500 py-8">
          <p>Upload a bill to assess risk</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${config.bgColor} ${config.borderColor} border-2 rounded-lg shadow-md p-6`}>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Financial Risk Level
      </h2>
      
      <div className="flex items-center justify-center mb-6">
        <Icon className={`w-16 h-16 ${config.textColor}`} />
      </div>

      <div className="text-center mb-4">
        <h3 className={`text-3xl font-bold ${config.textColor} mb-2`}>
          {config.label}
        </h3>
        <p className="text-gray-600">{config.description}</p>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
        <div
          className={`${config.color} h-4 rounded-full transition-all duration-500`}
          style={{ width: `${config.percentage}%` }}
        ></div>
      </div>

      {billData && (
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Amount:</span>
            <span className="font-semibold">${billData.TotalAmount?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Days Until Due:</span>
            <span className="font-semibold">
              {billData.DueDate
                ? Math.ceil(
                    (new Date(billData.DueDate).getTime() - new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                : "N/A"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

