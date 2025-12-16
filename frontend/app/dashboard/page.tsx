"use client";

import { useState, useCallback, useEffect } from "react";
import BillUpload from "@/components/BillUpload";
import RiskMeter from "@/components/RiskMeter";
import ActionCards from "@/components/ActionCards";
import axios from "axios";

interface BillData {
  TotalAmount: number;
  DueDate: string;
  VendorName: string;
  InvoiceId: string;
}

interface PolicyAdvice {
  advice: string;
  citations: string[];
  confidence: string;
}

export default function Dashboard() {
  const [billData, setBillData] = useState<BillData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [policyAdvice, setPolicyAdvice] = useState<PolicyAdvice | null>(null);
  const [grantEssay, setGrantEssay] = useState<string | null>(null);

  const checkPolicyAdvice = async (query: string) => {
    try {
      const response = await axios.post("http://localhost:8000/api/policy-check", { query });
      if (response.data.success) {
        setPolicyAdvice(response.data.advice);
      }
    } catch (error) {
      console.error("Error checking policy:", error);
    }
  };

  const handleBillUpload = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post("http://localhost:8000/api/analyze-bill", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        setBillData(response.data.data);
        
        // Automatically check for policy advice
        if (response.data.data.TotalAmount && response.data.data.DueDate) {
          const query = `I have a tuition bill for $${response.data.data.TotalAmount} due on ${response.data.data.DueDate}. What options do I have?`;
          await checkPolicyAdvice(query);
        }
      }
    } catch (error) {
      console.error("Error analyzing bill:", error);
      alert("Failed to analyze bill. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleWriteGrant = async () => {
    try {
      const response = await axios.post("http://localhost:8000/api/write-grant", {
        student_profile: {
          major: "Computer Science",
          hardship_reason: "Family financial difficulties and unexpected medical expenses",
          gpa: "3.5",
          year: "Sophomore"
        },
        grant_requirements: "Emergency grant for students facing immediate financial hardship. Must demonstrate need and maintain good academic standing."
      });

      if (response.data.success) {
        setGrantEssay(response.data.essay);
      }
    } catch (error) {
      console.error("Error writing grant essay:", error);
      alert("Failed to generate grant essay. Please try again.");
    }
  };

  const calculateRiskLevel = (): "safe" | "warning" | "critical" => {
    if (!billData) return "safe";
    
    const amount = billData.TotalAmount || 0;
    const dueDate = new Date(billData.DueDate);
    const today = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (amount > 1000 && daysUntilDue <= 3) return "critical";
    if (amount > 500 && daysUntilDue <= 7) return "warning";
    return "safe";
  };

  const loadDemoMode = useCallback(async () => {
    try {
      const response = await fetch('/demo_mode.json');
      const demoData = await response.json();
      
      // Set bill data
      setBillData(demoData.bill);
      
      // Set policy advice
      setPolicyAdvice(demoData.policyAdvice);
      
      // Set grant essay
      setGrantEssay(demoData.grantEssay);
    } catch (error) {
      console.error("Error loading demo data:", error);
      // Fallback to hardcoded demo data
      setBillData({
        TotalAmount: 1200.00,
        DueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        VendorName: "State University",
        InvoiceId: "INV-2024-001234"
      });
      setPolicyAdvice({
        advice: "Based on the university handbook, I found relevant information for your question.\n\nBylaw 4.2: Hardship Extension - Students facing financial hardship may request an extension of up to 30 days for tuition payment deadlines.",
        citations: ["University Handbook 2024, Section 4.2"],
        confidence: "high"
      });
      setGrantEssay("As a Computer Science student with a GPA of 3.5, I am writing to respectfully request consideration for emergency financial assistance...");
    }
  }, []);

  // Hidden demo button handler - trigger with keyboard shortcut or click
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Press 'D' + 'E' + 'M' + 'O' in sequence or Ctrl+Shift+D
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        loadDemoMode();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [loadDemoMode]);

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <BillUpload
              onFileUpload={handleBillUpload}
              isAnalyzing={isAnalyzing}
            />
            
            {billData && (
              <div className="mt-6 bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  Bill Details
                </h2>
                <div className="space-y-3 text-lg">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-bold text-gray-800">
                      ${billData.TotalAmount?.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Due Date:</span>
                    <span className="font-bold text-gray-800">{billData.DueDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vendor:</span>
                    <span className="font-bold text-gray-800">{billData.VendorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Invoice ID:</span>
                    <span className="font-bold text-gray-800">{billData.InvoiceId}</span>
                  </div>
                </div>
              </div>
            )}

            {policyAdvice && (
              <div className="mt-6 bg-green-50 border-2 border-green-200 rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-semibold text-green-800 mb-4">
                  Policy Advice Found
                </h2>
                <div className="text-gray-700 whitespace-pre-wrap mb-4">
                  {policyAdvice.advice}
                </div>
                {policyAdvice.citations.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold text-green-800 mb-2">Citations:</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {policyAdvice.citations.map((citation, idx) => (
                        <li key={idx} className="text-sm text-gray-600">{citation}</li>
                      ))}
                    </ul>
                  </div>
                )}
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
                <button
                  onClick={() => navigator.clipboard.writeText(grantEssay)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Copy Essay
                </button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <RiskMeter riskLevel={calculateRiskLevel()} billData={billData} />
            <ActionCards
              billData={billData}
              onWriteGrant={handleWriteGrant}
              policyAdvice={policyAdvice}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

