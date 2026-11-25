import type { Metadata } from "next";
import LandingPage from "@/components/custom/landing-page/LandingPage";
import { ThemeToggler } from "@/components/custom/ThemeToggler";
import { PRO_PRICE_MONTHLY_USD } from "@/lib/plans";
import { SITE_AUTHOR, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: SITE_TITLE },
  alternates: { canonical: "/" },
};

// Structured data for search engines (schema.org). Facts only: no ratings or
// review counts unless they are real.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      description: SITE_DESCRIPTION,
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#app`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      description: SITE_DESCRIPTION,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      creator: { "@type": "Person", name: SITE_AUTHOR },
      featureList: [
        "Tailor a resume to a job description",
        "ATS resume check with a score and checklist",
        "Resume builder with ATS-friendly templates",
        "AI writing help for summaries and bullet points",
        "Voice mock interviews with scored feedback",
      ],
      offers: [
        { "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD" },
        {
          "@type": "Offer",
          name: "Pro",
          price: String(PRO_PRICE_MONTHLY_USD),
          priceCurrency: "USD",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: String(PRO_PRICE_MONTHLY_USD),
            priceCurrency: "USD",
            unitCode: "MON",
            referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MON" },
          },
        },
      ],
    },
  ],
};

export default function Home() {
  return (
    <main className="relative">
      <script
        type="application/ld+json"
        // "<" escaped so text can never close the script tag
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <LandingPage />

      {/* solid backing so the button stays visible over dark sections in light mode */}
      <div className="fixed bottom-5 right-5 z-[999999] rounded-md bg-background shadow-md">
        <ThemeToggler />
      </div>
    </main>
  );
}
