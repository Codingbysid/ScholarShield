"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Shield, DollarSign, BookOpen, Languages, CheckCircle, ArrowRight } from "lucide-react";

export default function LandingPage() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
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
              className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Activate Shield
              <ArrowRight className="inline-block ml-2 w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-gray-600 mb-8 text-lg font-medium">
            Trusted by Students at
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            {[
              "State University",
              "Metro College",
              "City Tech",
              "Community College",
            ].map((university, index) => (
              <motion.div
                key={university}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="text-2xl font-bold text-gray-400 hover:text-gray-600 transition-colors"
              >
                {university}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* The Problem Grid */}
      <section id="problems" className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              The Challenges You Face
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              First-gen students navigate a complex system without guidance
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: DollarSign,
                title: "Unclaimed Aid",
                description: "$4.4 billion in Pell Grants go unclaimed every year. Students miss out because the process is overwhelming.",
                stat: "$4.4B Unclaimed",
                color: "text-green-600",
                bgColor: "bg-green-50",
              },
              {
                icon: BookOpen,
                title: "Confusing Policies",
                description: "University handbooks are 500+ pages of dense legalese. Finding the right policy feels impossible.",
                stat: "500+ Pages",
                color: "text-blue-600",
                bgColor: "bg-blue-50",
              },
              {
                icon: Languages,
                title: "Language Barriers",
                description: "Parents left in the dark. Technical terms and complex processes create communication gaps.",
                stat: "Lost in Translation",
                color: "text-purple-600",
                bgColor: "bg-purple-50",
              },
            ].map((problem, index) => {
              const Icon = problem.icon;
              return (
                <motion.div
                  key={problem.title}
                  {...fadeInUp}
                  transition={{ delay: index * 0.1 }}
                  className={`${problem.bgColor} rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow`}
                >
                  <Icon className={`w-12 h-12 ${problem.color} mb-4`} />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {problem.title}
                  </h3>
                  <p className="text-gray-700 mb-4 text-lg leading-relaxed">
                    {problem.description}
                  </p>
                  <div className={`text-xl font-bold ${problem.color}`}>
                    {problem.stat}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* The Solution - How It Works */}
      <section id="solution" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How ScholarShield Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple. Automated. Effective.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Scan Bill",
                description: "Upload your tuition bill. AI extracts all the details instantly.",
                icon: Shield,
              },
              {
                step: "2",
                title: "AI Negotiator",
                description: "Our AI searches university policies and drafts extension requests.",
                icon: CheckCircle,
              },
              {
                step: "3",
                title: "Grant Found",
                description: "Discover unclaimed grants and scholarships you qualify for.",
                icon: DollarSign,
              },
              {
                step: "4",
                title: "Family Updated",
                description: "Parents get a clear explanation in their native language.",
                icon: Languages,
              },
            ].map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.step}
                  {...fadeInUp}
                  transition={{ delay: index * 0.15 }}
                  className="text-center"
                >
                  <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="text-3xl font-bold text-blue-600 mb-2">
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
        </div>
      </section>

      {/* Mission Section */}
      <section id="mission" className="py-20 px-4 bg-gradient-to-br from-blue-600 to-green-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Our Mission
            </h2>
            <p className="text-xl md:text-2xl leading-relaxed mb-8">
              We don&apos;t just track debt; we automate the bureaucracy of survival
              for FGLI (First-Generation, Low-Income) students. Every student deserves
              a clear path to graduation, regardless of their family&apos;s financial knowledge.
            </p>
            <Link
              href="/login"
              className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
            >
              Get Started Today
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white text-xl font-bold mb-4">ScholarShield</h3>
              <p className="text-gray-400">
                Your AI Copilot for navigating financial aid and university bureaucracy.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#solution" className="hover:text-white transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#problems" className="hover:text-white transition-colors">
                    The Problem
                  </a>
                </li>
                <li>
                  <a href="/login" className="hover:text-white transition-colors">
                    Sign In
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#mission" className="hover:text-white transition-colors">
                    Our Mission
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ScholarShield. Built for Microsoft Imagine Cup.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
