"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import BillUpload from "@/components/BillUpload";
import RiskMeter from "@/components/RiskMeter";
import ActionCards from "@/components/ActionCards";
import ProcessingStatus from "@/components/ProcessingStatus";
import HandbookSelector from "@/components/HandbookSelector";
import ProfileForm from "@/components/ProfileForm";
import { apiClient } from "@/lib/api";
import { downloadAsPDF } from "@/lib/pdfUtils";
import { Download, ArrowRight, CheckCircle2 } from "lucide-react";

interface BillData {
  TotalAmount: number;
  DueDate: string;
  VendorName: string;
  InvoiceId: string;
}

interface PolicyAdvice {
  summary: string;
  citations: string[];
  actionable_step: string;
  confidence: string;
}

interface ProcessingStep {
  id: string;
  label: string;
  status: "pending" | "loading" | "completed";
}

interface FinancialAssessment {
  bill_data: BillData;
  risk_level: "SAFE" | "WARNING" | "CRITICAL";
  policy_findings: {
    search_results: any[];
    advice: PolicyAdvice;
  } | null;
  recommended_actions: Array<{
    action: string;
    description: string;
    priority: string;
  }>;
  negotiation_email: string | null;
  status: string;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const [assessment, setAssessment] = useState<FinancialAssessment | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    { id: "scan", label: "Scanning Tuition Bill...", status: "pending" },
    { id: "risk", label: "Assessing Financial Risk...", status: "pending" },
    { id: "policy", label: "Searching University Bylaws...", status: "pending" },
    { id: "draft", label: "Drafting Advocacy Letters...", status: "pending" },
  ]);
  const [grantEssay, setGrantEssay] = useState<string | null>(null);
  
  // Handbook selection state - always start with handbook selector
  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);
  const [universityIndex, setUniversityIndex] = useState<string | null>(null);
  const [universityName, setUniversityName] = useState<string | null>(null);
  const [showHandbookSelector, setShowHandbookSelector] = useState(true);

  // Ensure handbook selector shows first on initial load
  useEffect(() => {
    // Reset to initial state on mount to ensure proper flow
    // Always show handbook selector first, regardless of URL parameters
    setShowHandbookSelector(true);
    setSelectedUniversity(null);
    setUniversityIndex(null);
    setUniversityName(null);
    setAssessment(null); // Clear any assessment data
    setGrantEssay(null); // Clear grant essay
    setIsProcessing(false); // Reset processing state
    
    // Remove demo parameter from URL if present (clean URL)
    const demoParam = searchParams.get("demo");
    if (demoParam) {
      const url = new URL(window.location.href);
      url.searchParams.delete("demo");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  // Student profile state
  const [studentProfile, setStudentProfile] = useState({
    name: "Student",
    major: "Undecided",
    year: "Freshman",
    gpa: "3.0",
    hardship_reason: "Financial difficulties"
  });

  const updateStepStatus = (stepId: string, status: ProcessingStep["status"]) => {
    setProcessingSteps((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, status } : step))
    );
  };

  const handleHandbookSelect = useCallback((universityId: string, indexName: string, name: string) => {
    setSelectedUniversity(universityId);
    setUniversityIndex(indexName);
    setUniversityName(name);
    setShowHandbookSelector(false);
  }, []);

  const handleBillUpload = useCallback(async (file: File) => {
    if (!selectedUniversity) {
      alert("Please select a university handbook first");
      return;
    }

    setIsProcessing(true);
    
    // Initialize all steps as pending
    setProcessingSteps((prev) =>
      prev.map((step) => ({ ...step, status: "pending" }))
    );
    
    try {
      // Step 1: Scanning bill
      updateStepStatus("scan", "loading");
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate processing time

      // Include university_index in the API call
      const apiUrl = `/api/assess-financial-health${universityIndex ? `?university_index=${encodeURIComponent(universityIndex)}` : ''}`;
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || 'Failed to assess financial health');
      }

      const data = await response.json();

      // Simulate step-by-step progress
      updateStepStatus("scan", "completed");
      await new Promise((resolve) => setTimeout(resolve, 300));

      updateStepStatus("risk", "loading");
      await new Promise((resolve) => setTimeout(resolve, 400));

      if (data.success && data.assessment) {
        const assessmentData = data.assessment;
        updateStepStatus("risk", "completed");

        // If policy search was performed
        if (assessmentData.policy_findings) {
          updateStepStatus("policy", "loading");
          await new Promise((resolve) => setTimeout(resolve, 500));
          updateStepStatus("policy", "completed");
        } else {
          updateStepStatus("policy", "completed"); // Skip if not needed
        }

        // If negotiation email was drafted
        if (assessmentData.negotiation_email) {
          updateStepStatus("draft", "loading");
          await new Promise((resolve) => setTimeout(resolve, 400));
          updateStepStatus("draft", "completed");
        } else {
          updateStepStatus("draft", "completed"); // Complete anyway
        }

        setAssessment(assessmentData);
      } else {
        throw new Error("Assessment failed");
      }
    } catch (error) {
      console.error("Error processing bill:", error);
      alert("Failed to process bill. Please try again.");
      // Reset steps on error
      setProcessingSteps((prev) =>
        prev.map((step) => ({ ...step, status: "pending" }))
      );
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleWriteGrant = async () => {
    if (!assessment) return;
    
    try {
      const response = await apiClient.writeGrant({
        student_profile: {
          name: studentProfile.name,
          major: studentProfile.major,
          hardship_reason: studentProfile.hardship_reason,
          gpa: studentProfile.gpa,
          year: studentProfile.year
        },
        grant_requirements: "Emergency grant for students facing immediate financial hardship. Must demonstrate need and maintain good academic standing.",
        policy_context: assessment.policy_findings?.advice?.citations || []
      });

      if (response.success) {
        setGrantEssay(response.essay);
      }
    } catch (error) {
      console.error("Error writing grant essay:", error);
      alert("Failed to generate grant essay. Please try again.");
    }
  };

  const calculateRiskLevel = (): "safe" | "warning" | "critical" => {
    if (!assessment) return "safe";
    const risk = assessment.risk_level;
    return risk.toLowerCase() as "safe" | "warning" | "critical";
  };

  const loadDemoMode = useCallback(async () => {
    // Only load demo if handbook is already selected
    if (!selectedUniversity) {
      alert("Please select a university handbook first before loading demo data");
      return;
    }

    try {
      const response = await fetch("/demo_mode.json");
      const demoData = await response.json();

      // Set assessment data
      setAssessment({
        bill_data: demoData.bill,
        risk_level: "CRITICAL",
        policy_findings: {
          search_results: [],
          advice: {
            summary: demoData.policyAdvice.advice.split("\n\n")[0],
            citations: demoData.policyAdvice.citations,
            actionable_step: "Submit a written request to the Bursar's Office citing Bylaw 4.2",
            confidence: "high"
          }
        },
        recommended_actions: [
          {
            action: "Request Extension",
            description: "Submit a written request to the Bursar's Office",
            priority: "high"
          }
        ],
        negotiation_email: null,
        status: "completed"
      });

      // Mark all steps as completed
      setProcessingSteps((prev) =>
        prev.map((step) => ({ ...step, status: "completed" as const }))
      );
    } catch (error) {
      console.error("Error loading demo data:", error);
      // Fallback to hardcoded demo data
      setAssessment({
        bill_data: {
          TotalAmount: 1200.00,
          DueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          VendorName: "State University",
          InvoiceId: "INV-2024-001234",
        },
        risk_level: "CRITICAL",
        policy_findings: {
          search_results: [],
          advice: {
            summary:
              "Students facing financial hardship may request an extension of up to 30 days for tuition payment deadlines.",
            citations: ["University Handbook 2024, Section 4.2"],
            actionable_step:
              "Submit a written request to the Bursar's Office citing Bylaw 4.2",
            confidence: "high",
          },
        },
        recommended_actions: [
          {
            action: "Request Extension",
            description: "Submit a written request to the Bursar's Office",
            priority: "high",
          },
        ],
        negotiation_email: null,
        status: "completed",
      });
      setProcessingSteps((prev) =>
        prev.map((step) => ({ ...step, status: "completed" as const }))
      );
    }
  }, []);

  useEffect(() => {
    // Only support keyboard shortcut for demo mode
    // Do NOT auto-load demo data - wait for user to upload a bill
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        loadDemoMode();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [loadDemoMode, selectedUniversity]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              ScholarShield Dashboard
            </h1>
            <p className="text-lg text-gray-600">
              Your financial lifeline for navigating student expenses
            </p>
          </div>
          <button
            onClick={loadDemoMode}
            className="text-xs text-gray-400 hover:text-gray-600 opacity-30 hover:opacity-100 transition-opacity px-3 py-1 border border-gray-300 rounded"
            title="Load demo data (or press Ctrl+Shift+D)"
          >
            Demo
          </button>
        </header>

        {/* Step 1: Handbook Selection */}
        {showHandbookSelector && (
          <div className="mb-8">
            <HandbookSelector
              onSelect={handleHandbookSelect}
              selectedUniversity={selectedUniversity}
            />
          </div>
        )}

        {/* Step 2: Profile Form (shown after handbook selection) */}
        {!showHandbookSelector && selectedUniversity && (
          <>
            <div className="mb-6">
              <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                  <div>
                    <p className="font-semibold text-gray-800">Handbook Selected</p>
                    <p className="text-sm text-gray-600">{universityName || "University Handbook"}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowHandbookSelector(true);
                    setSelectedUniversity(null);
                    setUniversityIndex(null);
                    setUniversityName(null);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Change Handbook
                </button>
              </div>
            </div>

            {/* Student Profile Form */}
            <ProfileForm
              initialData={studentProfile}
              onSave={setStudentProfile}
            />
          </>
        )}

        {/* Step 3: Bill Upload and Results (only shown after handbook selection) */}
        {!showHandbookSelector && selectedUniversity && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <BillUpload
                onFileUpload={handleBillUpload}
                isAnalyzing={isProcessing}
              />

              {/* Show processing steps while processing */}
              {isProcessing && (
                <ProcessingStatus 
                  steps={processingSteps} 
                  billData={assessment?.bill_data}
                />
              )}

              {/* Show results only after processing is complete */}
              {assessment && !isProcessing && (
              <>
                <div className="mt-6 bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    Bill Details
                  </h2>
                  <div className="space-y-3 text-lg">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-bold text-gray-800">
                        ${assessment.bill_data.TotalAmount?.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Due Date:</span>
                      <span className="font-bold text-gray-800">
                        {assessment.bill_data.DueDate}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vendor:</span>
                      <span className="font-bold text-gray-800">
                        {assessment.bill_data.VendorName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Invoice ID:</span>
                      <span className="font-bold text-gray-800">
                        {assessment.bill_data.InvoiceId}
                      </span>
                    </div>
                  </div>
                </div>

                {assessment.policy_findings && (
                  <div className="mt-6 bg-green-50 border-2 border-green-200 rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-semibold text-green-800 mb-4">
                      Policy Advice Found
                    </h2>
                    <div className="text-gray-700 mb-4">
                      {assessment.policy_findings.advice.summary}
                    </div>
                    {assessment.policy_findings.advice.actionable_step && (
                      <div className="bg-green-100 p-3 rounded mb-4">
                        <strong className="text-green-800">Action:</strong>{" "}
                        <span className="text-green-700">
                          {assessment.policy_findings.advice.actionable_step}
                        </span>
                      </div>
                    )}
                    {assessment.policy_findings.advice.citations.length > 0 && (
                      <div className="mt-4">
                        <h3 className="font-semibold text-green-800 mb-2">
                          Citations:
                        </h3>
                        <ul className="list-disc list-inside space-y-1">
                          {assessment.policy_findings.advice.citations.map(
                            (citation, idx) => (
                              <li key={idx} className="text-sm text-gray-600">
                                {citation}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {assessment.negotiation_email && (
                  <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-semibold text-blue-800 mb-4">
                      Drafted Negotiation Email
                    </h2>
                    <div className="text-gray-700 whitespace-pre-wrap mb-4 bg-white p-4 rounded border">
                      {assessment.negotiation_email}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(assessment.negotiation_email!)
                        }
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
                      >
                        Copy Email
                      </button>
                      <button
                        onClick={() =>
                          downloadAsPDF(
                            "Negotiation Email",
                            assessment.negotiation_email!,
                            "negotiation-email.pdf"
                          )
                        }
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download PDF
                      </button>
                    </div>
                  </div>
                )}

                {grantEssay && (
                  <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-semibold text-blue-800 mb-4">
                      Grant Essay
                    </h2>
                    <div className="text-gray-700 whitespace-pre-wrap mb-4">
                      {grantEssay}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigator.clipboard.writeText(grantEssay)}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
                      >
                        Copy Essay
                      </button>
                      <button
                        onClick={() =>
                          downloadAsPDF(
                            "Grant Application Essay",
                            grantEssay,
                            "grant-essay.pdf"
                          )
                        }
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download PDF
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="space-y-6">
            {assessment && (
              <>
                <RiskMeter
                  riskLevel={calculateRiskLevel()}
                  billData={assessment.bill_data}
                />
                <ActionCards
                  billData={assessment.bill_data}
                  onWriteGrant={handleWriteGrant}
                  policyAdvice={assessment.policy_findings?.advice || null}
                  recommendedActions={assessment.recommended_actions}
                  riskLevel={assessment.risk_level}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
