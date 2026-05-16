"use client";

import { SignUp } from "@clerk/nextjs";
import Image from "next/image";
import { ShieldCheck, FileText, BrainCircuit } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

export default function SignUpPage() {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <Suspense
        fallback={
          <div className="h-screen w-full flex items-center justify-center">
            Loading...
          </div>
        }
      >
        <div className="flex items-center justify-center p-8 bg-white dark:bg-background order-2 lg:order-1">
          <div className="mx-auto flex w-full flex-col items-center justify-center space-y-6 sm:w-[450px]">
            <div className="flex flex-col space-y-2 text-center lg:hidden">
              <Image
                src="/logo.svg"
                alt="ResuMe Logo"
                width={48}
                height={48}
                className="mx-auto mb-2"
              />
              <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-white">
                Get Started with ResuMe
              </h1>
              <p className="text-sm text-stone-600 dark:text-muted-foreground">
                Create your account to transform your career with high-quality,
                ATS-friendly resumes
              </p>
            </div>

            <SignUp
              appearance={{
                elements: {
                  formButtonPrimary:
                    "bg-primary hover:bg-primary/90 text-sm normal-case shadow-sm",
                  card: "shadow-none border-none bg-transparent p-0",
                  socialButtonsBlockButton:
                    "border-input bg-white dark:bg-background hover:bg-accent hover:text-accent-foreground",
                  dividerLine: "bg-border",
                  dividerText:
                    "text-stone-600 dark:text-muted-foreground text-xs uppercase",
                  footer: "hidden",
                },
                options: {
                  logoImageUrl: "/logo.svg",
                  socialButtonsVariant: "blockButton",
                },
              }}
            />

            <p className="text-center text-xs text-stone-600 dark:text-muted-foreground">
              By continuing, you agree to our{" "}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </Suspense>

      {/* Branding Side (Features) */}
      <div className="relative hidden flex-col bg-stone-100 dark:bg-stone-950 p-10 lg:flex order-1 lg:order-2">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

        {/* Logo Section */}
        <div className="relative z-20 flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt="ResuMe Logo"
            width={32}
            height={32}
            priority
          />
          <span className="text-xl font-bold tracking-tight font-heading text-stone-900 dark:text-white">
            ResuMe
          </span>
        </div>

        {/* Feature Cards */}
        <div className="relative z-20 mt-auto space-y-8">
          <div className="space-y-6">
            <div className="group flex items-start gap-4 p-4 rounded-xl transition-colors hover:bg-stone-200 dark:hover:bg-white/5">
              <div className="mt-1 rounded-lg bg-primary/10 p-2.5">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-stone-900 dark:text-white">
                  Secure Resume Management
                </h4>
                <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                  Your resumes are safely stored and intelligently organized,
                  ensuring privacy and reliability at every step of your career
                  journey.
                </p>
              </div>
            </div>

            <div className="group flex items-start gap-4 p-4 rounded-xl transition-colors hover:bg-stone-200 dark:hover:bg-white/5">
              <div className="mt-1 rounded-lg bg-primary/10 p-2.5">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-stone-900 dark:text-white">
                  ATS-Friendly Optimization
                </h4>
                <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                  ResuMe ensures your resumes are high-fidelity and tailored to
                  pass Applicant Tracking Systems with ease.
                </p>
              </div>
            </div>

            <div className="group flex items-start gap-4 p-4 rounded-xl transition-colors hover:bg-stone-200 dark:hover:bg-white/5">
              <div className="mt-1 rounded-lg bg-primary/10 p-2.5">
                <BrainCircuit className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-stone-900 dark:text-white">
                  Intelligent Career Insights
                </h4>
                <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                  ResuMe helps you analyze and improve your resumes quickly,
                  giving you the edge to stand out in your job applications.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-stone-300 dark:border-white/10">
            <p className="text-xs text-stone-700 dark:text-stone-500 uppercase tracking-widest font-medium">
              Transform your career with ResuMe.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
