"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, CheckCircle } from "lucide-react";
import MicrosoftLoginButton from "@/components/MicrosoftLoginButton";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      return;
    }
    
    // Show authentication spinner
    setIsAuthenticating(true);
    setShowSuccess(false);
    
    // Simulate SSO authentication delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // Show success checkmark briefly
    setIsAuthenticating(false);
    setShowSuccess(true);
    
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // Determine redirect based on email
    // If email includes "demo", use demo mode
    if (email.toLowerCase().includes("demo")) {
      router.push("/dashboard?demo=true");
    } else {
      router.push("/dashboard");
    }
  };

  const handleMicrosoftSignIn = async () => {
    // Same logic as regular sign in
    setIsAuthenticating(true);
    setShowSuccess(false);
    
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsAuthenticating(false);
    setShowSuccess(true);
    
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // Default to demo mode for Microsoft sign-in in demo
    router.push("/dashboard?demo=true");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sign in to ScholarShield
          </h1>
          <p className="text-gray-600">
            Your AI Copilot for financial aid
          </p>
        </div>

        {/* Microsoft Login Button */}
        <div className="mb-6">
          <MicrosoftLoginButton
            onClick={handleMicrosoftSignIn}
            disabled={isAuthenticating || showSuccess}
          />
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleSignIn} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              School Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isAuthenticating || showSuccess}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="student@university.edu"
            />
          </div>

          <button
            type="submit"
            disabled={isAuthenticating || showSuccess || !email.trim()}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isAuthenticating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Authenticating with State University SSO...
              </>
            ) : showSuccess ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Success! Redirecting...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Demo tip: Use an email with &quot;demo&quot; to see the full demo flow
          </p>
        </div>
      </motion.div>
    </div>
  );
}
