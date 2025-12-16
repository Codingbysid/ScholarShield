"use client";

import { FileText, Mail, DollarSign, BookOpen } from "lucide-react";

interface BillData {
  TotalAmount?: number;
  DueDate?: string;
  VendorName?: string;
  InvoiceId?: string;
}

interface PolicyAdvice {
  advice: string;
  citations: string[];
  confidence: string;
}

interface ActionCardsProps {
  billData: BillData | null;
  onWriteGrant: () => void;
  policyAdvice: PolicyAdvice | null;
}

export default function ActionCards({ billData, onWriteGrant, policyAdvice }: ActionCardsProps) {
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

${policyAdvice.advice.split('\n\n')[0]}

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
          alert(`Policy Advice:\n\n${policyAdvice.advice}`);
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
      </div>

      {!billData && (
        <div className="mt-4 text-center text-gray-500 text-sm">
          Upload a bill to see recommended actions
        </div>
      )}
    </div>
  );
}

