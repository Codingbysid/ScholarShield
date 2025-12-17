"use client";

import { useState } from "react";
import { FileText, Mail, DollarSign, BookOpen, Users, Volume2 } from "lucide-react";
import { apiClient } from "@/lib/api";

interface BillData {
  TotalAmount?: number;
  DueDate?: string;
  VendorName?: string;
  InvoiceId?: string;
}

interface PolicyAdvice {
  summary: string;
  citations: string[];
  actionable_step: string;
  confidence: string;
}

interface RecommendedAction {
  action: string;
  description: string;
  priority: string;
}

interface ActionCardsProps {
  billData: BillData | null;
  onWriteGrant: () => void;
  policyAdvice: PolicyAdvice | null;
  recommendedActions?: RecommendedAction[];
  riskLevel?: "SAFE" | "WARNING" | "CRITICAL" | string;
}

export default function ActionCards({ billData, onWriteGrant, policyAdvice, recommendedActions = [], riskLevel }: ActionCardsProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>("es");
  const [familyExplanation, setFamilyExplanation] = useState<{ text: string; audioBase64: string } | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  const languages = [
    { code: "es", name: "Spanish" },
    { code: "hi", name: "Hindi" },
    { code: "zh-Hans", name: "Mandarin" },
    { code: "ar", name: "Arabic" },
  ];

  const handleExplainToFamily = async () => {
    if (!billData || !riskLevel) {
      alert("Please upload a bill first");
      return;
    }

    setIsExplaining(true);
    try {
      // Build risk summary from bill data and risk level
      const amount = billData.TotalAmount || 0;
      const dueDate = billData.DueDate || "";
      const riskSummary = `Risk ${riskLevel}. $${amount} due on ${dueDate}.`;

      const response = await apiClient.explainToParent({
        risk_summary: riskSummary,
        language: selectedLanguage,
      });

      if (response.success) {
        setFamilyExplanation({
          text: response.translated_text,
          audioBase64: response.audio_base64,
        });
      }
    } catch (error) {
      console.error("Error explaining to family:", error);
      alert("Failed to generate explanation. Please try again.");
    } finally {
      setIsExplaining(false);
    }
  };
  const actions = [
    {
      id: "grant",
      title: "Apply for Emergency Grant",
      description: "Generate a grant application essay automatically",
      icon: DollarSign,
      color: "bg-blue-600 hover:bg-blue-700",
      onClick: onWriteGrant,
      enabled: !!billData,
    },
    {
      id: "extension",
      title: "Request Extension",
      description: "Draft an extension request email to the Bursar",
      icon: Mail,
      color: "bg-green-600 hover:bg-green-700",
      onClick: () => {
        if (policyAdvice) {
          const emailBody = `Subject: Request for Tuition Payment Extension

Dear Bursar's Office,

${policyAdvice.summary}

${policyAdvice.citations.length > 0 ? `Based on: ${policyAdvice.citations[0]}` : ''}

Thank you for your consideration.

Best regards,
[Your Name]`;
          
          window.location.href = `mailto:bursar@university.edu?subject=Request%20for%20Tuition%20Payment%20Extension&body=${encodeURIComponent(emailBody)}`;
        } else {
          alert("Please upload a bill first to generate an extension request");
        }
      },
      enabled: !!policyAdvice,
    },
    {
      id: "policy",
      title: "View Policy Options",
      description: "Check available university policies and bylaws",
      icon: BookOpen,
      color: "bg-purple-600 hover:bg-purple-700",
      onClick: () => {
        // This could open a modal or navigate to a policy page
        if (policyAdvice) {
          alert(`Policy Advice:\n\n${policyAdvice.summary}\n\nAction: ${policyAdvice.actionable_step}`);
        }
      },
      enabled: !!policyAdvice,
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Recommended Actions
      </h2>
      
      <div className="space-y-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={action.onClick}
              disabled={!action.enabled}
              className={`w-full ${action.color} text-white p-4 rounded-lg transition-all duration-200 flex items-start gap-4 ${
                !action.enabled
                  ? "opacity-50 cursor-not-allowed bg-gray-400"
                  : "shadow-md hover:shadow-lg transform hover:-translate-y-1"
              }`}
            >
              <Icon className="w-6 h-6 mt-1 flex-shrink-0" />
              <div className="text-left flex-1">
                <h3 className="font-semibold text-lg mb-1">{action.title}</h3>
                <p className="text-sm opacity-90">{action.description}</p>
              </div>
            </button>
          );
        })}

        {/* Family Communication Card */}
        <div className="border-2 border-orange-300 rounded-lg p-4 bg-orange-50">
          <div className="flex items-start gap-3 mb-3">
            <Users className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-orange-900 mb-1">
                Family Communication
              </h3>
              <p className="text-sm text-orange-700 mb-3">
                Explain the situation to your family in their language
              </p>
              
              <div className="flex gap-2 mb-3">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="flex-1 px-3 py-2 border border-orange-300 rounded-md text-sm bg-white"
                  disabled={!billData || isExplaining}
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleExplainToFamily}
                  disabled={!billData || isExplaining}
                  className={`px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-sm font-semibold flex items-center gap-2 ${
                    !billData || isExplaining
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {isExplaining ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4" />
                      Explain
                    </>
                  )}
                </button>
              </div>

              {familyExplanation && (
                <div className="mt-3 space-y-2">
                  <blockquote className="p-3 bg-white border-l-4 border-orange-500 italic text-sm text-gray-700">
                    {familyExplanation.text}
                  </blockquote>
                  <audio
                    controls
                    autoPlay
                    className="w-full"
                    src={`data:audio/wav;base64,${familyExplanation.audioBase64}`}
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {!billData && (
        <div className="mt-4 text-center text-gray-500 text-sm">
          Upload a bill to see recommended actions
        </div>
      )}
    </div>
  );
}

