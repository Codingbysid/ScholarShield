"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AccessibilityContextType {
  isDyslexicMode: boolean;
  toggleDyslexicMode: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [isDyslexicMode, setIsDyslexicMode] = useState(false);

  useEffect(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem("dyslexicMode");
    if (saved === "true") {
      setIsDyslexicMode(true);
      document.body.classList.add("dyslexic-font");
    }
  }, []);

  const toggleDyslexicMode = () => {
    const newValue = !isDyslexicMode;
    setIsDyslexicMode(newValue);
    
    // Toggle class on body
    if (newValue) {
      document.body.classList.add("dyslexic-font");
      localStorage.setItem("dyslexicMode", "true");
    } else {
      document.body.classList.remove("dyslexic-font");
      localStorage.setItem("dyslexicMode", "false");
    }
  };

  return (
    <AccessibilityContext.Provider value={{ isDyslexicMode, toggleDyslexicMode }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider");
  }
  return context;
}

