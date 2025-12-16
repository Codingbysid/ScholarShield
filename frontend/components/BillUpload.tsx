"use client";

import { useCallback, useState } from "react";
import { Upload, FileText } from "lucide-react";

interface BillUploadProps {
  onFileUpload: (file: File) => void;
  isAnalyzing: boolean;
}

export default function BillUpload({ onFileUpload, isAnalyzing }: BillUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === "application/pdf");
    
    if (pdfFile) {
      onFileUpload(pdfFile);
    } else {
      alert("Please upload a PDF file");
    }
  }, [onFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === "application/pdf") {
        onFileUpload(file);
      } else {
        alert("Please upload a PDF file");
      }
    }
  }, [onFileUpload]);

  return (
    <div
      className={`bg-white rounded-lg shadow-md p-8 border-2 border-dashed transition-colors ${
        isDragging
          ? "border-blue-500 bg-blue-50"
          : "border-gray-300 hover:border-blue-400"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center text-center">
        {isAnalyzing ? (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-lg text-gray-700">Analyzing your bill...</p>
          </>
        ) : (
          <>
            <Upload className="w-16 h-16 text-blue-600 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Upload Tuition Bill
            </h2>
            <p className="text-gray-600 mb-4">
              Drag and drop your PDF bill here, or click to browse
            </p>
            <label className="cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Select PDF File
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </>
        )}
      </div>
    </div>
  );
}

