import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import { Header } from "@/components/header";
import { Logo } from "@/components/shared";
import { AnimatedArrow } from "@/components/animated-arrow";
import { FollowUs } from "@/components/follow-us";
import { Analytics } from "@/components/analytics";
import { ScrollReveal } from "@/components/appearance";
import { BrandIntro } from "@/components/brand-intro";
import { services } from "@/lib/content";
import { hasCanonicalOrigin, siteUrl } from "@/lib/site-url";
import "./globals.css";
import "lenis/dist/lenis.css";
import "./premium.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "TriYantra | Workplace Technology & Device-as-a-Service",
  description:
    "Rent. Procure. Manage. One connected workplace technology ecosystem.",
  robots: hasCanonicalOrigin
    ? { index: true, follow: true }
    : { index: false, follow: false },
  icons: { icon: "/assets/brand/triyantra_official_logo.jpg" },
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = (await headers()).get("x-nonce") || undefined;
  return (
    <html
      lang="en-IN"
      suppressHydrationWarning
      className={inter.variable}
      data-scroll-behavior="smooth"
    >
      <body id="top" suppressHydrationWarning>
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(()=>{let h=document.documentElement;h.dataset.theme='light';h.dataset.themePreference='light';h.style.colorScheme='light';let i='skip';try{let c=navigator.connection,s=sessionStorage.getItem('triyantra-intro-v1.2');if(location.pathname==='/'&&!s&&!c?.saveData&&!matchMedia('(prefers-reduced-motion:reduce)').matches){sessionStorage.setItem('triyantra-intro-v1.2','seen');i='play'}}catch{}h.dataset.intro=i;setTimeout(()=>{if(h.dataset.intro==='play'&&!document.querySelector('.brand-intro[data-hydrated="true"]')){h.dataset.intro='skip';window.dispatchEvent(new Event('triyantra:intro-complete'))}},6000)})()`,
          }}
        />
        <BrandIntro />
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Header />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <footer className="site-footer">
          <div className="wrap footer-shell">
            <div className="footer-grid">
              <div className="footer-brand">
                <Link href="/" aria-label="TriYantra home">
                  <Logo />
                </Link>
                <p>
                  Matrix DaaS Private Limited | Equipment Rental Services,
                  Device-as-a-Service for fast-growing teams.
                </p>
                <FollowUs compact />
              </div>
              <div className="footer-col">
                <strong>Solutions</strong>
                {services.map((s) => (
                  <Link key={s.slug} href={"/" + s.slug}>
                    {s.label}
                  </Link>
                ))}
              </div>
              <div className="footer-col">
                <strong>Explore</strong>
                <Link href="/platform">Platform</Link>
                <Link href="/how-it-works">How It Works</Link>
                <Link href="/resources">Resources</Link>
                <Link href="/about">About</Link>
              </div>
              <div className="footer-col">
                <strong>Legal & Policies</strong>
                <Link href="/shipping-policy">Shipping & Delivery Policy</Link>
                <Link href="/refund-policy">Refund & Cancellation Policy</Link>
                <Link href="/privacy">Privacy Policy</Link>
                <Link href="/terms">Terms & Conditions</Link>
                <Link href="/accessibility-statement">
                  Accessibility Statement
                </Link>
              </div>
              <div className="footer-col">
                <strong>Start a conversation</strong>
                <Link href="/contact" data-cta="Footer quote">
                  Get a Quote <AnimatedArrow direction="up-right" size="sm" />
                </Link>
                <Link href="/contact?type=Demo" data-cta="Footer demo">
                  Request a Demo <AnimatedArrow direction="right" size="sm" />
                </Link>
              </div>
            </div>
            <div className="footer-bottom">
              <span>
                © {new Date().getFullYear()} TriYantra. All Rights Reserved.
              </span>
              <a className="back-to-top" href="#top">
                Back to top ↑
              </a>
            </div>
          </div>
        </footer>
        <Analytics />
        <ScrollReveal />
      </body>
    </html>
  );
}
