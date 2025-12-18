"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, User, LogOut, Eye } from "lucide-react";
import { useAccessibility } from "@/contexts/AccessibilityContext";

export default function Navbar() {
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard";
  const isLandingOrLogin = pathname === "/" || pathname === "/login";
  const { isDyslexicMode, toggleDyslexicMode } = useAccessibility();

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-blue-600">ScholarShield</span>
          </Link>

          {/* Dashboard View - Show Profile and Sign Out */}
          {isDashboard && (
            <div className="flex items-center gap-4">
              <button
                onClick={toggleDyslexicMode}
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors group"
                aria-label="Toggle accessibility mode"
                title="Accessibility Mode"
              >
                <Eye className={`w-6 h-6 ${isDyslexicMode ? "text-blue-600" : "text-gray-700"}`} />
                {isDyslexicMode && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full"></span>
                )}
                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Accessibility Mode
                </span>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <User className="w-6 h-6 text-gray-700" />
              </button>
              <Link
                href="/"
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </Link>
            </div>
          )}

          {/* Landing/Login View - Show Log In and Get Started */}
          {isLandingOrLogin && (
            <div className="flex items-center gap-4">
              <button
                onClick={toggleDyslexicMode}
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors group"
                aria-label="Toggle accessibility mode"
                title="Accessibility Mode"
              >
                <Eye className={`w-6 h-6 ${isDyslexicMode ? "text-blue-600" : "text-gray-700"}`} />
                {isDyslexicMode && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full"></span>
                )}
                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Accessibility Mode
                </span>
              </button>
              <Link
                href="/login"
                className="text-gray-700 hover:text-blue-600 font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/login"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Default View - Show basic nav for other pages */}
          {!isDashboard && !isLandingOrLogin && (
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
