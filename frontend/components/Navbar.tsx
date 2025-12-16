"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  
  // Don't show navbar on dashboard (focused app experience)
  if (pathname === "/dashboard") {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-blue-600">ScholarShield</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="/#solution"
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
            >
              Features
            </a>
            <a
              href="/#mission"
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
            >
              Our Mission
            </a>
          </div>

          {/* Sign In Button */}
          <Link
            href="/login"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </nav>
  );
}

