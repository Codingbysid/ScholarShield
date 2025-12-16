"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Loader2, Clock } from "lucide-react";

interface ProcessingStatusProps {
  steps: ProcessingStep[];
}

interface ProcessingStep {
  id: string;
  label: string;
  status: "pending" | "loading" | "completed";
}

export default function ProcessingStatus({ steps }: ProcessingStatusProps) {
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
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
            >
              <div className="flex-shrink-0">{getIcon(step.status)}</div>
              <span className={`${getTextColor(step.status)} flex-1`}>
                {step.label}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

