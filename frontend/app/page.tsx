"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Shield, DollarSign, TrendingDown, BookOpen, CheckCircle, ArrowRight } from "lucide-react";

export default function LandingPage() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  };

  const scrollReveal = {
    initial: { opacity: 0, y: 50 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 },
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 py-24 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Don&apos;t Let Bureaucracy
              <br />
              <span className="text-blue-600">Derail Your Degree</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-10 max-w-3xl mx-auto leading-relaxed">
              The AI Copilot for First-Gen Students that finds grants, negotiates tuition,
              and explains it all to your parents.
            </p>
            <Link
              href="/login"
              className="inline-block bg-blue-600 text-white px-10 py-5 rounded-lg text-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              aria-label="Get started with ScholarShield"
            >
              Get Started
              <ArrowRight className="inline-block ml-2 w-5 h-5" aria-hidden="true" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* The Crisis Grid */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            {...scrollReveal}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              The Crisis is Real
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              First-gen students face overwhelming barriers that shouldn&apos;t exist
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: DollarSign,
                stat: "$4.4 Billion",
                title: "Unclaimed Pell Grants",
                description: "Every year, billions in financial aid go unclaimed because the process is too complex for students to navigate alone.",
                color: "text-green-600",
                bgColor: "bg-green-50",
                borderColor: "border-green-200",
              },
              {
                icon: TrendingDown,
                stat: "39%",
                title: "Dropout Rate",
                description: "Nearly 4 in 10 first-generation students drop out due to financial stress and bureaucratic confusion.",
                color: "text-red-600",
                bgColor: "bg-red-50",
                borderColor: "border-red-200",
              },
              {
                icon: BookOpen,
                stat: "500+ Pages",
                title: "Handbook Complexity",
                description: "The average financial aid handbook is over 500 pages of dense legalese that overwhelms even the most determined students.",
                color: "text-purple-600",
                bgColor: "bg-purple-50",
                borderColor: "border-purple-200",
              },
            ].map((crisis, index) => {
              const Icon = crisis.icon;
              return (
                <motion.div
                  key={crisis.title}
                  {...scrollReveal}
                  transition={{ delay: index * 0.1 }}
                  className={`${crisis.bgColor} ${crisis.borderColor} border-2 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow`}
                >
                  <Icon className={`w-16 h-16 ${crisis.color} mb-4`} />
                  <div className={`text-5xl font-bold ${crisis.color} mb-3`}>
                    {crisis.stat}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {crisis.title}
                  </h3>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {crisis.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            {...scrollReveal}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How ScholarShield Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Four simple steps. Zero bureaucracy. Maximum results.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Scan Bill",
                description: "Upload your tuition bill. Our AI extracts every detail in seconds.",
                icon: Shield,
              },
              {
                step: "2",
                title: "AI Lawyer Checks Policy",
                description: "Automatically searches university handbooks to find extension policies and hardship clauses.",
                icon: BookOpen,
              },
              {
                step: "3",
                title: "Grant Found",
                description: "Discovers unclaimed grants and scholarships you qualify for based on your profile.",
                icon: DollarSign,
              },
              {
                step: "4",
                title: "Family Updated",
                description: "Parents get a clear, translated explanation in their native language with audio.",
                icon: CheckCircle,
              },
            ].map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.step}
                  {...scrollReveal}
                  transition={{ delay: index * 0.15 }}
                  className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow text-center"
                >
                  <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-10 h-10 text-blue-600" />
                  </div>
                  <div className="text-4xl font-bold text-blue-600 mb-3">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    {step.description}
                  </p>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            {...scrollReveal}
            className="text-center mt-12"
          >
            <Link
              href="/login"
              className="inline-block bg-blue-600 text-white px-10 py-5 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
            >
              Get Started Now
              <ArrowRight className="inline-block ml-2 w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-lg mb-4">
            Built for <span className="font-semibold text-white">Microsoft Imagine Cup 2026</span>
          </p>
          <p className="text-gray-400">
            &copy; 2024 ScholarShield. Automating the bureaucracy of survival for FGLI students.
          </p>
        </div>
      </footer>
    </div>
  );
}
