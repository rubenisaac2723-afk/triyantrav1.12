import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { Home } from "@/components/home";
import {
  AboutPage,
  ContactPage,
  HowItWorks,
  PlatformPage,
  ResourcesPage,
  ServicePage,
} from "@/components/pages";
import { LegalPage } from "@/components/legal-page";
import { Actions, Breadcrumb, FAQ, Hero } from "@/components/shared";
import { pageMeta, services } from "@/lib/content";
import { articles } from "@/lib/articles";
import { metadataFor, Schema } from "@/lib/seo";
export const dynamic = "force-dynamic";
const routes = new Set(Object.keys(pageMeta));
type Props = {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const path = "/" + ((await params).slug || []).join("/");
  if (routes.has(path)) return metadataFor(path);
  const article = articles.find((a) => "/resources/" + a.slug === path);
  if (article)
    return {
      title: article.title + " | TriYantra",
      description: article.answer,
      alternates: { canonical: path },
      openGraph: {
        title: article.title,
        description: article.answer,
        type: "article",
        images: ["/images/connected-workplace-hero.webp"],
      },
    };
  return {
    title: "Page not found | TriYantra",
    description: "Find the TriYantra service, platform or guide you need.",
    robots: { index: false, follow: true },
  };
}
export default async function Page({ params, searchParams }: Props) {
  const p = await params;
  const path = "/" + (p.slug || []).join("/");
  const service = services.find((s) => "/" + s.slug === path);
  const article = articles.find((a) => "/resources/" + a.slug === path);
  let page: React.ReactNode;
  let label = pageMeta[path]?.[0] || "";
  if (path === "/") page = <Home />;
  else if (service) {
    page = <ServicePage service={service} />;
    label = service.label;
  } else if (path === "/platform") page = <PlatformPage />;
  else if (path === "/how-it-works") page = <HowItWorks />;
  else if (path === "/about") page = <AboutPage />;
  else if (path === "/resources") page = <ResourcesPage />;
  else if (path === "/contact")
    page = <ContactPage query={await searchParams} />;
  else if (path === "/book-a-demo") {
    permanentRedirect("/contact");
  } else if (path === "/it-asset-management") {
    permanentRedirect("/platform");
  } else if (path === "/privacy-policy") {
    permanentRedirect("/privacy");
  } else if (path === "/terms-conditions") {
    permanentRedirect("/terms");
  } else if (
    path === "/privacy" ||
    path === "/terms" ||
    path === "/refund-policy" ||
    path === "/shipping-policy" ||
    path === "/accessibility-statement" ||
    path === "/compliance"
  ) {
    page = <LegalPage slug={path.slice(1)} />;
  } else if (article) {
    label = article.title;
    page = (
      <>
        <Breadcrumb
          label={article.title}
          parent={{ label: "Resources", href: "/resources" }}
        />
        <Hero
          eyebrow={article.category + " / Practical guide"}
          title={article.title}
          intro={article.answer}
        />
        <article className="article-body">
          {article.sections.map(([h, p]) => (
            <section key={h}>
              <h2>{h}</h2>
              <p>{p}</p>
            </section>
          ))}
          <section>
            <h2>Your discussion checklist</h2>
            <ul>
              {article.checklist.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2>A common question</h2>
            <FAQ items={[article.faq]} />
          </section>
          <div className="article-callout">
            <h2>Put the guide into practice.</h2>
            <p>
              Explore{" "}
              <Link
                className="text-link"
                href={
                  article.service === "platform"
                    ? "/platform"
                    : "/" + article.service
                }
              >
                {article.service === "platform"
                  ? "Workplace Technology Platform"
                  : services.find((s) => s.slug === article.service)?.label}
              </Link>{" "}
              or share your requirement with TriYantra.
            </p>
            <Actions />
          </div>
          <p className="muted">
            This is general operational guidance. Specific availability,
            commercial terms and service scope are confirmed in a proposal.
          </p>
        </article>
      </>
    );
  } else notFound();
  await headers();
  return (
    <>
      <Schema path={path} label={label} />
      {page}
    </>
  );
}
