"use client";

import { useState } from "react";
import { CheckCircle2, ChevronUp } from "lucide-react";

export default function AzureStatus() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className="fixed bottom-4 right-4 z-50"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="bg-white rounded-full shadow-lg border-2 border-green-500 overflow-hidden transition-all duration-300">
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="relative">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
          </div>
          <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">
            System Operational
          </span>
          <ChevronUp
            className={`w-4 h-4 text-gray-600 transition-transform duration-300 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>

        {isExpanded && (
          <div className="px-4 pb-3 space-y-2 border-t border-gray-200 pt-2">
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-gray-700">
                <span className="font-semibold">Azure OpenAI:</span> Connected (gpt-4o)
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-gray-700">
                <span className="font-semibold">Azure Search:</span> Ready (Semantic Ranker)
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-gray-700">
                <span className="font-semibold">Azure Speech:</span> Ready (Neural)
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-gray-700">
                <span className="font-semibold">Document Intelligence:</span> Active
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

