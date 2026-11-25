import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/custom/legal/LegalPage";
import { FREE_LIMITS, PRO_LIMITS, PRO_PRICE_MONTHLY_USD } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The rules for using ResuMe, plans and billing, and what AI results can and can't promise.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro={
        <p>
          These terms are the agreement between you and ResuMe when you use the app. By creating an account or using
          ResuMe, you agree to them. Please also read our <Link href="/privacy">Privacy Policy</Link>.
        </p>
      }
    >
      <section>
        <h2>Your account</h2>
        <ul>
          <li>You must be at least 16 years old to use ResuMe.</li>
          <li>Keep your sign-in details safe. You&apos;re responsible for what happens in your account.</li>
          <li>Give accurate account information, and one person per account.</li>
        </ul>
      </section>

      <section>
        <h2>Your content</h2>
        <p>
          Your resumes, job posts and other content stay yours. You give us permission to store and process them only
          to provide ResuMe to you (for example, to analyze, tailor or share a resume when you ask). You confirm you
          have the right to upload what you upload.
        </p>
      </section>

      <section>
        <h2>AI results: please review them</h2>
        <ul>
          <li>
            ResuMe uses AI. Its suggestions, scores and rewritten text can be incomplete or wrong. Always review your
            resume before you send it.
          </li>
          <li>
            You&apos;re responsible for making sure everything on your resume is true. Our tailoring checks are designed
            to keep your facts unchanged, but you have the final say.
          </li>
          <li>
            ATS scores and interview scores are guidance, not guarantees. We can&apos;t promise interviews, job offers
            or how any employer&apos;s system will rank you.
          </li>
        </ul>
      </section>

      <section>
        <h2>Plans and billing</h2>
        <ul>
          <li>
            <strong>Free</strong> includes limited monthly use (for example {FREE_LIMITS.analyze} resume analyses a
            month) and {FREE_LIMITS.resume_tailor} tailored resumes to try. Limits are shown in the app and may change.
          </li>
          <li>
            <strong>Pro</strong> costs ${PRO_PRICE_MONTHLY_USD} (USD) a month, billed monthly in advance through our
            payment provider, and renews automatically until you cancel. Taxes may apply.
          </li>
          <li>
            Some Pro features have fair-use limits, such as {PRO_LIMITS.interview} mock interviews and{" "}
            {PRO_LIMITS.resume_tailor} tailored resumes a month.
          </li>
          <li>
            You can cancel anytime in Settings → Billing. You keep Pro until the end of the month you&apos;ve paid for.
            Payments aren&apos;t refunded for partial months, except where the law requires it.
          </li>
          <li>If we change the price, we&apos;ll tell you before it applies to your next renewal.</li>
        </ul>
      </section>

      <section>
        <h2>Fair use</h2>
        <p>Please don&apos;t:</p>
        <ul>
          <li>use ResuMe for anything illegal, or to create resumes meant to deceive employers;</li>
          <li>upload content you don&apos;t have the right to use, or someone else&apos;s personal data without permission;</li>
          <li>try to get around plan limits, overload the service, or access other people&apos;s accounts or data;</li>
          <li>scrape, copy or resell the service, or use automated tools to use it.</li>
        </ul>
        <p>We may limit or close accounts that break these rules.</p>
      </section>

      <section>
        <h2>Availability and changes</h2>
        <p>
          We work to keep ResuMe running smoothly, but it&apos;s provided &quot;as is&quot; and may sometimes be
          unavailable. We may add, change or remove features. If we make a big change that affects paid features,
          we&apos;ll let you know.
        </p>
      </section>

      <section>
        <h2>Ending your use</h2>
        <p>
          You can stop using ResuMe and delete your account at any time (Settings → Security). We may suspend or close
          an account that breaks these terms. If we close your account without a good reason, we&apos;ll refund any
          unused paid time.
        </p>
      </section>

      <section>
        <h2>Liability</h2>
        <p>
          To the extent the law allows, ResuMe isn&apos;t liable for indirect or consequential losses, such as a missed
          job opportunity, and our total liability is limited to what you paid us in the 12 months before the claim.
          Nothing in these terms limits rights you have under consumer protection law.
        </p>
      </section>

      <section>
        <h2>Changes to these terms</h2>
        <p>
          We may update these terms. We&apos;ll change the date at the top and, for important changes, tell you in the
          app. If you keep using ResuMe after a change, the new terms apply.
        </p>
      </section>
    </LegalPage>
  );
}
