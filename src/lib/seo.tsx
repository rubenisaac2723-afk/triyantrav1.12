import type { Metadata } from "next";
import { headers } from "next/headers";
import { pageMeta, services, faqs } from "./content";
import { articles } from "./articles";
import { siteUrl } from "./site-url";
export { siteUrl };
export function metadataFor(path: string): Metadata {
  const [title, description] = pageMeta[path];
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: "TriYantra",
      locale: "en_IN",
      type: "website",
      images: [
        {
          url: "/images/connected-workplace-hero.webp",
          width: 1536,
          height: 1024,
          alt: "Illustrative connected workplace technology",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/connected-workplace-hero.webp"],
    },
  };
}
export async function Schema({ path, label }: { path: string; label: string }) {
  const nonce = (await headers()).get("x-nonce") || undefined;
  const data: Record<string, unknown>[] = [
    {
      "@type": "Organization",
      "@id": siteUrl + "/#organization",
      name: "TriYantra",
      legalName: "Matrix DaaS Private Limited",
      url: siteUrl,
      logo: siteUrl + "/assets/brand/triyantra_official_logo.jpg",
      description:
        "Supplier-powered workplace technology procurement, rental, Device-as-a-Service and asset management.",
      telephone: "+91 91645 43111",
      email: "info@triyantra.com",
      address: {
        "@type": "PostalAddress",
        streetAddress:
          "1st floor, 36th Cross Rd, 36th main, 4th T Block East, Jayanagara 9th Block, Jayanagar",
        addressLocality: "Bengaluru",
        addressRegion: "Karnataka",
        postalCode: "560041",
        addressCountry: "IN",
      },
    },
    {
      "@type": "WebSite",
      "@id": siteUrl + "/#website",
      name: "TriYantra",
      url: siteUrl,
      publisher: { "@id": siteUrl + "/#organization" },
    },
  ];
  if (path === "/contact") {
    data.push({
      "@type": "ContactPage",
      "@id": siteUrl + "/contact#webpage",
      url: siteUrl + "/contact",
      name: "Contact TriYantra | Request a Proposal",
      description:
        "Contact TriYantra (Matrix DaaS Private Limited) for workplace hardware rental, DaaS and device fleet management in Bengaluru.",
      mainEntity: { "@id": siteUrl + "/#organization" },
    });
  }
  if (path !== "/")
    data.push({
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        { "@type": "ListItem", position: 2, name: label, item: siteUrl + path },
      ],
    });

  const service = services.find((s) => "/" + s.slug === path);
  if (service) {
    data.push({
      "@type": "Service",
      "@id": siteUrl + path + "#service",
      name: service.title,
      description: service.intro,
      provider: { "@id": siteUrl + "/#organization" },
      areaServed: { "@type": "Country", name: "India" },
      serviceType: service.type,
    });
  }

  const article = articles.find((a) => "/resources/" + a.slug === path);
  if (article) {
    data.push({
      "@type": "TechArticle",
      "@id": siteUrl + path + "#article",
      headline: article.title,
      description: article.answer,
      author: { "@id": siteUrl + "/#organization" },
      publisher: { "@id": siteUrl + "/#organization" },
      inLanguage: "en-IN",
    });
    if (article.faq) {
      data.push({
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: article.faq[0],
            acceptedAnswer: {
              "@type": "Answer",
              text: article.faq[1],
            },
          },
        ],
      });
    }
  }

  if (path === "/") {
    data.push({
      "@type": "FAQPage",
      mainEntity: faqs.map(([q, a]) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: {
          "@type": "Answer",
          text: a,
        },
      })),
    });
  }

  return (
    <script
      nonce={nonce}
      id={"schema-" + path.replace(/\//g, "-")}
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": data,
        }).replace(/</g, "\\u003c"),
      }}
    />
  );
}
