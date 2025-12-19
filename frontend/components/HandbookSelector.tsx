"use client";

import { useState, useCallback } from "react";
import { Upload, Check, Building2, FileText } from "lucide-react";
import { apiClient } from "@/lib/api";

interface University {
  id: string;
  name: string;
  indexName: string;
}

const PRESET_UNIVERSITIES: University[] = [
  { id: "state-uni", name: "State University", indexName: "university-policies" },
  { id: "tech-institute", name: "Tech Institute", indexName: "university-policies" },
  { id: "liberal-arts", name: "Liberal Arts College", indexName: "university-policies" },
  { id: "community-college", name: "Community College", indexName: "university-policies" },
];

interface HandbookSelectorProps {
  onSelect: (universityId: string, indexName: string, universityName: string) => void;
  selectedUniversity: string | null;
}

export default function HandbookSelector({ onSelect, selectedUniversity }: HandbookSelectorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handlePresetSelect = (university: University) => {
    onSelect(university.id, university.indexName, university.name);
  };

  const handleCustomUpload = useCallback(async (file: File) => {
    if (file.type !== "application/pdf" && file.type !== "text/plain") {
      setUploadError("Please upload a PDF or text file");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const result = await apiClient.uploadHandbook(file);
      if (result.success) {
        setUploadSuccess(true);
        // Use the returned index name
        onSelect("custom", result.index_name, result.university_name || "Custom Handbook");
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        setUploadError(result.error || "Failed to upload handbook");
      }
    } catch (error: any) {
      setUploadError(error.message || "Failed to upload handbook");
    } finally {
      setIsUploading(false);
    }
  }, [onSelect]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleCustomUpload(file);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Select Your University Handbook</h2>
        <p className="text-gray-600">
          Choose from preset universities or upload your own handbook for personalized policy advice
        </p>
      </div>

      {/* Preset Universities */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Preset Universities
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRESET_UNIVERSITIES.map((university) => (
            <button
              key={university.id}
              onClick={() => handlePresetSelect(university)}
              className={`p-6 rounded-lg border-2 transition-all text-left ${
                selectedUniversity === university.id
                  ? "border-blue-500 bg-blue-50 shadow-md"
                  : "border-gray-200 hover:border-blue-300 hover:shadow-sm bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-800">{university.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">Using default policies</p>
                </div>
                {selectedUniversity === university.id && (
                  <Check className="w-6 h-6 text-blue-500" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">OR</span>
        </div>
      </div>

      {/* Custom Upload */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Upload Custom Handbook
        </h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            id="handbook-upload"
            accept=".pdf,.txt"
            onChange={handleFileChange}
            disabled={isUploading}
            className="hidden"
          />
          <label
            htmlFor="handbook-upload"
            className={`cursor-pointer flex flex-col items-center gap-4 ${
              isUploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <div className={`p-4 rounded-full ${uploadSuccess ? "bg-green-100" : "bg-blue-100"}`}>
              {uploadSuccess ? (
                <Check className="w-8 h-8 text-green-600" />
              ) : (
                <Upload className="w-8 h-8 text-blue-600" />
              )}
            </div>
            {isUploading ? (
              <div>
                <p className="text-gray-700 font-medium">Uploading handbook...</p>
                <p className="text-sm text-gray-500 mt-1">Processing your document</p>
              </div>
            ) : uploadSuccess ? (
              <div>
                <p className="text-green-700 font-medium">Handbook uploaded successfully!</p>
                <p className="text-sm text-gray-500 mt-1">Your custom policies are now active</p>
              </div>
            ) : (
              <div>
                <p className="text-gray-700 font-medium">Click to upload your handbook</p>
                <p className="text-sm text-gray-500 mt-1">PDF or text files accepted</p>
              </div>
            )}
          </label>
          {uploadError && (
            <p className="text-red-600 text-sm mt-4">{uploadError}</p>
          )}
        </div>
      </div>
    </div>
  );
}

