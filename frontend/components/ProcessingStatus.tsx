"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { CheckCircle, Loader2, Clock, Scan } from "lucide-react";

interface ProcessingStatusProps {
  steps: ProcessingStep[];
  billData?: {
    InvoiceId?: string;
    TotalAmount?: number;
    DueDate?: string;
  };
}

interface ProcessingStep {
  id: string;
  label: string;
  status: "pending" | "loading" | "completed";
}

export default function ProcessingStatus({ steps, billData }: ProcessingStatusProps) {
  const [scanningText, setScanningText] = useState<string>("");
  const [scanIndex, setScanIndex] = useState(0);

  const scanningStep = steps.find((s) => s.id === "scan" && s.status === "loading");
  
  const scanMessages = [
    billData?.InvoiceId ? `Detected: Invoice #${billData.InvoiceId}` : "Detected: Invoice #INV-2024...",
    billData?.TotalAmount ? `Detected: Amount $${billData.TotalAmount.toFixed(2)}` : "Detected: Amount $1,200.00...",
    billData?.DueDate ? `Detected: Due Date ${billData.DueDate}` : "Detected: Due Date Dec 16...",
  ].filter(Boolean);

  useEffect(() => {
    if (scanningStep) {
      const interval = setInterval(() => {
        setScanningText(scanMessages[scanIndex] || "");
        setScanIndex((prev) => (prev + 1) % scanMessages.length);
      }, 500);
      return () => clearInterval(interval);
    } else {
      setScanningText("");
      setScanIndex(0);
    }
  }, [scanningStep, scanIndex, scanMessages]);
  const getIcon = (status: ProcessingStep["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "loading":
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getTextColor = (status: ProcessingStep["status"]) => {
    switch (status) {
      case "completed":
        return "text-green-700";
      case "loading":
        return "text-blue-700 font-semibold";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Processing Your Request
      </h2>
      <div className="space-y-3">
        <AnimatePresence>
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col gap-2 p-3 rounded-lg bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {step.id === "scan" && step.status === "loading" ? (
                    <Scan className="w-5 h-5 text-blue-600 animate-pulse" />
                  ) : (
                    getIcon(step.status)
                  )}
                </div>
                <span className={`${getTextColor(step.status)} flex-1`}>
                  {step.label}
                </span>
              </div>
              {step.id === "scan" && step.status === "loading" && scanningText && (
                <motion.div
                  key={scanningText}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="ml-8 text-sm text-blue-600 font-mono bg-blue-50 px-3 py-1 rounded border border-blue-200"
                >
                  {scanningText}
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

