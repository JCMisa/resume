import type { Metadata } from "next";
import LegalPage from "@/components/custom/legal/LegalPage";

// The ONE place internal services are named: privacy law requires listing who
// processes user data. Keep this list in sync when adding or removing a service.

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What ResuMe collects, why, who processes it, and how to delete it.",
  alternates: { canonical: "/privacy" },
};

const PROCESSORS: { name: string; purpose: string }[] = [
  { name: "Clerk", purpose: "sign-in, account management and subscription billing" },
  { name: "Stripe (through Clerk Billing)", purpose: "payment processing; we never see or store your card number" },
  { name: "Google (Gemini API)", purpose: "the AI that analyzes, writes, tailors and grades (it receives the text it needs for each request)" },
  {
    name: "Vapi, with the speech-recognition and voice providers it uses",
    purpose: "voice mock interviews (your voice is streamed during the call and turned into a transcript)",
  },
  { name: "Cloudinary", purpose: "storing the resume files you upload" },
  { name: "Neon", purpose: "our database" },
  { name: "Vercel", purpose: "hosting the website" },
  { name: "Arcjet", purpose: "security, bot protection and rate limiting (uses your IP address)" },
  { name: "Your browser's push service (Google, Apple or Mozilla)", purpose: "delivering device notifications, only if you turn them on" },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={
        <p>
          ResuMe helps you tailor, check and build resumes and practise interviews. This page explains, in plain
          language, what we collect, why, who helps us process it and how to delete it. In short: we use your data to
          run ResuMe for you. We don&apos;t sell it and we don&apos;t show ads.
        </p>
      }
    >
      <section>
        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Account details:</strong> your name, email address, profile photo and how you sign in. Passwords
            are handled by our sign-in provider; we never see them.
          </li>
          <li>
            <strong>Resumes and job posts:</strong> resumes you upload or build (including the original PDF file), job
            descriptions you paste, and the reports, matches and tailored versions we create from them.
          </li>
          <li>
            <strong>Mock interviews:</strong> the role you practise for, the resume text you add, the transcript of
            the conversation and your scores. Your voice is streamed to our voice provider during the call.
          </li>
          <li>
            <strong>Usage records:</strong> which features you used and when, so we can apply plan limits.
          </li>
          <li>
            <strong>Settings:</strong> theme, notification preferences and, if you turn on device notifications, your
            browser&apos;s push subscription.
          </li>
          <li>
            <strong>Billing status:</strong> whether you&apos;re on Free or Pro. Payments are handled by our payment
            provider.
          </li>
          <li>
            <strong>Technical data:</strong> IP address and browser details, used for security, abuse prevention and
            hosting logs.
          </li>
          <li>
            <strong>Shared links:</strong> if you share a resume, we count how many times the link is opened. We
            don&apos;t record who opened it.
          </li>
        </ul>
      </section>

      <section>
        <h2>How we use it</h2>
        <ul>
          <li>To provide ResuMe: analyzing, tailoring and building resumes, running interviews and saving your work.</li>
          <li>To apply plan limits and process subscriptions.</li>
          <li>To keep the service secure and prevent abuse.</li>
          <li>To send the in-app and device notifications you choose.</li>
        </ul>
        <p>
          We don&apos;t sell your data, we don&apos;t use it for advertising, and we don&apos;t train our own AI
          models on it.
        </p>
      </section>

      <section>
        <h2>Who processes your data</h2>
        <p>We use these service providers to run ResuMe. Each receives only what it needs for its job:</p>
        <ul>
          {PROCESSORS.map((p) => (
            <li key={p.name}>
              <strong>{p.name}:</strong> {p.purpose}.
            </li>
          ))}
        </ul>
        <p>
          These providers may process data in the United States and other countries, under their own privacy terms.
          Our voice provider may keep a recording and transcript of interview calls for a limited time under its own
          retention policy.
        </p>
      </section>

      <section>
        <h2>Shared resumes</h2>
        <p>
          Public links are off by default. When you turn one on, anyone with the link can view that resume. Your phone
          number and address are hidden by default. You can turn a link off or replace it with a new one at any time,
          which stops the old link working.
        </p>
      </section>

      <section>
        <h2>How long we keep it, and deleting it</h2>
        <ul>
          <li>We keep your data while your account is open.</li>
          <li>You can delete any resume at any time; its uploaded file is deleted too.</li>
          <li>Notifications are deleted automatically after 90 days.</li>
          <li>Version history keeps the most recent 50 versions of each resume.</li>
          <li>
            <strong>Deleting your account</strong> (Settings → Security) deletes your resumes, uploaded files,
            interviews, reports and settings from our systems. Service providers may keep backups or logs for a limited
            time under their own policies.
          </li>
        </ul>
      </section>

      <section>
        <h2>Cookies and local storage</h2>
        <p>
          We use only the cookies needed to keep you signed in and secure, and your browser&apos;s local storage for
          preferences such as your theme. We don&apos;t use advertising or third-party tracking cookies.
        </p>
      </section>

      <section>
        <h2>Your choices and rights</h2>
        <p>
          You can view, edit and delete your resumes and interviews in the app, change your notification settings, and
          delete your account. Depending on where you live, you may also have the right to request a copy of your data,
          correct it, or object to certain processing. Contact us and we&apos;ll help.
        </p>
      </section>

      <section>
        <h2>Security</h2>
        <p>
          Data is sent over encrypted connections (HTTPS). In the app, your resumes and interviews are visible only to
          your account; ResuMe administrators can see basic account details (such as name, email and plan) to run the
          service. No system is perfectly secure, so please use a strong password or sign-in method.
        </p>
      </section>

      <section>
        <h2>Children</h2>
        <p>ResuMe isn&apos;t meant for anyone under 16, and we don&apos;t knowingly collect their data.</p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          If we change this policy, we&apos;ll update the date at the top. For important changes, we&apos;ll also let
          you know in the app.
        </p>
      </section>
    </LegalPage>
  );
}
